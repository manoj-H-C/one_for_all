import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ReminderService } from '../../core/services/reminder.service';
import { ReminderCreateRequest, ReminderResponse } from '../../core/models/reminder.model';
import { ToastService } from '../../core/state/toast.service';
import { EmptyStateComponent } from '../../shared/ui/empty-state';
import { IconComponent } from '../../shared/ui/icon';

const STATUS_STYLE: Record<ReminderResponse['status'], { badge: string; icon: string }> = {
  PENDING: { badge: 'bg-amber-100 text-amber-700', icon: 'bg-amber-100 text-amber-600' },
  SENT: { badge: 'bg-sky-100 text-sky-700', icon: 'bg-sky-100 text-sky-600' },
  DISMISSED: { badge: 'bg-slate-100 text-slate-500', icon: 'bg-slate-100 text-slate-400' },
};

/** ISO instant -> the local "yyyy-MM-ddThh:mm" a <input type="datetime-local"> expects, in the browser's own timezone. */
function toLocalInputValue(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

@Component({
  selector: 'app-reminders-page',
  imports: [DatePipe, FormsModule, RouterLink, EmptyStateComponent, IconComponent],
  template: `
    <div class="mx-auto flex max-w-4xl flex-col gap-5 animate-fade-in">
      <div class="flex flex-wrap items-center justify-between gap-3">
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
        <button type="button" class="btn-primary shrink-0" (click)="openComposerForCreate()">
          <app-icon name="plus" [size]="15" />
          New reminder
        </button>
      </div>

      @if (composerOpen()) {
        <div class="card flex flex-col gap-3 p-5">
          <div class="flex items-center justify-between">
            <p class="text-sm font-semibold text-slate-800">{{ editingId() ? 'Edit reminder' : 'New reminder' }}</p>
            <button
              type="button"
              class="flex h-6 w-6 items-center justify-center rounded-lg text-lg leading-none text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
              title="Close"
              (click)="closeComposer()"
            >
              &times;
            </button>
          </div>

          @if (editingWorkItemTitle(); as workItemTitle) {
            <div>
              <p class="mb-1.5 text-xs font-medium text-slate-500">About</p>
              <p class="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-600">{{ workItemTitle }}</p>
            </div>
          } @else {
            <div>
              <label class="mb-1.5 block text-xs font-medium text-slate-500" for="title">What should we remind you about?</label>
              <input
                id="title"
                type="text"
                class="input"
                placeholder="Follow up with the vendor about pricing…"
                [(ngModel)]="title"
                (keyup.enter)="save()"
              />
            </div>
          }

          <div class="flex flex-col gap-3 sm:flex-row">
            <div class="flex-1">
              <label class="mb-1.5 block text-xs font-medium text-slate-500" for="remindAt">Due at</label>
              <input id="remindAt" type="datetime-local" class="input" [(ngModel)]="remindAtInput" />
              <p class="mt-1 text-xs text-slate-400">You'll be notified 10 minutes before this time.</p>
            </div>
            <div class="flex-1">
              <label class="mb-1.5 block text-xs font-medium text-slate-500" for="note">Note (optional)</label>
              <input id="note" type="text" class="input" placeholder="Any extra detail…" [(ngModel)]="note" (keyup.enter)="save()" />
            </div>
          </div>
          <div class="mt-1 flex justify-end gap-2">
            <button type="button" class="btn-secondary" (click)="closeComposer()">Cancel</button>
            <button type="button" class="btn-primary" [disabled]="saving()" (click)="save()">
              {{ saving() ? 'Saving…' : editingId() ? 'Save changes' : 'Set reminder' }}
            </button>
          </div>
        </div>
      }

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
        <div class="flex flex-col gap-2.5">
          @for (n of [1, 2, 3]; track n) {
            <div class="h-[4.5rem] animate-pulse rounded-2xl bg-slate-100"></div>
          }
        </div>
      } @else if (filteredReminders().length === 0) {
        <app-empty-state
          icon="⏰"
          title="Nothing here"
          description="Set one from any work item's Reminders tab, or click New reminder above for anything else you need to remember."
        />
      } @else {
        <div class="flex flex-col gap-2.5">
          @for (r of filteredReminders(); track r.id) {
            <div class="card-hover flex flex-wrap items-center gap-x-5 gap-y-3 p-4 sm:p-5">
              <span class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl {{ statusStyle(r).icon }}">
                <app-icon name="bell" [size]="18" />
              </span>

              <div class="min-w-0 flex-1 basis-64">
                <div class="flex flex-wrap items-baseline gap-x-2">
                  @if (r.workItemId) {
                    <a [routerLink]="['/work-items', r.workItemId]" class="text-sm font-semibold text-slate-800 hover:text-primary-600">{{ r.title }}</a>
                  } @else {
                    <p class="text-sm font-semibold text-slate-800">{{ r.title }}</p>
                  }
                  @if (r.projectName) {
                    <span class="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500">{{ r.projectName }}</span>
                  }
                </div>
                @if (r.note) {
                  <p class="mt-1 text-sm text-slate-500">{{ r.note }}</p>
                }
              </div>

              <div class="flex shrink-0 items-center gap-4 sm:ml-auto">
                <p class="flex items-center gap-1.5 whitespace-nowrap text-xs text-slate-400">
                  <app-icon name="calendar" [size]="13" />
                  {{ r.remindAt | date: 'MMM d, y · h:mm a' }}
                </p>
                <span class="shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold {{ statusStyle(r).badge }}">
                  {{ r.status }}
                </span>
                @if (r.status === 'PENDING') {
                  <button type="button" class="btn-secondary shrink-0 !px-3 !py-1.5 text-xs" (click)="openComposerForEdit(r)">
                    <app-icon name="edit" [size]="13" />
                    Edit
                  </button>
                }
                @if (r.status !== 'DISMISSED') {
                  <button type="button" class="btn-secondary shrink-0 !px-3 !py-1.5 text-xs" (click)="dismiss(r)">
                    <app-icon name="check" [size]="13" />
                    Dismiss
                  </button>
                }
              </div>
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

  readonly composerOpen = signal(false);
  // non-null while editing an existing reminder rather than creating a new one
  readonly editingId = signal<string | null>(null);
  // set only when editing a work-item-scoped reminder - its title comes from
  // the work item and isn't user-editable, so the composer shows it read-only
  // instead of the free-text title field.
  readonly editingWorkItemTitle = signal<string | null>(null);

  readonly title = signal('');
  readonly remindAtInput = signal('');
  readonly note = signal('');
  readonly saving = signal(false);

  readonly filteredReminders = computed(() =>
    this.statusFilter() === 'ALL' ? this.reminders() : this.reminders().filter((r) => r.status !== 'DISMISSED'),
  );

  protected readonly statusStyle = (r: ReminderResponse) => STATUS_STYLE[r.status];

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

  openComposerForCreate(): void {
    this.editingId.set(null);
    this.editingWorkItemTitle.set(null);
    this.title.set('');
    this.remindAtInput.set('');
    this.note.set('');
    this.composerOpen.set(true);
  }

  openComposerForEdit(reminder: ReminderResponse): void {
    this.editingId.set(reminder.id);
    this.editingWorkItemTitle.set(reminder.workItemId ? reminder.title : null);
    this.title.set(reminder.workItemId ? '' : reminder.title);
    this.remindAtInput.set(toLocalInputValue(reminder.remindAt));
    this.note.set(reminder.note ?? '');
    this.composerOpen.set(true);
  }

  closeComposer(): void {
    this.composerOpen.set(false);
    this.editingId.set(null);
    this.editingWorkItemTitle.set(null);
  }

  save(): void {
    const isEditingWorkItemReminder = this.editingId() !== null && this.editingWorkItemTitle() !== null;
    if (!isEditingWorkItemReminder && !this.title().trim()) {
      this.toast.error('Say what this reminder is about');
      return;
    }
    const raw = this.remindAtInput();
    if (!raw) {
      this.toast.error('Pick a date and time');
      return;
    }
    const remindAt = new Date(raw);
    if (Number.isNaN(remindAt.getTime()) || remindAt.getTime() <= Date.now()) {
      this.toast.error('Reminder time must be in the future');
      return;
    }

    const request: ReminderCreateRequest = {
      title: isEditingWorkItemReminder ? null : this.title().trim(),
      remindAt: remindAt.toISOString(),
      note: this.note().trim() || null,
    };

    this.saving.set(true);
    const editingId = this.editingId();
    const request$ = editingId ? this.reminderService.update(editingId, request) : this.reminderService.createStandalone(request);
    request$.subscribe({
      next: (reminder) => {
        this.saving.set(false);
        this.closeComposer();
        this.reminders.update((list) => {
          const withoutThis = list.filter((r) => r.id !== reminder.id);
          return [...withoutThis, reminder].sort((a, b) => a.remindAt.localeCompare(b.remindAt));
        });
        this.toast.success(editingId ? 'Reminder updated' : 'Reminder set');
      },
      error: (err) => {
        this.saving.set(false);
        this.toast.error(err.message);
      },
    });
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
