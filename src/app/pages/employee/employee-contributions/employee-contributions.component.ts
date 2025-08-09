import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SidebarComponent } from '../../../shared/sidebar/sidebar.component';
import { HeaderComponent } from '../../../shared/header/header.component';

@Component({
  selector: 'app-employee-contributions',
  imports: [CommonModule, SidebarComponent, HeaderComponent],
  templateUrl: './employee-contributions.component.html',
  styleUrl: './employee-contributions.component.scss'
})
export class EmployeeContributionsComponent {
  months: { month: string; sss: number; philHealth: number; pagibig: number; bir: number; total: number }[] = [];

  yearTotals = {
    sss: 0,
    philHealth: 0,
    pagibig: 0,
    bir: 0,
  };

  get maxYearTotal(): number {
    return Math.max(this.yearTotals.sss, this.yearTotals.philHealth, this.yearTotals.pagibig, this.yearTotals.bir) || 1;
  }

  constructor() {
    // Dummy monthly data for current year
    const base = [
      { month: 'Jan', sss: 450, philHealth: 300, pagibig: 200, bir: 900 },
      { month: 'Feb', sss: 450, philHealth: 300, pagibig: 200, bir: 920 },
      { month: 'Mar', sss: 450, philHealth: 300, pagibig: 200, bir: 910 },
      { month: 'Apr', sss: 450, philHealth: 300, pagibig: 200, bir: 905 },
      { month: 'May', sss: 450, philHealth: 300, pagibig: 200, bir: 930 },
      { month: 'Jun', sss: 450, philHealth: 300, pagibig: 200, bir: 880 },
      { month: 'Jul', sss: 450, philHealth: 300, pagibig: 200, bir: 895 },
      { month: 'Aug', sss: 450, philHealth: 300, pagibig: 200, bir: 915 },
      { month: 'Sep', sss: 450, philHealth: 300, pagibig: 200, bir: 900 },
      { month: 'Oct', sss: 450, philHealth: 300, pagibig: 200, bir: 905 },
      { month: 'Nov', sss: 450, philHealth: 300, pagibig: 200, bir: 890 },
      { month: 'Dec', sss: 450, philHealth: 300, pagibig: 200, bir: 920 },
    ];

    this.months = base.map(b => ({ ...b, total: b.sss + b.philHealth + b.pagibig + b.bir }));
    this.computeYearTotals();
  }

  private computeYearTotals(): void {
    this.yearTotals = this.months.reduce((acc, m) => {
      acc.sss += m.sss;
      acc.philHealth += m.philHealth;
      acc.pagibig += m.pagibig;
      acc.bir += m.bir;
      return acc;
    }, { sss: 0, philHealth: 0, pagibig: 0, bir: 0 });
  }

  formatCurrency(n?: number | null): string {
    return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(n ?? 0);
  }

  barWidth(total: number): string {
    const pct = Math.round((total / this.maxYearTotal) * 100);
    return pct + '%';
  }

  downloadBIR2316(): void {
    const win = window.open('', '_blank', 'width=800,height=900');
    if (!win) return;
    const style = `
      <style>
        body { font-family: Arial, sans-serif; padding: 24px; color: #111827; }
        h2 { margin: 0 0 8px 0; }
        .muted { color: #6B7280; font-size: 12px; }
        table { width: 100%; border-collapse: collapse; margin-top: 16px; }
        th, td { text-align: left; padding: 8px; border-bottom: 1px solid #E5E7EB; }
        .right { text-align: right; }
        .total { font-weight: 600; }
      </style>
    `;
    const html = `
      <html>
        <head><title>BIR 2316 (Mock)</title>${style}</head>
        <body>
          <h2>BIR 2316 - Certificate of Compensation (Mock)</h2>
          <div class="muted">This is a mock document for preview/printing only.</div>
          <table>
            <thead><tr><th>Contribution Type</th><th class="right">Total (Year)</th></tr></thead>
            <tbody>
              <tr><td>SSS</td><td class="right">${this.formatCurrency(this.yearTotals.sss)}</td></tr>
              <tr><td>PhilHealth</td><td class="right">${this.formatCurrency(this.yearTotals.philHealth)}</td></tr>
              <tr><td>Pag-IBIG</td><td class="right">${this.formatCurrency(this.yearTotals.pagibig)}</td></tr>
              <tr class="total"><td>Withholding Tax (BIR)</td><td class="right">${this.formatCurrency(this.yearTotals.bir)}</td></tr>
            </tbody>
          </table>
          <script>window.onload = () => window.print();</script>
        </body>
      </html>
    `;
    win.document.open();
    win.document.write(html);
    win.document.close();
  }
}
