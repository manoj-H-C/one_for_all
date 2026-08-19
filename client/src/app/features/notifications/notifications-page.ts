import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { NotificationService } from '../../core/services/notification.service';
import { NotificationBellService } from '../../core/state/notification-bell.service';
import { NotificationResponse } from '../../core/models/notification.model';
import { Page } from '../../core/models/common.model';
import { EmptyStateComponent } from '../../shared/ui/empty-state';
import { PaginationComponent } from '../../shared/ui/pagination';

@Component({
  selector: 'app-notifications-page',
  imports: [DatePipe, RouterLink, EmptyStateComponent, PaginationComponent],
  template: `
    <div class="mx-auto max-w-2xl">
      <div class="mb-6 flex items-center justify-between">
        <h1 class="text-2xl font-semibold text-slate-900">Notifications</h1>
        <div class="flex items-center gap-3">
          <label class="flex items-center gap-2 text-sm text-slate-600">
            <input type="checkbox" class="h-4 w-4 rounded border-slate-300 text-primary-600" [checked]="unreadOnly()" (change)="toggleUnread()" />
            Unread only
          </label>
          <button type="button" class="btn-secondary px-3 py-1.5" (click)="markAllRead()">Mark all read</button>
        </div>
      </div>

      @if ((page()?.content?.length ?? 0) === 0) {
        <app-empty-state icon="🔔" title="No notifications" description="You'll see assignment and status-change alerts here." />
      } @else {
        <div class="flex flex-col gap-2">
          @for (n of page()!.content; track n.id) {
            <a
              [routerLink]="n.workItemId ? ['/work-items', n.workItemId] : null"
              class="card flex items-start justify-between gap-3 p-4"
              [class.bg-primary-50]="!n.read"
            >
              <div>
                <p class="text-sm text-slate-800">{{ n.message }}</p>
                <p class="mt-1 text-xs text-slate-400">{{ n.actorName }} · {{ n.createdAt | date: 'short' }}</p>
              </div>
              @if (!n.read) {
                <button type="button" class="shrink-0 text-xs text-primary-700 hover:underline" (click)="markRead(n, $event)">
                  Mark read
                </button>
              }
            </a>
          }
        </div>
        <app-pagination [page]="page()!.number" [totalPages]="page()!.totalPages" [totalElements]="page()!.totalElements" (pageChange)="load($event)" />
      }
    </div>
  `,
})
export class NotificationsPageComponent implements OnInit {
  private readonly notificationService = inject(NotificationService);
  private readonly bell = inject(NotificationBellService);

  readonly page = signal<Page<NotificationResponse> | null>(null);
  readonly unreadOnly = signal(false);

  ngOnInit(): void {
    this.load(0);
  }

  load(pageNumber: number): void {
    this.notificationService.list(this.unreadOnly(), pageNumber, 20).subscribe((data) => this.page.set(data));
  }

  toggleUnread(): void {
    this.unreadOnly.update((v) => !v);
    this.load(0);
  }

  markRead(notification: NotificationResponse, event: Event): void {
    // the button lives inside the notification's routerLink anchor, so the
    // click must be stopped from bubbling there too, not just have its
    // default action prevented - otherwise "Mark read" also navigates away.
    event.preventDefault();
    event.stopPropagation();
    this.notificationService.markRead(notification.id).subscribe(() => {
      this.page.update((p) => (p ? { ...p, content: p.content.map((n) => (n.id === notification.id ? { ...n, read: true } : n)) } : p));
      this.bell.refreshNow();
    });
  }

  markAllRead(): void {
    this.notificationService.markAllRead().subscribe(() => {
      this.page.update((p) => (p ? { ...p, content: p.content.map((n) => ({ ...n, read: true })) } : p));
      this.bell.refreshNow();
    });
  }
}
