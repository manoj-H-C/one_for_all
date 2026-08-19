import { Injectable, inject, signal } from '@angular/core';
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

  load(projectId: string): Observable<ProjectResponse> {
    return this.projectService.get(projectId).pipe(tap((project) => this.project.set(project)));
  }

  applyUpdate(updated: ProjectResponse): void {
    this.project.set(updated);
  }
}
