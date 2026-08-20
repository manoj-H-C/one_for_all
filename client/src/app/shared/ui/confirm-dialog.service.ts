import { Injectable, signal } from '@angular/core';

export interface ConfirmRequest {
  title: string;
  message: string;
  confirmLabel: string;
  danger: boolean;
  resolve: (result: boolean) => void;
}

@Injectable({ providedIn: 'root' })
export class ConfirmDialogService {
  readonly request = signal<ConfirmRequest | null>(null);

  confirm(message: string, options?: { title?: string; confirmLabel?: string; danger?: boolean }): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      this.request.set({
        title: options?.title ?? 'Are you sure?',
        message,
        confirmLabel: options?.confirmLabel ?? 'Confirm',
        danger: options?.danger ?? true,
        resolve,
      });
    });
  }

  resolve(result: boolean): void {
    this.request()?.resolve(result);
    this.request.set(null);
  }
}
