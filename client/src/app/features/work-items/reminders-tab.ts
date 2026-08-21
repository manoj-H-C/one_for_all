import { Component, OnInit, inject, input, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReminderService } from '../../core/services/reminder.service';
import { ReminderResponse } from '../../core/models/reminder.model';
import { ToastService } from '../../core/state/toast.service';
import { IconComponent } from '../../shared/ui/icon';

@Component({
  selector: 'app-reminders-tab',
  imports: [FormsModule, DatePipe, IconComponent],
  template: `
    <div class="flex flex-col gap-4">
      <div class="flex flex-col gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 sm:flex-row sm:items-end">
        <div class="flex-1">
          <label class="mb-1 block text-xs font-medium text-slate-500" for="remindAt">Remind me at</label>
          <input id="remindAt" type="datetime-local" class="input" [(ngModel)]="remindAtInput" />
        </div>
        <div class="flex-1">
          <label class="mb-1 block text-xs font-medium text-slate-500" for="remindNote">Note (optional)</label>
          <input id="remindNote" type="text" class="input" placeholder="Follow up on pricing…" [(ngModel)]="note" (keyup.enter)="create()" />
        </div>
        <button type="button" class="btn-primary shrink-0" [disabled]="creating()" (click)="create()">
          {{ creating() ? 'Setting…' : 'Set reminder' }}
        </button>
      </div>

      @if (reminders().length === 0) {
        <p class="text-sm text-slate-400">No reminders set on this item.</p>
      } @else {
        <div class="flex flex-col divide-y divide-slate-100">
          @for (r of reminders(); track r.id) {
            <div class="flex items-start justify-between gap-3 py-2.5">
              <div class="min-w-0 flex-1">
                <p class="text-sm text-slate-700">
                  <span class="font-medium">{{ r.remindAt | date: 'medium' }}</span>
                  @if (r.note) { — {{ r.note }} }
                </p>
                <span
                  class="mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold {{
                    r.status === 'PENDING' ? 'bg-amber-100 text-amber-700' : r.status === 'SENT' ? 'bg-sky-100 text-sky-700' : 'bg-slate-100 text-slate-500'
                  }}"
                >
                  {{ r.status }}
                </span>
              </div>
              @if (r.status !== 'DISMISSED') {
                <button type="button" class="shrink-0 rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700" title="Dismiss" (click)="dismiss(r)">
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
export class RemindersTabComponent implements OnInit {
  private readonly reminderService = inject(ReminderService);
  private readonly toast = inject(ToastService);

  readonly workItemId = input.required<string>();

  readonly reminders = signal<ReminderResponse[]>([]);
  readonly remindAtInput = signal('');
  readonly note = signal('');
  readonly creating = signal(false);

  ngOnInit(): void {
    this.load();
  }

  private load(): void {
    this.reminderService.listForWorkItem(this.workItemId()).subscribe((reminders) => this.reminders.set(reminders));
  }

  create(): void {
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

    this.creating.set(true);
    this.reminderService
      .create(this.workItemId(), { remindAt: remindAt.toISOString(), note: this.note().trim() || null })
      .subscribe({
        next: (reminder) => {
          this.creating.set(false);
          this.remindAtInput.set('');
          this.note.set('');
          this.reminders.update((list) => [...list, reminder].sort((a, b) => a.remindAt.localeCompare(b.remindAt)));
          this.toast.success('Reminder set');
        },
        error: (err) => {
          this.creating.set(false);
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
