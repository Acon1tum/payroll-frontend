import { Component, OnInit, HostListener } from '@angular/core';
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

  formatDate(dateString: string | Date): string {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    return date.toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  openDetails(payslip: Payslip): void {
    this.selected = payslip;
    this.showDetailsModal = true;
    // Lock body scroll when modal is open
    try { document.body.style.overflow = 'hidden'; } catch {}
  }

  closeDetails(): void {
    this.showDetailsModal = false;
    this.selected = null;
    // Restore body scroll
    try { document.body.style.overflow = ''; } catch {}
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

  // Real payslip helpers
  get companyLogoUrl(): string {
    // Resolve to absolute URL so it also works in a new print window
    const assetPath = 'assets/images/logos/QuanbyLogo.png';
    const base = (document.getElementsByTagName('base')[0]?.href) || (window.location.origin + '/');
    try {
      return new URL(assetPath, base).toString();
    } catch {
      return `/${assetPath}`; // fallback
    }
  }

  getOrganizationName(payslip?: Payslip | null): string {
    return payslip?.employee?.organization?.name || 'Quanby Solutions Inc.';
  }

  getEmployeeFullName(payslip?: Payslip | null): string {
    if (!payslip?.employee) return '';
    return `${payslip.employee.firstName} ${payslip.employee.lastName}`.trim();
  }

  getEmployeeNumber(payslip?: Payslip | null): string {
    return payslip?.employee?.employeeNumber || '';
  }

  getQrDataForPayslip(payslip?: Payslip | null): string {
    if (!payslip) return '';
    const payload = {
      payslipId: payslip.id,
      employeeId: payslip.employeeId,
      periodStart: payslip.payrollRun?.periodStart,
      periodEnd: payslip.payrollRun?.periodEnd,
      payDate: payslip.payrollRun?.payDate,
      netPay: payslip.netPay,
    };
    const encoded = encodeURIComponent(JSON.stringify(payload));
    return `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encoded}`;
  }

  printSelectedPayslip(): void {
    if (!this.selected) return;
    
    const printWindow = window.open('', '_blank', 'width=800,height=900');
    if (!printWindow) return;
    const styles = `
      <style>
        body { font-family: Arial, sans-serif; color: #111827; padding: 24px; }
        .header { display:flex; align-items:center; justify-content:space-between; border-bottom:1px solid #E5E7EB; padding-bottom:12px; margin-bottom:16px; }
        .meta { font-size:12px; color:#6B7280; }
        .grid { display:grid; grid-template-columns: 1fr 1fr; gap:16px; }
        h2 { margin: 0 0 4px 0; }
        table { width:100%; border-collapse:collapse; margin-top:8px; }
        th, td { text-align:left; padding:6px 8px; border-bottom:1px solid #E5E7EB; font-size:12px; }
        .right { text-align:right; }
        .total { font-weight:600; }
        .net { font-size:16px; font-weight:700; margin-top:12px; }
      </style>
    `;
    const bodyHtml = this.buildPayslipHtml(this.selected);
    printWindow.document.open();
    printWindow.document.write(`<!doctype html><html><head><title>Payslip ${this.selected.id}</title>${styles}</head><body>${bodyHtml}<script>window.onload = () => window.print();<\/script></body></html>`);
    printWindow.document.close();
  }

  // Close on ESC key
  @HostListener('document:keydown.escape', ['$event'])
  onEscKey(): void {
    if (this.showDetailsModal) {
      this.closeDetails();
    }
  }

  private generatePrintablePayslip(payslip: Payslip): void {
    const printWindow = window.open('', '_blank', 'width=800,height=900');
    if (!printWindow) return;
    const style = `
      <style>
        body { font-family: Arial, sans-serif; color: #111827; padding: 24px; }
        .header { display:flex; align-items:center; justify-content:space-between; border-bottom:1px solid #E5E7EB; padding-bottom:12px; margin-bottom:16px; }
        .meta { font-size:12px; color:#6B7280; }
        .grid { display:grid; grid-template-columns: 1fr 1fr; gap:16px; }
        h2 { margin: 0 0 4px 0; }
        table { width:100%; border-collapse:collapse; margin-top:8px; }
        th, td { text-align:left; padding:6px 8px; border-bottom:1px solid #E5E7EB; font-size:12px; }
        .right { text-align:right; }
        .total { font-weight:600; }
        .net { font-size:16px; font-weight:700; margin-top:12px; }
      </style>
    `;

    const htmlBody = this.buildPayslipHtml(payslip);
    const html = `
      <html>
        <head><title>Payslip ${payslip.id}</title>${style}</head>
        <body>${htmlBody}<script>window.onload = () => window.print();</script></body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
  }

  // Build the same HTML structure as the in-app modal for printing
  private buildPayslipHtml(payslip: Payslip): string {
    const earnings = this.getEarnings(payslip);
    const deductions = this.getDeductions(payslip);
    const logo = this.companyLogoUrl;
    const org = this.getOrganizationName(payslip);
    const employee = this.getEmployeeFullName(payslip);
    const empNo = this.getEmployeeNumber(payslip);
    const qr = this.getQrDataForPayslip(payslip);
    const freq = this.getPayFrequencyDisplay(payslip.payrollRun?.frequency || 'monthly');

    const earningsRows = earnings.map(item => `
      <tr>
        <td class="px-3 py-2 text-sm">${item.label}</td>
        <td class="px-3 py-2 text-sm right">${this.formatCurrency(item.amount)}</td>
      </tr>
    `).join('');

    const deductionsRows = deductions.map(item => `
      <tr>
        <td class="px-3 py-2 text-sm">${item.label}</td>
        <td class="px-3 py-2 text-sm right">${this.formatCurrency(item.amount)}</td>
      </tr>
    `).join('');

    return `
      <div>
        <div class="header">
          <div style="display:flex;align-items:center;gap:12px;">
            <img src="${logo}" alt="Company Logo" style="height:40px;width:auto;" />
            <div>
              <h2 style="font-size:16px; font-weight:600;">${org}</h2>
              <div class="meta">Official Payslip</div>
            </div>
          </div>
          <img src="${qr}" alt="QR Code" style="height:64px;width:64px;" />
        </div>

        <div class="grid">
          <div>
            <div class="meta"><strong style="color:#374151;font-weight:500;">Employee:</strong> <span style="background-color:#fef3c7;padding:2px 4px;border-radius:3px;font-weight:600;">${employee}</span></div>
            ${empNo ? `<div class=\"meta\"><strong style=\\"color:#374151;font-weight:500;\\">Employee No.:</strong> ${empNo}</div>` : ''}
            ${payslip.employee?.id ? `<div class=\"meta\"><strong style=\\"color:#374151;font-weight:500;\\">Employee ID:</strong> ${payslip.employee.id}</div>` : ''}
            <div class="meta"><strong style="color:#374151;font-weight:500;">Pay Frequency:</strong> ${freq}</div>
          </div>
          <div style="text-align:right;">
            <div class="meta"><strong style="color:#374151;font-weight:500;">Period:</strong> ${this.formatDate(payslip.payrollRun.periodStart)} - ${this.formatDate(payslip.payrollRun.periodEnd)}</div>
            <div class="meta"><strong style="color:#374151;font-weight:500;">Pay Date:</strong> ${this.formatDate(payslip.payrollRun.payDate)}</div>
            <div class="meta"><strong style="color:#374151;font-weight:500;">Reference:</strong> ${payslip.id}</div>
          </div>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-top:16px;">
          <div>
            <h5 style="font-size:14px;font-weight:600;margin:0 0 8px 0;">Earnings</h5>
            <table>
              <thead><tr><th style="font-size:11px;color:#6B7280;">Description</th><th class="right" style="font-size:11px;color:#6B7280;">Amount</th></tr></thead>
              <tbody>
                ${earningsRows}
                <tr class="total"><td>Gross Total</td><td class="right">${this.formatCurrency(payslip.grossPay)}</td></tr>
              </tbody>
            </table>
          </div>
          <div>
            <h5 style="font-size:14px;font-weight:600;margin:0 0 8px 0;">Deductions</h5>
            <table>
              <thead><tr><th style="font-size:11px;color:#6B7280;">Description</th><th class="right" style="font-size:11px;color:#6B7280;">Amount</th></tr></thead>
              <tbody>
                ${deductionsRows}
                <tr class="total"><td>Deductions Total</td><td class="right">${this.formatCurrency(payslip.totalDeductions)}</td></tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="net" style="display:flex;align-items:center;justify-content:space-between; margin-top:16px;">
          <span style="font-weight:600;">Net Pay</span>
          <span style="font-weight:700;">${this.formatCurrency(payslip.netPay)}</span>
        </div>
        
        <div style="margin-top:12px; padding:8px; background-color:#f9fafb; border-radius:4px;">
          <div style="font-size:12px; color:#6b7280; margin-bottom:4px;">Amount in Words:</div>
          <div style="font-weight:600; text-transform:uppercase;">${this.numberToWords(payslip.netPay)} PESOS ONLY</div>
        </div>
        
        <div style="margin-top:24px; display:grid; grid-template-columns:1fr 1fr; gap:32px;">
          <div style="text-align:center;">
            <div style="border-bottom:1px solid #374151; width:200px; margin:0 auto 8px auto; height:40px;"></div>
            <div style="font-size:12px; color:#6b7280;">CEO of Company</div>
            <div style="font-size:12px; color:#6b7280; margin-top:4px;">Authorized Signature</div>
          </div>
          <div style="text-align:center;">
            <div style="border-bottom:1px solid #374151; width:200px; margin:0 auto 8px auto; height:40px;"></div>
            <div style="font-size:12px; color:#6b7280;">Employee Signature</div>
            <div style="font-size:12px; color:#6b7280; margin-top:4px;">${employee}</div>
          </div>
        </div>
      </div>
    `;
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

  // Get pay frequency display name
  getPayFrequencyDisplay(frequency: string): string {
    const frequencyMap: { [key: string]: string } = {
      'weekly': 'Weekly',
      'semiMonthly': 'Semi-Monthly',
      'monthly': 'Monthly'
    };
    return frequencyMap[frequency] || 'Monthly';
  }

  // Get frequency badge CSS classes
  getFrequencyBadgeClass(frequency: string): string {
    switch (frequency) {
      case 'weekly':
        return 'bg-blue-100 text-blue-800';
      case 'semiMonthly':
        return 'bg-green-100 text-green-800';
      case 'monthly':
      default:
        return 'bg-blue-100 text-blue-800';
    }
  }

  // Convert number to words for amount in words
  numberToWords(amount: number): string {
    const ones = ['', 'ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT', 'NINE'];
    const teens = ['TEN', 'ELEVEN', 'TWELVE', 'THIRTEEN', 'FOURTEEN', 'FIFTEEN', 'SIXTEEN', 'SEVENTEEN', 'EIGHTEEN', 'NINETEEN'];
    const tens = ['', '', 'TWENTY', 'THIRTY', 'FORTY', 'FIFTY', 'SIXTY', 'SEVENTY', 'EIGHTY', 'NINETY'];
    const thousands = ['', 'THOUSAND', 'MILLION', 'BILLION'];

    if (amount === 0) return 'ZERO';

    let num = Math.floor(amount);
    let result = '';

    const convertHundreds = (n: number): string => {
      let str = '';
      if (n > 99) {
        str += ones[Math.floor(n / 100)] + ' HUNDRED ';
        n %= 100;
      }
      if (n > 19) {
        str += tens[Math.floor(n / 10)] + ' ';
        n %= 10;
      } else if (n > 9) {
        str += teens[n - 10] + ' ';
        return str;
      }
      if (n > 0) {
        str += ones[n] + ' ';
      }
      return str;
    };

    let thousandIndex = 0;
    while (num > 0) {
      const chunk = num % 1000;
      if (chunk !== 0) {
        result = convertHundreds(chunk) + thousands[thousandIndex] + ' ' + result;
      }
      num = Math.floor(num / 1000);
      thousandIndex++;
    }

    return result.trim();
  }
}
