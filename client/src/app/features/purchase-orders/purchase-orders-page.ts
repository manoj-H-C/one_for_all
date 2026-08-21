import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PurchaseOrderService } from '../../core/services/purchase-order.service';
import { ToastService } from '../../core/state/toast.service';
import { ConfirmDialogService } from '../../shared/ui/confirm-dialog.service';
import { SupplyRequestResponse } from '../../core/models/inventory.model';
import { PURCHASE_ORDER_STATUSES, PurchaseOrderResponse, PurchaseOrderStatus } from '../../core/models/purchase-order.model';
import { ModalComponent } from '../../shared/ui/modal';
import { EmptyStateComponent } from '../../shared/ui/empty-state';
import { AvatarComponent } from '../../shared/ui/avatar';
import { IconComponent } from '../../shared/ui/icon';
import { colorFor, initialsFor } from '../../shared/util/color-hash';

interface OrderableGroup {
  projectId: string;
  projectName: string;
  requests: SupplyRequestResponse[];
}

@Component({
  selector: 'app-purchase-orders-page',
  imports: [FormsModule, DatePipe, ModalComponent, EmptyStateComponent, AvatarComponent, IconComponent],
  templateUrl: './purchase-orders-page.html',
})
export class PurchaseOrdersPageComponent implements OnInit {
  private readonly purchaseOrderService = inject(PurchaseOrderService);
  private readonly toast = inject(ToastService);
  private readonly confirmDialog = inject(ConfirmDialogService);

  readonly loading = signal(true);
  readonly orders = signal<PurchaseOrderResponse[]>([]);
  readonly statusFilter = signal<PurchaseOrderStatus | 'ALL'>('ALL');
  readonly actionBusyId = signal<string | null>(null);
  // per-order manual expand/collapse, XORed against the default (ORDERED
  // ones open since they're actionable, everything else collapsed since
  // it's just history) - see isExpanded.
  private readonly expandOverrides = signal<Set<string>>(new Set());

  protected readonly statuses: readonly PurchaseOrderStatus[] = PURCHASE_ORDER_STATUSES;
  protected readonly colorFor = colorFor;
  protected readonly initialsFor = initialsFor;

  readonly filteredOrders = computed(() => {
    const status = this.statusFilter();
    return status === 'ALL' ? this.orders() : this.orders().filter((o) => o.status === status);
  });

  readonly openOrderCount = computed(() => this.orders().filter((o) => o.status === 'ORDERED').length);
  readonly receivedOrderCount = computed(() => this.orders().filter((o) => o.status === 'RECEIVED').length);
  readonly lineItemCount = computed(() => this.orders().reduce((sum, o) => sum + o.lines.length, 0));

  // --- new order modal ---
  readonly newOrderModalOpen = signal(false);
  readonly orderableRequests = signal<SupplyRequestResponse[]>([]);
  readonly orderableLoading = signal(false);
  readonly selectedRequestIds = signal<Set<string>>(new Set());
  readonly vendorName = signal('');
  readonly orderNote = signal('');
  readonly creating = signal(false);

  readonly selectedRequests = computed(() => {
    const ids = this.selectedRequestIds();
    return this.orderableRequests().filter((r) => ids.has(r.id));
  });

  readonly selectedProjectCount = computed(() => new Set(this.selectedRequests().map((r) => r.projectId)).size);

  readonly allOrderableSelected = computed(
    () => this.orderableRequests().length > 0 && this.selectedRequestIds().size === this.orderableRequests().length,
  );

  /** Grouped by project so a bulk order spanning several sites/jobs is scannable at a glance instead of one long flat list. */
  readonly orderableByProject = computed<OrderableGroup[]>(() => {
    const groups = new Map<string, OrderableGroup>();
    for (const r of this.orderableRequests()) {
      const existing = groups.get(r.projectId);
      if (existing) existing.requests.push(r);
      else groups.set(r.projectId, { projectId: r.projectId, projectName: r.projectName, requests: [r] });
    }
    return [...groups.values()].sort((a, b) => a.projectName.localeCompare(b.projectName));
  });

  ngOnInit(): void {
    this.load();
  }

  private load(): void {
    this.loading.set(true);
    this.purchaseOrderService.list().subscribe({
      next: (orders) => {
        this.orders.set(orders);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.toast.error(err.message);
      },
    });
  }

  setStatusFilter(status: PurchaseOrderStatus | 'ALL'): void {
    this.statusFilter.set(status);
  }

  isExpanded(order: PurchaseOrderResponse): boolean {
    const overridden = this.expandOverrides().has(order.id);
    const defaultExpanded = order.status === 'ORDERED';
    return overridden ? !defaultExpanded : defaultExpanded;
  }

  toggleExpanded(orderId: string): void {
    this.expandOverrides.update((ids) => {
      const next = new Set(ids);
      if (next.has(orderId)) next.delete(orderId);
      else next.add(orderId);
      return next;
    });
  }

  openNewOrder(): void {
    this.vendorName.set('');
    this.orderNote.set('');
    this.selectedRequestIds.set(new Set());
    this.newOrderModalOpen.set(true);
    this.orderableLoading.set(true);
    this.purchaseOrderService.listOrderableRequests().subscribe({
      next: (requests) => {
        this.orderableRequests.set(requests);
        this.orderableLoading.set(false);
      },
      error: (err) => {
        this.orderableLoading.set(false);
        this.toast.error(err.message);
      },
    });
  }

  toggleRequest(requestId: string): void {
    this.selectedRequestIds.update((ids) => {
      const next = new Set(ids);
      if (next.has(requestId)) next.delete(requestId);
      else next.add(requestId);
      return next;
    });
  }

  isSelected(requestId: string): boolean {
    return this.selectedRequestIds().has(requestId);
  }

  toggleSelectAll(): void {
    this.selectedRequestIds.set(this.allOrderableSelected() ? new Set() : new Set(this.orderableRequests().map((r) => r.id)));
  }

  isGroupFullySelected(group: OrderableGroup): boolean {
    const ids = this.selectedRequestIds();
    return group.requests.every((r) => ids.has(r.id));
  }

  toggleGroup(group: OrderableGroup): void {
    const selectAll = !this.isGroupFullySelected(group);
    this.selectedRequestIds.update((ids) => {
      const next = new Set(ids);
      for (const r of group.requests) {
        if (selectAll) next.add(r.id);
        else next.delete(r.id);
      }
      return next;
    });
  }

  saveNewOrder(): void {
    const vendorName = this.vendorName().trim();
    const requestIds = [...this.selectedRequestIds()];
    if (!vendorName) {
      this.toast.error('Vendor name is required');
      return;
    }
    if (requestIds.length === 0) {
      this.toast.error('Select at least one request to include');
      return;
    }

    this.creating.set(true);
    this.purchaseOrderService.create({ vendorName, note: this.orderNote().trim() || null, requestIds }).subscribe({
      next: (order) => {
        this.creating.set(false);
        this.newOrderModalOpen.set(false);
        this.orders.update((list) => [order, ...list]);
        this.toast.success('Purchase order created');
      },
      error: (err) => {
        this.creating.set(false);
        this.toast.error(err.message);
      },
    });
  }

  async receiveOrder(order: PurchaseOrderResponse): Promise<void> {
    const confirmed = await this.confirmDialog.confirm(
      `Mark this order from ${order.vendorName} as received? This logs an allocation for every line item.`,
      { title: 'Receive purchase order', confirmLabel: 'Receive' },
    );
    if (!confirmed) return;

    this.actionBusyId.set(order.id);
    this.purchaseOrderService.receive(order.id).subscribe({
      next: (updated) => {
        this.actionBusyId.set(null);
        this.orders.update((list) => list.map((o) => (o.id === updated.id ? updated : o)));
        this.toast.success('Purchase order received');
      },
      error: (err) => {
        this.actionBusyId.set(null);
        this.toast.error(err.message);
      },
    });
  }

  async cancelOrder(order: PurchaseOrderResponse): Promise<void> {
    const confirmed = await this.confirmDialog.confirm(
      `Cancel this order from ${order.vendorName}? Its requests go back to "Approved" so they can be picked up by a future order.`,
      { title: 'Cancel purchase order', confirmLabel: 'Cancel order' },
    );
    if (!confirmed) return;

    this.actionBusyId.set(order.id);
    this.purchaseOrderService.cancel(order.id).subscribe({
      next: (updated) => {
        this.actionBusyId.set(null);
        this.orders.update((list) => list.map((o) => (o.id === updated.id ? updated : o)));
        this.toast.success('Purchase order cancelled');
      },
      error: (err) => {
        this.actionBusyId.set(null);
        this.toast.error(err.message);
      },
    });
  }
}
