import { Component, input } from '@angular/core';

@Component({
  selector: 'app-empty-state',
  template: `
    <div class="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-slate-300 bg-slate-50/50 px-6 py-12 text-center">
      <div class="text-3xl">{{ icon() }}</div>
      <p class="text-sm font-medium text-slate-700">{{ title() }}</p>
      @if (description()) {
        <p class="max-w-sm text-sm text-slate-500">{{ description() }}</p>
      }
      <ng-content></ng-content>
    </div>
  `,
})
export class EmptyStateComponent {
  readonly icon = input<string>('📭');
  readonly title = input.required<string>();
  readonly description = input<string>('');
}
