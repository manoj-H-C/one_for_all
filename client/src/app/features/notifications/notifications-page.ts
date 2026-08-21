import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { NotificationService } from '../../core/services/notification.service';
import { NotificationBellService } from '../../core/state/notification-bell.service';
import { NotificationResponse } from '../../core/models/notification.model';
import { NotificationType } from '../../core/models/common.model';
import { Page } from '../../core/models/common.model';
import { EmptyStateComponent } from '../../shared/ui/empty-state';
import { PaginationComponent } from '../../shared/ui/pagination';
import { AvatarComponent } from '../../shared/ui/avatar';
import { IconComponent, IconName } from '../../shared/ui/icon';

interface NotificationTypeMeta {
  icon: IconName;
  bg: string;
  text: string;
}

const NOTIFICATION_TYPE_META: Record<NotificationType, NotificationTypeMeta> = {
  ASSIGNED: { icon: 'user', bg: 'bg-sky-500', text: 'text-white' },
  MENTIONED: { icon: 'at', bg: 'bg-fuchsia-500', text: 'text-white' },
  STATUS_CHANGED: { icon: 'workflow', bg: 'bg-amber-500', text: 'text-white' },
  COMMENT_ADDED: { icon: 'message', bg: 'bg-violet-500', text: 'text-white' },
  SUPPLY_REQUEST_APPROVED: { icon: 'building', bg: 'bg-emerald-500', text: 'text-white' },
  SUPPLY_REQUEST_REJECTED: { icon: 'building', bg: 'bg-red-500', text: 'text-white' },
  SUPPLY_REQUEST_FULFILLED: { icon: 'building', bg: 'bg-sky-500', text: 'text-white' },
  REMINDER: { icon: 'bell', bg: 'bg-amber-500', text: 'text-white' },
  REPORTER_ASSIGNED: { icon: 'at', bg: 'bg-violet-500', text: 'text-white' },
};

@Component({
  selector: 'app-notifications-page',
  imports: [DatePipe, RouterLink, EmptyStateComponent, PaginationComponent, AvatarComponent, IconComponent],
  template: `
    <div class="mx-auto flex max-w-2xl flex-col gap-6 animate-fade-in">
      <div class="flex flex-wrap items-center justify-between gap-4">
        <div class="flex items-center gap-3.5">
          <span
            class="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-white"
            style="background: linear-gradient(135deg, #a78bfa, #22d3ee); box-shadow: 0 6px 16px -4px rgb(139 92 246 / 0.45)"
          >
            <app-icon name="bell" [size]="20" />
            @if (bell.unreadCount() > 0) {
              <span
                class="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-bold text-white ring-2 ring-white"
                style="background: linear-gradient(135deg, #fb7185, #e11d48)"
              >
                {{ bell.unreadCount() > 9 ? '9+' : bell.unreadCount() }}
              </span>
            }
          </span>
          <div>
            <h1 class="text-[26px] font-bold tracking-tight text-slate-900">Notifications</h1>
            <p class="mt-0.5 text-sm text-slate-500">
              @if (page()) {
                {{ page()!.totalElements }} {{ unreadOnly() ? 'unread' : 'total' }}
              }
            </p>
          </div>
        </div>

        <div class="flex flex-wrap items-center gap-2.5">
          <div class="flex items-center gap-1 rounded-xl bg-slate-100 p-1">
            <button
              type="button"
              class="rounded-lg px-3.5 py-1.5 text-sm font-semibold transition-all"
              [class.bg-white]="!unreadOnly()"
              [class.text-slate-900]="!unreadOnly()"
              [class.shadow]="!unreadOnly()"
              [class.text-slate-500]="unreadOnly()"
              (click)="setUnreadOnly(false)"
            >
              All
            </button>
            <button
              type="button"
              class="flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-sm font-semibold transition-all"
              [class.bg-white]="unreadOnly()"
              [class.text-slate-900]="unreadOnly()"
              [class.shadow]="unreadOnly()"
              [class.text-slate-500]="!unreadOnly()"
              (click)="setUnreadOnly(true)"
            >
              Unread
              @if (bell.unreadCount() > 0) {
                <span class="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary-600 px-1 text-[10px] font-bold text-white">
                  {{ bell.unreadCount() > 9 ? '9+' : bell.unreadCount() }}
                </span>
              }
            </button>
          </div>
          <button type="button" class="btn-secondary" [disabled]="bell.unreadCount() === 0" (click)="markAllRead()">
            <app-icon name="check" [size]="15" />
            Mark all read
          </button>
        </div>
      </div>

      @if ((page()?.content?.length ?? 0) === 0) {
        @if (unreadOnly()) {
          <app-empty-state icon="🎉" title="You're all caught up!" description="No unread notifications right now." />
        } @else {
          <app-empty-state icon="🔔" title="No notifications yet" description="You'll see assignment, mention, and status-change alerts here." />
        }
      } @else {
        <div class="flex flex-col gap-2.5">
          @for (n of page()!.content; track n.id) {
            <a
              [routerLink]="n.workItemId ? ['/work-items', n.workItemId] : null"
              class="card-hover group relative flex items-start gap-3.5 p-4"
              [class.border-l-4]="!n.read"
              [class.border-l-primary-500]="!n.read"
              [class.bg-primary-50/40]="!n.read"
            >
              <div class="relative shrink-0">
                <app-avatar [name]="n.actorName" [size]="40" />
                <span
                  class="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full ring-2 ring-white {{ typeMeta(n.type).bg }} {{ typeMeta(n.type).text }}"
                >
                  <app-icon [name]="typeMeta(n.type).icon" [size]="11" [strokeWidth]="2" />
                </span>
              </div>

              <div class="min-w-0 flex-1">
                <p class="text-sm leading-snug text-slate-600" [class.font-semibold]="!n.read" [class.text-slate-900]="!n.read">
                  {{ n.message }}
                </p>
                <p class="mt-1.5 flex items-center gap-1.5 text-xs text-slate-400">
                  <app-icon name="calendar" [size]="12" />
                  {{ n.createdAt | date: 'MMM d, h:mm a' }}
                </p>
              </div>

              @if (!n.read) {
                <button
                  type="button"
                  class="shrink-0 self-center rounded-lg p-2 text-slate-300 opacity-0 transition-all duration-150 hover:bg-primary-100 hover:text-primary-700 group-hover:opacity-100"
                  title="Mark as read"
                  (click)="markRead(n, $event)"
                >
                  <app-icon name="check" [size]="16" />
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

  readonly bell = inject(NotificationBellService);
  readonly page = signal<Page<NotificationResponse> | null>(null);
  readonly unreadOnly = signal(false);

  protected readonly typeMeta = (type: NotificationType): NotificationTypeMeta => NOTIFICATION_TYPE_META[type];

  ngOnInit(): void {
    this.load(0);
  }

  load(pageNumber: number): void {
    this.notificationService.list(this.unreadOnly(), pageNumber, 20).subscribe((data) => this.page.set(data));
  }

  setUnreadOnly(value: boolean): void {
    if (this.unreadOnly() === value) return;
    this.unreadOnly.set(value);
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
