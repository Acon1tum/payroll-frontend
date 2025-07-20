import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { HeaderComponent } from '../../../../shared/header/header.component';
import { SidebarComponent } from '../../../../shared/sidebar/sidebar.component';

interface PayrollRun {
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

interface PayrollEmployee {
  id: number;
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
}

interface PayrollSummary {
  totalEmployees: number;
  totalGrossPay: number;
  totalNetPay: number;
  totalDeductions: number;
  totalOvertime: number;
  totalTax: number;
  totalInsurance: number;
  totalRetirement: number;
}

@Component({
  selector: 'app-run-payroll',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, HeaderComponent, SidebarComponent],
  templateUrl: './run-payroll.component.html',
  styleUrl: './run-payroll.component.scss'
})
export class RunPayrollComponent implements OnInit, OnDestroy {
  activeTab: 'new-run' | 'history' | 'preview' = 'new-run';
  
  // New Payroll Run
  payrollForm: FormGroup;
  selectedEmployees: PayrollEmployee[] = [];
  payrollSummary: PayrollSummary = {
    totalEmployees: 0,
    totalGrossPay: 0,
    totalNetPay: 0,
    totalDeductions: 0,
    totalOvertime: 0,
    totalTax: 0,
    totalInsurance: 0,
    totalRetirement: 0
  };

  // Payroll History
  payrollHistory: PayrollRun[] = [];
  filteredHistory: PayrollRun[] = [];
  historyFilter = 'all';

  // Preview & Approval
  currentPayrollRun?: PayrollRun;
  approvalNotes = '';

  // Sample data
  availableEmployees: PayrollEmployee[] = [
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
      deductions: {
        tax: 960,
        insurance: 240,
        retirement: 360,
        other: 120
      },
      netPay: 3120,
      status: 'included'
    },
    {
      id: 2,
      employeeId: 'EMP002',
      name: 'Sarah Johnson',
      department: 'Marketing',
      position: 'Marketing Manager',
      baseSalary: 65000,
      hoursWorked: 160,
      overtimeHours: 4,
      grossPay: 4200,
      deductions: {
        tax: 840,
        insurance: 210,
        retirement: 315,
        other: 105
      },
      netPay: 2730,
      status: 'included'
    },
    {
      id: 3,
      employeeId: 'EMP003',
      name: 'Michael Brown',
      department: 'Sales',
      position: 'Sales Representative',
      baseSalary: 55000,
      hoursWorked: 160,
      overtimeHours: 12,
      grossPay: 3800,
      deductions: {
        tax: 760,
        insurance: 190,
        retirement: 285,
        other: 95
      },
      netPay: 2470,
      status: 'included'
    },
    {
      id: 4,
      employeeId: 'EMP004',
      name: 'Emily Davis',
      department: 'HR',
      position: 'HR Specialist',
      baseSalary: 60000,
      hoursWorked: 160,
      overtimeHours: 0,
      grossPay: 4000,
      deductions: {
        tax: 800,
        insurance: 200,
        retirement: 300,
        other: 100
      },
      netPay: 2600,
      status: 'included'
    },
    {
      id: 5,
      employeeId: 'EMP005',
      name: 'David Wilson',
      department: 'Finance',
      position: 'Financial Analyst',
      baseSalary: 70000,
      hoursWorked: 160,
      overtimeHours: 6,
      grossPay: 4600,
      deductions: {
        tax: 920,
        insurance: 230,
        retirement: 345,
        other: 115
      },
      netPay: 2990,
      status: 'included'
    }
  ];

  constructor(
    private fb: FormBuilder,
    private router: Router
  ) {
    this.payrollForm = this.fb.group({
      cutoffStart: ['', Validators.required],
      cutoffEnd: ['', Validators.required],
      includeOvertime: [true],
      includeDeductions: [true],
      notes: ['']
    });
  }

  ngOnInit(): void {
    this.loadPayrollHistory();
    this.initializePayrollRun();
  }

  ngOnDestroy(): void {
    // Cleanup if needed
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

    this.selectedEmployees = [...this.availableEmployees];
    this.calculatePayrollSummary();
  }

  loadPayrollHistory(): void {
    // Sample payroll history data
    this.payrollHistory = [
      {
        id: 1,
        cutoffStart: new Date(2024, 0, 1),
        cutoffEnd: new Date(2024, 0, 31),
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
        cutoffStart: new Date(2023, 11, 1),
        cutoffEnd: new Date(2023, 11, 31),
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
        cutoffStart: new Date(2024, 1, 1),
        cutoffEnd: new Date(2024, 1, 29),
        totalEmployees: 145,
        grossPay: 2520000,
        netPay: 2030000,
        totalDeductions: 490000,
        totalOvertime: 92000,
        status: 'pending',
        createdAt: new Date(2024, 1, 29),
        notes: 'February 2024 payroll pending approval'
      }
    ];

    this.filteredHistory = [...this.payrollHistory];
  }

  calculatePayrollSummary(): void {
    const includedEmployees = this.selectedEmployees.filter(emp => emp.status === 'included');
    
    this.payrollSummary = {
      totalEmployees: includedEmployees.length,
      totalGrossPay: includedEmployees.reduce((sum, emp) => sum + emp.grossPay, 0),
      totalNetPay: includedEmployees.reduce((sum, emp) => sum + emp.netPay, 0),
      totalDeductions: includedEmployees.reduce((sum, emp) => 
        sum + emp.deductions.tax + emp.deductions.insurance + emp.deductions.retirement + emp.deductions.other, 0),
      totalOvertime: includedEmployees.reduce((sum, emp) => sum + (emp.overtimeHours * (emp.baseSalary / 160 / 8) * 1.5), 0),
      totalTax: includedEmployees.reduce((sum, emp) => sum + emp.deductions.tax, 0),
      totalInsurance: includedEmployees.reduce((sum, emp) => sum + emp.deductions.insurance, 0),
      totalRetirement: includedEmployees.reduce((sum, emp) => sum + emp.deductions.retirement, 0)
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
    if (this.payrollForm.valid) {
      const formValue = this.payrollForm.value;
      
      this.currentPayrollRun = {
        id: Date.now(),
        cutoffStart: new Date(formValue.cutoffStart),
        cutoffEnd: new Date(formValue.cutoffEnd),
        totalEmployees: this.payrollSummary.totalEmployees,
        grossPay: this.payrollSummary.totalGrossPay,
        netPay: this.payrollSummary.totalNetPay,
        totalDeductions: this.payrollSummary.totalDeductions,
        totalOvertime: this.payrollSummary.totalOvertime,
        status: 'draft',
        createdAt: new Date(),
        notes: formValue.notes
      };

      this.activeTab = 'preview';
    }
  }

  approvePayrollRun(): void {
    if (this.currentPayrollRun) {
      this.currentPayrollRun.status = 'approved';
      this.currentPayrollRun.approvedBy = 'Admin User';
      this.currentPayrollRun.approvedAt = new Date();
      this.currentPayrollRun.notes = this.approvalNotes;
      
      // Add to history
      this.payrollHistory.unshift(this.currentPayrollRun);
      this.filteredHistory = [...this.payrollHistory];
      
      this.activeTab = 'history';
      this.currentPayrollRun = undefined;
      this.approvalNotes = '';
    }
  }

  releasePayrollRun(): void {
    if (this.currentPayrollRun) {
      this.currentPayrollRun.status = 'released';
      this.currentPayrollRun.releasedAt = new Date();
      
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

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }

  formatDate(date: Date): string {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date);
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
}
