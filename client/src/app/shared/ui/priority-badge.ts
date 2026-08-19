import { Component, computed, input } from '@angular/core';
import { Priority } from '../../core/models/common.model';

const STYLES: Record<Priority, { label: string; classes: string; icon: string }> = {
  LOWEST: { label: 'Lowest', classes: 'bg-slate-100 text-slate-600', icon: '↓↓' },
  LOW: { label: 'Low', classes: 'bg-sky-100 text-sky-700', icon: '↓' },
  MEDIUM: { label: 'Medium', classes: 'bg-amber-100 text-amber-700', icon: '=' },
  HIGH: { label: 'High', classes: 'bg-orange-100 text-orange-700', icon: '↑' },
  HIGHEST: { label: 'Highest', classes: 'bg-red-100 text-red-700', icon: '↑↑' },
};

@Component({
  selector: 'app-priority-badge',
  template: `
    <span
      class="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium {{ style().classes }}"
    >
      <span class="font-bold">{{ style().icon }}</span>{{ style().label }}
    </span>
  `,
})
export class PriorityBadgeComponent {
  readonly priority = input.required<Priority>();
  readonly style = computed(() => STYLES[this.priority()]);
}
