import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { SidebarComponent } from '../../../shared/sidebar/sidebar.component';
import { HeaderComponent } from '../../../shared/header/header.component';

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
export class EmployeeLeaveManagementComponent {
  // Balances
  leaveBalances: { type: string; remaining: number; used: number; total: number }[] = [
    { type: 'Vacation Leave', remaining: 12, used: 3, total: 15 },
    { type: 'Sick Leave', remaining: 8, used: 2, total: 10 },
  ];

  // Breadcrumbs for header
  breadcrumbs: Breadcrumb[] = [
    { label: 'Dashboard', path: '/employee-dashboard' },
    { label: 'Leave Management', active: true }
  ];

  // Requests (current + pending)
  leaveRequests: Array<{
    id: number;
    type: string;
    startDate: Date;
    endDate: Date;
    days: number;
    reason: string;
    status: 'Pending' | 'Approved' | 'Rejected' | 'Cancelled';
    attachments?: string[];
  }> = [
    {
      id: 101,
      type: 'Vacation Leave',
      startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 14),
      endDate: new Date(new Date().getFullYear(), new Date().getMonth(), 16),
      days: 3,
      reason: 'Family trip',
      status: 'Pending',
      attachments: ['itinerary.pdf']
    },
    {
      id: 102,
      type: 'Sick Leave',
      startDate: new Date(new Date().getFullYear(), new Date().getMonth() - 1, 3),
      endDate: new Date(new Date().getFullYear(), new Date().getMonth() - 1, 4),
      days: 2,
      reason: 'Flu',
      status: 'Approved',
      attachments: ['medical-certificate.jpg']
    }
  ];

  // History (previous leaves)
  leaveHistory: Array<{
    id: number;
    type: string;
    startDate: Date;
    endDate: Date;
    days: number;
    status: 'Approved' | 'Rejected';
  }> = [
    { id: 80, type: 'Vacation Leave', startDate: new Date(new Date().getFullYear(), 4, 2), endDate: new Date(new Date().getFullYear(), 4, 5), days: 4, status: 'Approved' },
    { id: 81, type: 'Sick Leave', startDate: new Date(new Date().getFullYear(), 1, 20), endDate: new Date(new Date().getFullYear(), 1, 20), days: 1, status: 'Approved' },
  ];

  // Apply form state
  showApplyModal = false;
  applyForm: FormGroup;
  selectedFiles: File[] = [];

  constructor(private formBuilder: FormBuilder) {
    this.applyForm = this.formBuilder.group({
      type: ['Vacation Leave', Validators.required],
      startDate: [null, Validators.required],
      endDate: [null, Validators.required],
      reason: ['', [Validators.required, Validators.maxLength(500)]],
      attachments: [[]],
    });
  }

  openApplyModal(): void {
    this.showApplyModal = true;
    this.applyForm.reset({ type: 'Vacation Leave', startDate: null, endDate: null, reason: '', attachments: [] });
    this.selectedFiles = [];
  }

  closeApplyModal(): void {
    this.showApplyModal = false;
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
      return;
    }
    const { type, startDate, endDate, reason, attachments } = this.applyForm.value;
    const days = this.calculateInclusiveDays(new Date(startDate), new Date(endDate));
    const newRequest = {
      id: this.generateId(),
      type,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      days,
      reason,
      status: 'Pending' as const,
      attachments: (attachments as string[]) || []
    };
    this.leaveRequests = [newRequest, ...this.leaveRequests];
    this.closeApplyModal();
  }

  cancelRequest(requestId: number): void {
    this.leaveRequests = this.leaveRequests.map(r => r.id === requestId && r.status === 'Pending' ? { ...r, status: 'Cancelled' } : r);
  }

  private calculateInclusiveDays(start: Date, end: Date): number {
    const oneDayMs = 24 * 60 * 60 * 1000;
    const diff = Math.floor((end.getTime() - start.getTime()) / oneDayMs) + 1;
    return Math.max(diff, 0);
  }

  formatDate(date?: Date | string | null): string {
    if (!date) return '';
    const d = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat('en-PH', { year: 'numeric', month: 'short', day: 'numeric' }).format(d);
  }

  statusBadgeClass(status: string): string {
    switch (status) {
      case 'Approved':
        return 'bg-green-100 text-green-700';
      case 'Rejected':
        return 'bg-red-100 text-red-700';
      case 'Cancelled':
        return 'bg-gray-100 text-gray-700';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  }

  private generateId(): number {
    return Math.floor(Math.random() * 100000) + 100;
  }
}
