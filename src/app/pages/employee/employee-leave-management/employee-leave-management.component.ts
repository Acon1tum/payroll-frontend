import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { SidebarComponent } from '../../../shared/sidebar/sidebar.component';
import { HeaderComponent } from '../../../shared/header/header.component';
import { LeaveManagementService, LeaveBalance, LeaveApplication, LeaveType, ApplyLeaveRequest } from '../../../services/leave-management.service';

interface Breadcrumb {
  label: string;
  path?: string;
  active?: boolean;
}

@Component({
  selector: 'app-employee-leave-management',
  imports: [CommonModule, ReactiveFormsModule, SidebarComponent, HeaderComponent],
  templateUrl: './employee-leave-management.component.html',
  styleUrl: './employee-leave-management.component.scss'
})
export class EmployeeLeaveManagementComponent implements OnInit {
  // Balances
  leaveBalances: LeaveBalance[] = [];

  // Breadcrumbs for header
  breadcrumbs: Breadcrumb[] = [
    { label: 'Dashboard', path: '/employee-dashboard' },
    { label: 'Leave Management', active: true }
  ];

  // Requests (current + pending)
  leaveRequests: LeaveApplication[] = [];

  // All applications for current year (to check overlaps)
  allApplications: LeaveApplication[] = [];

  // History (previous leaves)
  leaveHistory: LeaveApplication[] = [];

  // Leave types for dropdown
  leaveTypes: LeaveType[] = [];

  // Apply form state
  showApplyModal = false;
  applyForm: FormGroup;
  selectedFiles: File[] = [];

  // Success animation state
  showSuccessAnimation = false;
  successMessage = '';
  isLoading = false;

  constructor(
    private formBuilder: FormBuilder,
    private leaveManagementService: LeaveManagementService
  ) {
    this.applyForm = this.formBuilder.group({
      leaveTypeId: [null, Validators.required],
      startDate: [null, Validators.required],
      endDate: [null, Validators.required],
      reason: ['', [Validators.required, Validators.maxLength(500)]],
      attachments: [[]],
    });
  }

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.isLoading = true;
    
    // Load leave balances
    this.leaveManagementService.getLeaveBalances().subscribe({
      next: (response) => {
        this.leaveBalances = response.data;
      },
      error: (error) => {
        console.error('Error loading leave balances:', error);
      }
    });

    // Load leave requests
    this.leaveManagementService.getLeaveRequests().subscribe({
      next: (response) => {
        this.leaveRequests = response.data;
      },
      error: (error) => {
        console.error('Error loading leave requests:', error);
      }
    });

    // Load all leave applications for current year
    this.leaveManagementService.getAllLeaveApplications().subscribe({
      next: (response) => {
        this.allApplications = response.data;
      },
      error: (error) => {
        console.error('Error loading all leave applications:', error);
      }
    });

    // Load leave history
    this.leaveManagementService.getLeaveHistory().subscribe({
      next: (response) => {
        this.leaveHistory = response.data;
      },
      error: (error) => {
        console.error('Error loading leave history:', error);
      }
    });

    // Load leave types
    this.leaveManagementService.getLeaveTypes().subscribe({
      next: (response) => {
        this.leaveTypes = response.data;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading leave types:', error);
        this.isLoading = false;
      }
    });
  }

  openApplyModal(): void {
    this.showApplyModal = true;
    this.applyForm.reset();
    this.selectedFiles = [];
  }

  closeApplyModal(): void {
    this.showApplyModal = false;
  }

  showSuccessNotification(message: string): void {
    this.successMessage = message;
    this.showSuccessAnimation = true;
    
    // Auto-hide after 3 seconds
    setTimeout(() => {
      this.hideSuccessNotification();
    }, 3000);
  }

  hideSuccessNotification(): void {
    // Add slide-out animation before hiding
    const notification = document.querySelector('.animate-slide-in');
    if (notification) {
      notification.classList.remove('animate-slide-in');
      notification.classList.add('animate-slide-out');
      
      // Wait for animation to complete before hiding
      setTimeout(() => {
        this.showSuccessAnimation = false;
        this.successMessage = '';
      }, 500);
    } else {
      this.showSuccessAnimation = false;
      this.successMessage = '';
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFiles = Array.from(input.files);
      const fileNames = this.selectedFiles.map(f => f.name);
      this.applyForm.patchValue({ attachments: fileNames });
    }
  }

  getSelectedFileNames(): string {
    return this.selectedFiles.map(file => file.name).join(', ');
  }

  submitApplication(): void {
    if (this.applyForm.invalid) {
      this.applyForm.markAllAsTouched();
      console.log('Form is invalid:', this.applyForm.errors);
      return;
    }

    const formValue = this.applyForm.value;
    console.log('Form values:', formValue);
    
    const request: ApplyLeaveRequest = {
      leaveTypeId: formValue.leaveTypeId,
      startDate: formValue.startDate,
      endDate: formValue.endDate,
      reason: formValue.reason,
      attachments: formValue.attachments || []
    };
    
    console.log('Request being sent:', request);

    // Check for overlapping dates before submitting
    const overlappingApp = this.checkForOverlappingDates(formValue.startDate, formValue.endDate);
    if (overlappingApp) {
      const overlappingStart = new Date(overlappingApp.startDate).toLocaleDateString();
      const overlappingEnd = new Date(overlappingApp.endDate).toLocaleDateString();
      alert(`You have an overlapping leave application: ${overlappingApp.leaveType.name} from ${overlappingStart} to ${overlappingEnd} (Status: ${overlappingApp.status})`);
      return;
    }

    this.isLoading = true;
    this.leaveManagementService.applyForLeave(request).subscribe({
      next: (response) => {
        console.log('Success response:', response);
        // Add the new request to the list
        this.leaveRequests = [response.data, ...this.leaveRequests];
        this.allApplications = [response.data, ...this.allApplications];
        this.closeApplyModal();
        this.isLoading = false;
        
        // Show success animation
        this.showSuccessNotification('Leave application submitted successfully!');
      },
      error: (error) => {
        console.error('Error submitting leave application:', error);
        console.error('Error details:', error.error);
        
        // Show specific error message to user
        let errorMessage = 'Failed to submit leave application';
        if (error.error && error.error.error) {
          errorMessage = error.error.error;
        }
        
        // You can add a toast notification or alert here
        alert(errorMessage);
        
        this.isLoading = false;
      }
    });
  }

  cancelRequest(leaveId: string): void {
    this.leaveManagementService.cancelLeaveRequest(leaveId).subscribe({
      next: (response) => {
        // Update the request in both lists
        this.leaveRequests = this.leaveRequests.map(r => 
          r.id === leaveId ? response.data : r
        );
        this.allApplications = this.allApplications.map(r => 
          r.id === leaveId ? response.data : r
        );
        
        // Show success animation
        this.showSuccessNotification('Leave request cancelled successfully!');
      },
      error: (error) => {
        console.error('Error cancelling leave request:', error);
        alert('Failed to cancel leave request');
      }
    });
  }

  formatDate(date?: Date | string | null): string {
    if (!date) return '';
    const d = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat('en-PH', { year: 'numeric', month: 'short', day: 'numeric' }).format(d);
  }

  formatDateNumbers(date?: Date | string | null): string {
    if (!date) return '';
    const d = typeof date === 'string' ? new Date(date) : date;
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');
    const year = d.getFullYear();
    return `${month}/${day}/${year}`;
  }

  statusBadgeClass(status: string): string {
    return this.leaveManagementService.getStatusBadgeClass(status);
  }

  // Helper method to get leave type name by ID
  getLeaveTypeName(leaveTypeId: number): string {
    const leaveType = this.leaveTypes.find(lt => lt.id === leaveTypeId);
    return leaveType ? leaveType.name : 'Unknown';
  }

  // Helper method to check for overlapping dates
  checkForOverlappingDates(startDate: string, endDate: string): LeaveApplication | null {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    return this.allApplications.find(app => {
      if (app.status === 'cancelled' || app.status === 'rejected') {
        return false; // Skip cancelled/rejected applications
      }
      
      const appStart = new Date(app.startDate);
      const appEnd = new Date(app.endDate);
      
      // Check for overlap
      return (start <= appEnd && end >= appStart);
    }) || null;
  }

  // Helper method to calculate days
  calculateDays(startDate: string, endDate: string): number {
    return this.leaveManagementService.calculateDays(startDate, endDate);
  }
}
