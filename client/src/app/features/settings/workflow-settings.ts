import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { CdkDropList, CdkDrag, CdkDragHandle, CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { forkJoin } from 'rxjs';
import { WorkflowService } from '../../core/services/workflow.service';
import { CurrentProjectStore } from '../../core/state/current-project.store';
import { ProjectPermissionsService } from '../../core/state/project-permissions.service';
import { ToastService } from '../../core/state/toast.service';
import { ConfirmDialogService } from '../../shared/ui/confirm-dialog.service';
import { StatusCategoryResponse, WorkflowStatusResponse } from '../../core/models/workflow.model';
import { PERMISSION_CODE } from '../../core/models/role.model';
import { resolveProjectId } from '../../core/util/route.util';
import { IconComponent } from '../../shared/ui/icon';
import { StatusPillComponent } from '../../shared/ui/status-pill';
import { EmptyStateComponent } from '../../shared/ui/empty-state';
import { colorFor } from '../../shared/util/color-hash';

@Component({
  selector: 'app-workflow-settings',
  imports: [FormsModule, CdkDropList, CdkDrag, CdkDragHandle, IconComponent, StatusPillComponent, EmptyStateComponent],
  template: `
    <div class="mx-auto flex max-w-5xl flex-col gap-6 animate-fade-in">
      <div>
        <h1 class="text-2xl font-bold tracking-tight text-slate-900">Workflow</h1>
        <p class="mt-1 text-sm text-slate-500">
          {{ categories().length }} categor{{ categories().length === 1 ? 'y' : 'ies' }} ·
          {{ statuses().length }} status{{ statuses().length === 1 ? '' : 'es' }}
        </p>
      </div>

      @if (sortedStatuses().length > 0) {
        <div class="card p-5">
          <p class="mb-3 text-sm font-semibold text-slate-700">Pipeline preview</p>
          <div class="flex items-center gap-2 overflow-x-auto pb-1">
            @for (status of sortedStatuses(); track status.id; let last = $last) {
              <app-status-pill [name]="status.name" [seed]="status.categoryName" />
              @if (!last) {
                <app-icon name="chevron-right" [size]="14" class="shrink-0 text-slate-300" />
              }
            }
          </div>
        </div>
      }

      <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <!-- Status categories -->
        <div class="card p-5">
          <div class="mb-4 flex items-center gap-3">
            <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-600">
              <app-icon name="fields" [size]="17" />
            </span>
            <div class="min-w-0">
              <p class="text-sm font-semibold text-slate-800">Status categories</p>
              <p class="truncate text-xs text-slate-500">Groups statuses by meaning — to do, in progress, done.</p>
            </div>
          </div>

          <div class="flex flex-col gap-2">
            @for (cat of categories(); track cat.id) {
              <div
                class="group flex items-center gap-2.5 rounded-xl border border-transparent px-2.5 py-1.5 transition-colors hover:border-slate-200 hover:bg-slate-50/70"
              >
                <span class="h-2.5 w-2.5 shrink-0 rounded-full {{ colorFor(cat.name).dot }}"></span>
                <input
                  type="text"
                  class="input h-8 flex-1 border-transparent bg-transparent px-1.5 py-1 text-sm focus:border-slate-300 focus:bg-white"
                  [ngModel]="cat.name"
                  [disabled]="!canManage()"
                  (ngModelChange)="updateCategory(cat, { name: $event })"
                />
                @if (canManage()) {
                  <button
                    type="button"
                    class="shrink-0 rounded-lg p-1.5 text-slate-300 opacity-0 transition-all hover:bg-red-50 hover:text-red-600 group-hover:opacity-100"
                    title="Delete category"
                    (click)="removeCategory(cat)"
                  >
                    <app-icon name="trash" [size]="15" />
                  </button>
                }
              </div>
            } @empty {
              <app-empty-state icon="🗂️" title="No categories yet" />
            }
          </div>

          @if (canManage()) {
            <div class="mt-4 flex gap-2 border-t border-slate-100 pt-4">
              <input
                type="text"
                class="input"
                placeholder="New category name"
                [(ngModel)]="newCategoryName"
                (keyup.enter)="addCategory()"
              />
              <button type="button" class="btn-secondary shrink-0" [disabled]="!newCategoryName().trim()" (click)="addCategory()">
                <app-icon name="plus" [size]="16" />
                Add
              </button>
            </div>
          }
        </div>

        <!-- Workflow statuses -->
        <div class="card p-5">
          <div class="mb-4 flex items-center gap-3">
            <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sky-100 text-sky-600">
              <app-icon name="workflow" [size]="17" />
            </span>
            <div class="min-w-0">
              <p class="text-sm font-semibold text-slate-800">Workflow statuses</p>
              <p class="truncate text-xs text-slate-500">Drag to reorder — this is the order columns appear on the board.</p>
            </div>
          </div>

          <div class="flex flex-col gap-2" cdkDropList (cdkDropListDropped)="onStatusDrop($event)">
            @for (status of sortedStatuses(); track status.id) {
              <div
                cdkDrag
                [cdkDragDisabled]="!canManage()"
                class="group flex items-center gap-1.5 rounded-xl border border-transparent bg-white px-1.5 py-1.5 transition-colors hover:border-slate-200 hover:bg-slate-50/70"
              >
                @if (canManage()) {
                  <span
                    cdkDragHandle
                    class="flex shrink-0 cursor-grab items-center justify-center rounded-lg p-1 text-slate-300 transition-colors hover:bg-slate-100 hover:text-slate-500 active:cursor-grabbing"
                  >
                    <app-icon name="grip" [size]="15" />
                  </span>
                }
                <span class="h-2.5 w-2.5 shrink-0 rounded-full {{ colorFor(status.categoryName).dot }}"></span>
                <input
                  type="text"
                  class="input h-8 flex-1 border-transparent bg-transparent px-1.5 py-1 text-sm focus:border-slate-300 focus:bg-white"
                  [ngModel]="status.name"
                  [disabled]="!canManage()"
                  (ngModelChange)="updateStatus(status, { name: $event })"
                />
                <select
                  class="input h-8 w-36 shrink-0 py-1 text-sm"
                  [ngModel]="status.categoryId"
                  [disabled]="!canManage()"
                  (ngModelChange)="updateStatus(status, { categoryId: $event })"
                >
                  @for (cat of categories(); track cat.id) {
                    <option [value]="cat.id">{{ cat.name }}</option>
                  }
                </select>
                @if (canManage()) {
                  <button
                    type="button"
                    class="shrink-0 rounded-lg p-1.5 text-slate-300 opacity-0 transition-all hover:bg-red-50 hover:text-red-600 group-hover:opacity-100"
                    title="Delete status"
                    (click)="removeStatus(status)"
                  >
                    <app-icon name="trash" [size]="15" />
                  </button>
                }
              </div>
            } @empty {
              <app-empty-state icon="🔀" title="No statuses yet" />
            }
          </div>

          @if (canManage()) {
            <div class="mt-4 flex flex-col gap-2 border-t border-slate-100 pt-4 sm:flex-row">
              <input
                type="text"
                class="input flex-1"
                placeholder="New status name"
                [(ngModel)]="newStatusName"
                (keyup.enter)="addStatus()"
              />
              <select class="input w-full sm:w-36" [(ngModel)]="newStatusCategoryId">
                @for (cat of categories(); track cat.id) {
                  <option [value]="cat.id">{{ cat.name }}</option>
                }
              </select>
              <button
                type="button"
                class="btn-secondary shrink-0"
                [disabled]="!newStatusName().trim() || !newStatusCategoryId()"
                (click)="addStatus()"
              >
                <app-icon name="plus" [size]="16" />
                Add
              </button>
            </div>
          }
        </div>
      </div>
    </div>
  `,
})
export class WorkflowSettingsComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly workflowService = inject(WorkflowService);
  private readonly permissions = inject(ProjectPermissionsService);
  private readonly toast = inject(ToastService);
  private readonly confirmDialog = inject(ConfirmDialogService);
  readonly currentProjectStore = inject(CurrentProjectStore);

  protected readonly colorFor = colorFor;

  readonly projectId = resolveProjectId(this.route);
  readonly canManage = toSignal(this.permissions.has(this.projectId, PERMISSION_CODE.WORKFLOW_MANAGE), {
    initialValue: false,
  });

  readonly categories = signal<StatusCategoryResponse[]>([]);
  readonly statuses = signal<WorkflowStatusResponse[]>([]);
  readonly newCategoryName = signal('');
  readonly newStatusName = signal('');
  readonly newStatusCategoryId = signal('');

  readonly sortedStatuses = () => [...this.statuses()].sort((a, b) => a.sortOrder - b.sortOrder);

  ngOnInit(): void {
    forkJoin({
      categories: this.workflowService.listCategories(this.projectId),
      statuses: this.workflowService.listStatuses(this.projectId),
    }).subscribe(({ categories, statuses }) => {
      this.categories.set(categories);
      this.statuses.set(statuses);
      if (!this.newStatusCategoryId() && categories.length > 0) this.newStatusCategoryId.set(categories[0].id);
    });
  }

  addCategory(): void {
    const name = this.newCategoryName().trim();
    if (!name) return;
    this.workflowService.createCategory(this.projectId, { name }).subscribe({
      next: (cat) => {
        this.categories.update((list) => [...list, cat]);
        this.newCategoryName.set('');
      },
      error: (err) => this.toast.error(err.message),
    });
  }

  updateCategory(cat: StatusCategoryResponse, patch: { name?: string; description?: string }): void {
    this.workflowService.updateCategory(this.projectId, cat.id, patch).subscribe({
      next: (updated) => this.categories.update((list) => list.map((c) => (c.id === updated.id ? updated : c))),
      error: (err) => this.toast.error(err.message),
    });
  }

  async removeCategory(cat: StatusCategoryResponse): Promise<void> {
    const confirmed = await this.confirmDialog.confirm(`Delete category "${cat.name}"?`, { title: 'Delete category', confirmLabel: 'Delete' });
    if (!confirmed) return;
    this.workflowService.deleteCategory(this.projectId, cat.id).subscribe({
      next: () => this.categories.update((list) => list.filter((c) => c.id !== cat.id)),
      error: (err) => this.toast.error(err.message),
    });
  }

  addStatus(): void {
    const name = this.newStatusName().trim();
    if (!name || !this.newStatusCategoryId()) return;
    const nextSortOrder = this.statuses().length;
    this.workflowService
      .createStatus(this.projectId, { name, sortOrder: nextSortOrder, categoryId: this.newStatusCategoryId() })
      .subscribe({
        next: (status) => {
          this.statuses.update((list) => [...list, status]);
          this.newStatusName.set('');
        },
        error: (err) => this.toast.error(err.message),
      });
  }

  updateStatus(status: WorkflowStatusResponse, patch: { name?: string; sortOrder?: number; categoryId?: string }): void {
    this.workflowService.updateStatus(this.projectId, status.id, patch).subscribe({
      next: (updated) => this.statuses.update((list) => list.map((s) => (s.id === updated.id ? updated : s))),
      error: (err) => this.toast.error(err.message),
    });
  }

  onStatusDrop(event: CdkDragDrop<WorkflowStatusResponse[]>): void {
    if (event.previousIndex === event.currentIndex) return;
    const reordered = [...this.sortedStatuses()];
    moveItemInArray(reordered, event.previousIndex, event.currentIndex);

    // optimistic reorder so the drop feels instant, then persist whichever
    // rows actually moved (their sortOrder no longer matches their index).
    this.statuses.set(reordered.map((s, index) => ({ ...s, sortOrder: index })));
    reordered.forEach((status, index) => {
      if (status.sortOrder !== index) {
        this.workflowService.updateStatus(this.projectId, status.id, { sortOrder: index }).subscribe({
          error: (err) => this.toast.error(err.message),
        });
      }
    });
  }

  async removeStatus(status: WorkflowStatusResponse): Promise<void> {
    const confirmed = await this.confirmDialog.confirm(
      `Delete status "${status.name}"? This fails if any ${this.currentProjectStore.itemLabelSingular().toLowerCase()} is still on it.`,
      { title: 'Delete status', confirmLabel: 'Delete' },
    );
    if (!confirmed) return;
    this.workflowService.deleteStatus(this.projectId, status.id).subscribe({
      next: () => this.statuses.update((list) => list.filter((s) => s.id !== status.id)),
      error: (err) => this.toast.error(err.message),
    });
  }
}
