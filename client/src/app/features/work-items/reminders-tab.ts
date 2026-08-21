import { Component, OnInit, inject, input, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReminderService } from '../../core/services/reminder.service';
import { ReminderResponse } from '../../core/models/reminder.model';
import { ToastService } from '../../core/state/toast.service';
import { IconComponent } from '../../shared/ui/icon';

/** ISO instant -> the local "yyyy-MM-ddThh:mm" a <input type="datetime-local"> expects, in the browser's own timezone. */
function toLocalInputValue(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

@Component({
  selector: 'app-reminders-tab',
  imports: [FormsModule, DatePipe, IconComponent],
  template: `
    <div class="flex flex-col gap-4">
      <div class="flex flex-col gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
        @if (editingId()) {
          <p class="flex items-center gap-1.5 text-xs font-semibold text-primary-700">
            <app-icon name="edit" [size]="12" />
            Editing reminder
          </p>
        }
        <div class="flex flex-col gap-2 sm:flex-row sm:items-end">
          <div class="flex-1">
            <label class="mb-1 block text-xs font-medium text-slate-500" for="remindAt">Due at</label>
            <input id="remindAt" type="datetime-local" class="input" [(ngModel)]="remindAtInput" />
            <p class="mt-1 text-xs text-slate-400">You'll be notified 10 minutes before this time.</p>
          </div>
          <div class="flex-1">
            <label class="mb-1 block text-xs font-medium text-slate-500" for="remindNote">Note (optional)</label>
            <input id="remindNote" type="text" class="input" placeholder="Follow up on pricing…" [(ngModel)]="note" (keyup.enter)="save()" />
          </div>
          @if (editingId()) {
            <button type="button" class="btn-secondary shrink-0" (click)="cancelEdit()">Cancel</button>
          }
          <button type="button" class="btn-primary shrink-0" [disabled]="saving()" (click)="save()">
            {{ saving() ? 'Saving…' : editingId() ? 'Save changes' : 'Set reminder' }}
          </button>
        </div>
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
              <div class="flex shrink-0 items-center gap-2">
                @if (r.status === 'PENDING') {
                  <button type="button" class="btn-secondary shrink-0 !px-3 !py-1.5 text-xs" (click)="startEdit(r)">
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
export class RemindersTabComponent implements OnInit {
  private readonly reminderService = inject(ReminderService);
  private readonly toast = inject(ToastService);

  readonly workItemId = input.required<string>();

  readonly reminders = signal<ReminderResponse[]>([]);
  readonly remindAtInput = signal('');
  readonly note = signal('');
  readonly saving = signal(false);
  readonly editingId = signal<string | null>(null);

  ngOnInit(): void {
    this.load();
  }

  private load(): void {
    this.reminderService.listForWorkItem(this.workItemId()).subscribe((reminders) => this.reminders.set(reminders));
  }

  startEdit(reminder: ReminderResponse): void {
    this.editingId.set(reminder.id);
    this.remindAtInput.set(toLocalInputValue(reminder.remindAt));
    this.note.set(reminder.note ?? '');
  }

  cancelEdit(): void {
    this.editingId.set(null);
    this.remindAtInput.set('');
    this.note.set('');
  }

  save(): void {
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

    this.saving.set(true);
    const editingId = this.editingId();
    const request$ = editingId
      ? this.reminderService.update(editingId, { remindAt: remindAt.toISOString(), note: this.note().trim() || null })
      : this.reminderService.create(this.workItemId(), { remindAt: remindAt.toISOString(), note: this.note().trim() || null });
    request$.subscribe({
      next: (reminder) => {
        this.saving.set(false);
        this.editingId.set(null);
        this.remindAtInput.set('');
        this.note.set('');
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
