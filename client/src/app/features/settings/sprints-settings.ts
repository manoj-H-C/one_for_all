import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { SprintService } from '../../core/services/sprint.service';
import { CurrentProjectStore } from '../../core/state/current-project.store';
import { ProjectPermissionsService } from '../../core/state/project-permissions.service';
import { ToastService } from '../../core/state/toast.service';
import { ConfirmDialogService } from '../../shared/ui/confirm-dialog.service';
import { SprintResponse } from '../../core/models/sprint.model';
import { PERMISSION_CODE } from '../../core/models/role.model';
import { resolveProjectId } from '../../core/util/route.util';
import { ModalComponent } from '../../shared/ui/modal';
import { EmptyStateComponent } from '../../shared/ui/empty-state';
import { IconComponent } from '../../shared/ui/icon';
import { colorForIndex } from '../../shared/util/color-hash';

function formatDate(value: string | null): string | null {
  if (!value) return null;
  const date = new Date(`${value}T00:00:00`);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

@Component({
  selector: 'app-sprints-settings',
  imports: [FormsModule, ModalComponent, EmptyStateComponent, IconComponent],
  template: `
    <div class="mx-auto flex max-w-3xl flex-col gap-6 animate-fade-in">
      <div class="flex flex-wrap items-center justify-between gap-4">
        <div class="flex items-center gap-3.5">
          <span
            class="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-white"
            style="background: linear-gradient(135deg, #a78bfa, #22d3ee); box-shadow: 0 6px 16px -4px rgb(139 92 246 / 0.45)"
          >
            <app-icon name="calendar" [size]="20" />
          </span>
          <div>
            <h1 class="text-[26px] font-bold tracking-tight text-slate-900">{{ currentProjectStore.sprintLabelPlural() }}</h1>
            <p class="mt-0.5 text-sm text-slate-500">
              {{ sprints().length }} {{ (sprints().length === 1 ? currentProjectStore.sprintLabelSingular() : currentProjectStore.sprintLabelPlural()).toLowerCase() }}
              · optional time-boxed iterations
            </p>
          </div>
        </div>
        @if (canManage()) {
          <button type="button" class="btn-primary shrink-0" (click)="openCreate()">
            <app-icon name="plus" [size]="17" />
            New {{ currentProjectStore.sprintLabelSingular().toLowerCase() }}
          </button>
        }
      </div>

      @if (sortedSprints().length === 0) {
        <app-empty-state
          icon="🗓️"
          [title]="'No ' + currentProjectStore.sprintLabelPlural().toLowerCase() + ' yet'"
          [description]="currentProjectStore.itemLabelPlural() + ' are all in the backlog until you add one.'"
        >
          @if (canManage()) {
            <button type="button" class="btn-primary mt-2" (click)="openCreate()">+ New {{ currentProjectStore.sprintLabelSingular().toLowerCase() }}</button>
          }
        </app-empty-state>
      } @else {
        <div class="card divide-y divide-slate-100">
          @for (sprint of sortedSprints(); track sprint.id; let i = $index) {
            <div class="group flex items-center gap-3.5 p-4">
              <span class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl {{ colorForIndex(i).bg }} {{ colorForIndex(i).text }}">
                <app-icon name="calendar" [size]="18" />
              </span>
              <div class="min-w-0 flex-1">
                <p class="truncate font-semibold text-slate-900">{{ sprint.name }}</p>
                <p class="truncate text-xs text-slate-500">{{ dateRangeLabel(sprint) }}</p>
              </div>
              @if (canManage()) {
                <div class="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity duration-150 group-hover:opacity-100">
                  <button type="button" class="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700" [title]="'Edit ' + currentProjectStore.sprintLabelSingular().toLowerCase()" (click)="openEdit(sprint)">
                    <app-icon name="edit" [size]="15" />
                  </button>
                  <button type="button" class="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600" [title]="'Delete ' + currentProjectStore.sprintLabelSingular().toLowerCase()" (click)="remove(sprint)">
                    <app-icon name="trash" [size]="15" />
                  </button>
                </div>
              }
            </div>
          }
        </div>
      }
    </div>

    <app-modal
      [open]="modalOpen()"
      [title]="(editingSprint() ? 'Edit ' : 'New ') + currentProjectStore.sprintLabelSingular().toLowerCase()"
      [width]="480"
      (closed)="modalOpen.set(false)"
    >
      <div class="flex flex-col gap-4">
        <div>
          <label class="label" for="sprintName">Name</label>
          <input id="sprintName" type="text" class="input" placeholder="Q1 2026, Sprint 12…" [(ngModel)]="name" (keyup.enter)="save()" />
        </div>
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label class="label" for="startDate">Start date</label>
            <input id="startDate" type="date" class="input" [(ngModel)]="startDate" />
          </div>
          <div>
            <label class="label" for="endDate">End date</label>
            <input id="endDate" type="date" class="input" [(ngModel)]="endDate" />
          </div>
        </div>
        <p class="text-xs text-slate-400">Dates are optional — leave them blank for an open-ended {{ currentProjectStore.sprintLabelSingular().toLowerCase() }}.</p>

        <div class="mt-1 flex justify-end gap-2">
          <button type="button" class="btn-secondary" (click)="modalOpen.set(false)">Cancel</button>
          <button type="button" class="btn-primary" [disabled]="!name().trim() || saving()" (click)="save()">
            {{ saving() ? 'Saving…' : editingSprint() ? 'Save changes' : 'Create' }}
          </button>
        </div>
      </div>
    </app-modal>
  `,
})
export class SprintsSettingsComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly sprintService = inject(SprintService);
  private readonly permissions = inject(ProjectPermissionsService);
  private readonly toast = inject(ToastService);
  private readonly confirmDialog = inject(ConfirmDialogService);
  readonly currentProjectStore = inject(CurrentProjectStore);

  readonly projectId = resolveProjectId(this.route);
  readonly canManage = toSignal(this.permissions.has(this.projectId, PERMISSION_CODE.WORKFLOW_MANAGE), {
    initialValue: false,
  });

  readonly sprints = signal<SprintResponse[]>([]);
  readonly modalOpen = signal(false);
  readonly editingSprint = signal<SprintResponse | null>(null);
  readonly saving = signal(false);

  readonly name = signal('');
  readonly startDate = signal('');
  readonly endDate = signal('');

  protected readonly colorForIndex = colorForIndex;

  // newest-added first, regardless of the (optional) start date - a
  // just-created entry should show up where you'd expect to find it rather
  // than being sorted away by a date field that's often left blank.
  readonly sortedSprints = computed(() => [...this.sprints()].sort((a, b) => b.createdAt.localeCompare(a.createdAt)));

  ngOnInit(): void {
    this.sprintService.list(this.projectId).subscribe((sprints) => this.sprints.set(sprints));
  }

  dateRangeLabel(sprint: SprintResponse): string {
    const start = formatDate(sprint.startDate);
    const end = formatDate(sprint.endDate);
    if (start && end) return `${start} – ${end}`;
    if (start) return `From ${start}`;
    if (end) return `Until ${end}`;
    return 'No dates set';
  }

  openCreate(): void {
    this.editingSprint.set(null);
    this.name.set('');
    this.startDate.set('');
    this.endDate.set('');
    this.modalOpen.set(true);
  }

  openEdit(sprint: SprintResponse): void {
    this.editingSprint.set(sprint);
    this.name.set(sprint.name);
    this.startDate.set(sprint.startDate ?? '');
    this.endDate.set(sprint.endDate ?? '');
    this.modalOpen.set(true);
  }

  save(): void {
    const name = this.name().trim();
    if (!name) return;
    this.saving.set(true);
    const editing = this.editingSprint();
    const payload = { name, startDate: this.startDate() || null, endDate: this.endDate() || null };

    if (!editing) {
      this.sprintService.create(this.projectId, payload).subscribe({
        next: (sprint) => {
          this.sprints.update((list) => [...list, sprint]);
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

    this.sprintService.update(this.projectId, editing.id, payload).subscribe({
      next: (updated) => {
        this.sprints.update((list) => list.map((s) => (s.id === updated.id ? updated : s)));
        this.saving.set(false);
        this.modalOpen.set(false);
      },
      error: (err) => {
        this.saving.set(false);
        this.toast.error(err.message);
      },
    });
  }

  async remove(sprint: SprintResponse): Promise<void> {
    const label = this.currentProjectStore.sprintLabelSingular();
    const confirmed = await this.confirmDialog.confirm(
      `Delete ${label.toLowerCase()} "${sprint.name}"? ${this.currentProjectStore.itemLabelPlural()} on it move back to the backlog.`,
      { title: `Delete ${label.toLowerCase()}`, confirmLabel: 'Delete' },
    );
    if (!confirmed) return;
    this.sprintService.delete(this.projectId, sprint.id).subscribe({
      next: () => this.sprints.update((list) => list.filter((s) => s.id !== sprint.id)),
      error: (err) => this.toast.error(err.message),
    });
  }
}
