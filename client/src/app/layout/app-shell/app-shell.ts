import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter, map } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';
import { AuthStore } from '../../core/state/auth-store';
import { CurrentProjectStore } from '../../core/state/current-project.store';
import { NotificationBellService } from '../../core/state/notification-bell.service';
import { SidebarService } from '../../core/state/sidebar.service';
import { ProjectService } from '../../core/services/project.service';
import { AuthService } from '../../core/services/auth.service';
import { ProjectResponse } from '../../core/models/project.model';
import { AvatarComponent } from '../../shared/ui/avatar';
import { DropdownMenuComponent } from '../../shared/ui/dropdown-menu';
import { ToastContainerComponent } from '../../shared/ui/toast-container';
import { ConfirmDialogHostComponent } from '../../shared/ui/confirm-dialog-host';
import { IconComponent, IconName } from '../../shared/ui/icon';
import { colorFor } from '../../shared/util/color-hash';

interface NavItem {
  icon: IconName;
  label: string;
  link: (string | null)[];
  exact?: boolean;
}

@Component({
  selector: 'app-shell',
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    AvatarComponent,
    DropdownMenuComponent,
    ToastContainerComponent,
    ConfirmDialogHostComponent,
    IconComponent,
  ],
  templateUrl: './app-shell.html',
})
export class AppShellComponent implements OnInit, OnDestroy {
  private readonly router = inject(Router);
  private readonly projectService = inject(ProjectService);
  private readonly authService = inject(AuthService);

  readonly authStore = inject(AuthStore);
  readonly currentProjectStore = inject(CurrentProjectStore);
  readonly bell = inject(NotificationBellService);
  readonly sidebar = inject(SidebarService);

  readonly projects = signal<ProjectResponse[]>([]);
  protected readonly colorFor = colorFor;

  readonly orgName = computed(() => this.authStore.currentUser()?.orgName ?? 'jeera_alt');

  private readonly currentUrl = toSignal(
    this.router.events.pipe(
      filter((e) => e instanceof NavigationEnd),
      map(() => this.router.url),
    ),
    { initialValue: this.router.url },
  );

  readonly projectId = computed(() => {
    const match = this.currentUrl().match(/^\/projects\/([^/?]+)/);
    return match ? match[1] : null;
  });

  readonly projectNavItems = computed<NavItem[]>(() => {
    const pid = this.projectId();
    if (!pid) return [];
    return [
      { icon: 'board', label: 'Board', link: ['/projects', pid, 'board'] },
      { icon: 'calendar', label: 'Sprints', link: ['/projects', pid, 'settings', 'sprints'] },
      { icon: 'members', label: 'Members', link: ['/projects', pid, 'settings', 'members'] },
      { icon: 'roles', label: 'Roles', link: ['/projects', pid, 'settings', 'roles'] },
      { icon: 'workflow', label: 'Workflow', link: ['/projects', pid, 'settings', 'workflow'] },
      { icon: 'fields', label: 'Custom fields', link: ['/projects', pid, 'settings', 'custom-fields'] },
      { icon: 'settings', label: 'Settings', link: ['/projects', pid, 'settings', 'general'] },
    ];
  });

  readonly workspaceNavItems = computed<NavItem[]>(() => {
    const items: NavItem[] = [
      { icon: 'folder', label: 'All projects', link: ['/projects'], exact: true },
      { icon: 'bell', label: 'Notifications', link: ['/notifications'] },
    ];
    if (this.authStore.isOwner() || this.authStore.canManageMembers()) {
      items.push({ icon: 'building', label: 'User Management', link: ['/org'] });
    }
    return items;
  });

  ngOnInit(): void {
    this.bell.start();
    this.projectService.list().subscribe((projects) => this.projects.set(projects));
  }

  ngOnDestroy(): void {
    this.bell.stop();
  }

  logout(): void {
    this.authService.logout();
    this.router.navigateByUrl('/login');
  }
}
