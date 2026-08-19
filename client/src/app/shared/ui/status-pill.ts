import { Component, computed, input } from '@angular/core';
import { colorFor, PaletteColor } from '../util/color-hash';

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
  /** Precomputed color, e.g. colorForIndex(i) for a small known list where every item needs a visibly distinct dot. Overrides the name/seed hash when set. */
  readonly colorOverride = input<PaletteColor | null>(null);

  readonly color = computed(() => this.colorOverride() ?? colorFor(this.seed() || this.name()));
}
