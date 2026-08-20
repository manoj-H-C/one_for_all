import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { WorkItemService } from '../../core/services/work-item.service';
import { ToastService } from '../../core/state/toast.service';

/**
 * Notifications only carry a workItemId, not a projectId (see
 * NotificationResponse), so a notification link can't build the full
 * /projects/:projectId/work-items/:id path directly. This route fetches the
 * item by id alone (GET /api/work-items/{id} needs no project context) and
 * forwards to its real, project-scoped URL.
 */
@Component({
  selector: 'app-work-item-redirect',
  template: `<p class="p-6 text-sm text-slate-400">Opening…</p>`,
})
export class WorkItemRedirectComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly workItemService = inject(WorkItemService);
  private readonly toast = inject(ToastService);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.workItemService.get(id).subscribe({
      next: (item) => this.router.navigate(['/projects', item.projectId, 'work-items', item.id], { replaceUrl: true }),
      error: (err) => {
        this.toast.error(err.message ?? 'Work item not found');
        this.router.navigateByUrl('/projects');
      },
    });
  }
}
