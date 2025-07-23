import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SidebarComponent } from "../../../../shared/sidebar/sidebar.component";
import { HeaderComponent } from "../../../../shared/header/header.component";

export interface LeaveType {
  id: string;
  name: string;
  description?: string;
  isPaid: boolean;
}

export interface LeaveCreditSetting {
  leaveTypeId: string;
  employmentType: string; // e.g., 'Regular', 'Probationary', 'Contractual'
  annualCap: number;
  monthlyCap: number;
}

@Component({
  selector: 'app-leave-settings',
  templateUrl: './leave-settings.component.html',
  styleUrl: './leave-settings.component.scss',
  imports: [CommonModule, SidebarComponent, HeaderComponent]
})
export class LeaveSettingsComponent {
  leaveTypes: LeaveType[] = [];
  creditSettings: LeaveCreditSetting[] = [];
  selectedTab: 'types' | 'credits' = 'types';

  // UI state for tabs or forms can be added here

  // Methods for CRUD and settings will be implemented next
}
