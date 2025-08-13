import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environment/environment';
import { map } from 'rxjs/operators';

export interface Loan {
  id: string;
  type: 'multiPurpose' | 'policy' | 'consolidated' | 'custom';
  principal: number;
  balance: number;
  installment: number;
  startDate: string;
  endDate?: string;
  status: 'active' | 'paid' | 'writtenOff';
  createdAt: string;
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
  startDate: string;
  endDate?: string;
  remarks?: string;
}

export interface UpdateLoanStatus {
  status: 'active' | 'paid' | 'writtenOff';
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
    return this.http.get<any>(`${this.API_URL}/loans/my-loans`).pipe(
      map(response => response.success ? response.data : { loans: [], totalActiveLoans: 0, totalBalance: 0 })
    );
  }

  getLoanById(id: string): Observable<Loan> {
    return this.http.get<any>(`${this.API_URL}/loans/my-loans/${id}`).pipe(
      map(response => response.success ? response.data : null)
    );
  }

  createLoanRequest(loanData: CreateLoanRequest): Observable<{ message: string; data: Loan }> {
    return this.http.post<any>(`${this.API_URL}/loans/my-loans`, loanData).pipe(
      map(response => response.success ? response : { message: 'Failed to create loan', data: null })
    );
  }

  getLoanPayments(loanId: string): Observable<{
    loan: Loan;
    payments: LoanPayment[];
    totalPaid: number;
    remainingBalance: number;
  }> {
    return this.http.get<any>(`${this.API_URL}/loans/my-loans/${loanId}/payments`).pipe(
      map(response => response.success ? response.data : { loan: null, payments: [], totalPaid: 0, remainingBalance: 0 })
    );
  }

  getLoanSchedule(loanId: string): Observable<{
    loan: Loan;
    schedule: LoanSchedule[];
  }> {
    return this.http.get<any>(`${this.API_URL}/loans/my-loans/${loanId}/schedule`).pipe(
      map(response => response.success ? response.data : { loan: null, schedule: [] })
    );
  }

  downloadLoanSummary(loanId: string): Observable<{
    loan: Loan;
    payments: LoanPayment[];
    totalPaid: number;
    remainingBalance: number;
  }> {
    return this.http.get<any>(`${this.API_URL}/loans/my-loans/${loanId}/summary`).pipe(
      map(response => response.success ? response.data : { loan: null, payments: [], totalPaid: 0, remainingBalance: 0 })
    );
  }

  getLoanStats(): Observable<LoanStats> {
    return this.http.get<any>(`${this.API_URL}/loans/my-loans/stats`).pipe(
      map(response => response.success ? response.data : { totalLoans: 0, activeLoans: 0, totalBalance: 0, totalPaid: 0, averageLoanAmount: 0 })
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

    const url = `${this.API_URL}/loans/all${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    return this.http.get<any>(url).pipe(
      map(response => response.success ? response.data : { loans: [], pagination: { page: 1, limit: 10, total: 0, pages: 0 } })
    );
  }

  updateLoanStatus(loanId: string, statusData: UpdateLoanStatus): Observable<{
    message: string;
    data: { id: string; status: string };
  }> {
    return this.http.patch<any>(`${this.API_URL}/loans/${loanId}/status`, statusData).pipe(
      map(response => response.success ? response : { message: 'Failed to update status', data: { id: loanId, status: '' } })
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
      active: 'Active',
      paid: 'Paid',
      writtenOff: 'Written Off'
    };
    return statusMap[status] || status;
  }

  getStatusColor(status: string): string {
    const colorMap: { [key: string]: string } = {
      active: 'bg-blue-100 text-blue-800',
      paid: 'bg-green-100 text-green-800',
      writtenOff: 'bg-red-100 text-red-800'
    };
    return colorMap[status] || 'bg-gray-100 text-gray-800';
  }
} 