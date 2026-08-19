import { Component, inject } from '@angular/core';
import { ConfirmDialogService } from './confirm-dialog.service';

@Component({
  selector: 'app-confirm-dialog-host',
  template: `
    @if (service.request(); as req) {
      <div class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4" (click)="service.resolve(false)">
        <div class="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl" (click)="$event.stopPropagation()">
          <h2 class="text-base font-semibold text-slate-900">{{ req.title }}</h2>
          <p class="mt-2 text-sm text-slate-600">{{ req.message }}</p>
          <div class="mt-5 flex justify-end gap-2">
            <button type="button" class="btn-secondary" (click)="service.resolve(false)">Cancel</button>
            <button
              type="button"
              [class]="req.danger ? 'btn-danger' : 'btn-primary'"
              (click)="service.resolve(true)"
            >
              {{ req.confirmLabel }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
})
export class ConfirmDialogHostComponent {
  readonly service = inject(ConfirmDialogService);
}
