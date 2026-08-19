import { ActivatedRoute } from '@angular/router';

/** Walks up the route tree to find the :projectId param, however deep the current route is nested under /projects/:projectId. */
export function resolveProjectId(route: ActivatedRoute): string {
  let current: ActivatedRoute | null = route;
  while (current) {
    const id = current.snapshot.paramMap.get('projectId');
    if (id) return id;
    current = current.parent;
  }
  throw new Error('projectId not found in route hierarchy');
}
