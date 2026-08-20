import { Component, ElementRef, HostListener, computed, input, output, signal } from '@angular/core';
import { PALETTE_KEYS, colorForKey } from '../util/color-hash';
import { IconComponent } from './icon';

/** A labeled dropdown (dot + color name + chevron) for picking from the app's fixed 8-color palette - used to let a category's color be a deliberate choice instead of always falling back to its position in the list. */
@Component({
  selector: 'app-color-swatch-picker',
  imports: [IconComponent],
  template: `
    <div class="relative inline-block">
      <button
        type="button"
        class="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 transition-colors enabled:hover:border-slate-300 enabled:hover:bg-slate-50 disabled:cursor-default disabled:opacity-60"
        [disabled]="disabled()"
        (click)="toggle()"
      >
        <span class="h-3 w-3 shrink-0 rounded-full {{ triggerDotClass() }}"></span>
        {{ selectedLabel() }}
        @if (!disabled()) {
          <app-icon name="chevron-down" [size]="12" class="text-slate-400" />
        }
      </button>
      @if (open()) {
        <div class="absolute z-30 mt-1.5 w-40 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
          @for (key of keys; track key) {
            <button
              type="button"
              class="flex w-full items-center gap-2.5 px-3 py-1.5 text-left text-sm capitalize transition-colors hover:bg-slate-50"
              (click)="select(key)"
            >
              <span class="h-3 w-3 shrink-0 rounded-full {{ dotFor(key) }}"></span>
              <span class="flex-1 text-slate-700">{{ key }}</span>
              @if (key === selectedKey()) {
                <app-icon name="check" [size]="14" class="text-primary-600" />
              }
            </button>
          }
        </div>
      }
    </div>
  `,
})
export class ColorSwatchPickerComponent {
  /** Tailwind dot class for the trigger button - the caller resolves this (via categoryColorFor) so this component doesn't need to know about the index-fallback rule. */
  readonly triggerDotClass = input<string>('bg-slate-300');
  /** The category's own raw color key, if one has been explicitly chosen - used to highlight the selected option and label the trigger. */
  readonly selectedKey = input<string | null>(null);
  readonly disabled = input<boolean>(false);
  readonly colorChange = output<string>();

  readonly keys = PALETTE_KEYS;
  readonly open = signal(false);

  readonly selectedLabel = computed(() => {
    const key = this.selectedKey();
    return key ? key.charAt(0).toUpperCase() + key.slice(1) : 'Color';
  });

  constructor(private readonly elementRef: ElementRef<HTMLElement>) {}

  dotFor(key: string): string {
    return colorForKey(key)?.dot ?? '';
  }

  toggle(): void {
    if (this.disabled()) return;
    this.open.update((v) => !v);
  }

  select(key: string): void {
    this.colorChange.emit(key);
    this.open.set(false);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (this.open() && !this.elementRef.nativeElement.contains(event.target as Node)) {
      this.open.set(false);
    }
  }
}
