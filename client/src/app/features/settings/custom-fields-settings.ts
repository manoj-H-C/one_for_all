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
import { EmptyStateComponent } from '../../shared/ui/empty-state';
import { IconComponent, IconName } from '../../shared/ui/icon';

interface FieldTypeMeta {
  icon: IconName;
  bg: string;
  text: string;
  label: string;
}

const FIELD_TYPE_META: Record<FieldType, FieldTypeMeta> = {
  TEXT: { icon: 'text', bg: 'bg-violet-100', text: 'text-violet-600', label: 'Text' },
  NUMBER: { icon: 'hash', bg: 'bg-sky-100', text: 'text-sky-600', label: 'Number' },
  DATE: { icon: 'calendar', bg: 'bg-amber-100', text: 'text-amber-600', label: 'Date' },
  BOOLEAN: { icon: 'toggle', bg: 'bg-emerald-100', text: 'text-emerald-600', label: 'Yes / No' },
  DROPDOWN: { icon: 'list', bg: 'bg-fuchsia-100', text: 'text-fuchsia-600', label: 'Dropdown' },
  USER_REFERENCE: { icon: 'user', bg: 'bg-cyan-100', text: 'text-cyan-600', label: 'Person' },
  PHOTO: { icon: 'photo', bg: 'bg-rose-100', text: 'text-rose-600', label: 'Photo' },
  GEOLOCATION: { icon: 'pin', bg: 'bg-lime-100', text: 'text-lime-600', label: 'Location' },
};

@Component({
  selector: 'app-custom-fields-settings',
  imports: [FormsModule, ModalComponent, EmptyStateComponent, IconComponent],
  template: `
    <div class="mx-auto flex max-w-5xl flex-col gap-6 animate-fade-in">
      <div class="flex flex-wrap items-center justify-between gap-4">
        <div class="flex items-center gap-3.5">
          <span
            class="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-white"
            style="background: linear-gradient(135deg, #a78bfa, #22d3ee); box-shadow: 0 6px 16px -4px rgb(139 92 246 / 0.45)"
          >
            <app-icon name="fields" [size]="20" />
          </span>
          <div>
            <h1 class="text-[26px] font-bold tracking-tight text-slate-900">Custom fields</h1>
            <p class="mt-0.5 text-sm text-slate-500">
              {{ fields().length }} field{{ fields().length === 1 ? '' : 's' }} · Add fields specific to your industry or use case
            </p>
          </div>
        </div>
        @if (canManage()) {
          <button type="button" class="btn-primary shrink-0" (click)="openCreate()">
            <app-icon name="plus" [size]="17" />
            New custom field
          </button>
        }
      </div>

      @if (fields().length === 0) {
        <app-empty-state
          icon="🧩"
          title="No custom fields yet"
          description="Add fields like severity, floor plan photo, or install date to fit how your team actually works."
        >
          @if (canManage()) {
            <button type="button" class="btn-primary mt-2" (click)="openCreate()">+ New custom field</button>
          }
        </app-empty-state>
      } @else {
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          @for (field of fields(); track field.id) {
            <div class="card group flex flex-col gap-3.5 p-5 transition-shadow duration-200 hover:shadow-lg">
              <div class="flex items-start justify-between gap-2">
                <div class="flex min-w-0 items-center gap-3">
                  <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl {{ typeMeta(field.fieldType).bg }} {{ typeMeta(field.fieldType).text }}">
                    <app-icon [name]="typeMeta(field.fieldType).icon" [size]="18" />
                  </span>
                  <div class="min-w-0">
                    <p class="truncate font-semibold text-slate-900">{{ field.name }}</p>
                    <p class="text-xs font-medium text-slate-400">{{ typeMeta(field.fieldType).label }}</p>
                  </div>
                </div>
                @if (canManage()) {
                  <div class="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity duration-150 group-hover:opacity-100">
                    <button type="button" class="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700" title="Edit field" (click)="openEdit(field)">
                      <app-icon name="edit" [size]="15" />
                    </button>
                    <button type="button" class="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600" title="Delete field" (click)="remove(field)">
                      <app-icon name="trash" [size]="15" />
                    </button>
                  </div>
                }
              </div>

              @if (field.required) {
                <span class="w-fit rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">Required</span>
              } @else {
                <span class="w-fit rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-500">Optional</span>
              }

              @if (field.options && field.options.length > 0) {
                <div class="flex flex-wrap gap-1.5 border-t border-slate-100 pt-3.5">
                  @for (opt of field.options.slice(0, 4); track opt) {
                    <span class="rounded-md bg-slate-50 px-2 py-0.5 text-xs text-slate-500 ring-1 ring-slate-200">{{ opt }}</span>
                  }
                  @if (field.options.length > 4) {
                    <span class="rounded-md px-2 py-0.5 text-xs font-medium text-slate-400">+{{ field.options.length - 4 }} more</span>
                  }
                </div>
              }
            </div>
          }
        </div>
      }
    </div>

    <app-modal [open]="modalOpen()" [title]="editingField() ? 'Edit custom field' : 'New custom field'" [width]="520" (closed)="modalOpen.set(false)">
      <div class="flex flex-col gap-4">
        <div>
          <label class="label">Name</label>
          <input type="text" class="input" placeholder="Severity, Install date, Site photo…" [(ngModel)]="name" [disabled]="!!editingField()" />
        </div>

        <div>
          <label class="label">Type</label>
          <div class="grid grid-cols-4 gap-2">
            @for (t of fieldTypes; track t) {
              <button
                type="button"
                class="flex flex-col items-center gap-1.5 rounded-xl border px-2 py-3 text-center transition-all duration-150"
                [class.border-primary-500]="fieldType() === t"
                [class.bg-primary-50]="fieldType() === t"
                [class.border-slate-200]="fieldType() !== t"
                [class.hover:border-slate-300]="!editingField() && fieldType() !== t"
                [class.opacity-40]="!!editingField() && fieldType() !== t"
                [class.cursor-not-allowed]="!!editingField()"
                [disabled]="!!editingField()"
                (click)="fieldType.set(t)"
              >
                <span class="flex h-8 w-8 items-center justify-center rounded-lg {{ typeMeta(t).bg }} {{ typeMeta(t).text }}">
                  <app-icon [name]="typeMeta(t).icon" [size]="15" />
                </span>
                <span class="text-[11px] font-medium" [class.text-primary-700]="fieldType() === t" [class.text-slate-600]="fieldType() !== t">
                  {{ typeMeta(t).label }}
                </span>
              </button>
            }
          </div>
          @if (editingField()) {
            <p class="mt-1.5 text-xs text-slate-400">Type can't be changed once a field is created.</p>
          }
        </div>

        @if (fieldType() === 'DROPDOWN') {
          <div>
            <label class="label">Options (comma-separated)</label>
            <input type="text" class="input" [(ngModel)]="optionsText" placeholder="Bug, Task, Story" />
          </div>
        }

        <label class="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-slate-200 px-3.5 py-3">
          <span class="min-w-0">
            <span class="block text-sm font-medium text-slate-700">Required</span>
            <span class="block text-xs text-slate-400">Must be filled in before saving an item</span>
          </span>
          <button
            type="button"
            role="switch"
            [attr.aria-checked]="required()"
            class="relative h-6 w-11 shrink-0 rounded-full transition-colors duration-150"
            [class.bg-primary-600]="required()"
            [class.bg-slate-200]="!required()"
            (click)="required.set(!required())"
          >
            <span
              class="absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-150"
              [class.translate-x-5]="required()"
            ></span>
          </button>
        </label>

        @if (error()) {
          <p class="text-sm text-red-600">{{ error() }}</p>
        }

        <div class="mt-1 flex justify-end gap-2">
          <button type="button" class="btn-secondary" (click)="modalOpen.set(false)">Cancel</button>
          <button type="button" class="btn-primary" [disabled]="!name().trim() || saving()" (click)="save()">
            {{ saving() ? 'Saving…' : editingField() ? 'Save changes' : 'Create field' }}
          </button>
        </div>
      </div>
    </app-modal>
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
  readonly error = signal<string | null>(null);

  readonly name = signal('');
  readonly fieldType = signal<FieldType>('TEXT');
  readonly required = signal(false);
  readonly optionsText = signal('');

  protected readonly typeMeta = (type: FieldType): FieldTypeMeta => FIELD_TYPE_META[type];

  ngOnInit(): void {
    this.customFieldService.list(this.projectId).subscribe((fields) => this.fields.set(fields));
  }

  openCreate(): void {
    this.editingField.set(null);
    this.name.set('');
    this.fieldType.set('TEXT');
    this.required.set(false);
    this.optionsText.set('');
    this.error.set(null);
    this.modalOpen.set(true);
  }

  openEdit(field: CustomFieldResponse): void {
    this.editingField.set(field);
    this.name.set(field.name);
    this.fieldType.set(field.fieldType);
    this.required.set(field.required);
    this.optionsText.set((field.options ?? []).join(', '));
    this.error.set(null);
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
    this.error.set(null);
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
            this.toast.success(`${field.name} added`);
          },
          error: (err) => {
            this.saving.set(false);
            this.error.set(err.message);
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
          this.error.set(err.message);
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
