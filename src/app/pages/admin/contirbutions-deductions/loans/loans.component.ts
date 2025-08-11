import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SidebarComponent } from "../../../../shared/sidebar/sidebar.component";
import { HeaderComponent } from "../../../../shared/header/header.component";
import { DummyDataService } from '../../../../services/dummy-data.service';

export interface Loan {
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
  status?: 'pending' | 'approved' | 'rejected';
}

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

  // UI state for tabs
  selectedTab: 'register' | 'track' = 'register';

  // Breadcrumbs for header
  breadcrumbs: Breadcrumb[] = [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Contributions & Deductions', path: '/admin/contributions-deductions' },
    { label: 'Loans', active: true }
  ];

  // Modals
  showLoanModal = false;
  loanEditIndex: number | null = null;
  loanForm: { id?: string; employeeId: string; loanType: string; principal: number | null; interestRate: number | null; termMonths: number | null; startDate: string; paymentSchedule: 'monthly' | 'semi-monthly'; autoDeduct: boolean; remarks?: string } = {
    employeeId: '', loanType: 'multiPurpose', principal: null, interestRate: null, termMonths: null, startDate: '', paymentSchedule: 'monthly', autoDeduct: true, remarks: ''
  };

  // Confirmation
  showConfirmModal = false;
  confirmTitle = '';
  confirmMessage = '';
  private pendingAction: (() => void) | null = null;

  constructor(private dummy: DummyDataService) {}

  ngOnInit(): void {
    // Load dummy data and default to pending status if not set
    this.loans = this.dummy.getLoans().map(l => ({ ...l, status: (l as any).status || 'pending' }));
    this.repayments = this.dummy.getLoanRepayments();
  }

  // ----- Loan CRUD -----
  openAddLoan(): void {
    this.loanEditIndex = null;
    this.loanForm = { employeeId: '', loanType: 'multiPurpose', principal: null, interestRate: null, termMonths: null, startDate: '', paymentSchedule: 'monthly', autoDeduct: true, remarks: '' };
    this.showLoanModal = true;
  }

  openEditLoan(index: number): void {
    const l = this.loans[index];
    this.loanEditIndex = index;
    this.loanForm = {
      id: l.id,
      employeeId: l.employeeId,
      loanType: l.loanType,
      principal: l.principal,
      interestRate: l.interestRate,
      termMonths: l.termMonths,
      startDate: new Date(l.startDate).toISOString().split('T')[0],
      paymentSchedule: l.paymentSchedule,
      autoDeduct: l.autoDeduct,
      remarks: l.remarks || ''
    } as any;
    this.showLoanModal = true;
  }

  closeLoanModal(): void {
    this.showLoanModal = false;
  }

  saveLoan(): void {
    const item: Loan = {
      id: this.loanForm.id || `LN${Date.now()}`,
      employeeId: this.loanForm.employeeId,
      loanType: this.loanForm.loanType,
      principal: Number(this.loanForm.principal || 0),
      interestRate: Number(this.loanForm.interestRate || 0),
      termMonths: Number(this.loanForm.termMonths || 0),
      startDate: new Date(this.loanForm.startDate || new Date()),
      paymentSchedule: this.loanForm.paymentSchedule,
      autoDeduct: this.loanForm.autoDeduct,
      remarks: this.loanForm.remarks,
      status: this.loanEditIndex == null ? 'pending' : (this.loans[this.loanEditIndex]?.status || 'pending')
    };
    if (this.loanEditIndex == null) {
      this.loans.push(item);
    } else {
      this.loans[this.loanEditIndex] = item;
    }
    this.closeLoanModal();
  }

  confirmDeleteLoan(index: number): void {
    this.openConfirm('Delete Loan', 'Are you sure you want to delete this loan?', () => {
      this.loans.splice(index, 1);
    });
  }

  approveLoan(index: number): void {
    const loan = this.loans[index];
    if (!loan) return;
    this.openConfirm('Approve Loan', `Approve loan ${loan.id} for employee ${loan.employeeId}?`, () => {
      this.loans[index] = { ...loan, status: 'approved' };
    });
  }

  rejectLoan(index: number): void {
    const loan = this.loans[index];
    if (!loan) return;
    this.openConfirm('Reject Loan', `Reject loan ${loan.id} for employee ${loan.employeeId}?`, () => {
      this.loans[index] = { ...loan, status: 'rejected' };
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
}
