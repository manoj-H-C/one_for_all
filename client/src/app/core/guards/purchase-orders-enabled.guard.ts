import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthStore } from '../state/auth-store';

// separate from purchaseOrdersAccessGuard (owner/canCreateProjects) - this
// checks the org-wide feature flag itself, same "off is off for everyone"
// rule the backend enforces in PurchaseOrderServiceImpl.requireAdmin. Both
// guards run on the /purchase-orders route together.
export const purchaseOrdersEnabledGuard: CanActivateFn = () => {
  const authStore = inject(AuthStore);
  const router = inject(Router);
  if (authStore.purchaseOrdersEnabled()) {
    return true;
  }
  return router.createUrlTree(['/projects']);
};
