import { Component, ElementRef, HostListener, computed, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IconComponent } from './icon';

export interface SearchableSelectOption {
  value: string;
  label: string;
}

/** A combobox: click to open a searchable option list, filtered client-side by label. */
@Component({
  selector: 'app-searchable-select',
  imports: [FormsModule, IconComponent],
  template: `
    <div class="relative">
      <button type="button" class="input flex w-full items-center justify-between gap-2 text-left" (click)="toggle()">
        <span class="truncate" [class.text-slate-400]="!selectedLabel()">{{ selectedLabel() || placeholder() }}</span>
        <app-icon name="chevron-down" [size]="14" class="shrink-0 text-slate-400" />
      </button>
      @if (open()) {
        <div class="absolute z-40 mt-1 w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
          <div class="border-b border-slate-100 p-2">
            <input
              type="text"
              class="input h-8 text-sm"
              placeholder="Search…"
              [ngModel]="query()"
              (ngModelChange)="query.set($event)"
            />
          </div>
          <div class="max-h-56 overflow-y-auto py-1">
            <button
              type="button"
              class="flex w-full items-center px-3 py-1.5 text-left text-sm hover:bg-primary-50"
              [class.font-semibold]="!value()"
              (click)="select('')"
            >
              {{ placeholder() }}
            </button>
            @for (opt of filteredOptions(); track opt.value) {
              <button
                type="button"
                class="flex w-full items-center px-3 py-1.5 text-left text-sm hover:bg-primary-50"
                [class.font-semibold]="opt.value === value()"
                (click)="select(opt.value)"
              >
                {{ opt.label }}
              </button>
            } @empty {
              <p class="px-3 py-2 text-sm text-slate-400">No matches</p>
            }
          </div>
        </div>
      }
    </div>
  `,
})
export class SearchableSelectComponent {
  readonly options = input<SearchableSelectOption[]>([]);
  readonly value = input<string>('');
  readonly placeholder = input<string>('Select…');
  readonly valueChange = output<string>();

  readonly open = signal(false);
  readonly query = signal('');

  readonly selectedLabel = computed(() => this.options().find((o) => o.value === this.value())?.label ?? '');
  readonly filteredOptions = computed(() => {
    const q = this.query().trim().toLowerCase();
    if (!q) return this.options();
    return this.options().filter((o) => o.label.toLowerCase().includes(q));
  });

  constructor(private readonly elementRef: ElementRef<HTMLElement>) {}

  toggle(): void {
    const next = !this.open();
    this.open.set(next);
    if (next) this.query.set('');
  }

  select(value: string): void {
    this.valueChange.emit(value);
    this.open.set(false);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (this.open() && !this.elementRef.nativeElement.contains(event.target as Node)) {
      this.open.set(false);
    }
  }
}
