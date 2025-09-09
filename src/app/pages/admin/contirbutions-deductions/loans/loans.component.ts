import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SidebarComponent } from "../../../../shared/sidebar/sidebar.component";
import { HeaderComponent } from "../../../../shared/header/header.component";
import { LoanService, Loan, LoanPayment, UpdateLoanStatus } from '../../../../services/loan.service';

export interface LoanRepayment {
  loanId: string;
  cutoff: string; // e.g., '2024-07-31'
  amountPaid: number;
  balance: number;
}

interface Breadcrumb {
  label: string;
  path?: string;
  active?: boolean;
}

@Component({
  selector: 'app-loans',
  templateUrl: './loans.component.html',
  styleUrl: './loans.component.scss',
  imports: [CommonModule, FormsModule, SidebarComponent, HeaderComponent]
})
export class LoansComponent implements OnInit {
  loans: Loan[] = [];
  repayments: LoanRepayment[] = [];
  isLoading = false;
  errorMessage = '';

  // UI state for tabs
  selectedTab: 'register' | 'track' = 'register';
  
  // Dropdown state
  openDropdownIndex: number | null = null;

  // Breadcrumbs for header
  breadcrumbs: Breadcrumb[] = [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Contributions & Deductions', path: '/admin/contributions-deductions' },
    { label: 'Loans', active: true }
  ];

  // Modals
  showLoanModal = false;
  loanEditIndex: number | null = null;
  loanForm: { id?: string; employeeId: string; loanType: string; principal: number | null; interestRate: number | null; termMonths: number | null; startDate: string; paymentSchedule: 'monthly' | 'semiMonthly'; autoDeduct: boolean; remarks?: string; installment?: number | null } = {
    employeeId: '', loanType: 'multiPurpose', principal: null, interestRate: null, termMonths: null, startDate: '', paymentSchedule: 'monthly', autoDeduct: true, remarks: '', installment: null
  };

  // Confirmation
  showConfirmModal = false;
  confirmTitle = '';
  confirmMessage = '';
  private pendingAction: (() => void) | null = null;

  constructor(private loanService: LoanService) {}

  ngOnInit(): void {
    this.loadLoans();
  }

  async loadLoans(): Promise<void> {
    this.isLoading = true;
    this.errorMessage = '';

    try {
      const response = await this.loanService.getAllLoans().toPromise();
      if (response && response.data) {
        this.loans = response.data;
      }
    } catch (error: any) {
      console.error('Error loading loans:', error);
      this.errorMessage = 'Failed to load loans. Please try again.';
    } finally {
      this.isLoading = false;
    }
  }

  // ----- Loan CRUD -----
  openAddLoan(): void {
    this.loanEditIndex = null;
    this.loanForm = { employeeId: '', loanType: 'multiPurpose', principal: null, interestRate: null, termMonths: null, startDate: '', paymentSchedule: 'monthly', autoDeduct: true, remarks: '', installment: null };
    this.showLoanModal = true;
  }

  openEditLoan(index: number): void {
    const l = this.loans[index];
    this.loanEditIndex = index;
    this.loanForm = {
      id: l.id,
      employeeId: l.employeeId || '',
      loanType: l.type,
      principal: l.principal,
      interestRate: 0,
      termMonths: (l as any).termMonths || 0,
      startDate: new Date(l.startDate).toISOString().split('T')[0],
      paymentSchedule: (l as any).paymentSchedule || 'monthly',
      autoDeduct: true, // Default value since not in interface
      remarks: l.remarks || '',
      installment: l.installment
    } as any;
    this.showLoanModal = true;
  }

  closeLoanModal(): void {
    this.showLoanModal = false;
  }

  async saveLoan(): Promise<void> {
    try {
      this.isLoading = true;
      this.errorMessage = '';

      const loanData = {
        type: this.loanForm.loanType as 'multiPurpose' | 'policy' | 'consolidated' | 'custom',
        principal: Number(this.loanForm.principal || 0),
        installment: Number(this.loanForm.installment || 0),
        termMonths: Number(this.loanForm.termMonths || 0),
        paymentSchedule: this.loanForm.paymentSchedule,
        startDate: this.loanForm.startDate || new Date().toISOString(),
        endDate: undefined,
        remarks: this.loanForm.remarks
      };

      if (this.loanEditIndex == null) {
        // Create new loan
        const createData = {
          ...loanData,
          employeeId: this.loanForm.employeeId
        };
        const response = await this.loanService.createLoan(createData).toPromise();
        if (response && response.message) {
          // Reload loans to get updated data
          await this.loadLoans();
        }
      } else {
        // Update existing loan
        const loanId = this.loans[this.loanEditIndex].id;
        const response = await this.loanService.updateLoan(loanId, loanData).toPromise();
        if (response && response.message) {
          // Reload loans to get updated data
          await this.loadLoans();
        }
      }
      
      this.closeLoanModal();
    } catch (error: any) {
      console.error('Error saving loan:', error);
      this.errorMessage = 'Failed to save loan. Please try again.';
    } finally {
      this.isLoading = false;
    }
  }

  confirmDeleteLoan(index: number): void {
    const loan = this.loans[index];
    if (!loan) return;
    
    this.openConfirm('Delete Loan', `Are you sure you want to delete loan ${loan.id} for employee ${loan.employee?.employeeNumber || loan.employeeId}?`, async () => {
      try {
        this.isLoading = true;
        const response = await this.loanService.deleteLoan(loan.id).toPromise();
        if (response && response.message) {
          // Reload loans to get updated data
          await this.loadLoans();
        }
      } catch (error) {
        console.error('Error deleting loan:', error);
        this.errorMessage = 'Failed to delete loan. Please try again.';
      } finally {
        this.isLoading = false;
      }
    });
  }

  async approveLoan(index: number): Promise<void> {
    const loan = this.loans[index];
    if (!loan) return;
    
    this.openConfirm('Approve Loan', `Approve loan ${loan.id} for employee ${loan.employee?.employeeNumber || loan.employeeId}?`, async () => {
      try {
        this.isLoading = true;
        const response = await this.loanService.updateLoanStatus(loan.id, { status: 'active' }).toPromise();
        if (response && response.message) {
          this.loans[index] = { ...loan, status: 'active' };
          // Reload loans to get updated data
          await this.loadLoans();
        }
      } catch (error) {
        console.error('Error approving loan:', error);
        this.errorMessage = 'Failed to approve loan. Please try again.';
      } finally {
        this.isLoading = false;
      }
    });
  }

  async rejectLoan(index: number): Promise<void> {
    const loan = this.loans[index];
    if (!loan) return;
    
    this.openConfirm('Reject Loan', `Reject loan ${loan.id} for employee ${loan.employee?.employeeNumber || loan.employeeId}?`, async () => {
      try {
        this.isLoading = true;
        const response = await this.loanService.updateLoanStatus(loan.id, { status: 'rejected' }).toPromise();
        if (response && response.message) {
          this.loans[index] = { ...loan, status: 'rejected' };
          // Reload loans to get updated data
          await this.loadLoans();
        }
      } catch (error) {
        console.error('Error rejecting loan:', error);
        this.errorMessage = 'Failed to reject loan. Please try again.';
      } finally {
        this.isLoading = false;
      }
    });
  }

  // ----- Confirm helpers -----
  private openConfirm(title: string, message: string, action: () => void): void {
    this.confirmTitle = title;
    this.confirmMessage = message;
    this.pendingAction = action;
    this.showConfirmModal = true;
  }
  confirmNo(): void {
    this.showConfirmModal = false;
    this.pendingAction = null;
  }
  confirmYes(): void {
    const action = this.pendingAction;
    this.showConfirmModal = false;
    this.pendingAction = null;
    action && action();
  }

  // Helper methods
  formatCurrency(amount: number): string {
    return this.loanService.formatCurrency(amount);
  }

  getLoanTypeDisplayName(type: string): string {
    return this.loanService.getLoanTypeDisplayName(type);
  }

  getStatusDisplayName(status: string): string {
    return this.loanService.getStatusDisplayName(status);
  }

  getStatusColor(status: string): string {
    return this.loanService.getStatusColor(status);
  }

  // Get employee name for display
  getEmployeeName(loan: Loan): string {
    if (loan.employee) {
      return `${loan.employee.firstName} ${loan.employee.lastName}`;
    }
    return loan.employeeId || 'Unknown Employee';
  }

  // Get employee number for display
  getEmployeeNumber(loan: Loan): string {
    return loan.employee?.employeeNumber || loan.employeeId || 'N/A';
  }

  // ----- Dropdown methods -----
  toggleDropdown(index: number): void {
    this.openDropdownIndex = this.openDropdownIndex === index ? null : index;
  }

  closeDropdown(): void {
    this.openDropdownIndex = null;
  }
}