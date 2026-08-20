import { Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ApiError } from '../../core/models/common.model';
import { IconComponent } from '../../shared/ui/icon';

@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule, RouterLink, IconComponent],
  template: `
    <div class="mb-6 flex items-center gap-2">
      <span class="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
        <app-icon name="sparkles" [size]="16" />
      </span>
      <span class="text-xs font-semibold uppercase tracking-wider text-primary-600">Get started free</span>
    </div>
    <h1 class="mb-1 text-2xl font-bold tracking-tight text-slate-900">Create your organization</h1>
    <p class="mb-6 text-sm text-slate-500">You'll become its owner — no separate step needed.</p>

    <form [formGroup]="form" (ngSubmit)="submit()" class="flex flex-col gap-4">
      <div>
        <label class="label" for="orgName">Organization name</label>
        <input id="orgName" type="text" class="input" formControlName="orgName" placeholder="Acme Electrical" />
      </div>
      <div>
        <label class="label" for="name">Your name</label>
        <div class="relative">
          <app-icon name="user" [size]="17" class="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input id="name" type="text" class="input pl-10" formControlName="name" placeholder="Jane Doe" />
        </div>
      </div>
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
          <input id="password" type="password" class="input pl-10" formControlName="password" autocomplete="new-password" placeholder="At least 8 characters" />
        </div>
      </div>

      @if (error()) {
        <p class="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{{ error() }}</p>
      }

      <button type="submit" class="btn-primary w-full" [disabled]="form.invalid || submitting()">
        {{ submitting() ? 'Creating…' : 'Create organization' }}
      </button>
    </form>

    <p class="mt-5 border-t border-slate-100 pt-5 text-center text-sm text-slate-500">
      Already have an account? <a routerLink="/login" class="font-medium text-primary-700 hover:text-primary-800 hover:underline">Log in</a>
    </p>
  `,
})
export class RegisterComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly submitting = signal(false);
  readonly error = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    orgName: ['', Validators.required],
    name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });

  submit(): void {
    if (this.form.invalid) return;
    this.submitting.set(true);
    this.error.set(null);
    this.authService.register(this.form.getRawValue()).subscribe({
      next: () => this.router.navigateByUrl('/projects'),
      error: (err: ApiError) => {
        this.submitting.set(false);
        this.error.set(err.message);
      },
    });
  }
}
