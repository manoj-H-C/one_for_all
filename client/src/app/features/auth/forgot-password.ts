import { Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { IconComponent } from '../../shared/ui/icon';

@Component({
  selector: 'app-forgot-password',
  imports: [ReactiveFormsModule, RouterLink, IconComponent],
  template: `
    <a routerLink="/login" class="mb-4 inline-flex items-center gap-1 text-sm font-medium text-slate-400 hover:text-slate-600">
      <app-icon name="arrow-left" [size]="15" />
      Back to login
    </a>

    <h1 class="mb-1 text-2xl font-bold tracking-tight text-slate-900">Forgot your password?</h1>
    <p class="mb-6 text-sm text-slate-500">We'll send a reset link if that email has an account.</p>

    @if (sent()) {
      <div class="flex flex-col items-center gap-3 rounded-2xl bg-emerald-50 p-6 text-center">
        <span class="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
          <app-icon name="check" [size]="20" />
        </span>
        <p class="text-sm text-emerald-800">
          If that email exists, a reset link is on its way. (Running locally? Check the backend console log for the token.)
        </p>
      </div>
    } @else {
      <form [formGroup]="form" (ngSubmit)="submit()" class="flex flex-col gap-4">
        <div>
          <label class="label" for="email">Email</label>
          <div class="relative">
            <app-icon name="mail" [size]="17" class="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input id="email" type="email" class="input pl-10" formControlName="email" autocomplete="email" placeholder="you@company.com" />
          </div>
        </div>
        <button type="submit" class="btn-primary w-full" [disabled]="form.invalid || submitting()">
          {{ submitting() ? 'Sending…' : 'Send reset link' }}
        </button>
      </form>
    }
  `,
})
export class ForgotPasswordComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);

  readonly submitting = signal(false);
  readonly sent = signal(false);

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
  });

  submit(): void {
    if (this.form.invalid) return;
    this.submitting.set(true);
    this.authService.forgotPassword(this.form.getRawValue()).subscribe({
      next: () => this.sent.set(true),
      error: () => this.sent.set(true), // 202 always, backend never reveals existence
    });
  }
}
