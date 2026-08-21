import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { guestGuard } from './core/guards/guest.guard';
import { orgAdminGuard } from './core/guards/org-admin.guard';
import { ownerGuard } from './core/guards/owner.guard';
import { purchaseOrdersAccessGuard } from './core/guards/purchase-orders-access.guard';
import { purchaseOrdersEnabledGuard } from './core/guards/purchase-orders-enabled.guard';
import { projectResolver } from './core/resolvers/project.resolver';
import { AuthLayoutComponent } from './layout/auth-layout/auth-layout';
import { AppShellComponent } from './layout/app-shell/app-shell';
import { LandingPageComponent } from './features/landing/landing-page';
import { LoginComponent } from './features/auth/login';
import { RegisterComponent } from './features/auth/register';
import { ForgotPasswordComponent } from './features/auth/forgot-password';
import { ResetPasswordComponent } from './features/auth/reset-password';
import { VerifyEmailComponent } from './features/auth/verify-email';
import { AcceptOrgInviteComponent } from './features/auth/accept-org-invite';
import { ChangePasswordComponent } from './features/auth/change-password';
import { AcceptInviteComponent } from './features/invitations/accept-invite';
import { ProjectListComponent } from './features/projects/project-list';
import { BoardPageComponent } from './features/board/board-page';
import { WorkItemDetailComponent } from './features/work-items/work-item-detail';
import { WorkItemRedirectComponent } from './features/work-items/work-item-redirect';
import { GeneralSettingsComponent } from './features/settings/general-settings';
import { MembersSettingsComponent } from './features/settings/members-settings';
import { RolesSettingsComponent } from './features/settings/roles-settings';
import { WorkflowSettingsComponent } from './features/settings/workflow-settings';
import { SprintsSettingsComponent } from './features/settings/sprints-settings';
import { WorkItemTypesSettingsComponent } from './features/settings/work-item-types-settings';
import { CustomFieldsSettingsComponent } from './features/settings/custom-fields-settings';
import { InventoryPageComponent } from './features/inventory/inventory-page';
import { OrgAdminPageComponent } from './features/org-admin/org-admin-page';
import { OrgSettingsPageComponent } from './features/org-settings/org-settings-page';
import { PurchaseOrdersPageComponent } from './features/purchase-orders/purchase-orders-page';
import { NotificationsPageComponent } from './features/notifications/notifications-page';

export const routes: Routes = [
  // public marketing page - wins the bare "/" for logged-out visitors;
  // guestGuard bounces anyone already signed in straight to /projects, same
  // as it does for /login and /register below. Placed first so it's tried
  // before AppShellComponent's own '' child (which would otherwise 404 into
  // authGuard's redirect-to-login before a visitor ever saw this).
  { path: '', component: LandingPageComponent, pathMatch: 'full', canActivate: [guestGuard] },
  {
    path: '',
    component: AuthLayoutComponent,
    children: [
      { path: 'login', component: LoginComponent, canActivate: [guestGuard] },
      { path: 'register', component: RegisterComponent, canActivate: [guestGuard] },
      { path: 'forgot-password', component: ForgotPasswordComponent, canActivate: [guestGuard] },
      { path: 'reset-password/:token', component: ResetPasswordComponent, canActivate: [guestGuard] },
      { path: 'verify-email/:token', component: VerifyEmailComponent },
      { path: 'accept-org-invite/:token', component: AcceptOrgInviteComponent },
    ],
  },
  { path: 'accept-invite/:token', component: AcceptInviteComponent, canActivate: [authGuard] },
  { path: 'change-password', component: ChangePasswordComponent, canActivate: [authGuard] },
  {
    path: '',
    component: AppShellComponent,
    canActivate: [authGuard],
    children: [
      { path: 'projects', component: ProjectListComponent },
      {
        path: 'projects/:projectId',
        resolve: { project: projectResolver },
        children: [
          { path: '', redirectTo: 'board', pathMatch: 'full' },
          { path: 'board', component: BoardPageComponent },
          { path: 'work-items/:id', component: WorkItemDetailComponent },
          { path: 'inventory', component: InventoryPageComponent },
          { path: 'settings', redirectTo: 'settings/general', pathMatch: 'full' },
          { path: 'settings/general', component: GeneralSettingsComponent },
          { path: 'settings/members', component: MembersSettingsComponent },
          { path: 'settings/roles', component: RolesSettingsComponent },
          { path: 'settings/workflow', component: WorkflowSettingsComponent },
          { path: 'settings/sprints', component: SprintsSettingsComponent },
          { path: 'settings/types', component: WorkItemTypesSettingsComponent },
          { path: 'settings/custom-fields', component: CustomFieldsSettingsComponent },
        ],
      },
      { path: 'work-items/:id', component: WorkItemRedirectComponent },
      { path: 'org', component: OrgAdminPageComponent, canActivate: [orgAdminGuard] },
      { path: 'org/settings', component: OrgSettingsPageComponent, canActivate: [ownerGuard] },
      { path: 'purchase-orders', component: PurchaseOrdersPageComponent, canActivate: [purchaseOrdersAccessGuard, purchaseOrdersEnabledGuard] },
      { path: 'notifications', component: NotificationsPageComponent },
      { path: '', redirectTo: 'projects', pathMatch: 'full' },
    ],
  },
  { path: '**', redirectTo: 'projects' },
];
