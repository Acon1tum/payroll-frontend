import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { HeaderComponent } from '../../../../shared/header/header.component';
import { SidebarComponent } from '../../../../shared/sidebar/sidebar.component';

interface Payslip {
  id: number;
  employeeId: string;
  employeeName: string;
  department: string;
  position: string;
  payrollPeriod: {
    start: Date;
    end: Date;
  };
  basicSalary: number;
  grossPay: number;
  netPay: number;
  deductions: {
    tax: number;
    insurance: number;
    retirement: number;
    other: number;
  };
  allowances: {
    transportation: number;
    meal: number;
    housing: number;
    other: number;
  };
  overtime: {
    hours: number;
    rate: number;
    amount: number;
  };
  leaveBalance: {
    sick: number;
    vacation: number;
    personal: number;
  };
  status: 'generated' | 'sent' | 'downloaded' | 'failed';
  generatedAt: Date;
  sentAt?: Date;
  downloadedAt?: Date;
  emailSent: boolean;
  emailSentAt?: Date;
  doleCompliant: boolean;
}

interface PayslipFilter {
  payrollPeriod: string;
  department: string;
  status: string;
  employeeName: string;
}

@Component({
  selector: 'app-payslip-center',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, HeaderComponent, SidebarComponent],
  templateUrl: './payslip-center.component.html',
  styleUrl: './payslip-center.component.scss'
})
export class PayslipCenterComponent implements OnInit, OnDestroy {
  activeTab: 'view-download' | 'resend' = 'view-download';
  
  // Payslip data
  payslips: Payslip[] = [];
  filteredPayslips: Payslip[] = [];
  selectedPayslips: number[] = [];
  
  // Filters
  filterForm: FormGroup;
  availablePayrollPeriods: string[] = [];
  availableDepartments: string[] = [];
  
  // Resend functionality
  resendForm: FormGroup;
  selectedPayslipsForResend: Payslip[] = [];
  resendInProgress = false;
  
  // Bulk actions
  showBulkActions = false;
  allSelected = false;

  constructor(
    private fb: FormBuilder,
    private router: Router
  ) {
    this.filterForm = this.fb.group({
      payrollPeriod: [''],
      department: [''],
      status: [''],
      employeeName: ['']
    });

    this.resendForm = this.fb.group({
      emailTemplate: ['default', Validators.required],
      customMessage: [''],
      includeAttachment: [true],
      sendCopyToHR: [false]
    });
  }

  ngOnInit(): void {
    this.loadPayslips();
    this.setupFilterListeners();
  }

  ngOnDestroy(): void {
    // Cleanup if needed
  }

  loadPayslips(): void {
    // Sample payslip data
    this.payslips = [
      {
        id: 1,
        employeeId: 'EMP001',
        employeeName: 'John Smith',
        department: 'Engineering',
        position: 'Senior Developer',
        payrollPeriod: {
          start: new Date(2024, 0, 1),
          end: new Date(2024, 0, 31)
        },
        basicSalary: 75000,
        grossPay: 4800,
        netPay: 3120,
        deductions: {
          tax: 960,
          insurance: 240,
          retirement: 360,
          other: 120
        },
        allowances: {
          transportation: 500,
          meal: 300,
          housing: 0,
          other: 100
        },
        overtime: {
          hours: 8,
          rate: 35.16,
          amount: 281.28
        },
        leaveBalance: {
          sick: 12,
          vacation: 15,
          personal: 3
        },
        status: 'generated',
        generatedAt: new Date(2024, 0, 31),
        emailSent: false,
        doleCompliant: true
      },
      {
        id: 2,
        employeeId: 'EMP002',
        employeeName: 'Sarah Johnson',
        department: 'Marketing',
        position: 'Marketing Manager',
        payrollPeriod: {
          start: new Date(2024, 0, 1),
          end: new Date(2024, 0, 31)
        },
        basicSalary: 65000,
        grossPay: 4200,
        netPay: 2730,
        deductions: {
          tax: 840,
          insurance: 210,
          retirement: 315,
          other: 105
        },
        allowances: {
          transportation: 500,
          meal: 300,
          housing: 0,
          other: 100
        },
        overtime: {
          hours: 4,
          rate: 30.52,
          amount: 122.08
        },
        leaveBalance: {
          sick: 10,
          vacation: 18,
          personal: 2
        },
        status: 'sent',
        generatedAt: new Date(2024, 0, 31),
        sentAt: new Date(2024, 0, 31),
        emailSent: true,
        emailSentAt: new Date(2024, 0, 31),
        doleCompliant: true
      },
      {
        id: 3,
        employeeId: 'EMP003',
        employeeName: 'Michael Brown',
        department: 'Sales',
        position: 'Sales Representative',
        payrollPeriod: {
          start: new Date(2024, 0, 1),
          end: new Date(2024, 0, 31)
        },
        basicSalary: 55000,
        grossPay: 3800,
        netPay: 2470,
        deductions: {
          tax: 760,
          insurance: 190,
          retirement: 285,
          other: 95
        },
        allowances: {
          transportation: 500,
          meal: 300,
          housing: 0,
          other: 100
        },
        overtime: {
          hours: 12,
          rate: 26.44,
          amount: 317.28
        },
        leaveBalance: {
          sick: 8,
          vacation: 12,
          personal: 1
        },
        status: 'downloaded',
        generatedAt: new Date(2024, 0, 31),
        downloadedAt: new Date(2024, 0, 31),
        emailSent: false,
        doleCompliant: true
      },
      {
        id: 4,
        employeeId: 'EMP004',
        employeeName: 'Emily Davis',
        department: 'HR',
        position: 'HR Specialist',
        payrollPeriod: {
          start: new Date(2024, 0, 1),
          end: new Date(2024, 0, 31)
        },
        basicSalary: 60000,
        grossPay: 4000,
        netPay: 2600,
        deductions: {
          tax: 800,
          insurance: 200,
          retirement: 300,
          other: 100
        },
        allowances: {
          transportation: 500,
          meal: 300,
          housing: 0,
          other: 100
        },
        overtime: {
          hours: 0,
          rate: 28.85,
          amount: 0
        },
        leaveBalance: {
          sick: 15,
          vacation: 20,
          personal: 5
        },
        status: 'generated',
        generatedAt: new Date(2024, 0, 31),
        emailSent: false,
        doleCompliant: true
      },
      {
        id: 5,
        employeeId: 'EMP005',
        employeeName: 'David Wilson',
        department: 'Finance',
        position: 'Financial Analyst',
        payrollPeriod: {
          start: new Date(2024, 0, 1),
          end: new Date(2024, 0, 31)
        },
        basicSalary: 70000,
        grossPay: 4600,
        netPay: 2990,
        deductions: {
          tax: 920,
          insurance: 230,
          retirement: 345,
          other: 115
        },
        allowances: {
          transportation: 500,
          meal: 300,
          housing: 0,
          other: 100
        },
        overtime: {
          hours: 6,
          rate: 33.65,
          amount: 201.90
        },
        leaveBalance: {
          sick: 11,
          vacation: 16,
          personal: 4
        },
        status: 'sent',
        generatedAt: new Date(2024, 0, 31),
        sentAt: new Date(2024, 0, 31),
        emailSent: true,
        emailSentAt: new Date(2024, 0, 31),
        doleCompliant: true
      }
    ];

    this.filteredPayslips = [...this.payslips];
    this.extractFilterOptions();
  }

  extractFilterOptions(): void {
    // Extract unique payroll periods
    this.availablePayrollPeriods = [...new Set(this.payslips.map(p => 
      `${this.formatDate(p.payrollPeriod.start)} - ${this.formatDate(p.payrollPeriod.end)}`
    ))];

    // Extract unique departments
    this.availableDepartments = [...new Set(this.payslips.map(p => p.department))];
  }

  setupFilterListeners(): void {
    this.filterForm.valueChanges.subscribe(() => {
      this.applyFilters();
    });
  }

  applyFilters(): void {
    const filters = this.filterForm.value;
    
    this.filteredPayslips = this.payslips.filter(payslip => {
      const periodMatch = !filters.payrollPeriod || 
        `${this.formatDate(payslip.payrollPeriod.start)} - ${this.formatDate(payslip.payrollPeriod.end)}` === filters.payrollPeriod;
      
      const departmentMatch = !filters.department || payslip.department === filters.department;
      
      const statusMatch = !filters.status || payslip.status === filters.status;
      
      const nameMatch = !filters.employeeName || 
        payslip.employeeName.toLowerCase().includes(filters.employeeName.toLowerCase());
      
      return periodMatch && departmentMatch && statusMatch && nameMatch;
    });

    this.updateBulkSelection();
  }

  togglePayslipSelection(payslipId: number): void {
    const index = this.selectedPayslips.indexOf(payslipId);
    if (index > -1) {
      this.selectedPayslips.splice(index, 1);
    } else {
      this.selectedPayslips.push(payslipId);
    }
    this.updateBulkSelection();
  }

  toggleAllPayslips(): void {
    if (this.allSelected) {
      this.selectedPayslips = [];
    } else {
      this.selectedPayslips = this.filteredPayslips.map(p => p.id);
    }
    this.updateBulkSelection();
  }

  updateBulkSelection(): void {
    this.allSelected = this.filteredPayslips.length > 0 && 
      this.selectedPayslips.length === this.filteredPayslips.length;
    this.showBulkActions = this.selectedPayslips.length > 0;
  }

  downloadPayslip(payslip: Payslip): void {
    // Simulate download
    console.log(`Downloading payslip for ${payslip.employeeName}`);
    
    // Update status
    payslip.status = 'downloaded';
    payslip.downloadedAt = new Date();
    
    // In a real implementation, this would generate and download a PDF
    this.showNotification(`Payslip for ${payslip.employeeName} downloaded successfully`, 'success');
  }

  downloadSelectedPayslips(): void {
    const selectedPayslips = this.payslips.filter(p => this.selectedPayslips.includes(p.id));
    
    selectedPayslips.forEach(payslip => {
      this.downloadPayslip(payslip);
    });
    
    this.showNotification(`${selectedPayslips.length} payslips downloaded successfully`, 'success');
  }

  downloadAllPayslips(): void {
    this.filteredPayslips.forEach(payslip => {
      this.downloadPayslip(payslip);
    });
    
    this.showNotification(`All ${this.filteredPayslips.length} payslips downloaded successfully`, 'success');
  }

  resendPayslip(payslip: Payslip): void {
    this.selectedPayslipsForResend = [payslip];
    this.activeTab = 'resend';
  }

  resendSelectedPayslips(): void {
    this.selectedPayslipsForResend = this.payslips.filter(p => this.selectedPayslips.includes(p.id));
    this.activeTab = 'resend';
  }

  sendPayslips(): void {
    if (this.resendForm.valid && this.selectedPayslipsForResend.length > 0) {
      this.resendInProgress = true;
      
      // Simulate email sending
      setTimeout(() => {
        this.selectedPayslipsForResend.forEach(payslip => {
          payslip.emailSent = true;
          payslip.emailSentAt = new Date();
          payslip.status = 'sent';
          payslip.sentAt = new Date();
        });
        
        this.resendInProgress = false;
        this.selectedPayslipsForResend = [];
        this.activeTab = 'view-download';
        
        this.showNotification(`Payslips sent successfully to ${this.selectedPayslipsForResend.length} employees`, 'success');
      }, 2000);
    }
  }

  viewPayslip(payslip: Payslip): void {
    // In a real implementation, this would open a modal or navigate to a payslip view
    console.log(`Viewing payslip for ${payslip.employeeName}`);
    this.showNotification(`Opening payslip for ${payslip.employeeName}`, 'info');
  }

  getStatusColor(status: string): string {
    const colors: { [key: string]: string } = {
      generated: 'bg-blue-100 text-blue-800',
      sent: 'bg-green-100 text-green-800',
      downloaded: 'bg-purple-100 text-purple-800',
      failed: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  }

  getStatusIcon(status: string): string {
    const icons: { [key: string]: string } = {
      generated: 'description',
      sent: 'email',
      downloaded: 'download',
      failed: 'error'
    };
    return icons[status] || 'help';
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

  formatDateTime(date: Date): string {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  }

  showNotification(message: string, type: 'success' | 'error' | 'info' | 'warning'): void {
    // In a real implementation, this would show a toast notification
    console.log(`${type.toUpperCase()}: ${message}`);
  }

  getTotalDeductions(payslip: Payslip): number {
    return payslip.deductions.tax + payslip.deductions.insurance + 
           payslip.deductions.retirement + payslip.deductions.other;
  }

  getTotalAllowances(payslip: Payslip): number {
    return payslip.allowances.transportation + payslip.allowances.meal + 
           payslip.allowances.housing + payslip.allowances.other;
  }

  isDoleCompliant(payslip: Payslip): boolean {
    // In a real implementation, this would check DOLE compliance rules
    return payslip.doleCompliant;
  }

  getCurrentDate(): Date {
    return new Date();
  }
}
