import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, takeUntil, interval } from 'rxjs';
import { HeaderComponent } from '../../../shared/header/header.component';
import { SidebarComponent } from '../../../shared/sidebar/sidebar.component';
import { PayrollService, PayrollRun, PayrollWorkflow } from '../../../services/payroll.service';

interface Breadcrumb {
  label: string;
  path?: string;
  active?: boolean;
}

@Component({
  selector: 'app-payroll-management',
  standalone: true,
  imports: [CommonModule, FormsModule, HeaderComponent, SidebarComponent],
  templateUrl: './payroll-management.component.html',
  styleUrl: './payroll-management.component.scss'
})
export class PayrollManagementComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  // Breadcrumbs for header
  breadcrumbs: Breadcrumb[] = [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Payroll Management', active: true }
  ];

  // Data
  payrollRuns: PayrollRun[] = [];
  loading = false;
  error: string | null = null;
  
  // Filters
  statusFilter = '';
  searchTerm = '';
  
  // Pagination
  currentPage = 1;
  totalPages = 1;
  pageSize = 10;
  
  // Auto-refresh
  autoRefresh = true;
  refreshInterval = 30000; // 30 seconds

  constructor(
    private payrollService: PayrollService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadPayrollRuns();
    this.startAutoRefresh();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadPayrollRuns(): void {
    this.loading = true;
    this.error = null;
    
    const filters = {
      page: this.currentPage,
      limit: this.pageSize,
      status: this.statusFilter || undefined,
      search: this.searchTerm || undefined
    };

    this.payrollService.getPayrollRuns(filters)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.payrollRuns = response.data;
          this.totalPages = response.pagination?.totalPages || 1;
          this.loading = false;
        },
        error: (error) => {
          this.error = 'Failed to load payroll runs';
          this.loading = false;
          console.error('Error loading payroll runs:', error);
        }
      });
  }

  startAutoRefresh(): void {
    if (this.autoRefresh) {
      interval(this.refreshInterval)
        .pipe(takeUntil(this.destroy$))
        .subscribe(() => {
          this.loadPayrollRuns();
        });
    }
  }

  // ==================== WORKFLOW ACTIONS ====================

  viewWorkflow(payrollRun: PayrollRun): void {
    this.router.navigate(['/admin/payroll-management/workflow', payrollRun.id]);
  }

  createPayrollRun(): void {
    this.router.navigate(['/admin/payroll-management/run-payroll']);
  }

  viewPayslips(payrollRun: PayrollRun): void {
    this.router.navigate(['/admin/payroll-management/payslip-center'], {
      queryParams: { payrollRunId: payrollRun.id }
    });
  }

  // ==================== WORKFLOW QUICK ACTIONS ====================

  approveTimekeeping(payrollRun: PayrollRun): void {
    this.payrollService.approveTimekeeping(payrollRun.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.showSuccessMessage(response.message);
          this.loadPayrollRuns();
        },
        error: (error) => {
          this.showErrorMessage('Failed to approve timekeeping');
        }
      });
  }

  completeComputation(payrollRun: PayrollRun): void {
    this.payrollService.completeWorkhourComputation(payrollRun.id, [])
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.showSuccessMessage(response.message);
          this.loadPayrollRuns();
        },
        error: (error) => {
          this.showErrorMessage('Failed to complete computation');
        }
      });
  }

  completeReview(payrollRun: PayrollRun): void {
    this.payrollService.completePayrollReview(payrollRun.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.showSuccessMessage(response.message);
          this.loadPayrollRuns();
        },
        error: (error) => {
          this.showErrorMessage('Failed to complete review');
        }
      });
  }

  approveByReviewer(payrollRun: PayrollRun): void {
    this.payrollService.approveByReviewer(payrollRun.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.showSuccessMessage(response.message);
          this.loadPayrollRuns();
        },
        error: (error) => {
          this.showErrorMessage('Failed to approve by reviewer');
        }
      });
  }

  approveByApprover(payrollRun: PayrollRun): void {
    this.payrollService.approveByApprover(payrollRun.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.showSuccessMessage(response.message);
          this.loadPayrollRuns();
        },
        error: (error) => {
          this.showErrorMessage('Failed to approve by approver');
        }
      });
  }

  generatePayslips(payrollRun: PayrollRun): void {
    this.payrollService.generatePayslips(payrollRun.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.showSuccessMessage(response.message);
          this.loadPayrollRuns();
        },
        error: (error) => {
          this.showErrorMessage('Failed to generate payslips');
        }
      });
  }

  // ==================== UTILITY METHODS ====================

  canPerformAction(payrollRun: PayrollRun, action: string): boolean {
    return this.payrollService.canPerformAction(payrollRun.status, action);
  }

  getStatusColor(status: string): string {
    return this.payrollService.getWorkflowStatusColor(status);
  }

  getStatusIcon(status: string): string {
    return this.payrollService.getWorkflowStatusIcon(status);
  }

  getStepName(status: string): string {
    return this.payrollService.getWorkflowStepName(status);
  }

  formatDate(date: string | Date): string {
    return this.payrollService.formatDateTime(date);
  }

  formatCurrency(amount: number): string {
    return this.payrollService.formatCurrency(amount);
  }

  showSuccessMessage(message: string): void {
    // Implement toast notification
    console.log('Success:', message);
  }

  showErrorMessage(message: string): void {
    this.error = message;
    console.error('Error:', message);
  }

  onFilterChange(): void {
    this.currentPage = 1;
    this.loadPayrollRuns();
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadPayrollRuns();
  }

  toggleAutoRefresh(): void {
    this.autoRefresh = !this.autoRefresh;
    if (this.autoRefresh) {
      this.startAutoRefresh();
    }
  }

  // Utility method for template
  getMathMin(a: number, b: number): number {
    return Math.min(a, b);
  }
}
