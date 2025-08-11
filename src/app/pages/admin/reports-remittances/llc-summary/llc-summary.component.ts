import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SidebarComponent } from "../../../../shared/sidebar/sidebar.component";
import { HeaderComponent } from "../../../../shared/header/header.component";

export interface LlcSummary {
  employeeId: string;
  employeeName: string;
  period: string; // e.g., '2024-07', '2024'
  totalLoans: number;
  totalLeaves: number;
  totalContributions: number;
}

interface Breadcrumb {
  label: string;
  path?: string;
  active?: boolean;
}

@Component({
  selector: 'app-llc-summary',
  templateUrl: './llc-summary.component.html',
  styleUrl: './llc-summary.component.scss',
  imports: [CommonModule, FormsModule, SidebarComponent, HeaderComponent]
})
export class LlcSummaryComponent {
  summaries: LlcSummary[] = [
    { employeeId: 'EMP-1001', employeeName: 'Juan Dela Cruz', period: '2025-06', totalLoans: 8000, totalLeaves: 5, totalContributions: 4200 },
    { employeeId: 'EMP-1002', employeeName: 'Maria Santos', period: '2025-06', totalLoans: 0, totalLeaves: 2, totalContributions: 4100 },
  ];
  filtered: LlcSummary[] = [...this.summaries];
  filter: { employee?: string; period?: string } = {};

  // Breadcrumbs for header
  breadcrumbs: Breadcrumb[] = [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Reports & Remittances', path: '/admin/reports-remittances' },
    { label: 'Loans, Leaves, Contributions Summary', active: true }
  ];  

  filterSummaries() {
    const term = (this.filter.employee || '').toLowerCase().trim();
    const period = (this.filter.period || '').toLowerCase().trim();
    this.filtered = this.summaries.filter(s => {
      const emp = `${s.employeeName} ${s.employeeId}`.toLowerCase();
      const okEmp = !term || emp.includes(term);
      const okPeriod = !period || s.period.toLowerCase().startsWith(period);
      return okEmp && okPeriod;
    });
  }

  exportSummaries() {
    const rows = [
      ['Employee ID','Employee Name','Period','Total Loans','Total Leaves','Total Contributions'],
      ...this.filtered.map(s => [s.employeeId, s.employeeName, s.period, s.totalLoans, s.totalLeaves, s.totalContributions])
    ];
    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'llc-summary.csv';
    a.click();
    URL.revokeObjectURL(url);
  }
}
