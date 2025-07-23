import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SidebarComponent } from "../../../shared/sidebar/sidebar.component";
import { HeaderComponent } from "../../../shared/header/header.component";

export interface BankDisbursement {
  employeeId: string;
  employeeName: string;
  accountNumber: string;
  amount: number;
  bank: 'BDO' | 'Metrobank' | 'Landbank';
}

@Component({
  selector: 'app-bank-file-generation',
  templateUrl: './bank-file-generation.component.html',
  styleUrl: './bank-file-generation.component.scss',
  imports: [CommonModule, FormsModule, SidebarComponent, HeaderComponent]
})
export class BankFileGenerationComponent {
  selectedBank: 'BDO' | 'Metrobank' | 'Landbank' = 'BDO';
  period: string = '';
  disbursements: BankDisbursement[] = [];

  previewDisbursement() {
    // Implement preview logic here
  }

  generateBankFile() {
    // Implement file generation logic here
  }
}
