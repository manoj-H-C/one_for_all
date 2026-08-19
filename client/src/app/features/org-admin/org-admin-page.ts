import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { OrganizationService } from '../../core/services/organization.service';
import { AuthStore } from '../../core/state/auth-store';
import { ToastService } from '../../core/state/toast.service';
import { ConfirmDialogService } from '../../shared/ui/confirm-dialog.service';
import {
  OrganizationMemberResponse,
  OrganizationInvitationResponse,
  OrganizationMemberCreateResponse,
} from '../../core/models/organization.model';
import { AvatarComponent } from '../../shared/ui/avatar';

@Component({
  selector: 'app-org-admin-page',
  imports: [FormsModule, AvatarComponent],
  template: `
    <div class="mx-auto max-w-4xl">
      <h1 class="mb-6 text-2xl font-semibold text-slate-900">Organization admin</h1>

      @if (revealed(); as r) {
        <div class="card mb-6 flex items-start justify-between gap-4 border-emerald-200 bg-emerald-50 p-5">
          <div>
            <p class="text-sm font-medium text-emerald-900">{{ r.name }} ({{ r.email }}) was created.</p>
            <p class="mt-1 text-sm text-emerald-800">
              Temporary password: <span class="rounded bg-white px-2 py-0.5 font-mono font-semibold">{{ r.temporaryPassword }}</span>
            </p>
            <p class="mt-1 text-xs text-emerald-700">
              Share this with them now — it won't be shown again. They'll be forced to set a new password at login.
            </p>
          </div>
          <div class="flex shrink-0 gap-2">
            <button type="button" class="btn-secondary px-3 py-1.5" (click)="copyTempPassword(r.temporaryPassword)">Copy</button>
            <button type="button" class="btn-ghost px-3 py-1.5" (click)="revealed.set(null)">Dismiss</button>
          </div>
        </div>
      }

      <div class="card mb-6 flex flex-col flex-wrap gap-3 p-5 sm:flex-row sm:items-end">
        <div class="min-w-[160px] flex-1">
          <label class="label">Create a user directly</label>
          <input type="text" class="input" [(ngModel)]="createName" placeholder="Full name" />
        </div>
        <div class="min-w-[200px] flex-1">
          <label class="label">Email</label>
          <input type="email" class="input" [(ngModel)]="createEmail" placeholder="newperson@acme.com" />
        </div>
        <label class="flex items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" class="h-4 w-4 rounded border-slate-300 text-primary-600" [(ngModel)]="createCanCreateProjects" />
          Can create projects
        </label>
        @if (authStore.isOwner()) {
          <label class="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" class="h-4 w-4 rounded border-slate-300 text-primary-600" [(ngModel)]="createCanManageMembers" />
            Can manage members
          </label>
        }
        <button type="button" class="btn-primary" [disabled]="!createName().trim() || !createEmail().trim()" (click)="createUser()">
          Create user
        </button>
        <p class="w-full text-xs text-slate-400">
          Creates the account immediately with a temporary password you relay to them — no email required. They must reset it at login.
        </p>
      </div>

      <div class="card mb-6 flex flex-col flex-wrap gap-3 p-5 sm:flex-row sm:items-end">
        <div class="min-w-[220px] flex-1">
          <label class="label">Invite by email</label>
          <input type="email" class="input" [(ngModel)]="inviteEmail" placeholder="newperson@acme.com" />
        </div>
        <label class="flex items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" class="h-4 w-4 rounded border-slate-300 text-primary-600" [(ngModel)]="inviteCanCreateProjects" />
          Can create projects
        </label>
        @if (authStore.isOwner()) {
          <label class="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" class="h-4 w-4 rounded border-slate-300 text-primary-600" [(ngModel)]="inviteCanManageMembers" />
            Can manage members
          </label>
        }
        <button type="button" class="btn-primary" [disabled]="!inviteEmail().trim()" (click)="invite()">Send invite</button>
        <p class="w-full text-xs text-slate-400">
          Sends a link the person redeems themselves and sets their own password — useful if you'd rather not handle a password at all.
        </p>
      </div>

      <div class="card mb-6 overflow-hidden">
        <div class="border-b border-slate-100 px-5 py-3 text-sm font-medium text-slate-700">Members</div>
        <table class="w-full text-sm">
          <tbody class="divide-y divide-slate-100">
            @for (member of members(); track member.id) {
              <tr>
                <td class="flex items-center gap-2 px-5 py-3">
                  <app-avatar [name]="member.name" [size]="28" />
                  <div>
                    <p class="font-medium text-slate-800">
                      {{ member.name }}
                      @if (member.owner) {
                        <span class="ml-1 rounded-full bg-primary-100 px-2 py-0.5 text-[10px] font-semibold text-primary-700">OWNER</span>
                      }
                    </p>
                    <p class="text-xs text-slate-500">{{ member.email }}</p>
                  </div>
                </td>
                <td class="px-5 py-3">
                  @if (!member.owner) {
                    <label class="flex items-center gap-2 text-xs text-slate-600">
                      <input
                        type="checkbox"
                        class="h-4 w-4 rounded border-slate-300 text-primary-600"
                        [checked]="member.canCreateProjects"
                        (change)="toggleCreateProjects(member, $event)"
                      />
                      Can create projects
                    </label>
                  }
                </td>
                <td class="px-5 py-3">
                  @if (!member.owner && authStore.isOwner()) {
                    <label class="flex items-center gap-2 text-xs text-slate-600">
                      <input
                        type="checkbox"
                        class="h-4 w-4 rounded border-slate-300 text-primary-600"
                        [checked]="member.canManageMembers"
                        (change)="toggleManageMembers(member, $event)"
                      />
                      Can manage members
                    </label>
                  }
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>

      @if (invitations().length > 0) {
        <div class="card overflow-hidden">
          <div class="border-b border-slate-100 px-5 py-3 text-sm font-medium text-slate-700">Pending invitations</div>
          <table class="w-full text-sm">
            <tbody class="divide-y divide-slate-100">
              @for (inv of invitations(); track inv.id) {
                <tr>
                  <td class="px-5 py-3">{{ inv.email }}</td>
                  <td class="px-5 py-3 text-slate-500">
                    {{ inv.canCreateProjects ? 'Create projects' : '' }} {{ inv.canManageMembers ? '· Manage members' : '' }}
                  </td>
                  <td class="px-5 py-3 text-right">
                    <button type="button" class="text-xs text-slate-400 hover:text-red-600" (click)="revoke(inv)">Revoke</button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </div>
  `,
})
export class OrgAdminPageComponent implements OnInit {
  private readonly organizationService = inject(OrganizationService);
  private readonly toast = inject(ToastService);
  private readonly confirmDialog = inject(ConfirmDialogService);

  readonly authStore = inject(AuthStore);
  readonly members = signal<OrganizationMemberResponse[]>([]);
  readonly invitations = signal<OrganizationInvitationResponse[]>([]);

  readonly inviteEmail = signal('');
  readonly inviteCanCreateProjects = signal(false);
  readonly inviteCanManageMembers = signal(false);

  readonly createName = signal('');
  readonly createEmail = signal('');
  readonly createCanCreateProjects = signal(false);
  readonly createCanManageMembers = signal(false);
  readonly revealed = signal<OrganizationMemberCreateResponse | null>(null);

  ngOnInit(): void {
    forkJoin({
      members: this.organizationService.listMembers(),
      invitations: this.organizationService.listInvitations(),
    }).subscribe(({ members, invitations }) => {
      this.members.set(members);
      this.invitations.set(invitations);
    });
  }

  invite(): void {
    const email = this.inviteEmail().trim();
    if (!email) return;
    this.organizationService
      .createInvitation({
        email,
        canCreateProjects: this.inviteCanCreateProjects(),
        canManageMembers: this.inviteCanManageMembers(),
      })
      .subscribe({
        next: (invitation) => {
          this.invitations.update((list) => [invitation, ...list]);
          this.inviteEmail.set('');
          this.inviteCanCreateProjects.set(false);
          this.inviteCanManageMembers.set(false);
          this.toast.success(`Invited ${email}`);
        },
        error: (err) => this.toast.error(err.message),
      });
  }

  createUser(): void {
    const name = this.createName().trim();
    const email = this.createEmail().trim();
    if (!name || !email) return;
    this.organizationService
      .createMember({
        name,
        email,
        canCreateProjects: this.createCanCreateProjects(),
        canManageMembers: this.createCanManageMembers(),
      })
      .subscribe({
        next: (created) => {
          this.members.update((list) => [
            ...list,
            {
              id: created.id,
              name: created.name,
              email: created.email,
              owner: false,
              canCreateProjects: created.canCreateProjects,
              canManageMembers: created.canManageMembers,
              createdAt: created.createdAt,
            },
          ]);
          this.revealed.set(created);
          this.createName.set('');
          this.createEmail.set('');
          this.createCanCreateProjects.set(false);
          this.createCanManageMembers.set(false);
        },
        error: (err) => this.toast.error(err.message),
      });
  }

  copyTempPassword(password: string): void {
    navigator.clipboard.writeText(password).then(() => this.toast.success('Copied to clipboard'));
  }

  toggleCreateProjects(member: OrganizationMemberResponse, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    this.organizationService.setProjectCreationAccess(member.id, checked).subscribe({
      next: () => this.members.update((list) => list.map((m) => (m.id === member.id ? { ...m, canCreateProjects: checked } : m))),
      error: (err) => this.toast.error(err.message),
    });
  }

  toggleManageMembers(member: OrganizationMemberResponse, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    this.organizationService.setMemberManagementAccess(member.id, checked).subscribe({
      next: () => this.members.update((list) => list.map((m) => (m.id === member.id ? { ...m, canManageMembers: checked } : m))),
      error: (err) => this.toast.error(err.message),
    });
  }

  async revoke(invitation: OrganizationInvitationResponse): Promise<void> {
    const confirmed = await this.confirmDialog.confirm(`Revoke the invitation to ${invitation.email}?`, {
      title: 'Revoke invitation',
      confirmLabel: 'Revoke',
    });
    if (!confirmed) return;
    this.organizationService.revokeInvitation(invitation.id).subscribe({
      next: () => this.invitations.update((list) => list.filter((i) => i.id !== invitation.id)),
      error: (err) => this.toast.error(err.message),
    });
  }
}
