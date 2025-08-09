import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SidebarComponent } from "../../../../shared/sidebar/sidebar.component";
import { HeaderComponent } from "../../../../shared/header/header.component";

export interface ActivityLog {
  id: string;
  user: string;
  module: string;
  action: string;
  details: string;
  date: Date;
}

@Component({
  selector: 'app-activity-logs',
  templateUrl: './activity-logs.component.html',
  styleUrl: './activity-logs.component.scss',
  imports: [CommonModule, FormsModule, SidebarComponent, HeaderComponent]
})
export class ActivityLogsComponent {
  logs: ActivityLog[] = [
    { id: 'ACT-001', user: 'admin@company.com', module: 'Payroll', action: 'Run Payroll', details: 'Run for 2025-06 period', date: new Date() },
    { id: 'ACT-002', user: 'hr@company.com', module: 'Employees', action: 'Create', details: 'Added EMP-1010', date: new Date(Date.now() - 1000*60*20) },
    { id: 'ACT-003', user: 'payroll@company.com', module: 'Deductions', action: 'Update', details: 'Updated SSS table', date: new Date(Date.now() - 1000*60*60) },
    { id: 'ACT-004', user: 'auditor@company.com', module: 'Audit', action: 'Export', details: 'Downloaded logs', date: new Date(Date.now() - 1000*60*60*24) },
  ];
  filtered: ActivityLog[] = [...this.logs];
  filter: { user?: string; module?: string; date?: string } = {};

  filterLogs() {
    const userTerm = (this.filter.user || '').toLowerCase().trim();
    const moduleTerm = (this.filter.module || '').toLowerCase().trim();
    const dateStr = (this.filter.date || '').trim();
    this.filtered = this.logs.filter(l => {
      const okUser = !userTerm || l.user.toLowerCase().includes(userTerm);
      const okModule = !moduleTerm || l.module.toLowerCase().includes(moduleTerm);
      const okDate = !dateStr || new Date(l.date).toISOString().slice(0,10) === dateStr;
      return okUser && okModule && okDate;
    });
  }

  exportCsv() {
    const rows = [
      ['ID','User','Module','Action','Details','Date'],
      ...this.filtered.map(l => [l.id, l.user, l.module, l.action, l.details, l.date.toISOString()])
    ];
    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'activity-logs.csv';
    a.click();
    URL.revokeObjectURL(url);
  }
}
