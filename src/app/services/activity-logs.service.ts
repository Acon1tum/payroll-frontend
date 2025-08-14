import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable, interval, BehaviorSubject, Subscription } from 'rxjs';
import { switchMap, startWith, tap } from 'rxjs/operators';
import { environment } from '../../environment/environment';
import { AuthService } from './auth.service';

export interface ActivityLog {
  id: string;
  userId?: string;
  entity: string;
  entityId: string;
  action: string;
  before?: any;
  after?: any;
  ipAddress?: string;
  userAgent?: string;
  details?: string;
  severity: string;
  createdAt: string;
  user?: {
    id: string;
    email: string;
    role: string;
    employee?: {
      firstName: string;
      lastName: string;
      employeeNumber: string;
    };
  };
}

export interface ActivityLogsResponse {
  success: boolean;
  data: {
    activityLogs: ActivityLog[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNextPage: boolean;
      hasPrevPage: boolean;
    };
  };
}

export interface ActivityLogsSummary {
  success: boolean;
  data: {
    actionCounts: Array<{ action: string; _count: { action: number } }>;
    entityCounts: Array<{ entity: string; _count: { entity: number } }>;
    severityCounts: Array<{ severity: string; _count: { severity: number } }>;
    recentActivityCount: number;
    totalLogs: number;
  };
}

export interface ActivityLogsFilters {
  page?: number;
  limit?: number;
  entity?: string;
  action?: string;
  userId?: string;
  severity?: string;
  ipAddress?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ActivityLogsService {
  private apiUrl = `${environment.apiUrl}/audit-trail/activity-logs`;
  private realTimeSubscription?: Subscription;
  private realTimeEnabled = new BehaviorSubject<boolean>(false);
  private lastUpdateTime = new BehaviorSubject<Date>(new Date());
  private newActivityDetected = new BehaviorSubject<boolean>(false);

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  // Real-time update methods
  get realTimeEnabled$(): Observable<boolean> {
    return this.realTimeEnabled.asObservable();
  }

  get lastUpdateTime$(): Observable<Date> {
    return this.lastUpdateTime.asObservable();
  }

  get newActivityDetected$(): Observable<boolean> {
    return this.newActivityDetected.asObservable();
  }

  /**
   * Start real-time updates with configurable interval
   */
  startRealTimeUpdates(intervalMs: number = 30000): void { // Default: 30 seconds
    if (this.realTimeSubscription) {
      this.stopRealTimeUpdates();
    }

    this.realTimeEnabled.next(true);
    
    this.realTimeSubscription = interval(intervalMs)
      .pipe(
        startWith(0), // Start immediately
        tap(() => this.lastUpdateTime.next(new Date()))
      )
      .subscribe(() => {
        // Check for new activities and notify subscribers
        this.checkForNewActivities();
      });
  }

  /**
   * Stop real-time updates
   */
  stopRealTimeUpdates(): void {
    if (this.realTimeSubscription) {
      this.realTimeSubscription.unsubscribe();
      this.realTimeSubscription = undefined;
    }
    this.realTimeEnabled.next(false);
  }

  /**
   * Get real-time activity logs with automatic refresh
   */
  getRealTimeActivityLogs(filters: ActivityLogsFilters = {}): Observable<ActivityLogsResponse> {
    return this.lastUpdateTime$.pipe(
      switchMap(() => this.getActivityLogs(filters))
    );
  }

  /**
   * Get real-time summary with automatic refresh
   */
  getRealTimeSummary(startDate?: string, endDate?: string): Observable<ActivityLogsSummary> {
    return this.lastUpdateTime$.pipe(
      switchMap(() => this.getActivityLogsSummary(startDate, endDate))
    );
  }

  /**
   * Check for new activities and notify subscribers
   */
  private checkForNewActivities(): void {
    // This could be enhanced to compare with previous data
    // For now, we'll just indicate that new data is available
    this.newActivityDetected.next(true);
    
    // Reset after a short delay
    setTimeout(() => {
      this.newActivityDetected.next(false);
    }, 3000);
  }

  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.token;
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

  /**
   * Get all activity logs with filtering and pagination
   */
  getActivityLogs(filters: ActivityLogsFilters = {}): Observable<ActivityLogsResponse> {
    let params = new HttpParams();
    
    Object.keys(filters).forEach(key => {
      const value = filters[key as keyof ActivityLogsFilters];
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, value.toString());
      }
    });

    return this.http.get<ActivityLogsResponse>(this.apiUrl, { 
      params,
      headers: this.getAuthHeaders()
    });
  }

  /**
   * Get activity log by ID
   */
  getActivityLogById(id: string): Observable<{ success: boolean; data: ActivityLog }> {
    return this.http.get<{ success: boolean; data: ActivityLog }>(`${this.apiUrl}/${id}`, {
      headers: this.getAuthHeaders()
    });
  }

  /**
   * Get activity logs for a specific entity
   */
  getEntityActivityLogs(
    entity: string, 
    entityId: string, 
    page: number = 1, 
    limit: number = 20
  ): Observable<ActivityLogsResponse> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    return this.http.get<ActivityLogsResponse>(
      `${this.apiUrl}/entity/${entity}/${entityId}`, 
      { 
        params,
        headers: this.getAuthHeaders()
      }
    );
  }

  /**
   * Get activity logs summary/statistics
   */
  getActivityLogsSummary(startDate?: string, endDate?: string): Observable<ActivityLogsSummary> {
    let params = new HttpParams();
    
    if (startDate) params = params.set('startDate', startDate);
    if (endDate) params = params.set('endDate', endDate);

    return this.http.get<ActivityLogsSummary>(`${this.apiUrl}/summary`, { 
      params,
      headers: this.getAuthHeaders()
    });
  }

  /**
   * Export activity logs to CSV
   */
  exportActivityLogs(filters: ActivityLogsFilters = {}): Observable<Blob> {
    let params = new HttpParams();
    
    Object.keys(filters).forEach(key => {
      const value = filters[key as keyof ActivityLogsFilters];
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, value.toString());
      }
    });

    return this.http.get(`${this.apiUrl}/export/csv`, { 
      params, 
      responseType: 'blob',
      headers: this.getAuthHeaders()
    });
  }

  /**
   * Download CSV file
   */
  downloadCSV(blob: Blob, filename: string = 'activity-logs.csv'): void {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    window.URL.revokeObjectURL(url);
  }

  /**
   * Format date for display
   */
  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }

  /**
   * Get severity color class
   */
  getSeverityColor(severity: string): string {
    switch (severity.toLowerCase()) {
      case 'critical':
        return 'text-red-600';
      case 'error':
        return 'text-red-500';
      case 'warning':
        return 'text-yellow-600';
      case 'info':
      default:
        return 'text-blue-600';
    }
  }

  /**
   * Get action icon
   */
  getActionIcon(action: string): string {
    switch (action.toUpperCase()) {
      case 'CREATE':
        return 'add_circle';
      case 'UPDATE':
        return 'edit';
      case 'DELETE':
        return 'delete';
      case 'PROCESS':
        return 'play_circle';
      case 'LOGIN':
        return 'login';
      case 'LOGOUT':
        return 'logout';
      case 'APPROVE':
        return 'check_circle';
      case 'REJECT':
        return 'cancel';
      default:
        return 'info';
    }
  }

  /**
   * Get action color
   */
  getActionColor(action: string): string {
    switch (action.toUpperCase()) {
      case 'CREATE':
        return 'text-green-600';
      case 'UPDATE':
        return 'text-blue-600';
      case 'DELETE':
        return 'text-red-600';
      case 'PROCESS':
        return 'text-purple-600';
      case 'LOGIN':
        return 'text-green-600';
      case 'LOGOUT':
        return 'text-gray-600';
      case 'APPROVE':
        return 'text-green-600';
      case 'REJECT':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  }
}
