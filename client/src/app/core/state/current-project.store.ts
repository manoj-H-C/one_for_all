import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { ProjectResponse } from '../models/project.model';
import { ProjectService } from '../services/project.service';

/**
 * Holds the project currently selected via the /projects/:projectId route
 * segment, resolved once by projectResolver and shared by the sidebar and
 * every nested page so they don't each re-fetch it.
 */
@Injectable({ providedIn: 'root' })
export class CurrentProjectStore {
  private readonly projectService = inject(ProjectService);

  readonly project = signal<ProjectResponse | null>(null);

  // "Work item"/"Work items" by default (see Project.itemDisplayNameSingular
  // in the backend), but every project can rename what its tickets are
  // called - Task, Bug, Lead, Work Order, etc. Falls back defensively in
  // case the field was ever saved blank. Use .toLowerCase() at call sites
  // that need the label mid-sentence rather than at the start of a label.
  readonly itemLabelSingular = computed(() => this.project()?.itemDisplayNameSingular?.trim() || 'Work item');
  readonly itemLabelPlural = computed(() => this.project()?.itemDisplayNamePlural?.trim() || 'Work items');

  load(projectId: string): Observable<ProjectResponse> {
    return this.projectService.get(projectId).pipe(tap((project) => this.project.set(project)));
  }

  applyUpdate(updated: ProjectResponse): void {
    this.project.set(updated);
  }
}
