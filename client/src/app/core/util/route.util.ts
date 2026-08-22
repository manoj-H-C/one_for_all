import { ActivatedRoute } from '@angular/router';
import { Observable, distinctUntilChanged, map, merge } from 'rxjs';

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

/**
 * Emits the :projectId param every time it changes anywhere in the route
 * tree. The nav bar's project switcher navigates within the same
 * board/settings/inventory route - only the ancestor :projectId param
 * itself changes - so Angular reuses the existing component instance
 * instead of re-creating it, and a one-time resolveProjectId() read at
 * construction goes stale. Subscribe to this instead (same idea as
 * work-item-detail's own route.paramMap subscription for its :id param) so
 * the page notices and reloads.
 */
export function projectId$(route: ActivatedRoute): Observable<string> {
  const ancestors: ActivatedRoute[] = [];
  for (let current: ActivatedRoute | null = route; current; current = current.parent) {
    ancestors.push(current);
  }
  return merge(...ancestors.map((r) => r.paramMap)).pipe(
    map(() => resolveProjectId(route)),
    distinctUntilChanged(),
  );
}
