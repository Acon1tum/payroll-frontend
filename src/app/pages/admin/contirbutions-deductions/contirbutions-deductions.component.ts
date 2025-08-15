import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SidebarComponent } from '../../../shared/sidebar/sidebar.component';
import { HeaderComponent } from '../../../shared/header/header.component';
import { EmployeeService, Contribution, ContributionSummary } from '../../../services/employee.service';
import { catchError, finalize } from 'rxjs/operators';
import { of } from 'rxjs';

interface Breadcrumb {
  label: string;
  path?: string;
  active?: boolean;
}

@Component({
  selector: 'app-contirbutions-deductions',
  imports: [CommonModule, SidebarComponent, HeaderComponent],
  templateUrl: './contirbutions-deductions.component.html',
  styleUrl: './contirbutions-deductions.component.scss'
})
export class ContirbutionsDeductionsComponent implements OnInit {
  // Breadcrumbs for header
  breadcrumbs: Breadcrumb[] = [
    { label: 'Dashboard', path: '/admin-dashboard' },
    { label: 'Contributions & Deductions', active: true }
  ];

  contributions: Contribution[] = [];
  summary: ContributionSummary[] = [];
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
  selectedCode?: string;

  // Math property for template
  Math = Math;

  constructor(private employeeService: EmployeeService) {}

  ngOnInit(): void {
    this.loadContributions();
  }

  loadContributions(): void {
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

    if (this.selectedCode) {
      params.code = this.selectedCode;
    }

    this.employeeService.getContributions(params)
      .pipe(
        catchError(error => {
          console.error('Error loading contributions:', error);
          this.error = 'Failed to load contributions. Please try again.';
          return of({ 
            success: false, 
            data: [], 
            summary: [],
            pagination: { page: 1, limit: 10, total: 0, pages: 1 } 
          });
        }),
        finalize(() => this.loading = false)
      )
      .subscribe(response => {
        if (response.success) {
          this.contributions = response.data;
          this.summary = response.summary || [];
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
    this.loadContributions();
  }

  onMonthChange(month: number): void {
    this.selectedMonth = isNaN(month) ? undefined : month;
    this.currentPage = 1;
    this.loadContributions();
  }

  onCodeChange(code: string): void {
    this.selectedCode = code || undefined;
    this.currentPage = 1;
    this.loadContributions();
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadContributions();
  }

  clearFilters(): void {
    this.selectedYear = undefined;
    this.selectedMonth = undefined;
    this.selectedCode = undefined;
    this.currentPage = 1;
    this.loadContributions();
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

  getContributionCodeLabel(code: string): string {
    const labels: { [key: string]: string } = {
      'SSS': 'Social Security System',
      'PHILHEALTH': 'PhilHealth',
      'PAGIBIG': 'Pag-IBIG Fund',
      'BIR': 'Bureau of Internal Revenue'
    };
    return labels[code] || code;
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

  onCodeSelect(event: Event): void {
    const target = event.target as HTMLSelectElement;
    const code = target.value;
    this.onCodeChange(code);
  }
}
