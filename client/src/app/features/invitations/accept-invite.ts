import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { InvitationService } from '../../core/services/invitation.service';
import { MemberResponse } from '../../core/models/member.model';
import { ApiError } from '../../core/models/common.model';
import { BrandedPageComponent } from '../../shared/ui/branded-page';

@Component({
  selector: 'app-accept-invite',
  imports: [RouterLink, BrandedPageComponent],
  template: `
    <app-branded-page>
      <div class="text-center">
        @if (state() === 'pending') {
          <p class="text-sm text-slate-500">Accepting your invitation…</p>
        } @else if (state() === 'success') {
          <h1 class="mb-2 text-xl font-semibold text-slate-900">You're in!</h1>
          <p class="mb-6 text-sm text-slate-600">
            You joined as <span class="font-medium">{{ member()?.roleName }}</span>.
          </p>
          <a routerLink="/projects" class="btn-primary w-full">Go to projects</a>
        } @else {
          <h1 class="mb-2 text-xl font-semibold text-slate-900">Couldn't accept invitation</h1>
          <p class="mb-6 text-sm text-red-600">{{ error() }}</p>
          <a routerLink="/projects" class="btn-secondary w-full">Back to projects</a>
        }
      </div>
    </app-branded-page>
  `,
})
export class AcceptInviteComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly invitationService = inject(InvitationService);

  readonly state = signal<'pending' | 'success' | 'error'>('pending');
  readonly member = signal<MemberResponse | null>(null);
  readonly error = signal<string | null>(null);

  ngOnInit(): void {
    const token = this.route.snapshot.paramMap.get('token') ?? '';
    this.invitationService.accept(token).subscribe({
      next: (member) => {
        this.member.set(member);
        this.state.set('success');
      },
      error: (err: ApiError) => {
        this.error.set(err.message);
        this.state.set('error');
      },
    });
  }
}
