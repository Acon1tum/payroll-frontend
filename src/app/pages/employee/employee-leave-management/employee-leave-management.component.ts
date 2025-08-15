import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { SidebarComponent } from '../../../shared/sidebar/sidebar.component';
import { HeaderComponent } from '../../../shared/header/header.component';
import { LeaveService, LeaveApplication, LeaveBalance, LeaveType, CreateLeaveApplicationRequest } from '../../../services/leave.service';
import { AuthService } from '../../../services/auth.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

interface Breadcrumb {
  label: string;
  url?: string;
  active?: boolean;
}

@Component({
  selector: 'app-employee-leave-management',
  imports: [CommonModule, ReactiveFormsModule, SidebarComponent, HeaderComponent],
  templateUrl: './employee-leave-management.component.html',
  styleUrl: './employee-leave-management.component.scss',
  standalone: true
})
export class EmployeeLeaveManagementComponent implements OnInit, OnDestroy {
  // Balances
  leaveBalances: LeaveBalance[] = [];
  leaveTypes: LeaveType[] = [];

  // Requests (current + pending)
  leaveRequests: LeaveApplication[] = [];

  // History (previous leaves)
  leaveHistory: LeaveApplication[] = [];

  // Apply form state
  showApplyModal = false;
  applyForm: FormGroup;
  selectedFiles: File[] = [];
  isLoading = false;

  private destroy$ = new Subject<void>();
  private currentUserId: string = '';

  constructor(
    private formBuilder: FormBuilder,
    private leaveService: LeaveService,
    private authService: AuthService
  ) {
    this.applyForm = this.formBuilder.group({
      leaveTypeId: ['', Validators.required],
      startDate: [null, Validators.required],
      endDate: [null, Validators.required],
      reason: ['', [Validators.required, Validators.maxLength(500)]],
      docUrl: ['']
    });
  }

  ngOnInit(): void {
    // Get the employee ID from the current user's employee object
    const currentUser = this.authService.currentUser;
    console.log('Current user data:', currentUser);
    
    if (currentUser?.employee?.id) {
      this.currentUserId = currentUser.employee.id;
      console.log('Employee ID found:', this.currentUserId);
    } else {
      console.error('No employee ID found for current user');
      console.log('User object:', currentUser);
      console.log('User employee property:', currentUser?.employee);
      this.currentUserId = '';
    }
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
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading leave types:', error);
        this.isLoading = false;
      }
    });

    // Load leave balances for current user
    this.leaveService.getLeaveBalances(undefined, this.currentUserId).subscribe({
      next: (balances) => {
        this.leaveBalances = balances;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading leave balances:', error);
        this.isLoading = false;
      }
    });

    // Load leave applications for current user
    this.leaveService.getLeaveApplications(this.currentUserId).subscribe({
      next: (applications) => {
        // Convert date strings to Date objects
        this.leaveRequests = applications
          .filter(app => app.status === 'pending' || app.status === 'approved')
          .map(app => this.convertDatesInApplication(app));
        
        this.leaveHistory = applications
          .filter(app => app.status === 'approved' || app.status === 'rejected')
          .map(app => this.convertDatesInApplication(app));
        
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading leave applications:', error);
        this.isLoading = false;
      }
    });
  }

  // Convert date strings from backend to Date objects
  private convertDatesInApplication(app: any): any {
    return {
      ...app,
      startDate: app.startDate ? new Date(app.startDate) : null,
      endDate: app.endDate ? new Date(app.endDate) : null,
      createdAt: app.createdAt ? new Date(app.createdAt) : null
    };
  }

  // Breadcrumbs for header
  breadcrumbs: Breadcrumb[] = [
    { label: 'Home', url: '/home' },
    { label: 'Leave Management', active: true }
  ];

  openApplyModal(): void {
    this.showApplyModal = true;
    this.applyForm.reset({ 
      leaveTypeId: '', 
      startDate: null, 
      endDate: null, 
      reason: '', 
      docUrl: '' 
    });
    this.selectedFiles = [];
  }

  closeApplyModal(): void {
    this.showApplyModal = false;
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFiles = Array.from(input.files);
      // In a real implementation, you would upload the file and get a URL
      // For now, we'll just store the file name
      const fileNames = this.selectedFiles.map(f => f.name).join(', ');
      this.applyForm.patchValue({ docUrl: fileNames });
    }
  }

  getSelectedFileNames(): string {
    return this.selectedFiles.map(file => file.name).join(', ');
  }

  submitApplication(): void {
    if (this.applyForm.invalid) {
      this.applyForm.markAllAsTouched();
      return;
    }

    // Check if we have a valid employee ID
    if (!this.currentUserId) {
      console.error('No employee ID found. Current user:', this.authService.currentUser);
      alert('Error: No employee ID found. Please contact your administrator.');
      return;
    }

    const formData = this.applyForm.value;
    const startDate = new Date(formData.startDate);
    const endDate = new Date(formData.endDate);
    const requestedDays = this.calculateInclusiveDays(startDate, endDate);
    const leaveTypeId = formData.leaveTypeId;

    // Check leave balance before submission
    const balanceCheck = this.checkLeaveBalance(leaveTypeId, requestedDays);
    if (!balanceCheck.canSubmit) {
      alert(`Cannot submit leave request: ${balanceCheck.message}`);
      return;
    }

    const application: CreateLeaveApplicationRequest = {
      employeeId: this.currentUserId,
      leaveTypeId: leaveTypeId,
      startDate: startDate,
      endDate: endDate,
      reason: formData.reason,
      docUrl: formData.docUrl || undefined
    };

    console.log('Submitting leave application:', application);
    console.log('Current user ID:', this.currentUserId);
    console.log('Current user data:', this.authService.currentUser);
    console.log('Requested days:', requestedDays);
    console.log('Balance check:', balanceCheck);

    this.isLoading = true;
    this.leaveService.createLeaveApplication(application).subscribe({
      next: (newApplication) => {
        console.log('Leave application created successfully:', newApplication);
        this.leaveRequests = [newApplication, ...this.leaveRequests];
        this.closeApplyModal();
        this.isLoading = false;
        alert('Leave application submitted successfully!');
        
        // Reload data to update balances
        this.loadData();
      },
      error: (error) => {
        console.error('Error submitting leave application:', error);
        console.error('Error details:', error.error);
        this.isLoading = false;
        
        let errorMessage = 'Failed to submit leave application. Please try again.';
        if (error.error?.message) {
          errorMessage = error.error.message;
        }
        alert(errorMessage);
      }
    });
  }

  // Check if user has sufficient leave balance
  checkLeaveBalance(leaveTypeId: number, requestedDays: number): { canSubmit: boolean; message: string; remainingDays: number; requestedDays: number } {
    const balance = this.leaveBalances.find(b => b.leaveTypeId === leaveTypeId);
    
    if (!balance) {
      return {
        canSubmit: false,
        message: 'No leave balance found for this leave type. Please contact HR.',
        remainingDays: 0,
        requestedDays: requestedDays
      };
    }

    const remainingDays = Number(balance.remaining);
    
    if (remainingDays <= 0) {
      return {
        canSubmit: false,
        message: `No remaining leave balance for ${this.getLeaveTypeName(leaveTypeId)}. Current balance: 0 days.`,
        remainingDays: remainingDays,
        requestedDays: requestedDays
      };
    }

    if (requestedDays > remainingDays) {
      return {
        canSubmit: false,
        message: `Insufficient leave balance. Requested: ${requestedDays} days, Available: ${remainingDays} days.`,
        remainingDays: remainingDays,
        requestedDays: requestedDays
      };
    }

    return {
      canSubmit: true,
      message: `Leave request valid. Available balance: ${remainingDays} days.`,
      remainingDays: remainingDays,
      requestedDays: requestedDays
    };
  }

  // Helper methods for template
  canSubmitLeaveRequest(leaveTypeId: number, requestedDays: number): boolean {
    if (!leaveTypeId || !requestedDays) return false;
    return this.checkLeaveBalance(leaveTypeId, requestedDays).canSubmit;
  }

  getBalanceStatusClass(leaveTypeId: number, requestedDays: number): string {
    if (!leaveTypeId || !requestedDays) return 'text-gray-600';
    
    const balanceCheck = this.checkLeaveBalance(leaveTypeId, requestedDays);
    if (balanceCheck.canSubmit) {
      return 'text-green-600 font-semibold';
    } else {
      return 'text-red-600 font-semibold';
    }
  }

  getBalanceStatusText(leaveTypeId: number, requestedDays: number): string {
    if (!leaveTypeId || !requestedDays) return 'Select dates to check';
    
    const balanceCheck = this.checkLeaveBalance(leaveTypeId, requestedDays);
    if (balanceCheck.canSubmit) {
      return 'Available';
    } else {
      return 'Insufficient';
    }
  }

  getBalanceErrorMessage(leaveTypeId: number, requestedDays: number): string {
    if (!leaveTypeId || !requestedDays) return '';
    
    const balanceCheck = this.checkLeaveBalance(leaveTypeId, requestedDays);
    return balanceCheck.message;
  }

  // Balance display styling methods
  getBalanceDisplayClass(remaining: number): string {
    const remainingNum = Number(remaining);
    if (remainingNum <= 0) return 'text-red-600 font-semibold';
    if (remainingNum <= 3) return 'text-orange-600 font-semibold';
    if (remainingNum <= 7) return 'text-yellow-600 font-semibold';
    return 'text-green-600 font-semibold';
  }

  getBalanceStatusBadgeClass(remaining: number): string {
    const remainingNum = Number(remaining);
    if (remainingNum <= 0) return 'bg-red-100 text-red-800';
    if (remainingNum <= 3) return 'bg-orange-100 text-orange-800';
    if (remainingNum <= 7) return 'bg-yellow-100 text-yellow-800';
    return 'bg-green-100 text-green-800';
  }

  getBalanceStatusBadgeText(remaining: number): string {
    const remainingNum = Number(remaining);
    if (remainingNum <= 0) return 'Exhausted';
    if (remainingNum <= 3) return 'Low';
    if (remainingNum <= 7) return 'Moderate';
    return 'Good';
  }

  // Summary statistics methods
  getTotalLeaveDays(): number {
    return this.leaveTypes.reduce((total, type) => total + type.maxDaysPerYear, 0);
  }

  getTotalAvailableDays(): number {
    return this.leaveBalances.reduce((total, balance) => total + Number(balance.remaining), 0);
  }

  getTotalUsedDays(): number {
    return this.getTotalLeaveDays() - this.getTotalAvailableDays();
  }

  getPendingRequestsCount(): number {
    return this.leaveRequests.filter(request => request.status === 'pending').length;
  }

  // Check if user can apply for a specific leave type
  canApplyForLeaveType(leaveTypeId: number): boolean {
    const balance = this.leaveBalances.find(b => b.leaveTypeId === leaveTypeId);
    if (!balance) return false;
    return Number(balance.remaining) > 0;
  }

  // Get leave type options with balance status
  getLeaveTypeOptions(): Array<{type: LeaveType, canApply: boolean, remainingDays: number}> {
    return this.leaveTypes.map(type => ({
      type,
      canApply: this.canApplyForLeaveType(type.id),
      remainingDays: this.getRemainingDays(type.id)
    }));
  }

  cancelRequest(requestId: string): void {
    if (confirm('Are you sure you want to cancel this leave request?')) {
      // In a real implementation, you would call an API to cancel the request
      // For now, we'll just remove it from the local array
      this.leaveRequests = this.leaveRequests.filter(r => r.id !== requestId);
      alert('Leave request cancelled successfully!');
    }
  }

  getLeaveTypeName(leaveTypeId: number): string {
    const leaveType = this.leaveTypes.find(lt => lt.id === leaveTypeId);
    return leaveType ? leaveType.name : `Type ${leaveTypeId}`;
  }

  getLeaveTypeById(leaveTypeId: number): LeaveType | undefined {
    return this.leaveTypes.find(lt => lt.id === leaveTypeId);
  }

  calculateInclusiveDays(start: Date | string, end: Date | string): number {
    // Convert strings to Date objects if needed
    const startDate = start instanceof Date ? start : new Date(start);
    const endDate = end instanceof Date ? end : new Date(end);
    
    // Validate dates
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      console.error('Invalid date format:', { start, end, startDate, endDate });
      return 0;
    }
    
    const oneDay = 24 * 60 * 60 * 1000; // hours*minutes*seconds*milliseconds
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / oneDay);
    return diffDays + 1; // +1 to include both start and end dates
  }

  formatDate(date: Date | string): string {
    if (!date) return 'N/A';
    
    try {
      const dateObj = date instanceof Date ? date : new Date(date);
      if (isNaN(dateObj.getTime())) {
        console.error('Invalid date for formatting:', date);
        return 'Invalid Date';
      }
      return dateObj.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      console.error('Error formatting date:', error, date);
      return 'Invalid Date';
    }
  }

  statusBadgeClass(status: string): string {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-700';
      case 'rejected':
        return 'bg-red-100 text-red-700';
      case 'cancelled':
        return 'bg-gray-100 text-gray-700';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  }

  getRemainingDays(leaveTypeId: number): number {
    const balance = this.leaveBalances.find(b => b.leaveTypeId === leaveTypeId);
    return balance ? Number(balance.remaining) : 0;
  }

  getMaxDays(leaveTypeId: number): number {
    const leaveType = this.getLeaveTypeById(leaveTypeId);
    return leaveType ? leaveType.maxDaysPerYear : 0;
  }

  getUsedDays(leaveTypeId: number): number {
    const maxDays = this.getMaxDays(leaveTypeId);
    const remainingDays = this.getRemainingDays(leaveTypeId);
    return Math.max(0, maxDays - remainingDays);
  }
}
