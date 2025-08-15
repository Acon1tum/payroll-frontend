import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environment/environment';

export interface LeaveType {
  id: number;
  code: string;
  name: string;
  maxDaysPerYear: number;
  requiresDocs: boolean;
}

export interface LeaveBalance {
  id: string;
  employeeId: string;
  leaveTypeId: number;
  year: number;
  remaining: number;
  employee?: {
    id: string;
    firstName: string;
    lastName: string;
    employeeId: string;
    department?: {
      name: string;
    };
  };
  leaveType?: LeaveType;
}

export interface LeaveAdjustment {
  id: string;
  employeeId: string;
  leaveTypeId: number;
  amountDays: number;
  adjustmentType: 'credit' | 'debit';
  reason?: string;
  createdAt: Date;
  employee?: {
    id: string;
    firstName: string;
    lastName: string;
    employeeId: string;
  };
  leaveType?: LeaveType;
}

export interface LeaveCreditSetting {
  id?: string;
  leaveTypeId: number;
  employmentType: string; // e.g., 'Regular', 'Probationary', 'Contractual'
  annualCap: number;
  monthlyCap: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface LeaveApplication {
  id: string;
  employeeId: string;
  leaveTypeId: number;
  startDate: Date;
  endDate: Date;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  docUrl?: string;
  createdAt: Date;
  approverId?: string;
  employee?: {
    id: string;
    firstName: string;
    lastName: string;
    employeeId: string;
    department?: {
      name: string;
    };
  };
  leaveType?: LeaveType;
}

export interface CreateLeaveApplicationRequest {
  employeeId: string;
  leaveTypeId: number;
  startDate: Date;
  endDate: Date;
  reason: string;
  docUrl?: string;
}

export interface UpdateLeaveApplicationRequest {
  status: 'approved' | 'rejected';
}

export interface CreateLeaveAdjustmentRequest {
  employeeId: string;
  leaveTypeId: number;
  amountDays: number;
  adjustmentType: 'credit' | 'debit';
  reason?: string;
}

export interface ResetLeaveBalanceRequest {
  employeeId: string;
  leaveTypeId: number;
  year: number;
  newBalance: number;
  reason?: string;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

@Injectable({
  providedIn: 'root'
})
export class LeaveService {
  private apiUrl = `${environment.apiUrl}/leave`;
  private leaveBalancesSubject = new BehaviorSubject<LeaveBalance[]>([]);
  private leaveTypesSubject = new BehaviorSubject<LeaveType[]>([]);
  private adjustmentsSubject = new BehaviorSubject<LeaveAdjustment[]>([]);

  public leaveBalances$ = this.leaveBalancesSubject.asObservable();
  public leaveTypes$ = this.leaveTypesSubject.asObservable();
  public adjustments$ = this.adjustmentsSubject.asObservable();

  constructor(private http: HttpClient) {}

  // Leave Types
  getLeaveTypes(): Observable<LeaveType[]> {
    return this.http.get<ApiResponse<LeaveType[]>>(`${this.apiUrl}/types`)
      .pipe(map(response => response.data));
  }

  createLeaveType(leaveType: Partial<LeaveType>): Observable<LeaveType> {
    return this.http.post<ApiResponse<LeaveType>>(`${this.apiUrl}/types`, leaveType)
      .pipe(map(response => response.data));
  }

  updateLeaveType(id: number, leaveType: Partial<LeaveType>): Observable<LeaveType> {
    return this.http.put<ApiResponse<LeaveType>>(`${this.apiUrl}/types/${id}`, leaveType)
      .pipe(map(response => response.data));
  }

  deleteLeaveType(id: number): Observable<void> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/types/${id}`)
      .pipe(map(response => response.data));
  }

  // Leave Balances
  getLeaveBalances(year?: number, employeeId?: string): Observable<LeaveBalance[]> {
    let params: any = {};
    if (year) params.year = year;
    if (employeeId) params.employeeId = employeeId;
    
    return this.http.get<ApiResponse<LeaveBalance[]>>(`${this.apiUrl}/balances`, { params })
      .pipe(map(response => response.data));
  }

  getLeaveBalance(id: string): Observable<LeaveBalance> {
    return this.http.get<ApiResponse<LeaveBalance>>(`${this.apiUrl}/balances/${id}`)
      .pipe(map(response => response.data));
  }

  createLeaveBalance(balance: Partial<LeaveBalance>): Observable<LeaveBalance> {
    return this.http.post<ApiResponse<LeaveBalance>>(`${this.apiUrl}/balances`, balance)
      .pipe(map(response => response.data));
  }

  updateLeaveBalance(id: string, balance: Partial<LeaveBalance>): Observable<LeaveBalance> {
    return this.http.put<ApiResponse<LeaveBalance>>(`${this.apiUrl}/balances/${id}`, balance)
      .pipe(map(response => response.data));
  }

  deleteLeaveBalance(id: string): Observable<void> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/balances/${id}`)
      .pipe(map(response => response.data));
  }

  // Leave Adjustments
  getLeaveAdjustments(employeeId?: string, leaveTypeId?: number): Observable<LeaveAdjustment[]> {
    let params: any = {};
    if (employeeId) params.employeeId = employeeId;
    if (leaveTypeId) params.leaveTypeId = leaveTypeId;
    
    return this.http.get<ApiResponse<LeaveAdjustment[]>>(`${this.apiUrl}/adjustments`, { params })
      .pipe(map(response => response.data));
  }

  createLeaveAdjustment(adjustment: CreateLeaveAdjustmentRequest): Observable<LeaveAdjustment> {
    return this.http.post<ApiResponse<LeaveAdjustment>>(`${this.apiUrl}/adjustments`, adjustment)
      .pipe(map(response => response.data));
  }

  // Reset Leave Balance
  resetLeaveBalance(request: ResetLeaveBalanceRequest): Observable<LeaveBalance> {
    return this.http.post<ApiResponse<LeaveBalance>>(`${this.apiUrl}/balances/reset`, request)
      .pipe(map(response => response.data));
  }

  // Bulk Operations
  bulkResetLeaveBalances(year: number, leaveTypeId: number, newBalance: number): Observable<LeaveBalance[]> {
    return this.http.post<ApiResponse<LeaveBalance[]>>(`${this.apiUrl}/balances/bulk-reset`, {
      year,
      leaveTypeId,
      newBalance
    }).pipe(map(response => response.data));
  }

  // Reports
  getLeaveBalanceReport(year: number, departmentId?: string): Observable<any> {
    let params: any = { year };
    if (departmentId) params.departmentId = departmentId;
    
    return this.http.get<ApiResponse<any>>(`${this.apiUrl}/reports/balance`, { params })
      .pipe(map(response => response.data));
  }

  // Update local state
  updateLeaveBalances(balances: LeaveBalance[]) {
    this.leaveBalancesSubject.next(balances);
  }

  updateLeaveTypes(types: LeaveType[]) {
    this.leaveTypesSubject.next(types);
  }

  updateAdjustments(adjustments: LeaveAdjustment[]) {
    this.adjustmentsSubject.next(adjustments);
  }

  // Leave Credit Settings
  addLeaveCreditSetting(creditSetting: Partial<LeaveCreditSetting>): Observable<LeaveCreditSetting> {
    return this.http.post<ApiResponse<LeaveCreditSetting>>(`${this.apiUrl}/credit-settings`, creditSetting)
      .pipe(map(response => response.data));
  }

  updateLeaveCreditSetting(id: string, creditSetting: Partial<LeaveCreditSetting>): Observable<LeaveCreditSetting> {
    return this.http.put<ApiResponse<LeaveCreditSetting>>(`${this.apiUrl}/credit-settings/${id}`, creditSetting)
      .pipe(map(response => response.data));
  }

  deleteLeaveCreditSetting(id?: string): Observable<void> {
    if (!id) {
      return new Observable(observer => {
        observer.error(new Error('Credit setting ID is required'));
        observer.complete();
      });
    }
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/credit-settings/${id}`)
      .pipe(map(response => response.data));
  }

  updateLeaveCreditSettings(creditSettings: LeaveCreditSetting[]) {
    // Note: This would need a new BehaviorSubject if you want to track credit settings
    // For now, just log the update
    console.log('Credit settings updated:', creditSettings);
  }

  // Leave Applications
  getLeaveApplications(employeeId?: string, status?: 'pending' | 'approved' | 'rejected'): Observable<LeaveApplication[]> {
    let params: any = {};
    if (employeeId) params.employeeId = employeeId;
    if (status) params.status = status;
    
    return this.http.get<ApiResponse<LeaveApplication[]>>(`${this.apiUrl}/applications`, { params })
      .pipe(map(response => response.data));
  }

  getLeaveApplication(id: string): Observable<LeaveApplication> {
    return this.http.get<ApiResponse<LeaveApplication>>(`${this.apiUrl}/applications/${id}`)
      .pipe(map(response => response.data));
  }

  createLeaveApplication(application: CreateLeaveApplicationRequest): Observable<LeaveApplication> {
    return this.http.post<ApiResponse<LeaveApplication>>(`${this.apiUrl}/applications`, application)
      .pipe(map(response => response.data));
  }

  updateLeaveApplication(id: string, updateRequest: UpdateLeaveApplicationRequest): Observable<LeaveApplication> {
    return this.http.put<ApiResponse<LeaveApplication>>(`${this.apiUrl}/applications/${id}`, updateRequest)
      .pipe(map(response => response.data));
  }

  // Helper methods
  calculateRemainingBalance(initialBalance: number, adjustments: LeaveAdjustment[]): number {
    return adjustments.reduce((balance, adjustment) => {
      if (adjustment.adjustmentType === 'credit') {
        return balance + adjustment.amountDays;
      } else {
        return balance - adjustment.amountDays;
      }
    }, initialBalance);
  }
}