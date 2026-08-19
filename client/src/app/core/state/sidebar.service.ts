import { Injectable, effect, signal } from '@angular/core';

const STORAGE_KEY = 'jeera.sidebarCollapsed';

@Injectable({ providedIn: 'root' })
export class SidebarService {
  readonly collapsed = signal(localStorage.getItem(STORAGE_KEY) === 'true');

  constructor() {
    effect(() => localStorage.setItem(STORAGE_KEY, String(this.collapsed())));
  }

  toggle(): void {
    this.collapsed.update((v) => !v);
  }
}
