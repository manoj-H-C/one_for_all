import { Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CommentService } from '../../core/services/comment.service';
import { CommentResponse } from '../../core/models/comment.model';
import { MemberResponse } from '../../core/models/member.model';
import { AuthStore } from '../../core/state/auth-store';
import { ToastService } from '../../core/state/toast.service';
import { ConfirmDialogService } from '../../shared/ui/confirm-dialog.service';
import { AvatarComponent } from '../../shared/ui/avatar';

interface BodySegment {
  text: string;
  mention: boolean;
}

const MENTION_TRIGGER = /(?:^|\s)@([a-zA-Z0-9_.-]*)$/;

@Component({
  selector: 'app-comments-tab',
  imports: [FormsModule, DatePipe, AvatarComponent],
  template: `
    <div class="flex flex-col gap-4">
      @if (canComment()) {
        <div class="flex gap-3">
          <app-avatar [name]="authStore.currentUser()?.name ?? '?'" [size]="32" />
          <div class="flex-1">
            <div class="relative">
              <textarea
                #draftEl
                class="input"
                rows="2"
                placeholder="Add a comment… (type @ to mention someone)"
                [value]="draft()"
                (input)="onDraftInput(draftEl)"
                (keydown)="onDraftKeydown($event, draftEl)"
                (blur)="closeMentionMenu()"
              ></textarea>
              @if (mentionOptions().length > 0) {
                <div class="absolute z-20 mt-1 w-64 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
                  @for (m of mentionOptions(); track m.userId; let i = $index) {
                    <button
                      type="button"
                      class="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm hover:bg-primary-50"
                      [class.bg-primary-50]="i === mentionActiveIndex()"
                      (mousedown)="$event.preventDefault(); insertMention(draftEl, m)"
                    >
                      <app-avatar [name]="m.name" [size]="20" />
                      {{ m.name }}
                    </button>
                  }
                </div>
              }
            </div>
            <div class="mt-2 flex justify-end">
              <button type="button" class="btn-primary" [disabled]="!draft().trim()" (click)="post()">Comment</button>
            </div>
          </div>
        </div>
      }

      @for (comment of comments(); track comment.id) {
        <div class="flex gap-3">
          <app-avatar [name]="comment.authorName" [size]="32" />
          <div class="flex-1 rounded-xl border border-slate-200 bg-white p-3">
            <div class="flex items-center justify-between">
              <p class="text-sm font-medium text-slate-800">{{ comment.authorName }}</p>
              <span class="text-xs text-slate-400">{{ comment.createdAt | date: 'short' }}</span>
            </div>
            @if (editingId() === comment.id) {
              <textarea class="input mt-2" rows="2" [(ngModel)]="editDraft"></textarea>
              <div class="mt-2 flex justify-end gap-2">
                <button type="button" class="btn-secondary px-3 py-1" (click)="editingId.set(null)">Cancel</button>
                <button type="button" class="btn-primary px-3 py-1" (click)="saveEdit(comment)">Save</button>
              </div>
            } @else {
              <p class="mt-1 whitespace-pre-wrap text-sm text-slate-700">
                @for (segment of bodySegments(comment); track $index) {
                  @if (segment.mention) {
                    <span class="rounded bg-primary-50 font-medium text-primary-700">{{ segment.text }}</span>
                  } @else {
                    {{ segment.text }}
                  }
                }
              </p>
              @if (comment.authorId === authStore.currentUser()?.id) {
                <div class="mt-2 flex gap-3 text-xs text-slate-400">
                  <button type="button" class="hover:text-slate-700" (click)="startEdit(comment)">Edit</button>
                  <button type="button" class="hover:text-red-600" (click)="remove(comment)">Delete</button>
                </div>
              }
            }
          </div>
        </div>
      } @empty {
        <p class="text-sm text-slate-400">No comments yet.</p>
      }
    </div>
  `,
})
export class CommentsTabComponent implements OnInit {
  private readonly commentService = inject(CommentService);
  private readonly toast = inject(ToastService);
  private readonly confirmDialog = inject(ConfirmDialogService);

  readonly authStore = inject(AuthStore);
  readonly workItemId = input.required<string>();
  readonly canComment = input<boolean>(false);
  readonly members = input<MemberResponse[]>([]);

  readonly comments = signal<CommentResponse[]>([]);
  readonly draft = signal('');
  readonly editingId = signal<string | null>(null);
  readonly editDraft = signal('');

  private readonly mentionQuery = signal<string | null>(null);
  readonly mentionActiveIndex = signal(0);

  readonly mentionOptions = computed(() => {
    const query = this.mentionQuery();
    if (query === null) return [];
    const q = query.toLowerCase();
    return this.members()
      .filter((m) => m.name.toLowerCase().includes(q))
      .slice(0, 6);
  });

  ngOnInit(): void {
    this.load();
  }

  private load(): void {
    this.commentService.list(this.workItemId()).subscribe((comments) => this.comments.set(comments));
  }

  bodySegments(comment: CommentResponse): BodySegment[] {
    const mentionedNames = this.members()
      .filter((m) => comment.mentionedUserIds.includes(m.userId))
      .map((m) => m.name)
      .sort((a, b) => b.length - a.length); // longest first so a shorter name can't shadow-match inside a longer one
    if (mentionedNames.length === 0) return [{ text: comment.body, mention: false }];

    const pattern = new RegExp(`@(${mentionedNames.map(escapeRegExp).join('|')})`, 'g');
    const segments: BodySegment[] = [];
    let lastIndex = 0;
    for (const match of comment.body.matchAll(pattern)) {
      if (match.index! > lastIndex) segments.push({ text: comment.body.slice(lastIndex, match.index), mention: false });
      segments.push({ text: match[0], mention: true });
      lastIndex = match.index! + match[0].length;
    }
    if (lastIndex < comment.body.length) segments.push({ text: comment.body.slice(lastIndex), mention: false });
    return segments;
  }

  onDraftInput(el: HTMLTextAreaElement): void {
    this.draft.set(el.value);
    this.updateMentionState(el);
  }

  onDraftKeydown(event: KeyboardEvent, el: HTMLTextAreaElement): void {
    const options = this.mentionOptions();
    if (options.length === 0) return;
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.mentionActiveIndex.set((this.mentionActiveIndex() + 1) % options.length);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.mentionActiveIndex.set((this.mentionActiveIndex() - 1 + options.length) % options.length);
    } else if (event.key === 'Enter' || event.key === 'Tab') {
      event.preventDefault();
      this.insertMention(el, options[this.mentionActiveIndex()]);
    } else if (event.key === 'Escape') {
      this.mentionQuery.set(null);
    }
  }

  closeMentionMenu(): void {
    // deferred so a mention option's (mousedown) still fires before the menu disappears
    setTimeout(() => this.mentionQuery.set(null), 150);
  }

  insertMention(el: HTMLTextAreaElement, member: MemberResponse): void {
    const cursor = el.selectionStart ?? el.value.length;
    const beforeCursor = el.value.slice(0, cursor);
    const afterCursor = el.value.slice(cursor);
    const match = beforeCursor.match(MENTION_TRIGGER);
    if (!match) return;

    const mentionStart = beforeCursor.length - match[0].length + (match[0].startsWith(' ') ? 1 : 0);
    const newBefore = beforeCursor.slice(0, mentionStart) + '@' + member.name + ' ';
    const newValue = newBefore + afterCursor;

    this.draft.set(newValue);
    this.mentionQuery.set(null);
    setTimeout(() => {
      el.value = newValue;
      el.focus();
      el.setSelectionRange(newBefore.length, newBefore.length);
    });
  }

  private updateMentionState(el: HTMLTextAreaElement): void {
    const cursor = el.selectionStart ?? el.value.length;
    const match = el.value.slice(0, cursor).match(MENTION_TRIGGER);
    if (match) {
      this.mentionQuery.set(match[1]);
      this.mentionActiveIndex.set(0);
    } else {
      this.mentionQuery.set(null);
    }
  }

  private mentionedUserIdsIn(body: string): string[] {
    const ids = new Set<string>();
    for (const m of this.members()) {
      if (body.includes('@' + m.name)) ids.add(m.userId);
    }
    return [...ids];
  }

  post(): void {
    const body = this.draft().trim();
    if (!body) return;
    const mentionedUserIds = this.mentionedUserIdsIn(body);
    this.commentService
      .create(this.workItemId(), { body, mentionedUserIds: mentionedUserIds.length > 0 ? mentionedUserIds : undefined })
      .subscribe({
        next: (comment) => {
          this.comments.update((list) => [...list, comment]);
          this.draft.set('');
        },
        error: (err) => this.toast.error(err.message),
      });
  }

  startEdit(comment: CommentResponse): void {
    this.editingId.set(comment.id);
    this.editDraft.set(comment.body);
  }

  saveEdit(comment: CommentResponse): void {
    const body = this.editDraft().trim();
    if (!body) return;
    this.commentService.update(comment.id, { body }).subscribe({
      next: (updated) => {
        this.comments.update((list) => list.map((c) => (c.id === updated.id ? updated : c)));
        this.editingId.set(null);
      },
      error: (err) => this.toast.error(err.message),
    });
  }

  async remove(comment: CommentResponse): Promise<void> {
    const confirmed = await this.confirmDialog.confirm('Delete this comment? This cannot be undone.', {
      title: 'Delete comment',
      confirmLabel: 'Delete',
    });
    if (!confirmed) return;
    this.commentService.delete(comment.id).subscribe({
      next: () => this.comments.update((list) => list.filter((c) => c.id !== comment.id)),
      error: (err) => this.toast.error(err.message),
    });
  }
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
