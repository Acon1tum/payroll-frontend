import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HeaderComponent } from '../../../shared/header/header.component';
import { SidebarComponent } from '../../../shared/sidebar/sidebar.component';

@Component({
  selector: 'app-request-loan',
  imports: [CommonModule, FormsModule, HeaderComponent, SidebarComponent],
  templateUrl: './request-loan.component.html',
  styleUrl: './request-loan.component.scss'
})
export class RequestLoanComponent {
  // Table data (dummy)
  loanRequests: LoanRequest[] = [
    {
      id: 'REQ-2025-0001',
      loanType: 'multiPurpose',
      amount: 15000,
      termMonths: 12,
      paymentSchedule: 'semi-monthly',
      remarks: 'Medical expenses',
      status: 'pending',
      submittedAt: new Date()
    },
    {
      id: 'REQ-2025-0002',
      loanType: 'policy',
      amount: 8000,
      termMonths: 10,
      paymentSchedule: 'monthly',
      remarks: 'Policy loan',
      status: 'approved',
      submittedAt: new Date(Date.now() - 86400000 * 10),
      decisionAt: new Date(Date.now() - 86400000 * 8),
      decisionBy: 'HR Manager'
    },
    {
      id: 'REQ-2025-0003',
      loanType: 'custom',
      amount: 5000,
      termMonths: 6,
      paymentSchedule: 'monthly',
      remarks: 'Personal',
      status: 'rejected',
      submittedAt: new Date(Date.now() - 86400000 * 20),
      decisionAt: new Date(Date.now() - 86400000 * 19),
      decisionBy: 'Payroll Manager'
    }
  ];

  // Modal state and form
  showModal = false;
  showConfirm = false;
  confirmMessage = '';
  form = {
    loanType: 'multiPurpose' as 'multiPurpose' | 'policy' | 'consolidated' | 'custom',
    amount: null as number | null,
    termMonths: null as number | null,
    paymentSchedule: 'monthly' as 'monthly' | 'semi-monthly',
    remarks: ''
  };

  openNewRequest(): void {
    this.form = { loanType: 'multiPurpose', amount: null, termMonths: null, paymentSchedule: 'monthly', remarks: '' };
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.showConfirm = false;
  }

  submit(): void {
    const amountValid = (this.form.amount || 0) > 0;
    const termValid = (this.form.termMonths || 0) > 0;
    if (!amountValid || !termValid) {
      alert('Please provide valid amount and term.');
      return;
    }
    this.confirmMessage = `Submit loan request for ${this.form.amount} over ${this.form.termMonths} month(s)?`;
    this.showConfirm = true;
  }

  cancelConfirm(): void { this.showConfirm = false; }

  confirmSubmit(): void {
    // Add to the table
    const newReq: LoanRequest = {
      id: `REQ-${new Date().getFullYear()}-${(Math.floor(Math.random() * 9000) + 1000).toString().padStart(4, '0')}`,
      loanType: this.form.loanType,
      amount: Number(this.form.amount || 0),
      termMonths: Number(this.form.termMonths || 0),
      paymentSchedule: this.form.paymentSchedule,
      remarks: this.form.remarks,
      status: 'pending',
      submittedAt: new Date()
    };
    this.loanRequests.unshift(newReq);
    // Reset & close
    this.closeModal();
  }
}

export interface LoanRequest {
  id: string;
  loanType: 'multiPurpose' | 'policy' | 'consolidated' | 'custom';
  amount: number;
  termMonths: number;
  paymentSchedule: 'monthly' | 'semi-monthly';
  remarks?: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: Date;
  decisionAt?: Date;
  decisionBy?: string;
}

