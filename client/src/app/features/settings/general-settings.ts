import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { ProjectService } from '../../core/services/project.service';
import { ProjectPermissionsService } from '../../core/state/project-permissions.service';
import { CurrentProjectStore } from '../../core/state/current-project.store';
import { ToastService } from '../../core/state/toast.service';
import { ConfirmDialogService } from '../../shared/ui/confirm-dialog.service';
import { PERMISSION_CODE } from '../../core/models/role.model';
import { resolveProjectId } from '../../core/util/route.util';
import { IconComponent } from '../../shared/ui/icon';
import { colorFor } from '../../shared/util/color-hash';

@Component({
  selector: 'app-general-settings',
  imports: [FormsModule, IconComponent],
  template: `
    <div class="mx-auto flex max-w-4xl flex-col gap-6 pb-24 animate-fade-in">
      <div class="flex items-center gap-3.5">
        <span
          class="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-white"
          style="background: linear-gradient(135deg, #a78bfa, #22d3ee); box-shadow: 0 6px 16px -4px rgb(139 92 246 / 0.45)"
        >
          <app-icon name="settings" [size]="20" />
        </span>
        <div>
          <h1 class="text-[26px] font-bold tracking-tight text-slate-900">General settings</h1>
          <p class="mt-0.5 text-sm text-slate-500">Project identity, item labels, and the danger zone.</p>
        </div>
      </div>

      <!-- Project details -->
      <div class="card p-5">
        <div class="mb-4 flex items-center gap-3">
          <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-600">
            <app-icon name="folder" [size]="17" />
          </span>
          <div class="min-w-0">
            <p class="text-sm font-semibold text-slate-800">Project details</p>
            <p class="truncate text-xs text-slate-500">How this project appears across the app.</p>
          </div>
        </div>

        <div class="flex items-start gap-4">
          <span
            class="mt-0.5 flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-base font-bold {{ avatarColor().bg }} {{ avatarColor().text }}"
          >
            {{ projectKey().slice(0, 2) }}
          </span>
          <div class="grid min-w-0 flex-1 grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label class="label">Project key</label>
              <input type="text" class="input bg-slate-50 font-medium tracking-wide text-slate-500" [value]="projectKey()" disabled />
              <p class="mt-1 text-xs text-slate-400">Can't be changed once set.</p>
            </div>
            <div>
              <label class="label">Name</label>
              <input type="text" class="input" placeholder="Substation Rewire" [(ngModel)]="name" [disabled]="!canManage()" />
              @if (!name().trim()) {
                <p class="mt-1 text-xs text-red-500">Name can't be empty.</p>
              }
            </div>
          </div>
        </div>
      </div>

      <!-- Item labels -->
      <div class="card p-5">
        <div class="mb-4 flex items-center gap-3">
          <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-cyan-100 text-cyan-600">
            <app-icon name="text" [size]="17" />
          </span>
          <div class="min-w-0">
            <p class="text-sm font-semibold text-slate-800">Item labels</p>
            <p class="truncate text-xs text-slate-500">What tickets are called across boards, buttons, and messages.</p>
          </div>
        </div>

        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label class="label">Singular</label>
            <input type="text" class="input" placeholder="Work item" [(ngModel)]="singular" [disabled]="!canManage()" />
          </div>
          <div>
            <label class="label">Plural</label>
            <input type="text" class="input" placeholder="Work items" [(ngModel)]="plural" [disabled]="!canManage()" />
          </div>
        </div>

        <div class="mt-4 flex flex-wrap items-center gap-2 rounded-xl bg-slate-50 px-3.5 py-3 text-sm">
          <app-icon name="sparkles" [size]="15" class="shrink-0 text-primary-500" />
          <span class="text-slate-500">Preview:</span>
          <span class="font-medium text-slate-700">"New {{ previewSingular() }}"</span>
          <span class="text-slate-300">·</span>
          <span class="font-medium text-slate-700">"3 {{ previewPlural() }}"</span>
        </div>
      </div>

      <!-- Sprint label -->
      <div class="card p-5">
        <div class="mb-4 flex items-center gap-3">
          <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
            <app-icon name="calendar" [size]="17" />
          </span>
          <div class="min-w-0">
            <p class="text-sm font-semibold text-slate-800">Sprint label</p>
            <p class="truncate text-xs text-slate-500">Not every team works in sprints — rename it to "Phase", "Billing Cycle", "Round", whatever fits.</p>
          </div>
        </div>

        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label class="label">Singular</label>
            <input type="text" class="input" placeholder="Sprint" [(ngModel)]="sprintSingular" [disabled]="!canManage()" />
          </div>
          <div>
            <label class="label">Plural</label>
            <input type="text" class="input" placeholder="Sprints" [(ngModel)]="sprintPlural" [disabled]="!canManage()" />
          </div>
        </div>

        <div class="mt-4 flex flex-wrap items-center gap-2 rounded-xl bg-slate-50 px-3.5 py-3 text-sm">
          <app-icon name="sparkles" [size]="15" class="shrink-0 text-primary-500" />
          <span class="text-slate-500">Preview:</span>
          <span class="font-medium text-slate-700">"New {{ previewSprintSingular() }}"</span>
          <span class="text-slate-300">·</span>
          <span class="font-medium text-slate-700">"{{ previewSprintPlural() }} settings"</span>
        </div>
      </div>

      <!-- Danger zone -->
      @if (canManage()) {
        <div class="card border-l-4 border-l-red-400 p-5">
          <div class="flex flex-wrap items-center justify-between gap-4">
            <div class="flex items-center gap-3">
              <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-600">
                <app-icon name="trash" [size]="16" />
              </span>
              <div>
                <p class="text-sm font-semibold text-slate-800">Delete this project</p>
                <p class="text-xs text-slate-500">Soft-deletes the project — its data survives but disappears from the API.</p>
              </div>
            </div>
            <button type="button" class="btn-danger shrink-0" (click)="deleteProject()">Delete project</button>
          </div>
        </div>
      }
    </div>

    @if (canManage() && dirty()) {
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
  `,
})
export class GeneralSettingsComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly projectService = inject(ProjectService);
  private readonly permissions = inject(ProjectPermissionsService);
  private readonly toast = inject(ToastService);
  private readonly confirmDialog = inject(ConfirmDialogService);

  readonly currentProjectStore = inject(CurrentProjectStore);
  readonly projectId = resolveProjectId(this.route);
  readonly canManage = toSignal(this.permissions.has(this.projectId, PERMISSION_CODE.PROJECT_MANAGE), {
    initialValue: false,
  });

  readonly name = signal('');
  readonly singular = signal('');
  readonly plural = signal('');
  readonly sprintSingular = signal('');
  readonly sprintPlural = signal('');
  readonly saving = signal(false);

  protected readonly colorFor = colorFor;
  protected readonly projectKey = computed(() => this.currentProjectStore.project()?.key ?? '');
  protected readonly avatarColor = computed(() => colorFor(this.projectKey() || 'project'));
  protected readonly previewSingular = computed(() => (this.singular().trim() || 'Work item').toLowerCase());
  protected readonly previewPlural = computed(() => (this.plural().trim() || 'Work items').toLowerCase());
  protected readonly previewSprintSingular = computed(() => (this.sprintSingular().trim() || 'Sprint').toLowerCase());
  protected readonly previewSprintPlural = computed(() => this.sprintPlural().trim() || 'Sprints');

  private readonly snapshot = signal({ name: '', singular: '', plural: '', sprintSingular: '', sprintPlural: '' });

  readonly dirty = computed(() => {
    const s = this.snapshot();
    return (
      this.name() !== s.name ||
      this.singular() !== s.singular ||
      this.plural() !== s.plural ||
      this.sprintSingular() !== s.sprintSingular ||
      this.sprintPlural() !== s.sprintPlural
    );
  });

  ngOnInit(): void {
    const project = this.currentProjectStore.project();
    if (project) {
      this.applySnapshot(
        project.name,
        project.itemDisplayNameSingular,
        project.itemDisplayNamePlural,
        project.sprintLabelSingular,
        project.sprintLabelPlural,
      );
    }
  }

  private applySnapshot(name: string, singular: string, plural: string, sprintSingular: string, sprintPlural: string): void {
    this.name.set(name);
    this.singular.set(singular);
    this.plural.set(plural);
    this.sprintSingular.set(sprintSingular);
    this.sprintPlural.set(sprintPlural);
    this.snapshot.set({ name, singular, plural, sprintSingular, sprintPlural });
  }

  discard(): void {
    const s = this.snapshot();
    this.applySnapshot(s.name, s.singular, s.plural, s.sprintSingular, s.sprintPlural);
  }

  save(): void {
    if (!this.name().trim()) return;
    this.saving.set(true);
    this.projectService
      .update(this.projectId, {
        name: this.name(),
        itemDisplayNameSingular: this.singular(),
        itemDisplayNamePlural: this.plural(),
        sprintLabelSingular: this.sprintSingular(),
        sprintLabelPlural: this.sprintPlural(),
      })
      .subscribe({
        next: (updated) => {
          this.currentProjectStore.applyUpdate(updated);
          this.applySnapshot(
            updated.name,
            updated.itemDisplayNameSingular,
            updated.itemDisplayNamePlural,
            updated.sprintLabelSingular,
            updated.sprintLabelPlural,
          );
          this.saving.set(false);
          this.toast.success('Project updated');
        },
        error: (err) => {
          this.saving.set(false);
          this.toast.error(err.message);
        },
      });
  }

  async deleteProject(): Promise<void> {
    const confirmed = await this.confirmDialog.confirm(
      `Delete "${this.currentProjectStore.project()?.name}"? It will disappear from the API for everyone.`,
      { title: 'Delete project', confirmLabel: 'Delete' },
    );
    if (!confirmed) return;
    this.projectService.delete(this.projectId).subscribe({
      next: () => {
        this.toast.success('Project deleted');
        this.router.navigateByUrl('/projects');
      },
      error: (err) => this.toast.error(err.message),
    });
  }
}
