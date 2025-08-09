import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SidebarComponent } from "../../../../shared/sidebar/sidebar.component";
import { HeaderComponent } from "../../../../shared/header/header.component";

export interface LeaveRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  leaveType: string;
  startDate: Date;
  endDate: Date;
  status: 'pending' | 'approved' | 'rejected';
  reason: string;
  documentUrl?: string;
  appliedAt: Date;
}

@Component({
  selector: 'app-leave-requests',
  templateUrl: './leave-requests.component.html',
  styleUrl: './leave-requests.component.scss',
  imports: [CommonModule, FormsModule, SidebarComponent, HeaderComponent]
})
export class LeaveRequestsComponent {
  leaveRequests: LeaveRequest[] = [
    {
      id: 'LR-2025-001',
      employeeId: 'EMP-1001',
      employeeName: 'Juan Dela Cruz',
      department: 'Engineering',
      leaveType: 'Vacation Leave',
      startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 22),
      endDate: new Date(new Date().getFullYear(), new Date().getMonth(), 24),
      status: 'pending',
      reason: 'Family trip',
      appliedAt: new Date(),
      documentUrl: ''
    },
    {
      id: 'LR-2025-002',
      employeeId: 'EMP-1002',
      employeeName: 'Maria Santos',
      department: 'HR',
      leaveType: 'Sick Leave',
      startDate: new Date(new Date().getFullYear(), new Date().getMonth() - 1, 3),
      endDate: new Date(new Date().getFullYear(), new Date().getMonth() - 1, 3),
      status: 'approved',
      reason: 'Flu',
      appliedAt: new Date(Date.now() - 1000*60*60*24*40),
      documentUrl: 'https://example.com/medical-cert.jpg'
    },
    {
      id: 'LR-2025-003',
      employeeId: 'EMP-1003',
      employeeName: 'Pedro Ramirez',
      department: 'Finance',
      leaveType: 'Emergency Leave',
      startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 10),
      endDate: new Date(new Date().getFullYear(), new Date().getMonth(), 11),
      status: 'rejected',
      reason: 'Personal matter',
      appliedAt: new Date(Date.now() - 1000*60*60*24*10)
    }
  ];
  filter: { employee?: string; department?: string } = {};

  // UI state for tabs or filters can be added here

  filterRequests() {
    // Implement filtering logic here
    // This is a placeholder for demonstration
    // You may want to filter leaveRequests based on this.filter
  }

  approveRequest(request: LeaveRequest) {
    // Implement approval logic here
    // This is a placeholder for demonstration
    request.status = 'approved';
  }

  rejectRequest(request: LeaveRequest) {
    // Implement rejection logic here
    // This is a placeholder for demonstration
    request.status = 'rejected';
  }
}
