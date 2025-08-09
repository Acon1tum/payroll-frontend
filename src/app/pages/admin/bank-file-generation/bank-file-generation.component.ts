import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SidebarComponent } from "../../../shared/sidebar/sidebar.component";
import { HeaderComponent } from "../../../shared/header/header.component";

export interface BankDisbursement {
  employeeId: string;
  employeeName: string;
  accountNumber: string;
  amount: number;
  bank: 'BDO' | 'Metrobank' | 'Landbank';
}

@Component({
  selector: 'app-bank-file-generation',
  templateUrl: './bank-file-generation.component.html',
  styleUrl: './bank-file-generation.component.scss',
  imports: [CommonModule, FormsModule, SidebarComponent, HeaderComponent]
})
export class BankFileGenerationComponent {
  selectedBank: 'BDO' | 'Metrobank' | 'Landbank' = 'BDO';
  period: string = '';
  disbursements: BankDisbursement[] = [];

  // Simple dummy dataset generator
  private generateDummyDisbursements(bank: 'BDO' | 'Metrobank' | 'Landbank'): BankDisbursement[] {
    return [
      { employeeId: 'EMP-1001', employeeName: 'Juan Dela Cruz', accountNumber: '001234567890', amount: 30000, bank },
      { employeeId: 'EMP-1002', employeeName: 'Maria Santos', accountNumber: '009876543210', amount: 35500, bank },
      { employeeId: 'EMP-1003', employeeName: 'Pedro Ramirez', accountNumber: '007654321098', amount: 25500, bank },
      { employeeId: 'EMP-1004', employeeName: 'Ana Reyes', accountNumber: '003210987654', amount: 28500, bank },
      { employeeId: 'EMP-1005', employeeName: 'Jose Cruz', accountNumber: '005551234567', amount: 19875.5, bank },
    ];
  }

  previewDisbursement() {
    // In real app, fetch from backend by period and bank
    this.disbursements = this.generateDummyDisbursements(this.selectedBank);
  }

  generateBankFile() {
    if (!this.disbursements.length) {
      this.previewDisbursement();
    }
    const lines: string[] = [];
    // Very simple bank-specific headers (mock)
    if (this.selectedBank === 'BDO') {
      lines.push('HDR,BDO,BULK-PAYMENTS,' + (this.period || 'PERIOD'));
      lines.push('ACC_NO,ACCOUNT_NAME,AMOUNT');
    } else if (this.selectedBank === 'Metrobank') {
      lines.push('MHB;METROBANK PAYROLL;' + (this.period || 'PERIOD'));
      lines.push('ACCOUNT;NAME;AMOUNT');
    } else {
      lines.push('LDB|LANDBANK PAYROLL|' + (this.period || 'PERIOD'));
      lines.push('ACCOUNT|NAME|AMOUNT');
    }
    for (const d of this.disbursements) {
      const name = d.employeeName.replace(/[,;|]/g, ' ');
      if (this.selectedBank === 'BDO') {
        lines.push(`${d.accountNumber},${name},${d.amount.toFixed(2)}`);
      } else if (this.selectedBank === 'Metrobank') {
        lines.push(`${d.accountNumber};${name};${d.amount.toFixed(2)}`);
      } else {
        lines.push(`${d.accountNumber}|${name}|${d.amount.toFixed(2)}`);
      }
    }
    const content = lines.join('\n');
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const base = `${this.selectedBank}-payroll-${(this.period || 'period')}`;
    a.download = `${base}.${this.selectedBank === 'BDO' ? 'csv' : 'txt'}`;
    a.click();
    URL.revokeObjectURL(url);
  }
}
