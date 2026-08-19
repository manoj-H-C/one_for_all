import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { WorkItemResponse } from '../../core/models/work-item.model';
import { Priority } from '../../core/models/common.model';
import { MemberResponse } from '../../core/models/member.model';
import { CustomFieldResponse } from '../../core/models/custom-field.model';
import { AvatarComponent } from '../../shared/ui/avatar';
import { PriorityBadgeComponent } from '../../shared/ui/priority-badge';
import { IconComponent } from '../../shared/ui/icon';
import { colorFor } from '../../shared/util/color-hash';

const ACCENT: Record<Priority, string> = {
  LOWEST: '#94a3b8',
  LOW: '#0ea5e9',
  MEDIUM: '#f59e0b',
  HIGH: '#fb923c',
  HIGHEST: '#ef4444',
};

@Component({
  selector: 'app-work-item-card',
  imports: [RouterLink, AvatarComponent, PriorityBadgeComponent, IconComponent],
  template: `
    <a
      [routerLink]="['/projects', item().projectId, 'work-items', item().id]"
      class="work-item-card group relative block cursor-grab overflow-hidden rounded-xl border border-slate-200/80 bg-white p-3 pl-4 transition-all duration-150 hover:-translate-y-0.5 hover:border-primary-200 active:cursor-grabbing"
    >
      <span class="absolute inset-y-0 left-0 w-1" [style.background]="accent()"></span>
      <p class="mb-2 text-sm font-medium leading-snug text-slate-800 group-hover:text-primary-700">{{ item().title }}</p>
      @if (typeBadges().length > 0) {
        <div class="mb-2.5 flex flex-wrap gap-1">
          @for (badge of typeBadges(); track badge.fieldName) {
            <span class="rounded-full px-2 py-0.5 text-[10px] font-semibold {{ badge.color.bg }} {{ badge.color.text }}">{{ badge.value }}</span>
          }
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
  `,
})
export class WorkItemCardComponent {
  readonly item = input.required<WorkItemResponse>();
  readonly members = input<MemberResponse[]>([]);
  /** Project's custom field definitions - only DROPDOWN ones with a value set on this item render as small badges, e.g. a "Type" or "Severity" field the project defined itself. */
  readonly customFields = input<CustomFieldResponse[]>([]);

  readonly accent = computed(() => ACCENT[this.item().priority]);
  readonly overdue = computed(() => {
    const due = this.item().dueDate;
    return !!due && due < new Date().toISOString().slice(0, 10);
  });

  readonly typeBadges = computed(() => {
    const values = this.item().customFields;
    return this.customFields()
      .filter((f) => f.fieldType === 'DROPDOWN')
      .map((f) => ({ fieldName: f.name, value: values[f.name] }))
      .filter((b): b is { fieldName: string; value: string } => typeof b.value === 'string' && b.value.trim() !== '')
      .map((b) => ({ ...b, color: colorFor(b.value) }));
  });

  assignee(): MemberResponse | undefined {
    return this.members().find((m) => m.userId === this.item().assigneeId);
  }
}
