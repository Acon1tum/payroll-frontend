import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SidebarComponent } from '../../../shared/sidebar/sidebar.component';
import { HeaderComponent } from '../../../shared/header/header.component';
import { EmployeeService, Contribution, ContributionSummary } from '../../../services/employee.service';
import { catchError, finalize } from 'rxjs/operators';
import { of } from 'rxjs';

interface Breadcrumb {
  label: string;
  path?: string;
  active?: boolean;
}

interface MonthlyContribution {
  month: string;
  sss: number;
  philHealth: number;
  pagibig: number;
  bir: number;
  total: number;
}

interface YearlyTotals {
  sss: number;
  philHealth: number;
  pagibig: number;
  bir: number;
}

@Component({
  selector: 'app-employee-contributions',
  imports: [CommonModule, SidebarComponent, HeaderComponent],
  templateUrl: './employee-contributions.component.html',
  styleUrl: './employee-contributions.component.scss'
})
export class EmployeeContributionsComponent implements OnInit {
  // Breadcrumbs for header
  breadcrumbs: Breadcrumb[] = [
    { label: 'Dashboard', path: '/employee-dashboard' },
    { label: 'Contributions', active: true }
  ];

  // Data from API
  contributions: Contribution[] = [];
  summary: ContributionSummary[] = [];
  loading = false;
  error = '';

  // Processed data for display
  months: MonthlyContribution[] = [];
  yearTotals: YearlyTotals = {
    sss: 0,
    philHealth: 0,
    pagibig: 0,
    bir: 0,
  };
  logoLoadErrors: { [key: string]: boolean } = {};

  // Filters
  selectedYear = 2024; // Default to 2024 where we have seed data

  constructor(private employeeService: EmployeeService) {}

  ngOnInit(): void {
    this.loadContributions();
    
    // Debug: Log the logo paths
    console.log('Logo paths:');
    console.log('SSS:', this.getContributionLogo('SSS'));
    console.log('PHILHEALTH:', this.getContributionLogo('PHILHEALTH'));
    console.log('PAGIBIG:', this.getContributionLogo('PAGIBIG'));
    console.log('BIR:', this.getContributionLogo('BIR'));
  }

  loadContributions(): void {
    this.loading = true;
    this.error = '';

    const params = {
      year: this.selectedYear,
      limit: 100 // Get more records to process monthly data
    };

    this.employeeService.getContributions(params)
      .pipe(
        catchError(error => {
          console.error('Error loading contributions:', error);
          this.error = 'Failed to load contributions. Please try again.';
          return of({ 
            success: false, 
            data: [], 
            summary: [],
            pagination: { page: 1, limit: 10, total: 0, pages: 1 } 
          });
        }),
        finalize(() => this.loading = false)
      )
      .subscribe(response => {
        if (response.success) {
          this.contributions = response.data;
          this.summary = response.summary || [];
          
          // Debug logging
          console.log('API Response:', response);
          console.log('Contributions count:', this.contributions.length);
          console.log('Summary:', this.summary);
          
          this.processMonthlyData();
          this.computeYearTotalsFromSummary(); // Use summary data for more accurate totals
        } else {
          console.error('API returned success: false');
        }
      });
  }

  onYearSelect(event: Event): void {
    const target = event.target as HTMLSelectElement;
    const year = parseInt(target.value);
    if (!isNaN(year)) {
      this.selectedYear = year;
      this.loadContributions();
    }
  }

  private processMonthlyData(): void {
    // Initialize monthly data structure
    const monthlyData: { [key: string]: MonthlyContribution } = {};
    
    // Initialize all months
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                       'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    monthNames.forEach(month => {
      monthlyData[month] = {
        month,
        sss: 0,
        philHealth: 0,
        pagibig: 0,
        bir: 0,
        total: 0
      };
    });

    // Process contributions by month
    this.contributions.forEach(contribution => {
      const payDate = new Date(contribution.payrollRun.payDate);
      const monthName = monthNames[payDate.getMonth()];
      
      if (monthlyData[monthName]) {
        switch (contribution.code) {
          case 'SSS':
            monthlyData[monthName].sss += Number(contribution.employeeShare);
            break;
          case 'PHILHEALTH':
            monthlyData[monthName].philHealth += Number(contribution.employeeShare);
            break;
          case 'PAGIBIG':
            monthlyData[monthName].pagibig += Number(contribution.employeeShare);
            break;
          case 'BIR':
            monthlyData[monthName].bir += Number(contribution.employeeShare);
            break;
        }
      }
    });

    // Calculate totals and convert to array
    this.months = Object.values(monthlyData).map(month => ({
      ...month,
      total: month.sss + month.philHealth + month.pagibig + month.bir
    }));

    // Log for debugging
    console.log('Processed contributions:', this.contributions.length);
    console.log('Monthly data:', this.months);
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

  // Calculate yearly totals from summary data (more accurate)
  private computeYearTotalsFromSummary(): void {
    this.yearTotals = {
      sss: 0,
      philHealth: 0,
      pagibig: 0,
      bir: 0
    };

    this.summary.forEach(item => {
      const employeeShare = Number(item.totalEmployeeShare) || 0;
      switch (item.code) {
        case 'SSS':
          this.yearTotals.sss = employeeShare;
          break;
        case 'PHILHEALTH':
          this.yearTotals.philHealth = employeeShare;
          break;
        case 'PAGIBIG':
          this.yearTotals.pagibig = employeeShare;
          break;
        case 'BIR':
          this.yearTotals.bir = employeeShare;
          break;
      }
    });

    // Debug logging
    console.log('Year totals from summary:', this.yearTotals);
    console.log('Summary data used:', this.summary);
  }

  get maxYearTotal(): number {
    return Math.max(this.yearTotals.sss, this.yearTotals.philHealth, this.yearTotals.pagibig, this.yearTotals.bir) || 1;
  }

  formatCurrency(n?: number | null): string {
    return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(n ?? 0);
  }

  barWidth(total: number): string {
    const pct = Math.round((total / this.maxYearTotal) * 100);
    return pct + '%';
  }

  getContributionCodeLabel(code: string): string {
    const labels: { [key: string]: string } = {
      'SSS': 'Social Security System',
      'PHILHEALTH': 'PhilHealth',
      'PAGIBIG': 'Pag-IBIG Fund',
      'BIR': 'Bureau of Internal Revenue'
    };
    return labels[code] || code;
  }

  getContributionLogo(code: string): string {
    const logos: { [key: string]: string } = {
      'SSS': 'assets/images/logos/sss.png',
      'PHILHEALTH': 'assets/images/logos/ph_logo.png',
      'PAGIBIG': 'assets/images/logos/Pag-IBIG.svg.png',
      'BIR': 'assets/images/logos/bir.png'
    };
    return logos[code] || 'assets/images/logos/default-logo.png';
  }

  getContributionLogoAlt(code: string): string {
    const altTexts: { [key: string]: string } = {
      'SSS': 'Social Security System Logo',
      'PHILHEALTH': 'PhilHealth Logo',
      'PAGIBIG': 'Pag-IBIG Fund Logo',
      'BIR': 'Bureau of Internal Revenue Logo'
    };
    return altTexts[code] || 'Contribution Logo';
  }

  onLogoError(event: any, code: string): void {
    // Hide the image and show fallback
    event.target.style.display = 'none';
    console.warn(`Failed to load logo for ${code}`);
    
    // You can also set a flag to show fallback text
    this.logoLoadErrors[code] = true;
  }

  onLogoLoad(event: any, code: string): void {
    // Logo loaded successfully
    console.log(`Logo loaded successfully for ${code}`);
    this.logoLoadErrors[code] = false;
  }

  // Method to check if logo should show fallback
  shouldShowFallback(code: string): boolean {
    // This can be used to show fallback text when logo fails to load
    return this.logoLoadErrors[code] || false;
  }

  // Helper method to check if months are empty or have zero totals
  hasNoContributions(): boolean {
    return this.months.length === 0 || this.months.every(m => m.total === 0);
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
        .header { margin-bottom: 20px; }
        .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #666; }
      </style>
    `;
    
    const html = `
      <html>
        <head><title>BIR 2316 - ${this.selectedYear}</title>${style}</head>
        <body>
          <div class="header">
            <h2>BIR 2316 - Certificate of Compensation Payment/Tax Withheld</h2>
            <div class="muted">Year: ${this.selectedYear}</div>
            <div class="muted">Generated on: ${new Date().toLocaleDateString()}</div>
          </div>
          
          <table>
            <thead>
              <tr>
                <th>Contribution Type</th>
                <th class="right">Employee Share</th>
                <th class="right">Employer Share</th>
                <th class="right">Total</th>
              </tr>
            </thead>
            <tbody>
              ${this.summary.map(item => `
                <tr>
                  <td>${this.getContributionCodeLabel(item.code)}</td>
                  <td class="right">${this.formatCurrency(item.totalEmployeeShare)}</td>
                  <td class="right">${this.formatCurrency(item.totalEmployerShare)}</td>
                  <td class="right">${this.formatCurrency(item.totalEmployeeShare + item.totalEmployerShare)}</td>
                </tr>
              `).join('')}
              <tr class="total">
                <td>Total Contributions</td>
                <td class="right">${this.formatCurrency(this.summary.reduce((sum, item) => sum + item.totalEmployeeShare, 0))}</td>
                <td class="right">${this.formatCurrency(this.summary.reduce((sum, item) => sum + item.totalEmployerShare, 0))}</td>
                <td class="right">${this.formatCurrency(this.summary.reduce((sum, item) => sum + item.totalEmployeeShare + item.totalEmployerShare, 0))}</td>
              </tr>
            </tbody>
          </table>
          
          <div class="footer">
            <p>Generated by Payroll System</p>
            <p>This document is for reference purposes only</p>
          </div>
          
          <script>window.onload = () => window.print();</script>
        </body>
      </html>
    `;
    
    win.document.open();
    win.document.write(html);
    win.document.close();
  }
}
