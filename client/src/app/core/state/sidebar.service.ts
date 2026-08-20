import { Injectable, computed, effect, signal } from '@angular/core';

const STORAGE_KEY = 'jeera.sidebarCollapsed';
const DESKTOP_QUERY = '(min-width: 1024px)';

@Injectable({ providedIn: 'root' })
export class SidebarService {
  /** The user's collapse-to-icons preference - only meaningful on desktop, persisted across sessions. */
  readonly collapsed = signal(localStorage.getItem(STORAGE_KEY) === 'true');

  /** Whether the off-canvas mobile drawer is currently open. Irrelevant on desktop, where the sidebar is always in-flow and visible. */
  readonly mobileOpen = signal(false);

  private readonly desktopQuery = window.matchMedia(DESKTOP_QUERY);
  readonly isDesktop = signal(this.desktopQuery.matches);

  /** Collapse-to-icons only ever applies on desktop - on a narrow viewport the drawer always renders full-width with labels, regardless of what was chosen on a previous desktop session. */
  readonly effectiveCollapsed = computed(() => this.isDesktop() && this.collapsed());

  constructor() {
    effect(() => localStorage.setItem(STORAGE_KEY, String(this.collapsed())));
    this.desktopQuery.addEventListener('change', (e) => {
      this.isDesktop.set(e.matches);
      if (e.matches) this.mobileOpen.set(false);
    });
  }

  toggle(): void {
    this.collapsed.update((v) => !v);
  }

  toggleMobile(): void {
    this.mobileOpen.update((v) => !v);
  }

  closeMobile(): void {
    this.mobileOpen.set(false);
  }
}
