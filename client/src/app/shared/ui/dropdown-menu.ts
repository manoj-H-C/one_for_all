import { Component, ElementRef, HostListener, input, signal } from '@angular/core';

@Component({
  selector: 'app-dropdown-menu',
  template: `
    <div class="relative">
      <button type="button" class="w-full cursor-pointer" (click)="toggle()">
        <ng-content select="[trigger]"></ng-content>
      </button>
      @if (isOpen()) {
        <div
          class="absolute z-30 mt-2 rounded-xl border border-slate-200 bg-white py-1 shadow-lg"
          [class.left-0]="align() === 'left'"
          [class.right-0]="align() === 'right'"
          [style.min-width.px]="minWidth()"
          (click)="closeOnSelect() && close()"
        >
          <ng-content select="[menu]"></ng-content>
        </div>
      }
    </div>
  `,
})
export class DropdownMenuComponent {
  readonly minWidth = input<number>(180);
  /** Which edge of the trigger the menu panel hangs from. Use 'left' for triggers near the left edge of the viewport (e.g. the sidebar) so the panel opens rightward instead of running off-screen. */
  readonly align = input<'left' | 'right'>('right');
  /** Set to false for panels with their own interactive controls (search boxes, nested dropdowns) that shouldn't dismiss the panel on every click. */
  readonly closeOnSelect = input<boolean>(true);
  readonly isOpen = signal(false);

  constructor(private readonly elementRef: ElementRef<HTMLElement>) {}

  toggle(): void {
    this.isOpen.update((v) => !v);
  }

  close(): void {
    this.isOpen.set(false);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (this.isOpen() && !this.elementRef.nativeElement.contains(event.target as Node)) {
      this.isOpen.set(false);
    }
  }
}
