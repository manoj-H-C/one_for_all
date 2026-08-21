import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthStore } from '../state/auth-store';

// owner or canCreateProjects (which already bakes in the owner bypass -
// see AuthStore.canCreateProjects) - deliberately not orgAdminGuard's
// owner-or-canManageMembers bar, since Purchase Orders isn't a member-
// administration feature.
export const purchaseOrdersAccessGuard: CanActivateFn = () => {
  const authStore = inject(AuthStore);
  const router = inject(Router);
  if (authStore.canCreateProjects()) {
    return true;
  }
  return router.createUrlTree(['/projects']);
};
