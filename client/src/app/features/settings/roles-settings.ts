import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { forkJoin } from 'rxjs';
import { RoleService } from '../../core/services/role.service';
import { ProjectPermissionsService } from '../../core/state/project-permissions.service';
import { ToastService } from '../../core/state/toast.service';
import { ConfirmDialogService } from '../../shared/ui/confirm-dialog.service';
import { RoleResponse, PermissionResponse, PERMISSION_CODE } from '../../core/models/role.model';
import { resolveProjectId } from '../../core/util/route.util';
import { ModalComponent } from '../../shared/ui/modal';
import { PermissionChecklistComponent } from '../../shared/ui/permission-checklist';
import { EmptyStateComponent } from '../../shared/ui/empty-state';
import { IconComponent } from '../../shared/ui/icon';
import { colorFor } from '../../shared/util/color-hash';

@Component({
  selector: 'app-roles-settings',
  imports: [FormsModule, ModalComponent, PermissionChecklistComponent, EmptyStateComponent, IconComponent],
  template: `
    <div class="mx-auto flex max-w-5xl flex-col gap-6 animate-fade-in">
      <div class="flex flex-wrap items-center justify-between gap-4">
        <div class="flex items-center gap-3.5">
          <span
            class="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-white"
            style="background: linear-gradient(135deg, #a78bfa, #22d3ee); box-shadow: 0 6px 16px -4px rgb(139 92 246 / 0.45)"
          >
            <app-icon name="roles" [size]="20" />
          </span>
          <div>
            <h1 class="text-[26px] font-bold tracking-tight text-slate-900">Roles &amp; permissions</h1>
            <p class="mt-0.5 text-sm text-slate-500">
              {{ roles().length }} role{{ roles().length === 1 ? '' : 's' }} · {{ catalog().length }} permissions available
            </p>
          </div>
        </div>
        @if (canManage()) {
          <button type="button" class="btn-primary shrink-0" (click)="openCreate()">
            <app-icon name="plus" [size]="17" />
            New role
          </button>
        }
      </div>

      @if (roles().length === 0) {
        <app-empty-state icon="🛡️" title="No roles yet" description="Create roles like Admin, Electrician, or Client Viewer to control who can do what.">
          @if (canManage()) {
            <button type="button" class="btn-primary mt-2" (click)="openCreate()">+ New role</button>
          }
        </app-empty-state>
      } @else {
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          @for (role of roles(); track role.id) {
            <div class="card group flex flex-col gap-4 p-5">
              <div class="flex items-start justify-between gap-2">
                <div class="flex min-w-0 items-center gap-3">
                  <span class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl {{ colorFor(role.name).bg }} {{ colorFor(role.name).text }}">
                    <app-icon name="roles" [size]="18" />
                  </span>
                  <div class="min-w-0">
                    <p class="truncate font-semibold text-slate-900">{{ role.name }}</p>
                    @if (role.description) {
                      <p class="truncate text-xs text-slate-500">{{ role.description }}</p>
                    } @else {
                      <p class="text-xs text-slate-400">No description</p>
                    }
                  </div>
                </div>
                @if (canManage()) {
                  <div class="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity duration-150 group-hover:opacity-100">
                    <button type="button" class="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700" title="Edit role" (click)="openEdit(role)">
                      <app-icon name="edit" [size]="15" />
                    </button>
                    <button type="button" class="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600" title="Delete role" (click)="remove(role)">
                      <app-icon name="trash" [size]="15" />
                    </button>
                  </div>
                }
              </div>

              <div class="mt-auto">
                <div class="mb-1.5 flex items-center justify-between text-xs">
                  <span class="font-medium text-slate-500">Permissions</span>
                  <span class="font-semibold text-slate-700">{{ role.permissionCodes.length }} / {{ catalog().length || '—' }}</span>
                </div>
                <div class="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                  <div class="h-full rounded-full transition-all duration-300 {{ colorFor(role.name).dot }}" [style.width.%]="coveragePercent(role)"></div>
                </div>
              </div>
            </div>
          }
        </div>
      }
    </div>

    <app-modal [open]="modalOpen()" [title]="editingRole() ? 'Edit role' : 'New role'" [width]="640" (closed)="modalOpen.set(false)">
      <div class="flex flex-col gap-4">
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label class="label">Name</label>
            <input type="text" class="input" placeholder="Electrician" [(ngModel)]="name" />
          </div>
          <div>
            <label class="label">Description</label>
            <input type="text" class="input" placeholder="Field crew, on-site work" [(ngModel)]="description" />
          </div>
        </div>
        @if (editingRole()) {
          <div>
            <div class="mb-2 flex items-center justify-between">
              <label class="label mb-0">Permissions</label>
              <span class="text-xs font-medium text-slate-400">{{ selectedPermissions().size }} / {{ catalog().length }} selected</span>
            </div>
            <div class="max-h-[360px] overflow-y-auto pr-1">
              <app-permission-checklist [catalog]="catalog()" [(selected)]="selectedPermissions" />
            </div>
          </div>
        } @else {
          <div class="flex items-start gap-2.5 rounded-xl bg-primary-50 px-3.5 py-3 text-xs text-primary-700">
            <app-icon name="sparkles" [size]="14" class="mt-0.5 shrink-0" />
            A new role starts with no permissions — add them right after creating it.
          </div>
        }
        <div class="flex justify-end gap-2">
          <button type="button" class="btn-secondary" (click)="modalOpen.set(false)">Cancel</button>
          <button type="button" class="btn-primary" [disabled]="!name().trim() || saving()" (click)="save()">
            {{ saving() ? 'Saving…' : editingRole() ? 'Save changes' : 'Create role' }}
          </button>
        </div>
      </div>
    </app-modal>
  `,
})
export class RolesSettingsComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly roleService = inject(RoleService);
  private readonly permissions = inject(ProjectPermissionsService);
  private readonly toast = inject(ToastService);
  private readonly confirmDialog = inject(ConfirmDialogService);

  readonly projectId = resolveProjectId(this.route);
  readonly canManage = toSignal(this.permissions.has(this.projectId, PERMISSION_CODE.ROLE_MANAGE), {
    initialValue: false,
  });

  readonly roles = signal<RoleResponse[]>([]);
  readonly catalog = signal<PermissionResponse[]>([]);
  readonly modalOpen = signal(false);
  readonly editingRole = signal<RoleResponse | null>(null);
  readonly saving = signal(false);

  readonly name = signal('');
  readonly description = signal('');
  readonly selectedPermissions = signal<Set<string>>(new Set());

  protected readonly colorFor = colorFor;

  ngOnInit(): void {
    forkJoin({
      roles: this.roleService.list(this.projectId),
      catalog: this.roleService.listPermissionCatalog(),
    }).subscribe(({ roles, catalog }) => {
      this.roles.set(roles);
      this.catalog.set(catalog);
    });
  }

  coveragePercent(role: RoleResponse): number {
    const total = this.catalog().length;
    if (total === 0) return 0;
    return Math.round((role.permissionCodes.length / total) * 100);
  }

  openCreate(): void {
    this.editingRole.set(null);
    this.name.set('');
    this.description.set('');
    this.selectedPermissions.set(new Set());
    this.modalOpen.set(true);
  }

  openEdit(role: RoleResponse): void {
    this.editingRole.set(role);
    this.name.set(role.name);
    this.description.set(role.description ?? '');
    this.selectedPermissions.set(new Set(role.permissionCodes));
    this.modalOpen.set(true);
  }

  save(): void {
    if (!this.name().trim()) return;
    this.saving.set(true);
    const editing = this.editingRole();

    if (!editing) {
      this.roleService.create(this.projectId, { name: this.name().trim(), description: this.description().trim() || null }).subscribe({
        next: (role) => {
          this.roles.update((list) => [...list, role]);
          this.saving.set(false);
          this.modalOpen.set(false);
          this.permissions.invalidate(this.projectId);
        },
        error: (err) => {
          this.saving.set(false);
          this.toast.error(err.message);
        },
      });
      return;
    }

    forkJoin({
      renamed: this.roleService.update(this.projectId, editing.id, {
        name: this.name().trim(),
        description: this.description().trim() || null,
      }),
      withPermissions: this.roleService.setPermissions(this.projectId, editing.id, {
        permissionCodes: [...this.selectedPermissions()],
      }),
    }).subscribe({
      next: ({ withPermissions }) => {
        this.roles.update((list) => list.map((r) => (r.id === withPermissions.id ? withPermissions : r)));
        this.saving.set(false);
        this.modalOpen.set(false);
        this.permissions.invalidate(this.projectId);
        this.toast.success('Role updated');
      },
      error: (err) => {
        this.saving.set(false);
        this.toast.error(err.message);
      },
    });
  }

  async remove(role: RoleResponse): Promise<void> {
    const confirmed = await this.confirmDialog.confirm(
      `Delete role "${role.name}"? This fails if any member still holds it.`,
      { title: 'Delete role', confirmLabel: 'Delete' },
    );
    if (!confirmed) return;
    this.roleService.delete(this.projectId, role.id).subscribe({
      next: () => this.roles.update((list) => list.filter((r) => r.id !== role.id)),
      error: (err) => this.toast.error(err.message),
    });
  }
}
