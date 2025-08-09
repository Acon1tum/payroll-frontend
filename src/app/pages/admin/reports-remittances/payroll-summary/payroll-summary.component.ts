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
  summaries: PayrollSummary[] = [
    { employeeId: 'EMP-1001', employeeName: 'Juan Dela Cruz', period: '2025-06', grossPay: 35000, totalDeductions: 5000, netPay: 30000, ytdGross: 210000, ytdDeductions: 30000, ytdNet: 180000 },
    { employeeId: 'EMP-1002', employeeName: 'Maria Santos', period: '2025-06', grossPay: 42000, totalDeductions: 6500, netPay: 35500, ytdGross: 252000, ytdDeductions: 39000, ytdNet: 213000 },
    { employeeId: 'EMP-1003', employeeName: 'Pedro Ramirez', period: '2025-05', grossPay: 30000, totalDeductions: 4500, netPay: 25500, ytdGross: 180000, ytdDeductions: 27000, ytdNet: 153000 },
  ];
  filtered: PayrollSummary[] = [...this.summaries];
  filter: { employee?: string; period?: string } = {};

  filterSummaries() {
    const nameOrId = (this.filter.employee || '').toLowerCase().trim();
    const period = (this.filter.period || '').toLowerCase().trim();
    this.filtered = this.summaries.filter(s => {
      const matchesEmp = !nameOrId || s.employeeName.toLowerCase().includes(nameOrId) || s.employeeId.toLowerCase().includes(nameOrId);
      const matchesPeriod = !period || s.period.toLowerCase().startsWith(period);
      return matchesEmp && matchesPeriod;
    });
  }

  exportSummaries() {
    const rows = [
      ['Employee ID','Employee Name','Period','Gross','Deductions','Net','YTD Gross','YTD Deductions','YTD Net'],
      ...this.filtered.map(s => [s.employeeId, s.employeeName, s.period, s.grossPay, s.totalDeductions, s.netPay, s.ytdGross, s.ytdDeductions, s.ytdNet])
    ];
    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'payroll-summary.csv';
    a.click();
    URL.revokeObjectURL(url);
  }
}
