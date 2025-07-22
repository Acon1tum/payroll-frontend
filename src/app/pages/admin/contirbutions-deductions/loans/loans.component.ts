import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SidebarComponent } from "../../../../shared/sidebar/sidebar.component";
import { HeaderComponent } from "../../../../shared/header/header.component";

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
}

export interface LoanRepayment {
  loanId: string;
  cutoff: string; // e.g., '2024-07-31'
  amountPaid: number;
  balance: number;
}

@Component({
  selector: 'app-loans',
  templateUrl: './loans.component.html',
  styleUrl: './loans.component.scss',
  imports: [CommonModule, SidebarComponent, HeaderComponent]
})
export class LoansComponent {
  loans: Loan[] = [];
  repayments: LoanRepayment[] = [];

  // UI state for tabs
  selectedTab: 'register' | 'track' = 'register';

  // Methods for CRUD and tracking will be implemented next
}
