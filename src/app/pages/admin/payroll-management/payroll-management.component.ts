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

  // Confirmation modal state
  showConfirmModal = false;
  confirming = false;
  pendingAction: { type: 'approveTimekeeping' | 'completeComputation' | 'completeReview' | 'approveReviewer' | 'approveApprover' | 'generatePayslips'; run: PayrollRun } | null = null;

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

  navigateToAlphalist(): void {
    this.router.navigate(['/alphalist']);
  }

  viewPayslips(payrollRun: PayrollRun): void {
    this.router.navigate(['/admin/payroll-management/payslip-center'], {
      queryParams: { payrollRunId: payrollRun.id }
    });
  }

  // ==================== WORKFLOW QUICK ACTIONS ====================

  // Open confirmation modal
  openConfirm(actionType: 'approveTimekeeping' | 'completeComputation' | 'completeReview' | 'approveReviewer' | 'approveApprover' | 'generatePayslips', payrollRun: PayrollRun): void {
    this.pendingAction = { type: actionType, run: payrollRun } as const;
    this.showConfirmModal = true;
  }

  // Cancel confirmation
  cancelConfirm(): void {
    this.showConfirmModal = false;
    this.confirming = false;
    this.pendingAction = null;
  }

  // Map action label for modal text
  getActionLabel(action?: string | null): string {
    switch (action) {
      case 'approveTimekeeping':
        return 'approve timekeeping';
      case 'completeComputation':
        return 'complete computation';
      case 'completeReview':
        return 'complete review';
      case 'approveReviewer':
        return 'approve as Reviewer';
      case 'approveApprover':
        return 'approve as Approver';
      case 'generatePayslips':
        return 'generate payslips';
      default:
        return 'perform this action';
    }
  }

  // Helper for modal period label to satisfy template type checking
  getPendingPeriodLabel(): string {
    const run = this.pendingAction?.run;
    if (!run) return '';
    return `${this.formatDate(run.periodStart)} - ${this.formatDate(run.periodEnd)}`;
  }

  // Execute pending action after confirmation
  confirmAction(): void {
    if (!this.pendingAction) return;
    const { type, run } = this.pendingAction;

    // Frontend guard to avoid invalid transitions
    const allowed = this.canPerformAction(run, type);
    if (!allowed) {
      this.showErrorMessage(`Action not allowed. Current status is ${run.status}.`);
      this.cancelConfirm();
      return;
    }
    this.confirming = true;

    switch (type) {
      case 'approveTimekeeping':
        this.approveTimekeeping(run, true);
        break;
      case 'completeComputation':
        this.completeComputation(run, true);
        break;
      case 'completeReview':
        this.completeReview(run, true);
        break;
      case 'approveReviewer':
        this.approveByReviewer(run, true);
        break;
      case 'approveApprover':
        this.approveByApprover(run, true);
        break;
      case 'generatePayslips':
        this.generatePayslips(run, true);
        break;
    }
  }

  approveTimekeeping(payrollRun: PayrollRun, fromConfirm: boolean = false): void {
    this.payrollService.approveTimekeeping(payrollRun.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.showSuccessMessage(response.message);
          this.loadPayrollRuns();
          if (fromConfirm) this.cancelConfirm();
        },
        error: (error) => {
          this.showErrorMessage(error?.error?.message || 'Failed to approve timekeeping');
          if (fromConfirm) this.confirming = false;
        }
      });
  }

  completeComputation(payrollRun: PayrollRun, fromConfirm: boolean = false): void {
    this.payrollService.completeWorkhourComputation(payrollRun.id, [])
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.showSuccessMessage(response.message);
          this.loadPayrollRuns();
          if (fromConfirm) this.cancelConfirm();
        },
        error: (error) => {
          this.showErrorMessage(error?.error?.message || 'Failed to complete computation');
          if (fromConfirm) this.confirming = false;
        }
      });
  }

  completeReview(payrollRun: PayrollRun, fromConfirm: boolean = false): void {
    this.payrollService.completePayrollReview(payrollRun.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.showSuccessMessage(response.message);
          this.loadPayrollRuns();
          if (fromConfirm) this.cancelConfirm();
        },
        error: (error) => {
          this.showErrorMessage(error?.error?.message || 'Failed to complete review');
          if (fromConfirm) this.confirming = false;
        }
      });
  }

  approveByReviewer(payrollRun: PayrollRun, fromConfirm: boolean = false): void {
    this.payrollService.approveByReviewer(payrollRun.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.showSuccessMessage(response.message);
          this.loadPayrollRuns();
          if (fromConfirm) this.cancelConfirm();
        },
        error: (error) => {
          this.showErrorMessage(error?.error?.message || 'Failed to approve by reviewer');
          if (fromConfirm) this.confirming = false;
        }
      });
  }

  approveByApprover(payrollRun: PayrollRun, fromConfirm: boolean = false): void {
    this.payrollService.approveByApprover(payrollRun.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.showSuccessMessage(response.message);
          this.loadPayrollRuns();
          if (fromConfirm) this.cancelConfirm();
        },
        error: (error) => {
          this.showErrorMessage(error?.error?.message || 'Failed to approve by approver');
          if (fromConfirm) this.confirming = false;
        }
      });
  }

  generatePayslips(payrollRun: PayrollRun, fromConfirm: boolean = false): void {
    this.payrollService.generatePayslips(payrollRun.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.showSuccessMessage(response.message);
          this.loadPayrollRuns();
          if (fromConfirm) this.cancelConfirm();
        },
        error: (error) => {
          this.showErrorMessage(error?.error?.message || 'Failed to generate payslips');
          if (fromConfirm) this.confirming = false;
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

  // Safely resolve employee count and total pay for display
  getEmployeeCount(run: PayrollRun): number {
    // Prefer explicit field; fallback to workflow or payslips length if available
    if (typeof run.totalEmployees === 'number' && !isNaN(run.totalEmployees)) {
      return run.totalEmployees;
    }
    if (Array.isArray(run.payslips)) {
      return run.payslips.length;
    }
    // Could also come from workflow review summary if API maps differently
    // Return 0 as last resort
    return 0;
  }

  getTotalPay(run: PayrollRun): number {
    // Prefer netPay if present, otherwise grossPay; fallback to sum of payslips
    if (typeof run.netPay === 'number' && !isNaN(run.netPay)) {
      return run.netPay;
    }
    if (typeof run.grossPay === 'number' && !isNaN(run.grossPay)) {
      return run.grossPay;
    }
    if (Array.isArray(run.payslips)) {
      const sum = run.payslips.reduce((acc, p) => acc + (typeof p.netPay === 'number' ? p.netPay : (typeof p.grossPay === 'number' ? p.grossPay : 0)), 0);
      return sum;
    }
    return 0;
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
