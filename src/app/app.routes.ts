import { Routes } from '@angular/router';
import { LandingComponent } from './landing/landing.component';
import { LoginComponent } from './auth/login/login.component';
import { DashboardComponent } from './pages/admin/dashboard/dashboard.component';
import { EmployeeDashboardComponent } from './pages/employee/employee-dashboard/employee-dashboard.component';
import { DepartmentManagementComponent } from './pages/admin/system-administration/department-management/department-management.component';
import { UserManagementComponent } from './pages/admin/system-administration/user-management/user-management.component';
import { OrgManagementComponent } from './pages/admin/system-administration/org-management/org-management.component';
import { EmployeeManagementComponent } from './pages/admin/employee-management/employee-management.component';
import { FinalPayProcessComponent } from './pages/admin/payroll-management/final-pay-process/final-pay-process.component';
import { PayslipCenterComponent } from './pages/admin/payroll-management/payslip-center/payslip-center.component';
import { RunPayrollComponent } from './pages/admin/payroll-management/run-payroll/run-payroll.component';
import { ThirteenMonthPayComponent } from './pages/admin/payroll-management/thirteen-month-pay/thirteen-month-pay.component';
import { PayrollManagementComponent } from './pages/admin/payroll-management/payroll-management.component';
import { ContirbutionsDeductionsComponent } from './pages/admin/contirbutions-deductions/contirbutions-deductions.component';
import { MandatoryContributionsComponent } from './pages/admin/contirbutions-deductions/mandatory-contributions/mandatory-contributions.component';
import { DeductionsComponent } from './pages/admin/contirbutions-deductions/deductions/deductions.component';
import { LoansComponent } from './pages/admin/contirbutions-deductions/loans/loans.component';
import { LeaveRequestsComponent } from './pages/admin/leave-management/leave-requests/leave-requests.component';
import { LeaveSettingsComponent } from './pages/admin/leave-management/leave-settings/leave-settings.component';
import { LeaveReportsComponent } from './pages/admin/leave-management/leave-reports/leave-reports.component';
import { ReportsRemittancesComponent } from './pages/admin/reports-remittances/reports-remittances.component';
import { PayrollSummaryComponent } from './pages/admin/reports-remittances/payroll-summary/payroll-summary.component';
import { LlcSummaryComponent } from './pages/admin/reports-remittances/llc-summary/llc-summary.component';
import { GovtReportsComponent } from './pages/admin/reports-remittances/govt-reports/govt-reports.component';
import { BankFileGenerationComponent } from './pages/admin/bank-file-generation/bank-file-generation.component';
import { AuditTrailComponent } from './pages/admin/audit-trail/audit-trail.component';
import { ActivityLogsComponent } from './pages/admin/audit-trail/activity-logs/activity-logs.component';
import { RequestLoanComponent } from './pages/employee/request-loan/request-loan.component';
import { ProfileComponent } from './pages/employee/profile/profile.component';
import { PayslipComponent } from './pages/employee/payslip/payslip.component';
import { EmployeeContributionsComponent } from './pages/employee/employee-contributions/employee-contributions.component';
import { EmployeeLeaveManagementComponent } from './pages/employee/employee-leave-management/employee-leave-management.component';
import { ThirteenthFinalPayComponent } from './pages/employee/thirteenth-final-pay/thirteenth-final-pay.component';
import { EmployeeSettingsComponent } from './pages/employee/employee-settings/employee-settings.component';
import { ReportsComponent } from './pages/employee/reports/reports.component';
import { UnauthorizedComponent } from './shared/unauthorized/unauthorized.component';
import { LeaveBalanceComponent } from './pages/admin/leave-management/leave-balance/leave-balance.component';
import { EvaluationManagementComponent } from './pages/admin/evaluation-management/evaluation-management.component';
import { EvaluationComponent } from './pages/employee/evaluation/evaluation.component';
import { AttendanceManagementComponent } from './pages/admin/attendance-management/attendance-management.component';
import { AttendanceComponent } from './pages/employee/attendance/attendance.component';
import { AuthGuard } from './guards/auth.guard';
import { RoleGuard } from './guards/role.guard';
import { LoggedInGuard } from './guards/logged-in.guard';
import { UnauthorizedAccessGuard } from './guards/unauthorized-access.guard';

export const routes: Routes = [
  // Public routes (no authentication required, but logged-in users cannot access)
  { path: '', component: LoginComponent, canActivate: [LoggedInGuard] },
  { path: 'login', component: LoginComponent, canActivate: [LoggedInGuard] },
  
  // Landing page (requires authentication)
  { 
    path: 'landing', 
    component: LandingComponent,
    canActivate: [AuthGuard]
  },
  
  // Admin routes (admin, hrStaff, payrollManager roles)
  { 
    path: 'dashboard', 
    component: DashboardComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['admin', 'hrStaff', 'payrollManager'] }
  },
  { 
    path: 'department-management', 
    component: DepartmentManagementComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['admin', 'hrStaff'] }
  },
  { 
    path: 'user-management', 
    component: UserManagementComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['admin'] }
  },
  { 
    path: 'org-management', 
    component: OrgManagementComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['admin'] }
  },
  { 
    path: 'employee-management', 
    component: EmployeeManagementComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['admin', 'hrStaff'] }
  },
  
  // Payroll Management routes (admin, payrollManager roles)
  { 
    path: 'final-pay-process', 
    component: FinalPayProcessComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['admin', 'payrollManager'] }
  },
  { 
    path: 'payslip-center', 
    component: PayslipCenterComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['admin', 'payrollManager'] }
  },
  { 
    path: 'run-payroll', 
    component: RunPayrollComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['admin', 'payrollManager'] }
  },
  { 
    path: 'thirteen-month-pay', 
    component: ThirteenMonthPayComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['admin', 'payrollManager'] }
  },
  { 
    path: 'payroll-management', 
    component: PayrollManagementComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['admin', 'payrollManager'] }
  },
  
  // Contributions & Deductions routes (admin, hrStaff, payrollManager roles)
  { 
    path: 'contributions-deductions', 
    component: ContirbutionsDeductionsComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['admin', 'hrStaff', 'payrollManager'] }
  },
  { 
    path: 'mandatory-contributions', 
    component: MandatoryContributionsComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['admin', 'hrStaff', 'payrollManager'] }
  },
  { 
    path: 'deductions', 
    component: DeductionsComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['admin', 'hrStaff', 'payrollManager'] }
  },
  { 
    path: 'loans', 
    component: LoansComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['admin', 'hrStaff', 'payrollManager'] }
  },
  
  // Leave Management routes (admin, hrStaff roles)
  { 
    path: 'leave-requests', 
    component: LeaveRequestsComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['admin', 'hrStaff'] }
  },
  { 
    path: 'leave-settings', 
    component: LeaveSettingsComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['admin', 'hrStaff'] }
  },
  { 
    path: 'leave-reports', 
    component: LeaveReportsComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['admin', 'hrStaff'] }
  },
  {
    path: 'leave-balance',
    component: LeaveBalanceComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['admin', 'hrStaff'] }
  },
  
  // Reports & Remittances routes (admin, payrollManager roles)
  { 
    path: 'reports-remittances', 
    component: ReportsRemittancesComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['admin', 'payrollManager'] }
  },
  { 
    path: 'payroll-summary', 
    component: PayrollSummaryComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['admin', 'payrollManager'] }
  },
  { 
    path: 'llc-summary', 
    component: LlcSummaryComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['admin', 'payrollManager'] }
  },
  { 
    path: 'govt-reports', 
    component: GovtReportsComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['admin', 'payrollManager'] }
  },
  
  // Bank File Generation (admin, payrollManager roles)
  { 
    path: 'bank-file-generation', 
    component: BankFileGenerationComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['admin', 'payrollManager'] }
  },
  {
    path: 'attendance-management',
    component: AttendanceManagementComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['admin', 'hrStaff'] }
  },
  
  // Audit Trail (admin role only)
  { 
    path: 'audit-trail', 
    component: AuditTrailComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['admin'] }
  },
  { 
    path: 'activity-logs', 
    component: ActivityLogsComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['admin'] }
  },
  {
    path: 'evaluation-management',
    component: EvaluationManagementComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['admin'] }
  },
  
  // Employee routes (employee role)
  { 
    path: 'employee-dashboard', 
    component: EmployeeDashboardComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['employee'] }
  },
  { 
    path: 'request-loan', 
    component: RequestLoanComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['employee'] }
  },
  { 
    path: 'employee/profile', 
    component: ProfileComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['employee'] }
  },
  { 
    path: 'employee/payslip', 
    component: PayslipComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['employee'] }
  },
  { 
    path: 'employee/contributions', 
    component: EmployeeContributionsComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['employee'] }
  },
  { 
    path: 'employee/leave-management', 
    component: EmployeeLeaveManagementComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['employee'] }
  },
  { 
    path: 'employee/13th-final-pay', 
    component: ThirteenthFinalPayComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['employee'] }
  },
  { 
    path: 'employee/settings', 
    component: EmployeeSettingsComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['employee'] }
  },
  { 
    path: 'employee/reports', 
    component: ReportsComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['employee'] }
  },
  {
    path: 'employee/evaluation',
    component: EvaluationComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['employee'] }
  },
  {
    path: 'employee/attendance',
    component: AttendanceComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['employee'] }
  },
  
  // Unauthorized page
  { 
    path: 'unauthorized', 
    component: UnauthorizedComponent,
    canActivate: [AuthGuard, UnauthorizedAccessGuard]
  },
  
  
  // Catch all route - redirect to login
  { path: '**', redirectTo: '' }
];
