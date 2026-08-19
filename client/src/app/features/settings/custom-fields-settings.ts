import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { CustomFieldService } from '../../core/services/custom-field.service';
import { ProjectPermissionsService } from '../../core/state/project-permissions.service';
import { ToastService } from '../../core/state/toast.service';
import { ConfirmDialogService } from '../../shared/ui/confirm-dialog.service';
import { CustomFieldResponse } from '../../core/models/custom-field.model';
import { FIELD_TYPES, FieldType } from '../../core/models/common.model';
import { PERMISSION_CODE } from '../../core/models/role.model';
import { resolveProjectId } from '../../core/util/route.util';
import { ModalComponent } from '../../shared/ui/modal';
import { IconComponent } from '../../shared/ui/icon';

@Component({
  selector: 'app-custom-fields-settings',
  imports: [FormsModule, ModalComponent, IconComponent],
  template: `
    <div class="mx-auto max-w-4xl">
    <div class="mb-6 flex items-center justify-between">
      <div>
        <h1 class="text-[26px] font-bold tracking-tight text-slate-900">Custom fields</h1>
        <p class="mt-0.5 text-sm text-slate-500">Add fields specific to your industry or use case.</p>
      </div>
      @if (canManage()) {
        <button type="button" class="btn-primary" (click)="openCreate()">
          <app-icon name="plus" [size]="17" />
          New custom field
        </button>
      }
    </div>

    <div class="card overflow-hidden">
      <table class="w-full text-sm">
        <thead class="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
          <tr>
            <th class="px-4 py-3">Name</th>
            <th class="px-4 py-3">Type</th>
            <th class="px-4 py-3">Required</th>
            <th class="px-4 py-3">Options</th>
            <th class="px-4 py-3"></th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100">
          @for (field of fields(); track field.id) {
            <tr>
              <td class="px-4 py-3 font-medium text-slate-800">{{ field.name }}</td>
              <td class="px-4 py-3 text-slate-500">{{ field.fieldType }}</td>
              <td class="px-4 py-3">{{ field.required ? 'Yes' : 'No' }}</td>
              <td class="px-4 py-3 text-slate-500">{{ field.options?.join(', ') || '—' }}</td>
              <td class="px-4 py-3 text-right">
                @if (canManage()) {
                  <button type="button" class="mr-3 text-xs text-slate-400 hover:text-slate-700" (click)="openEdit(field)">Edit</button>
                  <button type="button" class="text-xs text-slate-400 hover:text-red-600" (click)="remove(field)">Delete</button>
                }
              </td>
            </tr>
          } @empty {
            <tr>
              <td colspan="5" class="px-4 py-8 text-center text-slate-400">No custom fields yet.</td>
            </tr>
          }
        </tbody>
      </table>
    </div>

    <app-modal [open]="modalOpen()" [title]="editingField() ? 'Edit custom field' : 'New custom field'" (closed)="modalOpen.set(false)">
      <div class="flex flex-col gap-4">
        <div>
          <label class="label">Name</label>
          <input type="text" class="input" [(ngModel)]="name" [disabled]="!!editingField()" />
        </div>
        <div>
          <label class="label">Type</label>
          <select class="input" [(ngModel)]="fieldType" [disabled]="!!editingField()">
            @for (t of fieldTypes; track t) {
              <option [value]="t">{{ t }}</option>
            }
          </select>
        </div>
        <label class="flex items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" class="h-4 w-4 rounded border-slate-300 text-primary-600" [(ngModel)]="required" />
          Required
        </label>
        @if (fieldType() === 'DROPDOWN') {
          <div>
            <label class="label">Options (comma-separated)</label>
            <input type="text" class="input" [(ngModel)]="optionsText" placeholder="Bug, Task, Story" />
          </div>
        }
        <div class="flex justify-end gap-2">
          <button type="button" class="btn-secondary" (click)="modalOpen.set(false)">Cancel</button>
          <button type="button" class="btn-primary" [disabled]="!name().trim() || saving()" (click)="save()">
            {{ saving() ? 'Saving…' : editingField() ? 'Save changes' : 'Create field' }}
          </button>
        </div>
      </div>
    </app-modal>
    </div>
  `,
})
export class CustomFieldsSettingsComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly customFieldService = inject(CustomFieldService);
  private readonly permissions = inject(ProjectPermissionsService);
  private readonly toast = inject(ToastService);
  private readonly confirmDialog = inject(ConfirmDialogService);

  readonly projectId = resolveProjectId(this.route);
  readonly canManage = toSignal(this.permissions.has(this.projectId, PERMISSION_CODE.CUSTOM_FIELD_MANAGE), {
    initialValue: false,
  });

  readonly fields = signal<CustomFieldResponse[]>([]);
  readonly fieldTypes = FIELD_TYPES;
  readonly modalOpen = signal(false);
  readonly editingField = signal<CustomFieldResponse | null>(null);
  readonly saving = signal(false);

  readonly name = signal('');
  readonly fieldType = signal<FieldType>('TEXT');
  readonly required = signal(false);
  readonly optionsText = signal('');

  ngOnInit(): void {
    this.customFieldService.list(this.projectId).subscribe((fields) => this.fields.set(fields));
  }

  openCreate(): void {
    this.editingField.set(null);
    this.name.set('');
    this.fieldType.set('TEXT');
    this.required.set(false);
    this.optionsText.set('');
    this.modalOpen.set(true);
  }

  openEdit(field: CustomFieldResponse): void {
    this.editingField.set(field);
    this.name.set(field.name);
    this.fieldType.set(field.fieldType);
    this.required.set(field.required);
    this.optionsText.set((field.options ?? []).join(', '));
    this.modalOpen.set(true);
  }

  private parsedOptions(): string[] | null {
    if (this.fieldType() !== 'DROPDOWN') return null;
    const opts = this.optionsText()
      .split(',')
      .map((o) => o.trim())
      .filter(Boolean);
    return opts.length > 0 ? opts : null;
  }

  save(): void {
    if (!this.name().trim()) return;
    this.saving.set(true);
    const editing = this.editingField();

    if (!editing) {
      this.customFieldService
        .create(this.projectId, {
          name: this.name().trim(),
          fieldType: this.fieldType(),
          required: this.required(),
          options: this.parsedOptions(),
        })
        .subscribe({
          next: (field) => {
            this.fields.update((list) => [...list, field]);
            this.saving.set(false);
            this.modalOpen.set(false);
          },
          error: (err) => {
            this.saving.set(false);
            this.toast.error(err.message);
          },
        });
      return;
    }

    this.customFieldService
      .update(this.projectId, editing.id, { required: this.required(), options: this.parsedOptions() })
      .subscribe({
        next: (updated) => {
          this.fields.update((list) => list.map((f) => (f.id === updated.id ? updated : f)));
          this.saving.set(false);
          this.modalOpen.set(false);
        },
        error: (err) => {
          this.saving.set(false);
          this.toast.error(err.message);
        },
      });
  }

  async remove(field: CustomFieldResponse): Promise<void> {
    const confirmed = await this.confirmDialog.confirm(`Delete custom field "${field.name}"?`, {
      title: 'Delete custom field',
      confirmLabel: 'Delete',
    });
    if (!confirmed) return;
    this.customFieldService.delete(this.projectId, field.id).subscribe({
      next: () => this.fields.update((list) => list.filter((f) => f.id !== field.id)),
      error: (err) => this.toast.error(err.message),
    });
  }
}
