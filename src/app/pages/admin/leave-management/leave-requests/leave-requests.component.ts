import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SidebarComponent } from "../../../../shared/sidebar/sidebar.component";
import { HeaderComponent } from "../../../../shared/header/header.component";
import { LeaveService, LeaveApplication, LeaveType } from '../../../../services/leave.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

interface Breadcrumb {
  label: string;
  url?: string;
  active?: boolean;
}

@Component({
  selector: 'app-leave-requests',
  templateUrl: './leave-requests.component.html',
  styleUrl: './leave-requests.component.scss',
  imports: [CommonModule, FormsModule, SidebarComponent, HeaderComponent],
  standalone: true
})
export class LeaveRequestsComponent implements OnInit, OnDestroy {
  leaveRequests: LeaveApplication[] = [];
  leaveTypes: LeaveType[] = [];
  isLoading = false;
  filter: { employee?: string; department?: string; status?: string } = {};

  // Modal properties
  showDetailsModal = false;
  selectedRequest: LeaveApplication | null = null;

  private destroy$ = new Subject<void>();

  constructor(private leaveService: LeaveService) {}

  ngOnInit(): void {
    this.loadData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadData(): void {
    this.isLoading = true;
    
    // Load leave types
    this.leaveService.getLeaveTypes().subscribe({
      next: (types) => {
        this.leaveTypes = types;
      },
      error: (error) => {
        console.error('Error loading leave types:', error);
      }
    });

    // Load leave applications
    this.loadLeaveApplications();
  }

  private loadLeaveApplications(): void {
    this.leaveService.getLeaveApplications().subscribe({
      next: (applications) => {
        this.leaveRequests = applications;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading leave applications:', error);
        this.isLoading = false;
        alert('Error loading leave applications. Please try again.');
      }
    });
  }

  filterRequests() {
    this.isLoading = true;
    let status: 'pending' | 'approved' | 'rejected' | undefined;
    
    if (this.filter.status === 'pending') status = 'pending';
    else if (this.filter.status === 'approved') status = 'approved';
    else if (this.filter.status === 'rejected') status = 'rejected';

    this.leaveService.getLeaveApplications(undefined, status).subscribe({
      next: (applications) => {
        // Apply additional filters locally
        this.leaveRequests = applications.filter(app => {
          const employeeMatch = !this.filter.employee || 
            app.employee?.firstName?.toLowerCase().includes(this.filter.employee.toLowerCase()) ||
            app.employee?.lastName?.toLowerCase().includes(this.filter.employee.toLowerCase()) ||
            app.employee?.employeeId?.toLowerCase().includes(this.filter.employee.toLowerCase());
          
          const departmentMatch = !this.filter.department || 
            app.employee?.department?.name?.toLowerCase().includes(this.filter.department.toLowerCase());
          
          return employeeMatch && departmentMatch;
        });
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error filtering leave applications:', error);
        this.isLoading = false;
        alert('Error filtering leave applications. Please try again.');
      }
    });
  }

  clearFilters() {
    this.filter = {};
    this.loadLeaveApplications();
  }

  approveRequest(request: LeaveApplication) {
    if (confirm(`Approve leave request for ${request.employee?.firstName} ${request.employee?.lastName}?`)) {
      this.leaveService.updateLeaveApplication(request.id, { status: 'approved' }).subscribe({
        next: (updatedApplication) => {
          // Update local state
          const index = this.leaveRequests.findIndex(r => r.id === request.id);
          if (index !== -1) {
            this.leaveRequests[index] = updatedApplication;
          }
          alert('Leave request approved successfully!');
        },
        error: (error) => {
          console.error('Error approving leave request:', error);
          alert('Failed to approve leave request. Please try again.');
        }
      });
    }
  }

  rejectRequest(request: LeaveApplication): void {
    if (confirm(`Are you sure you want to reject ${this.getEmployeeName(request)}'s leave request?`)) {
      this.isLoading = true;
      this.leaveService.updateLeaveApplication(request.id, { status: 'rejected' }).subscribe({
        next: (updatedRequest) => {
          console.log('Leave request rejected:', updatedRequest);
          // Update the local request
          const index = this.leaveRequests.findIndex(r => r.id === request.id);
          if (index !== -1) {
            this.leaveRequests[index] = updatedRequest;
          }
          this.isLoading = false;
          alert('Leave request rejected successfully!');
        },
        error: (error) => {
          console.error('Error rejecting leave request:', error);
          this.isLoading = false;
          alert('Failed to reject leave request. Please try again.');
        }
      });
    }
  }

  viewRequestDetails(request: LeaveApplication): void {
    // Set the selected request and show the modal
    this.selectedRequest = request;
    this.showDetailsModal = true;
  }

  closeDetailsModal(): void {
    this.showDetailsModal = false;
    this.selectedRequest = null;
  }

  // Safe method to handle modal actions
  handleModalAction(action: 'approve' | 'reject'): void {
    if (!this.selectedRequest) return;
    
    if (action === 'approve') {
      this.approveRequest(this.selectedRequest);
    } else if (action === 'reject') {
      this.rejectRequest(this.selectedRequest);
    }
    
    // Close modal after action
    this.closeDetailsModal();
  }

  // Helper method to calculate inclusive days
  calculateInclusiveDays(start: Date | string, end: Date | string): number {
    if (!start || !end) return 0;
    
    const startDate = start instanceof Date ? start : new Date(start);
    const endDate = end instanceof Date ? end : new Date(end);
    
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return 0;
    }
    
    const oneDay = 24 * 60 * 60 * 1000;
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / oneDay);
    return diffDays + 1; // +1 to include both start and end dates
  }

  getLeaveTypeName(leaveTypeId: number): string {
    const leaveType = this.leaveTypes.find(lt => lt.id === leaveTypeId);
    return leaveType ? leaveType.name : `Type ${leaveTypeId}`;
  }

  getEmployeeName(application: LeaveApplication): string {
    if (application.employee) {
      return `${application.employee.firstName} ${application.employee.lastName}`;
    }
    return 'Unknown Employee';
  }

  getEmployeeDepartment(application: LeaveApplication): string {
    return application.employee?.department?.name || 'No Department';
  }

  getEmployeeId(application: LeaveApplication): string {
    return application.employee?.employeeId || 'N/A';
  }

  // Breadcrumbs for header
  breadcrumbs: Breadcrumb[] = [
    { label: 'Home', url: '/home' },
    { label: 'Leave Management', url: '/leave-management' },
    { label: 'Leave Requests', active: true }
  ];
}
