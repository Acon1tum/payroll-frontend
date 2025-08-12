import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environment/environment';

export interface LeaveBalance {
  id: string;
  employeeId: string;
  leaveTypeId: number;
  year: number;
  remaining: number;
  leaveType: {
    id: number;
    code: string;
    name: string;
    maxDaysPerYear: number;
    requiresDocs: boolean;
  };
}

export interface LeaveApplication {
  id: string;
  employeeId: string;
  leaveTypeId: number;
  startDate: string;
  endDate: string;
  reason?: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  approverId?: string;
  docUrl?: string;
  createdAt: string;
  leaveType: {
    id: number;
    code: string;
    name: string;
    maxDaysPerYear: number;
    requiresDocs: boolean;
  };
  approver?: {
    id: string;
    email: string;
    employee: {
      firstName: string;
      lastName: string;
    };
  };
  employee: {
    id: string;
    firstName: string;
    lastName: string;
    user: {
      email: string;
    };
  };
}

export interface LeaveType {
  id: number;
  code: string;
  name: string;
  maxDaysPerYear: number;
  requiresDocs: boolean;
}

export interface ApplyLeaveRequest {
  leaveTypeId: number;
  startDate: string;
  endDate: string;
  reason?: string;
  attachments?: string[];
}

export interface DashboardSummary {
  leaveBalances: LeaveBalance[];
  pendingRequests: number;
  approvedRequests: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

@Injectable({
  providedIn: 'root'
})
export class LeaveManagementService {
  private apiUrl = `${environment.apiUrl}/leave`;

  constructor(private http: HttpClient) {}

  // Get leave balances
  getLeaveBalances(): Observable<ApiResponse<LeaveBalance[]>> {
    return this.http.get<ApiResponse<LeaveBalance[]>>(`${this.apiUrl}/balances`);
  }

  // Get leave requests (current and pending)
  getLeaveRequests(): Observable<ApiResponse<LeaveApplication[]>> {
    return this.http.get<ApiResponse<LeaveApplication[]>>(`${this.apiUrl}/requests`);
  }

  // Get all leave applications for current year
  getAllLeaveApplications(): Observable<ApiResponse<LeaveApplication[]>> {
    return this.http.get<ApiResponse<LeaveApplication[]>>(`${this.apiUrl}/all-applications`);
  }

  // Get leave history (previous years)
  getLeaveHistory(): Observable<ApiResponse<LeaveApplication[]>> {
    return this.http.get<ApiResponse<LeaveApplication[]>>(`${this.apiUrl}/history`);
  }

  // Get leave types
  getLeaveTypes(): Observable<ApiResponse<LeaveType[]>> {
    return this.http.get<ApiResponse<LeaveType[]>>(`${this.apiUrl}/types`);
  }

  // Get dashboard summary
  getDashboardSummary(): Observable<ApiResponse<DashboardSummary>> {
    return this.http.get<ApiResponse<DashboardSummary>>(`${this.apiUrl}/dashboard-summary`);
  }

  // Apply for leave
  applyForLeave(request: ApplyLeaveRequest): Observable<ApiResponse<LeaveApplication>> {
    return this.http.post<ApiResponse<LeaveApplication>>(`${this.apiUrl}/apply`, request);
  }

  // Cancel leave request
  cancelLeaveRequest(leaveId: string): Observable<ApiResponse<LeaveApplication>> {
    return this.http.patch<ApiResponse<LeaveApplication>>(`${this.apiUrl}/cancel/${leaveId}`, {});
  }

  // Helper method to calculate days between dates (inclusive)
  calculateDays(startDate: string, endDate: string): number {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays + 1; // Inclusive
  }

  // Helper method to format date for display
  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  // Helper method to format date as numbers (MM/DD/YYYY)
  formatDateNumbers(date: string): string {
    const d = new Date(date);
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');
    const year = d.getFullYear();
    return `${month}/${day}/${year}`;
  }

  // Helper method to get status badge class
  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-700';
      case 'rejected':
        return 'bg-red-100 text-red-700';
      case 'cancelled':
        return 'bg-gray-100 text-gray-700';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  }
} 