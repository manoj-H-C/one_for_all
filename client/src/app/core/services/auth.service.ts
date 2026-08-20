import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map, switchMap, tap } from 'rxjs';
import { API_BASE_URL } from '../config/api.config';
import {
  AuthResponse,
  ChangePasswordRequest,
  ForgotPasswordRequest,
  LoginRequest,
  RegisterRequest,
  ResetPasswordRequest,
  UserResponse,
  VerifyEmailRequest,
} from '../models/auth.model';
import { AuthStore } from '../state/auth-store';

const BASE = `${API_BASE_URL}/api/auth`;

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly authStore = inject(AuthStore);

  // Every screen gates on AuthStore.currentUser() (owner/canCreateProjects/...),
  // so login/register must hydrate it via /auth/me before the caller navigates -
  // otherwise owner-only UI (New project, New work item, Org admin) stays
  // hidden until an unrelated full page reload happens to trigger it.
  register(request: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${BASE}/register`, request).pipe(
      tap((auth) => this.authStore.setSession(auth)),
      switchMap((auth) => this.authStore.loadCurrentUser().pipe(map(() => auth))),
    );
  }

  login(request: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${BASE}/login`, request).pipe(
      tap((auth) => this.authStore.setSession(auth)),
      switchMap((auth) => this.authStore.loadCurrentUser().pipe(map(() => auth))),
    );
  }

  me(): Observable<UserResponse> {
    return this.authStore.loadCurrentUser();
  }

  forgotPassword(request: ForgotPasswordRequest): Observable<void> {
    return this.http.post<void>(`${BASE}/forgot-password`, request);
  }

  resetPassword(request: ResetPasswordRequest): Observable<void> {
    return this.http.post<void>(`${BASE}/reset-password`, request);
  }

  verifyEmail(request: VerifyEmailRequest): Observable<void> {
    return this.http.post<void>(`${BASE}/verify-email`, request);
  }

  resendVerification(): Observable<void> {
    return this.http.post<void>(`${BASE}/resend-verification`, {});
  }

  changePassword(request: ChangePasswordRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${BASE}/change-password`, request).pipe(
      tap((auth) => this.authStore.setSession(auth)),
      switchMap((auth) => this.authStore.loadCurrentUser().pipe(map(() => auth))),
    );
  }

  logout(): void {
    this.authStore.logout();
  }
}
