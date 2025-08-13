import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HeaderComponent } from '../../../shared/header/header.component';
import { SidebarComponent } from '../../../shared/sidebar/sidebar.component';
import { LoanService, Loan, LoanPayment, CreateLoanRequest } from '../../../services/loan.service';

interface Breadcrumb {
  label: string;
  path?: string;
  active?: boolean;
}

interface TransformedPayment {
  loanId: string;
  cutoffDate: Date;
  amount: number;
  principal: number;
  interest: number;
  balanceAfter: number;
}

@Component({
  selector: 'app-request-loan',
  imports: [CommonModule, FormsModule, HeaderComponent, SidebarComponent],
  templateUrl: './request-loan.component.html',
  styleUrl: './request-loan.component.scss'
})
export class RequestLoanComponent implements OnInit {

  // Breadcrumbs for header
  breadcrumbs: Breadcrumb[] = [
    { label: 'Dashboard', path: '/employee-dashboard' },
    { label: 'Loans', active: true }
  ];

  // Real data from API
  activeLoans: Loan[] = [];
  repayments: TransformedPayment[] = [];
  loanStats: any = null;
  isLoading = false;
  errorMessage = '';

  // Modal state and form
  showModal = false;
  showConfirm = false;
  confirmMessage = '';
  form: CreateLoanRequest = {
    type: 'multiPurpose',
    principal: 0,
    installment: 0,
    startDate: '',
    endDate: '',
    remarks: ''
  };

  // Add new properties for success animation
  isSuccessLoading = false;
  showSuccessAnimation = false;
  successMessage = '';

  constructor(private loanService: LoanService) {}

  ngOnInit(): void {
    this.loadLoanData();
  }

  async loadLoanData(): Promise<void> {
    this.isLoading = true;
    this.errorMessage = '';

    try {
      // Load loans
      const loansResponse = await this.loanService.getMyLoans().toPromise();
      if (loansResponse) {
        this.activeLoans = loansResponse.loans;
      }

      // Load loan stats
      const statsResponse = await this.loanService.getLoanStats().toPromise();
      if (statsResponse) {
        this.loanStats = statsResponse;
      }

      // Load repayment history from active loans
      await this.loadRepaymentHistory();

      // Only show error if we couldn't load any data at all
      if (!loansResponse && !statsResponse) {
        this.errorMessage = 'Failed to load loan data. Please try again or contact support.';
      }

    } catch (error: any) {
      console.error('Error loading loan data:', error);
      
      // Only show error message if we don't have any data loaded
      if (this.activeLoans.length === 0 && !this.loanStats) {
        // Handle specific error cases
        if (error.status === 404) {
          if (error.error?.error?.includes('Employee profile not found')) {
            this.errorMessage = 'Employee profile not found. Please contact HR to set up your employee profile.';
          } else if (error.error?.error?.includes('Loan not found')) {
            this.errorMessage = 'No loans found for your account.';
          } else {
            this.errorMessage = 'Resource not found. Please check your request.';
          }
        } else if (error.status === 401) {
          this.errorMessage = 'Authentication failed. Please log in again.';
        } else if (error.status === 403) {
          this.errorMessage = 'Access denied. You do not have permission to view loan information.';
        } else if (error.status === 500) {
          this.errorMessage = 'Server error. Please try again later or contact support.';
        } else {
          this.errorMessage = 'Failed to load loan data. Please try again or contact support.';
        }
      }
    } finally {
      this.isLoading = false;
    }
  }

  private async loadRepaymentHistory(): Promise<void> {
    this.repayments = [];
    
    for (const loan of this.activeLoans) {
      try {
        const response = await this.loanService.getLoanPayments(loan.id).toPromise();
        if (response && response.payments) {
          // Transform payments to match the expected format
          const transformedPayments: TransformedPayment[] = response.payments.map((payment: any) => ({
            loanId: loan.id,
            cutoffDate: new Date(payment.paidAt),
            amount: payment.amount,
            principal: payment.amount * 0.9, // Approximate principal portion
            interest: payment.amount * 0.1,  // Approximate interest portion
            balanceAfter: 0 // This would need to be calculated based on loan balance
          }));
          this.repayments.push(...transformedPayments);
        }
      } catch (error) {
        console.error(`Error loading payments for loan ${loan.id}:`, error);
      }
    }
  }

  openNewRequest(): void {
    // Set default values
    this.form = {
      type: 'multiPurpose',
      principal: 0,
      installment: 0,
      startDate: new Date().toISOString().split('T')[0], // Today's date
      endDate: '',
      remarks: ''
    };
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.showConfirm = false;
    this.errorMessage = '';
  }

  submit(): void {
    // Validate form
    if (!this.form.principal || this.form.principal <= 0) {
      this.errorMessage = 'Please enter a valid principal amount.';
      return;
    }

    if (!this.form.installment || this.form.installment <= 0) {
      this.errorMessage = 'Please enter a valid installment amount.';
      return;
    }

    if (!this.form.startDate) {
      this.errorMessage = 'Please select a start date.';
      return;
    }

    if (this.form.installment > this.form.principal) {
      this.errorMessage = 'Installment amount cannot exceed principal amount.';
      return;
    }

    // Calculate term in months (approximate)
    let termMonths = 0;
    if (this.form.endDate) {
      const startDate = new Date(this.form.startDate);
      const endDate = new Date(this.form.endDate);
      const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
      termMonths = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 30.44)); // Average days per month
    } else {
      // Estimate term based on principal and installment
      termMonths = Math.ceil(this.form.principal / this.form.installment);
    }

    this.confirmMessage = `Submit loan request for ${this.loanService.formatCurrency(this.form.principal)} over approximately ${termMonths} month(s)?`;
    this.showConfirm = true;
  }

  cancelConfirm(): void { 
    this.showConfirm = false; 
  }

  async confirmSubmit(): Promise<void> {
    try {
      this.isLoading = true;
      this.errorMessage = '';

      const response = await this.loanService.createLoanRequest(this.form).toPromise();
      
      if (response && response.data) {
        // Show success animation
        this.showSuccessAnimation = true;
        this.successMessage = 'Loan request submitted successfully!';
        
        // Add the new loan to the list
        this.activeLoans.unshift(response.data);
        
        // Start success loading animation
        this.isSuccessLoading = true;
        
        // Simulate processing time for better UX
        setTimeout(async () => {
          // Reload data to get updated stats
          await this.loadLoanData();
          
          // Hide success animation and close modal
          this.isSuccessLoading = false;
          this.showSuccessAnimation = false;
    this.closeModal();
          
          // Show final success message
          this.showFinalSuccessMessage();
        }, 2000); // 2 second animation
        
      } else {
        this.errorMessage = 'Failed to submit loan request. Please try again.';
      }
    } catch (error: any) {
      console.error('Error submitting loan request:', error);
      
      // Handle specific error cases
      if (error.status === 404 && error.error?.error?.includes('Employee profile not found')) {
        this.errorMessage = 'Employee profile not found. Please contact HR to set up your employee profile before applying for loans.';
      } else if (error.status === 400) {
        this.errorMessage = error.error?.error || 'Invalid loan request data. Please check your inputs.';
      } else if (error.status === 401) {
        this.errorMessage = 'Authentication failed. Please log in again.';
      } else if (error.status === 403) {
        this.errorMessage = 'Access denied. You do not have permission to create loan requests.';
      } else if (error.status === 500) {
        this.errorMessage = 'Server error. Please try again later or contact support.';
      } else {
        this.errorMessage = 'Failed to submit loan request. Please try again or contact support.';
      }
    } finally {
      this.isLoading = false;
    }
  }

  private showFinalSuccessMessage(): void {
    // Create a temporary success notification
    const notification = document.createElement('div');
    notification.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 transform transition-all duration-300 translate-x-full';
    notification.innerHTML = `
      <div class="flex items-center">
        <svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
        </svg>
        <span>Loan request submitted successfully!</span>
      </div>
    `;
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
      notification.classList.remove('translate-x-full');
    }, 100);
    
    // Animate out and remove
    setTimeout(() => {
      notification.classList.add('translate-x-full');
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 300);
    }, 3000);
  }

  async downloadLoanSummary(loan: Loan): Promise<void> {
    try {
      const response = await this.loanService.downloadLoanSummary(loan.id).toPromise();
      
      if (response && response.loan) {
        // Generate and download the summary
        this.generateAndDownloadSummary(response);
      }
    } catch (error) {
      console.error('Error downloading loan summary:', error);
      alert('Failed to download loan summary. Please try again.');
    }
  }

  private generateAndDownloadSummary(data: any): void {
    const { loan, payments, totalPaid, remainingBalance } = data;
    
    // Create a formatted summary
    const summary = `
Loan Summary - ${loan.id}
Type: ${this.loanService.getLoanTypeDisplayName(loan.type)}
Principal: ${this.loanService.formatCurrency(loan.principal)}
Current Balance: ${this.loanService.formatCurrency(loan.balance)}
Installment: ${this.loanService.formatCurrency(loan.installment)}
Start Date: ${new Date(loan.startDate).toLocaleDateString()}
Status: ${this.loanService.getStatusDisplayName(loan.status)}

Payment History:
${payments.map((p: any, index: number) => 
  `${index + 1}. ${new Date(p.paidAt).toLocaleDateString()} - ${this.loanService.formatCurrency(p.amount)}`
).join('\n')}

Total Paid: ${this.loanService.formatCurrency(totalPaid)}
Remaining Balance: ${this.loanService.formatCurrency(remainingBalance)}
    `;

    // Create and download file
    const blob = new Blob([summary], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `loan-summary-${loan.id}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }

  // Helper methods
  formatCurrency(n?: number | null): string {
    return this.loanService.formatCurrency(n ?? 0);
  }

  getLoanTypeDisplayName(type: string): string {
    return this.loanService.getLoanTypeDisplayName(type);
  }

  getStatusDisplayName(status: string): string {
    return this.loanService.getStatusDisplayName(status);
  }

  getStatusColor(status: string): string {
    return this.loanService.getStatusColor(status);
  }

  // Calculate term months for display
  calculateTermMonths(loan: Loan): number {
    if (loan.endDate) {
      const startDate = new Date(loan.startDate);
      const endDate = new Date(loan.endDate);
      const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 30.44));
    }
    // Estimate based on principal and installment
    return Math.ceil(loan.principal / loan.installment);
  }

  // Get payment schedule display
  getPaymentSchedule(loan: Loan): string {
    const termMonths = this.calculateTermMonths(loan);
    if (termMonths <= 12) {
      return `${termMonths} months`;
    } else if (termMonths <= 24) {
      return `${Math.ceil(termMonths / 12)} year${Math.ceil(termMonths / 12) > 1 ? 's' : ''}`;
    } else {
      return `${Math.ceil(termMonths / 12)} years`;
    }
  }
}

