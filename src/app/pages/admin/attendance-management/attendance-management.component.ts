import { Component } from '@angular/core';
import { SidebarComponent } from "../../../shared/sidebar/sidebar.component";
import { HeaderComponent } from "../../../shared/header/header.component";


interface Breadcrumb {
  label: string;
  path?: string;
  active?: boolean;
}

@Component({
  selector: 'app-attendance-management',
  imports: [SidebarComponent, HeaderComponent],
  templateUrl: './attendance-management.component.html',
  styleUrl: './attendance-management.component.scss'
})


export class AttendanceManagementComponent {
  breadcrumbs: Breadcrumb[] = [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Attendance Management', path: '/attendance-management', active: true }
  ];
}
