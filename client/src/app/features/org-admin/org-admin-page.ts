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
  OrganizationMemberBulkCreateRow,
  OrganizationMemberBulkCreateResult,
  OrganizationInvitationBulkCreateRow,
  OrganizationInvitationBulkCreateResult,
} from '../../core/models/organization.model';
import { AvatarComponent } from '../../shared/ui/avatar';
import { IconComponent } from '../../shared/ui/icon';
import { EmptyStateComponent } from '../../shared/ui/empty-state';
import { csvEscape, downloadCsv } from '../../shared/util/csv';

const BULK_CREATE_TEMPLATE_CSV =
  'name,email,can_create_projects,can_manage_members\n' +
  'John Doe,john@acme.com,yes,no\n' +
  'Jane Smith,jane@acme.com,no,no\n';

const BULK_INVITE_TEMPLATE_CSV =
  'email,can_create_projects,can_manage_members\n' +
  'john@acme.com,yes,no\n' +
  'jane@acme.com,no,no\n';

/** Minimal RFC4180 CSV parser - handles quoted fields (with embedded commas/newlines/escaped quotes) and bare CRLF/LF line endings. Good enough for a template this simple without pulling in a CSV library. */
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
      continue;
    }
    if (char === '"') {
      inQuotes = true;
    } else if (char === ',') {
      row.push(field);
      field = '';
    } else if (char === '\n') {
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else if (char !== '\r') {
      field += char;
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.some((c) => c.trim() !== ''));
}

function toBool(value: string | undefined): boolean {
  const v = (value ?? '').trim().toLowerCase();
  return v === 'yes' || v === 'true' || v === '1' || v === 'y';
}

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
        <div class="card flex flex-wrap items-start justify-between gap-4 border-emerald-200 bg-emerald-50 p-5">
          <div class="min-w-0">
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

      <div class="card p-5">
        <div class="mb-4 flex items-center gap-3">
          <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-600">
            <app-icon name="list" [size]="17" />
          </span>
          <div class="min-w-0">
            <p class="text-sm font-semibold text-slate-800">Bulk create from file</p>
            <p class="truncate text-xs text-slate-500">Download the template, fill it in, then upload it back.</p>
          </div>
        </div>
        <div class="flex flex-col gap-3">
          <div class="flex flex-wrap items-center gap-2">
            <button type="button" class="btn-secondary" (click)="downloadTemplate()">Download template</button>
            <input #bulkFileInput type="file" accept=".csv" class="hidden" (change)="onBulkFileSelected($event)" />
            <button type="button" class="btn-secondary" (click)="bulkFileInput.click()">Choose file</button>
            @if (bulkFile(); as f) {
              <span class="truncate text-xs text-slate-500">{{ f.name }}</span>
            }
          </div>
          <button
            type="button"
            class="btn-primary w-full"
            [disabled]="!bulkFile() || bulkUploading()"
            (click)="uploadBulkFile(bulkFileInput)"
          >
            {{ bulkUploading() ? 'Uploading…' : 'Upload and create' }}
          </button>

          @if (bulkResult(); as result) {
            <div class="mt-1 flex flex-col gap-3 rounded-xl border border-slate-100 p-3.5">
              <div class="flex flex-wrap items-center justify-between gap-2">
                <p class="text-sm text-slate-700">
                  <span class="font-semibold text-emerald-600">{{ result.created.length }} created</span>
                  @if (result.failed.length > 0) {
                    <span class="text-slate-400"> · </span>
                    <span class="font-semibold text-red-600">{{ result.failed.length }} failed</span>
                  }
                </p>
                @if (result.created.length > 0) {
                  <button type="button" class="text-xs font-semibold text-primary-600 hover:text-primary-700" (click)="downloadCredentials()">
                    Download credentials (CSV)
                  </button>
                }
              </div>
              @if (result.failed.length > 0) {
                <div class="overflow-x-auto rounded-lg border border-red-100">
                  <table class="w-full min-w-[420px] text-xs">
                    <thead class="bg-red-50 text-left font-semibold text-red-700">
                      <tr>
                        <th class="px-3 py-2">Row</th>
                        <th class="px-3 py-2">Name</th>
                        <th class="px-3 py-2">Email</th>
                        <th class="px-3 py-2">Reason</th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-red-100">
                      @for (f of result.failed; track f.rowNumber) {
                        <tr>
                          <td class="px-3 py-2 text-slate-500">{{ f.rowNumber }}</td>
                          <td class="px-3 py-2 text-slate-700">{{ f.name || '—' }}</td>
                          <td class="px-3 py-2 text-slate-700">{{ f.email || '—' }}</td>
                          <td class="px-3 py-2 text-red-700">{{ f.reason }}</td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
              }
            </div>
          }
        </div>
      </div>

      <div class="card p-5">
        <div class="mb-4 flex items-center gap-3">
          <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
            <app-icon name="mail" [size]="17" />
          </span>
          <div class="min-w-0">
            <p class="text-sm font-semibold text-slate-800">Bulk invite by email</p>
            <p class="truncate text-xs text-slate-500">Download the template, fill it in, then upload it back.</p>
          </div>
        </div>
        <div class="flex flex-col gap-3">
          <div class="flex flex-wrap items-center gap-2">
            <button type="button" class="btn-secondary" (click)="downloadInviteTemplate()">Download template</button>
            <input #bulkInviteFileInput type="file" accept=".csv" class="hidden" (change)="onBulkInviteFileSelected($event)" />
            <button type="button" class="btn-secondary" (click)="bulkInviteFileInput.click()">Choose file</button>
            @if (bulkInviteFile(); as f) {
              <span class="truncate text-xs text-slate-500">{{ f.name }}</span>
            }
          </div>
          <button
            type="button"
            class="btn-primary w-full"
            [disabled]="!bulkInviteFile() || bulkInviteUploading()"
            (click)="uploadBulkInviteFile(bulkInviteFileInput)"
          >
            {{ bulkInviteUploading() ? 'Uploading…' : 'Upload and send invites' }}
          </button>

          @if (bulkInviteResult(); as result) {
            <div class="mt-1 flex flex-col gap-3 rounded-xl border border-slate-100 p-3.5">
              <p class="text-sm text-slate-700">
                <span class="font-semibold text-emerald-600">{{ result.created.length }} invited</span>
                @if (result.failed.length > 0) {
                  <span class="text-slate-400"> · </span>
                  <span class="font-semibold text-red-600">{{ result.failed.length }} failed</span>
                }
              </p>
              @if (result.failed.length > 0) {
                <div class="overflow-x-auto rounded-lg border border-red-100">
                  <table class="w-full min-w-[360px] text-xs">
                    <thead class="bg-red-50 text-left font-semibold text-red-700">
                      <tr>
                        <th class="px-3 py-2">Row</th>
                        <th class="px-3 py-2">Email</th>
                        <th class="px-3 py-2">Reason</th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-red-100">
                      @for (f of result.failed; track f.rowNumber) {
                        <tr>
                          <td class="px-3 py-2 text-slate-500">{{ f.rowNumber }}</td>
                          <td class="px-3 py-2 text-slate-700">{{ f.email || '—' }}</td>
                          <td class="px-3 py-2 text-red-700">{{ f.reason }}</td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
              }
            </div>
          }
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
        <div class="overflow-x-auto">
        <table class="w-full min-w-[560px] text-sm">
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
      </div>

      @if (invitations().length > 0) {
        <div class="card overflow-hidden">
          <div class="border-b border-slate-100 px-5 py-3.5">
            <p class="text-sm font-semibold text-slate-700">Pending invitations</p>
          </div>
          <div class="overflow-x-auto">
          <table class="w-full min-w-[480px] text-sm">
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

  readonly bulkFile = signal<File | null>(null);
  readonly bulkUploading = signal(false);
  readonly bulkResult = signal<OrganizationMemberBulkCreateResult | null>(null);

  readonly bulkInviteFile = signal<File | null>(null);
  readonly bulkInviteUploading = signal(false);
  readonly bulkInviteResult = signal<OrganizationInvitationBulkCreateResult | null>(null);

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

  downloadTemplate(): void {
    downloadCsv(BULK_CREATE_TEMPLATE_CSV, 'user_bulk_upload_template.csv');
  }

  downloadInviteTemplate(): void {
    downloadCsv(BULK_INVITE_TEMPLATE_CSV, 'user_bulk_invite_template.csv');
  }

  onBulkFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.bulkFile.set(input.files?.[0] ?? null);
    this.bulkResult.set(null);
  }

  uploadBulkFile(fileInputEl: HTMLInputElement): void {
    const file = this.bulkFile();
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const rows = parseCsv(String(reader.result ?? ''));
      if (rows.length === 0) {
        this.toast.error('No rows found in that file');
        return;
      }
      const header = rows[0].map((h) => h.trim().toLowerCase());
      const nameIdx = header.indexOf('name');
      const emailIdx = header.indexOf('email');
      if (nameIdx === -1 || emailIdx === -1) {
        this.toast.error('Columns not recognized — please use the downloaded template');
        return;
      }
      const createIdx = header.indexOf('can_create_projects');
      const manageIdx = header.indexOf('can_manage_members');

      const bulkRows: OrganizationMemberBulkCreateRow[] = rows.slice(1).map((cols, i) => ({
        rowNumber: i + 2, // +1 for 0-based index, +1 for the header row
        name: cols[nameIdx] ?? '',
        email: cols[emailIdx] ?? '',
        canCreateProjects: toBool(createIdx >= 0 ? cols[createIdx] : undefined),
        canManageMembers: toBool(manageIdx >= 0 ? cols[manageIdx] : undefined),
      }));

      this.bulkUploading.set(true);
      this.organizationService.bulkCreateMembers(bulkRows).subscribe({
        next: (result) => {
          this.bulkUploading.set(false);
          this.bulkResult.set(result);
          if (result.created.length > 0) {
            this.members.update((list) => [
              ...list,
              ...result.created.map((c) => ({
                id: c.id,
                name: c.name,
                email: c.email,
                owner: false,
                canCreateProjects: c.canCreateProjects,
                canManageMembers: c.canManageMembers,
                createdAt: c.createdAt,
              })),
            ]);
          }
          this.bulkFile.set(null);
          fileInputEl.value = '';
          this.toast.success(
            `${result.created.length} user${result.created.length === 1 ? '' : 's'} created` +
              (result.failed.length > 0 ? `, ${result.failed.length} failed` : ''),
          );
        },
        error: (err) => {
          this.bulkUploading.set(false);
          this.toast.error(err.message);
        },
      });
    };
    reader.readAsText(file);
  }

  downloadCredentials(): void {
    const created = this.bulkResult()?.created ?? [];
    if (created.length === 0) return;
    const body = created
      .map((c) => [csvEscape(c.name), csvEscape(c.email), csvEscape(c.temporaryPassword)].join(','))
      .join('\n');
    downloadCsv(`name,email,temporary_password\n${body}\n`, 'new_user_credentials.csv');
  }

  onBulkInviteFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.bulkInviteFile.set(input.files?.[0] ?? null);
    this.bulkInviteResult.set(null);
  }

  uploadBulkInviteFile(fileInputEl: HTMLInputElement): void {
    const file = this.bulkInviteFile();
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const rows = parseCsv(String(reader.result ?? ''));
      if (rows.length === 0) {
        this.toast.error('No rows found in that file');
        return;
      }
      const header = rows[0].map((h) => h.trim().toLowerCase());
      const emailIdx = header.indexOf('email');
      if (emailIdx === -1) {
        this.toast.error('Columns not recognized — please use the downloaded template');
        return;
      }
      const createIdx = header.indexOf('can_create_projects');
      const manageIdx = header.indexOf('can_manage_members');

      const bulkRows: OrganizationInvitationBulkCreateRow[] = rows.slice(1).map((cols, i) => ({
        rowNumber: i + 2,
        email: cols[emailIdx] ?? '',
        canCreateProjects: toBool(createIdx >= 0 ? cols[createIdx] : undefined),
        canManageMembers: toBool(manageIdx >= 0 ? cols[manageIdx] : undefined),
      }));

      this.bulkInviteUploading.set(true);
      this.organizationService.bulkCreateInvitations(bulkRows).subscribe({
        next: (result) => {
          this.bulkInviteUploading.set(false);
          this.bulkInviteResult.set(result);
          if (result.created.length > 0) {
            this.invitations.update((list) => [...result.created, ...list]);
          }
          this.bulkInviteFile.set(null);
          fileInputEl.value = '';
          this.toast.success(
            `${result.created.length} invite${result.created.length === 1 ? '' : 's'} sent` +
              (result.failed.length > 0 ? `, ${result.failed.length} failed` : ''),
          );
        },
        error: (err) => {
          this.bulkInviteUploading.set(false);
          this.toast.error(err.message);
        },
      });
    };
    reader.readAsText(file);
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
