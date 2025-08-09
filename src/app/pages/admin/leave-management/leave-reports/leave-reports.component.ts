import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SidebarComponent } from "../../../../shared/sidebar/sidebar.component";
import { HeaderComponent } from "../../../../shared/header/header.component";

export interface LeaveReport {
  employeeId: string;
  employeeName: string;
  department: string;
  leaveType: string;
  totalUsed: number;
  remaining: number;
  period: string; // e.g., '2024', '2024-07'
}

@Component({
  selector: 'app-leave-reports',
  templateUrl: './leave-reports.component.html',
  styleUrl: './leave-reports.component.scss',
  imports: [CommonModule, FormsModule, SidebarComponent, HeaderComponent]
})
export class LeaveReportsComponent {
  reports: LeaveReport[] = [
    { employeeId: 'EMP-1001', employeeName: 'Juan Dela Cruz', department: 'Engineering', leaveType: 'Vacation Leave', period: '2025', totalUsed: 5, remaining: 10 },
    { employeeId: 'EMP-1002', employeeName: 'Maria Santos', department: 'HR', leaveType: 'Sick Leave', period: '2025-06', totalUsed: 2, remaining: 8 },
  ];
  filter: { employee?: string; department?: string; leaveType?: string; period?: string } = {};

  filterReports() {
    // Implement filtering logic here
  }

  exportReports() {
    const rows = [
      ['Employee ID','Employee Name','Department','Leave Type','Period','Total Used','Remaining'],
      ...this.reports.map(r => [r.employeeId, r.employeeName, r.department, r.leaveType, r.period, String(r.totalUsed), String(r.remaining)])
    ];
    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'leave-reports.csv';
    a.click();
    URL.revokeObjectURL(url);
  }
}
