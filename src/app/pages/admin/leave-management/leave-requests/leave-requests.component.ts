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
  leaveRequests: LeaveRequest[] = [];
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
