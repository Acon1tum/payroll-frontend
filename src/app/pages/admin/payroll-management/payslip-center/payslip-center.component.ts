import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { HeaderComponent } from '../../../../shared/header/header.component';
import { SidebarComponent } from '../../../../shared/sidebar/sidebar.component';
import { PayrollService, PayrollRun, PayrollReview, PayrollRegister, PayslipReviewItem, Payslip, PayslipItem } from '../../../../services/payroll.service';

interface Breadcrumb {
  label: string;
  path?: string;
  active?: boolean;
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
  
  // Breadcrumbs for header
  breadcrumbs: Breadcrumb[] = [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Payroll Management', path: '/admin/payroll-management' },
    { label: 'Payslip Center', active: true }
  ];
  
  // Payslip data
  payslips: Payslip[] = [];
  filteredPayslips: Payslip[] = [];
  selectedPayslips: string[] = [];
  
  // Modal data
  selectedPayslipForView: Payslip | null = null;
  showPayslipModal = false;
  
  
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
    private router: Router,
    private payrollService: PayrollService
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
    this.payrollService.getPayslips({ limit: 100 }).subscribe({
      next: (response) => {
        if (response.success) {
          this.payslips = response.data;
          this.filteredPayslips = [...this.payslips];
          this.extractFilterOptions();
        }
      },
      error: (error) => {
        console.error('Error loading payslips:', error);
        this.showNotification('Error loading payslips', 'error');
        // Fallback to sample data if API fails
        this.loadSamplePayslips();
      }
    });
  }

  loadSamplePayslips(): void {
    // Sample payslip data as fallback
    this.payslips = [
      {
        id: '1',
        payrollRunId: 'run1',
        employeeId: 'EMP001',
        grossPay: 4800,
        totalDeductions: 1680,
        netPay: 3120,
        createdAt: new Date(2024, 0, 31).toISOString(),
        employee: {
          id: 'emp1',
          employeeNumber: 'EMP001',
          firstName: 'John',
          lastName: 'Smith',
          position: 'Senior Developer',
          baseSalary: 75000,
          department: { name: 'Engineering' },
          organization: { name: 'Tech Corp' }
        },
        items: [
          { id: '1', payslipId: '1', label: 'Basic Salary', amount: 3750, type: 'earning' },
          { id: '2', payslipId: '1', label: 'Overtime Pay', amount: 281.28, type: 'earning' },
          { id: '3', payslipId: '1', label: 'Transportation Allowance', amount: 500, type: 'earning' },
          { id: '4', payslipId: '1', label: 'Meal Allowance', amount: 300, type: 'earning' },
          { id: '5', payslipId: '1', label: 'SSS Contribution', amount: 450, type: 'deduction', contributionCode: 'SSS' },
          { id: '6', payslipId: '1', label: 'PhilHealth Contribution', amount: 240, type: 'deduction', contributionCode: 'PHILHEALTH' },
          { id: '7', payslipId: '1', label: 'Pag-IBIG Contribution', amount: 100, type: 'deduction', contributionCode: 'PAGIBIG' },
          { id: '8', payslipId: '1', label: 'Withholding Tax', amount: 890, type: 'deduction', contributionCode: 'BIR' }
        ]
      },
      {
        id: '2',
        payrollRunId: 'run1',
        employeeId: 'EMP002',
        grossPay: 4200,
        totalDeductions: 1470,
        netPay: 2730,
        createdAt: new Date(2024, 0, 31).toISOString(),
        employee: {
          id: 'emp2',
          employeeNumber: 'EMP002',
          firstName: 'Sarah',
          lastName: 'Johnson',
          position: 'Marketing Manager',
          baseSalary: 65000,
          department: { name: 'Marketing' },
          organization: { name: 'Tech Corp' }
        },
        items: [
          { id: '9', payslipId: '2', label: 'Basic Salary', amount: 3250, type: 'earning' },
          { id: '10', payslipId: '2', label: 'Overtime Pay', amount: 122.08, type: 'earning' },
          { id: '11', payslipId: '2', label: 'Transportation Allowance', amount: 500, type: 'earning' },
          { id: '12', payslipId: '2', label: 'Meal Allowance', amount: 300, type: 'earning' },
          { id: '13', payslipId: '2', label: 'SSS Contribution', amount: 390, type: 'deduction', contributionCode: 'SSS' },
          { id: '14', payslipId: '2', label: 'PhilHealth Contribution', amount: 210, type: 'deduction', contributionCode: 'PHILHEALTH' },
          { id: '15', payslipId: '2', label: 'Pag-IBIG Contribution', amount: 100, type: 'deduction', contributionCode: 'PAGIBIG' },
          { id: '16', payslipId: '2', label: 'Withholding Tax', amount: 770, type: 'deduction', contributionCode: 'BIR' }
        ]
      },
      {
        id: '3',
        payrollRunId: 'run1',
        employeeId: 'EMP003',
        grossPay: 3800,
        totalDeductions: 1330,
        netPay: 2470,
        createdAt: new Date(2024, 0, 31).toISOString(),
        employee: {
          id: 'emp3',
          employeeNumber: 'EMP003',
          firstName: 'Michael',
          lastName: 'Brown',
          position: 'Sales Representative',
          baseSalary: 55000,
          department: { name: 'Sales' },
          organization: { name: 'Tech Corp' }
        },
        items: [
          { id: '17', payslipId: '3', label: 'Basic Salary', amount: 2750, type: 'earning' },
          { id: '18', payslipId: '3', label: 'Overtime Pay', amount: 317.28, type: 'earning' },
          { id: '19', payslipId: '3', label: 'Transportation Allowance', amount: 500, type: 'earning' },
          { id: '20', payslipId: '3', label: 'Meal Allowance', amount: 300, type: 'earning' },
          { id: '21', payslipId: '3', label: 'SSS Contribution', amount: 330, type: 'deduction', contributionCode: 'SSS' },
          { id: '22', payslipId: '3', label: 'PhilHealth Contribution', amount: 190, type: 'deduction', contributionCode: 'PHILHEALTH' },
          { id: '23', payslipId: '3', label: 'Pag-IBIG Contribution', amount: 100, type: 'deduction', contributionCode: 'PAGIBIG' },
          { id: '24', payslipId: '3', label: 'Withholding Tax', amount: 710, type: 'deduction', contributionCode: 'BIR' }
        ]
      }
    ];

    this.filteredPayslips = [...this.payslips];
    this.extractFilterOptions();
  }

  extractFilterOptions(): void {
    // Extract unique departments from payslips
    this.availableDepartments = [...new Set(this.payslips.map(p => p.employee?.department?.name || 'N/A'))];
    
    // For now, we'll use sample payroll periods since we removed payroll runs
    this.availablePayrollPeriods = [
      'Jan 1, 2024 - Jan 31, 2024',
      'Dec 1, 2023 - Dec 31, 2023',
      'Feb 1, 2024 - Feb 29, 2024'
    ];
  }

  setupFilterListeners(): void {
    this.filterForm.valueChanges.subscribe(() => {
      this.applyFilters();
    });
  }

  applyFilters(): void {
    const filters = this.filterForm.value;
    
    this.filteredPayslips = this.payslips.filter(payslip => {
      // Simple period matching since we removed payroll runs
      const periodMatch = !filters.payrollPeriod || 
        filters.payrollPeriod === 'Jan 1, 2024 - Jan 31, 2024'; // Default to January 2024
      
      const departmentMatch = !filters.department || 
        (payslip.employee?.department?.name || 'N/A') === filters.department;
      
      // For now, we'll use a simple status based on whether payslip is released
      const statusMatch = !filters.status || 
        (filters.status === 'generated' && !payslip.releasedAt) ||
        (filters.status === 'sent' && payslip.releasedAt) ||
        (filters.status === 'downloaded' && payslip.pdfUrl) ||
        (filters.status === 'failed' && !payslip.pdfUrl && payslip.releasedAt);
      
      const nameMatch = !filters.employeeName || 
        `${payslip.employee?.firstName || ''} ${payslip.employee?.lastName || ''}`.toLowerCase().includes(filters.employeeName.toLowerCase());
      
      return periodMatch && departmentMatch && statusMatch && nameMatch;
    });

    this.updateBulkSelection();
  }

  togglePayslipSelection(payslipId: string): void {
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
    const employeeName = `${payslip.employee?.firstName} ${payslip.employee?.lastName}`;
    
    this.payrollService.generatePayslipPDF(payslip.id).subscribe({
      next: (blob) => {
        const filename = `payslip-${payslip.employee?.employeeNumber}-${this.formatPayrollDate(new Date())}.pdf`;
        this.payrollService.downloadFile(blob, filename);
        this.showNotification(`Payslip for ${employeeName} downloaded successfully`, 'success');
      },
      error: (error) => {
        console.error('Error downloading payslip:', error);
        this.showNotification(`Error downloading payslip for ${employeeName}`, 'error');
      }
    });
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
    // For now, just switch to resend tab with the payslip
    this.selectedPayslipsForResend = [payslip as any];
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
        this.resendInProgress = false;
        this.selectedPayslipsForResend = [];
        this.activeTab = 'view-download';
        
        this.showNotification(`Payslips sent successfully to ${this.selectedPayslipsForResend.length} employees`, 'success');
      }, 2000);
    }
  }

  viewPayslip(payslip: Payslip): void {
    this.selectedPayslipForView = payslip;
    this.showPayslipModal = true;
  }

  closePayslipModal(): void {
    this.showPayslipModal = false;
    this.selectedPayslipForView = null;
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


  getCurrentDate(): Date {
    return new Date();
  }


  // ==================== PAYSLIP MODAL METHODS ====================

  getPayslipStatus(payslip: Payslip): string {
    if (payslip.pdfUrl) return 'downloaded';
    if (payslip.releasedAt) return 'sent';
    return 'generated';
  }

  getPayslipStatusColor(payslip: Payslip): string {
    const status = this.getPayslipStatus(payslip);
    return this.getStatusColor(status);
  }

  getPayslipStatusIcon(payslip: Payslip): string {
    const status = this.getPayslipStatus(payslip);
    return this.getStatusIcon(status);
  }

  getEarningsForPayslip(payslip: Payslip): PayslipItem[] {
    return payslip.items?.filter(item => item.type === 'earning') || [];
  }

  getDeductionsForPayslip(payslip: Payslip): PayslipItem[] {
    return payslip.items?.filter(item => item.type === 'deduction') || [];
  }

  getTotalEarnings(payslip: Payslip): number {
    return this.getEarningsForPayslip(payslip).reduce((sum, item) => sum + item.amount, 0);
  }

  getTotalDeductions(payslip: Payslip): number {
    return this.getDeductionsForPayslip(payslip).reduce((sum, item) => sum + item.amount, 0);
  }


  getContributionAmount(payslip: Payslip, code: string): number {
    const item = payslip.items?.find(i => i.contributionCode === code);
    return item ? item.amount : 0;
  }

  // ==================== HELPER METHODS FOR TEMPLATE ====================

  getPayrollRunForPayslip(payslip: Payslip): any {
    // Return a mock payroll run since we removed the payroll runs functionality
    return {
      id: payslip.payrollRunId,
      periodStart: new Date(2024, 0, 1),
      periodEnd: new Date(2024, 0, 31)
    };
  }

  formatCurrency(amount: number): string {
    return this.payrollService.formatCurrency(amount);
  }

  formatPayrollDate(date: string | Date): string {
    return this.payrollService.formatDate(date);
  }

  formatPayrollDateTime(date: string | Date): string {
    return this.payrollService.formatDateTime(date);
  }
}
