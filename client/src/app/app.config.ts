import { ApplicationConfig, inject, provideAppInitializer, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { catchError, of } from 'rxjs';

import { routes } from './app.routes';
import { authInterceptor } from './core/http/auth.interceptor';
import { apiResponseInterceptor } from './core/http/api-response.interceptor';
import { refreshInterceptor } from './core/http/refresh.interceptor';
import { AuthStore } from './core/state/auth-store';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    // Order matters: refreshInterceptor must sit closest to the backend (last)
    // so it sees the raw HttpErrorResponse (status 401) before apiResponseInterceptor
    // normalizes errors into a plain {status, message} for the UI.
    provideHttpClient(withInterceptors([authInterceptor, apiResponseInterceptor, refreshInterceptor])),
    provideAppInitializer(() => {
      const authStore = inject(AuthStore);
      if (!authStore.isAuthenticated()) return of(null);
      return authStore.loadCurrentUser().pipe(
        catchError(() => {
          authStore.logout();
          return of(null);
        }),
      );
    }),
  ],
};
