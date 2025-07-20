import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { HeaderComponent } from '../../../../shared/header/header.component';
import { SidebarComponent } from '../../../../shared/sidebar/sidebar.component';

interface Employee {
  id: string;
  employeeId: string;
  name: string;
  department: string;
  position: string;
  basicSalary: number;
  hireDate: Date;
  employmentStatus: 'active' | 'resigned' | 'terminated';
  resignationDate?: Date;
  terminationDate?: Date;
  lastWorkingDay?: Date;
  unusedLeaves: number;
  leaveBalance: {
    vacation: number;
    sick: number;
    personal: number;
  };
}

interface FinalPay {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  employmentStatus: 'resigned' | 'terminated';
  lastWorkingDay: Date;
  computationDate: Date;
  
  // Salary Components
  basicSalary: number;
  daysWorked: number;
  proratedSalary: number;
  
  // Leave Benefits
  unusedVacationLeaves: number;
  unusedSickLeaves: number;
  unusedPersonalLeaves: number;
  leaveMonetization: number;
  
  // Additional Benefits
  thirteenthMonthPay: number;
  separationPay: number;
  otherBenefits: number;
  
  // Deductions
  loans: number;
  advances: number;
  taxes: number;
  otherDeductions: number;
  
  // Final Computation
  grossPay: number;
  totalDeductions: number;
  netPay: number;
  
  // Status and Tracking
  status: 'pending' | 'computed' | 'approved' | 'released' | 'cancelled';
  computedAt?: Date;
  approvedAt?: Date;
  releasedAt?: Date;
  approvedBy?: string;
  releasedBy?: string;
  paymentMethod?: string;
  remarks?: string;
}

interface LeaveComputation {
  leaveType: 'vacation' | 'sick' | 'personal';
  unusedDays: number;
  dailyRate: number;
  monetizedAmount: number;
}

@Component({
  selector: 'app-final-pay-process',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    HeaderComponent,
    SidebarComponent
  ],
  templateUrl: './final-pay-process.component.html',
  styleUrl: './final-pay-process.component.scss'
})
export class FinalPayProcessComponent implements OnInit {
  activeTab: 'process' | 'track' = 'process';
  selectedEmployee: Employee | null = null;
  selectedFinalPays: string[] = [];
  computationInProgress = false;
  releaseInProgress = false;
  showComputationModal = false;
  showReleaseModal = false;
  showEmployeeModal = false;

  finalPayForm: FormGroup;
  releaseForm: FormGroup;

  employees: Employee[] = [];
  finalPays: FinalPay[] = [];
  leaveComputations: LeaveComputation[] = [];

  constructor(
    private fb: FormBuilder,
    private router: Router
  ) {
    this.finalPayForm = this.fb.group({
      employeeId: ['', [Validators.required]],
      lastWorkingDay: ['', [Validators.required]],
      includeThirteenthMonth: [true],
      includeSeparationPay: [true],
      includeLeaveMonetization: [true],
      includeOtherBenefits: [false],
      otherBenefitsAmount: [0, [Validators.min(0)]],
      remarks: ['']
    });

    this.releaseForm = this.fb.group({
      releaseDate: [new Date(), [Validators.required]],
      paymentMethod: ['bank_transfer', [Validators.required]],
      remarks: ['']
    });
  }

  ngOnInit(): void {
    this.loadEmployees();
    this.loadFinalPays();
  }

  loadEmployees(): void {
    // Simulated employee data
    this.employees = [
      {
        id: '1',
        employeeId: 'EMP001',
        name: 'Juan Dela Cruz',
        department: 'Engineering',
        position: 'Software Engineer',
        basicSalary: 45000,
        hireDate: new Date('2022-03-15'),
        employmentStatus: 'resigned',
        resignationDate: new Date('2024-11-15'),
        lastWorkingDay: new Date('2024-12-15'),
        unusedLeaves: 15,
        leaveBalance: {
          vacation: 8,
          sick: 5,
          personal: 2
        }
      },
      {
        id: '2',
        employeeId: 'EMP002',
        name: 'Maria Santos',
        department: 'Human Resources',
        position: 'HR Specialist',
        basicSalary: 38000,
        hireDate: new Date('2021-08-20'),
        employmentStatus: 'terminated',
        terminationDate: new Date('2024-10-20'),
        lastWorkingDay: new Date('2024-10-20'),
        unusedLeaves: 12,
        leaveBalance: {
          vacation: 6,
          sick: 4,
          personal: 2
        }
      },
      {
        id: '3',
        employeeId: 'EMP003',
        name: 'Pedro Reyes',
        department: 'Finance',
        position: 'Accountant',
        basicSalary: 42000,
        hireDate: new Date('2023-01-10'),
        employmentStatus: 'resigned',
        resignationDate: new Date('2024-12-01'),
        lastWorkingDay: new Date('2024-12-31'),
        unusedLeaves: 20,
        leaveBalance: {
          vacation: 12,
          sick: 6,
          personal: 2
        }
      },
      {
        id: '4',
        employeeId: 'EMP004',
        name: 'Ana Garcia',
        department: 'Marketing',
        position: 'Marketing Manager',
        basicSalary: 55000,
        hireDate: new Date('2020-11-05'),
        employmentStatus: 'terminated',
        terminationDate: new Date('2024-09-30'),
        lastWorkingDay: new Date('2024-09-30'),
        unusedLeaves: 8,
        leaveBalance: {
          vacation: 4,
          sick: 3,
          personal: 1
        }
      },
      {
        id: '5',
        employeeId: 'EMP005',
        name: 'Luis Martinez',
        department: 'Sales',
        position: 'Sales Representative',
        basicSalary: 35000,
        hireDate: new Date('2022-06-12'),
        employmentStatus: 'resigned',
        resignationDate: new Date('2024-11-30'),
        lastWorkingDay: new Date('2024-12-15'),
        unusedLeaves: 18,
        leaveBalance: {
          vacation: 10,
          sick: 6,
          personal: 2
        }
      }
    ];
  }

  loadFinalPays(): void {
    // Simulated final pay data
    this.finalPays = [
      {
        id: '1',
        employeeId: 'EMP001',
        employeeName: 'Juan Dela Cruz',
        department: 'Engineering',
        employmentStatus: 'resigned',
        lastWorkingDay: new Date('2024-12-15'),
        computationDate: new Date('2024-12-16'),
        basicSalary: 45000,
        daysWorked: 15,
        proratedSalary: 22500,
        unusedVacationLeaves: 8,
        unusedSickLeaves: 5,
        unusedPersonalLeaves: 2,
        leaveMonetization: 16875,
        thirteenthMonthPay: 18750,
        separationPay: 0,
        otherBenefits: 0,
        loans: 5000,
        advances: 2000,
        taxes: 3750,
        otherDeductions: 0,
        grossPay: 58125,
        totalDeductions: 10750,
        netPay: 47375,
        status: 'computed',
        computedAt: new Date('2024-12-16'),
        remarks: 'Resigned - 30 days notice served'
      },
      {
        id: '2',
        employeeId: 'EMP002',
        employeeName: 'Maria Santos',
        department: 'Human Resources',
        employmentStatus: 'terminated',
        lastWorkingDay: new Date('2024-10-20'),
        computationDate: new Date('2024-10-21'),
        basicSalary: 38000,
        daysWorked: 20,
        proratedSalary: 25333,
        unusedVacationLeaves: 6,
        unusedSickLeaves: 4,
        unusedPersonalLeaves: 2,
        leaveMonetization: 15200,
        thirteenthMonthPay: 0,
        separationPay: 19000,
        otherBenefits: 0,
        loans: 0,
        advances: 0,
        taxes: 3953,
        otherDeductions: 0,
        grossPay: 59533,
        totalDeductions: 3953,
        netPay: 55580,
        status: 'released',
        computedAt: new Date('2024-10-21'),
        approvedAt: new Date('2024-10-22'),
        releasedAt: new Date('2024-10-25'),
        approvedBy: 'HR Manager',
        releasedBy: 'Finance Manager',
        paymentMethod: 'bank_transfer',
        remarks: 'Terminated - Performance issues'
      },
      {
        id: '3',
        employeeId: 'EMP003',
        employeeName: 'Pedro Reyes',
        department: 'Finance',
        employmentStatus: 'resigned',
        lastWorkingDay: new Date('2024-12-31'),
        computationDate: new Date('2024-12-16'),
        basicSalary: 42000,
        daysWorked: 31,
        proratedSalary: 42000,
        unusedVacationLeaves: 12,
        unusedSickLeaves: 6,
        unusedPersonalLeaves: 2,
        leaveMonetization: 28000,
        thirteenthMonthPay: 35000,
        separationPay: 0,
        otherBenefits: 5000,
        loans: 8000,
        advances: 3000,
        taxes: 7000,
        otherDeductions: 0,
        grossPay: 110000,
        totalDeductions: 18000,
        netPay: 92000,
        status: 'approved',
        computedAt: new Date('2024-12-16'),
        approvedAt: new Date('2024-12-17'),
        approvedBy: 'HR Manager',
        remarks: 'Resigned - Career advancement'
      }
    ];
  }

  // Employee selection methods
  selectEmployee(employee: Employee): void {
    this.selectedEmployee = employee;
    this.finalPayForm.patchValue({
      employeeId: employee.employeeId,
      lastWorkingDay: employee.lastWorkingDay || new Date()
    });
    this.computeLeaveMonetization();
  }

  clearSelection(): void {
    this.selectedEmployee = null;
    this.finalPayForm.reset();
    this.leaveComputations = [];
  }

  // Final pay selection methods
  selectAllFinalPays(): void {
    this.selectedFinalPays = this.finalPays
      .filter(pay => pay.status === 'approved')
      .map(pay => pay.id);
  }

  deselectAllFinalPays(): void {
    this.selectedFinalPays = [];
  }

  toggleFinalPaySelection(payId: string): void {
    const index = this.selectedFinalPays.indexOf(payId);
    if (index > -1) {
      this.selectedFinalPays.splice(index, 1);
    } else {
      this.selectedFinalPays.push(payId);
    }
  }

  isFinalPaySelected(payId: string): boolean {
    return this.selectedFinalPays.includes(payId);
  }

  // Computation methods
  computeLeaveMonetization(): void {
    if (!this.selectedEmployee) return;

    const dailyRate = this.selectedEmployee.basicSalary / 22; // Assuming 22 working days per month
    
    this.leaveComputations = [
      {
        leaveType: 'vacation',
        unusedDays: this.selectedEmployee.leaveBalance.vacation,
        dailyRate: dailyRate,
        monetizedAmount: this.selectedEmployee.leaveBalance.vacation * dailyRate
      },
      {
        leaveType: 'sick',
        unusedDays: this.selectedEmployee.leaveBalance.sick,
        dailyRate: dailyRate,
        monetizedAmount: this.selectedEmployee.leaveBalance.sick * dailyRate
      },
      {
        leaveType: 'personal',
        unusedDays: this.selectedEmployee.leaveBalance.personal,
        dailyRate: dailyRate,
        monetizedAmount: this.selectedEmployee.leaveBalance.personal * dailyRate
      }
    ];
  }

  computeFinalPay(): void {
    if (this.finalPayForm.valid && this.selectedEmployee) {
      this.computationInProgress = true;
      
      setTimeout(() => {
        const formValue = this.finalPayForm.value;
        const employee = this.selectedEmployee!;
        
        // Calculate days worked in the month
        const lastWorkingDay = new Date(formValue.lastWorkingDay);
        const daysInMonth = new Date(lastWorkingDay.getFullYear(), lastWorkingDay.getMonth() + 1, 0).getDate();
        const daysWorked = lastWorkingDay.getDate();
        
        // Calculate prorated salary
        const proratedSalary = (employee.basicSalary / daysInMonth) * daysWorked;
        
        // Calculate leave monetization
        const dailyRate = employee.basicSalary / 22;
        const leaveMonetization = (
          employee.leaveBalance.vacation + 
          employee.leaveBalance.sick + 
          employee.leaveBalance.personal
        ) * dailyRate;
        
        // Calculate 13th month pay (prorated)
        const monthsWorked = this.calculateMonthsWorked(employee.hireDate, lastWorkingDay);
        const thirteenthMonthPay = employee.employmentStatus === 'terminated' ? 0 : 
          (employee.basicSalary * monthsWorked) / 12;
        
        // Calculate separation pay (for terminated employees)
        const separationPay = employee.employmentStatus === 'terminated' ? 
          employee.basicSalary * 0.5 : 0;
        
        // Calculate other benefits
        const otherBenefits = formValue.includeOtherBenefits ? formValue.otherBenefitsAmount : 0;
        
        // Calculate deductions (simplified)
        const loans = 5000; // This would come from actual loan records
        const advances = 2000; // This would come from actual advance records
        const taxes = (proratedSalary + leaveMonetization + thirteenthMonthPay + separationPay + otherBenefits) * 0.15; // 15% tax rate
        const otherDeductions = 0;
        
        // Calculate final amounts
        const grossPay = proratedSalary + leaveMonetization + thirteenthMonthPay + separationPay + otherBenefits;
        const totalDeductions = loans + advances + taxes + otherDeductions;
        const netPay = grossPay - totalDeductions;
        
        // Create final pay record
        const finalPay: FinalPay = {
          id: Date.now().toString(),
          employeeId: employee.employeeId,
          employeeName: employee.name,
          department: employee.department,
          employmentStatus: employee.employmentStatus as 'resigned' | 'terminated',
          lastWorkingDay: lastWorkingDay,
          computationDate: new Date(),
          basicSalary: employee.basicSalary,
          daysWorked: daysWorked,
          proratedSalary: Math.round(proratedSalary),
          unusedVacationLeaves: employee.leaveBalance.vacation,
          unusedSickLeaves: employee.leaveBalance.sick,
          unusedPersonalLeaves: employee.leaveBalance.personal,
          leaveMonetization: Math.round(leaveMonetization),
          thirteenthMonthPay: Math.round(thirteenthMonthPay),
          separationPay: Math.round(separationPay),
          otherBenefits: Math.round(otherBenefits),
          loans: loans,
          advances: advances,
          taxes: Math.round(taxes),
          otherDeductions: otherDeductions,
          grossPay: Math.round(grossPay),
          totalDeductions: Math.round(totalDeductions),
          netPay: Math.round(netPay),
          status: 'computed',
          computedAt: new Date(),
          remarks: formValue.remarks || `${employee.employmentStatus} - Final pay computation`
        };
        
        this.finalPays.push(finalPay);
        this.computationInProgress = false;
        this.showComputationModal = false;
        this.clearSelection();
      }, 2000);
    }
  }

  calculateMonthsWorked(hireDate: Date, lastWorkingDay: Date): number {
    const years = lastWorkingDay.getFullYear() - hireDate.getFullYear();
    const months = lastWorkingDay.getMonth() - hireDate.getMonth();
    return years * 12 + months + 1; // +1 to include the current month
  }

  // Approval and release methods
  approveFinalPay(payId: string): void {
    const pay = this.finalPays.find(p => p.id === payId);
    if (pay && pay.status === 'computed') {
      pay.status = 'approved';
      pay.approvedAt = new Date();
      pay.approvedBy = 'HR Manager';
    }
  }

  releaseFinalPay(): void {
    if (this.releaseForm.valid && this.selectedFinalPays.length > 0) {
      this.releaseInProgress = true;
      
      setTimeout(() => {
        const releaseDate = this.releaseForm.get('releaseDate')?.value;
        const paymentMethod = this.releaseForm.get('paymentMethod')?.value;
        const remarks = this.releaseForm.get('remarks')?.value;
        
        this.selectedFinalPays.forEach(payId => {
          const pay = this.finalPays.find(p => p.id === payId);
          if (pay && pay.status === 'approved') {
            pay.status = 'released';
            pay.releasedAt = releaseDate;
            pay.releasedBy = 'Finance Manager';
            pay.paymentMethod = paymentMethod;
            pay.remarks = remarks || `Released via ${paymentMethod}`;
          }
        });
        
        this.releaseInProgress = false;
        this.showReleaseModal = false;
        this.selectedFinalPays = [];
      }, 1500);
    }
  }

  // Filter methods
  getFinalPaysByStatus(status: string): FinalPay[] {
    return this.finalPays.filter(pay => pay.status === status);
  }

  getFinalPayCountByStatus(status: string): number {
    return this.finalPays.filter(pay => pay.status === status).length;
  }

  getEmployeesByStatus(status: string): Employee[] {
    return this.employees.filter(emp => emp.employmentStatus === status);
  }

  // Utility methods
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(amount);
  }

  formatDate(date: Date): string {
    return new Intl.DateTimeFormat('en-PH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date);
  }

  formatDateTime(date: Date): string {
    return new Intl.DateTimeFormat('en-PH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'computed': return 'bg-blue-100 text-blue-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'released': return 'bg-purple-100 text-purple-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  getStatusIcon(status: string): string {
    switch (status) {
      case 'pending': return 'schedule';
      case 'computed': return 'calculate';
      case 'approved': return 'check_circle';
      case 'released': return 'payment';
      case 'cancelled': return 'cancel';
      default: return 'help';
    }
  }

  getEmploymentStatusColor(status: string): string {
    switch (status) {
      case 'resigned': return 'bg-orange-100 text-orange-800';
      case 'terminated': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  // Modal methods
  openComputationModal(): void {
    this.showComputationModal = true;
  }

  closeComputationModal(): void {
    this.showComputationModal = false;
  }

  openReleaseModal(): void {
    this.showReleaseModal = true;
  }

  closeReleaseModal(): void {
    this.showReleaseModal = false;
  }

  openEmployeeModal(): void {
    this.showEmployeeModal = true;
  }

  closeEmployeeModal(): void {
    this.showEmployeeModal = false;
  }

  // Helper methods
  getTotalLeaveMonetization(): number {
    return this.leaveComputations.reduce((sum, leave) => sum + leave.monetizedAmount, 0);
  }

  viewFinalPayDetails(pay: FinalPay): void {
    // In a real implementation, this would open a detailed view modal
    console.log('Viewing final pay details:', pay);
    // You can implement a detailed view modal here
  }
}
