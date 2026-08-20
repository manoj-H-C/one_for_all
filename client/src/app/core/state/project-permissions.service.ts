import { Injectable, inject, signal } from '@angular/core';
import { forkJoin, map, Observable, of, shareReplay, tap } from 'rxjs';
import { MemberService } from '../services/member.service';
import { RoleService } from '../services/role.service';
import { AuthStore } from './auth-store';

/**
 * Resolves "what can the current user do in this project" client-side, by
 * combining the member list (to find my roleId) with the role catalog (to
 * find that role's permissionCodes). Mirrors ProjectAccessServiceImpl's
 * owner-bypass rule: an org owner is already guaranteed (by /auth/me) to
 * only be owner within their own org, so `owner === true` grants every
 * permission in any project of that org without a role lookup.
 *
 * This only gates the UI (show/hide/disable) - the server enforces the real
 * check on every request regardless.
 */
@Injectable({ providedIn: 'root' })
export class ProjectPermissionsService {
  private readonly authStore = inject(AuthStore);
  private readonly memberService = inject(MemberService);
  private readonly roleService = inject(RoleService);

  private readonly cache = new Map<string, Observable<Set<string>>>();
  private readonly versions = signal<Record<string, number>>({});

  permissionsFor(projectId: string): Observable<Set<string>> {
    if (this.authStore.isOwner()) {
      return of(new Set(['*']));
    }
    let cached = this.cache.get(projectId);
    if (!cached) {
      cached = this.load(projectId).pipe(shareReplay(1));
      this.cache.set(projectId, cached);
    }
    return cached;
  }

  has(projectId: string, code: string): Observable<boolean> {
    return this.permissionsFor(projectId).pipe(map((set) => set.has('*') || set.has(code)));
  }

  invalidate(projectId: string): void {
    this.cache.delete(projectId);
  }

  private load(projectId: string): Observable<Set<string>> {
    const userId = this.authStore.currentUser()?.id;
    if (!userId) {
      return of(new Set<string>());
    }
    return forkJoin({
      members: this.memberService.list(projectId),
      roles: this.roleService.list(projectId),
    }).pipe(
      map(({ members, roles }) => {
        const me = members.find((m) => m.userId === userId);
        if (!me) return new Set<string>();
        const role = roles.find((r) => r.id === me.roleId);
        return new Set(role?.permissionCodes ?? []);
      }),
    );
  }
}
