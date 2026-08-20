import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ReactiveFormsModule, FormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ProjectService } from '../../core/services/project.service';
import { AuthStore } from '../../core/state/auth-store';
import { ToastService } from '../../core/state/toast.service';
import { ProjectResponse } from '../../core/models/project.model';
import { ApiError } from '../../core/models/common.model';
import { ModalComponent } from '../../shared/ui/modal';
import { EmptyStateComponent } from '../../shared/ui/empty-state';
import { IconComponent } from '../../shared/ui/icon';
import { colorFor } from '../../shared/util/color-hash';

@Component({
  selector: 'app-project-list',
  imports: [ReactiveFormsModule, FormsModule, RouterLink, ModalComponent, EmptyStateComponent, IconComponent, DatePipe],
  template: `
    <div class="mx-auto flex max-w-6xl flex-col gap-6 animate-fade-in">
      <div class="flex flex-wrap items-center gap-4">
        <div class="flex min-w-0 items-center gap-3.5">
          <span
            class="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-white"
            style="background: linear-gradient(135deg, #a78bfa, #22d3ee); box-shadow: 0 6px 16px -4px rgb(139 92 246 / 0.45)"
          >
            <app-icon name="folder" [size]="22" />
          </span>
          <div class="min-w-0">
            <h1 class="text-[26px] font-bold tracking-tight text-slate-900">Projects</h1>
            <p class="mt-0.5 text-sm text-slate-500">
              @if (!loading()) {
                {{ projects().length }} project{{ projects().length === 1 ? '' : 's' }} · Everything your organization is working on
              } @else {
                Loading your projects…
              }
            </p>
          </div>
        </div>

        <div class="ml-auto flex w-full flex-wrap items-center gap-2.5 sm:w-auto">
          @if (projects().length > 0) {
            <div class="relative min-w-0 flex-1 sm:w-64 sm:flex-none">
              <app-icon name="search" [size]="16" class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input type="text" class="input w-full pl-9" placeholder="Search projects…" [ngModel]="query()" (ngModelChange)="query.set($event)" />
            </div>
          }
          @if (authStore.canCreateProjects()) {
            <button type="button" class="btn-primary shrink-0" (click)="openCreate()">
              <app-icon name="plus" [size]="17" />
              New project
            </button>
          }
        </div>
      </div>

      @if (loading()) {
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          @for (i of skeletonRows; track i) {
            <div class="card flex animate-pulse flex-col gap-4 p-5">
              <div class="flex items-center gap-3">
                <div class="h-12 w-12 rounded-xl bg-slate-200"></div>
                <div class="flex-1 space-y-2">
                  <div class="h-3.5 w-2/3 rounded-full bg-slate-200"></div>
                  <div class="h-3 w-1/3 rounded-full bg-slate-100"></div>
                </div>
              </div>
              <div class="h-3 w-1/2 rounded-full bg-slate-100"></div>
            </div>
          }
        </div>
      } @else if (projects().length === 0) {
        <app-empty-state icon="🗂️" title="No projects yet" description="Create your first project to get a board, roles and a workflow set up automatically.">
          @if (authStore.canCreateProjects()) {
            <button type="button" class="btn-primary mt-2" (click)="openCreate()">+ New project</button>
          }
        </app-empty-state>
      } @else if (filteredProjects().length === 0) {
        <app-empty-state icon="🔍" title="No projects match your search" description="Try a different project name or key.">
          <button type="button" class="btn-secondary mt-2" (click)="query.set('')">Clear search</button>
        </app-empty-state>
      } @else {
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          @for (project of filteredProjects(); track project.id) {
            <a [routerLink]="['/projects', project.id, 'board']" class="card-hover group relative flex flex-col gap-4 overflow-hidden p-5">
              <div class="absolute inset-x-0 top-0 h-1 {{ colorFor(project.key).dot }}"></div>

              <div class="flex items-start justify-between gap-2">
                <div class="flex min-w-0 items-center gap-3">
                  <span
                    class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-sm font-bold transition-transform duration-200 group-hover:scale-105 {{ colorFor(project.key).bg }} {{ colorFor(project.key).text }}"
                  >
                    {{ project.key.slice(0, 2) }}
                  </span>
                  <div class="min-w-0">
                    <p class="truncate font-semibold text-slate-900">{{ project.name }}</p>
                    <p class="text-xs font-medium text-slate-400">{{ project.key }}</p>
                  </div>
                </div>
                <app-icon
                  name="arrow-left"
                  [size]="16"
                  class="mt-1.5 shrink-0 rotate-180 text-slate-300 opacity-0 transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-primary-500 group-hover:opacity-100"
                />
              </div>

              <div class="flex flex-wrap items-center gap-1.5">
                @if (project.templateType) {
                  <span class="rounded-full bg-primary-50 px-2.5 py-1 text-xs font-medium text-primary-700">{{ project.templateType }}</span>
                }
                <span class="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-500">{{ project.itemDisplayNamePlural }}</span>
              </div>

              <div class="mt-auto flex items-center gap-1.5 border-t border-slate-100 pt-3 text-xs text-slate-400">
                <app-icon name="calendar" [size]="13" />
                Created {{ project.createdAt | date: 'MMM d, y' }}
              </div>
            </a>
          }
        </div>
      }
    </div>

    <app-modal [open]="createOpen()" title="New project" (closed)="createOpen.set(false)">
      <form [formGroup]="form" (ngSubmit)="submit()" class="flex flex-col gap-4">
        <div>
          <label class="label" for="name">Project name</label>
          <input id="name" type="text" class="input" formControlName="name" placeholder="Substation Rewire" />
        </div>
        <div>
          <label class="label" for="key">Key</label>
          <input id="key" type="text" class="input uppercase" formControlName="key" placeholder="SUB" maxlength="50" />
          <p class="mt-1 text-xs text-slate-400">Unique per organization. Can't be changed later.</p>
        </div>
        <div>
          <label class="label" for="templateType">Template / industry (optional)</label>
          <input id="templateType" type="text" class="input" formControlName="templateType" placeholder="electrical" />
        </div>

        @if (error()) {
          <p class="text-sm text-red-600">{{ error() }}</p>
        }

        <div class="mt-2 flex justify-end gap-2">
          <button type="button" class="btn-secondary" (click)="createOpen.set(false)">Cancel</button>
          <button type="submit" class="btn-primary" [disabled]="form.invalid || submitting()">
            {{ submitting() ? 'Creating…' : 'Create project' }}
          </button>
        </div>
      </form>
    </app-modal>
  `,
})
export class ProjectListComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly projectService = inject(ProjectService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  readonly authStore = inject(AuthStore);
  readonly projects = signal<ProjectResponse[]>([]);
  readonly loading = signal(true);
  readonly query = signal('');
  readonly createOpen = signal(false);
  readonly submitting = signal(false);
  readonly error = signal<string | null>(null);
  protected readonly colorFor = colorFor;
  protected readonly skeletonRows = [1, 2, 3, 4, 5, 6];

  readonly filteredProjects = computed(() => {
    const q = this.query().trim().toLowerCase();
    if (!q) return this.projects();
    return this.projects().filter((p) => p.name.toLowerCase().includes(q) || p.key.toLowerCase().includes(q));
  });

  readonly form = this.fb.nonNullable.group({
    name: ['', Validators.required],
    key: ['', [Validators.required, Validators.maxLength(50)]],
    templateType: [''],
  });

  ngOnInit(): void {
    this.load();
  }

  private load(): void {
    this.loading.set(true);
    this.projectService.list().subscribe((projects) => {
      this.projects.set(projects);
      this.loading.set(false);
    });
  }

  openCreate(): void {
    this.form.reset({ name: '', key: '', templateType: '' });
    this.error.set(null);
    this.createOpen.set(true);
  }

  submit(): void {
    if (this.form.invalid) return;
    this.submitting.set(true);
    this.error.set(null);
    const raw = this.form.getRawValue();
    this.projectService
      .create({ name: raw.name, key: raw.key.toUpperCase(), templateType: raw.templateType || null })
      .subscribe({
        next: (project) => {
          this.submitting.set(false);
          this.createOpen.set(false);
          this.toast.success(`${project.name} created`);
          this.router.navigate(['/projects', project.id, 'board']);
        },
        error: (err: ApiError) => {
          this.submitting.set(false);
          this.error.set(err.message);
        },
      });
  }
}
