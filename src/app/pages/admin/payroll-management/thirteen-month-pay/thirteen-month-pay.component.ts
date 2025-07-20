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
  employmentStatus: 'active' | 'terminated' | 'resigned';
  terminationDate?: Date;
}

interface ThirteenMonthPay {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  year: number;
  basicSalary: number;
  monthsWorked: number;
  totalEarnings: number;
  thirteenthMonthPay: number;
  status: 'pending' | 'computed' | 'approved' | 'released' | 'cancelled';
  computedAt?: Date;
  approvedAt?: Date;
  releasedAt?: Date;
  approvedBy?: string;
  releasedBy?: string;
  remarks?: string;
}

interface ComputationSettings {
  year: number;
  computationDate: Date;
  includeOvertime: boolean;
  includeAllowances: boolean;
  includeBonuses: boolean;
  proRataBasis: boolean;
  minimumMonthsWorked: number;
  taxExemptionLimit: number;
}

@Component({
  selector: 'app-thirteen-month-pay',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    HeaderComponent,
    SidebarComponent
  ],
  templateUrl: './thirteen-month-pay.component.html',
  styleUrl: './thirteen-month-pay.component.scss'
})
export class ThirteenMonthPayComponent implements OnInit {
  activeTab: 'compute' | 'history' | 'settings' = 'compute';
  selectedEmployees: string[] = [];
  selectedThirteenMonthPays: string[] = [];
  computationInProgress = false;
  releaseInProgress = false;
  showComputationModal = false;
  showReleaseModal = false;
  showSettingsModal = false;

  computeForm: FormGroup;
  settingsForm: FormGroup;
  releaseForm: FormGroup;

  employees: Employee[] = [];
  thirteenMonthPays: ThirteenMonthPay[] = [];
  computationSettings: ComputationSettings = {
    year: new Date().getFullYear(),
    computationDate: new Date(),
    includeOvertime: true,
    includeAllowances: true,
    includeBonuses: false,
    proRataBasis: true,
    minimumMonthsWorked: 1,
    taxExemptionLimit: 90000
  };

  constructor(
    private fb: FormBuilder,
    private router: Router
  ) {
    this.computeForm = this.fb.group({
      year: [new Date().getFullYear(), [Validators.required, Validators.min(2020)]],
      includeOvertime: [true],
      includeAllowances: [true],
      includeBonuses: [false],
      proRataBasis: [true],
      selectedEmployees: [[]]
    });

    this.settingsForm = this.fb.group({
      year: [new Date().getFullYear(), [Validators.required, Validators.min(2020)]],
      includeOvertime: [true],
      includeAllowances: [true],
      includeBonuses: [false],
      proRataBasis: [true],
      minimumMonthsWorked: [1, [Validators.required, Validators.min(1), Validators.max(12)]],
      taxExemptionLimit: [90000, [Validators.required, Validators.min(0)]]
    });

    this.releaseForm = this.fb.group({
      releaseDate: [new Date(), [Validators.required]],
      paymentMethod: ['bank_transfer', [Validators.required]],
      remarks: ['']
    });
  }

  ngOnInit(): void {
    this.loadEmployees();
    this.loadThirteenMonthPays();
    this.loadComputationSettings();
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
        employmentStatus: 'active'
      },
      {
        id: '2',
        employeeId: 'EMP002',
        name: 'Maria Santos',
        department: 'Human Resources',
        position: 'HR Specialist',
        basicSalary: 38000,
        hireDate: new Date('2021-08-20'),
        employmentStatus: 'active'
      },
      {
        id: '3',
        employeeId: 'EMP003',
        name: 'Pedro Reyes',
        department: 'Finance',
        position: 'Accountant',
        basicSalary: 42000,
        hireDate: new Date('2023-01-10'),
        employmentStatus: 'active'
      },
      {
        id: '4',
        employeeId: 'EMP004',
        name: 'Ana Garcia',
        department: 'Marketing',
        position: 'Marketing Manager',
        basicSalary: 55000,
        hireDate: new Date('2020-11-05'),
        employmentStatus: 'active'
      },
      {
        id: '5',
        employeeId: 'EMP005',
        name: 'Luis Martinez',
        department: 'Sales',
        position: 'Sales Representative',
        basicSalary: 35000,
        hireDate: new Date('2022-06-12'),
        employmentStatus: 'terminated',
        terminationDate: new Date('2024-09-30')
      }
    ];
  }

  loadThirteenMonthPays(): void {
    // Simulated 13th month pay data
    this.thirteenMonthPays = [
      {
        id: '1',
        employeeId: 'EMP001',
        employeeName: 'Juan Dela Cruz',
        department: 'Engineering',
        year: 2024,
        basicSalary: 45000,
        monthsWorked: 12,
        totalEarnings: 540000,
        thirteenthMonthPay: 45000,
        status: 'computed',
        computedAt: new Date('2024-12-01'),
        remarks: 'Full year computation'
      },
      {
        id: '2',
        employeeId: 'EMP002',
        employeeName: 'Maria Santos',
        department: 'Human Resources',
        year: 2024,
        basicSalary: 38000,
        monthsWorked: 12,
        totalEarnings: 456000,
        thirteenthMonthPay: 38000,
        status: 'approved',
        computedAt: new Date('2024-12-01'),
        approvedAt: new Date('2024-12-02'),
        approvedBy: 'HR Manager',
        remarks: 'Approved for release'
      },
      {
        id: '3',
        employeeId: 'EMP003',
        employeeName: 'Pedro Reyes',
        department: 'Finance',
        year: 2024,
        basicSalary: 42000,
        monthsWorked: 12,
        totalEarnings: 504000,
        thirteenthMonthPay: 42000,
        status: 'released',
        computedAt: new Date('2024-12-01'),
        approvedAt: new Date('2024-12-02'),
        releasedAt: new Date('2024-12-05'),
        approvedBy: 'HR Manager',
        releasedBy: 'Finance Manager',
        remarks: 'Released via bank transfer'
      },
      {
        id: '4',
        employeeId: 'EMP004',
        employeeName: 'Ana Garcia',
        department: 'Marketing',
        year: 2024,
        basicSalary: 55000,
        monthsWorked: 12,
        totalEarnings: 660000,
        thirteenthMonthPay: 55000,
        status: 'pending',
        remarks: 'Pending computation'
      },
      {
        id: '5',
        employeeId: 'EMP005',
        employeeName: 'Luis Martinez',
        department: 'Sales',
        year: 2024,
        basicSalary: 35000,
        monthsWorked: 9,
        totalEarnings: 315000,
        thirteenthMonthPay: 26250,
        status: 'computed',
        computedAt: new Date('2024-12-01'),
        remarks: 'Pro-rated computation (9 months)'
      }
    ];
  }

  loadComputationSettings(): void {
    this.settingsForm.patchValue(this.computationSettings);
  }

  // Employee selection methods
  selectAllEmployees(): void {
    this.selectedEmployees = this.employees
      .filter(emp => emp.employmentStatus === 'active')
      .map(emp => emp.id);
  }

  deselectAllEmployees(): void {
    this.selectedEmployees = [];
  }

  toggleEmployeeSelection(employeeId: string): void {
    const index = this.selectedEmployees.indexOf(employeeId);
    if (index > -1) {
      this.selectedEmployees.splice(index, 1);
    } else {
      this.selectedEmployees.push(employeeId);
    }
  }

  isEmployeeSelected(employeeId: string): boolean {
    return this.selectedEmployees.includes(employeeId);
  }

  // 13th Month Pay selection methods
  selectAllThirteenMonthPays(): void {
    this.selectedThirteenMonthPays = this.thirteenMonthPays
      .filter(pay => pay.status === 'approved')
      .map(pay => pay.id);
  }

  deselectAllThirteenMonthPays(): void {
    this.selectedThirteenMonthPays = [];
  }

  toggleThirteenMonthPaySelection(payId: string): void {
    const index = this.selectedThirteenMonthPays.indexOf(payId);
    if (index > -1) {
      this.selectedThirteenMonthPays.splice(index, 1);
    } else {
      this.selectedThirteenMonthPays.push(payId);
    }
  }

  isThirteenMonthPaySelected(payId: string): boolean {
    return this.selectedThirteenMonthPays.includes(payId);
  }

  // Computation methods
  computeThirteenMonthPay(): void {
    if (this.computeForm.valid && this.selectedEmployees.length > 0) {
      this.computationInProgress = true;
      
      // Simulate computation process
      setTimeout(() => {
        const year = this.computeForm.get('year')?.value;
        const settings = this.computeForm.value;
        
        this.selectedEmployees.forEach(employeeId => {
          const employee = this.employees.find(emp => emp.id === employeeId);
          if (employee) {
            const thirteenthMonthPay = this.calculateThirteenMonthPay(employee, year, settings);
            
            // Check if already exists
            const existingIndex = this.thirteenMonthPays.findIndex(
              pay => pay.employeeId === employee.employeeId && pay.year === year
            );
            
            if (existingIndex > -1) {
              // Update existing
              this.thirteenMonthPays[existingIndex] = {
                ...this.thirteenMonthPays[existingIndex],
                ...thirteenthMonthPay,
                status: 'computed',
                computedAt: new Date()
              };
            } else {
              // Add new
              this.thirteenMonthPays.push({
                id: Date.now().toString(),
                employeeId: employee.employeeId,
                employeeName: employee.name,
                department: employee.department,
                year: year,
                basicSalary: employee.basicSalary,
                monthsWorked: thirteenthMonthPay.monthsWorked,
                totalEarnings: thirteenthMonthPay.totalEarnings,
                thirteenthMonthPay: thirteenthMonthPay.thirteenthMonthPay,
                status: 'computed',
                computedAt: new Date(),
                remarks: thirteenthMonthPay.remarks
              });
            }
          }
        });
        
        this.computationInProgress = false;
        this.showComputationModal = false;
        this.selectedEmployees = [];
      }, 2000);
    }
  }

  calculateThirteenMonthPay(employee: Employee, year: number, settings: any): any {
    const startDate = new Date(year, 0, 1); // January 1st of the year
    const endDate = new Date(year, 11, 31); // December 31st of the year
    
    let monthsWorked = 12;
    let remarks = 'Full year computation';
    
    // Check if employee was hired during the year
    if (employee.hireDate.getFullYear() === year) {
      const hireMonth = employee.hireDate.getMonth();
      monthsWorked = 12 - hireMonth;
      remarks = `Pro-rated computation (${monthsWorked} months)`;
    }
    
    // Check if employee was terminated during the year
    if (employee.employmentStatus === 'terminated' && employee.terminationDate) {
      if (employee.terminationDate.getFullYear() === year) {
        const terminationMonth = employee.terminationDate.getMonth();
        monthsWorked = terminationMonth + 1;
        remarks = `Pro-rated computation (${monthsWorked} months) - Terminated`;
      }
    }
    
    // Calculate total earnings
    let totalEarnings = employee.basicSalary * monthsWorked;
    
    // Apply settings
    if (settings.includeOvertime) {
      totalEarnings += (employee.basicSalary * 0.1 * monthsWorked); // 10% overtime allowance
    }
    
    if (settings.includeAllowances) {
      totalEarnings += (employee.basicSalary * 0.05 * monthsWorked); // 5% allowance
    }
    
    if (settings.includeBonuses) {
      totalEarnings += (employee.basicSalary * 0.5); // 50% bonus
    }
    
    // Calculate 13th month pay
    let thirteenthMonthPay = totalEarnings / 12;
    
    // Apply pro-rata if needed
    if (settings.proRataBasis && monthsWorked < 12) {
      thirteenthMonthPay = (thirteenthMonthPay * monthsWorked) / 12;
    }
    
    return {
      monthsWorked,
      totalEarnings,
      thirteenthMonthPay: Math.round(thirteenthMonthPay),
      remarks
    };
  }

  // Approval and release methods
  approveThirteenMonthPay(payId: string): void {
    const pay = this.thirteenMonthPays.find(p => p.id === payId);
    if (pay && pay.status === 'computed') {
      pay.status = 'approved';
      pay.approvedAt = new Date();
      pay.approvedBy = 'HR Manager';
    }
  }

  releaseThirteenMonthPay(): void {
    if (this.releaseForm.valid && this.selectedThirteenMonthPays.length > 0) {
      this.releaseInProgress = true;
      
      setTimeout(() => {
        const releaseDate = this.releaseForm.get('releaseDate')?.value;
        const paymentMethod = this.releaseForm.get('paymentMethod')?.value;
        const remarks = this.releaseForm.get('remarks')?.value;
        
        this.selectedThirteenMonthPays.forEach(payId => {
          const pay = this.thirteenMonthPays.find(p => p.id === payId);
          if (pay && pay.status === 'approved') {
            pay.status = 'released';
            pay.releasedAt = releaseDate;
            pay.releasedBy = 'Finance Manager';
            pay.remarks = remarks || `Released via ${paymentMethod}`;
          }
        });
        
        this.releaseInProgress = false;
        this.showReleaseModal = false;
        this.selectedThirteenMonthPays = [];
      }, 1500);
    }
  }

  // Filter methods
  getThirteenMonthPaysByStatus(status: string): ThirteenMonthPay[] {
    return this.thirteenMonthPays.filter(pay => pay.status === status);
  }

  getThirteenMonthPayCountByStatus(status: string): number {
    return this.thirteenMonthPays.filter(pay => pay.status === status).length;
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

  openSettingsModal(): void {
    this.showSettingsModal = true;
  }

  closeSettingsModal(): void {
    this.showSettingsModal = false;
  }

  saveSettings(): void {
    if (this.settingsForm.valid) {
      this.computationSettings = { ...this.settingsForm.value };
      this.closeSettingsModal();
    }
  }
}
