import { Component, OnInit, inject, input, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AttachmentService } from '../../core/services/attachment.service';
import { AttachmentResponse } from '../../core/models/attachment.model';
import { AuthStore } from '../../core/state/auth-store';
import { ToastService } from '../../core/state/toast.service';
import { ConfirmDialogService } from '../../shared/ui/confirm-dialog.service';

@Component({
  selector: 'app-attachments-tab',
  imports: [FormsModule, DatePipe],
  template: `
    <div class="flex flex-col gap-4">
      <p class="text-xs text-slate-500">
        This only stores a link — upload the file to your own hosting (S3, a shared drive, etc.) first, then paste the URL here.
      </p>

      @if (canEdit()) {
        <div class="flex flex-col flex-wrap gap-2 rounded-xl border border-slate-200 p-3 sm:flex-row sm:items-end">
          <div class="min-w-[180px] flex-1">
            <label class="label">File URL</label>
            <input type="url" class="input" placeholder="https://…" [(ngModel)]="fileUrl" />
          </div>
          <div class="flex-1">
            <label class="label">File name (optional)</label>
            <input type="text" class="input" [(ngModel)]="fileName" />
          </div>
          <button type="button" class="btn-primary" [disabled]="!fileUrl().trim()" (click)="add()">Attach</button>
        </div>
      }

      @for (attachment of attachments(); track attachment.id) {
        <div class="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 p-3">
          <div class="min-w-0 break-all">
            <a [href]="attachment.fileUrl" target="_blank" rel="noopener" class="text-sm font-medium text-primary-700 hover:underline">
              {{ attachment.fileName || attachment.fileUrl }}
            </a>
            <p class="text-xs text-slate-400">
              {{ attachment.uploadedByName }} · {{ attachment.createdAt | date: 'short' }}
            </p>
          </div>
          @if (attachment.uploadedById === authStore.currentUser()?.id || canEdit()) {
            <button type="button" class="shrink-0 text-xs text-slate-400 hover:text-red-600" (click)="remove(attachment)">Delete</button>
          }
        </div>
      } @empty {
        <p class="text-sm text-slate-400">No attachments yet.</p>
      }
    </div>
  `,
})
export class AttachmentsTabComponent implements OnInit {
  private readonly attachmentService = inject(AttachmentService);
  private readonly toast = inject(ToastService);
  private readonly confirmDialog = inject(ConfirmDialogService);

  readonly authStore = inject(AuthStore);
  readonly workItemId = input.required<string>();
  readonly canEdit = input<boolean>(false);

  readonly attachments = signal<AttachmentResponse[]>([]);
  readonly fileUrl = signal('');
  readonly fileName = signal('');

  ngOnInit(): void {
    this.attachmentService.list(this.workItemId()).subscribe((list) => this.attachments.set(list));
  }

  add(): void {
    const fileUrl = this.fileUrl().trim();
    if (!fileUrl) return;
    this.attachmentService.create(this.workItemId(), { fileUrl, fileName: this.fileName().trim() || null }).subscribe({
      next: (attachment) => {
        this.attachments.update((list) => [attachment, ...list]);
        this.fileUrl.set('');
        this.fileName.set('');
      },
      error: (err) => this.toast.error(err.message),
    });
  }

  async remove(attachment: AttachmentResponse): Promise<void> {
    const confirmed = await this.confirmDialog.confirm('Remove this attachment reference?', { title: 'Delete attachment', confirmLabel: 'Delete' });
    if (!confirmed) return;
    this.attachmentService.delete(attachment.id).subscribe({
      next: () => this.attachments.update((list) => list.filter((a) => a.id !== attachment.id)),
      error: (err) => this.toast.error(err.message),
    });
  }
}
