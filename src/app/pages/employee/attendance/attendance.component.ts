import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SidebarComponent } from "../../../shared/sidebar/sidebar.component";
import { HeaderComponent } from "../../../shared/header/header.component";
import { AttendanceService, AttendanceRecord, TimeLog, Employee } from '../../../services/attendance.service';
import { AuthService } from '../../../services/auth.service';
import { Subject, takeUntil } from 'rxjs';

interface Breadcrumb {
  label: string;
  path?: string;
  active?: boolean;
}

interface DTRRecord {
  date: Date;
  amArrival?: Date;
  amDeparture?: Date;
  pmArrival?: Date;
  pmDeparture?: Date;
  totalHours: number;
  totalMinutes: number;
  status: string;
  notes?: string;
}

@Component({
  selector: 'app-attendance',
  standalone: true,
  imports: [CommonModule, FormsModule, SidebarComponent, HeaderComponent],
  templateUrl: './attendance.component.html',
  styleUrl: './attendance.component.scss'
})
export class AttendanceComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  breadcrumbs: Breadcrumb[] = [
    { label: 'Home', path: '/employee' },
    { label: 'Attendance', path: '/employee/attendance' }
  ];

  // Current user info
  currentUser: any;
  currentEmployeeId: string = '';

  // Current day attendance
  currentDayAttendance: AttendanceRecord | null = null;
  todayTimeLogs: TimeLog[] = [];
  
  // Monthly attendance data
  monthlyAttendance: DTRRecord[] = [];
  currentMonth: number = new Date().getMonth();
  currentYear: number = new Date().getFullYear();

  // UI states
  isLoading = false;
  isClockingIn = false;
  isClockingOut = false;
  isStartingBreak = false;
  isEndingBreak = false;

  // Form data
  clockInLocation = '';
  clockInNotes = '';
  clockOutLocation = '';
  clockOutNotes = '';

  // Time display
  currentTime = new Date();
  timeInterval: any;

  // Guards to prevent multiple calls
  private isInitialized = false;
  private isDataLoading = false;

  constructor(
    private attendanceService: AttendanceService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.initializeComponent();
    this.startTimeUpdate();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.timeInterval) {
      clearInterval(this.timeInterval);
    }
  }

  private initializeComponent() {
    if (this.isInitialized) return;
    
    this.currentUser = this.authService.currentUser;
    console.log('Current user from auth service:', this.currentUser);
    console.log('Employee object:', this.currentUser?.employee);
    
    // Debug current date information
    const now = new Date();
    console.log('Current date:', now);
    console.log('Current month (0-11):', now.getMonth());
    console.log('Current month (1-12):', now.getMonth() + 1);
    console.log('Current year:', now.getFullYear());
    console.log('Component month:', this.currentMonth);
    console.log('Component year:', this.currentYear);
    
    if (this.currentUser?.employee?.id) {
      this.currentEmployeeId = this.currentUser.employee.id;
      console.log('Employee ID set to:', this.currentEmployeeId);
      this.isInitialized = true;
      this.loadCurrentDayAttendance();
      this.loadMonthlyAttendance();
    } else {
      console.error('No employee ID found in user object:', this.currentUser);
    }
  }

  private startTimeUpdate() {
    this.timeInterval = setInterval(() => {
      this.currentTime = new Date();
    }, 1000);
  }

  // ==================== TIME TRACKING ====================

  async clockIn() {
    if (!this.currentEmployeeId || this.isClockingIn) return;

    console.log('Attempting to clock in for employee:', this.currentEmployeeId);
    this.isClockingIn = true;
    
    try {
      // Use firstValueFrom instead of deprecated toPromise()
      const result = await this.attendanceService.clockIn(
        this.clockInLocation || undefined, 
        this.clockInNotes || undefined
      ).toPromise();

      console.log('Clock in successful:', result);
      this.clockInLocation = '';
      this.clockInNotes = '';
      
      // Refresh data immediately to show updated status
      console.log('Refreshing data after clock-in...');
      await this.loadCurrentDayAttendance();
      console.log('Current day attendance loaded, now loading monthly...');
      await this.loadMonthlyAttendance();
      console.log('Data refresh complete');
      
      // Force change detection by updating a simple property
      console.log('Final state check:');
      console.log('- todayTimeLogs length:', this.todayTimeLogs.length);
      console.log('- canClockIn():', this.canClockIn());
      console.log('- canClockOut():', this.canClockOut());
      console.log('- getCurrentStatus():', this.getCurrentStatus());
    } catch (error) {
      console.error('Error clocking in:', error);
      // Show user-friendly error message
      alert(`Failed to clock in: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      this.isClockingIn = false;
    }
  }

  async clockOut() {
    if (!this.currentEmployeeId || this.isClockingOut) return;

    this.isClockingOut = true;
    try {
      await this.attendanceService.clockOut(
        this.clockOutLocation || undefined, 
        this.clockOutNotes || undefined
      ).toPromise();

      this.clockOutLocation = '';
      this.clockOutNotes = '';
      
      // Refresh data immediately to show updated status
      console.log('Refreshing data after clock-out...');
      await this.loadCurrentDayAttendance();
      console.log('Current day attendance loaded, now loading monthly...');
      await this.loadMonthlyAttendance();
      console.log('Data refresh complete');
    } catch (error) {
      console.error('Error clocking out:', error);
    } finally {
      this.isClockingOut = false;
    }
  }

  async startBreak() {
    if (!this.currentEmployeeId) return;

    this.isStartingBreak = true;
    try {
      await this.attendanceService.startBreak(
        undefined, 
        'Break started'
      ).toPromise();

      this.loadCurrentDayAttendance();
    } catch (error) {
      console.error('Error starting break:', error);
    } finally {
      this.isStartingBreak = false;
    }
  }

  async endBreak() {
    if (!this.currentEmployeeId) return;

    this.isEndingBreak = true;
    try {
      await this.attendanceService.endBreak(
        undefined, 
        'Break ended'
      ).toPromise();

      this.loadCurrentDayAttendance();
    } catch (error) {
      console.error('Error ending break:', error);
    } finally {
      this.isEndingBreak = false;
    }
  }

  // ==================== DATA LOADING ====================

  private async loadCurrentDayAttendance() {
    if (!this.currentEmployeeId || this.isDataLoading) return;

    try {
      this.isDataLoading = true;
      // Since we're now working with time logs directly, just load today's time logs
      await this.loadTodayTimeLogs();
      
      // Generate current day attendance record from time logs for display
      if (this.todayTimeLogs.length > 0) {
        const today = new Date().toISOString().split('T')[0];
        this.currentDayAttendance = {
          id: `generated-${today}`,
          employeeId: this.currentEmployeeId,
          date: new Date(today + 'T00:00:00.000Z'),
          timeIn: undefined,
          timeOut: undefined,
          breakStart: undefined,
          breakEnd: undefined,
          status: 'present',
          calculatedHours: 0,
          overtimeHours: 0,
          lateMinutes: 0,
          underTimeMinutes: 0,
          isHoliday: false,
          holidayType: undefined,
          timeLogs: this.todayTimeLogs
        };

        // Set the appropriate times based on time logs
        this.todayTimeLogs.forEach(log => {
          switch (log.type) {
            case 'timeIn':
              this.currentDayAttendance!.timeIn = new Date(log.timestamp);
              break;
            case 'timeOut':
              this.currentDayAttendance!.timeOut = new Date(log.timestamp);
              break;
            case 'breakStart':
              this.currentDayAttendance!.breakStart = new Date(log.timestamp);
              break;
            case 'breakEnd':
              this.currentDayAttendance!.breakEnd = new Date(log.timestamp);
              break;
          }
        });
      } else {
        this.currentDayAttendance = null;
      }
    } catch (error) {
      console.error('Error loading current day attendance:', error);
      // Don't retry on error to prevent infinite loops
    } finally {
      this.isDataLoading = false;
    }
  }

  private async loadTodayTimeLogs() {
    if (!this.currentEmployeeId) return;

    try {
      const today = new Date().toISOString().split('T')[0];
      console.log('Loading time logs for today:', today);
      console.log('Current employee ID:', this.currentEmployeeId);
      
      console.log('About to call getTimeLogs with params:', { startDate: today, endDate: today });
      
      const response = await this.attendanceService
        .getTimeLogs({
          startDate: today,
          endDate: today
        })
        .toPromise();

      console.log('Time logs response:', response);
      this.todayTimeLogs = response?.data || [];
      console.log('Today time logs loaded:', this.todayTimeLogs);
      console.log('Time logs count:', this.todayTimeLogs.length);
      
      // Debug each time log
      this.todayTimeLogs.forEach((log, index) => {
        console.log(`Time log ${index}:`, {
          id: log.id,
          type: log.type,
          timestamp: log.timestamp,
          employeeId: log.employeeId
        });
      });
      
      // If no time logs found, log a warning
      if (this.todayTimeLogs.length === 0) {
        console.warn('No time logs found for today. This might indicate:');
        console.warn('1. Backend API is not running');
        console.warn('2. API endpoint is returning an error');
        console.warn('3. No time logs exist for today');
        console.warn('4. Authentication issue with API calls');
      }
    } catch (error) {
      console.error('Error loading today time logs:', error);
      console.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        status: (error as any)?.status,
        statusText: (error as any)?.statusText,
        url: (error as any)?.url
      });
    }
  }

  private async loadMonthlyAttendance() {
    if (!this.currentEmployeeId || this.isDataLoading) return;

    console.log('Loading monthly attendance for employee:', this.currentEmployeeId);
    console.log('Month:', this.currentMonth + 1, 'Year:', this.currentYear);
    
    try {
      this.isLoading = true;
      this.isDataLoading = true;
      console.log('Calling getEmployeeMonthlyAttendance with month:', this.currentMonth + 1, 'year:', this.currentYear);
      const summary = await this.attendanceService
        .getEmployeeMonthlyAttendance(
          this.currentMonth + 1, 
          this.currentYear
        )
        .toPromise();

      console.log('Monthly attendance summary received:', summary);
      
      if (summary?.records) {
        console.log('Processing', summary.records.length, 'attendance records');
        console.log('Raw records:', summary.records);
        this.monthlyAttendance = this.processDTRRecords(summary.records);
        console.log('Processed DTR records:', this.monthlyAttendance);
      } else {
        console.log('No records found in summary:', summary);
        console.log('Summary structure:', JSON.stringify(summary, null, 2));
        this.monthlyAttendance = [];
      }
    } catch (error) {
      console.error('Error loading monthly attendance:', error);
      // Show user-friendly error message
      alert(`Failed to load monthly attendance: ${error instanceof Error ? error.message : 'Unknown error'}`);
      this.monthlyAttendance = [];
    } finally {
      this.isLoading = false;
      this.isDataLoading = false;
    }
  }

  // ==================== DTR PROCESSING ====================

  private processDTRRecords(records: AttendanceRecord[]): DTRRecord[] {
    return records.map(record => {
      const dtrRecord: DTRRecord = {
        date: new Date(record.date),
        totalHours: record.calculatedHours || 0,
        totalMinutes: Math.round((record.calculatedHours || 0) * 60),
        status: record.status || 'absent'
      };

      // Process time logs for AM/PM breakdown
      if (record.timeIn && record.timeOut) {
        const timeIn = new Date(record.timeIn);
        const timeOut = new Date(record.timeOut);
        const noon = new Date(timeIn);
        noon.setHours(12, 0, 0, 0);

        if (timeIn < noon) {
          dtrRecord.amArrival = timeIn;
        } else {
          dtrRecord.pmArrival = timeIn;
        }

        if (timeOut < noon) {
          dtrRecord.amDeparture = timeOut;
        } else {
          dtrRecord.pmDeparture = timeOut;
        }

        // Handle cases where employee works both AM and PM
        if (timeIn < noon && timeOut > noon) {
          dtrRecord.amArrival = timeIn;
          dtrRecord.amDeparture = noon;
          dtrRecord.pmArrival = noon;
          dtrRecord.pmDeparture = timeOut;
        }
      }

      return dtrRecord;
    });
  }

  // ==================== UTILITY METHODS ====================

  getCurrentStatus(): string {
    console.log('getCurrentStatus called, todayTimeLogs:', this.todayTimeLogs);
    if (!this.todayTimeLogs.length) return 'Not Started';
    
    const lastLog = this.todayTimeLogs[this.todayTimeLogs.length - 1];
    console.log('Last log:', lastLog);
    switch (lastLog.type) {
      case 'timeIn': return 'Working';
      case 'timeOut': return 'Completed';
      case 'breakStart': return 'On Break';
      case 'breakEnd': return 'Working';
      default: return 'Unknown';
    }
  }

  canClockIn(): boolean {
    const canClockIn = !this.todayTimeLogs.some(log => log.type === 'timeIn');
    console.log('canClockIn called, todayTimeLogs:', this.todayTimeLogs, 'result:', canClockIn);
    return canClockIn;
  }

  canClockOut(): boolean {
    const hasTimeIn = this.todayTimeLogs.some(log => log.type === 'timeIn');
    const hasTimeOut = this.todayTimeLogs.some(log => log.type === 'timeOut');
    const canClockOut = hasTimeIn && !hasTimeOut;
    console.log('canClockOut called:', { hasTimeIn, hasTimeOut, canClockOut, todayTimeLogs: this.todayTimeLogs });
    return canClockOut;
  }

  canStartBreak(): boolean {
    return this.todayTimeLogs.some(log => log.type === 'timeIn') && 
           !this.todayTimeLogs.some(log => log.type === 'timeOut') &&
           !this.todayTimeLogs.some(log => log.type === 'breakStart');
  }

  canEndBreak(): boolean {
    return this.todayTimeLogs.some(log => log.type === 'breakStart') && 
           !this.todayTimeLogs.some(log => log.type === 'breakEnd');
  }

  formatTime(date: Date | undefined): string {
    if (!date) return '-';
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  }

  formatDate(date: Date): string {
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'present': return 'bg-green-100 text-green-800';
      case 'late': return 'bg-yellow-100 text-yellow-800';
      case 'absent': return 'bg-red-100 text-red-800';
      case 'halfDay': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  // ==================== MONTH NAVIGATION ====================

  previousMonth() {
    if (this.currentMonth === 0) {
      this.currentMonth = 11;
      this.currentYear--;
    } else {
      this.currentMonth--;
    }
    
    console.log('Previous month clicked - Month:', this.currentMonth + 1, 'Year:', this.currentYear);
    
    // Add delay to prevent rapid API calls
    setTimeout(() => {
      this.loadMonthlyAttendance();
    }, 500);
  }

  nextMonth() {
    if (this.currentMonth === 11) {
      this.currentMonth = 0;
      this.currentYear++;
    } else {
      this.currentMonth++;
    }
    
    console.log('Next month clicked - Month:', this.currentMonth + 1, 'Year:', this.currentYear);
    
    // Add delay to prevent rapid API calls
    setTimeout(() => {
      this.loadMonthlyAttendance();
    }, 500);
  }

  getMonthName(): string {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months[this.currentMonth];
  }

  // ==================== PDF EXPORT ====================

  exportToPDF() {
    // TODO: Implement PDF export for Civil Service Form 48 DTR
    console.log('Exporting to PDF...');
    alert('PDF export functionality will be implemented here for Civil Service Form 48 DTR');
  }
}
