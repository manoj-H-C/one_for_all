import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { WorkItemService } from '../../core/services/work-item.service';
import { MemberService } from '../../core/services/member.service';
import { CustomFieldService } from '../../core/services/custom-field.service';
import { WorkflowService } from '../../core/services/workflow.service';
import { SprintService } from '../../core/services/sprint.service';
import { WorkItemTypeService } from '../../core/services/work-item-type.service';
import { CurrentProjectStore } from '../../core/state/current-project.store';
import { ProjectPermissionsService } from '../../core/state/project-permissions.service';
import { ToastService } from '../../core/state/toast.service';
import { WorkItemResponse } from '../../core/models/work-item.model';
import { MemberResponse } from '../../core/models/member.model';
import { CustomFieldResponse } from '../../core/models/custom-field.model';
import { WorkflowStatusResponse } from '../../core/models/workflow.model';
import { SprintResponse } from '../../core/models/sprint.model';
import { WorkItemTypeResponse } from '../../core/models/work-item-type.model';
import { PRIORITIES, Priority } from '../../core/models/common.model';
import { PERMISSION_CODE } from '../../core/models/role.model';
import { ConfirmDialogService } from '../../shared/ui/confirm-dialog.service';
import { resolveProjectId } from '../../core/util/route.util';
import { CustomFieldsFormComponent } from '../../shared/ui/custom-fields-form';
import { CommentsTabComponent } from './comments-tab';
import { AttachmentsTabComponent } from './attachments-tab';
import { LinksTabComponent } from './links-tab';
import { ActivityTabComponent } from './activity-tab';

type Tab = 'comments' | 'attachments' | 'links' | 'activity';

@Component({
  selector: 'app-work-item-detail',
  imports: [
    FormsModule,
    DatePipe,
    RouterLink,
    CustomFieldsFormComponent,
    CommentsTabComponent,
    AttachmentsTabComponent,
    LinksTabComponent,
    ActivityTabComponent,
  ],
  templateUrl: './work-item-detail.html',
})
export class WorkItemDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly workItemService = inject(WorkItemService);
  private readonly memberService = inject(MemberService);
  private readonly customFieldService = inject(CustomFieldService);
  private readonly workflowService = inject(WorkflowService);
  private readonly sprintService = inject(SprintService);
  private readonly workItemTypeService = inject(WorkItemTypeService);
  private readonly permissions = inject(ProjectPermissionsService);
  private readonly toast = inject(ToastService);
  private readonly confirmDialog = inject(ConfirmDialogService);
  readonly currentProjectStore = inject(CurrentProjectStore);

  readonly workItemId = this.route.snapshot.paramMap.get('id')!;
  readonly projectId = resolveProjectId(this.route);

  readonly item = signal<WorkItemResponse | null>(null);
  readonly members = signal<MemberResponse[]>([]);
  readonly customFields = signal<CustomFieldResponse[]>([]);
  readonly statuses = signal<WorkflowStatusResponse[]>([]);
  readonly sprints = signal<SprintResponse[]>([]);
  readonly types = signal<WorkItemTypeResponse[]>([]);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly activeTab = signal<Tab>('comments');

  readonly priorities = PRIORITIES;

  readonly title = signal('');
  readonly description = signal('');
  readonly priority = signal<Priority>('MEDIUM');
  readonly dueDate = signal('');
  readonly customFieldValues = signal<Record<string, unknown>>({});

  readonly canEdit = toSignal(this.permissions.has(this.projectId, PERMISSION_CODE.WORK_ITEM_EDIT), { initialValue: false });
  readonly canAssign = toSignal(this.permissions.has(this.projectId, PERMISSION_CODE.WORK_ITEM_ASSIGN), {
    initialValue: false,
  });
  readonly canDelete = toSignal(this.permissions.has(this.projectId, PERMISSION_CODE.WORK_ITEM_DELETE), {
    initialValue: false,
  });
  readonly canComment = toSignal(this.permissions.has(this.projectId, PERMISSION_CODE.COMMENT_CREATE), {
    initialValue: false,
  });

  ngOnInit(): void {
    forkJoin({
      item: this.workItemService.get(this.workItemId),
      members: this.memberService.list(this.projectId),
      customFields: this.customFieldService.list(this.projectId),
      statuses: this.workflowService.listStatuses(this.projectId),
      sprints: this.sprintService.list(this.projectId),
      types: this.workItemTypeService.list(this.projectId),
    }).subscribe(({ item, members, customFields, statuses, sprints, types }) => {
      this.applyItem(item);
      this.members.set(members);
      this.customFields.set(customFields);
      this.statuses.set(statuses);
      this.sprints.set(sprints);
      this.types.set(types);
      this.loading.set(false);
    });
  }

  private applyItem(item: WorkItemResponse): void {
    this.item.set(item);
    this.title.set(item.title);
    this.description.set(item.description ?? '');
    this.priority.set(item.priority);
    this.dueDate.set(item.dueDate ?? '');
    this.customFieldValues.set({ ...item.customFields });
  }

  save(): void {
    if (!this.title().trim()) return;
    this.saving.set(true);
    const normalizedCustomFields = Object.fromEntries(
      Object.entries(this.customFieldValues()).map(([k, v]) => [k, v === '' ? null : v]),
    );
    this.workItemService
      .update(this.workItemId, {
        title: this.title().trim(),
        description: this.description().trim() || null,
        priority: this.priority(),
        dueDate: this.dueDate() || null,
        customFields: normalizedCustomFields,
      })
      .subscribe({
        next: (updated) => {
          this.applyItem(updated);
          this.saving.set(false);
          this.toast.success('Saved');
        },
        error: (err) => {
          this.saving.set(false);
          this.toast.error(err.message);
        },
      });
  }

  changeStatus(statusId: string): void {
    this.workItemService.updateStatus(this.workItemId, statusId).subscribe({
      next: (updated) => this.applyItem(updated),
      error: (err) => this.toast.error(err.message),
    });
  }

  changeAssignee(assigneeId: string): void {
    this.workItemService.updateAssignee(this.workItemId, assigneeId || null).subscribe({
      next: (updated) => this.applyItem(updated),
      error: (err) => this.toast.error(err.message),
    });
  }

  changeReporter(reporterId: string): void {
    this.workItemService.updateReporter(this.workItemId, reporterId || null).subscribe({
      next: (updated) => {
        this.applyItem(updated);
        this.toast.success('Reporter updated');
      },
      error: (err) => this.toast.error(err.message),
    });
  }

  changeSprint(sprintId: string): void {
    this.workItemService.updateSprint(this.workItemId, sprintId || null).subscribe({
      next: (updated) => {
        this.applyItem(updated);
        this.toast.success(`${this.currentProjectStore.sprintLabelSingular()} updated`);
      },
      error: (err) => this.toast.error(err.message),
    });
  }

  changeType(typeId: string): void {
    this.workItemService.updateType(this.workItemId, typeId || null).subscribe({
      next: (updated) => {
        this.applyItem(updated);
        this.toast.success('Type updated');
      },
      error: (err) => this.toast.error(err.message),
    });
  }

  async remove(): Promise<void> {
    const label = this.currentProjectStore.itemLabelSingular();
    const confirmed = await this.confirmDialog.confirm(
      `Delete "${this.item()?.title}"? Comments and attachments will still exist but this item will disappear from the API.`,
      { title: `Delete ${label.toLowerCase()}`, confirmLabel: 'Delete' },
    );
    if (!confirmed) return;
    this.workItemService.delete(this.workItemId).subscribe({
      next: () => {
        this.toast.success(`${label} deleted`);
        this.router.navigate(['/projects', this.projectId, 'board']);
      },
      error: (err) => this.toast.error(err.message),
    });
  }
}
