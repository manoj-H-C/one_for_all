import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { WorkItemResponse } from '../../core/models/work-item.model';
import { Priority } from '../../core/models/common.model';
import { MemberResponse } from '../../core/models/member.model';
import { WorkItemTypeResponse } from '../../core/models/work-item-type.model';
import { AvatarComponent } from '../../shared/ui/avatar';
import { PriorityBadgeComponent } from '../../shared/ui/priority-badge';
import { IconComponent } from '../../shared/ui/icon';
import { StatusPillComponent } from '../../shared/ui/status-pill';
import { PaletteColor, colorForIndex } from '../../shared/util/color-hash';

const ACCENT: Record<Priority, string> = {
  LOWEST: '#94a3b8',
  LOW: '#0ea5e9',
  MEDIUM: '#f59e0b',
  HIGH: '#fb923c',
  HIGHEST: '#ef4444',
};

@Component({
  selector: 'app-work-item-card',
  imports: [RouterLink, AvatarComponent, PriorityBadgeComponent, IconComponent, StatusPillComponent, WorkItemCardComponent],
  template: `
    <div
      class="work-item-card group relative overflow-hidden rounded-xl border p-3 pl-4 transition-all duration-150 hover:border-primary-200 {{
        nested() ? 'border-slate-100 bg-slate-50/70' : 'border-slate-200/80 bg-white hover:-translate-y-0.5'
      }}"
    >
      <span class="absolute inset-y-0 left-0 w-1" [style.background]="accent()"></span>
      <a
        [routerLink]="['/projects', item().projectId, 'work-items', item().id]"
        class="block {{ nested() ? '' : 'cursor-grab active:cursor-grabbing' }}"
      >
        @if (nested()) {
          <div class="mb-1.5">
            <app-status-pill [name]="item().statusName" [colorOverride]="statusColors()[item().statusId] ?? null" />
          </div>
        }
        <p class="mb-2 text-sm font-medium leading-snug text-slate-800 group-hover:text-primary-700">{{ item().title }}</p>
        @if (item().typeName; as typeName) {
          <div class="mb-2.5">
            <span class="rounded-full px-2 py-0.5 text-[10px] font-semibold {{ typeColor().bg }} {{ typeColor().text }}">{{ typeName }}</span>
          </div>
        }
        <div class="flex items-center justify-between">
          <app-priority-badge [priority]="item().priority" />
          @if (assignee(); as a) {
            <app-avatar [name]="a.name" [size]="24" />
          } @else {
            <span class="text-xs text-slate-400">Unassigned</span>
          }
        </div>
        @if (item().dueDate) {
          <p class="mt-2.5 flex items-center gap-1 text-xs font-medium" [class.text-red-600]="overdue()" [class.text-slate-400]="!overdue()">
            <app-icon name="calendar" [size]="12" />
            Due {{ item().dueDate }}
          </p>
        }
      </a>

      @if (subtasks().length > 0) {
        <div class="mt-3 flex flex-col gap-2 border-t border-slate-100 pt-3">
          <p class="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            <app-icon name="list" [size]="12" />
            Subtasks · {{ subtasks().length }}
          </p>
          @for (s of subtasks(); track s.id) {
            <app-work-item-card
              [item]="s"
              [members]="members()"
              [types]="types()"
              [statusColors]="statusColors()"
              [nested]="true"
            />
          }
        </div>
      }
    </div>
  `,
})
export class WorkItemCardComponent {
  readonly item = input.required<WorkItemResponse>();
  readonly members = input<MemberResponse[]>([]);
  /** Project's work item types, in the same order shown in Settings - used only to pick a color that matches the type's dot there. */
  readonly types = input<WorkItemTypeResponse[]>([]);
  /** This item's own subtasks, stacked and rendered inside this same card - each one recursively rendered by this same component (nested, so it never has subtasks of its own). */
  readonly subtasks = input<WorkItemResponse[]>([]);
  /** statusId -> the same category color used for that status everywhere else on the board (columns, list view) - see board-page.ts's categoryColor(). Used to color the status pill shown on nested subtask cards. */
  readonly statusColors = input<Record<string, PaletteColor>>({});
  /** True when this card is rendered inside a parent card's subtask list rather than as a top-level board card - drops the drag cursor and gets a subdued background to read as nested. */
  readonly nested = input<boolean>(false);

  readonly accent = computed(() => ACCENT[this.item().priority]);
  readonly overdue = computed(() => {
    const due = this.item().dueDate;
    return !!due && due < new Date().toISOString().slice(0, 10);
  });

  readonly typeColor = computed(() => {
    const index = this.types().findIndex((t) => t.id === this.item().typeId);
    return colorForIndex(index === -1 ? 0 : index);
  });

  assignee(): MemberResponse | undefined {
    return this.members().find((m) => m.userId === this.item().assigneeId);
  }
}
