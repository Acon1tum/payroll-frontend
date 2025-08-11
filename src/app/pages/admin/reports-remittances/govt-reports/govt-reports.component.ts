import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SidebarComponent } from "../../../../shared/sidebar/sidebar.component";
import { HeaderComponent } from "../../../../shared/header/header.component";

interface Breadcrumb {
  label: string;
  path?: string;
  active?: boolean;
}


@Component({
  selector: 'app-govt-reports',
  templateUrl: './govt-reports.component.html',
  styleUrl: './govt-reports.component.scss',
  imports: [CommonModule, FormsModule, SidebarComponent, HeaderComponent]
})

export class GovtReportsComponent {
  selectedReport: 'bir2316' | 'sssR3' | 'sssR5' | 'rf1' | 'm11' = 'bir2316';
  period: string = '';

  // Breadcrumbs for header
  breadcrumbs: Breadcrumb[] = [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Reports & Remittances', path: '/admin/reports-remittances' },
    { label: 'Government Reports', active: true }
  ];

  exportReport() {
    const rows: (string|number)[][] = [
      ['Report','Period','Field 1','Field 2']
    ];
    switch (this.selectedReport) {
      case 'bir2316': rows.push(['BIR 2316', this.period || '2025', 'Employee Records', 'Annual Income']); break;
      case 'sssR3': rows.push(['SSS R3', this.period || '2025-06', 'Monthly Contributions', 'Employee + Employer']); break;
      case 'sssR5': rows.push(['SSS R5', this.period || '2025-06', 'Payment Return', 'Amount Due']); break;
      case 'rf1': rows.push(['PhilHealth RF-1', this.period || '2025-06', 'Remittance Summary', 'Employee + Employer']); break;
      case 'm11': rows.push(['Pag-IBIG M1-1', this.period || '2025-06', 'Monthly Remittance', 'Member Count']); break;
    }
    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${this.selectedReport}-${(this.period||'period')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }
}
