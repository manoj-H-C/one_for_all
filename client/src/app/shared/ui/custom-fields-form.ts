import { Component, computed, input, model } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CustomFieldResponse } from '../../core/models/custom-field.model';
import { MemberResponse } from '../../core/models/member.model';

/**
 * Renders one input per project custom field, keyed by field name, matching
 * the value types CustomFieldValidator accepts server-side: strings for
 * TEXT/DATE/PHOTO/GEOLOCATION, numbers for NUMBER, booleans for BOOLEAN, one
 * of `options` for DROPDOWN, and a project member id for USER_REFERENCE.
 */
@Component({
  selector: 'app-custom-fields-form',
  imports: [FormsModule],
  template: `
    <div class="flex flex-col gap-4">
      @for (field of fields(); track field.id) {
        <div>
          <label class="label">
            {{ field.name }}
            @if (field.required) {
              <span class="text-red-500">*</span>
            }
            <span class="ml-1 text-xs font-normal text-slate-400">({{ field.fieldType }})</span>
          </label>

          @switch (field.fieldType) {
            @case ('TEXT') {
              <input type="text" class="input" [ngModel]="strValue(field.name)" (ngModelChange)="set(field.name, $event)" />
            }
            @case ('NUMBER') {
              <input
                type="number"
                class="input"
                [ngModel]="values()[field.name] ?? null"
                (ngModelChange)="set(field.name, $event === '' || $event === null ? null : Number($event))"
              />
            }
            @case ('DATE') {
              <input type="date" class="input" [ngModel]="strValue(field.name)" (ngModelChange)="set(field.name, $event)" />
            }
            @case ('BOOLEAN') {
              <label class="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  class="h-4 w-4 rounded border-slate-300 text-primary-600"
                  [ngModel]="values()[field.name] === true"
                  (ngModelChange)="set(field.name, $event)"
                />
                Yes
              </label>
            }
            @case ('DROPDOWN') {
              <select class="input" [ngModel]="strValue(field.name)" (ngModelChange)="set(field.name, $event)">
                <option value="" disabled>Select…</option>
                @for (opt of field.options ?? []; track opt) {
                  <option [value]="opt">{{ opt }}</option>
                }
              </select>
            }
            @case ('USER_REFERENCE') {
              <select class="input" [ngModel]="strValue(field.name)" (ngModelChange)="set(field.name, $event)">
                <option value="" disabled>Select a member…</option>
                @for (member of members(); track member.userId) {
                  <option [value]="member.userId">{{ member.name }}</option>
                }
              </select>
            }
            @case ('PHOTO') {
              <input
                type="url"
                class="input"
                placeholder="https://your-bucket.example.com/photo.jpg"
                [ngModel]="strValue(field.name)"
                (ngModelChange)="set(field.name, $event)"
              />
            }
            @case ('GEOLOCATION') {
              <input
                type="text"
                class="input"
                placeholder="lat,lng or an address"
                [ngModel]="strValue(field.name)"
                (ngModelChange)="set(field.name, $event)"
              />
            }
          }
        </div>
      }
    </div>
  `,
})
export class CustomFieldsFormComponent {
  readonly fields = input.required<CustomFieldResponse[]>();
  readonly members = input<MemberResponse[]>([]);
  readonly values = model.required<Record<string, unknown>>();

  protected readonly Number = Number;

  strValue(name: string): string {
    const v = this.values()[name];
    return v === null || v === undefined ? '' : String(v);
  }

  set(name: string, value: unknown): void {
    this.values.update((current) => ({ ...current, [name]: value }));
  }

  protected readonly hasFields = computed(() => this.fields().length > 0);
}
