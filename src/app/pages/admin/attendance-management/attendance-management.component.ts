import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { SidebarComponent } from "../../../shared/sidebar/sidebar.component";
import { HeaderComponent } from "../../../shared/header/header.component";
import { AttendanceService, AttendanceRecord, TimeLog } from "../../../services/attendance.service";


interface Breadcrumb {
  label: string;
  path?: string;
  active?: boolean;
}

@Component({
  selector: 'app-attendance-management',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule, SidebarComponent, HeaderComponent],
  templateUrl: './attendance-management.component.html',
  styleUrl: './attendance-management.component.scss'
})


export class AttendanceManagementComponent {
  breadcrumbs: Breadcrumb[] = [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Attendance Management', path: '/attendance-management', active: true }
  ];

  // UI State
  isLoading = false;
  errorMessage = '';
  successMessage = '';

  // Date filter (default: today)
  selectedDate: string = '';

  // Time logs and computed latest entries per employee for table
  timeLogs: TimeLog[] = [];
  tableRows: Array<{ employeeId: string; employeeName: string; department?: string; time: string; type: string }>= [];
  paginatedRecords: Array<{ employeeId: string; employeeName: string; department?: string; time: string; type: string }>= [];
  currentPage = 1;
  itemsPerPage = 10;
  itemsPerPageOptions = [5, 10, 15, 20];
  totalItems = 0;
  totalPages = 0;
  Math = Math;

  // Adjustment overlay
  showAdjustmentOverlay = false;
  adjustmentTab: 'requests' | 'new' = 'requests';

  // Simple in-memory adjustment requests for demo/approval flow
  timeAdjustmentRequests: Array<{
    id: string;
    employeeName: string;
    department?: string;
    date: string;
    type: 'timeIn' | 'breakStart' | 'breakEnd' | 'timeOut';
    requestedTime: string; // HH:mm
    reason: string;
    status: 'pending' | 'approved' | 'rejected';
  }> = [];

  // New adjustment form (no dropdowns; type chosen via segmented buttons)
  newAdjustment = {
    employeeName: '',
    department: '',
    date: '',
    type: 'timeIn' as 'timeIn' | 'breakStart' | 'breakEnd' | 'timeOut',
    time: '', // HH:mm
    reason: ''
  };

  constructor(private attendanceService: AttendanceService) {
    const today = new Date();
    this.selectedDate = this.attendanceService.formatDateForInput(today);
    this.newAdjustment.date = this.selectedDate;
    this.loadTimeLogsForDate();
    this.setupAutoRefresh();
  }

  // ===== Time Logs Loading =====
  loadTimeLogsForDate() {
    this.isLoading = true;
    this.errorMessage = '';

    const start = this.selectedDate;
    const end = this.selectedDate;

    this.attendanceService.getTimeLogs({ startDate: start, endDate: end, page: 1, limit: 1000 })
    .subscribe({
      next: (res) => {
        this.timeLogs = res.data || [];
        if (!this.timeLogs.length) {
          // Fallback: fetch recent logs without date filter to verify data flow
          this.fetchRecentLogsFallback();
          return;
        }
        this.recomputeTableRows();
        this.currentPage = 1;
        this.updatePagination();
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Failed to load time logs', err);
        this.errorMessage = 'Failed to load time logs for the selected date.';
        this.isLoading = false;
      }
    });
  }

  private fetchRecentLogsFallback() {
    this.attendanceService.getTimeLogs({ page: 1, limit: 100 })
      .subscribe({
        next: (res) => {
          this.timeLogs = res.data || [];
          this.recomputeTableRows();
          this.currentPage = 1;
          this.updatePagination();
          this.isLoading = false;
          if (!this.timeLogs.length) {
            this.errorMessage = 'No time logs found.';
            setTimeout(() => this.errorMessage = '', 4000);
          } else {
            this.successMessage = 'Showing recent logs (no entries for selected date).';
            setTimeout(() => this.successMessage = '', 4000);
          }
        },
        error: (err) => {
          console.error('Fallback fetch failed', err);
          this.errorMessage = 'Unable to fetch time logs.';
          this.isLoading = false;
        }
      });
  }

  onDateChange() {
    this.loadTimeLogsForDate();
    this.setupAutoRefresh();
  }

  // ===== Pagination =====
  updatePagination() {
    this.totalItems = this.tableRows.length;
    this.totalPages = Math.ceil(this.totalItems / this.itemsPerPage) || 1;
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.paginatedRecords = this.tableRows.slice(startIndex, endIndex);
  }

  onItemsPerPageChange() {
    this.currentPage = 1;
    this.updatePagination();
  }

  goToPage(page: number) {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.updatePagination();
  }

  goToFirstPage() { this.goToPage(1); }
  goToLastPage() { this.goToPage(this.totalPages); }
  goToPreviousPage() { this.goToPage(this.currentPage - 1); }
  goToNextPage() { this.goToPage(this.currentPage + 1); }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxVisible = 5;
    const total = this.totalPages;
    let start = Math.max(1, this.currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(total, start + maxVisible - 1);
    if (end - start + 1 < maxVisible) start = Math.max(1, end - maxVisible + 1);
    for (let p = start; p <= end; p++) pages.push(p);
    return pages;
  }

  // ===== Helpers and computed rows =====
  private recomputeTableRows() {
    const latestByEmployee = new Map<string, TimeLog>();
    const nameByEmployee = new Map<string, { name: string; department?: string }>();

    for (const log of this.timeLogs) {
      const employeeId = log.employee?.id || log.employeeId;
      if (!employeeId) continue;
      const current = latestByEmployee.get(employeeId);
      const currentTs = current ? new Date(current.timestamp).getTime() : -Infinity;
      const ts = new Date(log.timestamp).getTime();
      if (!current || ts > currentTs) {
        latestByEmployee.set(employeeId, log);
      }
      if (!nameByEmployee.has(employeeId)) {
        const employeeName = `${log.employee?.firstName || ''} ${log.employee?.lastName || ''}`.trim();
        nameByEmployee.set(employeeId, { name: employeeName || 'Unknown', department: log.employee?.department?.name });
      }
    }

    const rows: Array<{ employeeId: string; employeeName: string; department?: string; time: string; type: string }> = [];
    latestByEmployee.forEach((log, employeeId) => {
      const meta = nameByEmployee.get(employeeId) || { name: 'Unknown', department: undefined };
      rows.push({
        employeeId,
        employeeName: meta.name,
        department: meta.department,
        time: this.formatTime(log.timestamp),
        type: this.toDisplayType(log.type)
      });
    });

    // Sort by name for consistency
    rows.sort((a, b) => a.employeeName.localeCompare(b.employeeName));
    this.tableRows = rows;
  }

  private toDisplayType(type: TimeLog['type'] | undefined): string {
    if (!type) return 'N/A';
    if (type === 'timeIn') return 'Time-In';
    if (type === 'timeOut') return 'Time-Out';
    if (type === 'breakStart') return 'Break Out';
    if (type === 'breakEnd') return 'Break In';
    return type;
  }

  formatTime(value?: Date | string): string {
    if (!value) return '-';
    const d = typeof value === 'string' ? new Date(value) : value;
    if (isNaN(d.getTime())) return '-';
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  // ===== Details Modal =====
  showDetailsOverlay = false;
  detailsData: {
    employeeName: string;
    timeInAm: string;
    timeOutAm: string;
    timeInPm: string;
    timeOutPm: string;
    breakOut: string;
    breakIn: string;
  } | null = null;

  openDetails(row: { employeeId: string; employeeName: string }) {
    const logs = this.timeLogs.filter(l => (l.employee?.id || l.employeeId) === row.employeeId)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    const pick = (predicate: (d: Date, log: TimeLog) => boolean, type?: TimeLog['type']) => {
      for (const log of logs) {
        const d = new Date(log.timestamp);
        if ((type ? log.type === type : true) && predicate(d, log)) return this.formatTime(log.timestamp);
      }
      return 'N/A';
    };

    const isAM = (d: Date) => d.getHours() < 12;
    const isPM = (d: Date) => d.getHours() >= 12;

    this.detailsData = {
      employeeName: row.employeeName,
      timeInAm: pick((d, l) => isAM(d), 'timeIn'),
      timeOutAm: pick((d, l) => isAM(d), 'timeOut'),
      timeInPm: pick((d, l) => isPM(d), 'timeIn'),
      timeOutPm: pick((d, l) => isPM(d), 'timeOut'),
      breakOut: pick(() => true, 'breakStart'),
      breakIn: pick(() => true, 'breakEnd')
    };
    this.showDetailsOverlay = true;
  }

  closeDetails() { this.showDetailsOverlay = false; }

  // ===== Auto refresh for today =====
  private refreshInterval: any;
  private setupAutoRefresh() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }
    const todayStr = this.attendanceService.formatDateForInput(new Date());
    if (this.selectedDate === todayStr) {
      this.refreshInterval = setInterval(() => this.loadTimeLogsForDate(), 30000);
    }
  }

  // ===== Adjustment Overlay =====
  openAdjustmentOverlay() {
    this.adjustmentTab = 'requests';
    this.showAdjustmentOverlay = true;
  }

  closeAdjustmentOverlay() { this.showAdjustmentOverlay = false; }

  setAdjustmentType(type: 'timeIn' | 'breakStart' | 'breakEnd' | 'timeOut') {
    this.newAdjustment.type = type;
  }

  submitNewAdjustment() {
    // Client-side queue of requests; also create a manual time log to reflect change
    if (!this.newAdjustment.employeeName.trim() || !this.newAdjustment.date || !this.newAdjustment.time || !this.newAdjustment.reason.trim()) {
      this.errorMessage = 'Please complete all fields for the adjustment request.';
      setTimeout(() => this.errorMessage = '', 4000);
      return;
    }

    const id = 'adj_' + Math.random().toString(36).slice(2, 9);
    this.timeAdjustmentRequests.unshift({
      id,
      employeeName: this.newAdjustment.employeeName.trim(),
      department: this.newAdjustment.department?.trim(),
      date: this.newAdjustment.date,
      type: this.newAdjustment.type,
      requestedTime: this.newAdjustment.time,
      reason: this.newAdjustment.reason.trim(),
      status: 'pending'
    });

    // Reset form (keep date defaulting to selected)
    this.newAdjustment = {
      employeeName: '',
      department: '',
      date: this.selectedDate,
      type: 'timeIn',
      time: '',
      reason: ''
    };

    this.successMessage = 'Time adjustment request submitted.';
    setTimeout(() => this.successMessage = '', 3000);
    this.adjustmentTab = 'requests';
  }

  approveAdjustment(reqId: string) {
    const req = this.timeAdjustmentRequests.find(r => r.id === reqId);
    if (!req) return;
    req.status = 'approved';
    this.successMessage = 'Adjustment approved.';
    setTimeout(() => this.successMessage = '', 3000);
  }

  rejectAdjustment(reqId: string) {
    const req = this.timeAdjustmentRequests.find(r => r.id === reqId);
    if (!req) return;
    req.status = 'rejected';
    this.successMessage = 'Adjustment rejected.';
    setTimeout(() => this.successMessage = '', 3000);
  }
}
