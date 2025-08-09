import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SidebarComponent } from '../../../shared/sidebar/sidebar.component';
import { HeaderComponent } from '../../../shared/header/header.component';

// Types
interface EarningsOrDeduction { label: string; amount: number }
interface Payslip {
  id: string;
  periodFrom: Date;
  periodTo: Date;
  payDate: Date;
  earnings: EarningsOrDeduction[];
  deductions: EarningsOrDeduction[];
  grossTotal: number;
  deductionsTotal: number;
  netPay: number;
}

@Component({
  selector: 'app-payslip',
  imports: [CommonModule, SidebarComponent, HeaderComponent],
  templateUrl: './payslip.component.html',
  styleUrl: './payslip.component.scss'
})
export class PayslipComponent {
  private basePayslips = [
    {
      id: 'PS-2025-07A',
      periodFrom: new Date('2025-07-01'),
      periodTo: new Date('2025-07-15'),
      payDate: new Date('2025-07-15'),
      earnings: [
        { label: 'Basic Pay', amount: 15000 },
        { label: 'Overtime', amount: 1200 },
        { label: 'Allowance', amount: 1000 },
      ] as EarningsOrDeduction[],
      deductions: [
        { label: 'SSS', amount: 450 },
        { label: 'PhilHealth', amount: 300 },
        { label: 'Pag-IBIG', amount: 200 },
        { label: 'Tax (WHT)', amount: 900 },
      ] as EarningsOrDeduction[],
    },
    {
      id: 'PS-2025-06B',
      periodFrom: new Date('2025-06-16'),
      periodTo: new Date('2025-06-30'),
      payDate: new Date('2025-06-30'),
      earnings: [
        { label: 'Basic Pay', amount: 15000 },
        { label: 'Allowance', amount: 1000 },
      ] as EarningsOrDeduction[],
      deductions: [
        { label: 'SSS', amount: 450 },
        { label: 'PhilHealth', amount: 300 },
        { label: 'Pag-IBIG', amount: 200 },
        { label: 'Tax (WHT)', amount: 850 },
      ] as EarningsOrDeduction[],
    },
  ];

  payslips: Payslip[] = this.basePayslips.map((p) => {
    const grossTotal = p.earnings.reduce((sum, e) => sum + e.amount, 0);
    const deductionsTotal = p.deductions.reduce((sum, d) => sum + d.amount, 0);
    const netPay = grossTotal - deductionsTotal;
    return { ...p, grossTotal, deductionsTotal, netPay } as Payslip;
  });

  showDetailsModal = false;
  selected: Payslip | null = null;

  formatCurrency(amount?: number | null): string {
    return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format((amount ?? 0));
  }

  openDetails(p: Payslip): void {
    this.selected = p;
    this.showDetailsModal = true;
  }

  closeDetails(): void {
    this.showDetailsModal = false;
    this.selected = null;
  }

  downloadPayslip(p: Payslip): void {
    const printWindow = window.open('', '_blank', 'width=800,height=900');
    if (!printWindow) return;
    const style = `
      <style>
        body { font-family: Arial, sans-serif; padding: 24px; color: #111827; }
        h2 { margin: 0 0 4px 0; }
        .muted { color: #6B7280; font-size: 12px; }
        table { width: 100%; border-collapse: collapse; margin-top: 16px; }
        th, td { text-align: left; padding: 8px; border-bottom: 1px solid #E5E7EB; }
        .right { text-align: right; }
        .total { font-weight: 600; }
        .net { font-size: 18px; font-weight: 700; }
      </style>
    `;
    const earningsRows = p.earnings.map((e: any) => `<tr><td>${e.label}</td><td class="right">${this.formatCurrency(e.amount)}</td></tr>`).join('');
    const deductionRows = p.deductions.map((d: any) => `<tr><td>${d.label}</td><td class="right">${this.formatCurrency(d.amount)}</td></tr>`).join('');
    const html = `
      <html>
        <head><title>Payslip ${p.id}</title>${style}</head>
        <body>
          <h2>Payslip</h2>
          <div class="muted">Reference: ${p.id}</div>
          <div class="muted">Period: ${new Date(p.periodFrom).toDateString()} - ${new Date(p.periodTo).toDateString()}</div>
          <div class="muted">Pay Date: ${new Date(p.payDate).toDateString()}</div>
          <table>
            <thead><tr><th colspan="2">Earnings</th></tr></thead>
            <tbody>
              ${earningsRows}
              <tr class="total"><td>Gross Total</td><td class="right">${this.formatCurrency(p.grossTotal)}</td></tr>
            </tbody>
          </table>
          <table>
            <thead><tr><th colspan="2">Deductions</th></tr></thead>
            <tbody>
              ${deductionRows}
              <tr class="total"><td>Deductions Total</td><td class="right">${this.formatCurrency(p.deductionsTotal)}</td></tr>
            </tbody>
          </table>
          <p class="net">Net Pay: ${this.formatCurrency(p.netPay)}</p>
          <script>window.onload = () => window.print();</script>
        </body>
      </html>
    `;
    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
  }
}
