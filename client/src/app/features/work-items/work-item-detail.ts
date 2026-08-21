import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
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
import { StatusCategoryResponse, WorkflowStatusResponse } from '../../core/models/workflow.model';
import { SprintResponse } from '../../core/models/sprint.model';
import { WorkItemTypeResponse } from '../../core/models/work-item-type.model';
import { PRIORITIES, Priority } from '../../core/models/common.model';
import { PERMISSION_CODE } from '../../core/models/role.model';
import { ConfirmDialogService } from '../../shared/ui/confirm-dialog.service';
import { resolveProjectId } from '../../core/util/route.util';
import { CustomFieldsFormComponent } from '../../shared/ui/custom-fields-form';
import { RichTextEditorComponent } from '../../shared/ui/rich-text-editor';
import { RichTextViewComponent } from '../../shared/ui/rich-text-view';
import { isBlankHtml } from '../../shared/util/rich-text.util';
import { CreateWorkItemModalComponent } from '../board/create-work-item-modal';
import { AvatarComponent } from '../../shared/ui/avatar';
import { IconComponent, IconName } from '../../shared/ui/icon';
import { PriorityBadgeComponent } from '../../shared/ui/priority-badge';
import { StatusPillComponent } from '../../shared/ui/status-pill';
import { categoryColorFor, colorForIndex } from '../../shared/util/color-hash';
import { CommentsTabComponent } from './comments-tab';
import { AttachmentsTabComponent } from './attachments-tab';
import { LinksTabComponent } from './links-tab';
import { ActivityTabComponent } from './activity-tab';
import { RemindersTabComponent } from './reminders-tab';

type Tab = 'comments' | 'attachments' | 'links' | 'activity' | 'reminders';

const PRIORITY_ACCENT: Record<Priority, string> = {
  LOWEST: '#94a3b8',
  LOW: '#0ea5e9',
  MEDIUM: '#f59e0b',
  HIGH: '#fb923c',
  HIGHEST: '#ef4444',
};

@Component({
  selector: 'app-work-item-detail',
  imports: [
    FormsModule,
    DatePipe,
    RouterLink,
    CustomFieldsFormComponent,
    RichTextEditorComponent,
    RichTextViewComponent,
    CreateWorkItemModalComponent,
    AvatarComponent,
    IconComponent,
    PriorityBadgeComponent,
    StatusPillComponent,
    CommentsTabComponent,
    AttachmentsTabComponent,
    LinksTabComponent,
    ActivityTabComponent,
    RemindersTabComponent,
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
  private readonly destroyRef = inject(DestroyRef);
  readonly currentProjectStore = inject(CurrentProjectStore);

  // reassigned on every navigation - see ngOnInit. Not a signal because
  // every other piece of this page's data (item, subtasks, etc.) is already
  // reloaded imperatively inside loadWorkItem() rather than reactively
  // derived from it.
  workItemId = this.route.snapshot.paramMap.get('id')!;
  readonly projectId = resolveProjectId(this.route);

  readonly item = signal<WorkItemResponse | null>(null);
  readonly members = signal<MemberResponse[]>([]);
  readonly customFields = signal<CustomFieldResponse[]>([]);
  readonly statuses = signal<WorkflowStatusResponse[]>([]);
  readonly categories = signal<StatusCategoryResponse[]>([]);
  readonly sprints = signal<SprintResponse[]>([]);
  readonly types = signal<WorkItemTypeResponse[]>([]);
  readonly subtasks = signal<WorkItemResponse[]>([]);
  readonly createSubtaskOpen = signal(false);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly activeTab = signal<Tab>('comments');

  readonly priorities = PRIORITIES;
  protected readonly isBlankHtml = isBlankHtml;

  protected readonly tabDefs: { key: Tab; label: string; icon: IconName }[] = [
    { key: 'comments', label: 'Comments', icon: 'message' },
    { key: 'attachments', label: 'Attachments', icon: 'photo' },
    { key: 'links', label: 'Links', icon: 'tag' },
    { key: 'activity', label: 'Activity', icon: 'text' },
    { key: 'reminders', label: 'Reminders', icon: 'bell' },
  ];

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
  readonly canCreate = toSignal(this.permissions.has(this.projectId, PERMISSION_CODE.WORK_ITEM_CREATE), {
    initialValue: false,
  });

  readonly sortedStatuses = computed(() => [...this.statuses()].sort((a, b) => a.sortOrder - b.sortOrder));

  readonly accent = computed(() => PRIORITY_ACCENT[this.item()?.priority ?? 'MEDIUM']);
  readonly overdue = computed(() => {
    const due = this.item()?.dueDate;
    return !!due && due < new Date().toISOString().slice(0, 10);
  });

  // compares the editable signals against the last-saved item rather than
  // tracking a separate "touched" flag - stays correct even when a field is
  // edited and then edited back to its original value.
  readonly isDirty = computed(() => {
    const it = this.item();
    if (!it) return false;
    // "blank" HTML (an empty editor's leftover "<p></p>", vs. this item's
    // saved null) should never register as a change on its own.
    const normalizedDescription = (html: string | null | undefined) => (isBlankHtml(html) ? '' : (html ?? ''));
    return (
      this.title() !== it.title ||
      normalizedDescription(this.description()) !== normalizedDescription(it.description) ||
      this.priority() !== it.priority ||
      this.dueDate() !== (it.dueDate ?? '') ||
      JSON.stringify(this.customFieldValues()) !== JSON.stringify(it.customFields ?? {})
    );
  });

  /** The category's own explicitly-chosen color if it has one, otherwise the same by-position fallback used everywhere else. */
  categoryColor(categoryId: string) {
    return categoryColorFor(this.categories(), categoryId);
  }

  statusColor(statusId: string) {
    const status = this.statuses().find((s) => s.id === statusId);
    return this.categoryColor(status?.categoryId ?? '');
  }

  typeColor(typeId: string | null) {
    const index = this.types().findIndex((t) => t.id === typeId);
    return colorForIndex(index === -1 ? 0 : index);
  }

  ngOnInit(): void {
    // subscribing to paramMap (rather than reading route.snapshot once)
    // matters here because navigating from an item to one of its subtasks -
    // or vice versa via the "Subtask of" breadcrumb - hits this exact same
    // route with just a different :id, so Angular reuses this component
    // instance instead of re-creating it. Without this subscription the
    // page would never notice the id changed.
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      const id = params.get('id');
      if (!id) return;
      this.workItemId = id;
      this.loadWorkItem(id);
    });
  }

  private loadWorkItem(id: string): void {
    this.loading.set(true);
    this.activeTab.set('comments');
    forkJoin({
      item: this.workItemService.get(id),
      members: this.memberService.list(this.projectId),
      customFields: this.customFieldService.list(this.projectId),
      statuses: this.workflowService.listStatuses(this.projectId),
      categories: this.workflowService.listCategories(this.projectId),
      sprints: this.sprintService.list(this.projectId),
      types: this.workItemTypeService.list(this.projectId),
      subtasks: this.workItemService.list(this.projectId, { parentWorkItemId: id }, 0, 100),
    }).subscribe(({ item, members, customFields, statuses, categories, sprints, types, subtasks }) => {
      this.applyItem(item);
      this.members.set(members);
      this.customFields.set(customFields);
      this.statuses.set(statuses);
      this.categories.set(categories);
      this.sprints.set(sprints);
      this.types.set(types);
      this.subtasks.set(subtasks.content);
      this.loading.set(false);
    });
  }

  memberName(userId: string | null): string {
    if (!userId) return 'Unassigned';
    return this.members().find((m) => m.userId === userId)?.name ?? 'Unknown';
  }

  onSubtaskCreated(subtask: WorkItemResponse): void {
    this.createSubtaskOpen.set(false);
    this.subtasks.update((list) => [subtask, ...list]);
    this.toast.success('Subtask created');
  }

  private applyItem(item: WorkItemResponse): void {
    this.item.set(item);
    this.title.set(item.title);
    this.description.set(item.description ?? '');
    this.priority.set(item.priority);
    this.dueDate.set(item.dueDate ?? '');
    this.customFieldValues.set({ ...item.customFields });
  }

  discard(): void {
    const it = this.item();
    if (it) this.applyItem(it);
  }

  copyLink(): void {
    navigator.clipboard.writeText(window.location.href).then(() => this.toast.success('Link copied'));
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
        description: isBlankHtml(this.description()) ? null : this.description(),
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
