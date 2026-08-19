import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-modal',
  template: `
    @if (open()) {
      <div class="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/50 p-4" (click)="onBackdrop()">
        <div
          class="max-h-[90vh] w-full overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"
          [style.max-width.px]="width()"
          (click)="$event.stopPropagation()"
        >
          <div class="mb-4 flex items-start justify-between gap-4">
            <h2 class="text-lg font-semibold text-slate-900">{{ title() }}</h2>
            <button type="button" class="btn-ghost !p-1.5" (click)="closed.emit()" aria-label="Close">✕</button>
          </div>
          <ng-content></ng-content>
        </div>
      </div>
    }
  `,
})
export class ModalComponent {
  readonly open = input.required<boolean>();
  readonly title = input<string>('');
  readonly width = input<number>(480);
  readonly closeOnBackdrop = input<boolean>(true);
  readonly closed = output<void>();

  onBackdrop(): void {
    if (this.closeOnBackdrop()) {
      this.closed.emit();
    }
  }
}
