import { Component, computed, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PRIORITIES, Priority } from '../../core/models/common.model';
import { CustomFieldResponse } from '../../core/models/custom-field.model';
import { MemberResponse } from '../../core/models/member.model';
import { WorkflowStatusResponse } from '../../core/models/workflow.model';
import { SprintResponse } from '../../core/models/sprint.model';
import { WorkItemResponse } from '../../core/models/work-item.model';
import { WorkItemService } from '../../core/services/work-item.service';
import { ApiError } from '../../core/models/common.model';
import { CurrentProjectStore } from '../../core/state/current-project.store';
import { ModalComponent } from '../../shared/ui/modal';
import { CustomFieldsFormComponent } from '../../shared/ui/custom-fields-form';

@Component({
  selector: 'app-create-work-item-modal',
  imports: [FormsModule, ModalComponent, CustomFieldsFormComponent],
  template: `
    <app-modal [open]="open()" [title]="modalTitle()" [width]="560" (closed)="close()">
      <form (ngSubmit)="submit()" class="flex flex-col gap-4">
        <div>
          <label class="label" for="title">Title</label>
          <input id="title" type="text" class="input" [(ngModel)]="title" name="title" required />
        </div>
        <div>
          <label class="label" for="description">Description</label>
          <textarea id="description" class="input" rows="3" [(ngModel)]="description" name="description"></textarea>
        </div>

        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label class="label" for="statusId">Status</label>
            <select
              id="statusId"
              class="input"
              [ngModel]="statusId() || defaultStatusId()"
              (ngModelChange)="statusId.set($event)"
              name="statusId"
            >
              @for (s of statuses(); track s.id) {
                <option [value]="s.id">{{ s.name }}</option>
              }
            </select>
          </div>
          <div>
            <label class="label" for="priority">Priority</label>
            <select id="priority" class="input" [(ngModel)]="priority" name="priority">
              @for (p of priorities; track p) {
                <option [value]="p">{{ p }}</option>
              }
            </select>
          </div>
        </div>

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

        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label class="label" for="dueDate">Due date</label>
            <input id="dueDate" type="date" class="input" [(ngModel)]="dueDate" name="dueDate" />
          </div>
          @if (sprints().length > 0) {
            <div>
              <label class="label" for="sprintId">Sprint</label>
              <select id="sprintId" class="input" [(ngModel)]="sprintId" name="sprintId">
                <option [value]="''">Backlog</option>
                @for (s of sprints(); track s.id) {
                  <option [value]="s.id">{{ s.name }}</option>
                }
              </select>
            </div>
          }
        </div>

        @if (customFields().length > 0) {
          <div class="border-t border-slate-100 pt-4">
            <app-custom-fields-form [fields]="customFields()" [members]="members()" [(values)]="customFieldValues" />
          </div>
        }

        @if (error()) {
          <p class="text-sm text-red-600">{{ error() }}</p>
        }

        <div class="mt-2 flex justify-end gap-2">
          <button type="button" class="btn-secondary" (click)="close()">Cancel</button>
          <button type="submit" class="btn-primary" [disabled]="!title().trim() || submitting()">
            {{ submitting() ? 'Creating…' : 'Create ' + currentProjectStore.itemLabelSingular().toLowerCase() }}
          </button>
        </div>
      </form>
    </app-modal>
  `,
})
export class CreateWorkItemModalComponent {
  private readonly workItemService = inject(WorkItemService);

  readonly currentProjectStore = inject(CurrentProjectStore);
  protected readonly modalTitle = computed(() => `New ${this.currentProjectStore.itemLabelSingular().toLowerCase()}`);

  readonly open = input.required<boolean>();
  readonly projectId = input.required<string>();
  readonly statuses = input<WorkflowStatusResponse[]>([]);
  readonly members = input<MemberResponse[]>([]);
  readonly customFields = input<CustomFieldResponse[]>([]);
  readonly sprints = input<SprintResponse[]>([]);

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
  readonly customFieldValues = signal<Record<string, unknown>>({});

  readonly submitting = signal(false);
  readonly error = signal<string | null>(null);

  protected readonly defaultStatusId = computed(() => {
    const sorted = [...this.statuses()].sort((a, b) => a.sortOrder - b.sortOrder);
    return sorted[0]?.id ?? '';
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
    this.customFieldValues.set({});
  }
}
