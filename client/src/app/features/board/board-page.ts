import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CdkDragDrop, CdkDropList, CdkDropListGroup, CdkDrag, transferArrayItem } from '@angular/cdk/drag-drop';
import { forkJoin } from 'rxjs';
import { WorkflowService } from '../../core/services/workflow.service';
import { WorkItemService } from '../../core/services/work-item.service';
import { MemberService } from '../../core/services/member.service';
import { CustomFieldService } from '../../core/services/custom-field.service';
import { SprintService } from '../../core/services/sprint.service';
import { WorkItemTypeService } from '../../core/services/work-item-type.service';
import { CurrentProjectStore } from '../../core/state/current-project.store';
import { ProjectPermissionsService } from '../../core/state/project-permissions.service';
import { ToastService } from '../../core/state/toast.service';
import { StatusCategoryResponse, WorkflowStatusResponse } from '../../core/models/workflow.model';
import { WorkItemResponse, WorkItemFilter } from '../../core/models/work-item.model';
import { MemberResponse } from '../../core/models/member.model';
import { CustomFieldResponse } from '../../core/models/custom-field.model';
import { SprintResponse } from '../../core/models/sprint.model';
import { WorkItemTypeResponse } from '../../core/models/work-item-type.model';
import { Page, PRIORITIES, Priority } from '../../core/models/common.model';
import { PERMISSION_CODE } from '../../core/models/role.model';
import { resolveProjectId } from '../../core/util/route.util';
import { WorkItemCardComponent } from './work-item-card';
import { CreateWorkItemModalComponent } from './create-work-item-modal';
import { StatusPillComponent } from '../../shared/ui/status-pill';
import { PaginationComponent } from '../../shared/ui/pagination';
import { EmptyStateComponent } from '../../shared/ui/empty-state';
import { AvatarComponent } from '../../shared/ui/avatar';
import { PriorityBadgeComponent } from '../../shared/ui/priority-badge';
import { IconComponent } from '../../shared/ui/icon';
import { DropdownMenuComponent } from '../../shared/ui/dropdown-menu';
import { SearchableSelectComponent, SearchableSelectOption } from '../../shared/ui/searchable-select';
import { colorForIndex } from '../../shared/util/color-hash';

const BOARD_PAGE_SIZE = 200;

@Component({
  selector: 'app-board-page',
  imports: [
    FormsModule,
    RouterLink,
    CdkDropListGroup,
    CdkDropList,
    CdkDrag,
    WorkItemCardComponent,
    CreateWorkItemModalComponent,
    StatusPillComponent,
    PaginationComponent,
    EmptyStateComponent,
    AvatarComponent,
    PriorityBadgeComponent,
    IconComponent,
    DropdownMenuComponent,
    SearchableSelectComponent,
  ],
  templateUrl: './board-page.html',
})
export class BoardPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly workflowService = inject(WorkflowService);
  private readonly workItemService = inject(WorkItemService);
  private readonly memberService = inject(MemberService);
  private readonly customFieldService = inject(CustomFieldService);
  private readonly sprintService = inject(SprintService);
  private readonly workItemTypeService = inject(WorkItemTypeService);
  private readonly permissions = inject(ProjectPermissionsService);
  private readonly toast = inject(ToastService);

  readonly currentProjectStore = inject(CurrentProjectStore);
  readonly projectId = resolveProjectId(this.route);

  readonly view = signal<'board' | 'list'>('board');
  readonly statuses = signal<WorkflowStatusResponse[]>([]);
  readonly categories = signal<StatusCategoryResponse[]>([]);
  readonly members = signal<MemberResponse[]>([]);
  readonly customFields = signal<CustomFieldResponse[]>([]);
  readonly sprints = signal<SprintResponse[]>([]);
  readonly types = signal<WorkItemTypeResponse[]>([]);
  readonly itemsByStatus = signal<Record<string, WorkItemResponse[]>>({});
  readonly loading = signal(true);
  readonly createOpen = signal(false);

  readonly priorities = PRIORITIES;
  readonly filterStatusId = signal('');
  readonly filterAssigneeId = signal('');
  readonly filterReporterId = signal('');
  readonly filterSprintId = signal('');
  readonly filterTypeId = signal('');
  readonly filterPriority = signal<Priority | ''>('');
  readonly filterQ = signal('');
  private searchDebounce?: ReturnType<typeof setTimeout>;

  readonly listPage = signal<Page<WorkItemResponse> | null>(null);
  readonly listPageNumber = signal(0);

  readonly canCreate = toSignal(this.permissions.has(this.projectId, PERMISSION_CODE.WORK_ITEM_CREATE), {
    initialValue: false,
  });
  readonly canEdit = toSignal(this.permissions.has(this.projectId, PERMISSION_CODE.WORK_ITEM_EDIT), {
    initialValue: false,
  });

  readonly sortedStatuses = computed(() => [...this.statuses()].sort((a, b) => a.sortOrder - b.sortOrder));

  readonly statusOptions = computed<SearchableSelectOption[]>(() =>
    this.sortedStatuses().map((s) => ({ value: s.id, label: s.name })),
  );
  readonly memberOptions = computed<SearchableSelectOption[]>(() =>
    this.members().map((m) => ({ value: m.userId, label: m.name })),
  );
  readonly sprintOptions = computed<SearchableSelectOption[]>(() => this.sprints().map((s) => ({ value: s.id, label: s.name })));
  readonly typeOptions = computed<SearchableSelectOption[]>(() => this.types().map((t) => ({ value: t.id, label: t.name })));
  readonly priorityOptions: SearchableSelectOption[] = this.priorities.map((p) => ({ value: p, label: p }));

  readonly activeFilterCount = computed(() => {
    let count = 0;
    if (this.filterStatusId()) count++;
    if (this.filterAssigneeId()) count++;
    if (this.filterReporterId()) count++;
    if (this.filterSprintId()) count++;
    if (this.filterTypeId()) count++;
    if (this.filterPriority()) count++;
    return count;
  });

  readonly totalItemCount = computed(() => {
    if (this.view() === 'list') return this.listPage()?.totalElements ?? 0;
    return Object.values(this.itemsByStatus()).reduce((sum, arr) => sum + arr.length, 0);
  });

  clearFilters(): void {
    this.filterStatusId.set('');
    this.filterAssigneeId.set('');
    this.filterReporterId.set('');
    this.filterSprintId.set('');
    this.filterTypeId.set('');
    this.filterPriority.set('');
    this.onFilterChange();
  }

  ngOnInit(): void {
    this.loadBoardData();
  }

  private loadBoardData(): void {
    this.loading.set(true);
    forkJoin({
      statuses: this.workflowService.listStatuses(this.projectId),
      categories: this.workflowService.listCategories(this.projectId),
      members: this.memberService.list(this.projectId),
      customFields: this.customFieldService.list(this.projectId),
      sprints: this.sprintService.list(this.projectId),
      types: this.workItemTypeService.list(this.projectId),
    }).subscribe(({ statuses, categories, members, customFields, sprints, types }) => {
      this.statuses.set(statuses);
      this.categories.set(categories);
      this.members.set(members);
      this.customFields.set(customFields);
      this.sprints.set(sprints);
      this.types.set(types);
      this.loadItems();
    });
  }

  private currentFilter(): WorkItemFilter {
    const filter: WorkItemFilter = {};
    if (this.filterStatusId()) filter.statusId = this.filterStatusId();
    if (this.filterAssigneeId()) filter.assigneeId = this.filterAssigneeId();
    if (this.filterReporterId()) filter.reporterId = this.filterReporterId();
    if (this.filterSprintId()) filter.sprintId = this.filterSprintId();
    if (this.filterTypeId()) filter.typeId = this.filterTypeId();
    if (this.filterPriority()) filter.priority = this.filterPriority() as Priority;
    if (this.filterQ()) filter.q = this.filterQ();
    return filter;
  }

  loadItems(): void {
    this.loading.set(true);
    this.workItemService.list(this.projectId, this.currentFilter(), 0, BOARD_PAGE_SIZE).subscribe((page) => {
      const grouped: Record<string, WorkItemResponse[]> = {};
      for (const status of this.statuses()) {
        grouped[status.id] = [];
      }
      for (const item of page.content) {
        (grouped[item.statusId] ??= []).push(item);
      }
      this.itemsByStatus.set(grouped);
      this.loading.set(false);
    });
  }

  loadListPage(page: number): void {
    this.listPageNumber.set(page);
    this.workItemService.list(this.projectId, this.currentFilter(), page, 20).subscribe((data) => this.listPage.set(data));
  }

  setView(view: 'board' | 'list'): void {
    this.view.set(view);
    if (view === 'list' && !this.listPage()) {
      this.loadListPage(0);
    }
  }

  onFilterChange(): void {
    if (this.view() === 'board') {
      this.loadItems();
    } else {
      this.loadListPage(0);
    }
  }

  setPriorityFilter(value: string): void {
    this.filterPriority.set(value as Priority | '');
    this.onFilterChange();
  }

  onSearchInput(value: string): void {
    this.filterQ.set(value);
    if (this.searchDebounce) clearTimeout(this.searchDebounce);
    this.searchDebounce = setTimeout(() => this.onFilterChange(), 400);
  }

  /** Every category gets its own palette slot by position in the list, so no two categories - and no two differently-categorized statuses - ever render with the same dot color. Kept in sync with the same scheme in Workflow settings. */
  categoryColor(categoryId: string) {
    const index = this.categories().findIndex((c) => c.id === categoryId);
    return colorForIndex(index === -1 ? 0 : index);
  }

  statusColor(statusId: string) {
    const status = this.statuses().find((s) => s.id === statusId);
    return this.categoryColor(status?.categoryId ?? '');
  }

  memberName(userId: string | null): string {
    if (!userId) return 'Unassigned';
    return this.members().find((m) => m.userId === userId)?.name ?? 'Unknown';
  }

  isOverdue(item: WorkItemResponse): boolean {
    if (!item.dueDate) return false;
    return item.dueDate < new Date().toISOString().slice(0, 10);
  }

  onDrop(event: CdkDragDrop<WorkItemResponse[]>, targetStatusId: string): void {
    if (event.previousContainer === event.container) return;
    const item = event.previousContainer.data[event.previousIndex];

    transferArrayItem(event.previousContainer.data, event.container.data, event.previousIndex, event.currentIndex);

    this.workItemService.updateStatus(item.id, targetStatusId).subscribe({
      next: (updated) => {
        this.itemsByStatus.update((map) => {
          const next = { ...map };
          next[targetStatusId] = next[targetStatusId].map((i) => (i.id === updated.id ? updated : i));
          return next;
        });
      },
      error: (err) => {
        this.toast.error(err.message ?? 'Could not move item');
        this.loadItems();
      },
    });
  }

  onCreated(item: WorkItemResponse): void {
    this.createOpen.set(false);
    this.toast.success(`${this.currentProjectStore.itemLabelSingular()} created`);
    this.itemsByStatus.update((map) => {
      const next = { ...map };
      next[item.statusId] = [item, ...(next[item.statusId] ?? [])];
      return next;
    });
    if (this.view() === 'list') this.loadListPage(0);
  }
}
