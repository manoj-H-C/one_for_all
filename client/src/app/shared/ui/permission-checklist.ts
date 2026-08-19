import { Component, input, model } from '@angular/core';
import { PermissionResponse } from '../../core/models/role.model';

@Component({
  selector: 'app-permission-checklist',
  template: `
    <div class="grid gap-2 sm:grid-cols-2">
      @for (perm of catalog(); track perm.code) {
        <label
          class="flex cursor-pointer items-start gap-2 rounded-lg border border-slate-200 p-3 text-sm hover:bg-slate-50"
        >
          <input
            type="checkbox"
            class="mt-0.5 h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
            [checked]="selected().has(perm.code)"
            (change)="toggle(perm.code)"
          />
          <span>
            <span class="block font-medium text-slate-800">{{ perm.code }}</span>
            <span class="block text-xs text-slate-500">{{ perm.description }}</span>
          </span>
        </label>
      }
    </div>
  `,
})
export class PermissionChecklistComponent {
  readonly catalog = input.required<PermissionResponse[]>();
  readonly selected = model.required<Set<string>>();

  toggle(code: string): void {
    const next = new Set(this.selected());
    if (next.has(code)) {
      next.delete(code);
    } else {
      next.add(code);
    }
    this.selected.set(next);
  }
}
