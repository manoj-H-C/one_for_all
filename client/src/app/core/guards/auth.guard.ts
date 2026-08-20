import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthStore } from '../state/auth-store';

export const authGuard: CanActivateFn = (route, state) => {
  const authStore = inject(AuthStore);
  const router = inject(Router);
  if (!authStore.isAuthenticated()) {
    return router.createUrlTree(['/login'], { queryParams: { redirectTo: state.url } });
  }
  // forced-reset accounts can only ever land on /change-password - the
  // server enforces the same rule on every other endpoint (see
  // JwtAuthenticationFilter), this just avoids a page full of failed calls.
  if (authStore.currentUser()?.mustResetPassword && !state.url.startsWith('/change-password')) {
    return router.createUrlTree(['/change-password']);
  }
  return true;
};
