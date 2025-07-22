import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SidebarComponent } from "../../../../shared/sidebar/sidebar.component";
import { HeaderComponent } from "../../../../shared/header/header.component";

export interface Deduction {
  id: string;
  name: string;
  type: 'recurring' | 'one-time';
  amount: number;
  description?: string;
}

export interface EmployeeDeductionAssignment {
  employeeId: string;
  deductionId: string;
  schedule: string; // e.g., 'monthly', 'once', or a date
  startDate?: Date;
  endDate?: Date;
}

@Component({
  selector: 'app-deductions',
  templateUrl: './deductions.component.html',
  styleUrl: './deductions.component.scss',
  imports: [CommonModule, SidebarComponent, HeaderComponent]
})
export class DeductionsComponent {
  deductions: Deduction[] = [];
  assignments: EmployeeDeductionAssignment[] = [];

  // UI state for tabs
  selectedTab: 'manage' | 'assign' = 'manage';

  // Methods for CRUD and assignment will be implemented next
}
