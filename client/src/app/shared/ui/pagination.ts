import { Component, computed, input, output } from '@angular/core';

@Component({
  selector: 'app-pagination',
  template: `
    @if (totalPages() > 1) {
      <div class="flex items-center justify-between gap-4 pt-2">
        <p class="text-xs text-slate-500">Page {{ page() + 1 }} of {{ totalPages() }} · {{ totalElements() }} total</p>
        <div class="flex gap-2">
          <button type="button" class="btn-secondary px-3 py-1.5" [disabled]="page() === 0" (click)="pageChange.emit(page() - 1)">
            Prev
          </button>
          <button
            type="button"
            class="btn-secondary px-3 py-1.5"
            [disabled]="page() >= totalPages() - 1"
            (click)="pageChange.emit(page() + 1)"
          >
            Next
          </button>
        </div>
      </div>
    }
  `,
})
export class PaginationComponent {
  readonly page = input.required<number>();
  readonly totalPages = input.required<number>();
  readonly totalElements = input<number>(0);
  readonly pageChange = output<number>();

  protected readonly hasPages = computed(() => this.totalPages() > 1);
}
