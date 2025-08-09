import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SidebarComponent } from "../../../../shared/sidebar/sidebar.component";
import { HeaderComponent } from "../../../../shared/header/header.component";
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

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
  imports: [CommonModule, ReactiveFormsModule, SidebarComponent, HeaderComponent]
})
export class LeaveSettingsComponent {
  leaveTypes: LeaveType[] = [
    { id: 'VL', name: 'Vacation Leave', description: 'Paid leave for personal time off', isPaid: true },
    { id: 'SL', name: 'Sick Leave', description: 'Paid leave for sickness', isPaid: true },
    { id: 'EL', name: 'Emergency Leave', description: 'Unplanned absences', isPaid: false },
  ];
  creditSettings: LeaveCreditSetting[] = [
    { leaveTypeId: 'VL', employmentType: 'Regular', annualCap: 15, monthlyCap: 1.25 },
    { leaveTypeId: 'SL', employmentType: 'Regular', annualCap: 10, monthlyCap: 0.83 },
    { leaveTypeId: 'VL', employmentType: 'Probationary', annualCap: 5, monthlyCap: 0.42 },
  ];
  selectedTab: 'types' | 'credits' = 'types';

  // UI state for modals and forms
  showTypeModal = false;
  typeForm: FormGroup;
  editingTypeIndex: number | null = null;

  showCreditModal = false;
  creditForm: FormGroup;
  editingCreditIndex: number | null = null;

  // Shared confirm modal
  showConfirm = false;
  confirmTitle = '';
  confirmMessage = '';
  private confirmAction: (() => void) | null = null;

  constructor(private formBuilder: FormBuilder) {
    this.typeForm = this.formBuilder.group({
      id: ['', [Validators.required, Validators.maxLength(5)]],
      name: ['', [Validators.required, Validators.maxLength(50)]],
      description: ['',[Validators.maxLength(200)]],
      isPaid: [true]
    });

    this.creditForm = this.formBuilder.group({
      leaveTypeId: ['', Validators.required],
      employmentType: ['Regular', Validators.required],
      annualCap: [0, [Validators.required, Validators.min(0)]],
      monthlyCap: [0, [Validators.required, Validators.min(0)]]
    });
  }

  // Leave Types CRUD
  openAddType(): void {
    this.editingTypeIndex = null;
    this.typeForm.reset({ id: '', name: '', description: '', isPaid: true });
    this.showTypeModal = true;
  }

  openEditType(index: number): void {
    this.editingTypeIndex = index;
    const t = this.leaveTypes[index];
    this.typeForm.setValue({ id: t.id, name: t.name, description: t.description ?? '', isPaid: t.isPaid });
    this.showTypeModal = true;
  }

  saveType(): void {
    if (this.typeForm.invalid) { this.typeForm.markAllAsTouched(); return; }
    const payload = this.typeForm.value as LeaveType;
    if (this.editingTypeIndex === null) {
      // prevent duplicate id
      if (this.leaveTypes.some(t => t.id.toLowerCase() === payload.id.toLowerCase())) {
        alert('A leave type with this ID already exists.');
        return;
      }
      this.leaveTypes = [...this.leaveTypes, payload];
    } else {
      const next = [...this.leaveTypes];
      next[this.editingTypeIndex] = payload;
      this.leaveTypes = next;
    }
    this.closeTypeModal();
  }

  requestDeleteType(index: number): void {
    const t = this.leaveTypes[index];
    this.openConfirm('Delete Leave Type', `Delete "${t.name}" (${t.id})?`, () => {
      this.leaveTypes = this.leaveTypes.filter((_, i) => i !== index);
    });
  }

  closeTypeModal(): void { this.showTypeModal = false; }

  // Credit Settings CRUD
  openAddCredit(): void {
    this.editingCreditIndex = null;
    this.creditForm.reset({ leaveTypeId: this.leaveTypes[0]?.id ?? '', employmentType: 'Regular', annualCap: 0, monthlyCap: 0 });
    this.showCreditModal = true;
  }

  openEditCredit(index: number): void {
    this.editingCreditIndex = index;
    const c = this.creditSettings[index];
    this.creditForm.setValue({ leaveTypeId: c.leaveTypeId, employmentType: c.employmentType, annualCap: c.annualCap, monthlyCap: c.monthlyCap });
    this.showCreditModal = true;
  }

  saveCredit(): void {
    if (this.creditForm.invalid) { this.creditForm.markAllAsTouched(); return; }
    const payload = this.creditForm.value as LeaveCreditSetting;
    // normalize numeric
    payload.annualCap = Number(payload.annualCap);
    payload.monthlyCap = Number(payload.monthlyCap);
    if (this.editingCreditIndex === null) {
      this.creditSettings = [...this.creditSettings, payload];
    } else {
      const next = [...this.creditSettings];
      next[this.editingCreditIndex] = payload;
      this.creditSettings = next;
    }
    this.closeCreditModal();
  }

  requestDeleteCredit(index: number): void {
    const c = this.creditSettings[index];
    this.openConfirm('Delete Credit Setting', `Delete credit for ${c.leaveTypeId} - ${c.employmentType}?`, () => {
      this.creditSettings = this.creditSettings.filter((_, i) => i !== index);
    });
  }

  closeCreditModal(): void { this.showCreditModal = false; }

  // Confirm helpers
  private openConfirm(title: string, message: string, action: () => void): void {
    this.confirmTitle = title;
    this.confirmMessage = message;
    this.confirmAction = action;
    this.showConfirm = true;
  }
  confirmYes(): void { this.showConfirm = false; this.confirmAction?.(); this.confirmAction = null; }
  confirmNo(): void { this.showConfirm = false; this.confirmAction = null; }
}
