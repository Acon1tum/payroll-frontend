import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { environment } from '../../environment/environment';
import { map, catchError } from 'rxjs/operators';

export interface Loan {
  id: string;
  type: 'multiPurpose' | 'policy' | 'consolidated' | 'custom';
  principal: number;
  balance: number;
  installment: number;
  termMonths: number;
  startDate: string;
  endDate?: string;
  paymentSchedule: 'monthly' | 'semiMonthly';
  status: 'pending' | 'approved' | 'rejected' | 'active' | 'paid' | 'writtenOff';
  createdAt: string;
  remarks?: string;
  employeeId?: string;
  employee?: {
    id: string;
    firstName: string;
    lastName: string;
    employeeNumber: string;
  };
  payments?: LoanPayment[];
}

export interface LoanPayment {
  id: string;
  amount: number;
  paidAt: string;
  payrollRun?: {
    id: string;
    periodStart: string;
    periodEnd: string;
  };
}

export interface LoanSchedule {
  period: number;
  dueDate: string;
  payment: number;
  principal: number;
  interest: number;
  balance: number;
}

export interface LoanStats {
  totalLoans: number;
  activeLoans: number;
  totalBalance: number;
  totalPaid: number;
  averageLoanAmount: number;
}

export interface CreateLoanRequest {
  type: 'multiPurpose' | 'policy' | 'consolidated' | 'custom';
  principal: number;
  installment: number;
  termMonths: number;
  startDate: string;
  endDate?: string;
  paymentSchedule: 'monthly' | 'semiMonthly';
  remarks?: string;
}

export interface UpdateLoanStatus {
  status: 'pending' | 'approved' | 'rejected' | 'active' | 'paid' | 'writtenOff';
  remarks?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class LoanService {
  private API_URL = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // Employee endpoints
  getMyLoans(): Observable<{ loans: Loan[]; totalActiveLoans: number; totalBalance: number }> {
    console.log('Making request to:', `${this.API_URL}/employee/loans`);
    return this.http.get<any>(`${this.API_URL}/employee/loans`).pipe(
      map(response => {
        console.log('Raw response from server:', response);
        if (response.success && response.data) {
          return {
            loans: response.data,
            totalActiveLoans: response.summary?.activeLoans || 0,
            totalBalance: response.summary?.totalActiveBalance || 0
          };
        }
        return { loans: [], totalActiveLoans: 0, totalBalance: 0 };
      }),
      catchError((error: any) => {
        console.error('Error in getMyLoans:', error);
        return throwError(() => error);
      })
    );
  }

  getLoanById(id: string): Observable<Loan> {
    return this.http.get<any>(`${this.API_URL}/loans/my-loans/${id}`).pipe(
      map(response => response.success ? response.data : null)
    );
  }

  createLoanRequest(loanData: CreateLoanRequest): Observable<{ message: string; data: Loan }> {
    return this.http.post<any>(`${this.API_URL}/employee/loans/request`, loanData).pipe(
      map(response => response.success ? response : { message: 'Failed to create loan request', data: null })
    );
  }

  getLoanPayments(loanId: string): Observable<{
    loan: Loan | null;
    payments: LoanPayment[];
    totalPaid: number;
    remainingBalance: number;
  }> {
    // Get all loans and find the specific one with payments
    return this.http.get<any>(`${this.API_URL}/employee/loans`).pipe(
      map(response => {
        if (response.success && response.data) {
          const loan = response.data.find((l: Loan) => l.id === loanId);
          if (loan) {
            const payments = loan.payments || [];
            const totalPaid = payments.reduce((sum: number, payment: LoanPayment) => sum + Number(payment.amount), 0);
            const remainingBalance = Number(loan.balance) || 0;
            return { loan, payments, totalPaid, remainingBalance };
          }
        }
        return { loan: null, payments: [], totalPaid: 0, remainingBalance: 0 };
      }),
      catchError(error => {
        console.warn('Error loading loan payments:', error);
        return of({ loan: null, payments: [], totalPaid: 0, remainingBalance: 0 });
      })
    );
  }

  getLoanSchedule(loanId: string): Observable<{
    loan: Loan | null;
    schedule: LoanSchedule[];
  }> {
    // Get all loans and find the specific one
    return this.http.get<any>(`${this.API_URL}/employee/loans`).pipe(
      map(response => {
        if (response.success && response.data) {
          const loan = response.data.find((l: Loan) => l.id === loanId);
          if (loan) {
            // Generate a basic schedule if not available
            const schedule: LoanSchedule[] = loan.schedule || [];
            return { loan, schedule };
          }
        }
        return { loan: null, schedule: [] };
      }),
      catchError(error => {
        console.warn('Error loading loan schedule:', error);
        return of({ loan: null, schedule: [] });
      })
    );
  }

  downloadLoanSummary(loanId: string): Observable<{
    loan: Loan | null;
    payments: LoanPayment[];
    totalPaid: number;
    remainingBalance: number;
  }> {
    // Use the same approach as getLoanPayments
    return this.http.get<any>(`${this.API_URL}/employee/loans`).pipe(
      map(response => {
        if (response.success && response.data) {
          const loan = response.data.find((l: Loan) => l.id === loanId);
          if (loan) {
            const payments = loan.payments || [];
            const totalPaid = payments.reduce((sum: number, payment: LoanPayment) => sum + Number(payment.amount), 0);
            const remainingBalance = Number(loan.balance) || 0;
            return { loan, payments, totalPaid, remainingBalance };
          }
        }
        return { loan: null, payments: [], totalPaid: 0, remainingBalance: 0 };
      }),
      catchError(error => {
        console.warn('Error loading loan summary:', error);
        return of({ loan: null, payments: [], totalPaid: 0, remainingBalance: 0 });
      })
    );
  }

  getLoanStats(): Observable<LoanStats> {
    return this.http.get<any>(`${this.API_URL}/employee/loans/stats`).pipe(
      map(response => {
        if (response.success && response.summary) {
          return {
            totalLoans: response.summary.totalLoans || 0,
            activeLoans: response.summary.activeLoans || 0,
            totalBalance: response.summary.totalActiveBalance || 0,
            totalPaid: (response.summary.totalPrincipal || 0) - (response.summary.totalBalance || 0),
            averageLoanAmount: response.summary.totalLoans > 0 ? (response.summary.totalPrincipal || 0) / response.summary.totalLoans : 0
          };
        }
        return {
          totalLoans: 0,
          activeLoans: 0,
          totalBalance: 0,
          totalPaid: 0,
          averageLoanAmount: 0
        };
      })
    );
  }

  // Admin/HR endpoints
  getAllLoans(params?: {
    page?: number;
    limit?: number;
    status?: string;
    employeeId?: string;
  }): Observable<PaginatedResponse<Loan & { employee: any }>> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.status) queryParams.append('status', params.status);
    if (params?.employeeId) queryParams.append('employeeId', params.employeeId);

    const url = `${this.API_URL}/payroll/loans${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    return this.http.get<any>(url).pipe(
      map(response => {
        if (response.success && response.data) {
          return {
            data: response.data,
            pagination: {
              page: params?.page || 1,
              limit: params?.limit || 10,
              total: response.data.length,
              pages: Math.ceil(response.data.length / (params?.limit || 10))
            }
          };
        }
        return { data: [], pagination: { page: 1, limit: 10, total: 0, pages: 0 } };
      })
    );
  }

  createLoan(loanData: CreateLoanRequest & { employeeId: string }): Observable<{
    message: string;
    data: Loan;
  }> {
    return this.http.post<any>(`${this.API_URL}/payroll/loans`, loanData).pipe(
      map(response => response.success ? response : { message: 'Failed to create loan', data: null })
    );
  }

  updateLoan(loanId: string, loanData: Partial<CreateLoanRequest>): Observable<{
    message: string;
    data: Loan;
  }> {
    return this.http.put<any>(`${this.API_URL}/payroll/loans/${loanId}`, loanData).pipe(
      map(response => response.success ? response : { message: 'Failed to update loan', data: null })
    );
  }

  updateLoanStatus(loanId: string, statusData: UpdateLoanStatus): Observable<{
    message: string;
    data: { id: string; status: string };
  }> {
    return this.http.put<any>(`${this.API_URL}/payroll/loans/${loanId}/status`, statusData).pipe(
      map(response => response.success ? response : { message: 'Failed to update status', data: { id: loanId, status: '' } })
    );
  }

  deleteLoan(loanId: string): Observable<{
    message: string;
  }> {
    return this.http.delete<any>(`${this.API_URL}/payroll/loans/${loanId}`).pipe(
      map(response => response.success ? response : { message: 'Failed to delete loan' })
    );
  }

  // Helper methods for frontend component
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(amount);
  }

  getLoanTypeDisplayName(type: string): string {
    const typeMap: { [key: string]: string } = {
      multiPurpose: 'Multi-purpose',
      policy: 'Policy',
      consolidated: 'Consolidated',
      custom: 'Custom'
    };
    return typeMap[type] || type;
  }

  getStatusDisplayName(status: string): string {
    const statusMap: { [key: string]: string } = {
      pending: 'Pending',
      approved: 'Approved',
      rejected: 'Rejected',
      active: 'Active',
      paid: 'Paid',
      writtenOff: 'Written Off'
    };
    return statusMap[status] || status;
  }

  getStatusColor(status: string): string {
    const colorMap: { [key: string]: string } = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      active: 'bg-blue-100 text-blue-800',
      paid: 'bg-green-100 text-green-800',
      writtenOff: 'bg-red-100 text-red-800'
    };
    return colorMap[status] || 'bg-gray-100 text-gray-800';
  }
} 