import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { forkJoin } from 'rxjs';
import { MemberService } from '../../core/services/member.service';
import { InvitationService } from '../../core/services/invitation.service';
import { RoleService } from '../../core/services/role.service';
import { OrganizationService } from '../../core/services/organization.service';
import { AuthStore } from '../../core/state/auth-store';
import { ProjectPermissionsService } from '../../core/state/project-permissions.service';
import { ToastService } from '../../core/state/toast.service';
import { ConfirmDialogService } from '../../shared/ui/confirm-dialog.service';
import { MemberResponse, InvitationResponse } from '../../core/models/member.model';
import { OrganizationMemberResponse } from '../../core/models/organization.model';
import { RoleResponse } from '../../core/models/role.model';
import { PERMISSION_CODE } from '../../core/models/role.model';
import { resolveProjectId } from '../../core/util/route.util';
import { AvatarComponent } from '../../shared/ui/avatar';
import { IconComponent } from '../../shared/ui/icon';
import { StatusPillComponent } from '../../shared/ui/status-pill';
import { EmptyStateComponent } from '../../shared/ui/empty-state';
import { SearchableSelectComponent, SearchableSelectOption } from '../../shared/ui/searchable-select';

@Component({
  selector: 'app-members-settings',
  imports: [FormsModule, AvatarComponent, IconComponent, StatusPillComponent, EmptyStateComponent, SearchableSelectComponent],
  template: `
    <div class="mx-auto flex max-w-5xl flex-col gap-6 animate-fade-in">
      <div>
        <h1 class="text-2xl font-bold tracking-tight text-slate-900">Members</h1>
        <p class="mt-1 text-sm text-slate-500">
          {{ members().length }} member{{ members().length === 1 ? '' : 's' }}
          @if (invitations().length > 0) {
            <span class="text-slate-400">· {{ invitations().length }} pending invite{{ invitations().length === 1 ? '' : 's' }}</span>
          }
        </p>
      </div>

      @if (canInvite()) {
        <div class="grid grid-cols-1 gap-4" [class.md:grid-cols-2]="canSeeOrgRoster() && availableOrgMembers().length > 0">
          @if (canSeeOrgRoster() && availableOrgMembers().length > 0) {
            <div class="card p-5">
              <div class="mb-4 flex items-center gap-3">
                <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-100 text-primary-600">
                  <app-icon name="user" [size]="17" />
                </span>
                <div class="min-w-0">
                  <p class="text-sm font-semibold text-slate-800">Add an existing member</p>
                  <p class="truncate text-xs text-slate-500">Already in your org — add them directly.</p>
                </div>
              </div>
              <div class="flex flex-col gap-3">
                <app-searchable-select
                  [options]="orgMemberOptions()"
                  [value]="addMemberUserId()"
                  placeholder="Select a person…"
                  (valueChange)="addMemberUserId.set($event)"
                />
                <select class="input" [(ngModel)]="addMemberRoleId">
                  @for (r of roles(); track r.id) {
                    <option [value]="r.id">{{ r.name }}</option>
                  }
                </select>
                <button
                  type="button"
                  class="btn-primary w-full"
                  [disabled]="!addMemberUserId() || !addMemberRoleId()"
                  (click)="addExistingMember()"
                >
                  Add to project
                </button>
              </div>
            </div>
          }

          <div class="card p-5">
            <div class="mb-4 flex items-center gap-3">
              <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sky-100 text-sky-600">
                <app-icon name="mail" [size]="17" />
              </span>
              <div class="min-w-0">
                <p class="text-sm font-semibold text-slate-800">Invite by email</p>
                <p class="truncate text-xs text-slate-500">Works for anyone, in or outside your org.</p>
              </div>
            </div>
            <div class="flex flex-col gap-3">
              <input type="email" class="input" [(ngModel)]="inviteEmail" placeholder="bob@acme.com" />
              <select class="input" [(ngModel)]="inviteRoleId">
                @for (r of roles(); track r.id) {
                  <option [value]="r.id">{{ r.name }}</option>
                }
              </select>
              <button type="button" class="btn-primary w-full" [disabled]="!inviteEmail().trim() || !inviteRoleId()" (click)="invite()">
                Send invite
              </button>
            </div>
          </div>
        </div>
      }

      <div class="card overflow-hidden">
        <div class="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-3.5">
          <p class="text-sm font-semibold text-slate-700">All members</p>
          @if (members().length > 5) {
            <div class="relative w-full max-w-[220px]">
              <app-icon name="search" [size]="14" class="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                class="input h-8 pl-8 text-sm"
                placeholder="Search members…"
                [ngModel]="memberSearch()"
                (ngModelChange)="memberSearch.set($event)"
              />
            </div>
          }
        </div>
        <div class="overflow-x-auto">
        <table class="w-full min-w-[480px] text-sm">
          <tbody class="divide-y divide-slate-100">
            @for (member of filteredMembers(); track member.userId) {
              <tr class="transition-colors hover:bg-slate-50/70">
                <td class="px-5 py-3.5">
                  <div class="flex items-center gap-3">
                    <app-avatar [name]="member.name" [size]="34" />
                    <div class="min-w-0">
                      <p class="flex items-center gap-1.5 truncate font-medium text-slate-800">
                        <span class="truncate">{{ member.name }}</span>
                        @if (member.userId === authStore.currentUser()?.id) {
                          <span class="shrink-0 rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500">You</span>
                        }
                      </p>
                      <p class="truncate text-xs text-slate-500">{{ member.email }}</p>
                    </div>
                  </div>
                </td>
                <td class="px-5 py-3.5">
                  @if (canInvite()) {
                    <select class="input w-40" [ngModel]="member.roleId" (ngModelChange)="changeRole(member, $event)">
                      @for (r of roles(); track r.id) {
                        <option [value]="r.id">{{ r.name }}</option>
                      }
                    </select>
                  } @else {
                    <app-status-pill [name]="member.roleName" [seed]="member.roleName" />
                  }
                </td>
                <td class="px-5 py-3.5 text-right">
                  @if (canRemove()) {
                    <button
                      type="button"
                      class="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
                      title="Remove member"
                      (click)="remove(member)"
                    >
                      <app-icon name="trash" [size]="16" />
                    </button>
                  }
                </td>
              </tr>
            } @empty {
              <tr>
                <td colspan="3" class="px-5 py-10">
                  <app-empty-state icon="🔍" title="No members match your search" />
                </td>
              </tr>
            }
          </tbody>
        </table>
        </div>
      </div>

      @if (canInvite() && invitations().length > 0) {
        <div class="card overflow-hidden">
          <div class="border-b border-slate-100 px-5 py-3.5">
            <p class="text-sm font-semibold text-slate-700">Pending invitations</p>
          </div>
          <div class="overflow-x-auto">
          <table class="w-full min-w-[420px] text-sm">
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
                  <td class="px-5 py-3.5"><app-status-pill [name]="inv.roleName" [seed]="inv.roleName" /></td>
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
        </div>
      }
    </div>
  `,
})
export class MembersSettingsComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly memberService = inject(MemberService);
  private readonly invitationService = inject(InvitationService);
  private readonly roleService = inject(RoleService);
  private readonly organizationService = inject(OrganizationService);
  private readonly permissions = inject(ProjectPermissionsService);
  private readonly toast = inject(ToastService);
  private readonly confirmDialog = inject(ConfirmDialogService);

  readonly authStore = inject(AuthStore);
  readonly projectId = resolveProjectId(this.route);
  readonly canInvite = toSignal(this.permissions.has(this.projectId, PERMISSION_CODE.MEMBER_INVITE), {
    initialValue: false,
  });
  readonly canRemove = toSignal(this.permissions.has(this.projectId, PERMISSION_CODE.MEMBER_REMOVE), {
    initialValue: false,
  });
  // GET /api/organizations/members is itself owner/canManageMembers-only, so
  // the "add existing member directly" shortcut can only be offered to
  // people who could see that roster in the first place - everyone else
  // still has "invite by email" as a fully working fallback for org members too.
  readonly canSeeOrgRoster = computed(() => this.authStore.isOwner() || this.authStore.canManageMembers());

  readonly members = signal<MemberResponse[]>([]);
  readonly invitations = signal<InvitationResponse[]>([]);
  readonly roles = signal<RoleResponse[]>([]);
  readonly orgMembers = signal<OrganizationMemberResponse[]>([]);
  readonly memberSearch = signal('');

  readonly availableOrgMembers = computed(() =>
    this.orgMembers().filter((om) => !this.members().some((m) => m.userId === om.id)),
  );
  // label includes the email so the searchable select's existing
  // label-substring filter doubles as a search-by-email match too, with no
  // changes needed to the shared component itself.
  readonly orgMemberOptions = computed<SearchableSelectOption[]>(() =>
    this.availableOrgMembers().map((m) => ({ value: m.id, label: `${m.name} (${m.email})` })),
  );

  readonly filteredMembers = computed(() => {
    const q = this.memberSearch().trim().toLowerCase();
    if (!q) return this.members();
    return this.members().filter((m) => m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q));
  });

  readonly inviteEmail = signal('');
  readonly inviteRoleId = signal('');
  readonly addMemberUserId = signal('');
  readonly addMemberRoleId = signal('');

  ngOnInit(): void {
    this.load();
  }

  private load(): void {
    forkJoin({
      members: this.memberService.list(this.projectId),
      roles: this.roleService.list(this.projectId),
    }).subscribe(({ members, roles }) => {
      this.members.set(members);
      this.roles.set(roles);
      if (!this.inviteRoleId()) this.inviteRoleId.set(roles[0]?.id ?? '');
      if (!this.addMemberRoleId()) this.addMemberRoleId.set(roles[0]?.id ?? '');
    });
    this.invitationService.list(this.projectId).subscribe({
      next: (invitations) => this.invitations.set(invitations),
      error: () => this.invitations.set([]),
    });
    if (this.canSeeOrgRoster()) {
      this.organizationService.listMembers().subscribe({
        next: (orgMembers) => this.orgMembers.set(orgMembers),
        error: () => this.orgMembers.set([]),
      });
    }
  }

  invite(): void {
    const email = this.inviteEmail().trim();
    if (!email || !this.inviteRoleId()) return;
    this.invitationService.create(this.projectId, { email, roleId: this.inviteRoleId() }).subscribe({
      next: (invitation) => {
        this.invitations.update((list) => [invitation, ...list]);
        this.inviteEmail.set('');
        this.toast.success(`Invited ${email}`);
      },
      error: (err) => this.toast.error(err.message),
    });
  }

  addExistingMember(): void {
    const userId = this.addMemberUserId();
    const roleId = this.addMemberRoleId();
    if (!userId || !roleId) return;
    this.memberService.add(this.projectId, { userId, roleId }).subscribe({
      next: (member) => {
        this.members.update((list) => [...list, member]);
        this.addMemberUserId.set('');
        this.toast.success(`${member.name} added to the project`);
      },
      error: (err) => this.toast.error(err.message),
    });
  }

  changeRole(member: MemberResponse, roleId: string): void {
    this.memberService.updateRole(this.projectId, member.userId, { roleId }).subscribe({
      next: (updated) => {
        this.members.update((list) => list.map((m) => (m.userId === updated.userId ? updated : m)));
        this.toast.success('Role updated');
      },
      error: (err) => this.toast.error(err.message),
    });
  }

  async remove(member: MemberResponse): Promise<void> {
    const confirmed = await this.confirmDialog.confirm(`Remove ${member.name} from this project?`, {
      title: 'Remove member',
      confirmLabel: 'Remove',
    });
    if (!confirmed) return;
    this.memberService.remove(this.projectId, member.userId).subscribe({
      next: () => this.members.update((list) => list.filter((m) => m.userId !== member.userId)),
      error: (err) => this.toast.error(err.message),
    });
  }

  async revoke(invitation: InvitationResponse): Promise<void> {
    const confirmed = await this.confirmDialog.confirm(`Revoke the invitation to ${invitation.email}?`, {
      title: 'Revoke invitation',
      confirmLabel: 'Revoke',
    });
    if (!confirmed) return;
    this.invitationService.revoke(this.projectId, invitation.id).subscribe({
      next: () => this.invitations.update((list) => list.filter((i) => i.id !== invitation.id)),
      error: (err) => this.toast.error(err.message),
    });
  }
}
