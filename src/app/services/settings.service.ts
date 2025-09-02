import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { environment } from '../../environment/environment';

export interface SystemSetting {
  id: string;
  key: string;
  value: string;
  description: string;
  category: string;
  isEditable: boolean;
  dataType: 'string' | 'number' | 'boolean' | 'json';
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateSettingRequest {
  key: string;
  value: string;
  description: string;
  category: string;
  isEditable?: boolean;
  dataType?: 'string' | 'number' | 'boolean' | 'json';
}

export interface UpdateSettingRequest {
  value?: string;
  description?: string;
  category?: string;
  isEditable?: boolean;
  dataType?: 'string' | 'number' | 'boolean' | 'json';
}

export interface SettingsResponse {
  success: boolean;
  message: string;
  data: SystemSetting[];
}

export interface SettingResponse {
  success: boolean;
  message: string;
  data: SystemSetting;
}

export interface CategoriesResponse {
  success: boolean;
  message: string;
  data: string[];
}

export interface ExportResponse {
  exportDate: string;
  settings: {
    key: string;
    value: string;
    description: string;
    category: string;
    dataType: string;
  }[];
}

@Injectable({
  providedIn: 'root'
})
export class SettingsService {
  private apiUrl = `${environment.apiUrl}/system/settings`;
  private apiPublicUrl = `${environment.apiUrl}/system/settings/public/system-timezone`;

  // Default timezone if none is set
  private readonly DEFAULT_TIMEZONE = 'Asia/Manila';
  private readonly TZ_STORAGE_KEY = 'system.timezone';

  // ✅ Add timezone change subject for broadcasting changes
  private timezoneChangeSubject = new BehaviorSubject<string>(this.readCachedTimezone() || this.DEFAULT_TIMEZONE);
  public timezoneChange$ = this.timezoneChangeSubject.asObservable();

  constructor(private http: HttpClient) { }

  private readCachedTimezone(): string | null {
    try { return localStorage.getItem(this.TZ_STORAGE_KEY); } catch { return null; }
  }
  private writeCachedTimezone(tz: string) {
    try { localStorage.setItem(this.TZ_STORAGE_KEY, tz); } catch { /* ignore */ }
  }

  // Get all settings
  getAllSettings(): Observable<SettingsResponse> {
    return this.http.get<SettingsResponse>(this.apiUrl);
  }

  // Get settings by category
  getSettingsByCategory(category: string): Observable<SettingsResponse> {
    return this.http.get<SettingsResponse>(`${this.apiUrl}/category/${category}`);
  }

  // Get setting by key
  getSettingByKey(key: string): Observable<SettingResponse> {
    return this.http.get<SettingResponse>(`${this.apiUrl}/key/${key}`);
  }

  // Get setting categories
  getSettingCategories(): Observable<CategoriesResponse> {
    return this.http.get<CategoriesResponse>(`${this.apiUrl}/categories`);
  }

  // Create new setting
  createSetting(setting: CreateSettingRequest): Observable<SettingResponse> {
    return this.http.post<SettingResponse>(this.apiUrl, setting);
  }

  // Update setting by ID
  updateSetting(id: string, setting: UpdateSettingRequest): Observable<SettingResponse> {
    return this.http.put<SettingResponse>(`${this.apiUrl}/${id}`, setting);
  }

  // Update setting by key
  updateSettingByKey(key: string, value: string): Observable<SettingResponse> {
    return this.http.put<SettingResponse>(`${this.apiUrl}/key/${key}`, { value });
  }

  // Delete setting
  deleteSetting(id: string): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(`${this.apiUrl}/${id}`);
  }

  // Reset settings to defaults
  resetSettingsToDefaults(): Observable<{ success: boolean; message: string }> {
    return this.http.post<{ success: boolean; message: string }>(`${this.apiUrl}/reset-defaults`, {});
  }

  // Export settings
  exportSettings(): Observable<ExportResponse> {
    return this.http.get<ExportResponse>(`${this.apiUrl}/export`);
  }

  // Get available timezones
  getAvailableTimezones(): string[] {
    return [
      'UTC',
      'America/New_York',
      'America/Chicago',
      'America/Denver',
      'America/Los_Angeles',
      'Europe/London',
      'Europe/Paris',
      'Europe/Berlin',
      'Asia/Tokyo',
      'Asia/Shanghai',
      'Asia/Singapore',
      'Asia/Manila',
      'Asia/Kolkata',
      'Australia/Sydney',
      'Pacific/Auckland',
      'Pacific/Honolulu'
    ];
  }

  // Get current system timezone setting
  getSystemTimezone(): Observable<string> {
    return new Observable(observer => {
      // Emit cached immediately for instant UI correctness
      const cached = this.readCachedTimezone();
      if (cached) {
        this.timezoneChangeSubject.next(cached);
        observer.next(cached);
      }

      // Prefer public endpoint (no auth) so it also works before auth pipeline
      this.http.get<{ success: boolean; data: { key: string; value: string } }>(this.apiPublicUrl).subscribe({
        next: (pub) => {
          const tz = pub?.data?.value || this.DEFAULT_TIMEZONE;
          this.writeCachedTimezone(tz);
          this.timezoneChangeSubject.next(tz);
          observer.next(tz);
          observer.complete();
        },
        error: () => {
          // Fallback to secured by-key endpoint
          this.getSettingByKey('system.timezone').subscribe({
            next: (response: SettingResponse) => {
              const timezone = response.data.value || this.DEFAULT_TIMEZONE;
              this.writeCachedTimezone(timezone);
              this.timezoneChangeSubject.next(timezone);
              observer.next(timezone);
              observer.complete();
            },
            error: () => {
              // If no timezone setting exists, return default (and cache it)
              this.writeCachedTimezone(this.DEFAULT_TIMEZONE);
              this.timezoneChangeSubject.next(this.DEFAULT_TIMEZONE);
              observer.next(this.DEFAULT_TIMEZONE);
              observer.complete();
            }
          });
        }
      });
    });
  }

  // Update system timezone setting
  updateSystemTimezone(timezone: string): Observable<SettingResponse> {
    console.log('SettingsService: Updating system timezone to:', timezone);
    
    const timezoneSetting: CreateSettingRequest = {
      key: 'system.timezone',
      value: timezone,
      description: 'System-wide timezone for all date and time operations',
      category: 'General',
      isEditable: true,
      dataType: 'string'
    };

    // Try to update existing setting first, if it fails, create new one
    return new Observable(observer => {
      this.updateSettingByKey('system.timezone', timezone).subscribe({
        next: (response: SettingResponse) => {
          console.log('SettingsService: Timezone updated successfully:', response);
          // ✅ Broadcast timezone change after successful update
          this.writeCachedTimezone(timezone);
          this.timezoneChangeSubject.next(timezone);
          observer.next(response);
          observer.complete();
        },
        error: (error) => {
          console.log('SettingsService: Update failed, creating new setting:', error);
          // If update fails, create new setting
          this.createSetting(timezoneSetting).subscribe({
            next: (response: SettingResponse) => {
              console.log('SettingsService: New timezone setting created:', response);
              // ✅ Broadcast timezone change after successful creation
              this.writeCachedTimezone(timezone);
              this.timezoneChangeSubject.next(timezone);
              observer.next(response);
              observer.complete();
            },
            error: (createError: any) => {
              console.error('SettingsService: Failed to create timezone setting:', createError);
              observer.error(createError);
            }
          });
        }
      });
    });
  }

  // Get timezone display name
  getTimezoneDisplayName(timezone: string): string {
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

  // Helper method to validate setting value based on data type
  validateSettingValue(value: string, dataType: string): boolean {
    switch (dataType) {
      case 'number':
        return !isNaN(Number(value));
      case 'boolean':
        return ['true', 'false', '1', '0'].includes(value.toLowerCase());
      case 'json':
        try {
          JSON.parse(value);
          return true;
        } catch {
          return false;
        }
      case 'string':
      default:
        return true;
    }
  }

  // Helper method to format setting value for display
  formatSettingValue(setting: SystemSetting): string {
    switch (setting.dataType) {
      case 'boolean':
        return setting.value === 'true' || setting.value === '1' ? 'Yes' : 'No';
      case 'json':
        try {
          const parsed = JSON.parse(setting.value);
          return JSON.stringify(parsed, null, 2);
        } catch {
          return setting.value;
        }
      default:
        return setting.value;
    }
  }

  // Helper method to get data type options
  getDataTypeOptions(): { value: string; label: string }[] {
    return [
      { value: 'string', label: 'Text' },
      { value: 'number', label: 'Number' },
      { value: 'boolean', label: 'Yes/No' },
      { value: 'json', label: 'JSON' }
    ];
  }

  // Helper method to get category options (common system categories)
  getCommonCategories(): string[] {
    return [
      'General',
      'Security',
      'Email',
      'Database',
      'File Storage',
      'Notifications',
      'Payroll',
      'Attendance',
      'Leave Management',
      'Evaluation',
      'Reports',
      'Integration',
      'Backup',
      'Maintenance'
    ];
  }

  // ✅ Add method to get current timezone synchronously
  getCurrentSystemTimezone(): string {
    return this.readCachedTimezone() || this.timezoneChangeSubject.value;
  }

  // ✅ Add method to update timezone
  updateTimezone(newTimezone: string): void {
    this.writeCachedTimezone(newTimezone);
    this.timezoneChangeSubject.next(newTimezone);
  }

  // ✅ Add method to initialize timezone
  initializeTimezone(): void {
    this.getSystemTimezone().subscribe({
      next: (timezone) => {
        if (timezone) {
          this.writeCachedTimezone(timezone);
          this.timezoneChangeSubject.next(timezone);
        }
      },
      error: (error) => {
        console.warn('Could not load system timezone, using default:', error);
      }
    });
  }
}
