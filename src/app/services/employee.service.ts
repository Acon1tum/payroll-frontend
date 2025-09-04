import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environment/environment';
import { AuthService } from './auth.service';

export interface EmployeeDto {
  id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  email: string;
  phone?: string;
  photoUrl?: string | null;
  dateOfBirth: string | Date;
  hireDate: string | Date;
  departmentId?: string | null;
  departmentName?: string;
  position: string;
  salary: number;
  employmentStatus: 'active' | 'resigned' | 'suspended' | 'terminated';
  systemRole: 'admin' | 'hrStaff' | 'payrollManager' | 'employee';
  payFrequency?: string; // e.g., 'semiMonthly', 'monthly', 'biweekly', 'weekly'
  createdAt: string | Date;
  updatedAt: string | Date;
  
  // Additional fields from Prisma schema
  employeeNumber?: string;
  sssNumber?: string;
  philHealthNumber?: string;
  pagIbigNumber?: string;
  tinNumber?: string;
  organizationId?: string;
  organizationName?: string;
}

export interface CreateEmployeeDto {
  employeeId: string;
  firstName: string
  lastName: string;
  middleName?: string;
  email: string;
  dateOfBirth: string;
  hireDate: string;
  departmentId: string | null;
  departmentName?: string;
  position: string;
  salary: number;
  employmentStatus: 'active' | 'resigned' | 'suspended' | 'terminated';
  systemRole: 'admin' | 'hrStaff' | 'payrollManager' | 'employee';
  payFrequency?: string;
  photoUrl?: string | null; // base64
  
  // Additional fields from Prisma schema
  sssNumber?: string;
  philHealthNumber?: string;
  pagIbigNumber?: string;
  tinNumber?: string;
  organizationId?: string;
}

export interface UpdateEmployeeDto {
  firstName: string;
  lastName: string;
  middleName?: string;
  email: string;
  dateOfBirth: string;
  hireDate: string;
  departmentId: string | null;
  departmentName?: string;
  position: string;
  salary: number;
  employmentStatus: 'active' | 'resigned' | 'suspended' | 'terminated';
  systemRole: 'admin' | 'hrStaff' | 'payrollManager' | 'employee';
  payFrequency?: string;
  photoUrl?: string | null; // base64
  
  // Additional fields from Prisma schema
  sssNumber?: string;
  philHealthNumber?: string;
  pagIbigNumber?: string;
  tinNumber?: string;
  organizationId?: string;
}

export interface ThirteenthMonthRecord {
  id: string;
  employeeId: string;
  year: number;
  amount: number;
  status: 'pending' | 'released';
  releasedAt?: string | Date;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface ThirteenthMonthSummary {
  totalAmount: number;
  totalRecords: number;
  averageAmount: number;
}

export interface ThirteenthMonthResponse {
  success: boolean;
  data: ThirteenthMonthRecord[];
  summary: ThirteenthMonthSummary;
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface Contribution {
  id: string;
  employeeId: string;
  code: 'SSS' | 'PHILHEALTH' | 'PAGIBIG' | 'BIR';
  employeeShare: number;
  employerShare: number;
  month: number;
  year: number;
  status: 'pending' | 'paid' | 'overdue';
  dueDate: string | Date;
  paidAt?: string | Date;
  payrollRun: {
    payDate: string | Date;
  };
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface ContributionSummary {
  code: 'SSS' | 'PHILHEALTH' | 'PAGIBIG' | 'BIR';
  totalEmployeeShare: number;
  totalEmployerShare: number;
  totalRecords: number;
  pendingAmount: number;
  paidAmount: number;
  overdueAmount: number;
  count: number;
}

export interface ContributionResponse {
  success: boolean;
  data: Contribution[];
  summary: ContributionSummary[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface CurrentMonthContributionsResponse {
  success: boolean;
  data: {
    currentMonth: number;
    currentYear: number;
    calculatedContributions: {
      sss: {
        employeeShare: number;
        employerShare: number;
        rate: string;
      };
      philHealth: {
        employeeShare: number;
        employerShare: number;
        rate: string;
      };
      pagIbig: {
        employeeShare: number;
        employerShare: number;
        rate: string;
      };
      bir: {
        employeeShare: number;
        employerShare: number;
        rate: string;
        taxableIncome: number;
      };
    };
    actualContributions: Contribution[] | null;
    payrollRun: any;
    employee: {
      id: string;
      employeeNumber: string;
      firstName: string;
      lastName: string;
      baseSalary: number;
      sssNumber?: string;
      philHealthNumber?: string;
      pagIbigNumber?: string;
      tinNumber?: string;
    };
  };
}

export interface PayslipItem {
  id: string;
  type: 'earning' | 'deduction';
  label: string;
  amount: number;
  contributionCode?: 'SSS' | 'PHILHEALTH' | 'PAGIBIG' | 'BIR';
}

export interface Payslip {
  id: string;
  employeeId: string;
  period: string;
  startDate: string | Date;
  endDate: string | Date;
  basicPay: number;
  grossPay: number;
  netPay: number;
  totalDeductions: number;
  items: PayslipItem[];
  status: 'draft' | 'approved' | 'paid';
  pdfUrl?: string;
  employee?: {
    id: string;
    firstName: string;
    lastName: string;
    employeeNumber?: string;
    department?: { name?: string } | null;
    organization?: { name?: string } | null;
    baseSalary?: number;
  };
  payrollRun: {
    periodStart: string | Date;
    periodEnd: string | Date;
    payDate: string | Date;
    frequency?: 'weekly' | 'semiMonthly' | 'monthly';
  };
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface PayslipResponse {
  success: boolean;
  data: Payslip[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

@Injectable({ providedIn: 'root' })
export class EmployeeService {
  private apiUrl = `${environment.apiUrl}/system/employee-management`;

  constructor(private http: HttpClient, private auth: AuthService) {}

  private getHeaders(): HttpHeaders {
    const token = this.auth.token;
    return new HttpHeaders({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    });
  }

  getEmployees(): Observable<{ success: boolean; data: EmployeeDto[] }> {
    return this.http.get<{ success: boolean; data: EmployeeDto[] }>(this.apiUrl, {
      headers: this.getHeaders(),
    });
  }

  createEmployee(employeeData: CreateEmployeeDto): Observable<{ success: boolean; data: EmployeeDto; message: string }> {
    return this.http.post<{ success: boolean; data: EmployeeDto; message: string }>(this.apiUrl, employeeData, {
      headers: this.getHeaders(),
    });
  }

  updateEmployee(id: string, employeeData: UpdateEmployeeDto): Observable<{ success: boolean; data: EmployeeDto; message: string }> {
    return this.http.put<{ success: boolean; data: EmployeeDto; message: string }>(`${this.apiUrl}/${id}`, employeeData, {
      headers: this.getHeaders(),
    });
  }

  deleteEmployee(id: string): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(`${this.apiUrl}/${id}`, {
      headers: this.getHeaders(),
    });
  }

  getThirteenthMonth(params: any): Observable<ThirteenthMonthResponse> {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.year) queryParams.append('year', params.year.toString());

    const url = `${environment.apiUrl}/employee/thirteenth-month?${queryParams.toString()}`;
    return this.http.get<ThirteenthMonthResponse>(url, {
      headers: this.getHeaders(),
    });
  }

  getContributions(params: any): Observable<ContributionResponse> {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.year) queryParams.append('year', params.year.toString());
    if (params.month) queryParams.append('month', params.month.toString());
    if (params.type) queryParams.append('type', params.type.toString());

    const url = `${environment.apiUrl}/employee/contributions?${queryParams.toString()}`;
    return this.http.get<ContributionResponse>(url, {
      headers: this.getHeaders(),
    });
  }

  getCurrentMonthContributions(): Observable<CurrentMonthContributionsResponse> {
    const url = `${environment.apiUrl}/employee/contributions/current-month`;
    return this.http.get<CurrentMonthContributionsResponse>(url, {
      headers: this.getHeaders(),
    });
  }

  getPayslips(params: any): Observable<PayslipResponse> {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.period) queryParams.append('period', params.period.toString());
    if (params.status) queryParams.append('status', params.status.toString());

    const url = `${environment.apiUrl}/employee/payslips?${queryParams.toString()}`;
    return this.http.get<PayslipResponse>(url, {
      headers: this.getHeaders(),
    });
  }

  // Sync current month contributions to payslip data
  syncCurrentMonthContributionsToPayslip(): Observable<{ 
    success: boolean; 
    message: string; 
    data: {
      payFrequency: string;
      payslips: Array<{
        payslipId: string;
        payrollRunId: string;
        period: string;
        frequency: string;
        grossPay: number;
        totalDeductions: number;
        netPay: number;
      }>;
      totalPayslips: number;
      calculatedContributions: any;
      totalEmployeeDeductions: number;
      netTakeHomePay: number;
    }
  }> {
    const url = `${environment.apiUrl}/employee/contributions/sync-to-payslip`;
    return this.http.post<{ 
      success: boolean; 
      message: string; 
      data: {
        payFrequency: string;
        payslips: Array<{
          payslipId: string;
          payrollRunId: string;
          period: string;
          frequency: string;
          grossPay: number;
          totalDeductions: number;
          netPay: number;
        }>;
        totalPayslips: number;
        calculatedContributions: any;
        totalEmployeeDeductions: number;
        netTakeHomePay: number;
      }
    }>(url, {}, {
      headers: this.getHeaders(),
    });
  }
}

