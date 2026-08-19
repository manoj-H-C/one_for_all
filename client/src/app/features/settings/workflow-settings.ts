import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { forkJoin } from 'rxjs';
import { WorkflowService } from '../../core/services/workflow.service';
import { ProjectPermissionsService } from '../../core/state/project-permissions.service';
import { ToastService } from '../../core/state/toast.service';
import { ConfirmDialogService } from '../../shared/ui/confirm-dialog.service';
import { StatusCategoryResponse, WorkflowStatusResponse } from '../../core/models/workflow.model';
import { PERMISSION_CODE } from '../../core/models/role.model';
import { resolveProjectId } from '../../core/util/route.util';

@Component({
  selector: 'app-workflow-settings',
  imports: [FormsModule],
  template: `
    <div class="mx-auto max-w-4xl">
    <div class="mb-6">
      <h1 class="text-[26px] font-bold tracking-tight text-slate-900">Workflow</h1>
      <p class="mt-0.5 text-sm text-slate-500">Configure the statuses and categories your board uses.</p>
    </div>

    <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <div class="card p-5">
        <h2 class="mb-3 font-medium text-slate-800">Status categories</h2>
        <div class="flex flex-col gap-2">
          @for (cat of categories(); track cat.id) {
            <div class="flex items-center gap-2">
              <input type="text" class="input" [ngModel]="cat.name" [disabled]="!canManage()" (ngModelChange)="updateCategory(cat, { name: $event })" />
              @if (canManage()) {
                <button type="button" class="text-xs text-slate-400 hover:text-red-600" (click)="removeCategory(cat)">✕</button>
              }
            </div>
          }
        </div>
        @if (canManage()) {
          <div class="mt-3 flex gap-2">
            <input type="text" class="input" placeholder="New category name" [(ngModel)]="newCategoryName" />
            <button type="button" class="btn-secondary" [disabled]="!newCategoryName().trim()" (click)="addCategory()">Add</button>
          </div>
        }
      </div>

      <div class="card p-5">
        <h2 class="mb-3 font-medium text-slate-800">Workflow statuses</h2>
        <div class="flex flex-col gap-2">
          @for (status of sortedStatuses(); track status.id) {
            <div class="flex items-center gap-2">
              <input
                type="number"
                class="input w-16"
                [ngModel]="status.sortOrder"
                [disabled]="!canManage()"
                (ngModelChange)="updateStatus(status, { sortOrder: +$event })"
              />
              <input type="text" class="input flex-1" [ngModel]="status.name" [disabled]="!canManage()" (ngModelChange)="updateStatus(status, { name: $event })" />
              <select class="input w-36" [ngModel]="status.categoryId" [disabled]="!canManage()" (ngModelChange)="updateStatus(status, { categoryId: $event })">
                @for (cat of categories(); track cat.id) {
                  <option [value]="cat.id">{{ cat.name }}</option>
                }
              </select>
              @if (canManage()) {
                <button type="button" class="text-xs text-slate-400 hover:text-red-600" (click)="removeStatus(status)">✕</button>
              }
            </div>
          }
        </div>
        @if (canManage()) {
          <div class="mt-3 flex flex-col gap-2 sm:flex-row">
            <input type="text" class="input" placeholder="New status name" [(ngModel)]="newStatusName" />
            <select class="input w-40" [(ngModel)]="newStatusCategoryId">
              @for (cat of categories(); track cat.id) {
                <option [value]="cat.id">{{ cat.name }}</option>
              }
            </select>
            <button type="button" class="btn-secondary" [disabled]="!newStatusName().trim() || !newStatusCategoryId()" (click)="addStatus()">
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

  async removeStatus(status: WorkflowStatusResponse): Promise<void> {
    const confirmed = await this.confirmDialog.confirm(
      `Delete status "${status.name}"? This fails if any work item is still on it.`,
      { title: 'Delete status', confirmLabel: 'Delete' },
    );
    if (!confirmed) return;
    this.workflowService.deleteStatus(this.projectId, status.id).subscribe({
      next: () => this.statuses.update((list) => list.filter((s) => s.id !== status.id)),
      error: (err) => this.toast.error(err.message),
    });
  }
}
