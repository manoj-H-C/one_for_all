import { Injectable, inject, signal } from '@angular/core';
import { API_BASE_URL } from '../config/api.config';
import { NotificationResponse } from '../models/notification.model';
import { NotificationService } from '../services/notification.service';
import { AuthStore } from './auth-store';

const STREAM_URL = `${API_BASE_URL}/api/notifications/stream`;
// self-healing safety net, not the primary delivery path - catches the rare
// case where the SSE connection silently stalls without erroring (some
// proxies/extensions do this) so the badge can never drift for more than a
// couple minutes even in that case.
const FALLBACK_POLL_MS = 120_000;
const RECONNECT_DELAY_MS = 3_000;
const RECENT_LIMIT = 5;

/**
 * Live-pushed notifications over Server-Sent Events instead of polling every
 * few seconds. A plain `EventSource` can't be used here because it has no
 * way to attach the Authorization header this API requires (a well-known
 * browser limitation), so this reads the stream by hand via fetch()'s
 * ReadableStream - still auto-reconnecting, just implemented ourselves
 * instead of getting it for free from EventSource.
 */
@Injectable({ providedIn: 'root' })
export class NotificationBellService {
  private readonly notificationService = inject(NotificationService);
  private readonly authStore = inject(AuthStore);

  readonly unreadCount = signal(0);
  readonly recent = signal<NotificationResponse[]>([]);

  private abortController: AbortController | null = null;
  private fallbackTimer: ReturnType<typeof setInterval> | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private running = false;

  start(): void {
    if (this.running) return;
    this.running = true;
    this.refreshNow();
    this.connect();
    this.fallbackTimer = setInterval(() => this.refreshNow(), FALLBACK_POLL_MS);
  }

  stop(): void {
    this.running = false;
    this.abortController?.abort();
    this.abortController = null;
    if (this.fallbackTimer) clearInterval(this.fallbackTimer);
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.fallbackTimer = null;
    this.reconnectTimer = null;
    this.unreadCount.set(0);
    this.recent.set([]);
  }

  refreshNow(): void {
    this.notificationService.list(true, 0, RECENT_LIMIT).subscribe((page) => {
      this.unreadCount.set(page.totalElements);
      this.recent.set(page.content);
    });
  }

  private async connect(): Promise<void> {
    if (!this.running) return;
    const token = this.authStore.accessToken();
    if (!token) {
      this.scheduleReconnect();
      return;
    }

    this.abortController = new AbortController();
    try {
      const response = await fetch(STREAM_URL, {
        headers: { Authorization: `Bearer ${token}`, Accept: 'text/event-stream' },
        signal: this.abortController.signal,
      });
      if (!response.ok || !response.body) {
        throw new Error(`Stream request failed: ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (this.running) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let separatorIndex: number;
        while ((separatorIndex = buffer.indexOf('\n\n')) !== -1) {
          const rawEvent = buffer.slice(0, separatorIndex);
          buffer = buffer.slice(separatorIndex + 2);
          this.handleEvent(rawEvent);
        }
      }
    } catch {
      // network drop, server restart, or the abort from stop() - either
      // way just fall through to a reconnect attempt below (stop() sets
      // running = false first, so the reconnect no-ops in that case).
    }

    this.scheduleReconnect();
  }

  private handleEvent(rawEvent: string): void {
    const eventName = rawEvent
      .split('\n')
      .find((line) => line.startsWith('event:'))
      ?.slice(6)
      .trim();
    if (eventName !== 'notification') return;

    const dataLine = rawEvent.split('\n').find((line) => line.startsWith('data:'));
    if (!dataLine) return;

    try {
      const notification: NotificationResponse = JSON.parse(dataLine.slice(5).trim());
      this.recent.update((list) => [notification, ...list].slice(0, RECENT_LIMIT));
      this.unreadCount.update((count) => count + 1);
    } catch {
      // malformed payload - drop it, the next fallback poll reconciles state anyway
    }
  }

  private scheduleReconnect(): void {
    if (!this.running) return;
    this.reconnectTimer = setTimeout(() => this.connect(), RECONNECT_DELAY_MS);
  }
}
