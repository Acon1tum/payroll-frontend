import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from '../../../../shared/header/header.component';
import { SidebarComponent } from '../../../../shared/sidebar/sidebar.component';


// Models for brackets
export interface SSSBracket {
  rangeFrom: number;
  rangeTo: number;
  employeeShare: number;
  employerShare: number;
}
export interface PhilHealthBracket {
  rangeFrom: number;
  rangeTo: number;
  employeeShare: number;
  employerShare: number;
}
export interface PagIBIGBracket {
  rangeFrom: number;
  rangeTo: number;
  employeeShare: number;
  employerShare: number;
}
export interface BIRBracket {
  rangeFrom: number;
  rangeTo: number;
  taxRate: number;
  baseTax: number;
}

// Contribution history model
export interface ContributionHistory {
  employeeId: string;
  employeeName: string;
  month: string;
  sss: number;
  philhealth: number;
  pagibig: number;
  bir: number;
}

@Component({
  selector: 'app-mandatory-contributions',
  imports: [CommonModule, SidebarComponent, HeaderComponent],
  templateUrl: './mandatory-contributions.component.html',
  styleUrl: './mandatory-contributions.component.scss'
})
export class MandatoryContributionsComponent {
  // Bracket tables
  sssBrackets: SSSBracket[] = [];
  philHealthBrackets: PhilHealthBracket[] = [];
  pagibigBrackets: PagIBIGBracket[] = [];
  birBrackets: BIRBracket[] = [];

  // Contribution history
  contributionHistory: ContributionHistory[] = [];

  // UI state
  selectedTab: 'brackets' | 'history' | 'export' = 'brackets';

  // Methods for CRUD and export will be implemented next
}
