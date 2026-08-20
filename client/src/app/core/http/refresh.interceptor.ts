import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthStore } from '../state/auth-store';

const PUBLIC_AUTH_PATHS = ['/api/auth/login', '/api/auth/register', '/api/auth/refresh'];

/**
 * On a 401 from any authenticated endpoint, tries exactly one silent token
 * refresh and retries the original request; if the refresh itself fails,
 * the session is cleared and the user is sent back to /login. Must run
 * closer to the backend than apiResponseInterceptor so it still sees the
 * raw HttpErrorResponse (status 401), not the normalized error message.
 */
export const refreshInterceptor: HttpInterceptorFn = (req, next) => {
  const authStore = inject(AuthStore);
  const router = inject(Router);

  if (PUBLIC_AUTH_PATHS.some((path) => req.url.includes(path))) {
    return next(req);
  }

  return next(req).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse && error.status === 401 && authStore.isAuthenticated()) {
        return authStore.refreshAccessToken().pipe(
          switchMap((auth) => next(req.clone({ setHeaders: { Authorization: `Bearer ${auth.accessToken}` } }))),
          catchError((refreshError) => {
            authStore.logout();
            router.navigateByUrl('/login');
            return throwError(() => refreshError);
          }),
        );
      }
      return throwError(() => error);
    }),
  );
};
