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
import { IconComponent } from '../../shared/ui/icon';

@Component({
  selector: 'app-roles-settings',
  imports: [FormsModule, ModalComponent, PermissionChecklistComponent, IconComponent],
  template: `
    <div class="mx-auto max-w-4xl">
    <div class="mb-6 flex items-center justify-between">
      <div>
        <h1 class="text-[26px] font-bold tracking-tight text-slate-900">Roles &amp; permissions</h1>
        <p class="mt-0.5 text-sm text-slate-500">Define what each role can do in this project.</p>
      </div>
      @if (canManage()) {
        <button type="button" class="btn-primary" (click)="openCreate()">
          <app-icon name="plus" [size]="17" />
          New role
        </button>
      }
    </div>

    <div class="flex flex-col gap-3">
      @for (role of roles(); track role.id) {
        <div class="card p-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="font-medium text-slate-800">{{ role.name }}</p>
              @if (role.description) {
                <p class="text-sm text-slate-500">{{ role.description }}</p>
              }
              <p class="mt-1 text-xs text-slate-400">{{ role.permissionCodes.length }} permission(s)</p>
            </div>
            @if (canManage()) {
              <div class="flex gap-2">
                <button type="button" class="btn-secondary px-3 py-1.5" (click)="openEdit(role)">Edit</button>
                <button type="button" class="btn-danger px-3 py-1.5" (click)="remove(role)">Delete</button>
              </div>
            }
          </div>
        </div>
      }
    </div>

    <app-modal [open]="modalOpen()" [title]="editingRole() ? 'Edit role' : 'New role'" [width]="640" (closed)="modalOpen.set(false)">
      <div class="flex flex-col gap-4">
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="label">Name</label>
            <input type="text" class="input" [(ngModel)]="name" />
          </div>
          <div>
            <label class="label">Description</label>
            <input type="text" class="input" [(ngModel)]="description" />
          </div>
        </div>
        @if (editingRole()) {
          <div>
            <label class="label">Permissions</label>
            <app-permission-checklist [catalog]="catalog()" [(selected)]="selectedPermissions" />
          </div>
        } @else {
          <p class="text-xs text-slate-400">A new role starts with no permissions — add them after creating it.</p>
        }
        <div class="flex justify-end gap-2">
          <button type="button" class="btn-secondary" (click)="modalOpen.set(false)">Cancel</button>
          <button type="button" class="btn-primary" [disabled]="!name().trim() || saving()" (click)="save()">
            {{ saving() ? 'Saving…' : editingRole() ? 'Save changes' : 'Create role' }}
          </button>
        </div>
      </div>
    </app-modal>
    </div>
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

  ngOnInit(): void {
    forkJoin({
      roles: this.roleService.list(this.projectId),
      catalog: this.roleService.listPermissionCatalog(),
    }).subscribe(({ roles, catalog }) => {
      this.roles.set(roles);
      this.catalog.set(catalog);
    });
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
