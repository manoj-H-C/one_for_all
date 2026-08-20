import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-modal',
  template: `
    @if (open()) {
      <div class="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-fade-in" (click)="onBackdrop()">
        <div
          class="max-h-[90vh] w-full overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl ring-1 ring-slate-900/5"
          [style.max-width.px]="width()"
          (click)="$event.stopPropagation()"
        >
          <div class="mb-5 flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
            <h2 class="text-lg font-bold tracking-tight text-slate-900">{{ title() }}</h2>
            <button
              type="button"
              class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
              (click)="closed.emit()"
              aria-label="Close"
            >
              ✕
            </button>
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
