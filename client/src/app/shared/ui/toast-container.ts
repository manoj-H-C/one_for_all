import { Component, inject } from '@angular/core';
import { ToastService } from '../../core/state/toast.service';

@Component({
  selector: 'app-toast-container',
  template: `
    <div class="fixed bottom-4 right-4 z-50 flex w-80 flex-col gap-2">
      @for (toast of toastService.toasts(); track toast.id) {
        <div
          class="flex items-start gap-2 rounded-lg border px-4 py-3 text-sm shadow-lg"
          [class]="
            toast.kind === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : toast.kind === 'error'
                ? 'bg-red-50 border-red-200 text-red-800'
                : 'bg-slate-50 border-slate-200 text-slate-800'
          "
        >
          <span class="flex-1">{{ toast.message }}</span>
          <button type="button" class="text-current opacity-60 hover:opacity-100" (click)="toastService.dismiss(toast.id)">
            ✕
          </button>
        </div>
      }
    </div>
  `,
})
export class ToastContainerComponent {
  readonly toastService = inject(ToastService);
}
