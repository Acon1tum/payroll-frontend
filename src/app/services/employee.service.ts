import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environment/environment';

export interface Payslip {
  id: string;
  grossPay: number;
  totalDeductions: number;
  netPay: number;
  pdfUrl?: string;
  releasedAt?: string;
  createdAt: string;
  payrollRun: {
    id: string;
    periodStart: string;
    periodEnd: string;
    payDate: string;
    frequency: string;
    status: string;
  };
  items: PayslipItem[];
}

export interface PayslipItem {
  id: string;
  label: string;
  amount: number;
  type: 'earning' | 'deduction';
  contributionCode?: string;
}

export interface Contribution {
  id: string;
  code: string;
  employeeShare: number;
  employerShare: number;
  payrollRun: {
    id: string;
    periodStart: string;
    periodEnd: string;
    payDate: string;
    frequency: string;
    status: string;
  };
}

export interface ContributionSummary {
  code: string;
  totalEmployeeShare: number;
  totalEmployerShare: number;
  count: number;
}

export interface ThirteenthMonthRecord {
  id: string;
  year: number;
  amount: number;
  releasedAt?: string;
}

export interface ThirteenthMonthSummary {
  totalAmount: number;
  totalRecords: number;
  averageAmount: number;
}

export interface EmployeeDashboard {
  employee: {
    id: string;
    employeeNumber: string;
    firstName: string;
    lastName: string;
    position: string;
    department?: string;
    organization?: string;
    baseSalary: number;
  };
  recentPayslips: Payslip[];
  currentYearEarnings: {
    totalGrossPay: number;
    totalNetPay: number;
  };
  pendingLeaveApplications: number;
  activeLoans: number;
  currentYearThirteenthMonth?: ThirteenthMonthRecord;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  summary?: any;
}

@Injectable({
  providedIn: 'root'
})
export class EmployeeService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  // Get employee dashboard
  getDashboard(): Observable<ApiResponse<EmployeeDashboard>> {
    return this.http.get<ApiResponse<EmployeeDashboard>>(`${this.apiUrl}/employee/dashboard`, {
      headers: this.getHeaders()
    });
  }

  // Get employee payslips
  getPayslips(params?: {
    page?: number;
    limit?: number;
    year?: number;
    month?: number;
  }): Observable<ApiResponse<Payslip[]>> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.year) queryParams.append('year', params.year.toString());
    if (params?.month) queryParams.append('month', params.month.toString());

    const url = `${this.apiUrl}/employee/payslips${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    return this.http.get<ApiResponse<Payslip[]>>(url, {
      headers: this.getHeaders()
    });
  }

  // Get employee contributions
  getContributions(params?: {
    page?: number;
    limit?: number;
    year?: number;
    month?: number;
    code?: string;
  }): Observable<ApiResponse<Contribution[]> & { summary: ContributionSummary[] }> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.year) queryParams.append('year', params.year.toString());
    if (params?.month) queryParams.append('month', params.month.toString());
    if (params?.code) queryParams.append('code', params.code);

    const url = `${this.apiUrl}/employee/contributions${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    return this.http.get<ApiResponse<Contribution[]> & { summary: ContributionSummary[] }>(url, {
      headers: this.getHeaders()
    });
  }

  // Get employee thirteenth month records
  getThirteenthMonth(params?: {
    page?: number;
    limit?: number;
    year?: number;
  }): Observable<ApiResponse<ThirteenthMonthRecord[]> & { summary: ThirteenthMonthSummary }> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.year) queryParams.append('year', params.year.toString());

    const url = `${this.apiUrl}/employee/thirteenth-month${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    return this.http.get<ApiResponse<ThirteenthMonthRecord[]> & { summary: ThirteenthMonthSummary }>(url, {
      headers: this.getHeaders()
    });
  }

  // Download payslip PDF
  downloadPayslip(payslipId: string): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/employee/payslips/${payslipId}/download`, {
      headers: this.getHeaders(),
      responseType: 'blob'
    });
  }
} 