import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SidebarComponent } from "../../../shared/sidebar/sidebar.component";
import { HeaderComponent } from "../../../shared/header/header.component";
import { AttendanceService, AttendanceRecord, TimeLog, Employee } from '../../../services/attendance.service';
import { AuthService } from '../../../services/auth.service';
import { TimezoneService } from '../../../services/timezone.service';
import { DtrPdfService } from '../../../services/dtr-pdf.service';
import { Subject, takeUntil, Subscription } from 'rxjs';

interface Breadcrumb {
  label: string;
  path?: string;
  active?: boolean;
}

interface DTRRecord {
  date: Date;
  amArrival?: Date | string;
  amDeparture?: Date | string;
  breakStart?: Date | string;
  breakEnd?: Date | string;
  pmArrival?: Date | string;
  pmDeparture?: Date | string;
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
  private timezoneSubscription: Subscription = new Subscription();

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

  // Session status tracking
  sessionStatus: {
    amSessionCompleted: boolean;
    pmSessionCompleted: boolean;
    allSessionsCompleted: boolean;
    canClockInAM: boolean;
    canClockOutAM: boolean;
    canClockInPM: boolean;
    canClockOutPM: boolean;
  } = {
    amSessionCompleted: false,
    pmSessionCompleted: false,
    allSessionsCompleted: false,
    canClockInAM: false,
    canClockOutAM: false,
    canClockInPM: false,
    canClockOutPM: false
  };

  constructor(
    private attendanceService: AttendanceService,
    private authService: AuthService,
    private timezoneService: TimezoneService,
    private dtrPdfService: DtrPdfService
  ) {}

  ngOnInit() {
    this.initializeComponent();
    this.startTimeUpdate();
    
    // ✅ Subscribe to timezone changes with better error handling
    this.timezoneSubscription.add(
      this.timezoneService.getSystemTimezone().subscribe({
        next: (newTimezone: string) => {
          console.log('Attendance: Timezone changed to:', newTimezone);
          this.refreshTimezone();
          this.updateDisplayedTime();
        },
        error: (error) => {
          console.error('Attendance: Error receiving timezone update:', error);
        }
      })
    );
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    this.timezoneSubscription.unsubscribe();
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
      
      // Load session status
      await this.loadSessionStatus();
      
      // Generate current day attendance record from time logs for display
      if (this.todayTimeLogs.length > 0) {
        const today = this.timezoneService.getDateStringInSystemTimezone();
        
        // Sort time logs by timestamp
        const sortedTimeLogs = [...this.todayTimeLogs].sort((a, b) => 
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );

        let timeIn: Date | undefined;
        let timeOut: Date | undefined;
        let breakStart: Date | undefined;
        let breakEnd: Date | undefined;
        let calculatedHours = 0;

        // Extract times from time logs - set to most recent occurrence
        sortedTimeLogs.forEach(log => {
          const timestamp = new Date(log.timestamp);
          switch (log.type) {
            case 'timeIn':
              timeIn = timestamp; // Keep the most recent timeIn
              break;
            case 'timeOut':
              timeOut = timestamp; // Keep the most recent timeOut
              break;
            case 'breakStart':
              breakStart = timestamp; // Keep the most recent breakStart
              break;
            case 'breakEnd':
              breakEnd = timestamp; // Keep the most recent breakEnd
              break;
          }
        });

        // Calculate working hours across multiple sessions
        calculatedHours = this.calculateTotalHoursFromSessions(sortedTimeLogs);

        // Derive status strictly from total hours (should match backend logic)
        // Updated business rules: 8+ hours = Present, below 8 hours = Undertime
        let status: 'present' | 'absent' | 'late' | 'halfDay' | 'holiday' | 'leave' | 'undertime' = 'absent';
        if (calculatedHours >= 8) status = 'present';
        else if (calculatedHours > 0) status = 'undertime';
        
        // Debug: Log the status calculation for current day
        console.log('Current day status calculation:', {
          calculatedHours,
          status,
          threshold: '8 hours for present, below 8 hours = undertime'
        });

        // Calculate AM/PM times based on session field from time logs
        let amArrival: Date | undefined;
        let amDeparture: Date | undefined;
        let pmArrival: Date | undefined;
        let pmDeparture: Date | undefined;
        
        // First try to use session field if available
        const amTimeIn = sortedTimeLogs.find(log => log.type === 'timeIn' && log.session === 'AM');
        const amTimeOut = sortedTimeLogs.find(log => log.type === 'timeOut' && log.session === 'AM');
        const pmTimeIn = sortedTimeLogs.find(log => log.type === 'timeIn' && log.session === 'PM');
        const pmTimeOut = sortedTimeLogs.find(log => log.type === 'timeOut' && log.session === 'PM');
        
        console.log('Session-based time log search:', {
          amTimeIn: amTimeIn ? { id: amTimeIn.id, timestamp: amTimeIn.timestamp, session: amTimeIn.session } : null,
          amTimeOut: amTimeOut ? { id: amTimeOut.id, timestamp: amTimeOut.timestamp, session: amTimeOut.session } : null,
          pmTimeIn: pmTimeIn ? { id: pmTimeIn.id, timestamp: pmTimeIn.timestamp, session: pmTimeIn.session } : null,
          pmTimeOut: pmTimeOut ? { id: pmTimeOut.id, timestamp: pmTimeOut.timestamp, session: pmTimeOut.session } : null
        });
        
        if (amTimeIn) {
          amArrival = new Date(amTimeIn.timestamp);
          if (amTimeOut) {
            amDeparture = new Date(amTimeOut.timestamp);
          }
        }
        
        if (pmTimeIn) {
          pmArrival = new Date(pmTimeIn.timestamp);
          if (pmTimeOut) {
            pmDeparture = new Date(pmTimeOut.timestamp);
          }
        }
        
        // Fallback to time-based logic if session field is not available or no session-based times found
        if (!amArrival && !pmArrival) {
          console.log('Using fallback time-based logic for AM/PM times');
          const sessions = this.pairSessions(sortedTimeLogs);
          for (const s of sessions) {
            if (!s.in) continue;
            const isAM = this.getHourInSystemTimezone(s.in) < 12;
            if (isAM && !amArrival) { 
              amArrival = s.in; 
              amDeparture = s.out; 
              console.log('Set AM times via fallback:', { amArrival, amDeparture });
            }
            if (!isAM && !pmArrival) { 
              pmArrival = s.in; 
              pmDeparture = s.out; 
              console.log('Set PM times via fallback:', { pmArrival, pmDeparture });
            }
          }
        }
        
        // Additional fallback: if we still don't have AM/PM times but have generic timeIn/timeOut, use them
        if (!amArrival && !pmArrival && timeIn) {
          const isAM = this.getHourInSystemTimezone(timeIn) < 12;
          if (isAM) {
            amArrival = timeIn;
            amDeparture = timeOut;
            console.log('Set AM times from generic timeIn/timeOut:', { amArrival, amDeparture });
          } else {
            pmArrival = timeIn;
            pmDeparture = timeOut;
            console.log('Set PM times from generic timeIn/timeOut:', { pmArrival, pmDeparture });
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
          pmDeparture,
          // Add session completion tracking
          amSessionCompleted: this.sessionStatus.amSessionCompleted,
          pmSessionCompleted: this.sessionStatus.pmSessionCompleted,
          allSessionsCompleted: this.sessionStatus.allSessionsCompleted
        };
        
        console.log('Current day attendance generated:', {
          date: today,
          hasTimeIn: !!timeIn,
          hasTimeOut: !!timeOut,
          hasBreakStart: !!breakStart,
          hasBreakEnd: !!breakEnd,
          amArrival: !!amArrival,
          amDeparture: !!amDeparture,
          pmArrival: !!pmArrival,
          pmDeparture: !!pmDeparture,
          calculatedHours,
          status,
          timeLogsCount: this.todayTimeLogs.length,
          amSessionCompleted: this.sessionStatus.amSessionCompleted,
          pmSessionCompleted: this.sessionStatus.pmSessionCompleted,
          allSessionsCompleted: this.sessionStatus.allSessionsCompleted,
          timeLogs: this.todayTimeLogs.map(log => ({
            id: log.id,
            type: log.type,
            session: log.session,
            timestamp: log.timestamp
          }))
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
      const today = this.timezoneService.getDateStringInSystemTimezone();
      console.log('Loading time logs for today (system TZ):', today);
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
      
      // Debug: Check if time logs have session information
      if (this.todayTimeLogs.length > 0) {
        console.log('Time logs with session info:', this.todayTimeLogs.map(log => ({
          id: log.id,
          type: log.type,
          session: log.session,
          timestamp: log.timestamp,
          date: log.date
        })));
      }
      
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
      console.log('Summary type:', typeof summary);
      if (summary?.records) {
        console.log('Records type:', typeof summary.records);
        console.log('Records length:', summary.records.length);
        if (Array.isArray(summary.records) && summary.records.length > 0) {
          console.log('First record sample:', summary.records[0]);
          console.log('First record date type:', typeof summary.records[0].date, 'value:', summary.records[0].date);
        }
      }
      
      if (summary?.records) {
        console.log('Processing', summary.records.length, 'attendance records');
        console.log('Raw records dates:', summary.records.map(r => new Date(r.date).toISOString().split('T')[0]));
        console.log('Raw records:', summary.records);
        
        // Debug: Check session information in time logs and validate date types
        summary.records.forEach((record, index) => {
          console.log(`Record ${index} date type:`, typeof record.date, 'value:', record.date);
          console.log(`Record ${index} date constructor:`, record.date?.constructor?.name);
          console.log(`Record ${index} date instanceof Date:`, record.date instanceof Date);
          
          if (record.timeLogs && record.timeLogs.length > 0) {
            try {
              // Ensure date is a Date object before calling toISOString
              const recordDate = new Date(record.date);
              console.log(`Record ${recordDate.toISOString().split('T')[0]} time logs:`, 
                record.timeLogs.map(log => ({
                  id: log.id,
                  type: log.type,
                  session: log.session,
                  timestamp: log.timestamp
                }))
              );
            } catch (error) {
              console.error(`Error processing record ${index} date:`, error);
            }
          }
        });
        
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

  private async loadSessionStatus() {
    if (!this.currentEmployeeId) return;

    try {
      const today = this.timezoneService.getDateStringInSystemTimezone();
      const status = await this.attendanceService.getSessionStatus(this.currentEmployeeId, today).toPromise();
      
      if (status) {
        this.sessionStatus = status;
        console.log('Session status loaded:', this.sessionStatus);
      }
    } catch (error) {
      console.error('Error loading session status:', error);
    }
  }

  // ==================== DTR PROCESSING ====================
  // Business Rules for Attendance Status:
  // - 8+ hours = Present (Full day)
  // - Below 8 hours but > 0 = Undertime
  // - 0 hours = Absent

  private processDTRRecords(records: AttendanceRecord[]): DTRRecord[] {
    const today = new Date().toISOString().split('T')[0];
    
    console.log('Processing DTR records, today is:', today);
    console.log('Current month:', this.currentMonth + 1, 'Current year:', this.currentYear);
    console.log('Total records to process:', records.length);
    
    const filteredRecords = records.filter(record => {
      try {
        // Ensure date is a Date object before calling toISOString
        const recordDate = new Date(record.date);
        const recordDateString = recordDate.toISOString().split('T')[0];
        
        // Filter by selected month and year
        // This ensures that only records from the selected month are displayed
        // Fixes the issue where August 31, 2025 was showing in September 2025 view
        const recordMonth = recordDate.getMonth(); // 0-11
        const recordYear = recordDate.getFullYear();
        
        if (recordMonth !== this.currentMonth || recordYear !== this.currentYear) {
          console.log('Filtering out record not in selected month:', recordDateString, 
            `(record: ${recordMonth + 1}/${recordYear}, selected: ${this.currentMonth + 1}/${this.currentYear})`);
          return false;
        }
        
        // Exclude current day (it's displayed separately) only if viewing current month
        if (recordDateString === today && this.currentMonth === new Date().getMonth() && this.currentYear === new Date().getFullYear()) {
          console.log('Filtering out current day record:', recordDateString);
          return false;
        }
        
        // Only include records with actual time logs
        if (!record.timeLogs || record.timeLogs.length === 0) {
          console.log('Filtering out record without time logs:', recordDateString);
          return false;
        }
        
        console.log('Including record with time logs:', recordDateString, 'count:', record.timeLogs.length);
        return true;
      } catch (error) {
        console.error('Error processing record date:', error, 'record:', record);
        return false; // Skip records with invalid dates
      }
    });
    
    console.log('Records after filtering:', filteredRecords.length);
    console.log('Filtered records dates:', filteredRecords.map(r => new Date(r.date).toISOString().split('T')[0]));
    
    return filteredRecords.map(record => {
      try {
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

        // Set AM/PM breakdown based on session information from time logs
        // First try to use session field if available
        const amTimeIn = timeLogs.find(log => log.type === 'timeIn' && log.session === 'AM')?.timestamp;
        const amTimeOut = timeLogs.find(log => log.type === 'timeOut' && log.session === 'AM')?.timestamp;
        const pmTimeIn = timeLogs.find(log => log.type === 'timeIn' && log.session === 'PM')?.timestamp;
        const pmTimeOut = timeLogs.find(log => log.type === 'timeOut' && log.session === 'PM')?.timestamp;

        console.log(`Processing DTR record for ${new Date(record.date).toISOString().split('T')[0]}:`, {
          totalTimeLogs: timeLogs.length,
          timeLogsWithSession: timeLogs.filter(log => log.session).map(log => ({
            id: log.id,
            type: log.type,
            session: log.session,
            timestamp: log.timestamp
          })),
          amTimeIn,
          amTimeOut,
          pmTimeIn,
          pmTimeOut
        });

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

        // Calculate working hours from all timeIn/timeOut pairs (should match backend logic)
        let totalWorkTime = 0;
        
        // Find all timeIn/timeOut pairs in chronological order
        const timeInOutPairs: { timeIn: Date; timeOut: Date }[] = [];
        let currentTimeIn: Date | undefined;
        
        for (const log of timeLogs) {
          if (log.type === 'timeIn') {
            currentTimeIn = new Date(log.timestamp);
          } else if (log.type === 'timeOut' && currentTimeIn) {
            timeInOutPairs.push({
              timeIn: currentTimeIn,
              timeOut: new Date(log.timestamp)
            });
            currentTimeIn = undefined;
          }
        }
        
        // Calculate total work time from all pairs
        for (const pair of timeInOutPairs) {
          totalWorkTime += pair.timeOut.getTime() - pair.timeIn.getTime();
        }
        
        // Subtract break time if break was taken
        if (record.breakStart && record.breakEnd) {
          const breakStartDate = new Date(record.breakStart);
          const breakEndDate = new Date(record.breakEnd);
          const breakTime = breakEndDate.getTime() - breakStartDate.getTime();
          totalWorkTime -= breakTime;
        }
        
        // Convert to hours
        if (totalWorkTime > 0) {
          const totalHours = totalWorkTime / (1000 * 60 * 60);
          dtrRecord.totalHours = Math.round(totalHours * 100) / 100; // Round to 2 decimal places
          dtrRecord.totalMinutes = Math.round(totalHours * 60);
        }
        
        // Debug: Log the hours calculation
        console.log(`Hours calculation for ${new Date(record.date).toISOString().split('T')[0]}:`, {
          timeInOutPairs: timeInOutPairs.length,
          totalWorkTimeMs: totalWorkTime,
          totalHours: dtrRecord.totalHours,
          breakTime: record.breakStart && record.breakEnd ? 
            (new Date(record.breakEnd).getTime() - new Date(record.breakStart).getTime()) / (1000 * 60 * 60) : 0
        });

        // Set break times
        dtrRecord.breakStart = breakStart;
        dtrRecord.breakEnd = breakEnd;

        // Set AM/PM breakdown based on session information from time logs
        if (amTimeIn) {
          dtrRecord.amArrival = new Date(amTimeIn);
          if (amTimeOut) {
            dtrRecord.amDeparture = new Date(amTimeOut);
          }
        }

        if (pmTimeIn) {
          dtrRecord.pmArrival = new Date(pmTimeIn);
          if (pmTimeOut) {
            dtrRecord.pmDeparture = new Date(pmTimeOut);
          }
        }

        // Fallback to time-based logic if session field is not available
        if (!amTimeIn && !pmTimeIn) {
          if (timeIn && timeOut) {
            const inHour = this.getHourInSystemTimezone(timeIn);
            const outHour = this.getHourInSystemTimezone(timeOut);
            // If employee works before noon, set AM times
            if (inHour < 12) {
              dtrRecord.amArrival = timeIn;
              if (outHour <= 12) {
                dtrRecord.amDeparture = timeOut;
              } else {
                // If they work past noon, set AM departure to system noon and PM arrival to system noon
                const tz = this.timezoneService.getCurrentTimezone();
                const parts = new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(timeIn)
                  .reduce((acc: any, p) => { if (p.type !== 'literal') acc[p.type] = p.value; return acc; }, {});
                const noon = new Date(Number(parts.year), Number(parts.month) - 1, Number(parts.day), 12, 0, 0, 0);
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
            const inHour = this.getHourInSystemTimezone(timeIn);
            if (inHour < 12) {
              dtrRecord.amArrival = timeIn;
            } else {
              dtrRecord.pmArrival = timeIn;
            }
          }
        }

        // Calculate status based on total hours (this should match backend logic)
        // Updated business rules: 8+ hours = Present, below 8 hours = Undertime
        if (dtrRecord.totalHours >= 8) {
          dtrRecord.status = 'present';
        } else if (dtrRecord.totalHours > 0) {
          dtrRecord.status = 'undertime';
        } else {
          dtrRecord.status = 'absent';
        }
        
        // Debug: Log the status calculation
        console.log(`Status calculation for ${new Date(record.date).toISOString().split('T')[0]}:`, {
          totalHours: dtrRecord.totalHours,
          calculatedStatus: dtrRecord.status,
          timeIn: !!timeIn,
          timeOut: !!timeOut,
          threshold: '8 hours for present, below 8 hours = undertime'
        });
              }

        return dtrRecord;
      } catch (error) {
        console.error('Error processing DTR record:', error, 'record:', record);
        // Return a default record to prevent the entire process from failing
        return {
          date: new Date(),
          totalHours: 0,
          totalMinutes: 0,
          status: 'absent'
        };
      }
    });
  }

  // Helper method to calculate AM/PM times for current day
  private calculateAMPMTimes(timeIn: Date, timeOut: Date): { amArrival?: Date, amDeparture?: Date, pmArrival?: Date, pmDeparture?: Date } {
    const tz = this.timezoneService.getCurrentTimezone();
    // Build a noon boundary in system timezone for timeIn's date
    const dateParts = new Intl.DateTimeFormat('en-CA', {
      timeZone: tz,
      year: 'numeric', month: '2-digit', day: '2-digit'
    }).formatToParts(timeIn).reduce((acc: any, p) => { if (p.type !== 'literal') acc[p.type] = p.value; return acc; }, {});
    const noonLocal = new Date(Number(dateParts.year), Number(dateParts.month) - 1, Number(dateParts.day), 12, 0, 0, 0);

    const result: { amArrival?: Date, amDeparture?: Date, pmArrival?: Date, pmDeparture?: Date } = {};

    const timeInHour = this.getHourInSystemTimezone(timeIn);
    const timeOutHour = this.getHourInSystemTimezone(timeOut);

    if (timeInHour < 12) {
      result.amArrival = timeIn;
      if (timeOutHour <= 12) {
        result.amDeparture = timeOut;
      } else {
        result.amDeparture = noonLocal;
        result.pmArrival = noonLocal;
        result.pmDeparture = timeOut;
      }
    } else {
      result.pmArrival = timeIn;
      result.pmDeparture = timeOut;
    }

    return result;
  }

  // ==================== UTILITY METHODS ====================

  // Compute total hours from multiple timeIn/timeOut sessions, subtracting breaks in each session
  private calculateTotalHoursFromSessions(timeLogs: TimeLog[]): number {
    const sessions = this.pairSessions(timeLogs);
    let totalMs = 0;
    for (const s of sessions) {
      if (!s.in) continue;
      const end = s.out || new Date();
      let span = end.getTime() - s.in.getTime();
      const breaks = this.collectBreaksWithin(timeLogs, s.in, end);
      for (const b of breaks) span -= b;
      if (span > 0) totalMs += span;
    }
    return totalMs / (1000 * 60 * 60);
  }

  private pairSessions(timeLogs: TimeLog[]): { in?: Date, out?: Date }[] {
    const logs = [...timeLogs].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    const sessions: { in?: Date, out?: Date }[] = [];
    let currentIn: Date | undefined;
    for (const log of logs) {
      const ts = new Date(log.timestamp);
      if (log.type === 'timeIn') {
        if (!currentIn) currentIn = ts;
      } else if (log.type === 'timeOut') {
        if (currentIn) {
          sessions.push({ in: currentIn, out: ts });
          currentIn = undefined;
        }
      }
    }
    if (currentIn) sessions.push({ in: currentIn, out: undefined });
    return sessions;
  }

  private collectBreaksWithin(timeLogs: TimeLog[], start: Date, end: Date): number[] {
    const logs = [...timeLogs].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    const durations: number[] = [];
    let open: Date | undefined;
    for (const log of logs) {
      const ts = new Date(log.timestamp);
      if (ts < start || ts > end) continue;
      if (log.type === 'breakStart' && !open) open = ts;
      if (log.type === 'breakEnd' && open) {
        durations.push(ts.getTime() - open.getTime());
        open = undefined;
      }
    }
    return durations;
  }

  // ==================== TEMPLATE HELPERS (TIME/SESSION INFO) ====================

  // ✅ Update method to use dynamic timezone with better error handling
  getCurrentManilaTimeFormatted(): string {
    try {
      return this.timezoneService.getFormattedCurrentTime('HH:mm:ss a');
    } catch (error) {
      console.warn('Attendance: Error formatting time, using local time:', error);
      return this.currentTime.toLocaleTimeString('en-US', { 
        hour12: true, 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit' 
      });
    }
  }

  // ✅ Update method to use dynamic timezone with better error handling
  getCurrentManilaDateFormatted(): string {
    try {
      const fmt = new Intl.DateTimeFormat('en-US', {
        timeZone: this.timezoneService.getCurrentTimezone(),
        year: 'numeric',
        month: 'short',
        day: '2-digit'
      });
      return fmt.format(new Date());
    } catch (error) {
      console.warn('Attendance: Error formatting date with timezone, using local date:', error);
      return this.currentTime.toLocaleDateString();
    }
  }

  getSessionInfo(): string {
    if (!this.todayTimeLogs || this.todayTimeLogs.length === 0) return '';
    const sessions = this.pairSessions(this.todayTimeLogs);
    const completed = sessions.filter(s => s.in && s.out).length;
    const open = sessions.some(s => s.in && !s.out);
    if (open) {
      const openSession = sessions.find(s => s.in && !s.out);
      const started = openSession?.in ? this.formatTime(openSession.in) : '';
      return `Active session started at ${started} • Completed: ${completed}/2`;
    }
    return `Completed sessions today: ${completed}/2`;
  }

  // ✅ Update method to use dynamic timezone with better display
  getTimezoneStatus(): string {
    try {
      const timezone = this.timezoneService.getCurrentTimezone();
      const offset = this.timezoneService.getFormattedTimezoneOffset();
      const displayName = this.timezoneService.getTimezoneDisplayName();
      return `Timezone: ${displayName} (${offset})`;
    } catch (error) {
      console.warn('Attendance: Error getting timezone status:', error);
      return 'Timezone: Unknown (UTC+00:00)';
    }
  }

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
    // Check for any AM/PM times or break times, or any time logs
    const hasAnyTime = !!(c && (c.amArrival || c.amDeparture || c.pmArrival || c.pmDeparture || c.breakStart || c.breakEnd));
    const hasTimeLogs = this.todayTimeLogs.length > 0;
    console.log('hasTodayRow check:', {
      shouldShow: this.shouldShowTodayRow(),
      hasAnyTime,
      hasTimeLogs,
      amArrival: !!c?.amArrival,
      amDeparture: !!c?.amDeparture,
      pmArrival: !!c?.pmArrival,
      pmDeparture: !!c?.pmDeparture,
      breakStart: !!c?.breakStart,
      breakEnd: !!c?.breakEnd,
      timeLogsCount: this.todayTimeLogs.length
    });
    return !!(hasAnyTime && hasTimeLogs);
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
    const canClockIn = this.sessionStatus.canClockInAM || this.sessionStatus.canClockInPM;
    console.log('canClockIn check:', {
      canClockInAM: this.sessionStatus.canClockInAM,
      canClockInPM: this.sessionStatus.canClockInPM,
      result: canClockIn
    });
    return canClockIn;
  }

  canClockOut(): boolean {
    const canClockOut = this.sessionStatus.canClockOutAM || this.sessionStatus.canClockOutPM;
    console.log('canClockOut check:', {
      canClockOutAM: this.sessionStatus.canClockOutAM,
      canClockOutPM: this.sessionStatus.canClockOutPM,
      result: canClockOut
    });
    return canClockOut;
  }

  canStartBreak(): boolean {
    return this.sessionStatus.canClockOutAM || this.sessionStatus.canClockOutPM;
  }

  canEndBreak(): boolean {
    return this.sessionStatus.canClockOutAM || this.sessionStatus.canClockOutPM;
  }

  formatTime(date: Date | string | undefined): string {
    if (!date) return '-';
    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      const tz = this.timezoneService.getCurrentTimezone();
      return new Intl.DateTimeFormat('en-US', {
        timeZone: tz,
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      }).format(dateObj);
    } catch {
      try {
        const dateObj = typeof date === 'string' ? new Date(date) : date;
        return dateObj.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        });
      } catch {
        return '-';
      }
    }
  }

  formatDate(date: Date | string): string {
    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      const tz = this.timezoneService.getCurrentTimezone();
      return new Intl.DateTimeFormat('en-US', {
        timeZone: tz,
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      }).format(dateObj);
    } catch {
      try {
        const dateObj = typeof date === 'string' ? new Date(date) : date;
        return dateObj.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        });
      } catch {
        return '-';
      }
    }
  }

  private getHourInSystemTimezone(date: Date | string): number {
    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      const tz = this.timezoneService.getCurrentTimezone();
      const hourStr = new Intl.DateTimeFormat('en-US', {
        timeZone: tz,
        hour: '2-digit',
        hour12: false
      }).format(dateObj);
      return Number(hourStr);
    } catch {
      try {
        const dateObj = typeof date === 'string' ? new Date(date) : date;
        return dateObj.getHours();
      } catch {
        return 0;
      }
    }
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

  // ==================== SESSION HELPERS ====================

  private getCompletedSessionsCount(): number {
    if (!this.todayTimeLogs || this.todayTimeLogs.length === 0) return 0;
    // Ensure chronological order for pairing logic
    const logs = [...this.todayTimeLogs].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    let open = false;
    let count = 0;
    for (const log of logs) {
      if (log.type === 'timeIn') {
        open = true;
      } else if (log.type === 'timeOut' && open) {
        count++;
        open = false;
      }
      // breakStart/breakEnd don't affect session open/close; they only pause work
    }
    return count;
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
    try {
      const name = `${this.currentUser?.employee?.firstName || ''} ${this.currentUser?.employee?.lastName || ''}`.trim();
      const position = this.currentUser?.employee?.position || '';
      const division = this.currentUser?.employee?.department?.name || '';
      const office = this.currentUser?.employee?.department?.name || '';

      const monthLabel = `${this.getMonthName()} ${this.currentYear}`;
      console.log('Exporting DTR for month:', monthLabel);
      console.log('Current month index:', this.currentMonth, 'Current year:', this.currentYear);
      console.log('Monthly attendance count:', this.monthlyAttendance.length);
      console.log('Current day attendance:', this.currentDayAttendance);

      // Build 1..31 rows using available monthlyAttendance AND current day data
      const byDay = new Map<number, any>();
      
      // Add monthly attendance records
      this.monthlyAttendance.forEach(r => {
        const d = new Date(r.date);
        const day = d.getDate();
        byDay.set(day, r);
      });

      // If viewing current month, also include current day data
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      
      if (this.currentMonth === currentMonth && this.currentYear === currentYear && this.currentDayAttendance) {
        const currentDay = now.getDate();
        const currentRecord = {
          date: now,
          amArrival: this.currentDayAttendance.amArrival,
          amDeparture: this.currentDayAttendance.amDeparture,
          pmArrival: this.currentDayAttendance.pmArrival,
          pmDeparture: this.currentDayAttendance.pmDeparture,
          totalHours: this.currentDayAttendance.calculatedHours || 0,
          status: this.currentDayAttendance.status
        };
        byDay.set(currentDay, currentRecord);
      }

      const records = Array.from({ length: 31 }, (_, i) => {
        const day = i + 1;
        const rec = byDay.get(day);

        const fmt = (v?: Date | string) => {
          if (!v) return '';
          try { return this.formatTime(v); } catch { return ''; }
        };

        // Compute undertime if status is undertime or hours < 8
        let underHours = '';
        let underMinutes = '';
        if (rec && (rec.status === 'undertime' || (rec.totalHours ?? 0) < 8)) {
          const worked = Number(rec.totalHours || 0);
          const remainingMinutes = Math.max(0, Math.round(8 * 60 - worked * 60));
          underHours = String(Math.floor(remainingMinutes / 60));
          underMinutes = String(remainingMinutes % 60).padStart(2, '0');
        }

        return {
          day,
          amArrival: fmt(rec?.amArrival),
          amDeparture: fmt(rec?.amDeparture),
          pmArrival: fmt(rec?.pmArrival),
          pmDeparture: fmt(rec?.pmDeparture),
          underHours,
          underMinutes
        };
      });

      this.dtrPdfService.generateDTR(
        { name, position, division, office },
        monthLabel,
        records
      );
    } catch (error) {
      console.error('Error exporting DTR PDF:', error);
      alert('Failed to export DTR PDF.');
    }
  }

  // ✅ Add method to update displayed time with better error handling
  private updateDisplayedTime(): void {
    try {
      console.log('Attendance: Updating displayed time...');
      // Force change detection for time display
      this.currentTime = new Date();
      // Update any other time-related displays
      this.updateClockDisplay();
    } catch (error) {
      console.error('Attendance: Error updating displayed time:', error);
    }
  }

  // ✅ Add method to update clock display with better error handling
  private updateClockDisplay(): void {
    try {
      // This will trigger the template to re-render with new timezone
      setTimeout(() => {
        this.currentTime = new Date();
        console.log('Attendance: Clock display updated');
      }, 100);
    } catch (error) {
      console.error('Attendance: Error updating clock display:', error);
    }
  }

  // ✅ Add method to test timezone functionality
  testTimezone(): void {
    try {
      console.log('=== TIMEZONE TEST ===');
      console.log('Current timezone service timezone:', this.timezoneService.getCurrentTimezone());
      console.log('Current timezone service offset:', this.timezoneService.getFormattedTimezoneOffset());
      console.log('Current timezone service display name:', this.timezoneService.getTimezoneDisplayName());
      console.log('Current formatted time:', this.timezoneService.getFormattedCurrentTime('HH:mm:ss a'));
      console.log('Current formatted date:', this.timezoneService.getFormattedCurrentDate());
      console.log('=== END TIMEZONE TEST ===');
    } catch (error) {
      console.error('Error testing timezone:', error);
    }
  }

  // ✅ Add method to manually refresh timezone
  private refreshTimezone(): void {
    try {
      console.log('Attendance: Refreshing timezone...');
      // Force a timezone refresh by updating the current time
      this.currentTime = new Date();
      // Trigger change detection
      this.updateDisplayedTime();
    } catch (error) {
      console.error('Attendance: Error refreshing timezone:', error);
    }
  }

  // ==================== SESSION MANAGEMENT METHODS ====================

  getCurrentSessionType(): string {
    const now = new Date();
    const hour = now.getHours();
    return hour < 12 ? 'AM' : 'PM';
  }

  getClockInButtonText(): string {
    const currentSession = this.getCurrentSessionType();
    
    // If PM session is active (user clocked in for PM), don't show AM clock in
    if (this.sessionStatus.canClockOutPM) {
      return 'Clock In'; // Button will be disabled anyway
    }
    
    // If AM session is active (user clocked in for AM), don't show PM clock in
    if (this.sessionStatus.canClockOutAM) {
      return 'Clock In'; // Button will be disabled anyway
    }
    
    // If AM session is completed, only show PM clock in if available
    if (this.sessionStatus.amSessionCompleted && this.sessionStatus.canClockInPM) {
      return `Clock In (PM)`;
    }
    
    // If user can clock in for current session, show current session
    if (currentSession === 'AM' && this.sessionStatus.canClockInAM) {
      return `Clock In (AM)`;
    } else if (currentSession === 'PM' && this.sessionStatus.canClockInPM) {
      return `Clock In (PM)`;
    } else if (this.sessionStatus.canClockInAM) {
      return `Clock In (AM)`;
    } else if (this.sessionStatus.canClockInPM) {
      return `Clock In (PM)`;
    } else if (this.canClockIn()) {
      return `Clock In (${currentSession})`;
    }
    return 'Clock In';
  }

  getClockOutButtonText(): string {
    const currentSession = this.getCurrentSessionType();
    
    // If user can clock out for current session, show current session
    if (currentSession === 'AM' && this.sessionStatus.canClockOutAM) {
      return `Clock Out (AM)`;
    } else if (currentSession === 'PM' && this.sessionStatus.canClockOutPM) {
      return `Clock Out (PM)`;
    } else if (this.sessionStatus.canClockOutAM) {
      return `Clock Out (AM)`;
    } else if (this.sessionStatus.canClockOutPM) {
      return `Clock Out (PM)`;
    } else if (this.canClockOut()) {
      return `Clock Out (${currentSession})`;
    }
    return 'Clock Out';
  }

  // Helper method to get current active session for better UX
  getCurrentActiveSession(): string {
    const currentSession = this.getCurrentSessionType();
    
    if (this.sessionStatus.canClockOutAM) {
      return 'AM Session Active';
    } else if (this.sessionStatus.canClockOutPM) {
      return 'PM Session Active';
    } else if (this.sessionStatus.allSessionsCompleted) {
      return 'All Sessions Completed';
    } else if (this.canClockIn()) {
      // Show current session type when user can clock in
      return `Ready for ${currentSession} Session`;
    }
    return 'Ready to Start Session';
  }

  // Helper method to get AM session status for styling
  getAMSessionStatus(): string {
    if (this.sessionStatus.amSessionCompleted) {
      return 'completed';
    } else if (this.sessionStatus.canClockOutAM) {
      return 'active';
    } else if (this.sessionStatus.canClockInAM) {
      return 'ready';
    }
    return 'waiting';
  }

  // Helper method to get PM session status for styling
  getPMSessionStatus(): string {
    if (this.sessionStatus.pmSessionCompleted) {
      return 'completed';
    } else if (this.sessionStatus.canClockOutPM) {
      return 'active';
    } else if (this.sessionStatus.canClockInPM) {
      return 'ready';
    }
    return 'waiting';
  }

  // Helper method to check if AM session should be highlighted as current
  isAMSessionCurrent(): boolean {
    const currentSession = this.getCurrentSessionType();
    return currentSession === 'AM' && (this.sessionStatus.canClockInAM || this.sessionStatus.canClockOutAM);
  }

  // Helper method to check if PM session should be highlighted as current
  isPMSessionCurrent(): boolean {
    const currentSession = this.getCurrentSessionType();
    return currentSession === 'PM' && (this.sessionStatus.canClockInPM || this.sessionStatus.canClockOutPM);
  }

}
