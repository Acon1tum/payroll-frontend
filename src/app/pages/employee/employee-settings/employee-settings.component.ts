import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SidebarComponent } from '../../../shared/sidebar/sidebar.component';
import { HeaderComponent } from '../../../shared/header/header.component';

interface Breadcrumb {
  label: string;
  path?: string;
  active?: boolean;
}


@Component({
  selector: 'app-employee-settings',
  imports: [CommonModule, SidebarComponent, HeaderComponent],
  templateUrl: './employee-settings.component.html',
  styleUrl: './employee-settings.component.scss'
})
export class EmployeeSettingsComponent {
  // Breadcrumbs for header
  breadcrumbs: Breadcrumb[] = [
    { label: 'Dashboard', path: '/employee-dashboard' },
    { label: 'Security & Privacy', active: true }
  ];

  // Terms
  showTermsModal = false;
  termsVersion = 'v1.3';
  termsUpdatedAt = new Date();
  termsContent = `
  Company Payroll and Data Policy\n\n
  This policy explains how payroll data is processed, stored, and protected.\n
  1. Data Collection: We only collect information necessary for payroll processing.\n
  2. Use of Data: Your data is used solely for payroll, taxation, and statutory remittances.\n
  3. Access Controls: Only authorized HR/Payroll personnel can view your data.\n
  4. Retention: Records are retained per legal requirements and securely deleted thereafter.\n
  5. Your Rights: You may request access, correction, or deletion subject to legal obligations.`;

  // Consent history
  consentHistory: Array<{ id: number; title: string; version: string; date: Date; status: 'Accepted' | 'Withdrawn'; method: 'Web' | 'Email' | 'HR Desk' }> = [
    { id: 1, title: 'Payroll Data Processing Consent', version: 'v1.3', date: new Date(), status: 'Accepted', method: 'Web' },
    { id: 2, title: 'Electronic Payslip Delivery', version: 'v1.1', date: new Date(Date.now() - 1000*60*60*24*120), status: 'Accepted', method: 'Web' },
  ];

  // Device activity (optional)
  deviceActivity: Array<{ id: number; device: string; ip: string; location: string; lastActive: Date; status: 'Current' | 'Previous' }>= [
    { id: 1, device: 'Windows PC · Chrome', ip: '192.168.1.24', location: 'Makati, PH', lastActive: new Date(), status: 'Current' },
    { id: 2, device: 'iPhone · Safari', ip: '203.160.55.10', location: 'Taguig, PH', lastActive: new Date(Date.now() - 1000*60*60*18), status: 'Previous' },
  ];

  openTerms(): void { this.showTermsModal = true; }
  closeTerms(): void { this.showTermsModal = false; }

  formatDate(date: Date): string {
    return new Intl.DateTimeFormat('en-PH', { year: 'numeric', month: 'short', day: 'numeric' }).format(date);
  }
}
