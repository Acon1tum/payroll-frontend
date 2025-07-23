import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SidebarComponent } from "../../../../shared/sidebar/sidebar.component";
import { HeaderComponent } from "../../../../shared/header/header.component";

@Component({
  selector: 'app-govt-reports',
  templateUrl: './govt-reports.component.html',
  styleUrl: './govt-reports.component.scss',
  imports: [CommonModule, FormsModule, SidebarComponent, HeaderComponent]
})
export class GovtReportsComponent {
  selectedReport: 'bir2316' | 'sssR3' | 'sssR5' | 'rf1' | 'm11' = 'bir2316';
  period: string = '';

  exportReport() {
    // Implement export logic here
  }
}
