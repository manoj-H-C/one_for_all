import { Component, computed, input } from '@angular/core';
import { colorFor, initialsFor } from '../util/color-hash';

@Component({
  selector: 'app-avatar',
  template: `
    <span
      class="inline-flex items-center justify-center rounded-full font-semibold shrink-0 {{ color().bg }} {{ color().text }}"
      [style.width.px]="size()"
      [style.height.px]="size()"
      [style.fontSize.px]="size() * 0.4"
      [title]="name()"
    >
      {{ initials() }}
    </span>
  `,
})
export class AvatarComponent {
  readonly name = input.required<string>();
  readonly size = input<number>(28);

  readonly initials = computed(() => initialsFor(this.name()));
  readonly color = computed(() => colorFor(this.name()));
}
