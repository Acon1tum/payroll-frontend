import { Injectable } from '@angular/core';

// Shared lightweight types aligned with admin components' interfaces

// Dashboard
export interface DashboardMetrics {
  totalEmployees: number;
  activeEmployees: number;
  onLeaveEmployees: number;
  totalDepartments: number;
  currentPayrollCutoff: string;
  nextPayrollDate: string;
  totalLeaveRequests: number;
  pendingApprovals: number;
  totalPayrollAmount: number;
  averageSalary: number;
}

// Access Logs
export interface AccessLog {
  id: string;
  user: string;
  action: 'login' | 'logout' | 'data-access';
  ip: string;
  recordType?: string;
  recordId?: string;
  timestamp: Date;
  status?: 'success' | 'failed';
}

// Activity Logs
export interface ActivityLog {
  id: string;
  user: string;
  module: string;
  action: string;
  details: string;
  date: Date;
}

// Payroll Summary
export interface PayrollSummaryRow {
  employeeId: string;
  employeeName: string;
  period: string;
  grossPay: number;
  totalDeductions: number;
  netPay: number;
  ytdGross: number;
  ytdDeductions: number;
  ytdNet: number;
}

// LLC Summary
export interface LlcSummaryRow {
  employeeId: string;
  employeeName: string;
  period: string;
  totalLoans: number;
  totalLeaves: number;
  totalContributions: number;
}

// Leave Reports
export interface LeaveReportRow {
  employeeId: string;
  employeeName: string;
  department: string;
  leaveType: string;
  totalUsed: number;
  remaining: number;
  period: string;
}

// Leave Requests
export interface LeaveRequestRow {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  leaveType: string;
  startDate: Date;
  endDate: Date;
  status: 'pending' | 'approved' | 'rejected';
  reason: string;
  documentUrl?: string;
  appliedAt: Date;
}

// Mandatory Contributions
export interface SSSBracket { rangeFrom: number; rangeTo: number; employeeShare: number; employerShare: number; }
export interface PhilHealthBracket { rangeFrom: number; rangeTo: number; employeeShare: number; employerShare: number; }
export interface PagIBIGBracket { rangeFrom: number; rangeTo: number; employeeShare: number; employerShare: number; }
export interface BIRBracket { rangeFrom: number; rangeTo: number; taxRate: number; baseTax: number; }
export interface ContributionHistoryRow { employeeId: string; employeeName: string; month: string; sss: number; philhealth: number; pagibig: number; bir: number; }

// Loans
export interface LoanRow {
  id: string;
  employeeId: string;
  loanType: string;
  principal: number;
  interestRate: number;
  termMonths: number;
  startDate: Date;
  paymentSchedule: 'monthly' | 'semi-monthly';
  autoDeduct: boolean;
  remarks?: string;
}
export interface LoanRepaymentRow { loanId: string; cutoff: string; amountPaid: number; balance: number; }

// Deductions
export interface DeductionRow { id: string; name: string; type: 'recurring' | 'one-time'; amount: number; description?: string; }
export interface EmployeeDeductionAssignmentRow { employeeId: string; deductionId: string; schedule: string; startDate?: Date; endDate?: Date; }

// Bank file
export interface BankDisbursementRow { employeeId: string; employeeName: string; accountNumber: string; amount: number; bank: 'BDO' | 'Metrobank' | 'Landbank'; }

// Payslip Center
export interface PayslipRow {
  id: number;
  employeeId: string;
  employeeName: string;
  department: string;
  position: string;
  payrollPeriod: { start: Date; end: Date; };
  basicSalary: number;
  grossPay: number;
  netPay: number;
  deductions: { tax: number; insurance: number; retirement: number; other: number; };
  allowances: { transportation: number; meal: number; housing: number; other: number; };
  overtime: { hours: number; rate: number; amount: number; };
  leaveBalance: { sick: number; vacation: number; personal: number; };
  status: 'generated' | 'sent' | 'downloaded' | 'failed';
  generatedAt: Date;
  sentAt?: Date;
  downloadedAt?: Date;
  emailSent: boolean;
  emailSentAt?: Date;
  doleCompliant: boolean;
}

// Run Payroll
export interface PayrollEmployeeRow {
  id: number;
  employeeId: string;
  name: string;
  department: string;
  position: string;
  baseSalary: number;
  hoursWorked: number;
  overtimeHours: number;
  grossPay: number;
  deductions: { tax: number; insurance: number; retirement: number; other: number; };
  netPay: number;
  status: 'included' | 'excluded' | 'pending';
}

export interface PayrollRunRow {
  id: number;
  cutoffStart: Date;
  cutoffEnd: Date;
  totalEmployees: number;
  grossPay: number;
  netPay: number;
  totalDeductions: number;
  totalOvertime: number;
  status: 'draft' | 'pending' | 'approved' | 'released' | 'cancelled';
  createdAt: Date;
  approvedBy?: string;
  approvedAt?: Date;
  releasedAt?: Date;
  notes?: string;
}

// 13th Month
export interface EmployeeLite { id: string; employeeId: string; name: string; department: string; position: string; basicSalary: number; hireDate: Date; employmentStatus: 'active' | 'terminated' | 'resigned'; terminationDate?: Date; }
export interface ThirteenMonthPayRow { id: string; employeeId: string; employeeName: string; department: string; year: number; basicSalary: number; monthsWorked: number; totalEarnings: number; thirteenthMonthPay: number; status: 'pending' | 'computed' | 'approved' | 'released' | 'cancelled'; computedAt?: Date; approvedAt?: Date; releasedAt?: Date; approvedBy?: string; releasedBy?: string; remarks?: string; }

// Final Pay
export interface FinalPayEmployeeLite { id: string; employeeId: string; name: string; department: string; position: string; basicSalary: number; hireDate: Date; employmentStatus: 'active' | 'resigned' | 'terminated'; resignationDate?: Date; terminationDate?: Date; lastWorkingDay?: Date; unusedLeaves: number; leaveBalance: { vacation: number; sick: number; personal: number; }; }
export interface FinalPayRow { id: string; employeeId: string; employeeName: string; department: string; employmentStatus: 'resigned' | 'terminated'; lastWorkingDay: Date; computationDate: Date; basicSalary: number; daysWorked: number; proratedSalary: number; unusedVacationLeaves: number; unusedSickLeaves: number; unusedPersonalLeaves: number; leaveMonetization: number; thirteenthMonthPay: number; separationPay: number; otherBenefits: number; loans: number; advances: number; taxes: number; otherDeductions: number; grossPay: number; totalDeductions: number; netPay: number; status: 'pending' | 'computed' | 'approved' | 'released' | 'cancelled'; computedAt?: Date; approvedAt?: Date; releasedAt?: Date; approvedBy?: string; releasedBy?: string; paymentMethod?: string; remarks?: string; }

@Injectable({ providedIn: 'root' })
export class DummyDataService {
  // Dashboard
  getDashboardMetrics(): DashboardMetrics {
    return {
      totalEmployees: 156,
      activeEmployees: 142,
      onLeaveEmployees: 8,
      totalDepartments: 12,
      currentPayrollCutoff: '2024-01-15',
      nextPayrollDate: '2024-01-31',
      totalLeaveRequests: 23,
      pendingApprovals: 7,
      totalPayrollAmount: 2450000,
      averageSalary: 15705
    };
  }

  // Audit trail
  getAccessLogs(): AccessLog[] {
    return [
      { id: '1', user: 'admin@company.com', action: 'login', ip: '192.168.1.10', timestamp: new Date(), status: 'success' },
      { id: '2', user: 'hr@company.com', action: 'data-access', ip: '192.168.1.11', recordType: 'Employee', recordId: 'EMP001', timestamp: new Date(), status: 'success' }
    ];
  }
  getActivityLogs(): ActivityLog[] {
    return [
      { id: '1', user: 'Admin', module: 'Payroll', action: 'Processed payroll', details: 'January cutoff processed', date: new Date() },
      { id: '2', user: 'HR', module: 'Employee', action: 'Added employee', details: 'EMP006 added', date: new Date() }
    ];
  }

  // Reports
  getPayrollSummary(): PayrollSummaryRow[] {
    return [
      { employeeId: 'EMP001', employeeName: 'John Smith', period: '2024-01', grossPay: 4800, totalDeductions: 1680, netPay: 3120, ytdGross: 4800, ytdDeductions: 1680, ytdNet: 3120 },
      { employeeId: 'EMP002', employeeName: 'Sarah Johnson', period: '2024-01', grossPay: 4200, totalDeductions: 1470, netPay: 2730, ytdGross: 4200, ytdDeductions: 1470, ytdNet: 2730 }
    ];
  }
  getLlcSummary(): LlcSummaryRow[] {
    return [
      { employeeId: 'EMP001', employeeName: 'John Smith', period: '2024-01', totalLoans: 2000, totalLeaves: 2, totalContributions: 1500 },
      { employeeId: 'EMP002', employeeName: 'Sarah Johnson', period: '2024-01', totalLoans: 1000, totalLeaves: 1, totalContributions: 1200 }
    ];
  }
  getLeaveReports(): LeaveReportRow[] {
    return [
      { employeeId: 'EMP001', employeeName: 'John Smith', department: 'Engineering', leaveType: 'Vacation', totalUsed: 3, remaining: 12, period: '2024' },
      { employeeId: 'EMP002', employeeName: 'Sarah Johnson', department: 'Marketing', leaveType: 'Sick', totalUsed: 2, remaining: 10, period: '2024' }
    ];
  }
  getLeaveRequests(): LeaveRequestRow[] {
    return [
      { id: 'LR1', employeeId: 'EMP001', employeeName: 'John Smith', department: 'Engineering', leaveType: 'Vacation', startDate: new Date(), endDate: new Date(), status: 'pending', reason: 'Family trip', appliedAt: new Date() },
      { id: 'LR2', employeeId: 'EMP002', employeeName: 'Sarah Johnson', department: 'Marketing', leaveType: 'Sick', startDate: new Date(), endDate: new Date(), status: 'approved', reason: 'Flu', documentUrl: 'https://example.com/doc.pdf', appliedAt: new Date() }
    ];
  }

  // Mandatory contributions
  getSSSBrackets(): SSSBracket[] { return [{ rangeFrom: 0, rangeTo: 10000, employeeShare: 225, employerShare: 475 }]; }
  getPhilHealthBrackets(): PhilHealthBracket[] { return [{ rangeFrom: 0, rangeTo: 10000, employeeShare: 200, employerShare: 200 }]; }
  getPagibigBrackets(): PagIBIGBracket[] { return [{ rangeFrom: 0, rangeTo: 10000, employeeShare: 100, employerShare: 100 }]; }
  getBIRBrackets(): BIRBracket[] { return [{ rangeFrom: 0, rangeTo: 250000, taxRate: 0, baseTax: 0 }]; }
  getContributionHistory(): ContributionHistoryRow[] { return [{ employeeId: 'EMP001', employeeName: 'John Smith', month: '2024-01', sss: 500, philhealth: 400, pagibig: 200, bir: 600 }]; }

  // Loans & deductions
  getLoans(): LoanRow[] {
    return [
      { id: 'LN1', employeeId: 'EMP001', loanType: 'multiPurpose', principal: 50000, interestRate: 5, termMonths: 12, startDate: new Date('2024-01-01'), paymentSchedule: 'semi-monthly', autoDeduct: true },
    ];
  }
  getLoanRepayments(): LoanRepaymentRow[] { return [{ loanId: 'LN1', cutoff: '2024-01-31', amountPaid: 4167, balance: 45833 }]; }
  getDeductions(): DeductionRow[] { return [{ id: 'D1', name: 'Uniform', type: 'one-time', amount: 1500 }]; }
  getDeductionAssignments(): EmployeeDeductionAssignmentRow[] { return [{ employeeId: 'EMP001', deductionId: 'D1', schedule: 'once', startDate: new Date('2024-02-01') }]; }

  // Bank file
  getBankDisbursements(): BankDisbursementRow[] {
    return [
      { employeeId: 'EMP001', employeeName: 'John Smith', accountNumber: '1234567890', amount: 3120, bank: 'BDO' },
      { employeeId: 'EMP002', employeeName: 'Sarah Johnson', accountNumber: '9876543210', amount: 2730, bank: 'BDO' }
    ];
  }

  // Payslip center
  getPayslips(): PayslipRow[] {
    return [
      {
        id: 1,
        employeeId: 'EMP001',
        employeeName: 'John Smith',
        department: 'Engineering',
        position: 'Senior Developer',
        payrollPeriod: { start: new Date(2024, 0, 1), end: new Date(2024, 0, 31) },
        basicSalary: 75000,
        grossPay: 4800,
        netPay: 3120,
        deductions: { tax: 960, insurance: 240, retirement: 360, other: 120 },
        allowances: { transportation: 500, meal: 300, housing: 0, other: 100 },
        overtime: { hours: 8, rate: 35.16, amount: 281.28 },
        leaveBalance: { sick: 12, vacation: 15, personal: 3 },
        status: 'generated',
        generatedAt: new Date(2024, 0, 31),
        emailSent: false,
        doleCompliant: true
      }
    ];
  }

  // Run payroll
  getAvailablePayrollEmployees(): PayrollEmployeeRow[] {
    return [
      {
        id: 1,
        employeeId: 'EMP001',
        name: 'John Smith',
        department: 'Engineering',
        position: 'Senior Developer',
        baseSalary: 75000,
        hoursWorked: 160,
        overtimeHours: 8,
        grossPay: 4800,
        deductions: { tax: 960, insurance: 240, retirement: 360, other: 120 },
        netPay: 3120,
        status: 'included'
      }
    ];
  }
  getPayrollHistory(): PayrollRunRow[] {
    return [
      { id: 1, cutoffStart: new Date(2024, 0, 1), cutoffEnd: new Date(2024, 0, 31), totalEmployees: 142, grossPay: 2450000, netPay: 1980000, totalDeductions: 470000, totalOvertime: 85000, status: 'released', createdAt: new Date(2024, 0, 31), approvedBy: 'Admin User', approvedAt: new Date(2024, 0, 31), releasedAt: new Date(2024, 0, 31), notes: 'January 2024 payroll processed successfully' }
    ];
  }

  // 13th month
  getEmployeesLite(): EmployeeLite[] {
    return [
      { id: '1', employeeId: 'EMP001', name: 'Juan Dela Cruz', department: 'Engineering', position: 'Software Engineer', basicSalary: 45000, hireDate: new Date('2022-03-15'), employmentStatus: 'active' }
    ];
  }
  getThirteenMonthPays(): ThirteenMonthPayRow[] {
    return [
      { id: '1', employeeId: 'EMP001', employeeName: 'Juan Dela Cruz', department: 'Engineering', year: 2024, basicSalary: 45000, monthsWorked: 12, totalEarnings: 540000, thirteenthMonthPay: 45000, status: 'computed', computedAt: new Date('2024-12-01'), remarks: 'Full year computation' }
    ];
  }

  // Final pay
  getFinalPayEmployees(): FinalPayEmployeeLite[] {
    return [
      { id: '1', employeeId: 'EMP001', name: 'Juan Dela Cruz', department: 'Engineering', position: 'Software Engineer', basicSalary: 45000, hireDate: new Date('2022-03-15'), employmentStatus: 'resigned', resignationDate: new Date('2024-11-15'), lastWorkingDay: new Date('2024-12-15'), unusedLeaves: 15, leaveBalance: { vacation: 8, sick: 5, personal: 2 } }
    ];
  }
  getFinalPays(): FinalPayRow[] {
    return [
      { id: '1', employeeId: 'EMP001', employeeName: 'Juan Dela Cruz', department: 'Engineering', employmentStatus: 'resigned', lastWorkingDay: new Date('2024-12-15'), computationDate: new Date('2024-12-16'), basicSalary: 45000, daysWorked: 15, proratedSalary: 22500, unusedVacationLeaves: 8, unusedSickLeaves: 5, unusedPersonalLeaves: 2, leaveMonetization: 16875, thirteenthMonthPay: 18750, separationPay: 0, otherBenefits: 0, loans: 5000, advances: 2000, taxes: 3750, otherDeductions: 0, grossPay: 58125, totalDeductions: 10750, netPay: 47375, status: 'computed', computedAt: new Date('2024-12-16'), remarks: 'Resigned - 30 days notice served' }
    ];
  }
}


