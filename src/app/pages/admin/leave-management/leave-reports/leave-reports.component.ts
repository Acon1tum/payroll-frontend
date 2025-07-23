import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SidebarComponent } from "../../../../shared/sidebar/sidebar.component";
import { HeaderComponent } from "../../../../shared/header/header.component";

export interface LeaveReport {
  employeeId: string;
  employeeName: string;
  department: string;
  leaveType: string;
  totalUsed: number;
  remaining: number;
  period: string; // e.g., '2024', '2024-07'
}

@Component({
  selector: 'app-leave-reports',
  templateUrl: './leave-reports.component.html',
  styleUrl: './leave-reports.component.scss',
  imports: [CommonModule, FormsModule, SidebarComponent, HeaderComponent]
})
export class LeaveReportsComponent {
  reports: LeaveReport[] = [];
  filter: { employee?: string; department?: string; leaveType?: string; period?: string } = {};

  filterReports() {
    // Implement filtering logic here
  }

  exportReports() {
    // Implement export logic here
  }
}
