import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { WorkItemTypeService } from '../../core/services/work-item-type.service';
import { CurrentProjectStore } from '../../core/state/current-project.store';
import { ProjectPermissionsService } from '../../core/state/project-permissions.service';
import { ToastService } from '../../core/state/toast.service';
import { ConfirmDialogService } from '../../shared/ui/confirm-dialog.service';
import { WorkItemTypeResponse } from '../../core/models/work-item-type.model';
import { PERMISSION_CODE } from '../../core/models/role.model';
import { resolveProjectId } from '../../core/util/route.util';
import { EmptyStateComponent } from '../../shared/ui/empty-state';
import { ModalComponent } from '../../shared/ui/modal';
import { IconComponent } from '../../shared/ui/icon';
import { colorForIndex } from '../../shared/util/color-hash';

@Component({
  selector: 'app-work-item-types-settings',
  imports: [FormsModule, EmptyStateComponent, ModalComponent, IconComponent],
  template: `
    <div class="mx-auto flex max-w-5xl flex-col gap-6 animate-fade-in">
      <div class="flex flex-wrap items-center justify-between gap-4">
        <div class="flex items-center gap-3.5">
          <span
            class="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-white"
            style="background: linear-gradient(135deg, #a78bfa, #22d3ee); box-shadow: 0 6px 16px -4px rgb(139 92 246 / 0.45)"
          >
            <app-icon name="tag" [size]="20" />
          </span>
          <div>
            <h1 class="text-[26px] font-bold tracking-tight text-slate-900">Types</h1>
            <p class="mt-0.5 text-sm text-slate-500">
              {{ types().length }} type{{ types().length === 1 ? '' : 's' }} · Optional categorization for
              {{ currentProjectStore.itemLabelPlural().toLowerCase() }}
            </p>
          </div>
        </div>
        @if (canManage()) {
          <button type="button" class="btn-primary shrink-0" (click)="openCreate()">
            <app-icon name="plus" [size]="17" />
            New type
          </button>
        }
      </div>

      @if (types().length === 0) {
        <app-empty-state
          icon="🏷️"
          title="No types yet"
          description="Add Bug, Task, Story — or whatever categories fit how your team works. Every type shows up as a colored badge right on the card."
        >
          @if (canManage()) {
            <button type="button" class="btn-primary mt-2" (click)="openCreate()">+ New type</button>
          }
        </app-empty-state>
      } @else {
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          @for (type of types(); track type.id; let i = $index) {
            <div class="card group flex flex-col gap-4 p-5">
              <div class="flex items-start justify-between gap-2">
                <div class="flex min-w-0 items-center gap-3">
                  <span class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl {{ colorForIndex(i).bg }} {{ colorForIndex(i).text }}">
                    <app-icon name="tag" [size]="18" />
                  </span>
                  <p class="truncate font-semibold text-slate-900">{{ type.name }}</p>
                </div>
                @if (canManage()) {
                  <div class="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity duration-150 group-hover:opacity-100">
                    <button type="button" class="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700" title="Edit type" (click)="openEdit(type)">
                      <app-icon name="edit" [size]="15" />
                    </button>
                    <button type="button" class="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600" title="Delete type" (click)="remove(type)">
                      <app-icon name="trash" [size]="15" />
                    </button>
                  </div>
                }
              </div>

              <div class="mt-auto flex items-center gap-1.5 border-t border-slate-100 pt-3.5">
                <span class="text-xs text-slate-400">On the card:</span>
                <span class="rounded-full px-2 py-0.5 text-[10px] font-semibold {{ colorForIndex(i).bg }} {{ colorForIndex(i).text }}">{{ type.name }}</span>
              </div>
            </div>
          }
        </div>
      }
    </div>

    <app-modal [open]="modalOpen()" [title]="editingType() ? 'Edit type' : 'New type'" [width]="420" (closed)="modalOpen.set(false)">
      <div class="flex flex-col gap-4">
        <div>
          <label class="label" for="typeName">Name</label>
          <input
            id="typeName"
            type="text"
            class="input"
            placeholder="Bug, Task, Story…"
            [(ngModel)]="name"
            (keyup.enter)="save()"
          />
        </div>

        <div class="flex items-center gap-2 rounded-xl bg-slate-50 px-3.5 py-3 text-sm">
          <span class="text-slate-500">Preview:</span>
          @if (name().trim()) {
            <span class="rounded-full px-2.5 py-1 text-xs font-semibold {{ previewColor().bg }} {{ previewColor().text }}">{{ name().trim() }}</span>
          } @else {
            <span class="text-slate-400">Type a name to see its badge</span>
          }
        </div>

        <div class="flex justify-end gap-2">
          <button type="button" class="btn-secondary" (click)="modalOpen.set(false)">Cancel</button>
          <button type="button" class="btn-primary" [disabled]="!name().trim() || saving()" (click)="save()">
            {{ saving() ? 'Saving…' : editingType() ? 'Save changes' : 'Create type' }}
          </button>
        </div>
      </div>
    </app-modal>
  `,
})
export class WorkItemTypesSettingsComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly workItemTypeService = inject(WorkItemTypeService);
  private readonly permissions = inject(ProjectPermissionsService);
  private readonly toast = inject(ToastService);
  private readonly confirmDialog = inject(ConfirmDialogService);
  readonly currentProjectStore = inject(CurrentProjectStore);

  readonly projectId = resolveProjectId(this.route);
  readonly canManage = toSignal(this.permissions.has(this.projectId, PERMISSION_CODE.WORKFLOW_MANAGE), {
    initialValue: false,
  });

  readonly types = signal<WorkItemTypeResponse[]>([]);
  readonly modalOpen = signal(false);
  readonly editingType = signal<WorkItemTypeResponse | null>(null);
  readonly saving = signal(false);
  readonly name = signal('');

  protected readonly colorForIndex = colorForIndex;
  protected readonly previewColor = () => {
    const editing = this.editingType();
    const index = editing ? this.types().findIndex((t) => t.id === editing.id) : this.types().length;
    return colorForIndex(index === -1 ? 0 : index);
  };

  ngOnInit(): void {
    this.workItemTypeService.list(this.projectId).subscribe((types) => this.types.set(types));
  }

  openCreate(): void {
    this.editingType.set(null);
    this.name.set('');
    this.modalOpen.set(true);
  }

  openEdit(type: WorkItemTypeResponse): void {
    this.editingType.set(type);
    this.name.set(type.name);
    this.modalOpen.set(true);
  }

  save(): void {
    const name = this.name().trim();
    if (!name) return;
    this.saving.set(true);
    const editing = this.editingType();

    if (!editing) {
      this.workItemTypeService.create(this.projectId, { name }).subscribe({
        next: (type) => {
          this.types.update((list) => [...list, type]);
          this.saving.set(false);
          this.modalOpen.set(false);
        },
        error: (err) => {
          this.saving.set(false);
          this.toast.error(err.message);
        },
      });
      return;
    }

    this.workItemTypeService.update(this.projectId, editing.id, { name }).subscribe({
      next: (updated) => {
        this.types.update((list) => list.map((t) => (t.id === updated.id ? updated : t)));
        this.saving.set(false);
        this.modalOpen.set(false);
      },
      error: (err) => {
        this.saving.set(false);
        this.toast.error(err.message);
      },
    });
  }

  async remove(type: WorkItemTypeResponse): Promise<void> {
    const confirmed = await this.confirmDialog.confirm(
      `Delete type "${type.name}"? ${this.currentProjectStore.itemLabelPlural()} using it fall back to no type.`,
      { title: 'Delete type', confirmLabel: 'Delete' },
    );
    if (!confirmed) return;
    this.workItemTypeService.delete(this.projectId, type.id).subscribe({
      next: () => this.types.update((list) => list.filter((t) => t.id !== type.id)),
      error: (err) => this.toast.error(err.message),
    });
  }
}
