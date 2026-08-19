import { Component, computed, input } from '@angular/core';
import { colorFor } from '../util/color-hash';

@Component({
  selector: 'app-status-pill',
  template: `
    <span class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium {{ color().bg }} {{ color().text }}">
      <span class="h-1.5 w-1.5 rounded-full {{ color().dot }}"></span>
      {{ name() }}
    </span>
  `,
})
export class StatusPillComponent {
  readonly name = input.required<string>();
  readonly seed = input<string>('');

  readonly color = computed(() => colorFor(this.seed() || this.name()));
}
