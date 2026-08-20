import { Component, computed, input, model } from '@angular/core';
import { PermissionResponse } from '../../core/models/role.model';
import { IconComponent, IconName } from './icon';

interface PermissionGroup {
  label: string;
  icon: IconName;
  permissions: PermissionResponse[];
}

/** Groups the flat permission catalog by the natural prefix of its code (e.g. WORK_ITEM_*) so the checklist reads as sections instead of one long alphabet-soup list. Anything unrecognized falls into "Other" rather than being dropped. */
function categoryFor(code: string): { label: string; icon: IconName } {
  if (code.startsWith('WORK_ITEM_')) return { label: 'Work items', icon: 'board' };
  if (code.startsWith('COMMENT_')) return { label: 'Comments', icon: 'message' };
  if (code.startsWith('MEMBER_')) return { label: 'Members', icon: 'members' };
  if (code === 'ROLE_MANAGE') return { label: 'Roles', icon: 'roles' };
  if (code === 'WORKFLOW_MANAGE') return { label: 'Workflow', icon: 'workflow' };
  if (code === 'CUSTOM_FIELD_MANAGE') return { label: 'Custom fields', icon: 'fields' };
  if (code === 'PROJECT_MANAGE') return { label: 'Project', icon: 'settings' };
  return { label: 'Other', icon: 'key' };
}

@Component({
  selector: 'app-permission-checklist',
  imports: [IconComponent],
  template: `
    <div class="flex flex-col gap-3.5">
      @for (group of groups(); track group.label) {
        <div class="rounded-xl border border-slate-200 p-3.5">
          <div class="mb-2.5 flex items-center justify-between gap-2">
            <div class="flex items-center gap-2">
              <span class="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-500">
                <app-icon [name]="group.icon" [size]="13" />
              </span>
              <span class="text-xs font-semibold uppercase tracking-wide text-slate-500">{{ group.label }}</span>
            </div>
            <button type="button" class="text-xs font-medium text-primary-600 hover:underline" (click)="toggleGroup(group)">
              {{ allSelected(group) ? 'Clear' : 'Select all' }}
            </button>
          </div>
          <div class="flex flex-col gap-0.5">
            @for (perm of group.permissions; track perm.code) {
              <label class="flex cursor-pointer items-start gap-2.5 rounded-lg px-2 py-2 text-sm transition-colors hover:bg-slate-50">
                <input
                  type="checkbox"
                  class="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                  [checked]="selected().has(perm.code)"
                  (change)="toggle(perm.code)"
                />
                <span class="min-w-0">
                  <span class="block text-slate-700">{{ perm.description }}</span>
                  <span class="block font-mono text-[10.5px] text-slate-400">{{ perm.code }}</span>
                </span>
              </label>
            }
          </div>
        </div>
      }
    </div>
  `,
})
export class PermissionChecklistComponent {
  readonly catalog = input.required<PermissionResponse[]>();
  readonly selected = model.required<Set<string>>();

  readonly groups = computed<PermissionGroup[]>(() => {
    const byLabel = new Map<string, PermissionGroup>();
    for (const perm of this.catalog()) {
      const meta = categoryFor(perm.code);
      const existing = byLabel.get(meta.label);
      if (existing) {
        existing.permissions.push(perm);
      } else {
        byLabel.set(meta.label, { label: meta.label, icon: meta.icon, permissions: [perm] });
      }
    }
    return [...byLabel.values()];
  });

  allSelected(group: PermissionGroup): boolean {
    return group.permissions.every((p) => this.selected().has(p.code));
  }

  toggle(code: string): void {
    const next = new Set(this.selected());
    if (next.has(code)) {
      next.delete(code);
    } else {
      next.add(code);
    }
    this.selected.set(next);
  }

  toggleGroup(group: PermissionGroup): void {
    const next = new Set(this.selected());
    const turnOn = !this.allSelected(group);
    for (const p of group.permissions) {
      if (turnOn) {
        next.add(p.code);
      } else {
        next.delete(p.code);
      }
    }
    this.selected.set(next);
  }
}
