import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ReminderService } from '../../core/services/reminder.service';
import { ReminderResponse } from '../../core/models/reminder.model';
import { ToastService } from '../../core/state/toast.service';
import { EmptyStateComponent } from '../../shared/ui/empty-state';
import { IconComponent } from '../../shared/ui/icon';

@Component({
  selector: 'app-reminders-page',
  imports: [DatePipe, RouterLink, EmptyStateComponent, IconComponent],
  template: `
    <div class="mx-auto flex max-w-2xl flex-col gap-6 animate-fade-in">
      <div class="flex items-center gap-3.5">
        <span
          class="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-white"
          style="background: linear-gradient(135deg, #f59e0b, #f97316); box-shadow: 0 6px 16px -4px rgb(245 158 11 / 0.4)"
        >
          <app-icon name="bell" [size]="20" />
        </span>
        <div>
          <h1 class="text-[26px] font-bold tracking-tight text-slate-900">Reminders</h1>
          <p class="mt-0.5 text-sm text-slate-500">Every "remind me" you've set, across every project, soonest first.</p>
        </div>
      </div>

      <div class="card flex items-center gap-1 p-1">
        <button
          type="button"
          class="flex-1 rounded-xl px-4 py-2 text-sm font-semibold transition-colors {{
            statusFilter() === 'OPEN' ? 'bg-primary-50 text-primary-700' : 'text-slate-500 hover:bg-slate-50'
          }}"
          (click)="setFilter('OPEN')"
        >
          Upcoming
        </button>
        <button
          type="button"
          class="flex-1 rounded-xl px-4 py-2 text-sm font-semibold transition-colors {{
            statusFilter() === 'ALL' ? 'bg-primary-50 text-primary-700' : 'text-slate-500 hover:bg-slate-50'
          }}"
          (click)="setFilter('ALL')"
        >
          All
        </button>
      </div>

      @if (loading()) {
        <div class="flex flex-col gap-2">
          @for (n of [1, 2, 3]; track n) {
            <div class="h-20 animate-pulse rounded-2xl bg-slate-100"></div>
          }
        </div>
      } @else if (filteredReminders().length === 0) {
        <app-empty-state
          icon="⏰"
          title="Nothing here"
          description="Set a reminder from any work item's Reminders tab and it'll show up here."
        />
      } @else {
        <div class="flex flex-col gap-2.5">
          @for (r of filteredReminders(); track r.id) {
            <div class="card-hover flex items-start gap-3.5 p-4">
              <span
                class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl {{
                  r.status === 'PENDING' ? 'bg-amber-100 text-amber-600' : r.status === 'SENT' ? 'bg-sky-100 text-sky-600' : 'bg-slate-100 text-slate-400'
                }}"
              >
                <app-icon name="bell" [size]="17" />
              </span>
              <div class="min-w-0 flex-1">
                <a [routerLink]="['/work-items', r.workItemId]" class="text-sm font-semibold text-slate-800 hover:text-primary-600">{{ r.workItemTitle }}</a>
                <p class="mt-0.5 text-xs text-slate-400">{{ r.projectName }}</p>
                @if (r.note) {
                  <p class="mt-1.5 text-sm text-slate-600">{{ r.note }}</p>
                }
                <p class="mt-1.5 flex items-center gap-1.5 text-xs text-slate-400">
                  <app-icon name="calendar" [size]="12" />
                  {{ r.remindAt | date: 'MMM d, y · h:mm a' }}
                </p>
              </div>
              <span
                class="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold {{
                  r.status === 'PENDING' ? 'bg-amber-100 text-amber-700' : r.status === 'SENT' ? 'bg-sky-100 text-sky-700' : 'bg-slate-100 text-slate-500'
                }}"
              >
                {{ r.status }}
              </span>
              @if (r.status !== 'DISMISSED') {
                <button
                  type="button"
                  class="shrink-0 rounded-lg p-1.5 text-slate-300 transition-colors hover:bg-slate-100 hover:text-slate-700"
                  title="Dismiss"
                  (click)="dismiss(r)"
                >
                  <app-icon name="check" [size]="14" />
                </button>
              }
            </div>
          }
        </div>
      }
    </div>
  `,
})
export class RemindersPageComponent implements OnInit {
  private readonly reminderService = inject(ReminderService);
  private readonly toast = inject(ToastService);

  readonly loading = signal(true);
  readonly reminders = signal<ReminderResponse[]>([]);
  readonly statusFilter = signal<'OPEN' | 'ALL'>('OPEN');

  readonly filteredReminders = computed(() =>
    this.statusFilter() === 'ALL' ? this.reminders() : this.reminders().filter((r) => r.status !== 'DISMISSED'),
  );

  ngOnInit(): void {
    this.reminderService.listMine().subscribe({
      next: (reminders) => {
        this.reminders.set(reminders);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.toast.error(err.message);
      },
    });
  }

  setFilter(filter: 'OPEN' | 'ALL'): void {
    this.statusFilter.set(filter);
  }

  dismiss(reminder: ReminderResponse): void {
    this.reminderService.dismiss(reminder.id).subscribe({
      next: () => {
        this.reminders.update((list) => list.map((r) => (r.id === reminder.id ? { ...r, status: 'DISMISSED' as const } : r)));
      },
      error: (err) => this.toast.error(err.message),
    });
  }
}
