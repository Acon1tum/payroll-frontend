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
  breakStart?: Date;
  breakEnd?: Date;
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
    console.log('shouldShowTodayRow on init:', this.shouldShowTodayRow());
    
    if (this.currentUser?.employee?.id) {
      this.currentEmployeeId = this.currentUser.employee.id;
      console.log('Employee ID set to:', this.currentEmployeeId);
      this.isInitialized = true;
      this.loadCurrentDayAttendance();
      this.loadMonthlyAttendance();
    } else {
      console.error('No employee ID found in user object:', this.currentUser);
      // Try to get user from auth service observable if not already loaded
      this.authService.currentUser$.pipe(
        takeUntil(this.destroy$)
      ).subscribe(
        (user: any) => {
          this.currentUser = user;
          if (user?.employee?.id) {
            this.currentEmployeeId = user.employee.id;
            console.log('Employee ID set from auth service observable:', this.currentEmployeeId);
            this.isInitialized = true;
            this.loadCurrentDayAttendance();
            this.loadMonthlyAttendance();
          } else {
            console.error('Still no employee ID found after auth service observable call');
          }
        }
      );
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
      alert(`Failed to clock out: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
      alert(`Failed to start break: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
      alert(`Failed to end break: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
        
        // Sort time logs by timestamp
        const sortedTimeLogs = [...this.todayTimeLogs].sort((a, b) => 
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );

        let timeIn: Date | undefined;
        let timeOut: Date | undefined;
        let breakStart: Date | undefined;
        let breakEnd: Date | undefined;
        let calculatedHours = 0;

        // Extract times from time logs
        sortedTimeLogs.forEach(log => {
          const timestamp = new Date(log.timestamp);
          switch (log.type) {
            case 'timeIn':
              timeIn = timestamp;
              break;
            case 'timeOut':
              timeOut = timestamp;
              break;
            case 'breakStart':
              breakStart = timestamp;
              break;
            case 'breakEnd':
              breakEnd = timestamp;
              break;
          }
        });

        // Calculate working hours
        if (timeIn && timeOut) {
          let totalWorkTime = timeOut.getTime() - timeIn.getTime();
          
          // Subtract break time if break was taken
          if (breakStart && breakEnd) {
            const breakTime = breakEnd.getTime() - breakStart.getTime();
            totalWorkTime -= breakTime;
          }
          
          // Convert to hours
          calculatedHours = totalWorkTime / (1000 * 60 * 60);
        }

        // Get status from the latest time log (backend calculates this)
        let status: 'present' | 'absent' | 'late' | 'halfDay' | 'holiday' | 'leave' | 'undertime' = 'present';
        
        // Find the latest time log with a status
        const latestTimeLog = this.todayTimeLogs
          .filter(log => log.status)
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];
        
        if (latestTimeLog && latestTimeLog.status) {
          status = latestTimeLog.status;
        } else {
          // Fallback calculation if no status in time log
          if (timeIn && timeOut) {
            if (calculatedHours >= 8) {
              status = 'present';
            } else if (calculatedHours >= 4) {
              status = 'halfDay';
            } else {
              status = 'undertime';
            }
          } else if (timeIn) {
            status = 'present';
          } else {
            status = 'absent';
          }
        }

        // Calculate AM/PM times using helper method
        let amArrival: Date | undefined;
        let amDeparture: Date | undefined;
        let pmArrival: Date | undefined;
        let pmDeparture: Date | undefined;

        if (timeIn && timeOut) {
          const ampmTimes = this.calculateAMPMTimes(timeIn, timeOut);
          amArrival = ampmTimes.amArrival;
          amDeparture = ampmTimes.amDeparture;
          pmArrival = ampmTimes.pmArrival;
          pmDeparture = ampmTimes.pmDeparture;
        } else if (timeIn) {
          // Only time in, no time out yet
          const noon = new Date(timeIn);
          noon.setHours(12, 0, 0, 0);
          
          if (timeIn < noon) {
            amArrival = timeIn;
          } else {
            pmArrival = timeIn;
          }
        }

        this.currentDayAttendance = {
          id: `generated-${today}`,
          employeeId: this.currentEmployeeId,
          date: new Date(today + 'T00:00:00.000Z'),
          timeIn,
          timeOut,
          breakStart,
          breakEnd,
          status,
          calculatedHours: Math.round(calculatedHours * 100) / 100,
          overtimeHours: 0,
          lateMinutes: 0,
          underTimeMinutes: 0,
          isHoliday: false,
          holidayType: undefined,
          timeLogs: this.todayTimeLogs,
          // Add AM/PM times for proper display
          amArrival,
          amDeparture,
          pmArrival,
          pmDeparture
        };
        
        console.log('Current day attendance generated:', {
          date: today,
          hasTimeIn: !!timeIn,
          hasTimeOut: !!timeOut,
          hasBreakStart: !!breakStart,
          hasBreakEnd: !!breakEnd,
          calculatedHours,
          status,
          timeLogsCount: this.todayTimeLogs.length
        });
      } else {
        this.currentDayAttendance = null;
        console.log('No time logs for today, current day attendance set to null');
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
        console.log('Final monthly attendance count:', this.monthlyAttendance.length);
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
    const today = new Date().toISOString().split('T')[0];
    
    console.log('Processing DTR records, today is:', today);
    console.log('Total records to process:', records.length);
    
    const filteredRecords = records.filter(record => {
      // Exclude current day (it's displayed separately)
      const recordDate = new Date(record.date).toISOString().split('T')[0];
      if (recordDate === today) {
        console.log('Filtering out current day record:', recordDate);
        return false;
      }
      
      // Only include records with actual time logs
      if (!record.timeLogs || record.timeLogs.length === 0) {
        console.log('Filtering out record without time logs:', recordDate);
        return false;
      }
      
      console.log('Including record with time logs:', recordDate, 'count:', record.timeLogs.length);
      return true;
    });
    
    console.log('Records after filtering:', filteredRecords.length);
    
    return filteredRecords.map(record => {
      const dtrRecord: DTRRecord = {
        date: new Date(record.date),
        totalHours: 0,
        totalMinutes: 0,
        status: record.status || 'absent'
      };

      // Process time logs for AM/PM breakdown and calculate working hours
      if (record.timeLogs && record.timeLogs.length > 0) {
        const timeLogs = record.timeLogs.sort((a, b) => 
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );

        let timeIn: Date | undefined;
        let timeOut: Date | undefined;
        let breakStart: Date | undefined;
        let breakEnd: Date | undefined;

        // Extract times from time logs
        timeLogs.forEach(log => {
          const timestamp = new Date(log.timestamp);
          switch (log.type) {
            case 'timeIn':
              timeIn = timestamp;
              break;
            case 'timeOut':
              timeOut = timestamp;
              break;
            case 'breakStart':
              breakStart = timestamp;
              break;
            case 'breakEnd':
              breakEnd = timestamp;
              break;
          }
        });

        // Calculate working hours
        if (timeIn && timeOut) {
          let totalWorkTime = timeOut.getTime() - timeIn.getTime();
          
          // Subtract break time if break was taken
          if (breakStart && breakEnd) {
            const breakTime = breakEnd.getTime() - breakStart.getTime();
            totalWorkTime -= breakTime;
          }
          
          // Convert to hours
          const totalHours = totalWorkTime / (1000 * 60 * 60);
          dtrRecord.totalHours = Math.round(totalHours * 100) / 100; // Round to 2 decimal places
          dtrRecord.totalMinutes = Math.round(totalHours * 60);
        }

        // Set break times
        dtrRecord.breakStart = breakStart;
        dtrRecord.breakEnd = breakEnd;

        // Set AM/PM breakdown based on actual working hours
        if (timeIn && timeOut) {
          const noon = new Date(timeIn);
          noon.setHours(12, 0, 0, 0);

          // If employee works before noon, set AM times
          if (timeIn < noon) {
            dtrRecord.amArrival = timeIn;
            // If they leave before noon, set AM departure
            if (timeOut <= noon) {
              dtrRecord.amDeparture = timeOut;
            } else {
              // If they work past noon, set AM departure to noon and PM arrival to noon
              dtrRecord.amDeparture = noon;
              dtrRecord.pmArrival = noon;
              dtrRecord.pmDeparture = timeOut;
            }
          } else {
            // If employee starts after noon, set PM times only
            dtrRecord.pmArrival = timeIn;
            dtrRecord.pmDeparture = timeOut;
          }
        } else if (timeIn) {
          // Only time in, no time out yet
          const noon = new Date(timeIn);
          noon.setHours(12, 0, 0, 0);
          
          if (timeIn < noon) {
            dtrRecord.amArrival = timeIn;
          } else {
            dtrRecord.pmArrival = timeIn;
          }
        }

        // Get status from the latest time log (backend calculates this)
        const latestTimeLog = timeLogs
          .filter(log => log.status)
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];
        
        if (latestTimeLog && latestTimeLog.status) {
          dtrRecord.status = latestTimeLog.status;
        } else {
          // Fallback calculation if no status in time log
          if (timeIn && timeOut) {
            if (dtrRecord.totalHours >= 8) {
              dtrRecord.status = 'present';
            } else if (dtrRecord.totalHours >= 4) {
              dtrRecord.status = 'halfDay';
            } else {
              dtrRecord.status = 'undertime';
            }
          } else if (timeIn) {
            dtrRecord.status = 'present';
          } else {
            dtrRecord.status = 'absent';
          }
        }
      }

      return dtrRecord;
    });
  }

  // Helper method to calculate AM/PM times for current day
  private calculateAMPMTimes(timeIn: Date, timeOut: Date): { amArrival?: Date, amDeparture?: Date, pmArrival?: Date, pmDeparture?: Date } {
    const noon = new Date(timeIn);
    noon.setHours(12, 0, 0, 0);

    const result: { amArrival?: Date, amDeparture?: Date, pmArrival?: Date, pmDeparture?: Date } = {};

    // If employee works before noon, set AM times
    if (timeIn < noon) {
      result.amArrival = timeIn;
      // If they leave before noon, set AM departure
      if (timeOut <= noon) {
        result.amDeparture = timeOut;
      } else {
        // If they work past noon, set AM departure to noon and PM arrival to noon
        result.amDeparture = noon;
        result.pmArrival = noon;
        result.pmDeparture = timeOut;
      }
    } else {
      // If employee starts after noon, set PM times only
      result.pmArrival = timeIn;
      result.pmDeparture = timeOut;
    }

    return result;
  }

  // ==================== UTILITY METHODS ====================

  // Check if today's row should be displayed (only when viewing current month)
  shouldShowTodayRow(): boolean {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    const shouldShow = this.currentMonth === currentMonth && this.currentYear === currentYear;
    
    console.log('shouldShowTodayRow check:', {
      now: now.toISOString(),
      currentMonth: currentMonth + 1,
      currentYear: currentYear,
      componentMonth: this.currentMonth + 1,
      componentYear: this.currentYear,
      shouldShow
    });
    
    return shouldShow;
  }

  // Whether today's row has content to display
  hasTodayRow(): boolean {
    if (!this.shouldShowTodayRow()) return false;
    const c = this.currentDayAttendance;
    const hasAnyTime = !!(c && (c.timeIn || c.timeOut || c.breakStart || c.breakEnd));
    return !!(hasAnyTime && this.todayTimeLogs.length > 0);
  }

  // Whether to show the empty-state message for the current month view
  shouldShowNoRecords(): boolean {
    const hasMonthly = Array.isArray(this.monthlyAttendance) && this.monthlyAttendance.length > 0;
    const hasToday = this.hasTodayRow();
    return !this.isLoading && !hasMonthly && !hasToday;
  }

  getCurrentStatus(): string {
    console.log('getCurrentStatus called, todayTimeLogs:', this.todayTimeLogs);
    if (!this.todayTimeLogs.length) return 'Not Started';
    
    const lastLog = this.todayTimeLogs[this.todayTimeLogs.length - 1];
    console.log('Last log:', lastLog);
    
    // If the last log has a status, use it
    if (lastLog.status) {
      return this.getStatusLabel(lastLog.status);
    }
    
    // Otherwise, determine status based on log type
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
      case 'undertime': return 'bg-orange-100 text-orange-800';
      case 'holiday': return 'bg-purple-100 text-purple-800';
      case 'leave': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'present': return 'Present';
      case 'late': return 'Late';
      case 'absent': return 'Absent';
      case 'halfDay': return 'Half Day';
      case 'undertime': return 'Undertime';
      case 'holiday': return 'Holiday';
      case 'leave': return 'On Leave';
      default: return 'Unknown';
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
    console.log('shouldShowTodayRow():', this.shouldShowTodayRow());
    
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
    console.log('shouldShowTodayRow():', this.shouldShowTodayRow());
    
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
