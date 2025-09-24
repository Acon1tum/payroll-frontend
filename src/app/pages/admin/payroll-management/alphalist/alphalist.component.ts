import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HeaderComponent } from '../../../../shared/header/header.component';
import { SidebarComponent } from '../../../../shared/sidebar/sidebar.component';
import { PayrollService, PayrollRun, Payslip } from '../../../../services/payroll.service';

@Component({
  selector: 'app-alphalist',
  standalone: true,
  imports: [CommonModule, FormsModule, HeaderComponent, SidebarComponent],
  templateUrl: './alphalist.component.html',
  styleUrl: './alphalist.component.scss'
})
export class AlphalistComponent {
  breadcrumbs = [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Payroll Management', path: '/payroll-management' },
    { label: 'BIR Alphalist', active: true }
  ];

  year = new Date().getFullYear();
  alphalistType: 'employee' | 'withholding' = 'employee';
  generating = false;

  // Runs & preview data
  loadingRuns = false;
  payrollRuns: PayrollRun[] = [];
  selectedRunId: string | null = null;

  loadingPreview = false;
  previewPayslips: Payslip[] = [];

  constructor(private payrollService: PayrollService) {}

  ngOnInit(): void {
    this.loadRuns();
  }

  formatDate(date: string | Date): string {
    return this.payrollService.formatDate(date);
  }

  private normalizeAmount(value: any): number {
    if (typeof value === 'number') return isNaN(value) ? 0 : value;
    if (typeof value === 'string') {
      const cleaned = value.replace(/[^0-9.-]/g, '');
      const parsed = parseFloat(cleaned);
      return isNaN(parsed) ? 0 : parsed;
    }
    return 0;
  }

  formatAmount(value: any): string {
    return this.payrollService.formatCurrency(this.normalizeAmount(value));
  }

  get totals() {
    const totalGross = this.previewPayslips.reduce((acc, p) => acc + this.normalizeAmount(p.grossPay as any), 0);
    const totalDed = this.previewPayslips.reduce((acc, p) => acc + this.normalizeAmount(p.totalDeductions as any), 0);
    const totalNet = this.previewPayslips.reduce((acc, p) => acc + this.normalizeAmount(p.netPay as any), 0);
    return { totalGross, totalDed, totalNet };
  }

  loadRuns(): void {
    this.loadingRuns = true;
    const startDate = new Date(this.year, 0, 1).toISOString();
    const endDate = new Date(this.year, 11, 31, 23, 59, 59).toISOString();
    this.payrollService.getPayrollRuns({ limit: 100, startDate, endDate })
      .subscribe({
        next: (res) => {
          this.payrollRuns = res.data || [];
          this.loadingRuns = false;
        },
        error: () => {
          this.loadingRuns = false;
        }
      });
  }

  onRunChange(): void {
    if (!this.selectedRunId) {
      this.previewPayslips = [];
      return;
    }
    this.loadingPreview = true;
    this.payrollService.getPayslipsForPayrollRun(this.selectedRunId)
      .subscribe({
        next: (res) => {
          this.previewPayslips = res.data || [];
          this.loadingPreview = false;
        },
        error: () => {
          this.previewPayslips = [];
          this.loadingPreview = false;
        }
      });
  }

  generate(): void {
    // Placeholder generation: export CSV from previewPayslips
    if (!this.previewPayslips.length) return;
    this.generating = true;
    const rows = [
      ['Employee Number', 'Employee Name', 'Gross Pay', 'Total Deductions', 'Net Pay']
    ];
    for (const p of this.previewPayslips) {
      const name = p.employee ? `${p.employee.lastName}, ${p.employee.firstName}` : '';
      rows.push([
        p.employee?.employeeNumber || '',
        name,
        this.normalizeAmount(p.grossPay as any).toString(),
        this.normalizeAmount(p.totalDeductions as any).toString(),
        this.normalizeAmount(p.netPay as any).toString()
      ]);
    }
    const csv = rows.map(r => r.map(v => `"${(v ?? '').toString().replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `alphalist_${this.year}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    this.generating = false;
  }
}
