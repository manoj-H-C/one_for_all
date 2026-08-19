import { Component, OnInit, computed, inject, signal } from '@angular/core';
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
import { IconComponent } from '../../shared/ui/icon';
import { EmptyStateComponent } from '../../shared/ui/empty-state';

@Component({
  selector: 'app-org-admin-page',
  imports: [FormsModule, AvatarComponent, IconComponent, EmptyStateComponent],
  template: `
    <div class="mx-auto flex max-w-4xl flex-col gap-6 animate-fade-in">
      <div>
        <h1 class="text-2xl font-bold tracking-tight text-slate-900">User Management</h1>
        <p class="mt-1 text-sm text-slate-500">
          {{ members().length }} user{{ members().length === 1 ? '' : 's' }}
          @if (invitations().length > 0) {
            <span class="text-slate-400">· {{ invitations().length }} pending invite{{ invitations().length === 1 ? '' : 's' }}</span>
          }
        </p>
      </div>

      @if (revealed(); as r) {
        <div class="card flex items-start justify-between gap-4 border-emerald-200 bg-emerald-50 p-5">
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

      <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div class="card p-5">
          <div class="mb-4 flex items-center gap-3">
            <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-100 text-primary-600">
              <app-icon name="user" [size]="17" />
            </span>
            <div class="min-w-0">
              <p class="text-sm font-semibold text-slate-800">Create a user directly</p>
              <p class="truncate text-xs text-slate-500">Sets a temporary password you relay to them.</p>
            </div>
          </div>
          <div class="flex flex-col gap-3">
            <input type="text" class="input" [(ngModel)]="createName" placeholder="Full name" />
            <input type="email" class="input" [(ngModel)]="createEmail" placeholder="newperson@acme.com" />
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
            <button
              type="button"
              class="btn-primary w-full"
              [disabled]="!createName().trim() || !createEmail().trim()"
              (click)="createUser()"
            >
              Create user
            </button>
          </div>
        </div>

        <div class="card p-5">
          <div class="mb-4 flex items-center gap-3">
            <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sky-100 text-sky-600">
              <app-icon name="mail" [size]="17" />
            </span>
            <div class="min-w-0">
              <p class="text-sm font-semibold text-slate-800">Invite by email</p>
              <p class="truncate text-xs text-slate-500">They redeem the link and set their own password.</p>
            </div>
          </div>
          <div class="flex flex-col gap-3">
            <input type="email" class="input" [(ngModel)]="inviteEmail" placeholder="newperson@acme.com" />
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
            <button type="button" class="btn-primary w-full" [disabled]="!inviteEmail().trim()" (click)="invite()">Send invite</button>
          </div>
        </div>
      </div>

      <div class="card overflow-hidden">
        <div class="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-3.5">
          <p class="text-sm font-semibold text-slate-700">All users</p>
          @if (members().length > 5) {
            <div class="relative w-full max-w-[220px]">
              <app-icon name="search" [size]="14" class="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                class="input h-8 pl-8 text-sm"
                placeholder="Search users…"
                [ngModel]="userSearch()"
                (ngModelChange)="userSearch.set($event)"
              />
            </div>
          }
        </div>
        <table class="w-full text-sm">
          <tbody class="divide-y divide-slate-100">
            @for (member of filteredMembers(); track member.id) {
              <tr class="transition-colors hover:bg-slate-50/70">
                <td class="px-5 py-3.5">
                  <div class="flex items-center gap-3">
                    <app-avatar [name]="member.name" [size]="34" />
                    <div class="min-w-0">
                      <p class="flex items-center gap-1.5 truncate font-medium text-slate-800">
                        <span class="truncate">{{ member.name }}</span>
                        @if (member.owner) {
                          <span class="shrink-0 rounded-full bg-primary-100 px-1.5 py-0.5 text-[10px] font-semibold text-primary-700">OWNER</span>
                        } @else if (member.id === authStore.currentUser()?.id) {
                          <span class="shrink-0 rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500">You</span>
                        }
                      </p>
                      <p class="truncate text-xs text-slate-500">{{ member.email }}</p>
                    </div>
                  </div>
                </td>
                <td class="px-5 py-3.5">
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
                <td class="px-5 py-3.5">
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
                <td class="px-5 py-3.5 text-right">
                  @if (!member.owner && member.id !== authStore.currentUser()?.id) {
                    <button
                      type="button"
                      class="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
                      title="Delete user"
                      (click)="deleteUser(member)"
                    >
                      <app-icon name="trash" [size]="16" />
                    </button>
                  }
                </td>
              </tr>
            } @empty {
              <tr>
                <td colspan="4" class="px-5 py-10">
                  <app-empty-state icon="🔍" title="No users match your search" />
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>

      @if (invitations().length > 0) {
        <div class="card overflow-hidden">
          <div class="border-b border-slate-100 px-5 py-3.5">
            <p class="text-sm font-semibold text-slate-700">Pending invitations</p>
          </div>
          <table class="w-full text-sm">
            <tbody class="divide-y divide-slate-100">
              @for (inv of invitations(); track inv.id) {
                <tr class="transition-colors hover:bg-slate-50/70">
                  <td class="px-5 py-3.5">
                    <div class="flex items-center gap-3">
                      <span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-600">
                        <app-icon name="mail" [size]="15" />
                      </span>
                      <span class="font-medium text-slate-700">{{ inv.email }}</span>
                    </div>
                  </td>
                  <td class="px-5 py-3.5 text-slate-500">
                    {{ inv.canCreateProjects ? 'Create projects' : '' }} {{ inv.canManageMembers ? '· Manage members' : '' }}
                  </td>
                  <td class="px-5 py-3.5 text-right">
                    <button
                      type="button"
                      class="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
                      title="Revoke invitation"
                      (click)="revoke(inv)"
                    >
                      <app-icon name="trash" [size]="16" />
                    </button>
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
  readonly userSearch = signal('');

  readonly filteredMembers = computed(() => {
    const q = this.userSearch().trim().toLowerCase();
    if (!q) return this.members();
    return this.members().filter((m) => m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q));
  });

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

  async deleteUser(member: OrganizationMemberResponse): Promise<void> {
    const confirmed = await this.confirmDialog.confirm(
      `Delete ${member.name}? They'll immediately lose access to every project and role in the org, and won't be able to log in again.`,
      { title: 'Delete user', confirmLabel: 'Delete' },
    );
    if (!confirmed) return;
    this.organizationService.deleteMember(member.id).subscribe({
      next: () => {
        this.members.update((list) => list.filter((m) => m.id !== member.id));
        this.toast.success(`${member.name} was deleted`);
      },
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
