import { Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { AuthStore } from '../../core/state/auth-store';
import { ApiError } from '../../core/models/common.model';
import { BrandedPageComponent } from '../../shared/ui/branded-page';
import { IconComponent } from '../../shared/ui/icon';

@Component({
  selector: 'app-change-password',
  imports: [ReactiveFormsModule, BrandedPageComponent, IconComponent],
  template: `
    <app-branded-page>
      @if (forced()) {
        <h1 class="mb-1 text-2xl font-bold tracking-tight text-slate-900">Set a new password</h1>
        <p class="mb-6 text-sm text-slate-500">
          Your account was created with a temporary password. Set your own before continuing.
        </p>
      } @else {
        <h1 class="mb-1 text-2xl font-bold tracking-tight text-slate-900">Change password</h1>
        <p class="mb-6 text-sm text-slate-500">This will sign you out on every other device.</p>
      }

      <form [formGroup]="form" (ngSubmit)="submit()" class="flex flex-col gap-4">
        <div>
          <label class="label" for="currentPassword">{{ forced() ? 'Temporary password' : 'Current password' }}</label>
          <div class="relative">
            <app-icon name="key" [size]="17" class="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input id="currentPassword" type="password" class="input pl-10" formControlName="currentPassword" autocomplete="current-password" />
          </div>
        </div>
        <div>
          <label class="label" for="newPassword">New password</label>
          <div class="relative">
            <app-icon name="lock" [size]="17" class="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input id="newPassword" type="password" class="input pl-10" formControlName="newPassword" autocomplete="new-password" placeholder="At least 8 characters" />
          </div>
        </div>

        @if (error()) {
          <p class="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{{ error() }}</p>
        }

        <button type="submit" class="btn-primary w-full" [disabled]="form.invalid || submitting()">
          {{ submitting() ? 'Saving…' : 'Set new password' }}
        </button>
      </form>
    </app-branded-page>
  `,
})
export class ChangePasswordComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly authStore = inject(AuthStore);
  private readonly router = inject(Router);

  readonly submitting = signal(false);
  readonly error = signal<string | null>(null);
  readonly forced = () => this.authStore.currentUser()?.mustResetPassword === true;

  readonly form = this.fb.nonNullable.group({
    currentPassword: ['', Validators.required],
    newPassword: ['', [Validators.required, Validators.minLength(8)]],
  });

  submit(): void {
    if (this.form.invalid) return;
    this.submitting.set(true);
    this.error.set(null);
    this.authService.changePassword(this.form.getRawValue()).subscribe({
      next: () => this.router.navigateByUrl('/projects'),
      error: (err: ApiError) => {
        this.submitting.set(false);
        this.error.set(err.message);
      },
    });
  }
}
