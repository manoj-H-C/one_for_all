import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, finalize, shareReplay, tap } from 'rxjs';
import { API_BASE_URL } from '../config/api.config';
import { AuthResponse, UserResponse } from '../models/auth.model';

const ACCESS_TOKEN_KEY = 'jeera.accessToken';
const REFRESH_TOKEN_KEY = 'jeera.refreshToken';

@Injectable({ providedIn: 'root' })
export class AuthStore {
  private readonly http = inject(HttpClient);

  private readonly accessTokenSig = signal<string | null>(localStorage.getItem(ACCESS_TOKEN_KEY));
  private readonly refreshTokenSig = signal<string | null>(localStorage.getItem(REFRESH_TOKEN_KEY));
  private readonly currentUserSig = signal<UserResponse | null>(null);

  private refreshInFlight$: Observable<AuthResponse> | null = null;

  readonly accessToken = this.accessTokenSig.asReadonly();
  readonly currentUser = this.currentUserSig.asReadonly();
  readonly isAuthenticated = computed(() => this.accessTokenSig() !== null);
  readonly isOwner = computed(() => this.currentUserSig()?.owner ?? false);
  readonly canManageMembers = computed(
    () => this.currentUserSig()?.owner === true || this.currentUserSig()?.canManageMembers === true,
  );
  readonly canCreateProjects = computed(
    () => this.currentUserSig()?.owner === true || this.currentUserSig()?.canCreateProjects === true,
  );

  setSession(auth: AuthResponse): void {
    this.accessTokenSig.set(auth.accessToken);
    this.refreshTokenSig.set(auth.refreshToken);
    localStorage.setItem(ACCESS_TOKEN_KEY, auth.accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, auth.refreshToken);
  }

  setCurrentUser(user: UserResponse): void {
    this.currentUserSig.set(user);
  }

  logout(): void {
    this.accessTokenSig.set(null);
    this.refreshTokenSig.set(null);
    this.currentUserSig.set(null);
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  }

  loadCurrentUser(): Observable<UserResponse> {
    return this.http
      .get<UserResponse>(`${API_BASE_URL}/api/auth/me`)
      .pipe(tap((user) => this.currentUserSig.set(user)));
  }

  /** Shared by every concurrent 401 so only one refresh call ever goes out. */
  refreshAccessToken(): Observable<AuthResponse> {
    if (this.refreshInFlight$) {
      return this.refreshInFlight$;
    }
    const refreshToken = this.refreshTokenSig();
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }
    this.refreshInFlight$ = this.http
      .post<AuthResponse>(`${API_BASE_URL}/api/auth/refresh`, { refreshToken })
      .pipe(
        tap((auth) => this.setSession(auth)),
        shareReplay(1),
        finalize(() => {
          this.refreshInFlight$ = null;
        }),
      );
    return this.refreshInFlight$;
  }
}
