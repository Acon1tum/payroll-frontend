import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SidebarComponent } from '../../../shared/sidebar/sidebar.component';
import { HeaderComponent } from '../../../shared/header/header.component';
import { EmployeeService, Payslip, PayslipItem } from '../../../services/employee.service';
import { catchError, finalize } from 'rxjs/operators';
import { of } from 'rxjs';

interface Breadcrumb {
  label: string;
  path?: string;
  active?: boolean;
}

@Component({
  selector: 'app-payslip',
  imports: [CommonModule, SidebarComponent, HeaderComponent],
  templateUrl: './payslip.component.html',
  styleUrl: './payslip.component.scss'
})
export class PayslipComponent implements OnInit {
  // Breadcrumbs for header
  breadcrumbs: Breadcrumb[] = [
    { label: 'Dashboard', path: '/employee-dashboard' },
    { label: 'Payslips', active: true }
  ];

  payslips: Payslip[] = [];
  loading = false;
  error = '';
  
  // Pagination
  currentPage = 1;
  totalPages = 1;
  totalItems = 0;
  itemsPerPage = 10;

  // Filters
  selectedYear?: number;
  selectedMonth?: number;

  showDetailsModal = false;
  selected: Payslip | null = null;

  // Math property for template
  Math = Math;

  constructor(private employeeService: EmployeeService) {}

  ngOnInit(): void {
    this.loadPayslips();
  }

  loadPayslips(): void {
    this.loading = true;
    this.error = '';

    const params: any = {
      page: this.currentPage,
      limit: this.itemsPerPage
    };

    if (this.selectedYear) {
      params.year = this.selectedYear;
    }

    if (this.selectedMonth) {
      params.month = this.selectedMonth;
    }

    this.employeeService.getPayslips(params)
      .pipe(
        catchError(error => {
          console.error('Error loading payslips:', error);
          this.error = 'Failed to load payslips. Please try again.';
          return of({ success: false, data: [], pagination: { page: 1, limit: 10, total: 0, pages: 1 } });
        }),
        finalize(() => this.loading = false)
      )
      .subscribe(response => {
        if (response.success) {
          this.payslips = response.data;
          if (response.pagination) {
            this.currentPage = response.pagination.page;
            this.totalPages = response.pagination.pages;
            this.totalItems = response.pagination.total;
          }
        }
      });
  }

  onYearChange(year: number): void {
    this.selectedYear = isNaN(year) ? undefined : year;
    this.currentPage = 1;
    this.loadPayslips();
  }

  onMonthChange(month: number): void {
    this.selectedMonth = isNaN(month) ? undefined : month;
    this.currentPage = 1;
    this.loadPayslips();
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadPayslips();
  }

  clearFilters(): void {
    this.selectedYear = undefined;
    this.selectedMonth = undefined;
    this.currentPage = 1;
    this.loadPayslips();
  }

  getEarnings(payslip: Payslip): PayslipItem[] {
    return payslip.items.filter(item => item.type === 'earning');
  }

  getDeductions(payslip: Payslip): PayslipItem[] {
    return payslip.items.filter(item => item.type === 'deduction');
  }

  formatCurrency(amount?: number | null): string {
    return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format((amount ?? 0));
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  openDetails(payslip: Payslip): void {
    this.selected = payslip;
    this.showDetailsModal = true;
  }

  closeDetails(): void {
    this.showDetailsModal = false;
    this.selected = null;
  }

  downloadPayslip(payslip: Payslip): void {
    if (payslip.pdfUrl) {
      // If there's a PDF URL, open it directly
      window.open(payslip.pdfUrl, '_blank');
    } else {
      // Generate a printable version
      this.generatePrintablePayslip(payslip);
    }
  }

  private generatePrintablePayslip(payslip: Payslip): void {
    const printWindow = window.open('', '_blank', 'width=800,height=900');
    if (!printWindow) return;

    const earnings = this.getEarnings(payslip);
    const deductions = this.getDeductions(payslip);

    const style = `
      <style>
        body { font-family: Arial, sans-serif; padding: 24px; color: #111827; }
        h2 { margin: 0 0 4px 0; }
        .muted { color: #6B7280; font-size: 12px; }
        table { width: 100%; border-collapse: collapse; margin-top: 16px; }
        th, td { text-align: left; padding: 8px; border-bottom: 1px solid #E5E7EB; }
        .right { text-align: right; }
        .total { font-weight: 600; }
        .net { font-size: 18px; font-weight: 700; }
        .header { margin-bottom: 20px; }
        .period { margin-bottom: 10px; }
      </style>
    `;

    const earningsRows = earnings.map(item => 
      `<tr><td>${item.label}</td><td class="right">${this.formatCurrency(item.amount)}</td></tr>`
    ).join('');

    const deductionRows = deductions.map(item => 
      `<tr><td>${item.label}</td><td class="right">${this.formatCurrency(item.amount)}</td></tr>`
    ).join('');

    const html = `
      <html>
        <head><title>Payslip ${payslip.id}</title>${style}</head>
        <body>
          <div class="header">
          <h2>Payslip</h2>
            <div class="muted">Reference: ${payslip.id}</div>
            <div class="period">
              <div class="muted">Period: ${this.formatDate(payslip.payrollRun.periodStart)} - ${this.formatDate(payslip.payrollRun.periodEnd)}</div>
              <div class="muted">Pay Date: ${this.formatDate(payslip.payrollRun.payDate)}</div>
            </div>
          </div>
          
          <table>
            <thead><tr><th colspan="2">Earnings</th></tr></thead>
            <tbody>
              ${earningsRows}
              <tr class="total"><td>Gross Total</td><td class="right">${this.formatCurrency(payslip.grossPay)}</td></tr>
            </tbody>
          </table>
          
          <table>
            <thead><tr><th colspan="2">Deductions</th></tr></thead>
            <tbody>
              ${deductionRows}
              <tr class="total"><td>Deductions Total</td><td class="right">${this.formatCurrency(payslip.totalDeductions)}</td></tr>
            </tbody>
          </table>
          
          <p class="net">Net Pay: ${this.formatCurrency(payslip.netPay)}</p>
          <script>window.onload = () => window.print();</script>
        </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
  }

  // Helper methods for pagination
  getPageNumbers(): number[] {
    const pages: number[] = [];
    const start = Math.max(1, this.currentPage - 2);
    const end = Math.min(this.totalPages, this.currentPage + 2);
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    
    return pages;
  }

  hasPreviousPage(): boolean {
    return this.currentPage > 1;
  }

  hasNextPage(): boolean {
    return this.currentPage < this.totalPages;
  }

  // Helper methods for form handling
  onYearSelect(event: Event): void {
    const target = event.target as HTMLSelectElement;
    const year = parseInt(target.value);
    this.onYearChange(year);
  }

  onMonthSelect(event: Event): void {
    const target = event.target as HTMLSelectElement;
    const month = parseInt(target.value);
    this.onMonthChange(month);
  }
}
