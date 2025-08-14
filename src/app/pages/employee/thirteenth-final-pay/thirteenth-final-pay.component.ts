import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SidebarComponent } from '../../../shared/sidebar/sidebar.component';
import { HeaderComponent } from '../../../shared/header/header.component';
import { EmployeeService, ThirteenthMonthRecord, ThirteenthMonthSummary } from '../../../services/employee.service';
import { catchError, finalize } from 'rxjs/operators';
import { of } from 'rxjs';

interface Breadcrumb {
  label: string;
  path?: string;
  active?: boolean;
}

@Component({
  selector: 'app-thirteenth-final-pay',
  imports: [CommonModule, SidebarComponent, HeaderComponent],
  templateUrl: './thirteenth-final-pay.component.html',
  styleUrl: './thirteenth-final-pay.component.scss'
})
export class ThirteenthFinalPayComponent implements OnInit {
  // Breadcrumbs for header
  breadcrumbs: Breadcrumb[] = [
    { label: 'Dashboard', path: '/employee-dashboard' },
    { label: '13th Month Pay & Final Pay', active: true }
  ];

  thirteenthMonthRecords: ThirteenthMonthRecord[] = [];
  summary: ThirteenthMonthSummary | null = null;
  loading = false;
  error = '';

  // Pagination
  currentPage = 1;
  totalPages = 1;
  totalItems = 0;
  itemsPerPage = 10;

  // Filters
  selectedYear?: number;

  // Modal states
  showThirteenthModal = false;
  showFinalPayModal = false;

  // Current year's 13th month data
  currentYearThirteenthMonth: ThirteenthMonthRecord | null = null;

  // Math property for template
  Math = Math;

  constructor(private employeeService: EmployeeService) {}

  ngOnInit(): void {
    this.loadThirteenthMonthRecords();
  }

  loadThirteenthMonthRecords(): void {
    this.loading = true;
    this.error = '';

    const params: any = {
      page: this.currentPage,
      limit: this.itemsPerPage
    };

    if (this.selectedYear) {
      params.year = this.selectedYear;
    }

    this.employeeService.getThirteenthMonth(params)
      .pipe(
        catchError(error => {
          console.error('Error loading thirteenth month records:', error);
          this.error = 'Failed to load thirteenth month records. Please try again.';
          return of({ 
            success: false, 
            data: [], 
            summary: { totalAmount: 0, totalRecords: 0, averageAmount: 0 },
            pagination: { page: 1, limit: 10, total: 0, pages: 1 } 
          });
        }),
        finalize(() => this.loading = false)
      )
      .subscribe(response => {
        if (response.success) {
          this.thirteenthMonthRecords = response.data;
          this.summary = response.summary;
          if (response.pagination) {
            this.currentPage = response.pagination.page;
            this.totalPages = response.pagination.pages;
            this.totalItems = response.pagination.total;
          }
          
          // Set current year's record
          const currentYear = new Date().getFullYear();
          this.currentYearThirteenthMonth = this.thirteenthMonthRecords.find(record => record.year === currentYear) || null;
        }
      });
  }

  onYearChange(year: number): void {
    this.selectedYear = isNaN(year) ? undefined : year;
    this.currentPage = 1;
    this.loadThirteenthMonthRecords();
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadThirteenthMonthRecords();
  }

  clearFilters(): void {
    this.selectedYear = undefined;
    this.currentPage = 1;
    this.loadThirteenthMonthRecords();
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(amount);
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  getStatusBadgeClass(record: ThirteenthMonthRecord): string {
    if (record.releasedAt) {
      return 'bg-green-100 text-green-700';
    } else {
      return 'bg-yellow-100 text-yellow-700';
    }
  }

  getStatusText(record: ThirteenthMonthRecord): string {
    if (record.releasedAt) {
      return 'Released';
    } else {
      return 'Pending';
  }
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

  // Modal methods
  openThirteenthModal(): void { 
    this.showThirteenthModal = true; 
  }
  
  closeThirteenthModal(): void { 
    this.showThirteenthModal = false; 
  }

  openFinalPayModal(): void { 
    this.showFinalPayModal = true; 
  }
  
  closeFinalPayModal(): void { 
    this.showFinalPayModal = false; 
  }

  // Download methods
  downloadThirteenthCertificate(): void {
    if (!this.currentYearThirteenthMonth) {
      alert('No 13th month record available for download.');
      return;
    }

    const w = window.open('', '_blank');
    if (!w) { return; }
    
    const doc = `
      <html>
        <head>
          <title>13th Month Certificate - ${this.currentYearThirteenthMonth.year}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .content { margin-bottom: 20px; }
            .amount { font-size: 18px; font-weight: bold; }
            .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #666; }
          </style>
        </head>
      <body>
          <div class="header">
            <h2>13th Month Pay Certificate</h2>
            <h3>Year ${this.currentYearThirteenthMonth.year}</h3>
          </div>
          <div class="content">
            <p><strong>Amount:</strong> <span class="amount">${this.formatCurrency(this.currentYearThirteenthMonth.amount)}</span></p>
            ${this.currentYearThirteenthMonth.releasedAt ? 
              `<p><strong>Released Date:</strong> ${this.formatDate(this.currentYearThirteenthMonth.releasedAt)}</p>` : 
              '<p><strong>Status:</strong> Pending Release</p>'
            }
          </div>
          <div class="footer">
        <p>Generated by Payroll System</p>
            <p>Date: ${new Date().toLocaleDateString()}</p>
          </div>
        </body>
      </html>
    `;
    
    w.document.write(doc);
    w.document.close();
    w.focus();
    w.print();
  }

  downloadFinalPayslip(): void {
    const w = window.open('', '_blank');
    if (!w) { return; }
    
    const doc = `
      <html>
        <head>
          <title>Final Payslip</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .content { margin-bottom: 20px; }
            .amount { font-size: 18px; font-weight: bold; }
            .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #666; }
          </style>
        </head>
      <body>
          <div class="header">
        <h2>Final Payslip</h2>
          </div>
          <div class="content">
            <p><strong>Note:</strong> Final pay computation will be available when employment ends.</p>
            <p>This feature is for employees who have completed their employment.</p>
          </div>
          <div class="footer">
        <p>Generated by Payroll System</p>
            <p>Date: ${new Date().toLocaleDateString()}</p>
          </div>
        </body>
      </html>
    `;
    
    w.document.write(doc);
    w.document.close();
    w.focus();
    w.print();
  }
}


