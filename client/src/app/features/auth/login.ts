import { Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ApiError } from '../../core/models/common.model';
import { IconComponent } from '../../shared/ui/icon';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink, IconComponent],
  template: `
    <h1 class="mb-1 text-2xl font-bold tracking-tight text-slate-900">Welcome back</h1>
    <p class="mb-6 text-sm text-slate-500">Log in to your workspace.</p>

    <form [formGroup]="form" (ngSubmit)="submit()" class="flex flex-col gap-4">
      <div>
        <label class="label" for="email">Email</label>
        <div class="relative">
          <app-icon name="mail" [size]="17" class="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input id="email" type="email" class="input pl-10" formControlName="email" autocomplete="email" placeholder="you@company.com" />
        </div>
      </div>
      <div>
        <label class="label" for="password">Password</label>
        <div class="relative">
          <app-icon name="lock" [size]="17" class="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input id="password" type="password" class="input pl-10" formControlName="password" autocomplete="current-password" placeholder="••••••••" />
        </div>
      </div>

      @if (error()) {
        <p class="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{{ error() }}</p>
      }

      <button type="submit" class="btn-primary w-full" [disabled]="form.invalid || submitting()">
        {{ submitting() ? 'Logging in…' : 'Log in' }}
      </button>
    </form>

    <div class="mt-5 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-t border-slate-100 pt-5 text-sm">
      <a routerLink="/forgot-password" class="font-medium text-primary-700 hover:text-primary-800 hover:underline">Forgot password?</a>
      <a routerLink="/register" class="font-medium text-primary-700 hover:text-primary-800 hover:underline">Create an organization</a>
    </div>
  `,
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly submitting = signal(false);
  readonly error = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  submit(): void {
    if (this.form.invalid) return;
    this.submitting.set(true);
    this.error.set(null);
    this.authService.login(this.form.getRawValue()).subscribe({
      next: () => {
        const redirectTo = this.route.snapshot.queryParamMap.get('redirectTo');
        this.router.navigateByUrl(redirectTo || '/projects');
      },
      error: (err: ApiError) => {
        this.submitting.set(false);
        this.error.set(err.message);
      },
    });
  }
}
