import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { SprintService } from '../../core/services/sprint.service';
import { ProjectPermissionsService } from '../../core/state/project-permissions.service';
import { ToastService } from '../../core/state/toast.service';
import { ConfirmDialogService } from '../../shared/ui/confirm-dialog.service';
import { SprintResponse } from '../../core/models/sprint.model';
import { PERMISSION_CODE } from '../../core/models/role.model';
import { resolveProjectId } from '../../core/util/route.util';

@Component({
  selector: 'app-sprints-settings',
  imports: [FormsModule],
  template: `
    <div class="mx-auto max-w-3xl">
    <div class="mb-6">
      <h1 class="text-[26px] font-bold tracking-tight text-slate-900">Sprints</h1>
      <p class="mt-0.5 text-sm text-slate-500">
        Optional time-boxed iterations. Work items left unassigned to a sprint stay in the backlog.
      </p>
    </div>

    <div class="card p-5">
      <div class="flex flex-col gap-2">
        @for (sprint of sortedSprints(); track sprint.id) {
          <div class="flex flex-wrap items-center gap-2">
            <input
              type="text"
              class="input min-w-[140px] flex-1"
              [ngModel]="sprint.name"
              [disabled]="!canManage()"
              (ngModelChange)="updateSprint(sprint, { name: $event })"
            />
            <input
              type="date"
              class="input w-40"
              [ngModel]="sprint.startDate"
              [disabled]="!canManage()"
              (ngModelChange)="updateSprint(sprint, { startDate: $event || null })"
            />
            <input
              type="date"
              class="input w-40"
              [ngModel]="sprint.endDate"
              [disabled]="!canManage()"
              (ngModelChange)="updateSprint(sprint, { endDate: $event || null })"
            />
            @if (canManage()) {
              <button type="button" class="text-xs text-slate-400 hover:text-red-600" (click)="removeSprint(sprint)">✕</button>
            }
          </div>
        } @empty {
          <p class="text-sm text-slate-500">No sprints yet. Work items are all in the backlog.</p>
        }
      </div>

      @if (canManage()) {
        <div class="mt-4 flex flex-wrap gap-2">
          <input type="text" class="input min-w-[160px] flex-1" placeholder="New sprint name" [(ngModel)]="newSprintName" />
          <input type="date" class="input w-40" [(ngModel)]="newSprintStart" />
          <input type="date" class="input w-40" [(ngModel)]="newSprintEnd" />
          <button type="button" class="btn-secondary min-w-[80px]" [disabled]="!newSprintName().trim()" (click)="addSprint()">
            Add
          </button>
        </div>
      }
    </div>
    </div>
  `,
})
export class SprintsSettingsComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly sprintService = inject(SprintService);
  private readonly permissions = inject(ProjectPermissionsService);
  private readonly toast = inject(ToastService);
  private readonly confirmDialog = inject(ConfirmDialogService);

  readonly projectId = resolveProjectId(this.route);
  readonly canManage = toSignal(this.permissions.has(this.projectId, PERMISSION_CODE.WORKFLOW_MANAGE), {
    initialValue: false,
  });

  readonly sprints = signal<SprintResponse[]>([]);
  readonly newSprintName = signal('');
  readonly newSprintStart = signal<string | null>(null);
  readonly newSprintEnd = signal<string | null>(null);

  readonly sortedSprints = () =>
    [...this.sprints()].sort((a, b) => (a.startDate ?? '').localeCompare(b.startDate ?? '') || a.createdAt.localeCompare(b.createdAt));

  ngOnInit(): void {
    this.sprintService.list(this.projectId).subscribe((sprints) => this.sprints.set(sprints));
  }

  addSprint(): void {
    const name = this.newSprintName().trim();
    if (!name) return;
    this.sprintService
      .create(this.projectId, { name, startDate: this.newSprintStart(), endDate: this.newSprintEnd() })
      .subscribe({
        next: (sprint) => {
          this.sprints.update((list) => [...list, sprint]);
          this.newSprintName.set('');
          this.newSprintStart.set(null);
          this.newSprintEnd.set(null);
        },
        error: (err) => this.toast.error(err.message),
      });
  }

  updateSprint(sprint: SprintResponse, patch: { name?: string; startDate?: string | null; endDate?: string | null }): void {
    this.sprintService.update(this.projectId, sprint.id, patch).subscribe({
      next: (updated) => this.sprints.update((list) => list.map((s) => (s.id === updated.id ? updated : s))),
      error: (err) => this.toast.error(err.message),
    });
  }

  async removeSprint(sprint: SprintResponse): Promise<void> {
    const confirmed = await this.confirmDialog.confirm(
      `Delete sprint "${sprint.name}"? Work items on it move back to the backlog.`,
      { title: 'Delete sprint', confirmLabel: 'Delete' },
    );
    if (!confirmed) return;
    this.sprintService.delete(this.projectId, sprint.id).subscribe({
      next: () => this.sprints.update((list) => list.filter((s) => s.id !== sprint.id)),
      error: (err) => this.toast.error(err.message),
    });
  }
}
