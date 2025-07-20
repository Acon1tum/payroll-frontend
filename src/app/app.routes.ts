import { Routes } from '@angular/router';
import { LandingComponent } from './landing/landing.component';
import { LoginComponent } from './auth/login/login.component';
import { DashboardComponent } from './pages/admin/dashboard/dashboard.component';
import { EmployeeDashboardComponent } from './pages/employee/employee-dashboard/employee-dashboard.component';
import { DepartmentManagementComponent } from './pages/admin/system-administration/department-management/department-management.component';
import { UserManagementComponent } from './pages/admin/system-administration/user-management/user-management.component';
import { OrgManagementComponent } from './pages/admin/system-administration/org-management/org-management.component';

export const routes: Routes = [
  { path: '', component: LandingComponent },
  { path: 'landing', component: LandingComponent },
  { path: 'login', component: LoginComponent },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'employee-dashboard', component: EmployeeDashboardComponent },
  { path: 'department-management', component: DepartmentManagementComponent },
  { path: 'user-management', component: UserManagementComponent },
  { path: 'org-management', component: OrgManagementComponent },
  { path: '**', redirectTo: '' },
];
