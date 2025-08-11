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
  selector: 'app-reports-remittances',
  imports: [CommonModule, SidebarComponent, HeaderComponent],
  templateUrl: './reports-remittances.component.html',
  styleUrl: './reports-remittances.component.scss'
})
export class ReportsRemittancesComponent {
  // Dummy metrics
  totals = {
    payrollsProcessed: 12,
    totalNetPaid: 450000,
    totalDeductions: 120000,
    govtRemitted: 80000,
  };

  // Breadcrumbs for header
  breadcrumbs: Breadcrumb[] = [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Reports & Remittances', active: true }
  ];

  // Dummy remittance summaries
  sss = { month: '2025-06', employeeShare: 30000, employerShare: 60000, count: 50 };
  philhealth = { month: '2025-06', employeeShare: 20000, employerShare: 40000, count: 50 };
  pagibig = { month: '2025-06', employeeShare: 10000, employerShare: 10000, count: 50 };
  bir = { period: 'Q2 2025', withheldTax: 250000 };

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(amount);
  }

  // CSV helpers
  downloadCsv(filenameBase: string, rows: (string|number)[][]): void {
    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filenameBase}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  exportPayrollSummary(): void {
    this.downloadCsv('payroll-summary', [
      ['Runs','Total Net Paid','Total Deductions'],
      [this.totals.payrollsProcessed, this.totals.totalNetPaid, this.totals.totalDeductions]
    ]);
  }

  exportGovtReports(): void {
    this.downloadCsv('govt-reports', [
      ['Agency','Period','Employee Share','Employer Share','Employees'],
      ['SSS', this.sss.month, this.sss.employeeShare, this.sss.employerShare, this.sss.count],
      ['PhilHealth', this.philhealth.month, this.philhealth.employeeShare, this.philhealth.employerShare, this.philhealth.count],
      ['Pag-IBIG', this.pagibig.month, this.pagibig.employeeShare, this.pagibig.employerShare, this.pagibig.count],
      ['BIR', this.bir.period, this.bir.withheldTax, 0, '']
    ]);
  }
}
