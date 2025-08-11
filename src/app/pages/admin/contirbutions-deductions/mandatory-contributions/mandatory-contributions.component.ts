import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HeaderComponent } from '../../../../shared/header/header.component';
import { SidebarComponent } from '../../../../shared/sidebar/sidebar.component';
import { DummyDataService } from '../../../../services/dummy-data.service';


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

interface Breadcrumb {
  label: string;
  path?: string;
  active?: boolean;
}

@Component({
  selector: 'app-mandatory-contributions',
  imports: [CommonModule, FormsModule, SidebarComponent, HeaderComponent],
  templateUrl: './mandatory-contributions.component.html',
  styleUrl: './mandatory-contributions.component.scss'
})
export class MandatoryContributionsComponent implements OnInit {
  // Bracket tables
  sssBrackets: SSSBracket[] = [];
  philHealthBrackets: PhilHealthBracket[] = [];
  pagibigBrackets: PagIBIGBracket[] = [];
  birBrackets: BIRBracket[] = [];

  // Breadcrumbs for header
  breadcrumbs: Breadcrumb[] = [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Contributions & Deductions', path: '/admin/contributions-deductions' },
    { label: 'Mandatory Contributions', active: true }
  ];

  // Contribution history
  contributionHistory: ContributionHistory[] = [];

  // UI state
  selectedTab: 'brackets' | 'history' | 'export' = 'brackets';

  // Methods for CRUD and export will be implemented next

  constructor(private dummy: DummyDataService) {}

  ngOnInit(): void {
    // Load dummy data for display
    this.sssBrackets = this.dummy.getSSSBrackets();
    this.philHealthBrackets = this.dummy.getPhilHealthBrackets();
    this.pagibigBrackets = this.dummy.getPagibigBrackets();
    this.birBrackets = this.dummy.getBIRBrackets();
    this.contributionHistory = this.dummy.getContributionHistory();
  }

  // --- Modal state for bracket CRUD ---
  showBracketModal = false;
  bracketFormType: 'SSS' | 'PhilHealth' | 'Pag-IBIG' | 'BIR' = 'SSS';
  bracketEditIndex: number | null = null;
  bracketForm: {
    rangeFrom: number | null;
    rangeTo: number | null;
    employeeShare: number | null;
    employerShare: number | null;
    taxRate: number | null;
    baseTax: number | null;
  } = { rangeFrom: null, rangeTo: null, employeeShare: null, employerShare: null, taxRate: null, baseTax: null };

  openAddBracket(type: 'SSS' | 'PhilHealth' | 'Pag-IBIG' | 'BIR'): void {
    this.bracketFormType = type;
    this.bracketEditIndex = null;
    this.resetBracketForm();
    this.showBracketModal = true;
  }

  openEditBracket(type: 'SSS' | 'PhilHealth' | 'Pag-IBIG' | 'BIR', index: number): void {
    this.bracketFormType = type;
    this.bracketEditIndex = index;
    this.resetBracketForm();
    const src = this.getBracketArray(type)[index] as any;
    this.bracketForm.rangeFrom = src.rangeFrom;
    this.bracketForm.rangeTo = src.rangeTo;
    if (type === 'BIR') {
      this.bracketForm.taxRate = src.taxRate;
      this.bracketForm.baseTax = src.baseTax;
    } else {
      this.bracketForm.employeeShare = src.employeeShare;
      this.bracketForm.employerShare = src.employerShare;
    }
    this.showBracketModal = true;
  }

  closeBracketModal(): void {
    this.showBracketModal = false;
  }

  saveBracket(): void {
    const type = this.bracketFormType;
    const list = this.getBracketArray(type) as any[];
    if (type === 'BIR') {
      const item = {
        rangeFrom: this.bracketForm.rangeFrom ?? 0,
        rangeTo: this.bracketForm.rangeTo ?? 0,
        taxRate: this.bracketForm.taxRate ?? 0,
        baseTax: this.bracketForm.baseTax ?? 0,
      };
      if (this.bracketEditIndex == null) list.push(item); else list[this.bracketEditIndex] = item;
    } else {
      const item = {
        rangeFrom: this.bracketForm.rangeFrom ?? 0,
        rangeTo: this.bracketForm.rangeTo ?? 0,
        employeeShare: this.bracketForm.employeeShare ?? 0,
        employerShare: this.bracketForm.employerShare ?? 0,
      };
      if (this.bracketEditIndex == null) list.push(item); else list[this.bracketEditIndex] = item;
    }
    this.closeBracketModal();
  }

  private resetBracketForm(): void {
    this.bracketForm = { rangeFrom: null, rangeTo: null, employeeShare: null, employerShare: null, taxRate: null, baseTax: null };
  }

  private getBracketArray(type: 'SSS' | 'PhilHealth' | 'Pag-IBIG' | 'BIR') {
    switch (type) {
      case 'SSS': return this.sssBrackets;
      case 'PhilHealth': return this.philHealthBrackets;
      case 'Pag-IBIG': return this.pagibigBrackets;
      case 'BIR': return this.birBrackets;
    }
  }

  // --- Bracket delete ---
  deleteSSSBracket(index: number): void {
    this.sssBrackets.splice(index, 1);
  }

  deletePhilHealthBracket(index: number): void {
    this.philHealthBrackets.splice(index, 1);
  }

  deletePagibigBracket(index: number): void {
    this.pagibigBrackets.splice(index, 1);
  }

  deleteBirBracket(index: number): void {
    this.birBrackets.splice(index, 1);
  }

  // Delete confirmations
  confirmDeleteSSSBracket(index: number): void {
    this.openConfirm('Delete SSS Bracket', 'Are you sure you want to delete this SSS bracket? This action cannot be undone.', () => this.deleteSSSBracket(index));
  }
  confirmDeletePhilHealthBracket(index: number): void {
    this.openConfirm('Delete PhilHealth Bracket', 'Are you sure you want to delete this PhilHealth bracket? This action cannot be undone.', () => this.deletePhilHealthBracket(index));
  }
  confirmDeletePagibigBracket(index: number): void {
    this.openConfirm('Delete Pag-IBIG Bracket', 'Are you sure you want to delete this Pag-IBIG bracket? This action cannot be undone.', () => this.deletePagibigBracket(index));
  }
  confirmDeleteBirBracket(index: number): void {
    this.openConfirm('Delete BIR Bracket', 'Are you sure you want to delete this BIR bracket? This action cannot be undone.', () => this.deleteBirBracket(index));
  }

  // --- Export (CSV downloads) ---
  exportContributionHistoryAll(): void {
    const rows = this.contributionHistory;
    const header = ['employeeId','employeeName','month','sss','philhealth','pagibig','bir'];
    const csv = [header.join(',')]
      .concat(rows.map(r => [r.employeeId, r.employeeName, r.month, r.sss, r.philhealth, r.pagibig, r.bir].join(',')))
      .join('\n');
    this.downloadFile('contribution-history.csv', csv, 'text/csv');
  }

  exportContributionRecord(record: ContributionHistory): void {
    const header = ['employeeId','employeeName','month','sss','philhealth','pagibig','bir'];
    const csv = [header.join(','), [record.employeeId, record.employeeName, record.month, record.sss, record.philhealth, record.pagibig, record.bir].join(',')].join('\n');
    this.downloadFile(`contribution-${record.employeeId}-${record.month}.csv`, csv, 'text/csv');
  }

  // --- Generate government files (dummy CSVs) ---
  generateSSSR3(): void {
    const header = ['SSS_NO','EMPLOYEE_ID','EMPLOYEE_NAME','AMOUNT'];
    const csv = [header.join(',')]
      .concat(this.contributionHistory.map(r => ['N/A', r.employeeId, r.employeeName, r.sss].join(',')))
      .join('\n');
    this.downloadFile('SSS_R3.csv', csv, 'text/csv');
  }

  generatePhilHealthRF1(): void {
    const header = ['PHIL_NO','EMPLOYEE_ID','EMPLOYEE_NAME','AMOUNT'];
    const csv = [header.join(',')]
      .concat(this.contributionHistory.map(r => ['N/A', r.employeeId, r.employeeName, r.philhealth].join(',')))
      .join('\n');
    this.downloadFile('PHILHEALTH_RF1.csv', csv, 'text/csv');
  }

  generatePagibigM11(): void {
    const header = ['PAGIBIG_NO','EMPLOYEE_ID','EMPLOYEE_NAME','AMOUNT'];
    const csv = [header.join(',')]
      .concat(this.contributionHistory.map(r => ['N/A', r.employeeId, r.employeeName, r.pagibig].join(',')))
      .join('\n');
    this.downloadFile('PAGIBIG_M1-1.csv', csv, 'text/csv');
  }

  private downloadFile(filename: string, content: string, mime: string): void {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  // --- Confirmation modal for exports/generations ---
  showConfirmModal = false;
  confirmTitle = '';
  confirmMessage = '';
  private pendingAction: (() => void) | null = null;

  private openConfirm(title: string, message: string, action: () => void): void {
    this.confirmTitle = title;
    this.confirmMessage = message;
    this.pendingAction = action;
    this.showConfirmModal = true;
  }

  confirmNo(): void {
    this.showConfirmModal = false;
    this.pendingAction = null;
  }

  confirmYes(): void {
    const action = this.pendingAction;
    this.showConfirmModal = false;
    this.pendingAction = null;
    action && action();
  }

  // Wrappers to ask for confirmation
  confirmExportContributionHistoryAll(): void {
    this.openConfirm(
      'Export Contribution History',
      'Are you sure you want to export all contribution history as CSV?',
      () => this.exportContributionHistoryAll()
    );
  }

  confirmExportContributionRecord(record: ContributionHistory): void {
    this.openConfirm(
      'Export Contribution Record',
      `Export CSV for ${record.employeeName} (${record.employeeId}) - ${record.month}?`,
      () => this.exportContributionRecord(record)
    );
  }

  confirmGenerateSSSR3(): void {
    this.openConfirm(
      'Generate SSS R3',
      'Generate SSS R3 CSV file for the current data?',
      () => this.generateSSSR3()
    );
  }

  confirmGeneratePhilHealthRF1(): void {
    this.openConfirm(
      'Generate PhilHealth RF-1',
      'Generate PhilHealth RF-1 CSV file for the current data?',
      () => this.generatePhilHealthRF1()
    );
  }

  confirmGeneratePagibigM11(): void {
    this.openConfirm(
      'Generate Pag-IBIG M1-1',
      'Generate Pag-IBIG M1-1 CSV file for the current data?',
      () => this.generatePagibigM11()
    );
  }
}
