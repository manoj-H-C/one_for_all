import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ApiError } from '../../core/models/common.model';

@Component({
  selector: 'app-verify-email',
  imports: [RouterLink],
  template: `
    <h1 class="mb-4 text-xl font-semibold text-slate-900">Verifying your email…</h1>
    @if (state() === 'success') {
      <p class="rounded-lg bg-emerald-50 p-4 text-sm text-emerald-800">Your email is verified.</p>
    } @else if (state() === 'error') {
      <p class="rounded-lg bg-red-50 p-4 text-sm text-red-800">{{ error() }}</p>
    }
    <a routerLink="/projects" class="btn-primary mt-4 w-full">Continue</a>
  `,
})
export class VerifyEmailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly authService = inject(AuthService);

  readonly state = signal<'pending' | 'success' | 'error'>('pending');
  readonly error = signal<string | null>(null);

  ngOnInit(): void {
    const token = this.route.snapshot.paramMap.get('token') ?? '';
    this.authService.verifyEmail({ token }).subscribe({
      next: () => this.state.set('success'),
      error: (err: ApiError) => {
        this.state.set('error');
        this.error.set(err.message);
      },
    });
  }
}
