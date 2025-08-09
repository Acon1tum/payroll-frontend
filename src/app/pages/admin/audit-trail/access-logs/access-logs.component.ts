import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SidebarComponent } from "../../../../shared/sidebar/sidebar.component";
import { HeaderComponent } from "../../../../shared/header/header.component";

export interface AccessLog {
  id: string;
  user: string;
  action: 'login' | 'logout' | 'data-access';
  ip: string;
  recordType?: string;
  recordId?: string;
  timestamp: Date;
  status?: 'success' | 'failed';
}

@Component({
  selector: 'app-access-logs',
  templateUrl: './access-logs.component.html',
  styleUrl: './access-logs.component.scss',
  imports: [CommonModule, FormsModule, SidebarComponent, HeaderComponent]
})
export class AccessLogsComponent {
  logs: AccessLog[] = [
    { id: 'AL-001', user: 'admin@company.com', action: 'login', ip: '192.168.1.10', timestamp: new Date(), status: 'success' },
    { id: 'AL-002', user: 'hr@company.com', action: 'data-access', ip: '192.168.1.21', recordType: 'Employee', recordId: 'EMP-1001', timestamp: new Date(Date.now() - 1000*60*15), status: 'success' },
    { id: 'AL-003', user: 'payroll@company.com', action: 'logout', ip: '192.168.1.30', timestamp: new Date(Date.now() - 1000*60*60), status: 'success' },
    { id: 'AL-004', user: 'user@company.com', action: 'login', ip: '203.110.10.5', timestamp: new Date(Date.now() - 1000*60*60*6), status: 'failed' },
    { id: 'AL-005', user: 'admin@company.com', action: 'data-access', ip: '192.168.1.10', recordType: 'Payslip', recordId: 'PS-2025-06-1001', timestamp: new Date(Date.now() - 1000*60*60*24), status: 'success' },
  ];
  filtered: AccessLog[] = [...this.logs];
  filter: { user?: string; action?: string; ip?: string; date?: string } = {};

  filterLogs() {
    const userTerm = (this.filter.user || '').toLowerCase().trim();
    const action = (this.filter.action || '').toLowerCase().trim();
    const ipTerm = (this.filter.ip || '').toLowerCase().trim();
    const dateStr = (this.filter.date || '').trim();
    this.filtered = this.logs.filter(l => {
      const okUser = !userTerm || l.user.toLowerCase().includes(userTerm);
      const okAction = !action || l.action === action;
      const okIp = !ipTerm || l.ip.toLowerCase().includes(ipTerm);
      const okDate = !dateStr || new Date(l.timestamp).toISOString().slice(0,10) === dateStr;
      return okUser && okAction && okIp && okDate;
    });
  }

  exportCsv() {
    const rows = [
      ['ID','User','Action','IP','Record Type','Record ID','Status','Timestamp'],
      ...this.filtered.map(l => [l.id, l.user, l.action, l.ip, l.recordType || '', l.recordId || '', l.status || '', l.timestamp.toISOString()])
    ];
    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'access-logs.csv';
    a.click();
    URL.revokeObjectURL(url);
  }
}
