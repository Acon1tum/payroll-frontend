import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SidebarComponent } from "../../../../shared/sidebar/sidebar.component";
import { HeaderComponent } from "../../../../shared/header/header.component";

export interface AccessLog {
  id: string;
  user: string;
  action: 'login' | 'logout' | 'data-access';
  ip: string;
  recordType?: string;
  recordId?: string;
  timestamp: Date;
  status?: 'success' | 'failed';
}

@Component({
  selector: 'app-access-logs',
  templateUrl: './access-logs.component.html',
  styleUrl: './access-logs.component.scss',
  imports: [CommonModule, FormsModule, SidebarComponent, HeaderComponent]
})
export class AccessLogsComponent {
  logs: AccessLog[] = [];
  filter: { user?: string; action?: string; ip?: string; date?: string } = {};

  filterLogs() {
    // Implement filtering logic here
  }
}
