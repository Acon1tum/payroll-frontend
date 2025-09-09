import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { HeaderComponent } from '../../../../shared/header/header.component';
import { SidebarComponent } from '../../../../shared/sidebar/sidebar.component';
import { PayrollService, PayrollRun, PayrollReview, PayrollRegister, PayslipReviewItem, PayrollApproval, PayrollSummary } from '../../../../services/payroll.service';
import { EmployeeService, EmployeeDto } from '../../../../services/employee.service';
import { AttendanceService, EmployeeAttendanceSummary } from '../../../../services/attendance.service';

interface Breadcrumb {
  label: string;
  path?: string;
  active?: boolean;
}

// Using PayrollRun from service instead of local interface
// But we need to maintain compatibility with existing sample data
interface LocalPayrollRun {
  id: number; // local numeric display/id if available
  sourceId: string; // backend canonical id (string/uuid)
  cutoffStart: Date;
  cutoffEnd: Date;
  periodStart: Date;
  periodEnd: Date;
  payDate: Date;
  totalEmployees: number;
  grossPay: number;
  netPay: number;
  totalDeductions: number;
  totalOvertime: number;
  status: 'draft' | 'pending' | 'processed' | 'approved' | 'released' | 'cancelled';
  createdAt: Date;
  approvedBy?: string;
  approvedAt?: Date;
  releasedAt?: Date;
  notes?: string;
  employeeNames?: string[]; // Array of employee names for display
}

interface PayrollEmployee {
  id: string;
  employeeId: string;
  name: string;
  department: string;
  position: string;
  baseSalary: number;
  hoursWorked: number;
  overtimeHours: number;
  grossPay: number;
  deductions: {
    tax: number;
    insurance: number;
    retirement: number;
    other: number;
  };
  netPay: number;
  status: 'included' | 'excluded' | 'pending';
  attendanceData?: EmployeeAttendanceSummary;
}

// Using PayrollSummary from service

@Component({
  selector: 'app-run-payroll',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, HeaderComponent, SidebarComponent],
  templateUrl: './run-payroll.component.html',
  styleUrl: './run-payroll.component.scss'
})
export class RunPayrollComponent implements OnInit, OnDestroy {
  activeTab: 'new-run' | 'history' | 'preview' = 'new-run';
  
  // Breadcrumbs for header
  breadcrumbs: Breadcrumb[] = [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Payroll Management', path: '/admin/payroll-management' },
    { label: 'Run Payroll', active: true }
  ];
  
  // New Payroll Run
  payrollForm: FormGroup;
  selectedEmployees: PayrollEmployee[] = [];
  payrollSummary: PayrollSummary = {
    totalPayrollRuns: 0,
    totalEmployees: 0,
    totalGrossPay: 0,
    totalNetPay: 0,
    totalDeductions: 0,
    totalSSS: 0,
    totalPhilHealth: 0,
    totalPagIBIG: 0,
    totalBIR: 0,
    totalOvertime: 0,
    averageSalary: 0,
    pendingApprovals: 0,
    recentRuns: []
  };

  // Payroll History
  payrollHistory: LocalPayrollRun[] = [];
  filteredHistory: LocalPayrollRun[] = [];
  historyFilter = 'all';

  // Review & Approval
  currentPayrollRun?: LocalPayrollRun;
  payrollReview: PayrollReview | null = null;
  payrollRegister: PayrollRegister | null = null;
  reviewForm: FormGroup;
  approvalForm: FormGroup;
  reviewInProgress = false;
  approvalInProgress = false;
  payrollProcessing = false;
  processingSuccess = false;
  processingMessage: string | null = null;
  // Process confirmation modal state
  showProcessConfirmModal = false;
  // Approve confirmation modal state
  showApproveConfirmModal = false;
  
  // Loading states
  employeesLoading = false;
  payrollRunCreating = false;

  // Employee data will be loaded from database
  availableEmployees: PayrollEmployee[] = [];

  // Modal states
  showPayslipModal = false;
  selectedEmployeeForModal: PayrollEmployee | null = null;
  showPayrollDetailsModal = false;
  selectedPayrollForModal: LocalPayrollRun | null = null;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private payrollService: PayrollService,
    private employeeService: EmployeeService,
    private attendanceService: AttendanceService
  ) {
    this.payrollForm = this.fb.group({
      cutoffStart: ['', Validators.required],
      cutoffEnd: ['', Validators.required],
      includeOvertime: [true],
      includeDeductions: [true],
      notes: ['']
    });

    this.reviewForm = this.fb.group({
      payrollRunId: ['', Validators.required]
    });

    this.approvalForm = this.fb.group({
      status: ['approved', Validators.required],
      notes: ['']
    });
  }

  ngOnInit(): void {
    this.loadPayrollHistory();
    this.loadEmployees();
    this.initializePayrollRun();
    this.setupFormListeners();
  }

  setupFormListeners(): void {
    // Listen to form changes to recalculate payroll
    this.payrollForm.valueChanges.subscribe(() => {
      if (this.payrollForm.valid) {
        this.recalculatePayrollForPeriod();
      }
    });
  }

  recalculatePayrollForPeriod(): void {
    if (!this.payrollForm.valid) return;
    
    const formValue = this.payrollForm.value;
    const periodStart = new Date(formValue.cutoffStart);
    const periodEnd = new Date(formValue.cutoffEnd);
    
    // Recalculate payroll for each selected employee based on the new period
    const includedEmployees = this.selectedEmployees.filter(emp => emp.status === 'included');
    
    if (includedEmployees.length > 0) {
      const calculationRequests = includedEmployees.map(emp => 
        this.payrollService.calculateEmployeePayroll(
          emp.id.toString(), 
          periodStart.toISOString(), 
          periodEnd.toISOString()
        )
      );

      forkJoin(calculationRequests).subscribe({
        next: (responses) => {
          // Update employee data with recalculated values
          this.selectedEmployees = this.selectedEmployees.map((emp, index) => {
            if (emp.status === 'included' && responses[index]?.success) {
              const calculatedData = responses[index].data;
              return {
                ...emp,
                hoursWorked: calculatedData.hoursWorked || emp.hoursWorked,
                overtimeHours: calculatedData.overtimeHours || emp.overtimeHours,
                grossPay: calculatedData.grossPay || emp.grossPay,
                deductions: {
                  tax: calculatedData.deductions?.tax || emp.deductions.tax,
                  insurance: calculatedData.deductions?.sss || emp.deductions.insurance,
                  retirement: calculatedData.deductions?.philHealth || emp.deductions.retirement,
                  other: calculatedData.deductions?.pagIbig || emp.deductions.other
                },
                netPay: calculatedData.netPay || emp.netPay
              };
            }
            return emp;
          });
          
          this.calculatePayrollSummary();
        },
        error: (error) => {
          console.error('Error recalculating payroll:', error);
          // Keep existing calculations if recalculation fails
        }
      });
    }
  }

  ngOnDestroy(): void {
    // Cleanup if needed
  }

  loadEmployees(): void {
    this.employeesLoading = true;
    // Use EmployeeService (same base as Payslip Center) and adapt to the expected shape
    this.employeeService.getEmployees().subscribe({
      next: (response) => {
        if (response.success && response.data && response.data.length > 0) {
          const activeEmployees = response.data.filter((emp: EmployeeDto) => emp.employmentStatus === 'active');

          // Build payslip-like view from Prisma employee data
          this.availableEmployees = activeEmployees.map((emp: EmployeeDto) => {
            const monthlyBase = Number(emp.salary);
            const defaultHours = 160;
            const overtimeHours = 0;
            const grossPay = monthlyBase; // assume salary is monthly
            const sss = monthlyBase * 0.045; // rough placeholder rates
            const philHealth = monthlyBase * 0.03;
            const pagIbig = monthlyBase * 0.02;
            const tax = monthlyBase * 0.1;
            const totalDeductions = sss + philHealth + pagIbig + tax;
            const netPay = grossPay - totalDeductions;

            return {
              id: String(emp.id),
              employeeId: emp.employeeId || (emp as any).employeeNumber || '',
              name: `${emp.firstName} ${emp.lastName}`,
              department: emp.departmentName || 'N/A',
              position: emp.position,
              baseSalary: monthlyBase,
              hoursWorked: defaultHours,
              overtimeHours: overtimeHours,
              grossPay: grossPay,
              deductions: {
                tax: tax,
                insurance: sss,
                retirement: philHealth,
                other: pagIbig
              },
              netPay: netPay,
              status: 'included'
            } as PayrollEmployee;
          });

          this.selectedEmployees = [...this.availableEmployees];
          
          // Load attendance data for all employees
          this.loadAttendanceDataForEmployees();
          
          this.calculatePayrollSummary();
          this.showNotification(`Loaded ${this.availableEmployees.length} employees from database`, 'success');
        } else {
          console.warn('No employees returned from API');
          this.availableEmployees = [];
          this.selectedEmployees = [];
          this.calculatePayrollSummary();
          this.showNotification('No employees found in database', 'warning');
        }
        this.employeesLoading = false;
      },
      error: (error) => {
        console.error('Error loading employees:', error);
        this.showNotification('Error loading employees from database', 'error');
        this.employeesLoading = false;
        this.availableEmployees = [];
        this.selectedEmployees = [];
        this.calculatePayrollSummary();
      }
    });
  }

  loadAttendanceDataForEmployees(): void {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1; // getMonth() returns 0-11
    const currentYear = currentDate.getFullYear();

    // Load attendance data for each employee
    const attendanceRequests = this.selectedEmployees.map(emp => 
      this.attendanceService.getEmployeeAttendanceSummary(emp.id, currentMonth, currentYear)
    );

    forkJoin(attendanceRequests).subscribe({
      next: (attendanceData) => {
        // Update employees with real attendance data
        this.selectedEmployees = this.selectedEmployees.map((emp, index) => {
          const attendance = attendanceData[index];
          if (attendance) {
            return {
              ...emp,
              hoursWorked: attendance.totalRegularHours,
              overtimeHours: attendance.totalOvertimeHours,
              attendanceData: attendance
            };
          }
          return emp;
        });
        
        this.availableEmployees = [...this.selectedEmployees];
        this.calculatePayrollSummary();
        this.showNotification('Attendance data loaded successfully', 'success');
      },
      error: (error) => {
        console.error('Error loading attendance data:', error);
        this.showNotification('Warning: Could not load attendance data, using default values', 'warning');
        // Continue with default values if attendance data fails
      }
    });
  }

  loadEmployeePayslipData(employees: any[]): void {
    if (!employees || employees.length === 0) {
      console.warn('No employees found in database');
      this.availableEmployees = [];
      this.selectedEmployees = [];
      this.calculatePayrollSummary();
      this.showNotification('No employees found in database', 'warning');
      return;
    }

    const employeeRequests = employees.map(emp => 
      this.payrollService.getEmployeePayslipData(emp.id)
    );

    forkJoin(employeeRequests).subscribe({
      next: (responses) => {
        this.availableEmployees = employees.map((emp, index) => {
          const payslipData = responses[index]?.success ? responses[index].data : null;
          
          return {
            id: String(emp.id),
            employeeId: emp.employeeNumber,
            name: `${emp.firstName} ${emp.lastName}`,
            department: emp.department?.name || 'N/A',
            position: emp.position,
            baseSalary: parseFloat(emp.baseSalary.toString()),
            hoursWorked: payslipData?.hoursWorked || 160,
            overtimeHours: payslipData?.overtimeHours || 0,
            grossPay: payslipData?.grossPay || (parseFloat(emp.baseSalary.toString()) / 12),
            deductions: {
              tax: payslipData?.deductions?.tax || (parseFloat(emp.baseSalary.toString()) / 12) * 0.2,
              insurance: payslipData?.deductions?.sss || (parseFloat(emp.baseSalary.toString()) / 12) * 0.05,
              retirement: payslipData?.deductions?.philHealth || (parseFloat(emp.baseSalary.toString()) / 12) * 0.075,
              other: payslipData?.deductions?.pagIbig || 0
            },
            netPay: payslipData?.netPay || (parseFloat(emp.baseSalary.toString()) / 12) - ((parseFloat(emp.baseSalary.toString()) / 12) * 0.325),
            status: 'included'
          };
        });
        
        this.selectedEmployees = [...this.availableEmployees];
        this.calculatePayrollSummary();
        this.showNotification(`Loaded ${this.availableEmployees.length} employees from database`, 'success');
      },
      error: (error) => {
        console.error('Error loading employee payslip data:', error);
        this.showNotification('Error loading employee payslip data', 'error');
        
        // Fallback to basic employee data without payslip details
        this.availableEmployees = employees.map((emp: any) => ({
          id: String(emp.id),
          employeeId: emp.employeeNumber,
          name: `${emp.firstName} ${emp.lastName}`,
          department: emp.department?.name || 'N/A',
          position: emp.position,
          baseSalary: parseFloat(emp.baseSalary.toString()),
          hoursWorked: 160,
          overtimeHours: 0,
          grossPay: parseFloat(emp.baseSalary.toString()) / 12,
          deductions: {
            tax: (parseFloat(emp.baseSalary.toString()) / 12) * 0.2,
            insurance: (parseFloat(emp.baseSalary.toString()) / 12) * 0.05,
            retirement: (parseFloat(emp.baseSalary.toString()) / 12) * 0.075,
            other: 0
          },
          netPay: (parseFloat(emp.baseSalary.toString()) / 12) - ((parseFloat(emp.baseSalary.toString()) / 12) * 0.325),
          status: 'included'
        }));
        this.selectedEmployees = [...this.availableEmployees];
        this.calculatePayrollSummary();
        this.showNotification('Loaded basic employee data (payslip details unavailable)', 'warning');
      }
    });
  }

  initializePayrollRun(): void {
    // Set default dates (current month)
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    this.payrollForm.patchValue({
      cutoffStart: this.formatDateForInput(startOfMonth),
      cutoffEnd: this.formatDateForInput(endOfMonth)
    });

    // Employees will be loaded from database via loadEmployees()
    // No need to set sample data here
  }

  loadPayrollHistory(): void {
    this.payrollService.getPayrollRuns({ limit: 50 }).subscribe({
      next: (response) => {
        if (response.success) {
          // Convert PayrollRun from service to LocalPayrollRun format
          this.payrollHistory = response.data.map((run: any) => ({
            id: Number(run.id) || (Number.isNaN(parseInt(run.id)) ? Date.parse(String(run.createdAt)) : parseInt(run.id)),
            sourceId: run.id,
            cutoffStart: new Date(run.periodStart),
            cutoffEnd: new Date(run.periodEnd),
            periodStart: new Date(run.periodStart),
            periodEnd: new Date(run.periodEnd),
            payDate: new Date(run.payDate),
            totalEmployees: run.totalEmployees || 0,
            grossPay: run.totalGrossPay || 0,
            netPay: run.totalNetPay || 0,
            totalDeductions: run.totalDeductions || 0,
            totalOvertime: 0, // This would need to be calculated from payslip items
            status: run.status as 'draft' | 'pending' | 'processed' | 'approved' | 'released' | 'cancelled',
            createdAt: new Date(run.createdAt),
            approvedBy: run.processedBy ? run.processedBy.email : undefined,
            approvedAt: run.updatedAt ? new Date(run.updatedAt) : undefined,
            releasedAt: run.status === 'released' ? new Date(run.updatedAt) : undefined,
            notes: run.notes,
            employeeNames: run.employeeNames || []
          }));
          this.filteredHistory = [...this.payrollHistory];
        }
      },
      error: (error) => {
        console.error('Error loading payroll history:', error);
        this.showNotification('Error loading payroll history', 'error');
        // Clear history if API fails; no dummy data
        this.payrollHistory = [];
        this.filteredHistory = [];
      }
    });
  }

  loadSamplePayrollHistory(): void {
    // Sample payroll history data as fallback
    this.payrollHistory = [
      {
        id: 1,
        sourceId: '1',
        cutoffStart: new Date(2024, 0, 1),
        cutoffEnd: new Date(2024, 0, 31),
        periodStart: new Date(2024, 0, 1),
        periodEnd: new Date(2024, 0, 31),
        payDate: new Date(2024, 1, 5),
        totalEmployees: 142,
        grossPay: 2450000,
        netPay: 1980000,
        totalDeductions: 470000,
        totalOvertime: 85000,
        status: 'released',
        createdAt: new Date(2024, 0, 31),
        approvedBy: 'Admin User',
        approvedAt: new Date(2024, 0, 31),
        releasedAt: new Date(2024, 0, 31),
        notes: 'January 2024 payroll processed successfully'
      },
      {
        id: 2,
        sourceId: '2',
        cutoffStart: new Date(2023, 11, 1),
        cutoffEnd: new Date(2023, 11, 31),
        periodStart: new Date(2023, 11, 1),
        periodEnd: new Date(2023, 11, 31),
        payDate: new Date(2024, 0, 5),
        totalEmployees: 140,
        grossPay: 2380000,
        netPay: 1920000,
        totalDeductions: 460000,
        totalOvertime: 78000,
        status: 'released',
        createdAt: new Date(2023, 11, 31),
        approvedBy: 'Admin User',
        approvedAt: new Date(2023, 11, 31),
        releasedAt: new Date(2023, 11, 31),
        notes: 'December 2023 payroll processed successfully'
      },
      {
        id: 3,
        sourceId: '3',
        cutoffStart: new Date(2024, 1, 1),
        cutoffEnd: new Date(2024, 1, 29),
        periodStart: new Date(2024, 1, 1),
        periodEnd: new Date(2024, 1, 29),
        payDate: new Date(2024, 2, 5),
        totalEmployees: 145,
        grossPay: 2520000,
        netPay: 2030000,
        totalDeductions: 490000,
        totalOvertime: 92000,
        status: 'processed',
        createdAt: new Date(2024, 1, 29),
        notes: 'February 2024 payroll pending approval'
      }
    ];

    this.filteredHistory = [...this.payrollHistory];
  }

  calculatePayrollSummary(): void {
    const includedEmployees = this.selectedEmployees.filter(emp => emp.status === 'included');
    
    this.payrollSummary = {
      totalPayrollRuns: 0,
      totalEmployees: includedEmployees.length,
      totalGrossPay: includedEmployees.reduce((sum, emp) => sum + emp.grossPay, 0),
      totalNetPay: includedEmployees.reduce((sum, emp) => sum + emp.netPay, 0),
      totalDeductions: includedEmployees.reduce((sum, emp) => 
        sum + emp.deductions.tax + emp.deductions.insurance + emp.deductions.retirement + emp.deductions.other, 0),
      totalSSS: includedEmployees.reduce((sum, emp) => sum + emp.deductions.insurance, 0), // Using insurance as SSS placeholder
      totalPhilHealth: includedEmployees.reduce((sum, emp) => sum + emp.deductions.retirement, 0), // Using retirement as PhilHealth placeholder
      totalPagIBIG: includedEmployees.reduce((sum, emp) => sum + emp.deductions.other, 0),
      totalBIR: includedEmployees.reduce((sum, emp) => sum + emp.deductions.tax, 0),
      totalOvertime: includedEmployees.reduce((sum, emp) => {
        const overtimeHours = emp.attendanceData?.totalOvertimeHours || emp.overtimeHours;
        return sum + (overtimeHours * (emp.baseSalary / 160 / 8) * 1.5);
      }, 0),
      averageSalary: includedEmployees.length > 0 ? includedEmployees.reduce((sum, emp) => sum + emp.baseSalary, 0) / includedEmployees.length : 0,
      pendingApprovals: 0,
      recentRuns: []
    };
  }

  toggleEmployeeStatus(employee: PayrollEmployee): void {
    employee.status = employee.status === 'included' ? 'excluded' : 'included';
    this.calculatePayrollSummary();
  }

  filterHistory(status: string): void {
    this.historyFilter = status;
    if (status === 'all') {
      this.filteredHistory = [...this.payrollHistory];
    } else {
      this.filteredHistory = this.payrollHistory.filter(payroll => payroll.status === status);
    }
  }

  createNewPayrollRun(): void {
    if (this.payrollForm.valid && this.selectedEmployees.length > 0) {
      const formValue = this.payrollForm.value;
      
      this.payrollRunCreating = true;
      this.showNotification('Creating payroll run...', 'info');
      
      const includedEmployees = this.selectedEmployees.filter(emp => emp.status === 'included');
      const payrollData = {
        periodStart: new Date(formValue.cutoffStart),
        periodEnd: new Date(formValue.cutoffEnd),
        payDate: new Date(new Date(formValue.cutoffEnd).getTime() + 5 * 24 * 60 * 60 * 1000),
        frequency: 'monthly' as const,
        status: 'draft' as const,
        notes: formValue.notes,
        employeeIds: includedEmployees.map(emp => String(emp.id))
      };

      this.payrollService.createPayrollRun(payrollData).subscribe({
        next: (response) => {
          if (response.success) {
            const createdRun = response.data;
            
            // Generate payslips for the created payroll run
            this.generatePayslipsForRun(createdRun.id);
            
            // Convert the created PayrollRun to LocalPayrollRun format
      this.currentPayrollRun = {
              id: Number(createdRun.id) || Date.now(),
              sourceId: createdRun.id,
              cutoffStart: new Date(createdRun.periodStart),
              cutoffEnd: new Date(createdRun.periodEnd),
              periodStart: new Date(createdRun.periodStart),
              periodEnd: new Date(createdRun.periodEnd),
              payDate: new Date(createdRun.payDate),
              totalEmployees: this.selectedEmployees.filter(emp => emp.status === 'included').length,
        grossPay: this.payrollSummary.totalGrossPay,
        netPay: this.payrollSummary.totalNetPay,
        totalDeductions: this.payrollSummary.totalDeductions,
              totalOvertime: this.payrollSummary.totalOvertime || 0,
              status: createdRun.status as 'draft' | 'pending' | 'processed' | 'approved' | 'released' | 'cancelled',
              createdAt: new Date(createdRun.createdAt),
              notes: createdRun.notes
            };

            this.showNotification('Payroll run created successfully', 'success');
      this.activeTab = 'preview';
            this.reviewForm.patchValue({ payrollRunId: this.currentPayrollRun.sourceId });
            this.loadPayrollReview(String(this.currentPayrollRun.sourceId));
            this.loadPayrollHistory(); // Refresh the history
          }
          this.payrollRunCreating = false;
        },
        error: (error) => {
          console.error('Error creating payroll run:', error);
          this.showNotification('Error creating payroll run', 'error');
          this.payrollRunCreating = false;
        }
      });
    } else {
      this.showNotification('Please fill in all required fields and select at least one employee', 'warning');
    }
  }

  generatePayslipsForRun(payrollRunId: string): void {
    const includedEmployees = this.selectedEmployees.filter(e => e.status === 'included').map(e => e.id);
    this.payrollService.generatePayslipsForPayrollRun(payrollRunId, includedEmployees).subscribe({
      next: (response) => {
        if (response.success) {
          console.log('Payslips generated successfully:', response.data);
          this.showNotification('Payslips generated successfully', 'success');
        }
      },
      error: (error) => {
        console.error('Error generating payslips:', error);
        this.showNotification('Error generating payslips', 'error');
      }
    });
  }


  cancelPayrollRun(): void {
    if (this.currentPayrollRun) {
      this.currentPayrollRun.status = 'cancelled';
      
      // Update in history
      const index = this.payrollHistory.findIndex(p => p.id === this.currentPayrollRun?.id);
      if (index !== -1) {
        this.payrollHistory[index] = { ...this.currentPayrollRun };
        this.filteredHistory = [...this.payrollHistory];
      }
      
      this.activeTab = 'history';
      this.currentPayrollRun = undefined;
    }
  }

  getStatusColor(status: string): string {
    const colors: { [key: string]: string } = {
      draft: 'bg-gray-100 text-gray-800',
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-blue-100 text-blue-800',
      released: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  }


  formatDate(date: Date | string): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(dateObj);
  }

  formatDateForInput(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  getEmployeeStatusColor(status: string): string {
    const colors: { [key: string]: string } = {
      included: 'bg-green-100 text-green-800',
      excluded: 'bg-red-100 text-red-800',
      pending: 'bg-yellow-100 text-yellow-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  }

  // ==================== REVIEW & APPROVAL METHODS ====================

  onPayrollRunChange(event: any): void {
    const payrollRunId = event.target.value;
    if (payrollRunId) {
      const payrollRun = this.payrollHistory.find(r => r.sourceId === payrollRunId || r.id.toString() === payrollRunId);
      if (payrollRun) {
        this.selectPayrollRunForReview(payrollRun);
      }
    } else {
      this.currentPayrollRun = undefined;
      this.payrollReview = null;
    }
  }

  selectPayrollRunForReview(payrollRun: LocalPayrollRun): void {
    this.currentPayrollRun = payrollRun;
    this.reviewForm.patchValue({ payrollRunId: payrollRun.sourceId });
    this.loadPayrollReview(payrollRun.sourceId);
  }

  loadPayrollReview(payrollRunId: string): void {
    this.reviewInProgress = true;
    
    // Fetch payroll summary and employee details in parallel
    const summaryRequest = this.payrollService.getPayrollSummaryForRun(payrollRunId);
    const employeeDetailsRequest = this.payrollService.getEmployeePayrollDetails(payrollRunId);
    const payslipsRequest = this.payrollService.getPayslipsForPayrollRun(payrollRunId);

    // Combine all requests
    forkJoin({
      summary: summaryRequest,
      employeeDetails: employeeDetailsRequest,
      payslips: payslipsRequest
    }).subscribe({
      next: (responses) => {
        if (responses.summary.success && responses.employeeDetails.success && responses.payslips.success) {
          // Create payroll review from the combined data
          this.payrollReview = {
            payrollRunId: payrollRunId,
            totalEmployees: responses.summary.data.totalEmployees,
            totalGrossPay: responses.summary.data.totalGrossPay,
            totalDeductions: responses.summary.data.totalDeductions,
            totalNetPay: responses.summary.data.totalNetPay,
            totalSSS: responses.summary.data.totalSSS || 0,
            totalPhilHealth: responses.summary.data.totalPhilHealth || 0,
            totalPagIBIG: responses.summary.data.totalPagIBIG || 0,
            totalBIR: responses.summary.data.totalBIR || 0,
            totalOvertime: responses.summary.data.totalOvertime || 0,
            averageSalary: responses.summary.data.averageSalary || 0,
            status: this.currentPayrollRun?.status || 'draft',
            createdAt: this.currentPayrollRun?.createdAt || new Date(),
            periodStart: this.currentPayrollRun?.periodStart || new Date(),
            periodEnd: this.currentPayrollRun?.periodEnd || new Date(),
            payDate: this.currentPayrollRun?.payDate || new Date(),
            payslips: responses.employeeDetails.data
          };
          this.reviewInProgress = false;
        } else {
          this.buildLocalPayrollReview();
          this.reviewInProgress = false;
        }
      },
      error: (error) => {
        console.error('Error loading payroll review:', error);
        this.showNotification('Error loading payroll review, showing local summary', 'warning');
        this.buildLocalPayrollReview();
        this.reviewInProgress = false;
      }
    });
  }

  private buildLocalPayrollReview(): void {
    const included = this.selectedEmployees.filter(e => e.status === 'included');
    const payslips = included.map(e => {
      const overtimeHours = e.attendanceData?.totalOvertimeHours || e.overtimeHours;
      return {
        id: e.id,
        employeeId: e.id,
        employeeName: e.name,
        employeeNumber: e.employeeId,
        department: e.department,
        position: e.position,
        baseSalary: e.baseSalary,
        grossPay: e.grossPay,
        totalDeductions: e.deductions.tax + e.deductions.insurance + e.deductions.retirement + e.deductions.other,
        netPay: e.netPay,
        sss: e.deductions.insurance,
        philHealth: e.deductions.retirement,
        pagIBIG: e.deductions.other,
        bir: e.deductions.tax,
        overtime: overtimeHours * (e.baseSalary / 160 / 8) * 1.5,
        allowances: 0,
        otherDeductions: 0,
        status: e.status,
        items: []
      };
    });

    this.payrollReview = {
      payrollRunId: this.currentPayrollRun ? String(this.currentPayrollRun.id) : '',
      totalEmployees: included.length,
      totalGrossPay: included.reduce((s, e) => s + e.grossPay, 0),
      totalDeductions: included.reduce((s, e) => s + e.deductions.tax + e.deductions.insurance + e.deductions.retirement + e.deductions.other, 0),
      totalNetPay: included.reduce((s, e) => s + e.netPay, 0),
      totalSSS: included.reduce((s, e) => s + e.deductions.insurance, 0),
      totalPhilHealth: included.reduce((s, e) => s + e.deductions.retirement, 0),
      totalPagIBIG: included.reduce((s, e) => s + e.deductions.other, 0),
      totalBIR: included.reduce((s, e) => s + e.deductions.tax, 0),
      totalOvertime: included.reduce((s, e) => {
        const overtimeHours = e.attendanceData?.totalOvertimeHours || e.overtimeHours;
        return s + (overtimeHours * (e.baseSalary / 160 / 8) * 1.5);
      }, 0),
      averageSalary: included.length ? included.reduce((s, e) => s + e.baseSalary, 0) / included.length : 0,
      status: this.currentPayrollRun?.status || 'draft',
      createdAt: this.currentPayrollRun?.createdAt || new Date(),
      periodStart: this.currentPayrollRun?.periodStart || new Date(),
      periodEnd: this.currentPayrollRun?.periodEnd || new Date(),
      payDate: this.currentPayrollRun?.payDate || new Date(),
      payslips
    };
  }

  generatePayrollRegister(): void {
    if (!this.currentPayrollRun) return;

    this.payrollService.generatePayrollRegister(this.currentPayrollRun.sourceId).subscribe({
      next: (response) => {
        if (response.success) {
          this.payrollRegister = response.data;
          this.showNotification('Payroll register generated successfully', 'success');
        }
      },
      error: (error) => {
        console.error('Error generating payroll register:', error);
        this.showNotification('Error generating payroll register', 'error');
      }
    });
  }

  downloadPayrollRegister(): void {
    if (!this.currentPayrollRun) return;

    this.payrollService.downloadPayrollRegister(this.currentPayrollRun.sourceId).subscribe({
      next: (blob) => {
        const filename = `payroll-register-${this.currentPayrollRun?.id}-${this.formatDate(new Date())}.pdf`;
        this.payrollService.downloadFile(blob, filename);
        this.showNotification('Payroll register downloaded successfully', 'success');
      },
      error: (error) => {
        console.error('Error downloading payroll register:', error);
        this.showNotification('Error downloading payroll register', 'error');
      }
    });
  }

  approvePayrollRun(): void {
    if (!this.currentPayrollRun || !this.approvalForm.valid) return;

    this.approvalInProgress = true;
    const approvalData: PayrollApproval = {
      payrollRunId: this.currentPayrollRun.sourceId,
      status: this.approvalForm.value.status,
      notes: this.approvalForm.value.notes,
      approvedBy: 'current-user-id', // This should come from auth service
      approvedAt: new Date()
    };

    this.payrollService.approvePayrollRun(this.currentPayrollRun.sourceId, approvalData).subscribe({
      next: (response) => {
        if (response.success) {
          this.showNotification('Payroll run approved successfully', 'success');
          this.loadPayrollHistory();
          this.loadPayrollReview(this.currentPayrollRun!.sourceId);
          this.approvalInProgress = false;
        }
      },
      error: (error) => {
        console.error('Error approving payroll run:', error);
        this.showNotification('Error approving payroll run', 'error');
        this.approvalInProgress = false;
      }
    });
  }

  releasePayrollRun(): void {
    if (!this.currentPayrollRun) return;

    if (confirm('Are you sure you want to release this payroll run? This action cannot be undone.')) {
      this.payrollService.releasePayrollRun(this.currentPayrollRun.sourceId).subscribe({
        next: (response) => {
          if (response.success) {
            this.showNotification('Payroll run released successfully', 'success');
            this.loadPayrollHistory();
            this.loadPayrollReview(this.currentPayrollRun!.sourceId);
          }
        },
        error: (error) => {
          console.error('Error releasing payroll run:', error);
          this.showNotification('Error releasing payroll run', 'error');
        }
      });
    }
  }

  // Open confirmation modal
  openProcessConfirm(): void {
    if (!this.currentPayrollRun) return;
    this.showProcessConfirmModal = true;
  }

  // Backwards-compat handler if any template still calls original method name
  processPayrollRun(): void {
    this.openProcessConfirm();
  }

  // Close confirmation modal
  closeProcessConfirm(): void {
    this.showProcessConfirmModal = false;
  }

  // Confirm modal action -> actually process the payroll
  confirmProcessPayroll(): void {
    this.closeProcessConfirm();
    this.doProcessPayrollRun();
  }

  // Actual processing implementation
  private doProcessPayrollRun(): void {
    if (!this.currentPayrollRun) return;
    this.payrollProcessing = true;
    this.payrollService.processPayrollRun(this.currentPayrollRun.sourceId).subscribe({
      next: (response) => {
        if (response.success) {
          this.showNotification('Payroll run processed successfully', 'success');
          // Optimistically update local status
          if (this.currentPayrollRun) {
            this.currentPayrollRun.status = 'processed';
          }
          // Show success banner
          this.processingSuccess = true;
          this.processingMessage = 'Payroll run processed successfully';
          setTimeout(() => {
            this.processingSuccess = false;
            this.processingMessage = null;
          }, 3000);
          this.loadPayrollHistory();
          this.loadPayrollReview(this.currentPayrollRun!.sourceId);
          // Do not redirect; employees will see payslips on their side upon login
        }
        this.payrollProcessing = false;
      },
      error: (error) => {
        console.error('Error processing payroll run:', error);
        this.showNotification('Error processing payroll run', 'error');
        this.payrollProcessing = false;
      }
    });
  }

  // ==================== APPROVAL FLOW ====================

  openApproveConfirm(): void {
    if (!this.currentPayrollRun || !this.canApprovePayrollRun()) return;
    this.showApproveConfirmModal = true;
  }

  closeApproveConfirm(): void {
    this.showApproveConfirmModal = false;
  }

  confirmApprovePayroll(): void {
    this.closeApproveConfirm();
    this.doApprovePayrollRun();
  }

  private doApprovePayrollRun(): void {
    if (!this.currentPayrollRun) return;
    this.approvalInProgress = true;
    const approvalData: PayrollApproval = {
      payrollRunId: this.currentPayrollRun.sourceId,
      status: this.approvalForm.value.status,
      notes: this.approvalForm.value.notes,
      approvedBy: 'current-user-id',
      approvedAt: new Date()
    };

    this.payrollService.approvePayrollRun(this.currentPayrollRun.sourceId, approvalData).subscribe({
      next: (response) => {
        if (response.success) {
          // Update status locally
          if (this.currentPayrollRun) {
            this.currentPayrollRun.status = 'approved';
          }
          this.showNotification('Payroll run approved successfully', 'success');
          // Success banner
          this.processingSuccess = true;
          this.processingMessage = 'Payroll run approved successfully';
          setTimeout(() => {
            this.processingSuccess = false;
            this.processingMessage = null;
          }, 1500);
          this.loadPayrollHistory();
          this.loadPayrollReview(this.currentPayrollRun!.sourceId);
        }
        this.approvalInProgress = false;
      },
      error: (error) => {
        console.error('Error approving payroll run:', error);
        this.showNotification('Error approving payroll run', 'error');
        this.approvalInProgress = false;
      }
    });
  }

  // ==================== UTILITY METHODS FOR REVIEW ====================

  getPayrollRunStatusColor(status: string): string {
    return this.payrollService.getStatusColor(status);
  }

  getPayrollRunStatusIcon(status: string): string {
    return this.payrollService.getStatusIcon(status);
  }

  formatCurrency(amount: number): string {
    return this.payrollService.formatCurrency(amount);
  }

  formatPayrollDate(date: string | Date): string {
    return this.payrollService.formatDate(date);
  }

  // Helpers for template safety
  getReviewPeriodStart(): Date {
    const date = this.payrollReview?.periodStart || this.currentPayrollRun?.periodStart || new Date();
    return typeof date === 'string' ? new Date(date) : date;
  }

  getReviewPeriodEnd(): Date {
    const date = this.payrollReview?.periodEnd || this.currentPayrollRun?.periodEnd || new Date();
    return typeof date === 'string' ? new Date(date) : date;
  }

  formatPayrollDateTime(date: string | Date): string {
    return this.payrollService.formatDateTime(date);
  }

  canApprovePayrollRun(): boolean {
    return this.currentPayrollRun?.status === 'processed';
  }

  canReleasePayrollRun(): boolean {
    return this.currentPayrollRun?.status === 'approved';
  }

  canProcessPayrollRun(): boolean {
    return this.currentPayrollRun?.status === 'draft' || this.currentPayrollRun?.status === 'pending';
  }

  getTotalDeductionsForEmployee(employee: PayslipReviewItem): number {
    return employee.sss + employee.philHealth + employee.pagIBIG + employee.bir + employee.otherDeductions;
  }

  getTotalEarningsForEmployee(employee: PayslipReviewItem): number {
    return employee.baseSalary + employee.overtime + employee.allowances;
  }

  showNotification(message: string, type: 'success' | 'error' | 'info' | 'warning'): void {
    // In a real implementation, this would show a toast notification
    console.log(`${type.toUpperCase()}: ${message}`);
  }

  // Computed properties for template
  get includedEmployeesCount(): number {
    return this.selectedEmployees.filter(emp => emp.status === 'included').length;
  }

  get hasIncludedEmployees(): boolean {
    return this.includedEmployeesCount > 0;
  }

  // Method to test database connection and provide feedback
  testDatabaseConnection(): void {
    this.showNotification('Testing database connection...', 'info');
    this.payrollService.getEmployeesForPayrollRun().subscribe({
      next: (response) => {
        if (response.success) {
          this.showNotification(`Database connection successful. Found ${response.data?.length || 0} employees.`, 'success');
        } else {
          this.showNotification('Database connection failed - no data returned', 'error');
        }
      },
      error: (error) => {
        console.error('Database connection test failed:', error);
        this.showNotification('Database connection failed - check server connection', 'error');
      }
    });
  }

  // ==================== PAYSLIP MODAL METHODS ====================

  openPayslipModal(employee: PayrollEmployee): void {
    this.selectedEmployeeForModal = employee;
    this.showPayslipModal = true;
  }

  closePayslipModal(): void {
    this.showPayslipModal = false;
    this.selectedEmployeeForModal = null;
  }

  downloadPayslip(employee: PayrollEmployee | null): void {
    if (!employee) return;
    
    // In a real implementation, this would call the backend to generate and download the payslip PDF
    this.showNotification(`Downloading payslip for ${employee.name}...`, 'info');
    
    // For now, we'll just show a success message
    setTimeout(() => {
      this.showNotification(`Payslip for ${employee.name} downloaded successfully`, 'success');
    }, 1000);
  }

  // ==================== PAYROLL DETAILS MODAL METHODS ====================

  openPayrollDetailsModal(payroll: LocalPayrollRun): void {
    this.selectedPayrollForModal = payroll;
    this.showPayrollDetailsModal = true;
  }

  closePayrollDetailsModal(): void {
    this.showPayrollDetailsModal = false;
    this.selectedPayrollForModal = null;
  }

  openFullReviewFromModal(): void {
    if (this.selectedPayrollForModal) {
      this.currentPayrollRun = this.selectedPayrollForModal;
      this.activeTab = 'preview';
      this.closePayrollDetailsModal();
    }
  }
} 
