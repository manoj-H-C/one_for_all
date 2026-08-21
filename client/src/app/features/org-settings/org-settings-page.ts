import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { OrganizationSettingsService } from '../../core/services/organization-settings.service';
import { AuthStore } from '../../core/state/auth-store';
import { ToastService } from '../../core/state/toast.service';
import { IconComponent } from '../../shared/ui/icon';
import { colorFor } from '../../shared/util/color-hash';

@Component({
  selector: 'app-org-settings-page',
  imports: [FormsModule, IconComponent],
  template: `
    @if (loading()) {
      <div class="mx-auto flex max-w-3xl flex-col gap-4 animate-fade-in">
        <div class="h-10 w-72 animate-pulse rounded-xl bg-slate-200"></div>
        <div class="h-32 animate-pulse rounded-2xl bg-slate-100"></div>
        <div class="h-40 animate-pulse rounded-2xl bg-slate-100"></div>
      </div>
    } @else {
      <div class="mx-auto flex max-w-3xl flex-col gap-6 pb-24 animate-fade-in">
        <div class="flex items-center gap-3.5">
          <span
            class="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-white"
            style="background: linear-gradient(135deg, #6366f1, #8b5cf6); box-shadow: 0 6px 16px -4px rgb(99 102 241 / 0.45)"
          >
            <app-icon name="building" [size]="20" />
          </span>
          <div>
            <h1 class="text-[26px] font-bold tracking-tight text-slate-900">Organization settings</h1>
            <p class="mt-0.5 text-sm text-slate-500">Identity and org-wide features — owner only.</p>
          </div>
        </div>

        <!-- Organization details -->
        <div class="card p-5">
          <div class="mb-4 flex items-center gap-3">
            <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-600">
              <app-icon name="building" [size]="17" />
            </span>
            <div class="min-w-0">
              <p class="text-sm font-semibold text-slate-800">Organization details</p>
              <p class="truncate text-xs text-slate-500">How your organization appears across the app.</p>
            </div>
          </div>

          <div class="flex items-start gap-4">
            <span
              class="mt-0.5 flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-base font-bold {{ avatarColor().bg }} {{ avatarColor().text }}"
            >
              {{ initials() }}
            </span>
            <div class="min-w-0 flex-1">
              <label class="label" for="orgName">Name</label>
              <input id="orgName" type="text" class="input" placeholder="Acme Construction Co." [(ngModel)]="name" (keyup.enter)="save()" />
              @if (!name().trim()) {
                <p class="mt-1 text-xs text-red-500">Name can't be empty.</p>
              }
            </div>
          </div>
        </div>

        <!-- Purchase orders -->
        <div class="card p-5">
          <div class="flex items-center justify-between gap-3">
            <div class="flex items-center gap-3">
              <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
                <app-icon name="workflow" [size]="17" />
              </span>
              <div class="min-w-0">
                <p class="text-sm font-semibold text-slate-800">Purchase orders</p>
                <p class="mt-0.5 text-xs text-slate-500">
                  Let org admins bundle approved supply requests from any project into one bulk order placed with a vendor.
                </p>
              </div>
            </div>
            <button
              type="button"
              role="switch"
              [attr.aria-checked]="purchaseOrdersEnabled()"
              class="relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200 {{
                purchaseOrdersEnabled() ? 'bg-primary-600' : 'bg-slate-200'
              }}"
              (click)="purchaseOrdersEnabled.set(!purchaseOrdersEnabled())"
            >
              <span
                class="inline-block h-4.5 w-4.5 rounded-full bg-white shadow transition-transform duration-200"
                [style.transform]="purchaseOrdersEnabled() ? 'translateX(22px)' : 'translateX(3px)'"
              ></span>
            </button>
          </div>

          @if (purchaseOrdersEnabled()) {
            <div class="mt-4 flex flex-wrap items-center gap-2 rounded-xl bg-slate-50 px-3.5 py-3 text-sm animate-fade-in">
              <app-icon name="sparkles" [size]="15" class="shrink-0 text-primary-500" />
              <span class="text-slate-600">"Purchase Orders" now appears in the sidebar for you and every admin.</span>
            </div>
          } @else {
            <div class="mt-4 flex flex-wrap items-center gap-2 rounded-xl bg-slate-50 px-3.5 py-3 text-sm">
              <app-icon name="filter" [size]="15" class="shrink-0 text-slate-400" />
              <span class="text-slate-500">Off — the Purchase Orders page and its API are unreachable, even by direct link.</span>
            </div>
          }
        </div>
      </div>

      @if (dirty()) {
        <div
          class="fixed bottom-6 left-1/2 z-30 flex w-[calc(100%-3rem)] max-w-lg -translate-x-1/2 items-center justify-between gap-3 rounded-2xl border border-primary-200 bg-white/95 p-3.5 pl-4 backdrop-blur-md animate-fade-in"
          style="box-shadow: var(--shadow-lift)"
        >
          <p class="flex items-center gap-2 text-sm font-medium text-slate-700">
            <span class="h-2 w-2 shrink-0 rounded-full bg-primary-500"></span>
            You have unsaved changes
          </p>
          <div class="flex shrink-0 gap-2">
            <button type="button" class="btn-secondary" [disabled]="saving()" (click)="discard()">Discard</button>
            <button type="button" class="btn-primary" [disabled]="saving() || !name().trim()" (click)="save()">
              {{ saving() ? 'Saving…' : 'Save changes' }}
            </button>
          </div>
        </div>
      }
    }
  `,
})
export class OrgSettingsPageComponent implements OnInit {
  private readonly settingsService = inject(OrganizationSettingsService);
  private readonly authStore = inject(AuthStore);
  private readonly toast = inject(ToastService);

  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly name = signal('');
  readonly purchaseOrdersEnabled = signal(false);

  protected readonly colorFor = colorFor;
  protected readonly avatarColor = computed(() => colorFor(this.name() || 'org'));
  protected readonly initials = computed(() => {
    const parts = this.name().trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return '?';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  });

  private readonly snapshot = signal({ name: '', purchaseOrdersEnabled: false });

  readonly dirty = computed(() => {
    const s = this.snapshot();
    return this.name() !== s.name || this.purchaseOrdersEnabled() !== s.purchaseOrdersEnabled;
  });

  ngOnInit(): void {
    this.settingsService.get().subscribe({
      next: (settings) => {
        this.applySnapshot({ name: settings.name, purchaseOrdersEnabled: settings.purchaseOrdersEnabled });
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.toast.error(err.message);
      },
    });
  }

  private applySnapshot(s: { name: string; purchaseOrdersEnabled: boolean }): void {
    this.name.set(s.name);
    this.purchaseOrdersEnabled.set(s.purchaseOrdersEnabled);
    this.snapshot.set(s);
  }

  discard(): void {
    this.applySnapshot(this.snapshot());
  }

  save(): void {
    if (!this.name().trim()) return;
    this.saving.set(true);
    this.settingsService.update({ name: this.name().trim(), purchaseOrdersEnabled: this.purchaseOrdersEnabled() }).subscribe({
      next: (updated) => {
        this.applySnapshot({ name: updated.name, purchaseOrdersEnabled: updated.purchaseOrdersEnabled });
        this.saving.set(false);
        this.toast.success('Organization settings updated');

        // keep the sidebar's org name and the Purchase Orders nav item in
        // sync immediately - both read off AuthStore.currentUser, which
        // otherwise wouldn't reflect this until the next login/refresh.
        const currentUser = this.authStore.currentUser();
        if (currentUser) {
          this.authStore.setCurrentUser({
            ...currentUser,
            orgName: updated.name,
            purchaseOrdersEnabled: updated.purchaseOrdersEnabled,
          });
        }
      },
      error: (err) => {
        this.saving.set(false);
        this.toast.error(err.message);
      },
    });
  }
}
