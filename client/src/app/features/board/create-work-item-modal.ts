import { Component, computed, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PRIORITIES, Priority } from '../../core/models/common.model';
import { CustomFieldResponse } from '../../core/models/custom-field.model';
import { MemberResponse } from '../../core/models/member.model';
import { StatusCategoryResponse, WorkflowStatusResponse } from '../../core/models/workflow.model';
import { SprintResponse } from '../../core/models/sprint.model';
import { WorkItemTypeResponse } from '../../core/models/work-item-type.model';
import { WorkItemResponse } from '../../core/models/work-item.model';
import { WorkItemService } from '../../core/services/work-item.service';
import { ApiError } from '../../core/models/common.model';
import { CurrentProjectStore } from '../../core/state/current-project.store';
import { ModalComponent } from '../../shared/ui/modal';
import { CustomFieldsFormComponent } from '../../shared/ui/custom-fields-form';
import { PriorityBadgeComponent } from '../../shared/ui/priority-badge';
import { categoryColorFor, colorForIndex } from '../../shared/util/color-hash';

@Component({
  selector: 'app-create-work-item-modal',
  imports: [FormsModule, ModalComponent, CustomFieldsFormComponent, PriorityBadgeComponent],
  template: `
    <app-modal [open]="open()" [title]="modalTitle()" [width]="600" (closed)="close()">
      <form (ngSubmit)="submit()" class="flex flex-col gap-5">
        <div>
          <label class="label" for="title">Title</label>
          <input
            id="title"
            type="text"
            class="input text-base font-medium"
            placeholder="What needs to be done?"
            [(ngModel)]="title"
            name="title"
            required
          />
        </div>
        <div>
          <label class="label" for="description">Description</label>
          <textarea id="description" class="input resize-y" rows="3" [(ngModel)]="description" name="description"></textarea>
        </div>

        <div>
          <p class="mb-2.5 text-xs font-semibold uppercase tracking-wide text-slate-400">Classification</p>
          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label class="label" for="statusId">Status</label>
              <div class="relative">
                <span class="pointer-events-none absolute left-3 top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-full {{ statusColor().dot }}"></span>
                <select
                  id="statusId"
                  class="input pl-8"
                  [ngModel]="statusId() || defaultStatusId()"
                  (ngModelChange)="statusId.set($event)"
                  name="statusId"
                >
                  @for (s of statuses(); track s.id) {
                    <option [value]="s.id">{{ s.name }}</option>
                  }
                </select>
              </div>
            </div>
            <div>
              <div class="mb-1.5 flex items-center justify-between">
                <label class="label !mb-0" for="priority">Priority</label>
                <app-priority-badge [priority]="priority()" />
              </div>
              <select id="priority" class="input" [(ngModel)]="priority" name="priority">
                @for (p of priorities; track p) {
                  <option [value]="p">{{ p }}</option>
                }
              </select>
            </div>
            @if (types().length > 0) {
              <div>
                <label class="label" for="typeId">Type</label>
                <div class="relative">
                  @if (typeId()) {
                    <span class="pointer-events-none absolute left-3 top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-full {{ typeColorPreview().dot }}"></span>
                  }
                  <select id="typeId" class="input" [class.pl-8]="typeId()" [(ngModel)]="typeId" name="typeId">
                    <option [value]="''">No type</option>
                    @for (t of types(); track t.id) {
                      <option [value]="t.id">{{ t.name }}</option>
                    }
                  </select>
                </div>
              </div>
            }
          </div>
        </div>

        <div>
          <p class="mb-2.5 text-xs font-semibold uppercase tracking-wide text-slate-400">People</p>
          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label class="label" for="assigneeId">Assignee</label>
              <select id="assigneeId" class="input" [(ngModel)]="assigneeId" name="assigneeId">
                <option [value]="''">Unassigned</option>
                @for (m of members(); track m.userId) {
                  <option [value]="m.userId">{{ m.name }}</option>
                }
              </select>
            </div>
            <div>
              <label class="label" for="reporterId">Reporter</label>
              <select id="reporterId" class="input" [(ngModel)]="reporterId" name="reporterId">
                <option [value]="''">Unassigned</option>
                @for (m of members(); track m.userId) {
                  <option [value]="m.userId">{{ m.name }}</option>
                }
              </select>
            </div>
          </div>
        </div>

        <div>
          <p class="mb-2.5 text-xs font-semibold uppercase tracking-wide text-slate-400">Planning</p>
          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label class="label" for="dueDate">Due date</label>
              <input id="dueDate" type="date" class="input" [(ngModel)]="dueDate" name="dueDate" />
            </div>
            @if (sprints().length > 0) {
              <div>
                <label class="label" for="sprintId">{{ currentProjectStore.sprintLabelSingular() }}</label>
                <select id="sprintId" class="input" [(ngModel)]="sprintId" name="sprintId">
                  <option [value]="''">Backlog</option>
                  @for (s of sprints(); track s.id) {
                    <option [value]="s.id">{{ s.name }}</option>
                  }
                </select>
              </div>
            }
          </div>
        </div>

        @if (customFields().length > 0) {
          <div class="border-t border-slate-100 pt-4">
            <p class="mb-2.5 text-xs font-semibold uppercase tracking-wide text-slate-400">Custom fields</p>
            <app-custom-fields-form [fields]="customFields()" [members]="members()" [(values)]="customFieldValues" />
          </div>
        }

        @if (error()) {
          <div class="rounded-xl bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-700">{{ error() }}</div>
        }

        <div class="mt-1 flex justify-end gap-2 border-t border-slate-100 pt-4">
          <button type="button" class="btn-secondary" (click)="close()">Cancel</button>
          <button type="submit" class="btn-primary" [disabled]="!title().trim() || submitting()">
            {{ submitting() ? 'Creating…' : parentWorkItemId() ? 'Create subtask' : 'Create ' + currentProjectStore.itemLabelSingular().toLowerCase() }}
          </button>
        </div>
      </form>
    </app-modal>
  `,
})
export class CreateWorkItemModalComponent {
  private readonly workItemService = inject(WorkItemService);

  readonly currentProjectStore = inject(CurrentProjectStore);
  protected readonly modalTitle = computed(() =>
    this.parentWorkItemId() ? 'New subtask' : `New ${this.currentProjectStore.itemLabelSingular().toLowerCase()}`,
  );

  readonly open = input.required<boolean>();
  readonly projectId = input.required<string>();
  readonly statuses = input<WorkflowStatusResponse[]>([]);
  /** Used only to color-code the status dropdown to match the board - see statusColor(). Optional so callers that don't already load categories (there are none left, but keep it cheap to omit) still work, just without the color dot. */
  readonly categories = input<StatusCategoryResponse[]>([]);
  readonly members = input<MemberResponse[]>([]);
  readonly customFields = input<CustomFieldResponse[]>([]);
  readonly sprints = input<SprintResponse[]>([]);
  readonly types = input<WorkItemTypeResponse[]>([]);
  // when set, the created item is a subtask of this work item instead of a
  // top-level item - locked in by the caller, not editable in this form.
  readonly parentWorkItemId = input<string | null>(null);

  readonly closed = output<void>();
  readonly created = output<WorkItemResponse>();

  readonly priorities = PRIORITIES;

  readonly title = signal('');
  readonly description = signal('');
  readonly statusId = signal('');
  readonly priority = signal<Priority>('MEDIUM');
  readonly assigneeId = signal('');
  readonly reporterId = signal('');
  readonly dueDate = signal('');
  readonly sprintId = signal('');
  readonly typeId = signal('');
  readonly customFieldValues = signal<Record<string, unknown>>({});

  readonly submitting = signal(false);
  readonly error = signal<string | null>(null);

  protected readonly defaultStatusId = computed(() => {
    const sorted = [...this.statuses()].sort((a, b) => a.sortOrder - b.sortOrder);
    return sorted[0]?.id ?? '';
  });

  /** Color of the currently-selected status's category - so this dropdown reads consistently with the rest of the app instead of being the one plain-looking picker. */
  protected readonly statusColor = computed(() => {
    const status = this.statuses().find((s) => s.id === (this.statusId() || this.defaultStatusId()));
    return categoryColorFor(this.categories(), status?.categoryId ?? '');
  });

  protected readonly typeColorPreview = computed(() => {
    const index = this.types().findIndex((t) => t.id === this.typeId());
    return colorForIndex(index === -1 ? 0 : index);
  });

  close(): void {
    this.closed.emit();
  }

  submit(): void {
    if (!this.title().trim()) return;
    this.submitting.set(true);
    this.error.set(null);
    this.workItemService
      .create(this.projectId(), {
        title: this.title().trim(),
        description: this.description().trim() || null,
        statusId: this.statusId() || this.defaultStatusId() || null,
        assigneeId: this.assigneeId() || null,
        reporterId: this.reporterId() || null,
        sprintId: this.sprintId() || null,
        typeId: this.typeId() || null,
        parentWorkItemId: this.parentWorkItemId() || null,
        priority: this.priority(),
        dueDate: this.dueDate() || null,
        customFields: this.customFieldValues(),
      })
      .subscribe({
        next: (item) => {
          this.submitting.set(false);
          this.reset();
          this.created.emit(item);
        },
        error: (err: ApiError) => {
          this.submitting.set(false);
          this.error.set(err.message);
        },
      });
  }

  private reset(): void {
    this.title.set('');
    this.description.set('');
    this.statusId.set('');
    this.priority.set('MEDIUM');
    this.assigneeId.set('');
    this.reporterId.set('');
    this.dueDate.set('');
    this.sprintId.set('');
    this.typeId.set('');
    this.customFieldValues.set({});
  }
}
