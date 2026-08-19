import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthStore } from '../state/auth-store';

export const orgAdminGuard: CanActivateFn = () => {
  const authStore = inject(AuthStore);
  const router = inject(Router);
  if (authStore.isOwner() || authStore.canManageMembers()) {
    return true;
  }
  return router.createUrlTree(['/projects']);
};
