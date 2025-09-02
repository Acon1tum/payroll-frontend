import { Injectable } from '@angular/core';
import { SettingsService } from './settings.service';
import { Observable, BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TimezoneService {
  private systemTimezone = new BehaviorSubject<string>('Asia/Manila');
  private isInitialized = false;

  constructor(private settingsService: SettingsService) {
    // Initialize subject from cached/current settings value
    const tz = this.settingsService.getCurrentSystemTimezone();
    this.systemTimezone.next(tz);

    this.initializeTimezone();
    
    // ✅ Subscribe to timezone changes from settings service
    this.settingsService.timezoneChange$.subscribe(newTimezone => {
      console.log('TimezoneService: Received timezone update:', newTimezone);
      this.systemTimezone.next(newTimezone);
      console.log('TimezoneService: Timezone updated to:', newTimezone);
    });
  }

  /**
   * Initialize the timezone service by loading the system timezone setting
   */
  private initializeTimezone() {
    if (!this.isInitialized) {
      console.log('TimezoneService: Initializing timezone...');
      this.settingsService.getSystemTimezone().subscribe({
        next: (timezone) => {
          console.log('TimezoneService: Loaded timezone from settings:', timezone);
          this.systemTimezone.next(timezone);
          this.isInitialized = true;
        },
        error: (error) => {
          console.warn('TimezoneService: Could not load timezone, using cached/default:', error);
          this.isInitialized = true;
        }
      });
    }
  }

  /**
   * Get the current system timezone as an observable
   */
  getSystemTimezone(): Observable<string> {
    return this.systemTimezone.asObservable();
  }

  /**
   * Get the current system timezone value (synchronous)
   */
  getCurrentTimezone(): string {
    return this.systemTimezone.value;
  }

  /**
   * Update the system timezone (called when settings are changed)
   */
  updateSystemTimezone(timezone: string) {
    console.log('TimezoneService: Manually updating timezone to:', timezone);
    this.systemTimezone.next(timezone);
  }

  /**
   * Convert a date to the system timezone
   * Using browser-native Intl API for better compatibility
   */
  toSystemTimezone(date: Date): Date {
    try {
      const timezone = this.systemTimezone.value;
      // Use Intl.DateTimeFormat to format the date in the target timezone
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      });
      
      const parts = formatter.formatToParts(date);
      const values: any = {};
      parts.forEach(part => {
        if (part.type !== 'literal') {
          values[part.type] = parseInt(part.value);
        }
      });
      
      // Create new date in the target timezone
      return new Date(values.year, values.month - 1, values.day, values.hour, values.minute, values.second);
    } catch (error) {
      console.warn('TimezoneService: Error converting to system timezone, using original date:', error);
      return date;
    }
  }

  /**
   * Format a date in the system timezone
   * Using browser-native Intl API for better compatibility
   */
  formatInSystemTimezone(date: Date, format: string): string {
    try {
      const timezone = this.systemTimezone.value;
      
      if (format === 'HH:mm:ss a') {
        // Format as 12-hour time with AM/PM
        return new Intl.DateTimeFormat('en-US', {
          timeZone: timezone,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true
        }).format(date);
      } else if (format === 'HH:mm:ss') {
        // Format as 24-hour time
        return new Intl.DateTimeFormat('en-US', {
          timeZone: timezone,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false
        }).format(date);
      } else {
        // Default formatting
        return new Intl.DateTimeFormat('en-US', {
          timeZone: timezone
        }).format(date);
      }
    } catch (error) {
      console.warn('TimezoneService: Error formatting in system timezone, using local format:', error);
      // Fallback to local formatting
      return date.toLocaleString();
    }
  }

  /**
   * Get current time in system timezone
   */
  getCurrentSystemTime(): Date {
    return this.toSystemTimezone(new Date());
  }

  /**
   * Get formatted current time in system timezone
   */
  getFormattedCurrentTime(format: string = 'HH:mm:ss'): string {
    try {
      return this.formatInSystemTimezone(new Date(), format);
    } catch (error) {
      console.warn('TimezoneService: Error formatting current time, using local time:', error);
      // Fallback to local time formatting
      const now = new Date();
      if (format === 'HH:mm:ss a') {
        return now.toLocaleTimeString('en-US', { 
          hour12: true, 
          hour: '2-digit', 
          minute: '2-digit', 
          second: '2-digit' 
        });
      }
      return now.toLocaleTimeString();
    }
  }

  /**
   * Get formatted current date in system timezone
   */
  getFormattedCurrentDate(format: string = 'EEEE, MMMM d, y'): string {
    try {
      const timezone = this.systemTimezone.value;
      return new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long'
      }).format(new Date());
    } catch (error) {
      console.warn('TimezoneService: Error formatting current date, using local date:', error);
      // Fallback to local date formatting
      return new Date().toLocaleDateString();
    }
  }

  /**
   * Convert a date from a specific timezone to the system timezone
   * Note: This is a simplified conversion since zonedTimeToUtc is not available
   */
  fromTimezoneToSystem(date: Date, fromTimezone: string): Date {
    // For now, we'll use a simple approach by treating the date as if it's in the system timezone
    // In a production environment, you might want to use a more robust timezone library
    return this.toSystemTimezone(date);
  }

  /**
   * Get timezone offset information for the current system timezone
   * FIXED: This method now correctly calculates the offset using browser APIs
   */
  getTimezoneOffset(): number {
    try {
      const timezone = this.systemTimezone.value;
      console.log('TimezoneService: Calculating offset for timezone:', timezone);
      
      // Get the timezone offset using browser's Intl API
      const now = new Date();
      const utcTime = new Date(now.toLocaleString("en-US", {timeZone: "UTC"}));
      const systemTime = new Date(now.toLocaleString("en-US", {timeZone: timezone}));
      const offsetMs = systemTime.getTime() - utcTime.getTime();
      
      console.log('TimezoneService: Offset calculation:', {
        timezone,
        utcTime: utcTime.toISOString(),
        systemTime: systemTime.toISOString(),
        offsetMs,
        offsetHours: offsetMs / (1000 * 60 * 60)
      });
      
      return offsetMs;
    } catch (error) {
      console.warn('TimezoneService: Error calculating timezone offset, using 0:', error);
      return 0;
    }
  }

  /**
   * Get formatted timezone offset string (e.g., "UTC+08:00")
   * FIXED: This method now correctly formats the offset
   */
  getFormattedTimezoneOffset(): string {
    try {
      const offsetMs = this.getTimezoneOffset();
      const offsetHours = Math.floor(offsetMs / (1000 * 60 * 60));
      const offsetMinutes = Math.floor((offsetMs % (1000 * 60 * 60)) / (1000 * 60));
      const sign = offsetMs >= 0 ? '+' : '-';
      return `UTC${sign}${Math.abs(offsetHours).toString().padStart(2, '0')}:${Math.abs(offsetMinutes).toString().padStart(2, '0')}`;
    } catch (error) {
      console.warn('TimezoneService: Error formatting timezone offset, using UTC+00:00:', error);
      return 'UTC+00:00';
    }
  }

  /**
   * Check if the current timezone is different from the user's local timezone
   */
  isDifferentFromLocal(): boolean {
    try {
      const localOffset = new Date().getTimezoneOffset();
      const systemOffset = this.getTimezoneOffset() / (1000 * 60); // Convert to minutes
      return Math.abs(localOffset + systemOffset) > 0;
    } catch (error) {
      console.warn('TimezoneService: Error checking timezone difference:', error);
      return false;
    }
  }

  /**
   * Get a human-readable timezone difference description
   */
  getTimezoneDifferenceDescription(): string {
    if (!this.isDifferentFromLocal()) {
      return 'System timezone matches your local timezone';
    }

    try {
      const localOffset = new Date().getTimezoneOffset();
      const systemOffset = this.getTimezoneOffset() / (1000 * 60);
      const difference = localOffset + systemOffset;
      
      if (difference > 0) {
        return `System time is ${Math.abs(difference)} minutes ahead of your local time`;
      } else {
        return `System time is ${Math.abs(difference)} minutes behind your local time`;
      }
    } catch (error) {
      console.warn('TimezoneService: Error getting timezone difference description:', error);
      return 'Unable to determine timezone difference';
    }
  }

  /**
   * Get the timezone name for display purposes
   */
  getTimezoneDisplayName(): string {
    const timezone = this.systemTimezone.value;
    const timezoneNames: { [key: string]: string } = {
      'UTC': 'UTC (Coordinated Universal Time)',
      'America/New_York': 'Eastern Time (ET)',
      'America/Chicago': 'Central Time (CT)',
      'America/Denver': 'Mountain Time (MT)',
      'America/Los_Angeles': 'Pacific Time (PT)',
      'Europe/London': 'Greenwich Mean Time (GMT)',
      'Europe/Paris': 'Central European Time (CET)',
      'Europe/Berlin': 'Central European Time (CET)',
      'Asia/Tokyo': 'Japan Standard Time (JST)',
      'Asia/Shanghai': 'China Standard Time (CST)',
      'Asia/Singapore': 'Singapore Time (SGT)',
      'Asia/Manila': 'Philippine Time (PHT)',
      'Asia/Kolkata': 'India Standard Time (IST)',
      'Australia/Sydney': 'Australian Eastern Time (AET)',
      'Pacific/Auckland': 'New Zealand Standard Time (NZST)',
      'Pacific/Honolulu': 'Hawaii-Aleutian Time (HAT)'
    };

    return timezoneNames[timezone] || timezone;
  }

  /**
   * Return an ISO string representing the current instant (UTC)
   * This avoids double-shifting; display should always apply the system timezone
   */
  getNowIsoInSystemTimezone(): string {
    return new Date().toISOString();
  }

  /**
   * Get today's date string (yyyy-MM-dd) in the system timezone
   */
  getDateStringInSystemTimezone(): string {
    try {
      const tz = this.systemTimezone.value;
      const fmt = new Intl.DateTimeFormat('en-CA', {
        timeZone: tz,
        year: 'numeric', month: '2-digit', day: '2-digit'
      });
      const parts: Record<string,string> = {} as any;
      for (const p of fmt.formatToParts(new Date())) if (p.type !== 'literal') parts[p.type] = p.value;
      return `${parts['year']}-${parts['month']}-${parts['day']}`;
    } catch (e) {
      console.warn('TimezoneService: getDateStringInSystemTimezone fallback to UTC date', e);
      return new Date().toISOString().split('T')[0];
    }
  }

  /**
   * Convenience: Date object corresponding to system-timezone "now"
   */
  getNowDateInSystemTimezone(): Date {
    return new Date(this.getNowIsoInSystemTimezone());
  }
}
