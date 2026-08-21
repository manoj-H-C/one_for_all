import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { forkJoin } from 'rxjs';
import { InventoryService } from '../../core/services/inventory.service';
import { AuthStore } from '../../core/state/auth-store';
import { CurrentProjectStore } from '../../core/state/current-project.store';
import { ProjectPermissionsService } from '../../core/state/project-permissions.service';
import { ToastService } from '../../core/state/toast.service';
import { ConfirmDialogService } from '../../shared/ui/confirm-dialog.service';
import {
  InventoryBalanceResponse,
  InventoryLocationResponse,
  InventoryMaterialResponse,
  InventoryMovementResponse,
  MOVEMENT_TYPES,
  MovementType,
  SUPPLY_REQUEST_STATUSES,
  SupplyRequestResponse,
  SupplyRequestStatus,
} from '../../core/models/inventory.model';
import { csvEscape, downloadCsv } from '../../shared/util/csv';
import { PERMISSION_CODE } from '../../core/models/role.model';
import { resolveProjectId } from '../../core/util/route.util';
import { ModalComponent } from '../../shared/ui/modal';
import { EmptyStateComponent } from '../../shared/ui/empty-state';
import { AvatarComponent } from '../../shared/ui/avatar';
import { IconComponent } from '../../shared/ui/icon';
import { colorForIndex } from '../../shared/util/color-hash';

type Tab = 'balances' | 'catalog' | 'requests';

const OPEN_REQUEST_STATUSES: readonly SupplyRequestStatus[] = ['PENDING', 'APPROVED', 'ORDERED'];

/** A material's balance summed across every location - the project-wide "how much do we actually have" number, since InventoryBalanceResponse is always scoped to one location. */
interface MaterialTotal {
  materialId: string;
  materialName: string;
  unit: string;
  allocated: number;
  used: number;
  returned: number;
  remaining: number;
}

@Component({
  selector: 'app-inventory-page',
  imports: [FormsModule, DatePipe, ModalComponent, EmptyStateComponent, AvatarComponent, IconComponent],
  templateUrl: './inventory-page.html',
})
export class InventoryPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly inventoryService = inject(InventoryService);
  private readonly permissions = inject(ProjectPermissionsService);
  private readonly toast = inject(ToastService);
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly authStore = inject(AuthStore);
  readonly currentProjectStore = inject(CurrentProjectStore);

  readonly projectId = resolveProjectId(this.route);
  readonly canManage = toSignal(this.permissions.has(this.projectId, PERMISSION_CODE.INVENTORY_MANAGE), {
    initialValue: false,
  });

  readonly loading = signal(true);
  readonly activeTab = signal<Tab>('balances');
  readonly locations = signal<InventoryLocationResponse[]>([]);
  readonly materials = signal<InventoryMaterialResponse[]>([]);
  readonly balances = signal<InventoryBalanceResponse[]>([]);
  // unfiltered - always every (material, location) row for the project,
  // regardless of the location filter applied to `balances` above. Exists
  // purely so materialTotals can give a real project-wide number instead of
  // one that silently changes depending on what's currently selected.
  private readonly allBalances = signal<InventoryBalanceResponse[]>([]);
  readonly recentMovements = signal<InventoryMovementResponse[]>([]);
  readonly totalMovementsCount = signal(0);
  readonly selectedLocationId = signal<string | null>(null);
  readonly materialSearch = signal('');
  readonly locationSearch = signal('');
  readonly lowStockOnly = signal(false);
  readonly exporting = signal(false);

  readonly supplyRequests = signal<SupplyRequestResponse[]>([]);
  // 'OPEN' (the default) means still-actionable - pending, approved, or
  // ordered - so the tab opens on what needs attention instead of every
  // fulfilled/rejected/cancelled request ever made. Filtering (status and
  // "only mine") is entirely client-side over the one full load from
  // loadAll() - the backend already scoped that load to everything this
  // user is allowed to see, so there's no need for a network round-trip
  // just to narrow it further, unlike most other filters that hit the
  // server (transfer/movement history, balances by location).
  readonly requestStatusFilter = signal<SupplyRequestStatus | 'ALL' | 'OPEN'>('OPEN');
  readonly requestMineOnly = signal(false);
  readonly requestActionBusyId = signal<string | null>(null);

  protected readonly colorForIndex = colorForIndex;
  protected readonly movementTypes: readonly MovementType[] = MOVEMENT_TYPES;
  protected readonly requestStatuses: readonly SupplyRequestStatus[] = SUPPLY_REQUEST_STATUSES;

  readonly currentUserId = computed(() => this.authStore.currentUser()?.id ?? null);

  readonly pendingRequestCount = computed(() => this.supplyRequests().filter((r) => r.status === 'PENDING').length);

  readonly filteredSupplyRequests = computed(() => {
    const filter = this.requestStatusFilter();
    const mineOnly = this.requestMineOnly();
    const userId = this.currentUserId();
    return this.supplyRequests().filter((r) => {
      if (mineOnly && r.requestedById !== userId) return false;
      if (filter === 'ALL') return true;
      if (filter === 'OPEN') return (OPEN_REQUEST_STATUSES as string[]).includes(r.status);
      return r.status === filter;
    });
  });

  readonly selectedLocationName = computed(
    () => this.locations().find((l) => l.id === this.selectedLocationId())?.name ?? null,
  );

  readonly filteredMaterials = computed(() => {
    const q = this.materialSearch().trim().toLowerCase();
    if (!q) return this.materials();
    return this.materials().filter((m) => m.name.toLowerCase().includes(q) || (m.sku ?? '').toLowerCase().includes(q));
  });

  /** One row per material, summed across every location it has any movement history at. */
  readonly materialTotals = computed<MaterialTotal[]>(() => {
    const byMaterial = new Map<string, MaterialTotal>();
    for (const b of this.allBalances()) {
      const existing = byMaterial.get(b.materialId);
      if (existing) {
        existing.allocated += b.allocated;
        existing.used += b.used;
        existing.returned += b.returned;
        existing.remaining += b.remaining;
      } else {
        byMaterial.set(b.materialId, {
          materialId: b.materialId,
          materialName: b.materialName,
          unit: b.unit,
          allocated: b.allocated,
          used: b.used,
          returned: b.returned,
          remaining: b.remaining,
        });
      }
    }
    return [...byMaterial.values()].sort((a, b) => a.materialName.localeCompare(b.materialName));
  });

  readonly filteredMaterialTotals = computed(() =>
    this.lowStockOnly() ? this.materialTotals().filter((t) => this.isLowStockTotal(t)) : this.materialTotals(),
  );

  readonly lowStockMaterialCount = computed(() => this.materialTotals().filter((t) => this.isLowStockTotal(t)).length);

  readonly filteredBalances = computed(() =>
    this.lowStockOnly() ? this.balances().filter((b) => this.isLowStock(b)) : this.balances(),
  );

  /** Flattened depth-first, each tagged with its indent depth - simpler and safer than a recursive tree component, and still reads as a clear hierarchy via indentation. */
  readonly sortedLocations = computed(() => {
    const byParent = new Map<string | null, InventoryLocationResponse[]>();
    for (const loc of this.locations()) {
      const key = loc.parentLocationId;
      const list = byParent.get(key);
      if (list) list.push(loc);
      else byParent.set(key, [loc]);
    }
    const result: { loc: InventoryLocationResponse; depth: number }[] = [];
    const visit = (parentId: string | null, depth: number) => {
      const children = [...(byParent.get(parentId) ?? [])].sort((a, b) => a.name.localeCompare(b.name));
      for (const child of children) {
        result.push({ loc: child, depth });
        visit(child.id, depth + 1);
      }
    };
    visit(null, 0);
    return result;
  });

  /** Substring match on name - a search this simple doesn't try to preserve ancestor context around a matched descendant, same tradeoff every other search box in the app makes. */
  readonly filteredSortedLocations = computed(() => {
    const q = this.locationSearch().trim().toLowerCase();
    if (!q) return this.sortedLocations();
    return this.sortedLocations().filter((entry) => entry.loc.name.toLowerCase().includes(q));
  });

  // --- location modal ---
  readonly locationModalOpen = signal(false);
  readonly editingLocation = signal<InventoryLocationResponse | null>(null);
  readonly locationParentId = signal<string | null>(null);
  readonly locationName = signal('');

  // --- material modal ---
  readonly materialModalOpen = signal(false);
  readonly editingMaterial = signal<InventoryMaterialResponse | null>(null);
  readonly materialName = signal('');
  readonly materialUnit = signal('');
  readonly materialSku = signal('');
  // string | number | null because Angular's number-input value accessor
  // hands back an actual number (or null when cleared) as soon as the field
  // is touched, regardless of this being initialized as a string - see
  // saveMaterial(), which normalizes this defensively rather than assuming
  // it's always a string.
  readonly materialThreshold = signal<string | number | null>('');
  readonly materialDescription = signal('');

  // --- movement modal ---
  readonly movementModalOpen = signal(false);
  readonly movementMaterialId = signal('');
  readonly movementLocationId = signal('');
  readonly movementType = signal<MovementType>('ALLOCATED');
  readonly movementQuantity = signal('');
  readonly movementNote = signal('');
  readonly movementSaving = signal(false);

  // --- transfer modal ---
  readonly transferModalOpen = signal(false);
  readonly transferMaterialId = signal('');
  readonly transferFromLocationId = signal('');
  readonly transferToLocationId = signal('');
  readonly transferQuantity = signal('');
  readonly transferNote = signal('');
  readonly transferSaving = signal(false);

  // --- history modal ---
  readonly historyModalOpen = signal(false);
  readonly historyTitle = signal('');
  readonly historyMovements = signal<InventoryMovementResponse[]>([]);
  readonly historyLoading = signal(false);

  // --- new supply request modal ---
  readonly newRequestModalOpen = signal(false);
  readonly newRequestMaterialId = signal('');
  readonly newRequestLocationId = signal('');
  readonly newRequestQuantity = signal('');
  readonly newRequestNote = signal('');
  readonly newRequestSaving = signal(false);

  // --- reject modal (the only decision that benefits from a free-text reason) ---
  readonly rejectModalOpen = signal(false);
  readonly rejectingRequest = signal<SupplyRequestResponse | null>(null);
  readonly rejectNote = signal('');

  ngOnInit(): void {
    this.loadAll();
  }

  private loadAll(): void {
    this.loading.set(true);
    forkJoin({
      locations: this.inventoryService.listLocations(this.projectId),
      materials: this.inventoryService.listMaterials(this.projectId),
      balances: this.inventoryService.listBalances(this.projectId),
      recentMovements: this.inventoryService.listMovements(this.projectId),
      supplyRequests: this.inventoryService.listSupplyRequests(this.projectId),
    }).subscribe(({ locations, materials, balances, recentMovements, supplyRequests }) => {
      this.locations.set(locations);
      this.materials.set(materials);
      this.balances.set(balances);
      this.allBalances.set(balances);
      this.totalMovementsCount.set(recentMovements.length);
      this.recentMovements.set(recentMovements.slice(0, 15));
      this.supplyRequests.set(supplyRequests);
      this.loading.set(false);
    });
  }

  private reloadTotals(): void {
    this.inventoryService.listBalances(this.projectId).subscribe((balances) => this.allBalances.set(balances));
  }

  private reloadRecentMovements(): void {
    this.inventoryService.listMovements(this.projectId).subscribe((movements) => {
      this.totalMovementsCount.set(movements.length);
      this.recentMovements.set(movements.slice(0, 15));
    });
  }

  selectLocation(id: string | null): void {
    this.selectedLocationId.set(id);
    this.inventoryService.listBalances(this.projectId, id ?? undefined).subscribe((balances) => this.balances.set(balances));
  }

  // --- locations ---
  openCreateLocation(parentId: string | null): void {
    this.editingLocation.set(null);
    this.locationParentId.set(parentId);
    this.locationName.set('');
    this.locationModalOpen.set(true);
  }

  openEditLocation(loc: InventoryLocationResponse): void {
    this.editingLocation.set(loc);
    this.locationParentId.set(loc.parentLocationId);
    this.locationName.set(loc.name);
    this.locationModalOpen.set(true);
  }

  saveLocation(): void {
    const name = this.locationName().trim();
    if (!name) {
      this.toast.error('Name is required');
      return;
    }
    const editing = this.editingLocation();
    if (editing) {
      this.inventoryService.updateLocation(this.projectId, editing.id, { name }).subscribe({
        next: (updated) => {
          this.locations.update((list) => list.map((l) => (l.id === updated.id ? updated : l)));
          this.locationModalOpen.set(false);
        },
        error: (err) => this.toast.error(err.message),
      });
      return;
    }
    this.inventoryService.createLocation(this.projectId, { name, parentLocationId: this.locationParentId() }).subscribe({
      next: (created) => {
        this.locations.update((list) => [...list, created]);
        this.locationModalOpen.set(false);
      },
      error: (err) => this.toast.error(err.message),
    });
  }

  async removeLocation(loc: InventoryLocationResponse): Promise<void> {
    const confirmed = await this.confirmDialog.confirm(`Delete location "${loc.name}"?`, {
      title: 'Delete location',
      confirmLabel: 'Delete',
    });
    if (!confirmed) return;
    this.inventoryService.deleteLocation(this.projectId, loc.id).subscribe({
      next: () => {
        this.locations.update((list) => list.filter((l) => l.id !== loc.id));
        if (this.selectedLocationId() === loc.id) this.selectLocation(null);
      },
      error: (err) => this.toast.error(err.message),
    });
  }

  // --- materials ---
  openCreateMaterial(): void {
    this.editingMaterial.set(null);
    this.materialName.set('');
    this.materialUnit.set('');
    this.materialSku.set('');
    this.materialThreshold.set('');
    this.materialDescription.set('');
    this.materialModalOpen.set(true);
  }

  openEditMaterial(mat: InventoryMaterialResponse): void {
    this.editingMaterial.set(mat);
    this.materialName.set(mat.name);
    this.materialUnit.set(mat.unit);
    this.materialSku.set(mat.sku ?? '');
    this.materialThreshold.set(mat.lowStockThreshold != null ? String(mat.lowStockThreshold) : '');
    this.materialDescription.set(mat.description ?? '');
    this.materialModalOpen.set(true);
  }

  saveMaterial(): void {
    const name = this.materialName().trim();
    const unit = this.materialUnit().trim();
    if (!name) {
      this.toast.error('Name is required');
      return;
    }
    if (!unit) {
      this.toast.error('Unit is required — e.g. "meters" or "bags"');
      return;
    }
    // normalize defensively - this can be a string, a number, or null
    // depending on whether/how the number input was touched, not just
    // whatever it was initialized as.
    const thresholdRaw = this.materialThreshold();
    const thresholdText = thresholdRaw == null ? '' : String(thresholdRaw).trim();
    const payload = {
      name,
      unit,
      sku: this.materialSku().trim() || null,
      lowStockThreshold: thresholdText ? Number(thresholdText) : null,
      description: this.materialDescription().trim() || null,
    };
    const editing = this.editingMaterial();
    if (editing) {
      this.inventoryService.updateMaterial(this.projectId, editing.id, payload).subscribe({
        next: (updated) => {
          this.materials.update((list) => list.map((m) => (m.id === updated.id ? updated : m)));
          this.materialModalOpen.set(false);
        },
        error: (err) => this.toast.error(err.message),
      });
      return;
    }
    this.inventoryService.createMaterial(this.projectId, payload).subscribe({
      next: (created) => {
        this.materials.update((list) => [...list, created]);
        this.materialModalOpen.set(false);
      },
      error: (err) => this.toast.error(err.message),
    });
  }

  async removeMaterial(mat: InventoryMaterialResponse): Promise<void> {
    const confirmed = await this.confirmDialog.confirm(`Delete "${mat.name}" from the catalog?`, {
      title: 'Delete material',
      confirmLabel: 'Delete',
    });
    if (!confirmed) return;
    this.inventoryService.deleteMaterial(this.projectId, mat.id).subscribe({
      next: () => this.materials.update((list) => list.filter((m) => m.id !== mat.id)),
      error: (err) => this.toast.error(err.message),
    });
  }

  // --- movements ---
  openLogMovement(): void {
    this.movementMaterialId.set(this.materials()[0]?.id ?? '');
    this.movementLocationId.set(this.selectedLocationId() ?? this.locations()[0]?.id ?? '');
    this.movementType.set('ALLOCATED');
    this.movementQuantity.set('');
    this.movementNote.set('');
    this.movementModalOpen.set(true);
  }

  saveMovement(): void {
    const materialId = this.movementMaterialId();
    const locationId = this.movementLocationId();
    const quantity = Number(this.movementQuantity());
    if (!materialId) {
      this.toast.error('Pick a material');
      return;
    }
    if (!locationId) {
      this.toast.error('Pick a location');
      return;
    }
    if (!quantity || quantity <= 0) {
      this.toast.error('Enter a quantity greater than 0');
      return;
    }

    this.movementSaving.set(true);
    this.inventoryService
      .createMovement(this.projectId, {
        materialId,
        locationId,
        quantity,
        type: this.movementType(),
        note: this.movementNote().trim() || null,
      })
      .subscribe({
        next: (movement) => {
          this.movementSaving.set(false);
          this.movementModalOpen.set(false);
          this.recentMovements.update((list) => [movement, ...list].slice(0, 15));
          this.totalMovementsCount.update((n) => n + 1);
          this.selectLocation(this.selectedLocationId());
          this.reloadTotals();
          this.toast.success('Movement logged');
        },
        error: (err) => {
          this.movementSaving.set(false);
          this.toast.error(err.message);
        },
      });
  }

  // --- transfer ---
  openTransfer(): void {
    const firstMaterial = this.materials()[0]?.id ?? '';
    const firstLocation = this.selectedLocationId() ?? this.locations()[0]?.id ?? '';
    const secondLocation = this.locations().find((l) => l.id !== firstLocation)?.id ?? '';
    this.transferMaterialId.set(firstMaterial);
    this.transferFromLocationId.set(firstLocation);
    this.transferToLocationId.set(secondLocation);
    this.transferQuantity.set('');
    this.transferNote.set('');
    this.transferModalOpen.set(true);
  }

  saveTransfer(): void {
    const materialId = this.transferMaterialId();
    const fromLocationId = this.transferFromLocationId();
    const toLocationId = this.transferToLocationId();
    const quantity = Number(this.transferQuantity());
    if (!materialId) {
      this.toast.error('Pick a material');
      return;
    }
    if (!fromLocationId || !toLocationId) {
      this.toast.error('Pick both a source and a destination location');
      return;
    }
    if (fromLocationId === toLocationId) {
      this.toast.error('Source and destination must be different locations');
      return;
    }
    if (!quantity || quantity <= 0) {
      this.toast.error('Enter a quantity greater than 0');
      return;
    }

    this.transferSaving.set(true);
    this.inventoryService
      .transferStock(this.projectId, {
        materialId,
        fromLocationId,
        toLocationId,
        quantity,
        note: this.transferNote().trim() || null,
      })
      .subscribe({
        next: (movements) => {
          this.transferSaving.set(false);
          this.transferModalOpen.set(false);
          this.recentMovements.update((list) => [...movements, ...list].slice(0, 15));
          this.totalMovementsCount.update((n) => n + movements.length);
          this.selectLocation(this.selectedLocationId());
          this.reloadTotals();
          this.toast.success('Stock transferred');
        },
        error: (err) => {
          this.transferSaving.set(false);
          this.toast.error(err.message);
        },
      });
  }

  // --- export ---
  exportMovementsCsv(): void {
    this.exporting.set(true);
    this.inventoryService.listMovements(this.projectId).subscribe({
      next: (movements) => {
        this.exporting.set(false);
        const header = 'date,type,material,quantity,unit,location,recorded_by,note\n';
        const body = movements
          .map((m) =>
            [
              m.recordedAt,
              m.type,
              csvEscape(m.materialName),
              m.quantity,
              csvEscape(m.unit),
              csvEscape(m.locationName),
              csvEscape(m.recordedByName),
              csvEscape(m.note ?? ''),
            ].join(','),
          )
          .join('\n');
        downloadCsv(header + body + '\n', `inventory-movements-${new Date().toISOString().slice(0, 10)}.csv`);
      },
      error: (err) => {
        this.exporting.set(false);
        this.toast.error(err.message);
      },
    });
  }

  isLowStock(balance: InventoryBalanceResponse): boolean {
    const material = this.materials().find((m) => m.id === balance.materialId);
    return material?.lowStockThreshold != null && balance.remaining <= material.lowStockThreshold;
  }

  isLowStockTotal(total: MaterialTotal): boolean {
    const material = this.materials().find((m) => m.id === total.materialId);
    return material?.lowStockThreshold != null && total.remaining <= material.lowStockThreshold;
  }

  // --- history ---
  openHistoryForBalance(balance: InventoryBalanceResponse): void {
    this.openHistory(balance.materialId, balance.locationId, `${balance.materialName} at ${balance.locationName}`);
  }

  openHistoryForTotal(total: MaterialTotal): void {
    this.openHistory(total.materialId, null, `${total.materialName} — all locations`);
  }

  private openHistory(materialId: string, locationId: string | null, title: string): void {
    this.historyTitle.set(title);
    this.historyMovements.set([]);
    this.historyLoading.set(true);
    this.historyModalOpen.set(true);
    this.inventoryService.listMovements(this.projectId, locationId ?? undefined, materialId).subscribe((movements) => {
      this.historyMovements.set(movements);
      this.historyLoading.set(false);
    });
  }

  // --- supply requests ---
  isMyRequest(request: SupplyRequestResponse): boolean {
    return request.requestedById === this.currentUserId();
  }

  canCancelRequest(request: SupplyRequestResponse): boolean {
    return (
      (request.status === 'PENDING' || request.status === 'APPROVED') &&
      (this.isMyRequest(request) || this.canManage())
    );
  }

  // materialId/locationId let a "Request more" shortcut (low stock, a
  // catalog card) open this pre-filled instead of making the person
  // re-pick a material they were just looking at.
  openNewRequest(materialId?: string, locationId?: string): void {
    this.newRequestMaterialId.set(materialId ?? this.materials()[0]?.id ?? '');
    this.newRequestLocationId.set(locationId ?? this.selectedLocationId() ?? this.locations()[0]?.id ?? '');
    this.newRequestQuantity.set('');
    this.newRequestNote.set('');
    this.newRequestModalOpen.set(true);
  }

  // true if this material (optionally at this exact location) already has a
  // request out that hasn't been resolved yet - used to swap a "Request"
  // shortcut for an "Already requested" tag instead of inviting a duplicate.
  hasOpenRequestFor(materialId: string, locationId?: string): boolean {
    return this.supplyRequests().some(
      (r) =>
        r.materialId === materialId &&
        (locationId === undefined || r.locationId === locationId) &&
        (OPEN_REQUEST_STATUSES as string[]).includes(r.status),
    );
  }

  saveNewRequest(): void {
    const materialId = this.newRequestMaterialId();
    const locationId = this.newRequestLocationId();
    const quantity = Number(this.newRequestQuantity());
    if (!materialId) {
      this.toast.error('Pick a material');
      return;
    }
    if (!locationId) {
      this.toast.error('Pick a location');
      return;
    }
    if (!quantity || quantity <= 0) {
      this.toast.error('Enter a quantity greater than 0');
      return;
    }

    this.newRequestSaving.set(true);
    this.inventoryService
      .createSupplyRequest(this.projectId, {
        materialId,
        locationId,
        quantity,
        note: this.newRequestNote().trim() || null,
      })
      .subscribe({
        next: (created) => {
          this.newRequestSaving.set(false);
          this.newRequestModalOpen.set(false);
          this.supplyRequests.update((list) => [created, ...list]);
          this.toast.success('Request submitted');
        },
        error: (err) => {
          this.newRequestSaving.set(false);
          this.toast.error(err.message);
        },
      });
  }

  approveRequest(request: SupplyRequestResponse): void {
    this.requestActionBusyId.set(request.id);
    this.inventoryService.approveSupplyRequest(this.projectId, request.id).subscribe({
      next: (updated) => {
        this.requestActionBusyId.set(null);
        this.supplyRequests.update((list) => list.map((r) => (r.id === updated.id ? updated : r)));
        this.toast.success('Request approved');
      },
      error: (err) => {
        this.requestActionBusyId.set(null);
        this.toast.error(err.message);
      },
    });
  }

  openReject(request: SupplyRequestResponse): void {
    this.rejectingRequest.set(request);
    this.rejectNote.set('');
    this.rejectModalOpen.set(true);
  }

  confirmReject(): void {
    const request = this.rejectingRequest();
    if (!request) return;
    this.requestActionBusyId.set(request.id);
    this.inventoryService.rejectSupplyRequest(this.projectId, request.id, { note: this.rejectNote().trim() || null }).subscribe({
      next: (updated) => {
        this.requestActionBusyId.set(null);
        this.rejectModalOpen.set(false);
        this.supplyRequests.update((list) => list.map((r) => (r.id === updated.id ? updated : r)));
        this.toast.success('Request rejected');
      },
      error: (err) => {
        this.requestActionBusyId.set(null);
        this.toast.error(err.message);
      },
    });
  }

  async fulfillRequest(request: SupplyRequestResponse): Promise<void> {
    const confirmed = await this.confirmDialog.confirm(
      `Log an allocation of ${request.quantity} ${request.unit} of "${request.materialName}" at ${request.locationName}?`,
      { title: 'Fulfill request', confirmLabel: 'Fulfill' },
    );
    if (!confirmed) return;

    this.requestActionBusyId.set(request.id);
    this.inventoryService.fulfillSupplyRequest(this.projectId, request.id).subscribe({
      next: (updated) => {
        this.requestActionBusyId.set(null);
        this.supplyRequests.update((list) => list.map((r) => (r.id === updated.id ? updated : r)));
        this.selectLocation(this.selectedLocationId());
        this.reloadTotals();
        this.reloadRecentMovements();
        this.toast.success('Request fulfilled');
      },
      error: (err) => {
        this.requestActionBusyId.set(null);
        this.toast.error(err.message);
      },
    });
  }

  async cancelRequest(request: SupplyRequestResponse): Promise<void> {
    const confirmed = await this.confirmDialog.confirm(`Cancel this request for "${request.materialName}"?`, {
      title: 'Cancel request',
      confirmLabel: 'Cancel request',
    });
    if (!confirmed) return;

    this.requestActionBusyId.set(request.id);
    this.inventoryService.cancelSupplyRequest(this.projectId, request.id).subscribe({
      next: (updated) => {
        this.requestActionBusyId.set(null);
        this.supplyRequests.update((list) => list.map((r) => (r.id === updated.id ? updated : r)));
        this.toast.success('Request cancelled');
      },
      error: (err) => {
        this.requestActionBusyId.set(null);
        this.toast.error(err.message);
      },
    });
  }
}
