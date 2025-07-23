import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SidebarComponent } from "../../../../shared/sidebar/sidebar.component";
import { HeaderComponent } from "../../../../shared/header/header.component";

export interface ActivityLog {
  id: string;
  user: string;
  module: string;
  action: string;
  details: string;
  date: Date;
}

@Component({
  selector: 'app-activity-logs',
  templateUrl: './activity-logs.component.html',
  styleUrl: './activity-logs.component.scss',
  imports: [CommonModule, FormsModule, SidebarComponent, HeaderComponent]
})
export class ActivityLogsComponent {
  logs: ActivityLog[] = [];
  filter: { user?: string; module?: string; date?: string } = {};

  filterLogs() {
    // Implement filtering logic here
  }
}
