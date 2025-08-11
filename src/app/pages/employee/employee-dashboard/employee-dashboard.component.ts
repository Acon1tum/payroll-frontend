import { Component } from '@angular/core';
import { SidebarComponent } from '../../../shared/sidebar/sidebar.component';
import { HeaderComponent } from '../../../shared/header/header.component';
import { CommonModule } from '@angular/common';

interface Breadcrumb {
  label: string;
  path?: string;
  active?: boolean;
}

@Component({
  selector: 'app-employee-dashboard',
  imports: [CommonModule, SidebarComponent, HeaderComponent],
  templateUrl: './employee-dashboard.component.html',
  styleUrl: './employee-dashboard.component.scss'
})
export class EmployeeDashboardComponent {
  metrics = {
    latestNetPay: 19500,
    payday: new Date(),
    leave: { vacation: 12.5, sick: 10.0 },
    loanBalance: 8000,
  };

  // Breadcrumbs for header
  breadcrumbs: Breadcrumb[] = [
    { label: 'Dashboard', active: true }
  ];

  notifications = [
    { id: 1, type: 'payslip', title: 'New Payslip', message: 'Your payslip for the last cutoff is available.', timestamp: new Date(), icon: 'receipt_long', color: 'text-green-600' },
    { id: 2, type: 'leave', title: 'Leave Approved', message: 'Your VL from Jul 1-3 has been approved.', timestamp: new Date(Date.now() - 3600*1000*5), icon: 'event_available', color: 'text-blue-600' },
    { id: 3, type: 'system', title: 'Profile Updated', message: 'Your profile information has been updated.', timestamp: new Date(Date.now() - 3600*1000*24), icon: 'person', color: 'text-gray-600' },
  ];

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(amount);
  }

  formatDate(date: Date): string {
    return new Intl.DateTimeFormat('en-PH', { year: 'numeric', month: 'short', day: 'numeric' }).format(date);
  }
}
