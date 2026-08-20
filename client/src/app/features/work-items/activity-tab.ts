import { Component, OnInit, inject, input, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { WorkItemService } from '../../core/services/work-item.service';
import { WorkItemActivityResponse } from '../../core/models/work-item.model';
import { Page } from '../../core/models/common.model';
import { PaginationComponent } from '../../shared/ui/pagination';

@Component({
  selector: 'app-activity-tab',
  imports: [DatePipe, PaginationComponent],
  template: `
    <div class="flex flex-col gap-3">
      @for (entry of page()?.content ?? []; track entry.id) {
        <div class="flex items-start gap-2 text-sm">
          <span class="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary-500"></span>
          <p class="text-slate-600">
            <span class="font-medium text-slate-800">{{ entry.actorName }}</span>
            changed <span class="font-medium">{{ entry.fieldName }}</span>
            from <span class="rounded bg-slate-100 px-1">{{ entry.oldValue ?? '—' }}</span>
            to <span class="rounded bg-slate-100 px-1">{{ entry.newValue ?? '—' }}</span>
            <span class="text-xs text-slate-400">· {{ entry.createdAt | date: 'short' }}</span>
          </p>
        </div>
      } @empty {
        <p class="text-sm text-slate-400">No activity recorded yet.</p>
      }
    </div>
    @if (page(); as p) {
      <app-pagination [page]="p.number" [totalPages]="p.totalPages" [totalElements]="p.totalElements" (pageChange)="load($event)" />
    }
  `,
})
export class ActivityTabComponent implements OnInit {
  private readonly workItemService = inject(WorkItemService);

  readonly workItemId = input.required<string>();
  readonly page = signal<Page<WorkItemActivityResponse> | null>(null);

  ngOnInit(): void {
    this.load(0);
  }

  load(page: number): void {
    this.workItemService.getActivity(this.workItemId(), page, 20).subscribe((data) => this.page.set(data));
  }
}
