import { Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ApiError } from '../../core/models/common.model';
import { IconComponent } from '../../shared/ui/icon';

@Component({
  selector: 'app-reset-password',
  imports: [ReactiveFormsModule, RouterLink, IconComponent],
  template: `
    <h1 class="mb-1 text-2xl font-bold tracking-tight text-slate-900">Set a new password</h1>
    <p class="mb-6 text-sm text-slate-500">This will sign you out everywhere else.</p>

    @if (done()) {
      <div class="flex flex-col items-center gap-3 rounded-2xl bg-emerald-50 p-6 text-center">
        <span class="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
          <app-icon name="check" [size]="20" />
        </span>
        <p class="text-sm text-emerald-800">Password updated — you can log in now.</p>
      </div>
      <a routerLink="/login" class="btn-primary mt-4 w-full">Go to login</a>
    } @else {
      <form [formGroup]="form" (ngSubmit)="submit()" class="flex flex-col gap-4">
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
          {{ submitting() ? 'Saving…' : 'Reset password' }}
        </button>
      </form>
    }
  `,
})
export class ResetPasswordComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly route = inject(ActivatedRoute);

  readonly submitting = signal(false);
  readonly done = signal(false);
  readonly error = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    newPassword: ['', [Validators.required, Validators.minLength(8)]],
  });

  submit(): void {
    if (this.form.invalid) return;
    const token = this.route.snapshot.paramMap.get('token') ?? '';
    this.submitting.set(true);
    this.error.set(null);
    this.authService.resetPassword({ token, newPassword: this.form.getRawValue().newPassword }).subscribe({
      next: () => this.done.set(true),
      error: (err: ApiError) => {
        this.submitting.set(false);
        this.error.set(err.message);
      },
    });
  }
}
