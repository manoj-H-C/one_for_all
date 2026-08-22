import { Component, OnDestroy, OnInit, computed, effect, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter, map } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';
import { AuthStore } from '../../core/state/auth-store';
import { CurrentProjectStore } from '../../core/state/current-project.store';
import { NotificationBellService } from '../../core/state/notification-bell.service';
import { SidebarService } from '../../core/state/sidebar.service';
import { ProjectService } from '../../core/services/project.service';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { ProjectResponse } from '../../core/models/project.model';
import { NotificationResponse } from '../../core/models/notification.model';
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
    DatePipe,
    FormsModule,
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
  private readonly notificationService = inject(NotificationService);

  readonly authStore = inject(AuthStore);
  readonly currentProjectStore = inject(CurrentProjectStore);
  readonly bell = inject(NotificationBellService);
  readonly sidebar = inject(SidebarService);

  readonly projects = signal<ProjectResponse[]>([]);
  readonly projectSwitcherQuery = signal('');
  readonly filteredProjects = computed(() => {
    const query = this.projectSwitcherQuery().trim().toLowerCase();
    if (!query) return this.projects();
    return this.projects().filter(
      (p) => p.name.toLowerCase().includes(query) || p.key.toLowerCase().includes(query),
    );
  });
  // the bell dropdown's preview list - refetched whenever the poller notices
  // the unread count change (see the effect below), so it doesn't need its
  // own separate poll loop or an "on open" hook into DropdownMenuComponent.
  readonly recentNotifications = signal<NotificationResponse[]>([]);
  protected readonly colorFor = colorFor;

  constructor() {
    effect(() => {
      this.bell.unreadCount();
      this.notificationService.list(false, 0, 6).subscribe((page) => this.recentNotifications.set(page.content));
    });
  }

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
    const items: NavItem[] = [
      { icon: 'board', label: 'Board', link: ['/projects', pid, 'board'] },
      { icon: 'calendar', label: this.currentProjectStore.sprintLabelPlural(), link: ['/projects', pid, 'settings', 'sprints'] },
      { icon: 'members', label: 'Members', link: ['/projects', pid, 'settings', 'members'] },
      { icon: 'roles', label: 'Roles', link: ['/projects', pid, 'settings', 'roles'] },
      { icon: 'workflow', label: 'Workflow', link: ['/projects', pid, 'settings', 'workflow'] },
      { icon: 'list', label: 'Types', link: ['/projects', pid, 'settings', 'types'] },
      { icon: 'fields', label: 'Custom fields', link: ['/projects', pid, 'settings', 'custom-fields'] },
    ];
    if (this.currentProjectStore.inventoryEnabled()) {
      items.push({ icon: 'building', label: this.currentProjectStore.inventoryLabelPlural(), link: ['/projects', pid, 'inventory'] });
    }
    items.push({ icon: 'settings', label: 'Settings', link: ['/projects', pid, 'settings', 'general'] });
    return items;
  });

  readonly workspaceNavItems = computed<NavItem[]>(() => {
    const items: NavItem[] = [
      { icon: 'folder', label: 'All projects', link: ['/projects'], exact: true },
      { icon: 'bell', label: 'Notifications', link: ['/notifications'] },
      { icon: 'calendar', label: 'Reminders', link: ['/reminders'] },
    ];
    if (this.authStore.isOwner() || this.authStore.canManageMembers()) {
      items.push({ icon: 'building', label: 'User Management', link: ['/org'], exact: true });
    }
    // owner or canCreateProjects - deliberately not tied to canManageMembers
    // like User Management above, since bulk-purchasing sits closer to
    // "can spin up new project work" than "administers people".
    if (this.authStore.canCreateProjects() && this.authStore.purchaseOrdersEnabled()) {
      items.push({ icon: 'workflow', label: 'Purchase Orders', link: ['/purchase-orders'] });
    }
    if (this.authStore.isOwner()) {
      items.push({ icon: 'settings', label: 'Organization Settings', link: ['/org/settings'] });
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

  markAllReadFromBell(): void {
    this.notificationService.markAllRead().subscribe(() => {
      this.recentNotifications.update((list) => list.map((n) => ({ ...n, read: true })));
      this.bell.refreshNow();
    });
  }

  logout(): void {
    this.authService.logout();
    this.router.navigateByUrl('/login');
  }
}
