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
  // Active loans (dummy)
  activeLoans: LoanRecord[] = [
    {
      id: 'LN-2025-001',
      loanType: 'multiPurpose',
      principal: 15000,
      balance: 9200,
      termMonths: 12,
      paymentSchedule: 'semi-monthly',
      startDate: new Date('2025-01-15'),
      monthlyAmortization: 1350,
      status: 'active'
    },
    {
      id: 'LN-2025-002',
      loanType: 'policy',
      principal: 8000,
      balance: 3200,
      termMonths: 10,
      paymentSchedule: 'monthly',
      startDate: new Date('2025-03-30'),
      monthlyAmortization: 900,
      status: 'active'
    }
  ];

  // Repayment history (dummy)
  repayments: LoanRepayment[] = [
    { loanId: 'LN-2025-001', cutoffDate: new Date('2025-06-30'), amount: 1350, principal: 1200, interest: 150, balanceAfter: 9800 },
    { loanId: 'LN-2025-001', cutoffDate: new Date('2025-06-15'), amount: 1350, principal: 1180, interest: 170, balanceAfter: 11000 },
    { loanId: 'LN-2025-002', cutoffDate: new Date('2025-06-30'), amount: 900, principal: 820, interest: 80, balanceAfter: 3600 },
  ];

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

  formatCurrency(n?: number | null): string {
    return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(n ?? 0);
  }

  downloadLoanSummary(loan: LoanRecord): void {
    const schedule = this.generateAmortizationSchedule(loan);
    const win = window.open('', '_blank', 'width=900,height=900');
    if (!win) return;
    const style = `
      <style>
        body { font-family: Arial, sans-serif; padding: 24px; color: #111827; }
        h2 { margin: 0 0 4px 0; }
        .muted { color: #6B7280; font-size: 12px; }
        table { width: 100%; border-collapse: collapse; margin-top: 16px; }
        th, td { text-align: left; padding: 8px; border-bottom: 1px solid #E5E7EB; }
        .right { text-align: right; }
        .total { font-weight: 600; }
      </style>
    `;
    const rows = schedule.map(r => `
      <tr>
        <td>${r.period}</td>
        <td>${new Date(r.dueDate).toDateString()}</td>
        <td class="right">${this.formatCurrency(r.amount)}</td>
        <td class="right">${this.formatCurrency(r.principal)}</td>
        <td class="right">${this.formatCurrency(r.interest)}</td>
        <td class="right">${this.formatCurrency(r.balance)}</td>
      </tr>
    `).join('');
    const html = `
      <html>
        <head><title>Loan Summary ${loan.id}</title>${style}</head>
        <body>
          <h2>Loan Amortization Summary</h2>
          <div class="muted">Reference: ${loan.id} • Type: ${loan.loanType} • Term: ${loan.termMonths} months • Start: ${loan.startDate.toDateString()}</div>
          <table>
            <thead>
              <tr>
                <th>Period</th>
                <th>Due Date</th>
                <th class="right">Payment</th>
                <th class="right">Principal</th>
                <th class="right">Interest</th>
                <th class="right">Balance</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
          <script>window.onload = () => window.print();</script>
        </body>
      </html>
    `;
    win.document.open();
    win.document.write(html);
    win.document.close();
  }

  private generateAmortizationSchedule(loan: LoanRecord): Array<{ period: number; dueDate: Date; amount: number; principal: number; interest: number; balance: number }>{
    const monthlyRate = 0.01; // 1% monthly mock rate
    const schedule = [] as Array<{ period: number; dueDate: Date; amount: number; principal: number; interest: number; balance: number }>;
    let balance = loan.principal;
    let current = new Date(loan.startDate);
    for (let i = 1; i <= loan.termMonths; i++) {
      const interest = Math.max(0, balance * monthlyRate);
      const amount = loan.monthlyAmortization;
      const principal = Math.max(0, amount - interest);
      balance = Math.max(0, balance - principal);
      const dueDate = new Date(current);
      // add one month
      current = new Date(current.getFullYear(), current.getMonth() + 1, current.getDate());
      schedule.push({ period: i, dueDate, amount, principal, interest, balance });
      if (balance <= 0) break;
    }
    return schedule;
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

interface LoanRecord {
  id: string;
  loanType: 'multiPurpose' | 'policy' | 'consolidated' | 'custom';
  principal: number;
  balance: number;
  termMonths: number;
  paymentSchedule: 'monthly' | 'semi-monthly';
  startDate: Date;
  monthlyAmortization: number;
  status: 'active' | 'closed';
}

interface LoanRepayment {
  loanId: string;
  cutoffDate: Date;
  amount: number;
  principal: number;
  interest: number;
  balanceAfter: number;
}

