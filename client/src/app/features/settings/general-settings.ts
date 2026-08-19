import { Component, OnInit, inject, signal } from '@angular/core';
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

@Component({
  selector: 'app-general-settings',
  imports: [FormsModule],
  template: `
    <div class="mx-auto max-w-4xl">
      <div class="mb-6">
        <h1 class="text-[26px] font-bold tracking-tight text-slate-900">General settings</h1>
        <p class="mt-0.5 text-sm text-slate-500">Project name, item labels, and the danger zone.</p>
      </div>

      <div class="card flex flex-col gap-4 p-5">
        <div>
          <label class="label">Project key</label>
          <input type="text" class="input bg-slate-50" [value]="currentProjectStore.project()?.key" disabled />
          <p class="mt-1 text-xs text-slate-400">Can't be changed once set.</p>
        </div>
        <div>
          <label class="label">Name</label>
          <input type="text" class="input" [(ngModel)]="name" [disabled]="!canManage()" />
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="label">Item name (singular)</label>
            <input type="text" class="input" [(ngModel)]="singular" [disabled]="!canManage()" />
          </div>
          <div>
            <label class="label">Item name (plural)</label>
            <input type="text" class="input" [(ngModel)]="plural" [disabled]="!canManage()" />
          </div>
        </div>
        @if (canManage()) {
          <div class="flex justify-end">
            <button type="button" class="btn-primary" [disabled]="saving()" (click)="save()">
              {{ saving() ? 'Saving…' : 'Save changes' }}
            </button>
          </div>
        }
      </div>

      @if (canManage()) {
        <div class="card mt-6 flex items-center justify-between p-5">
          <div>
            <p class="font-medium text-slate-800">Delete this project</p>
            <p class="text-sm text-slate-500">Soft-deletes the project — its data survives but disappears from the API.</p>
          </div>
          <button type="button" class="btn-danger" (click)="deleteProject()">Delete project</button>
        </div>
      }
    </div>
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
  readonly saving = signal(false);

  ngOnInit(): void {
    const project = this.currentProjectStore.project();
    if (project) {
      this.name.set(project.name);
      this.singular.set(project.itemDisplayNameSingular);
      this.plural.set(project.itemDisplayNamePlural);
    }
  }

  save(): void {
    this.saving.set(true);
    this.projectService
      .update(this.projectId, {
        name: this.name(),
        itemDisplayNameSingular: this.singular(),
        itemDisplayNamePlural: this.plural(),
      })
      .subscribe({
        next: (updated) => {
          this.currentProjectStore.applyUpdate(updated);
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
