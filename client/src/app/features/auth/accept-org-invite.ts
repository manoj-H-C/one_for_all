import { Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { OrganizationService } from '../../core/services/organization.service';
import { AuthStore } from '../../core/state/auth-store';
import { ApiError } from '../../core/models/common.model';

@Component({
  selector: 'app-accept-org-invite',
  imports: [ReactiveFormsModule],
  template: `
    <h1 class="mb-1 text-xl font-semibold text-slate-900">You've been invited</h1>
    <p class="mb-6 text-sm text-slate-500">Set your name and password to join the organization.</p>

    <form [formGroup]="form" (ngSubmit)="submit()" class="flex flex-col gap-4">
      <div>
        <label class="label" for="name">Your name</label>
        <input id="name" type="text" class="input" formControlName="name" />
      </div>
      <div>
        <label class="label" for="password">Password</label>
        <input id="password" type="password" class="input" formControlName="password" autocomplete="new-password" />
      </div>

      @if (error()) {
        <p class="text-sm text-red-600">{{ error() }}</p>
      }

      <button type="submit" class="btn-primary w-full" [disabled]="form.invalid || submitting()">
        {{ submitting() ? 'Joining…' : 'Accept invitation' }}
      </button>
    </form>
  `,
})
export class AcceptOrgInviteComponent {
  private readonly fb = inject(FormBuilder);
  private readonly organizationService = inject(OrganizationService);
  private readonly authStore = inject(AuthStore);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly submitting = signal(false);
  readonly error = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    name: ['', Validators.required],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });

  submit(): void {
    if (this.form.invalid) return;
    const token = this.route.snapshot.paramMap.get('token') ?? '';
    this.submitting.set(true);
    this.error.set(null);
    this.organizationService.acceptInvitation(token, this.form.getRawValue()).subscribe({
      next: (auth) => {
        this.authStore.setSession(auth);
        this.authStore.loadCurrentUser().subscribe(() => this.router.navigateByUrl('/projects'));
      },
      error: (err: ApiError) => {
        this.submitting.set(false);
        this.error.set(err.message);
      },
    });
  }
}
