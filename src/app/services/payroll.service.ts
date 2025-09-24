import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environment/environment';
import { AuthService } from './auth.service';

export interface PayrollRun {
  id: string;
  periodStart: string | Date;
  periodEnd: string | Date;
  payDate: string | Date;
  frequency: 'weekly' | 'semiMonthly' | 'monthly';
  status: 'draft' | 'timekeepingPending' | 'timekeepingApproved' | 'computationPending' | 'computationCompleted' | 'reviewPending' | 'reviewCompleted' | 'reviewerApproved' | 'approverPending' | 'approverApproved' | 'payslipGenerated' | 'released' | 'cancelled';
  totalEmployees: number;
  grossPay: number;
  netPay: number;
  totalDeductions: number;
  totalOvertime: number;
  processedById?: string;
  processedBy?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  createdAt: string | Date;
  updatedAt: string | Date;
  payslips?: Payslip[];
  notes?: string;
  workflow?: PayrollWorkflow;
}

export interface Payslip {
  id: string;
  payrollRunId: string;
  employeeId: string;
  grossPay: number;
  totalDeductions: number;
  netPay: number;
  pdfUrl?: string;
  releasedAt?: string | Date;
  createdAt: string | Date;
  employee?: {
    id: string;
    employeeNumber: string;
    firstName: string;
    lastName: string;
    position: string;
    department?: {
      name: string;
    };
    organization?: {
      name: string;
    };
    baseSalary: number;
  };
  payrollRun?: PayrollRun;
  items?: PayslipItem[];
}

export interface PayslipItem {
  id: string;
  payslipId: string;
  label: string;
  amount: number;
  type: 'earning' | 'deduction';
  contributionCode?: 'SSS' | 'PHILHEALTH' | 'PAGIBIG' | 'BIR';
  loanId?: string;
  loan?: {
    id: string;
    type: string;
    principal: number;
    balance: number;
  };
}

export interface PayrollReview {
  payrollRunId: string;
  totalEmployees: number;
  totalGrossPay: number;
  totalDeductions: number;
  totalNetPay: number;
  totalSSS: number;
  totalPhilHealth: number;
  totalPagIBIG: number;
  totalBIR: number;
  totalOvertime: number;
  averageSalary: number;
  payslips: PayslipReviewItem[];
  status: 'draft' | 'timekeepingPending' | 'timekeepingApproved' | 'computationCompleted' | 'reviewCompleted' | 'reviewerApproved' | 'approverApproved' | 'payslipGenerated' | 'released' | 'cancelled';
  createdAt: string | Date;
  periodStart: string | Date;
  periodEnd: string | Date;
  payDate: string | Date;
}

export interface PayslipReviewItem {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeNumber: string;
  department: string;
  position: string;
  baseSalary: number;
  grossPay: number;
  totalDeductions: number;
  netPay: number;
  sss: number;
  philHealth: number;
  pagIBIG: number;
  bir: number;
  overtime: number;
  allowances: number;
  otherDeductions: number;
  status: 'included' | 'excluded' | 'pending';
  items: PayslipItem[];
}

export interface PayrollRegister {
  payrollRunId: string;
  period: string;
  totalEmployees: number;
  totalGrossPay: number;
  totalDeductions: number;
  totalNetPay: number;
  breakdown: {
    sss: { employee: number; employer: number; total: number };
    philHealth: { employee: number; employer: number; total: number };
    pagIBIG: { employee: number; employer: number; total: number };
    bir: { employee: number; employer: number; total: number };
    overtime: number;
    allowances: number;
    otherDeductions: number;
  };
  employees: PayslipReviewItem[];
  generatedAt: string | Date;
  generatedBy: string;
}

export interface PayrollApproval {
  payrollRunId: string;
  status: 'approved' | 'rejected';
  notes?: string;
  approvedBy: string;
  approvedAt: string | Date;
}

export interface PayrollSummary {
  totalPayrollRuns: number;
  totalEmployees: number;
  totalGrossPay: number;
  totalNetPay: number;
  totalDeductions: number;
  totalSSS?: number;
  totalPhilHealth?: number;
  totalPagIBIG?: number;
  totalBIR?: number;
  totalOvertime?: number;
  averageSalary: number;
  pendingApprovals: number;
  recentRuns: PayrollRun[];
}

export interface PayrollFilters {
  page?: number;
  limit?: number;
  status?: string;
  startDate?: string;
  endDate?: string;
  departmentId?: string;
  employeeId?: string;
  search?: string;
}

// ==================== WORKFLOW INTERFACES ====================

export interface PayrollWorkflow {
  id: string;
  payrollRunId: string;
  // Timekeeping Phase
  timekeepingApproved: boolean;
  timekeepingApprovedBy?: string;
  timekeepingApprovedAt?: string | Date;
  timekeepingApprover?: {
    id: string;
    email: string;
  };
  // Computation Phase
  computationCompleted: boolean;
  computationCompletedBy?: string;
  computationCompletedAt?: string | Date;
  computationProcessor?: {
    id: string;
    email: string;
  };
  // Review Phase
  reviewCompleted: boolean;
  reviewCompletedBy?: string;
  reviewCompletedAt?: string | Date;
  reviewer?: {
    id: string;
    email: string;
  };
  reviewerApproved: boolean;
  reviewerApprovedBy?: string;
  reviewerApprovedAt?: string | Date;
  reviewerApprover?: {
    id: string;
    email: string;
  };
  // Approval Phase
  approverApproved: boolean;
  approverApprovedBy?: string;
  approverApprovedAt?: string | Date;
  approver?: {
    id: string;
    email: string;
  };
  // Generation Phase
  payslipGenerated: boolean;
  payslipGeneratedBy?: string;
  payslipGeneratedAt?: string | Date;
  payslipGenerator?: {
    id: string;
    email: string;
  };
  // Metadata
  notes?: string;
  createdAt: string | Date;
  updatedAt: string | Date;
  workhourComputations?: WorkhourComputation[];
}

export interface WorkhourComputation {
  id: string;
  payrollWorkflowId: string;
  employeeId: string;
  // Regular Hours
  regularHours: number;
  // Overtime Hours
  overtimeRegular: number;
  overtimeRestDay: number;
  overtimeHoliday: number;
  overtimeSpecialHoliday: number;
  overtimeDoubleHoliday: number;
  // Night Differential
  nightDiffRegular: number;
  nightDiffRestDay: number;
  nightDiffHoliday: number;
  nightDiffSpecialHoliday: number;
  nightDiffDoubleHoliday: number;
  // Holiday Work
  holidayWork: number;
  specialHolidayWork: number;
  doubleHolidayWork: number;
  // Rest Day Work
  restDayWork: number;
  holidayRestDayWork: number;
  specialHolidayRestDayWork: number;
  doubleHolidayRestDayWork: number;
  // Totals
  totalHours: number;
  totalRegularPay: number;
  totalOvertimePay: number;
  totalNightDiffPay: number;
  totalHolidayPay: number;
  totalRestDayPay: number;
  totalPay: number;
  // Metadata
  computedAt: string | Date;
  computedBy?: string;
  notes?: string;
  createdAt: string | Date;
  updatedAt: string | Date;
  employee?: {
    id: string;
    firstName: string;
    lastName: string;
    employeeNumber: string;
  };
}

export interface WorkhourData {
  employeeId: string;
  regularHours?: number;
  overtimeRegular?: number;
  overtimeRestDay?: number;
  overtimeHoliday?: number;
  overtimeSpecialHoliday?: number;
  overtimeDoubleHoliday?: number;
  nightDiffRegular?: number;
  nightDiffRestDay?: number;
  nightDiffHoliday?: number;
  nightDiffSpecialHoliday?: number;
  nightDiffDoubleHoliday?: number;
  holidayWork?: number;
  specialHolidayWork?: number;
  doubleHolidayWork?: number;
  restDayWork?: number;
  holidayRestDayWork?: number;
  specialHolidayRestDayWork?: number;
  doubleHolidayRestDayWork?: number;
  totalHours?: number;
  totalRegularPay?: number;
  totalOvertimePay?: number;
  totalNightDiffPay?: number;
  totalHolidayPay?: number;
  totalRestDayPay?: number;
  totalPay?: number;
}

export interface WorkflowAction {
  payrollRunId: string;
  reason?: string;
  changes?: string;
  reviewerId?: string;
  approverId?: string;
}

@Injectable({
  providedIn: 'root'
})
export class PayrollService {
  private apiUrl = `${environment.apiUrl}/payroll`;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  private getHeaders(): HttpHeaders {
    const token = this.authService.token;
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  // ==================== PAYROLL RUNS ====================

  getPayrollRuns(filters: PayrollFilters = {}): Observable<{ success: boolean; data: PayrollRun[]; pagination: any }> {
    let params = new HttpParams();
    Object.keys(filters).forEach(key => {
      const value = filters[key as keyof PayrollFilters];
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, value.toString());
      }
    });

    return this.http.get<{ success: boolean; data: PayrollRun[]; pagination: any }>(
      `${this.apiUrl}/runs`,
      { params, headers: this.getHeaders() }
    );
  }

  getPayrollRunById(id: string): Observable<{ success: boolean; data: PayrollRun }> {
    return this.http.get<{ success: boolean; data: PayrollRun }>(
      `${this.apiUrl}/runs/${id}`,
      { headers: this.getHeaders() }
    );
  }

  getPayrollRunDetails(id: string): Observable<{ success: boolean; data: PayrollRun }> {
    return this.http.get<{ success: boolean; data: PayrollRun }>(
      `${this.apiUrl}/runs/${id}`,
      { headers: this.getHeaders() }
    );
  }

  createPayrollRun(payrollData: Partial<PayrollRun>): Observable<{ success: boolean; data: PayrollRun; message: string }> {
    return this.http.post<{ success: boolean; data: PayrollRun; message: string }>(
      `${this.apiUrl}/runs`,
      payrollData,
      { headers: this.getHeaders() }
    );
  }

  processPayrollRun(id: string): Observable<{ success: boolean; data: PayrollRun; message: string }> {
    return this.http.put<{ success: boolean; data: PayrollRun; message: string }>(
      `${this.apiUrl}/runs/${id}/process`,
      {},
      { headers: this.getHeaders() }
    );
  }

  approvePayrollRun(id: string, approval: PayrollApproval): Observable<{ success: boolean; data: PayrollRun; message: string }> {
    return this.http.put<{ success: boolean; data: PayrollRun; message: string }>(
      `${this.apiUrl}/runs/${id}/approve`,
      approval,
      { headers: this.getHeaders() }
    );
  }

  releasePayrollRun(id: string): Observable<{ success: boolean; data: PayrollRun; message: string }> {
    return this.http.put<{ success: boolean; data: PayrollRun; message: string }>(
      `${this.apiUrl}/runs/${id}/release`,
      {},
      { headers: this.getHeaders() }
    );
  }

  // ==================== PAYSLIPS ====================

  getPayslips(filters: PayrollFilters = {}): Observable<{ success: boolean; data: Payslip[]; pagination: any }> {
    let params = new HttpParams();
    Object.keys(filters).forEach(key => {
      const value = filters[key as keyof PayrollFilters];
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, value.toString());
      }
    });

    return this.http.get<{ success: boolean; data: Payslip[]; pagination: any }>(
      `${this.apiUrl}/payslips`,
      { params, headers: this.getHeaders() }
    );
  }

  getPayslipById(id: string): Observable<{ success: boolean; data: Payslip }> {
    return this.http.get<{ success: boolean; data: Payslip }>(
      `${this.apiUrl}/payslips/${id}`,
      { headers: this.getHeaders() }
    );
  }

  generatePayslip(payrollRunId: string): Observable<{ success: boolean; data: Payslip[]; message: string }> {
    return this.http.post<{ success: boolean; data: Payslip[]; message: string }>(
      `${this.apiUrl}/payslips/generate`,
      { payrollRunId },
      { headers: this.getHeaders() }
    );
  }

  releasePayslip(id: string): Observable<{ success: boolean; data: Payslip; message: string }> {
    return this.http.put<{ success: boolean; data: Payslip; message: string }>(
      `${this.apiUrl}/payslips/${id}/release`,
      {},
      { headers: this.getHeaders() }
    );
  }

  generatePayslipPDF(id: string): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/payslips/${id}/pdf`, {
      responseType: 'blob',
      headers: this.getHeaders()
    });
  }

  // ==================== PAYROLL REVIEW & APPROVAL ====================

  getPayrollReview(payrollRunId: string): Observable<{ success: boolean; data: PayrollReview }> {
    return this.http.get<{ success: boolean; data: PayrollReview }>(
      `${this.apiUrl}/runs/${payrollRunId}/review`,
      { headers: this.getHeaders() }
    );
  }

  generatePayrollRegister(payrollRunId: string): Observable<{ success: boolean; data: PayrollRegister }> {
    return this.http.post<{ success: boolean; data: PayrollRegister }>(
      `${this.apiUrl}/runs/${payrollRunId}/register`,
      {},
      { headers: this.getHeaders() }
    );
  }

  downloadPayrollRegister(payrollRunId: string): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/runs/${payrollRunId}/register/download`, {
      responseType: 'blob',
      headers: this.getHeaders()
    });
  }

  // ==================== PAYROLL SUMMARY & EMPLOYEE DATA ====================

  getPayrollSummaryForRun(payrollRunId: string): Observable<{ success: boolean; data: PayrollSummary }> {
    return this.http.get<{ success: boolean; data: PayrollSummary }>(
      `${this.apiUrl}/runs/${payrollRunId}/summary`,
      { headers: this.getHeaders() }
    );
  }

  getEmployeePayrollDetails(payrollRunId: string): Observable<{ success: boolean; data: PayslipReviewItem[] }> {
    return this.http.get<{ success: boolean; data: PayslipReviewItem[] }>(
      `${this.apiUrl}/runs/${payrollRunId}/employee-details`,
      { headers: this.getHeaders() }
    );
  }

  getPayslipsForPayrollRun(payrollRunId: string): Observable<{ success: boolean; data: Payslip[] }> {
    return this.http.get<{ success: boolean; data: Payslip[] }>(
      `${this.apiUrl}/runs/${payrollRunId}/payslips`,
      { headers: this.getHeaders() }
    );
  }

  getEmployeesForPayrollRun(): Observable<{ success: boolean; data: any[] }> {
    return this.http.get<{ success: boolean; data: any[] }>(
      `${this.apiUrl}/employees/active`,
      { headers: this.getHeaders() }
    );
  }

  getEmployeePayslipData(employeeId: string, payrollRunId?: string): Observable<{ success: boolean; data: any }> {
    let params = new HttpParams();
    if (payrollRunId) {
      params = params.set('payrollRunId', payrollRunId);
    }
    
    return this.http.get<{ success: boolean; data: any }>(
      `${this.apiUrl}/employees/${employeeId}/payslip-data`,
      { params, headers: this.getHeaders() }
    );
  }

  calculateEmployeePayroll(employeeId: string, periodStart: string, periodEnd: string): Observable<{ success: boolean; data: any }> {
    return this.http.post<{ success: boolean; data: any }>(
      `${this.apiUrl}/employees/${employeeId}/calculate-payroll`,
      { periodStart, periodEnd },
      { headers: this.getHeaders() }
    );
  }

  generatePayslipsForPayrollRun(payrollRunId: string, employeeIds: string[]): Observable<{ success: boolean; data: Payslip[] }> {
    return this.http.post<{ success: boolean; data: Payslip[] }>(
      `${this.apiUrl}/runs/${payrollRunId}/generate-payslips`,
      { employeeIds },
      { headers: this.getHeaders() }
    );
  }

  // ==================== REPORTS ====================

  getPayrollSummary(filters: PayrollFilters = {}): Observable<{ success: boolean; data: PayrollSummary }> {
    let params = new HttpParams();
    Object.keys(filters).forEach(key => {
      const value = filters[key as keyof PayrollFilters];
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, value.toString());
      }
    });

    return this.http.get<{ success: boolean; data: PayrollSummary }>(
      `${this.apiUrl}/reports/summary`,
      { params, headers: this.getHeaders() }
    );
  }

  getContributionBreakdown(filters: PayrollFilters = {}): Observable<{ success: boolean; data: any }> {
    let params = new HttpParams();
    Object.keys(filters).forEach(key => {
      const value = filters[key as keyof PayrollFilters];
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, value.toString());
      }
    });

    return this.http.get<{ success: boolean; data: any }>(
      `${this.apiUrl}/reports/contributions`,
      { params, headers: this.getHeaders() }
    );
  }

  // ==================== UTILITY METHODS ====================

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  }

  formatDate(date: string | Date): string {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  formatDateTime(date: string | Date): string {
    const d = new Date(date);
    return d.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getStatusColor(status: string): string {
    const colors: { [key: string]: string } = {
      draft: 'bg-gray-100 text-gray-800',
      pending: 'bg-yellow-100 text-yellow-800',
      processed: 'bg-blue-100 text-blue-800',
      approved: 'bg-green-100 text-green-800',
      released: 'bg-purple-100 text-purple-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  }

  getStatusIcon(status: string): string {
    const icons: { [key: string]: string } = {
      draft: 'edit',
      pending: 'schedule',
      processed: 'check_circle',
      approved: 'verified',
      released: 'send',
      cancelled: 'cancel'
    };
    return icons[status] || 'help';
  }

  downloadFile(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    window.URL.revokeObjectURL(url);
  }

  // ==================== PAYROLL WORKFLOW ====================

  // Step 1: Approve Timekeeping
  approveTimekeeping(payrollRunId: string): Observable<{ success: boolean; data: { workflow: PayrollWorkflow }; message: string }> {
    return this.http.put<{ success: boolean; data: { workflow: PayrollWorkflow }; message: string }>(
      `${this.apiUrl}/workflow/${payrollRunId}/approve-timekeeping`,
      {},
      { headers: this.getHeaders() }
    );
  }

  // Step 2: Complete Workhour Computation
  completeWorkhourComputation(payrollRunId: string, workhourData: WorkhourData[]): Observable<{ success: boolean; data: { workflow: PayrollWorkflow }; message: string }> {
    return this.http.put<{ success: boolean; data: { workflow: PayrollWorkflow }; message: string }>(
      `${this.apiUrl}/workflow/${payrollRunId}/complete-computation`,
      { workhourData },
      { headers: this.getHeaders() }
    );
  }

  // Step 3: Complete Payroll Review
  completePayrollReview(payrollRunId: string, notes?: string): Observable<{ success: boolean; data: { workflow: PayrollWorkflow }; message: string }> {
    return this.http.put<{ success: boolean; data: { workflow: PayrollWorkflow }; message: string }>(
      `${this.apiUrl}/workflow/${payrollRunId}/complete-review`,
      { notes },
      { headers: this.getHeaders() }
    );
  }

  // Step 4: Approve by Reviewer
  approveByReviewer(payrollRunId: string): Observable<{ success: boolean; data: { workflow: PayrollWorkflow }; message: string }> {
    return this.http.put<{ success: boolean; data: { workflow: PayrollWorkflow }; message: string }>(
      `${this.apiUrl}/workflow/${payrollRunId}/approve-reviewer`,
      {},
      { headers: this.getHeaders() }
    );
  }

  // Step 5: Approve by Approver
  approveByApprover(payrollRunId: string): Observable<{ success: boolean; data: { workflow: PayrollWorkflow }; message: string }> {
    return this.http.put<{ success: boolean; data: { workflow: PayrollWorkflow }; message: string }>(
      `${this.apiUrl}/workflow/${payrollRunId}/approve-approver`,
      {},
      { headers: this.getHeaders() }
    );
  }

  // Step 6: Generate Payslips
  generatePayslips(payrollRunId: string): Observable<{ success: boolean; data: { workflow: PayrollWorkflow }; message: string }> {
    return this.http.put<{ success: boolean; data: { workflow: PayrollWorkflow }; message: string }>(
      `${this.apiUrl}/workflow/${payrollRunId}/generate-payslips`,
      {},
      { headers: this.getHeaders() }
    );
  }

  // Get Payroll Workflow Status
  getPayrollWorkflowStatus(payrollRunId: string): Observable<{ success: boolean; data: { payrollRun: PayrollRun; workflow: PayrollWorkflow } }> {
    return this.http.get<{ success: boolean; data: { payrollRun: PayrollRun; workflow: PayrollWorkflow } }>(
      `${this.apiUrl}/workflow/${payrollRunId}/status`,
      { headers: this.getHeaders() }
    );
  }

  // ==================== REJECTION HANDLING ====================

  // Reject by Reviewer
  rejectByReviewer(payrollRunId: string, reason?: string): Observable<{ success: boolean; data: { workflow: PayrollWorkflow }; message: string }> {
    return this.http.put<{ success: boolean; data: { workflow: PayrollWorkflow }; message: string }>(
      `${this.apiUrl}/workflow/${payrollRunId}/reject-reviewer`,
      { reason },
      { headers: this.getHeaders() }
    );
  }

  // Reject by Approver
  rejectByApprover(payrollRunId: string, reason?: string): Observable<{ success: boolean; data: { workflow: PayrollWorkflow }; message: string }> {
    return this.http.put<{ success: boolean; data: { workflow: PayrollWorkflow }; message: string }>(
      `${this.apiUrl}/workflow/${payrollRunId}/reject-approver`,
      { reason },
      { headers: this.getHeaders() }
    );
  }

  // ==================== CHANGE HANDLING ====================

  // Handle Changes (loops back to beginning)
  handleChanges(payrollRunId: string, reason?: string, changes?: string): Observable<{ success: boolean; data: { workflow: PayrollWorkflow }; message: string }> {
    return this.http.put<{ success: boolean; data: { workflow: PayrollWorkflow }; message: string }>(
      `${this.apiUrl}/workflow/${payrollRunId}/handle-changes`,
      { reason, changes },
      { headers: this.getHeaders() }
    );
  }

  // ==================== NOTIFICATION SYSTEM ====================

  // Notify Payroll Reviewer
  notifyPayrollReviewer(payrollRunId: string, reviewerId: string): Observable<{ success: boolean; data: any; message: string }> {
    return this.http.put<{ success: boolean; data: any; message: string }>(
      `${this.apiUrl}/workflow/${payrollRunId}/notify-reviewer`,
      { reviewerId },
      { headers: this.getHeaders() }
    );
  }

  // Notify Payroll Approver
  notifyPayrollApprover(payrollRunId: string, approverId: string): Observable<{ success: boolean; data: any; message: string }> {
    return this.http.put<{ success: boolean; data: any; message: string }>(
      `${this.apiUrl}/workflow/${payrollRunId}/notify-approver`,
      { approverId },
      { headers: this.getHeaders() }
    );
  }

  // ==================== WORKFLOW UTILITY METHODS ====================

  getWorkflowStatusColor(status: string): string {
    const colors: { [key: string]: string } = {
      draft: 'bg-gray-100 text-gray-800',
      timekeepingPending: 'bg-yellow-100 text-yellow-800',
      timekeepingApproved: 'bg-blue-100 text-blue-800',
      computationPending: 'bg-indigo-100 text-indigo-800',
      computationCompleted: 'bg-purple-100 text-purple-800',
      reviewPending: 'bg-orange-100 text-orange-800',
      reviewCompleted: 'bg-cyan-100 text-cyan-800',
      reviewerApproved: 'bg-green-100 text-green-800',
      approverPending: 'bg-teal-100 text-teal-800',
      approverApproved: 'bg-emerald-100 text-emerald-800',
      payslipGenerated: 'bg-violet-100 text-violet-800',
      released: 'bg-pink-100 text-pink-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  }

  getWorkflowStatusIcon(status: string): string {
    const icons: { [key: string]: string } = {
      draft: 'edit',
      timekeepingPending: 'schedule',
      timekeepingApproved: 'check_circle',
      computationPending: 'hourglass_empty',
      computationCompleted: 'calculate',
      reviewPending: 'rate_review',
      reviewCompleted: 'assignment_turned_in',
      reviewerApproved: 'verified',
      approverPending: 'pending_actions',
      approverApproved: 'verified_user',
      payslipGenerated: 'description',
      released: 'send',
      cancelled: 'cancel'
    };
    return icons[status] || 'help';
  }

  getWorkflowStepName(status: string): string {
    const steps: { [key: string]: string } = {
      draft: 'Draft',
      timekeepingPending: 'Timekeeping Approval',
      timekeepingApproved: 'Timekeeping Approved',
      computationPending: 'Computation Pending',
      computationCompleted: 'Computation Completed',
      reviewPending: 'Review Pending',
      reviewCompleted: 'Review Completed',
      reviewerApproved: 'Reviewer Approved',
      approverPending: 'Approver Pending',
      approverApproved: 'Approver Approved',
      payslipGenerated: 'Payslips Generated',
      released: 'Released',
      cancelled: 'Cancelled'
    };
    return steps[status] || 'Unknown';
  }

  canPerformAction(currentStatus: string, action: string): boolean {
    const permissions: { [key: string]: string[] } = {
      approveTimekeeping: ['timekeepingPending'],
      completeComputation: ['timekeepingApproved'],
      completeReview: ['computationCompleted'],
      approveReviewer: ['reviewCompleted'],
      approveApprover: ['reviewerApproved'],
      generatePayslips: ['approverApproved'],
      rejectReviewer: ['reviewCompleted', 'reviewerApproved'],
      rejectApprover: ['reviewerApproved', 'approverPending'],
      handleChanges: ['reviewCompleted', 'reviewerApproved', 'approverPending'],
      notifyReviewer: ['computationCompleted'],
      notifyApprover: ['reviewerApproved']
    };
    return permissions[action]?.includes(currentStatus) || false;
  }
}
