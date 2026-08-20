import { Injectable, inject, signal } from '@angular/core';
import { Subscription, interval, startWith, switchMap, tap } from 'rxjs';
import { NotificationResponse } from '../models/notification.model';
import { NotificationService } from '../services/notification.service';

const POLL_MS = 30_000;

@Injectable({ providedIn: 'root' })
export class NotificationBellService {
  private readonly notificationService = inject(NotificationService);
  private subscription: Subscription | null = null;

  readonly unreadCount = signal(0);
  readonly recent = signal<NotificationResponse[]>([]);

  start(): void {
    if (this.subscription) return;
    this.subscription = interval(POLL_MS)
      .pipe(
        startWith(0),
        switchMap(() => this.notificationService.list(true, 0, 5)),
        tap((page) => {
          this.unreadCount.set(page.totalElements);
          this.recent.set(page.content);
        }),
      )
      .subscribe();
  }

  stop(): void {
    this.subscription?.unsubscribe();
    this.subscription = null;
    this.unreadCount.set(0);
    this.recent.set([]);
  }

  refreshNow(): void {
    this.notificationService.list(true, 0, 5).subscribe((page) => {
      this.unreadCount.set(page.totalElements);
      this.recent.set(page.content);
    });
  }
}
