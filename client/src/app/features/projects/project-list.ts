import { Component, OnInit, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
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
  imports: [ReactiveFormsModule, RouterLink, ModalComponent, EmptyStateComponent, IconComponent],
  template: `
    <div class="mx-auto max-w-5xl">
      <div class="mb-8 flex items-center justify-between">
        <div>
          <h1 class="text-[26px] font-bold tracking-tight text-slate-900">Projects</h1>
          <p class="mt-0.5 text-sm text-slate-500">Everything your organization is working on.</p>
        </div>
        @if (authStore.canCreateProjects()) {
          <button type="button" class="btn-primary" (click)="openCreate()">
            <app-icon name="plus" [size]="17" />
            New project
          </button>
        }
      </div>

      @if (projects().length === 0) {
        <app-empty-state icon="🗂️" title="No projects yet" description="Create your first project to get a board, roles and a workflow set up automatically.">
          @if (authStore.canCreateProjects()) {
            <button type="button" class="btn-primary mt-2" (click)="openCreate()">+ New project</button>
          }
        </app-empty-state>
      } @else {
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          @for (project of projects(); track project.id) {
            <a [routerLink]="['/projects', project.id, 'board']" class="card-hover group flex flex-col gap-3 p-5">
              <div class="flex items-center gap-3">
                <span
                  class="flex h-11 w-11 items-center justify-center rounded-xl text-sm font-bold transition-transform duration-200 group-hover:scale-105 {{ colorFor(project.key).bg }} {{ colorFor(project.key).text }}"
                >
                  {{ project.key.slice(0, 2) }}
                </span>
                <div class="min-w-0">
                  <p class="truncate font-semibold text-slate-900">{{ project.name }}</p>
                  <p class="text-xs font-medium text-slate-400">{{ project.key }}</p>
                </div>
              </div>
              @if (project.templateType) {
                <span class="w-fit rounded-full bg-primary-50 px-2.5 py-1 text-xs font-medium text-primary-700">{{ project.templateType }}</span>
              }
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
  readonly createOpen = signal(false);
  readonly submitting = signal(false);
  readonly error = signal<string | null>(null);
  protected readonly colorFor = colorFor;

  readonly form = this.fb.nonNullable.group({
    name: ['', Validators.required],
    key: ['', [Validators.required, Validators.maxLength(50)]],
    templateType: [''],
  });

  ngOnInit(): void {
    this.load();
  }

  private load(): void {
    this.projectService.list().subscribe((projects) => this.projects.set(projects));
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
