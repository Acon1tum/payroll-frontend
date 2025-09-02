import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environment/environment';
import { catchError } from 'rxjs/operators';
import { TimezoneService } from './timezone.service';

// ==================== INTERFACES ====================

export interface Shift {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  breakStart: string;
  breakEnd: string;
  workingDays: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  employees?: Employee[];
}

export interface Employee {
  id: string;
  employeeNumber: string;
  firstName: string;
  lastName: string;
  position: string;
  department?: {
    name: string;
  };
}

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  date: Date | string; // Allow both Date and string for HTTP serialization
  timeIn?: Date | string;
  timeOut?: Date | string;
  breakStart?: Date | string;
  breakEnd?: Date | string;
  status: 'present' | 'absent' | 'late' | 'halfDay' | 'holiday' | 'leave' | 'undertime';
  calculatedHours?: number;
  overtimeHours?: number;
  lateMinutes?: number;
  underTimeMinutes?: number;
  isHoliday?: boolean;
  holidayType?: string;
  timeLogs?: TimeLog[];
  employee?: Employee;
  // AM/PM breakdown for DTR display
  amArrival?: Date | string;
  amDeparture?: Date | string;
  pmArrival?: Date | string;
  pmDeparture?: Date | string;
  // AM/PM session tracking for multiple sessions
  amTimeIn?: Date | string;
  amTimeOut?: Date | string;
  pmTimeIn?: Date | string;
  pmTimeOut?: Date | string;
  // Session completion tracking
  amSessionCompleted?: boolean;
  pmSessionCompleted?: boolean;
  allSessionsCompleted?: boolean;
}

export interface TimeLog {
  id: string;
  employeeId: string;
  timestamp: Date | string;
  type: 'timeIn' | 'timeOut' | 'breakStart' | 'breakEnd';
  location?: string;
  notes?: string;
  isManualEntry: boolean;
  date?: Date | string;
  calculatedHours?: number;
  overtimeHours?: number;
  lateMinutes?: number;
  underTimeMinutes?: number;
  status?: 'present' | 'absent' | 'late' | 'halfDay' | 'holiday' | 'leave' | 'undertime';
  isHoliday?: boolean;
  holidayType?: string;
  createdAt: Date | string;
  employee?: Employee;
  // Add session tracking
  session?: 'AM' | 'PM';
}

export interface OvertimeRequest {
  id: string;
  employeeId: string;
  date: Date;
  startTime: Date;
  endTime: Date;
  hours: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  notes?: string;
  approvedBy?: string;
  approvedAt?: Date;
  rejectedBy?: string;
  rejectedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  employee?: Employee;
}

export interface Holiday {
  id: string;
  name: string;
  date: Date;
  type: 'regular' | 'special' | 'local';
  isRecurring: boolean;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AttendancePolicy {
  id: string;
  name: string;
  description: string;
  graceMinutes: number;
  halfDayThreshold: number;
  fullDayThreshold: number;
  overtimeThreshold: number;
  allowFlexTime: boolean;
  requireBreakOut: boolean;
  maxOvertimeHours: number;
  weeklyOvertimeLimit: number;
  monthlyOvertimeLimit: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AttendanceDashboard {
  totalRecords: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  totalOvertimeHours: number;
  attendanceRate: number;
  period: {
    start: Date;
    end: Date;
  };
}

export interface EmployeeAttendanceSummary {
  totalDays: number;
  presentDays: number;
  absentDays: number;
  lateDays: number;
  totalRegularHours: number;
  totalOvertimeHours: number;
  totalLateMinutes: number;
  records: AttendanceRecord[];
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

// ==================== SERVICE ====================

@Injectable({
  providedIn: 'root'
})
export class AttendanceService {
  private apiUrl = `${environment.apiUrl}/attendance`;

  constructor(private http: HttpClient, private timezoneService: TimezoneService) {}

  // ==================== SHIFT MANAGEMENT ====================

  // Create a new shift
  createShift(shiftData: Partial<Shift>): Observable<Shift> {
    return this.http.post<{ success: boolean; data: Shift }>(`${this.apiUrl}/shifts`, shiftData)
      .pipe(map(response => response.data));
  }

  // Get all shifts
  getAllShifts(): Observable<Shift[]> {
    return this.http.get<{ success: boolean; data: Shift[] }>(`${this.apiUrl}/shifts`)
      .pipe(map(response => response.data));
  }

  // Get shift by ID
  getShiftById(id: string): Observable<Shift> {
    return this.http.get<{ success: boolean; data: Shift }>(`${this.apiUrl}/shifts/${id}`)
      .pipe(map(response => response.data));
  }

  // Update shift
  updateShift(id: string, shiftData: Partial<Shift>): Observable<Shift> {
    return this.http.put<{ success: boolean; data: Shift }>(`${this.apiUrl}/shifts/${id}`, shiftData)
      .pipe(map(response => response.data));
  }

  // Delete shift
  deleteShift(id: string): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(`${this.apiUrl}/shifts/${id}`);
  }

  // ==================== ATTENDANCE RECORDS ====================

  // Note: Attendance records are now generated from time logs on the backend
  // No need to create/update them directly

  // Get attendance records with filters
  getAttendanceRecords(params: {
    employeeId?: string;
    startDate?: string;
    endDate?: string;
    status?: string;
    departmentId?: string;
    page?: number;
    limit?: number;
  } = {}): Observable<PaginatedResponse<AttendanceRecord>> {
    let httpParams = new HttpParams();
    
    Object.keys(params).forEach(key => {
      if (params[key as keyof typeof params] !== undefined) {
        httpParams = httpParams.set(key, params[key as keyof typeof params]!.toString());
      }
    });

    return this.http.get<{ success: boolean; data: AttendanceRecord[]; pagination: any }>(`${this.apiUrl}/records`, { params: httpParams })
      .pipe(map(response => ({
        data: response.data,
        pagination: response.pagination
      })));
  }

  // Get employee attendance summary
  getEmployeeAttendanceSummary(employeeId: string, month: number, year: number): Observable<EmployeeAttendanceSummary> {
    const params = new HttpParams()
      .set('employeeId', employeeId)
      .set('month', month.toString())
      .set('year', year.toString());

    return this.http.get<{ success: boolean; data: EmployeeAttendanceSummary; message?: string }>(`${this.apiUrl}/records/summary`, { params })
      .pipe(map(response => {
        if (!response.success) {
          throw new Error(response.message || 'Failed to fetch monthly attendance');
        }
        return response.data;
      }),
      catchError(error => {
        console.error('Error in getEmployeeMonthlyAttendance:', error);
        if (error.status === 0) {
          throw new Error('Network error: Unable to connect to server. Please check your internet connection.');
        } else if (error.status === 401) {
          throw new Error('Authentication failed. Please log in again.');
        } else if (error.status === 403) {
          throw new Error('Access denied. You do not have permission to view this data.');
        } else if (error.status === 500) {
          throw new Error('Server error. Please try again later.');
        } else {
          throw new Error(`Request failed: ${error.message || 'Unknown error'}`);
        }
      })
    );
  }

  // ==================== TIME LOGS ====================

  // Create time log entry
  createTimeLog(timeLogData: Partial<TimeLog>): Observable<TimeLog> {
    console.log('Creating time log with data:', timeLogData);
    console.log('API URL:', `${this.apiUrl}/time-logs`);
    console.log('Request body being sent:', JSON.stringify(timeLogData, null, 2));
    
    return this.http.post<{ success: boolean; data: TimeLog; message?: string }>(`${this.apiUrl}/time-logs`, timeLogData)
      .pipe(
        map(response => {
          console.log('Time log creation response:', response);
          if (!response.success) {
            throw new Error(response.message || 'Failed to create time log');
          }
          return response.data;
        }),
        catchError(error => {
          console.error('Error in createTimeLog:', error);
          console.error('Error details:', {
            status: error.status,
            statusText: error.statusText,
            message: error.message,
            error: error.error
          });
          
          if (error.status === 0) {
            throw new Error('Network error: Unable to connect to server. Please check your internet connection.');
          } else if (error.status === 401) {
            throw new Error('Authentication failed. Please log in again.');
          } else if (error.status === 403) {
            throw new Error('Access denied. You do not have permission to perform this action.');
          } else if (error.status === 400) {
            // Show the specific error message from the backend
            const errorMessage = error.error?.message || error.message || 'Bad request';
            throw new Error(`Validation error: ${errorMessage}`);
          } else if (error.status === 500) {
            throw new Error('Server error. Please try again later.');
          } else {
            throw new Error(`Request failed: ${error.message || 'Unknown error'}`);
          }
        })
      );
  }

  // Get time logs with filters
  getTimeLogs(params: {
    startDate?: string;
    endDate?: string;
    type?: string;
    page?: number;
    limit?: number;
  } = {}): Observable<PaginatedResponse<TimeLog>> {
    let httpParams = new HttpParams();
    
    Object.keys(params).forEach(key => {
      if (params[key as keyof typeof params] !== undefined) {
        httpParams = httpParams.set(key, params[key as keyof typeof params]!.toString());
      }
    });

    console.log('getTimeLogs service method called with params:', params);
    console.log('HTTP params:', httpParams.toString());
    console.log('Full API URL:', `${this.apiUrl}/time-logs`);

    return this.http.get<{ success: boolean; data: TimeLog[]; pagination: any }>(`${this.apiUrl}/time-logs`, { params: httpParams })
      .pipe(
        map(response => {
          console.log('getTimeLogs HTTP response:', response);
          return {
            data: response.data,
            pagination: response.pagination
          };
        }),
        catchError(error => {
          console.error('getTimeLogs HTTP error:', error);
          console.error('Error details:', {
            message: error instanceof Error ? error.message : 'Unknown error',
            status: (error as any)?.status,
            statusText: (error as any)?.statusText,
            url: (error as any)?.url
          });
          throw error;
        })
      );
  }

  // ==================== OVERTIME REQUESTS ====================

  // Create overtime request
  createOvertimeRequest(overtimeData: Partial<OvertimeRequest>): Observable<OvertimeRequest> {
    return this.http.post<{ success: boolean; data: OvertimeRequest }>(`${this.apiUrl}/overtime`, overtimeData)
      .pipe(map(response => response.data));
  }

  // Get overtime requests
  getOvertimeRequests(params: {
    status?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  } = {}): Observable<PaginatedResponse<OvertimeRequest>> {
    let httpParams = new HttpParams();
    
    Object.keys(params).forEach(key => {
      if (params[key as keyof typeof params] !== undefined) {
        httpParams = httpParams.set(key, params[key as keyof typeof params]!.toString());
      }
    });

    return this.http.get<{ success: boolean; data: OvertimeRequest[]; pagination: any }>(`${this.apiUrl}/overtime`, { params: httpParams })
      .pipe(map(response => ({
        data: response.data,
        pagination: response.pagination
      })));
  }

  // Update overtime request status
  updateOvertimeRequestStatus(id: string, status: string, notes?: string): Observable<OvertimeRequest> {
    return this.http.put<{ success: boolean; data: OvertimeRequest }>(`${this.apiUrl}/overtime/${id}/status`, { status, notes })
      .pipe(map(response => response.data));
  }

  // ==================== HOLIDAYS ====================

  // Create holiday
  createHoliday(holidayData: Partial<Holiday>): Observable<Holiday> {
    return this.http.post<{ success: boolean; data: Holiday }>(`${this.apiUrl}/holidays`, holidayData)
      .pipe(map(response => response.data));
  }

  // Get holidays
  getHolidays(params: { year?: number; type?: string } = {}): Observable<Holiday[]> {
    let httpParams = new HttpParams();
    
    if (params.year) {
      httpParams = httpParams.set('year', params.year.toString());
    }
    if (params.type) {
      httpParams = httpParams.set('type', params.type);
    }

    return this.http.get<{ success: boolean; data: Holiday[] }>(`${this.apiUrl}/holidays`, { params: httpParams })
      .pipe(map(response => response.data));
  }

  // ==================== ATTENDANCE POLICIES ====================

  // Create attendance policy
  createAttendancePolicy(policyData: Partial<AttendancePolicy>): Observable<AttendancePolicy> {
    return this.http.post<{ success: boolean; data: AttendancePolicy }>(`${this.apiUrl}/policies`, policyData)
      .pipe(map(response => response.data));
  }

  // Get attendance policies
  getAttendancePolicies(): Observable<AttendancePolicy[]> {
    return this.http.get<{ success: boolean; data: AttendancePolicy[] }>(`${this.apiUrl}/policies`)
      .pipe(map(response => response.data));
  }

  // ==================== REPORTS & ANALYTICS ====================

  // Get attendance dashboard
  getAttendanceDashboard(params: {
    startDate?: string;
    endDate?: string;
    departmentId?: string;
  } = {}): Observable<AttendanceDashboard> {
    let httpParams = new HttpParams();
    
    Object.keys(params).forEach(key => {
      if (params[key as keyof typeof params] !== undefined) {
        httpParams = httpParams.set(key, params[key as keyof typeof params]!.toString());
      }
    });

    return this.http.get<{ success: boolean; data: AttendanceDashboard }>(`${this.apiUrl}/dashboard`, { params: httpParams })
      .pipe(map(response => response.data));
  }

  // Get employee attendance report
  getEmployeeAttendanceReport(employeeId: string, startDate: string, endDate: string): Observable<EmployeeAttendanceSummary> {
    const params = new HttpParams()
      .set('employeeId', employeeId)
      .set('startDate', startDate)
      .set('endDate', endDate);

    return this.http.get<{ success: boolean; data: EmployeeAttendanceSummary }>(`${this.apiUrl}/reports/employee`, { params })
      .pipe(map(response => response.data));
  }

  // ==================== EMPLOYEE TIME TRACKING ====================

  // Employee clock in
  clockIn(location?: string, notes?: string): Observable<TimeLog> {
    const timeLogData = {
      timestamp: this.timezoneService.getNowIsoInSystemTimezone(),
      type: 'timeIn' as const,
      location,
      notes,
      isManualEntry: false,
      session: this.determineSession()
    };

    console.log('clockIn called with timeLogData:', timeLogData);
    console.log('Session determined:', this.determineSession());

    return this.createTimeLog(timeLogData);
  }

  // Employee clock out
  clockOut(location?: string, notes?: string): Observable<TimeLog> {
    const timeLogData = {
      timestamp: this.timezoneService.getNowIsoInSystemTimezone(),
      type: 'timeOut' as const,
      location,
      notes,
      isManualEntry: false,
      session: this.determineSession()
    };

    return this.createTimeLog(timeLogData);
  }

  // Employee break start
  startBreak(location?: string, notes?: string): Observable<TimeLog> {
    const timeLogData = {
      timestamp: this.timezoneService.getNowIsoInSystemTimezone(),
      type: 'breakStart' as const,
      location,
      notes,
      isManualEntry: false,
      session: this.determineSession()
    };

    return this.createTimeLog(timeLogData);
  }

  // Employee break end
  endBreak(location?: string, notes?: string): Observable<TimeLog> {
    const timeLogData = {
      timestamp: this.timezoneService.getNowIsoInSystemTimezone(),
      type: 'breakEnd' as const,
      location,
      notes,
      isManualEntry: false,
      session: this.determineSession()
    };

    return this.createTimeLog(timeLogData);
  }

  // Determine if current time is AM or PM session
  private determineSession(): 'AM' | 'PM' {
    const now = new Date();
    const hour = now.getHours();
    return hour < 12 ? 'AM' : 'PM';
  }

  // Get session status for the current day
  getSessionStatus(employeeId: string, date: string): Observable<{
    amSessionCompleted: boolean;
    pmSessionCompleted: boolean;
    allSessionsCompleted: boolean;
    canClockInAM: boolean;
    canClockOutAM: boolean;
    canClockInPM: boolean;
    canClockOutPM: boolean;
  }> {
    const params = {
      startDate: date,
      endDate: date
    };

    return this.getTimeLogs(params).pipe(
      map(response => {
        const timeLogs = response.data;
        return this.calculateSessionStatus(timeLogs);
      })
    );
  }

  // Calculate session status from time logs
  private calculateSessionStatus(timeLogs: TimeLog[]): {
    amSessionCompleted: boolean;
    pmSessionCompleted: boolean;
    allSessionsCompleted: boolean;
    canClockInAM: boolean;
    canClockOutAM: boolean;
    canClockInPM: boolean;
    canClockOutPM: boolean;
  } {
    const amLogs = timeLogs.filter(log => log.session === 'AM');
    const pmLogs = timeLogs.filter(log => log.session === 'PM');

    // Check AM session completion
    const amTimeIn = amLogs.find(log => log.type === 'timeIn');
    const amTimeOut = amLogs.find(log => log.type === 'timeOut');
    const amSessionCompleted = !!(amTimeIn && amTimeOut);

    // Check PM session completion
    const pmTimeIn = pmLogs.find(log => log.type === 'timeIn');
    const pmTimeOut = pmLogs.find(log => log.type === 'timeOut');
    const pmSessionCompleted = !!(pmTimeIn && pmTimeOut);

    // Overall completion
    const allSessionsCompleted = amSessionCompleted && pmSessionCompleted;

    // Determine button states
    // AM Clock In: Only if no AM time in exists and AM session not completed
    const canClockInAM = !amTimeIn && !amSessionCompleted && !allSessionsCompleted;
    // AM Clock Out: Only if AM time in exists but no AM time out
    const canClockOutAM = !!amTimeIn && !amTimeOut && !allSessionsCompleted;
    // PM Clock In: Only if AM session is completed and no PM time in exists
    const canClockInPM = amSessionCompleted && !pmTimeIn && !pmSessionCompleted && !allSessionsCompleted;
    // PM Clock Out: Only if PM time in exists but no PM time out
    const canClockOutPM = !!pmTimeIn && !pmTimeOut && !allSessionsCompleted;

    const sessionStatus = {
      amSessionCompleted,
      pmSessionCompleted,
      allSessionsCompleted,
      canClockInAM,
      canClockOutAM,
      canClockInPM,
      canClockOutPM
    };

    // Debug logging
    console.log('Session status calculation:', {
      amTimeIn: !!amTimeIn,
      amTimeOut: !!amTimeOut,
      pmTimeIn: !!pmTimeIn,
      pmTimeOut: !!pmTimeOut,
      amSessionCompleted,
      pmSessionCompleted,
      allSessionsCompleted,
      canClockInAM,
      canClockOutAM,
      canClockInPM,
      canClockOutPM
    });

    return sessionStatus;
  }

  // Get current day attendance for employee
  getCurrentDayAttendance(): Observable<AttendanceRecord | null> {
    const today = new Date().toISOString().split('T')[0];
    const params = new HttpParams()
      .set('startDate', today)
      .set('endDate', today)
      .set('limit', '1');

    return this.http.get<{ success: boolean; data: AttendanceRecord[]; pagination: any }>(`${this.apiUrl}/records`, { params })
      .pipe(map(response => response.data[0] || null));
  }

  // Get employee monthly attendance
  getEmployeeMonthlyAttendance(month: number, year: number): Observable<EmployeeAttendanceSummary> {
    const params = new HttpParams()
      .set('month', month.toString())
      .set('year', year.toString());

    console.log('Fetching monthly attendance for month:', month, 'year:', year);
    console.log('Full API URL:', `${this.apiUrl}/records/summary`);
    console.log('Query parameters:', params.toString());
    
    return this.http.get<{ success: boolean; data: EmployeeAttendanceSummary; message?: string }>(`${this.apiUrl}/records/summary`, { params })
      .pipe(
        map(response => {
          console.log('Monthly attendance response:', response);
          if (!response.success) {
            throw new Error(response.message || 'Failed to fetch monthly attendance');
          }
          return response.data;
        }),
        catchError(error => {
          console.error('Error in getEmployeeMonthlyAttendance:', error);
          if (error.status === 0) {
            throw new Error('Network error: Unable to connect to server. Please check your internet connection.');
          } else if (error.status === 401) {
            throw new Error('Authentication failed. Please log in again.');
          } else if (error.status === 403) {
            throw new Error('Access denied. You do not have permission to view this data.');
          } else if (error.status === 500) {
            throw new Error('Server error. Please try again later.');
          } else {
            throw new Error(`Request failed: ${error.message || 'Unknown error'}`);
          }
        })
      );
  }

  // ==================== UTILITY METHODS ====================

  // Convert date to yyyy-MM-dd format for HTML date inputs
  formatDateForInput(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  // Convert yyyy-MM-dd string to Date object
  parseDateFromInput(dateString: string): Date {
    return new Date(dateString + 'T00:00:00');
  }

  // Convert time to HH:mm format for HTML time inputs
  formatTimeForInput(date: Date): string {
    return date.toTimeString().slice(0, 5);
  }

  // Parse HH:mm string to Date object
  parseTimeFromInput(timeString: string, baseDate: Date = new Date()): Date {
    const [hours, minutes] = timeString.split(':').map(Number);
    const date = new Date(baseDate);
    date.setHours(hours, minutes, 0, 0);
    return date;
  }

  // Calculate working hours between two times
  calculateWorkingHours(startTime: Date, endTime: Date): number {
    const diffMs = endTime.getTime() - startTime.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    return Math.round(diffHours * 100) / 100; // Round to 2 decimal places
  }

  // Check if current time is within working hours
  isWithinWorkingHours(shift: Shift): boolean {
    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 5);
    
    return currentTime >= shift.startTime && currentTime <= shift.endTime;
  }

  // Get current working day (1-7, where 1 is Monday)
  getCurrentWorkingDay(): number {
    const day = new Date().getDay();
    return day === 0 ? 7 : day; // Convert Sunday from 0 to 7
  }

  // Check if today is a working day for a shift
  isWorkingDay(shift: Shift): boolean {
    const currentDay = this.getCurrentWorkingDay().toString();
    return shift.workingDays.includes(currentDay);
  }

  // Get attendance status based on time logs
  // Business Rules for Attendance Status:
  // - 8+ hours = Present (Full day)
  // - Below 8 hours but > 0 = Undertime
  // - 0 hours = Absent
  getAttendanceStatus(timeIn?: Date, timeOut?: Date, shift?: Shift): string {
    if (!timeIn) return 'absent';
    
    if (shift) {
      const shiftStart = this.parseTimeFromInput(shift.startTime);
      const graceTime = new Date(shiftStart.getTime() + 15 * 60000); // Default 15 minutes grace time
      
      if (timeIn > graceTime) return 'late';
    }
    
    if (!timeOut) return 'present';
    
    // Calculate if it's a full day or undertime
    // Updated business rules: 8+ hours = Present, below 8 hours = Undertime
    const hours = this.calculateWorkingHours(timeIn, timeOut);
    if (hours >= 8) return 'present';
    if (hours > 0) return 'undertime';
    
    return 'absent';
  }


}
