import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SidebarComponent } from "../../../../shared/sidebar/sidebar.component";
import { HeaderComponent } from "../../../../shared/header/header.component";

export interface LlcSummary {
  employeeId: string;
  employeeName: string;
  period: string; // e.g., '2024-07', '2024'
  totalLoans: number;
  totalLeaves: number;
  totalContributions: number;
}

@Component({
  selector: 'app-llc-summary',
  templateUrl: './llc-summary.component.html',
  styleUrl: './llc-summary.component.scss',
  imports: [CommonModule, FormsModule, SidebarComponent, HeaderComponent]
})
export class LlcSummaryComponent {
  summaries: LlcSummary[] = [];
  filter: { employee?: string; period?: string } = {};

  filterSummaries() {
    // Implement filtering logic here
  }

  exportSummaries() {
    // Implement export logic here
  }
}
