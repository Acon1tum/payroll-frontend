import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil, interval } from 'rxjs';
import { PayrollService, PayrollRun, PayrollWorkflow, WorkhourData } from '../../../../services/payroll.service';
import { AuthService } from '../../../../services/auth.service';

@Component({
  selector: 'app-payroll-workflow',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './payroll-workflow.component.html',
  styleUrls: ['./payroll-workflow.component.scss']
})
export class PayrollWorkflowComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  payrollRunId: string = '';
  payrollRun: PayrollRun | null = null;
  workflow: PayrollWorkflow | null = null;
  loading = false;
  error: string | null = null;
  
  // Workflow steps
  workflowSteps = [
    { id: 'timekeepingPending', name: 'Timekeeping Approval', icon: 'schedule', color: 'yellow' },
    { id: 'timekeepingApproved', name: 'Timekeeping Approved', icon: 'check_circle', color: 'blue' },
    { id: 'computationCompleted', name: 'Workhour Computation', icon: 'calculate', color: 'purple' },
    { id: 'reviewCompleted', name: 'Payroll Review', icon: 'rate_review', color: 'orange' },
    { id: 'reviewerApproved', name: 'Reviewer Approval', icon: 'verified', color: 'green' },
    { id: 'approverApproved', name: 'Approver Approval', icon: 'verified_user', color: 'emerald' },
    { id: 'payslipGenerated', name: 'Payslip Generation', icon: 'description', color: 'violet' },
    { id: 'released', name: 'Released', icon: 'send', color: 'pink' }
  ];
  
  // Action states
  showWorkhourForm = false;
  showReviewForm = false;
  showRejectionForm = false;
  showChangeForm = false;
  showNotificationForm = false;
  
  // Form data
  workhourData: WorkhourData[] = [];
  reviewNotes = '';
  rejectionReason = '';
  changeReason = '';
  changeDetails = '';
  reviewerId = '';
  approverId = '';
  
  // Auto-refresh
  autoRefresh = true;
  refreshInterval = 30000; // 30 seconds

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private payrollService: PayrollService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe(params => {
      this.payrollRunId = params['id'];
      if (this.payrollRunId) {
        this.loadWorkflowStatus();
        this.startAutoRefresh();
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadWorkflowStatus(): void {
    this.loading = true;
    this.error = null;
    
    this.payrollService.getPayrollWorkflowStatus(this.payrollRunId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.payrollRun = response.data.payrollRun;
          this.workflow = response.data.workflow;
          this.loading = false;
        },
        error: (error) => {
          this.error = 'Failed to load workflow status';
          this.loading = false;
          console.error('Error loading workflow:', error);
        }
      });
  }

  startAutoRefresh(): void {
    if (this.autoRefresh) {
      interval(this.refreshInterval)
        .pipe(takeUntil(this.destroy$))
        .subscribe(() => {
          this.loadWorkflowStatus();
        });
    }
  }

  // ==================== WORKFLOW ACTIONS ====================

  approveTimekeeping(): void {
    this.loading = true;
    this.payrollService.approveTimekeeping(this.payrollRunId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.workflow = response.data.workflow;
          this.loading = false;
          this.showSuccessMessage(response.message);
        },
        error: (error) => {
          this.loading = false;
          this.showErrorMessage('Failed to approve timekeeping');
        }
      });
  }

  completeWorkhourComputation(): void {
    this.showWorkhourForm = true;
  }

  submitWorkhourComputation(): void {
    this.loading = true;
    this.payrollService.completeWorkhourComputation(this.payrollRunId, this.workhourData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.workflow = response.data.workflow;
          this.loading = false;
          this.showWorkhourForm = false;
          this.showSuccessMessage(response.message);
        },
        error: (error) => {
          this.loading = false;
          this.showErrorMessage('Failed to complete workhour computation');
        }
      });
  }

  completePayrollReview(): void {
    this.showReviewForm = true;
  }

  submitPayrollReview(): void {
    this.loading = true;
    this.payrollService.completePayrollReview(this.payrollRunId, this.reviewNotes)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.workflow = response.data.workflow;
          this.loading = false;
          this.showReviewForm = false;
          this.showSuccessMessage(response.message);
        },
        error: (error) => {
          this.loading = false;
          this.showErrorMessage('Failed to complete payroll review');
        }
      });
  }

  approveByReviewer(): void {
    this.loading = true;
    this.payrollService.approveByReviewer(this.payrollRunId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.workflow = response.data.workflow;
          this.loading = false;
          this.showSuccessMessage(response.message);
        },
        error: (error) => {
          this.loading = false;
          this.showErrorMessage('Failed to approve by reviewer');
        }
      });
  }

  approveByApprover(): void {
    this.loading = true;
    this.payrollService.approveByApprover(this.payrollRunId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.workflow = response.data.workflow;
          this.loading = false;
          this.showSuccessMessage(response.message);
        },
        error: (error) => {
          this.loading = false;
          this.showErrorMessage('Failed to approve by approver');
        }
      });
  }

  generatePayslips(): void {
    this.loading = true;
    this.payrollService.generatePayslips(this.payrollRunId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.workflow = response.data.workflow;
          this.loading = false;
          this.showSuccessMessage(response.message);
        },
        error: (error) => {
          this.loading = false;
          this.showErrorMessage('Failed to generate payslips');
        }
      });
  }

  // ==================== REJECTION HANDLING ====================

  rejectByReviewer(): void {
    this.showRejectionForm = true;
  }

  submitRejectionByReviewer(): void {
    this.loading = true;
    this.payrollService.rejectByReviewer(this.payrollRunId, this.rejectionReason)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.workflow = response.data.workflow;
          this.loading = false;
          this.showRejectionForm = false;
          this.showSuccessMessage(response.message);
        },
        error: (error) => {
          this.loading = false;
          this.showErrorMessage('Failed to reject by reviewer');
        }
      });
  }

  rejectByApprover(): void {
    this.showRejectionForm = true;
  }

  submitRejectionByApprover(): void {
    this.loading = true;
    this.payrollService.rejectByApprover(this.payrollRunId, this.rejectionReason)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.workflow = response.data.workflow;
          this.loading = false;
          this.showRejectionForm = false;
          this.showSuccessMessage(response.message);
        },
        error: (error) => {
          this.loading = false;
          this.showErrorMessage('Failed to reject by approver');
        }
      });
  }

  // ==================== CHANGE HANDLING ====================

  handleChanges(): void {
    this.showChangeForm = true;
  }

  submitChanges(): void {
    this.loading = true;
    this.payrollService.handleChanges(this.payrollRunId, this.changeReason, this.changeDetails)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.workflow = response.data.workflow;
          this.loading = false;
          this.showChangeForm = false;
          this.showSuccessMessage(response.message);
        },
        error: (error) => {
          this.loading = false;
          this.showErrorMessage('Failed to handle changes');
        }
      });
  }

  // ==================== NOTIFICATION SYSTEM ====================

  notifyReviewer(): void {
    this.showNotificationForm = true;
  }

  submitNotificationToReviewer(): void {
    this.loading = true;
    this.payrollService.notifyPayrollReviewer(this.payrollRunId, this.reviewerId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.loading = false;
          this.showNotificationForm = false;
          this.showSuccessMessage(response.message);
        },
        error: (error) => {
          this.loading = false;
          this.showErrorMessage('Failed to notify reviewer');
        }
      });
  }

  notifyApprover(): void {
    this.showNotificationForm = true;
  }

  submitNotificationToApprover(): void {
    this.loading = true;
    this.payrollService.notifyPayrollApprover(this.payrollRunId, this.approverId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.loading = false;
          this.showNotificationForm = false;
          this.showSuccessMessage(response.message);
        },
        error: (error) => {
          this.loading = false;
          this.showErrorMessage('Failed to notify approver');
        }
      });
  }

  // ==================== UTILITY METHODS ====================

  canPerformAction(action: string): boolean {
    if (!this.payrollRun) return false;
    return this.payrollService.canPerformAction(this.payrollRun.status, action);
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

  closeModal(): void {
    this.showWorkhourForm = false;
    this.showReviewForm = false;
    this.showRejectionForm = false;
    this.showChangeForm = false;
    this.showNotificationForm = false;
  }

  goBack(): void {
    this.router.navigate(['/admin/payroll-management']);
  }

  // ==================== UTILITY METHODS FOR TEMPLATE ====================

  isStepCompleted(stepId: string): boolean {
    if (!this.workflow) return false;
    
    switch (stepId) {
      case 'timekeepingPending':
        return this.workflow.timekeepingApproved;
      case 'timekeepingApproved':
        return this.workflow.timekeepingApproved;
      case 'computationCompleted':
        return this.workflow.computationCompleted;
      case 'reviewCompleted':
        return this.workflow.reviewCompleted;
      case 'reviewerApproved':
        return this.workflow.reviewerApproved;
      case 'approverApproved':
        return this.workflow.approverApproved;
      case 'payslipGenerated':
        return this.workflow.payslipGenerated;
      case 'released':
        return this.payrollRun?.status === 'released';
      default:
        return false;
    }
  }

  isCurrentStep(stepId: string): boolean {
    if (!this.payrollRun) return false;
    return this.payrollRun.status === stepId;
  }

  getStepCompletionTime(stepId: string): string {
    if (!this.workflow) return '';
    
    switch (stepId) {
      case 'timekeepingApproved':
        return this.workflow.timekeepingApprovedAt ? this.formatDate(this.workflow.timekeepingApprovedAt) : '';
      case 'computationCompleted':
        return this.workflow.computationCompletedAt ? this.formatDate(this.workflow.computationCompletedAt) : '';
      case 'reviewCompleted':
        return this.workflow.reviewCompletedAt ? this.formatDate(this.workflow.reviewCompletedAt) : '';
      case 'reviewerApproved':
        return this.workflow.reviewerApprovedAt ? this.formatDate(this.workflow.reviewerApprovedAt) : '';
      case 'approverApproved':
        return this.workflow.approverApprovedAt ? this.formatDate(this.workflow.approverApprovedAt) : '';
      case 'payslipGenerated':
        return this.workflow.payslipGeneratedAt ? this.formatDate(this.workflow.payslipGeneratedAt) : '';
      default:
        return '';
    }
  }
}
