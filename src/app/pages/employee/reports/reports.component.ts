import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SidebarComponent } from '../../../shared/sidebar/sidebar.component';
import { HeaderComponent } from '../../../shared/header/header.component';

@Component({
  selector: 'app-reports',
  imports: [CommonModule, SidebarComponent, HeaderComponent],
  templateUrl: './reports.component.html',
  styleUrl: './reports.component.scss'
})
export class ReportsComponent {
  // Quick export actions for employee pages
  exportPayslips(): void { this.downloadCsv('payslips', [ ['Period','Gross','Deductions','Net'], ['2025-06-15','35000','5000','30000'] ]); }
  exportContributions(): void { this.downloadCsv('contributions', [ ['Month','SSS','PhilHealth','Pag-IBIG','BIR'], ['2025-06','600','450','200','3000'] ]); }
  exportLoans(): void { this.downloadCsv('loans', [ ['Type','Amount','Balance','Status'], ['Personal','20000','8000','Active'] ]); }
  exportLeaves(): void { this.downloadCsv('leaves', [ ['Type','Start','End','Days','Status'], ['Vacation','2025-07-14','2025-07-16','3','Pending'] ]); }
  exportThirteenth(): void { this.downloadCsv('13th-month', [ ['Year','Total Basic Used','Computed 13th'], ['2025','360000','30000'] ]); }
  exportFinalPay(): void { this.downloadCsv('final-pay', [ ['Item','Amount'], ['Net Final Pay','14700'] ]); }
  exportSettingsAudit(): void { this.downloadCsv('security-privacy', [ ['Event','Version','Date'], ['Accepted Terms','v1.3','2025-06-30'] ]); }

  private downloadCsv(filenameBase: string, rows: (string|number)[][]): void {
    const csv = rows.map(r => r.map(val => `"${String(val).replace(/"/g,'""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filenameBase}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }
}
