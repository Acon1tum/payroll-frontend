import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SidebarComponent } from "../../../../shared/sidebar/sidebar.component";
import { HeaderComponent } from "../../../../shared/header/header.component";

export interface PayrollSummary {
  employeeId: string;
  employeeName: string;
  period: string; // e.g., '2024-07', '2024'
  grossPay: number;
  totalDeductions: number;
  netPay: number;
  ytdGross: number;
  ytdDeductions: number;
  ytdNet: number;
}

@Component({
  selector: 'app-payroll-summary',
  templateUrl: './payroll-summary.component.html',
  styleUrl: './payroll-summary.component.scss',
  imports: [CommonModule, FormsModule, SidebarComponent, HeaderComponent]
})
export class PayrollSummaryComponent {
  summaries: PayrollSummary[] = [];
  filter: { employee?: string; period?: string } = {};

  filterSummaries() {
    // Implement filtering logic here
  }

  exportSummaries() {
    // Implement export logic here
  }
}
