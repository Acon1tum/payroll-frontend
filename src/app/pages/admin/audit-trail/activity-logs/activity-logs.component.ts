import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SidebarComponent } from "../../../../shared/sidebar/sidebar.component";
import { HeaderComponent } from "../../../../shared/header/header.component";
import { ActivityLogsService, ActivityLog, ActivityLogsResponse, ActivityLogsSummary, ActivityLogsFilters } from '../../../../services/activity-logs.service';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';

interface Breadcrumb {
  label: string;
  path?: string;
  active?: boolean;
}

@Component({
  selector: 'app-activity-logs',
  templateUrl: './activity-logs.component.html',
  styleUrl: './activity-logs.component.scss',
  imports: [CommonModule, FormsModule, ReactiveFormsModule, SidebarComponent, HeaderComponent]
})
export class ActivityLogsComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // Data
  activityLogs: ActivityLog[] = [];
  summary: ActivityLogsSummary | null = null;
  loading = false;
  error = '';

  // Pagination
  currentPage = 1;
  pageSize = 20;
  totalItems = 0;
  totalPages = 0;

  // Filters
  filtersForm: FormGroup;
  showFilters = false;

  // Export
  exporting = false;
  isRealTimeEnabled = true;

  // Breadcrumbs for header
  breadcrumbs: Breadcrumb[] = [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Audit Trail', path: '/admin/audit-trail' },
    { label: 'Activity Logs', active: true }
  ];

  constructor(
    public activityLogsService: ActivityLogsService,
    private fb: FormBuilder
  ) {
    this.filtersForm = this.fb.group({
      entity: [''],
      action: [''],
      severity: [''],
      ipAddress: [''],
      startDate: [''],
      endDate: [''],
      search: ['']
    });
  }

  ngOnInit(): void {
    this.loadActivityLogs();
    this.loadSummary();

    // Start real-time updates
    this.startRealTimeUpdates();

    // Setup search debouncing
    this.filtersForm.get('search')?.valueChanges
      .pipe(
        takeUntil(this.destroy$),
        debounceTime(500),
        distinctUntilChanged()
      )
      .subscribe(() => {
        this.currentPage = 1;
        this.loadActivityLogs();
      });

    // Setup other filter changes
    this.filtersForm.valueChanges
      .pipe(
        takeUntil(this.destroy$),
        debounceTime(300),
        distinctUntilChanged()
      )
      .subscribe(() => {
        this.currentPage = 1;
        this.loadActivityLogs();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    
    // Stop real-time updates
    this.stopRealTimeUpdates();
  }

  startRealTimeUpdates(): void {
    // Subscribe to real-time updates
    this.activityLogsService.lastUpdateTime$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        // Refresh data when real-time update is triggered
        this.loadActivityLogs();
        this.loadSummary();
      });
    
    // Start the real-time service
    this.activityLogsService.startRealTimeUpdates(30000); // 30 seconds
    
    // Update the local state
    this.isRealTimeEnabled = true;
  }

  stopRealTimeUpdates(): void {
    this.activityLogsService.stopRealTimeUpdates();
    
    // Update the local state
    this.isRealTimeEnabled = false;
  }

  toggleRealTime(): void {
    if (this.isRealTimeEnabled) {
      this.stopRealTimeUpdates();
      this.isRealTimeEnabled = false;
    } else {
      this.startRealTimeUpdates();
      this.isRealTimeEnabled = true;
    }
  }

  manualRefresh(): void {
    this.loadActivityLogs();
    this.loadSummary();
  }

  loadActivityLogs(): void {
    this.loading = true;
    this.error = '';

    const filters: ActivityLogsFilters = {
      page: this.currentPage,
      limit: this.pageSize,
      ...this.filtersForm.value
    };

    this.activityLogsService.getActivityLogs(filters)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: ActivityLogsResponse) => {
          this.activityLogs = response.data.activityLogs;
          this.totalItems = response.data.pagination.total;
          this.totalPages = response.data.pagination.totalPages;
          this.loading = false;
        },
        error: (error) => {
          this.error = 'Failed to load activity logs';
          this.loading = false;
          console.error('Error loading activity logs:', error);
        }
      });
  }

  loadSummary(): void {
    const { startDate, endDate } = this.filtersForm.value;
    
    this.activityLogsService.getActivityLogsSummary(startDate, endDate)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.summary = response;
        },
        error: (error) => {
          console.error('Error loading summary:', error);
        }
      });
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadActivityLogs();
  }

  onPageSizeChange(pageSize: number): void {
    this.pageSize = pageSize;
    this.currentPage = 1;
    this.loadActivityLogs();
  }

  clearFilters(): void {
    this.filtersForm.reset();
    this.currentPage = 1;
    this.loadActivityLogs();
    this.loadSummary();
  }

  toggleFilters(): void {
    this.showFilters = !this.showFilters;
  }

  exportToCSV(): void {
    this.exporting = true;
    const filters: ActivityLogsFilters = this.filtersForm.value;

    this.activityLogsService.exportActivityLogs(filters)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (blob) => {
          this.activityLogsService.downloadCSV(blob);
          this.exporting = false;
        },
        error: (error) => {
          this.error = 'Failed to export activity logs';
          this.exporting = false;
          console.error('Error exporting activity logs:', error);
        }
      });
  }

  getSeverityColor(severity: string): string {
    return this.activityLogsService.getSeverityColor(severity);
  }

  getActionIcon(action: string): string {
    return this.activityLogsService.getActionIcon(action);
  }

  getActionColor(action: string): string {
    return this.activityLogsService.getActionColor(action);
  }

  formatDate(dateString: string): string {
    return this.activityLogsService.formatDate(dateString);
  }

  getUserDisplayName(log: ActivityLog): string {
    if (log.user?.employee) {
      return `${log.user.employee.firstName} ${log.user.employee.lastName} (${log.user.employee.employeeNumber})`;
    }
    return log.user?.email || 'System';
  }

  getRoleDisplayName(role: string): string {
    return role.charAt(0).toUpperCase() + role.slice(1).replace(/([A-Z])/g, ' $1');
  }

  getWarningCount(): number {
    if (!this.summary?.data.severityCounts) return 0;
    const warningCount = this.summary.data.severityCounts.find(s => s.severity === 'warning');
    return warningCount?._count.severity || 0;
  }

  getErrorCount(): number {
    if (!this.summary?.data.severityCounts) return 0;
    const errorCount = this.summary.data.severityCounts.find(s => s.severity === 'error');
    return errorCount?._count.severity || 0;
  }

  getMaxPageItems(): number {
    return Math.min(this.currentPage * this.pageSize, this.totalItems);
  }
}
