import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SidebarComponent } from "../../../../shared/sidebar/sidebar.component";
import { HeaderComponent } from "../../../../shared/header/header.component";
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { LeaveService, LeaveType, LeaveCreditSetting } from '../../../../services/leave.service';
import { Subscription, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

interface Breadcrumb {
  label: string;
  url?: string;
  active?: boolean;
}

@Component({
  selector: 'app-leave-settings',
  templateUrl: './leave-settings.component.html',
  styleUrl: './leave-settings.component.scss',
  imports: [CommonModule, ReactiveFormsModule, SidebarComponent, HeaderComponent],
  standalone: true
})
export class LeaveSettingsComponent implements OnInit, OnDestroy {
  leaveTypes: LeaveType[] = [];
  creditSettings: LeaveCreditSetting[] = [];
  selectedTab: 'types' | 'credits' = 'types';
  isLoading = false;

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
  private destroy$ = new Subject<void>();

  constructor(
    private formBuilder: FormBuilder,
    private leaveService: LeaveService
  ) {
    this.typeForm = this.formBuilder.group({
      code: ['', [Validators.required, Validators.maxLength(5)]],
      name: ['', [Validators.required, Validators.maxLength(50)]],
      maxDaysPerYear: [0, [Validators.required, Validators.min(0)]],
      requiresDocs: [false]
    });

    this.creditForm = this.formBuilder.group({
      leaveTypeId: ['', Validators.required],
      employmentType: ['Regular', Validators.required],
      annualCap: [0, [Validators.required, Validators.min(0)]],
      monthlyCap: [0, [Validators.required, Validators.min(0)]]
    });
  }

  ngOnInit(): void {
    this.loadData();
    this.setupSubscriptions();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupSubscriptions(): void {
    this.leaveService.leaveTypes$
      .pipe(takeUntil(this.destroy$))
      .subscribe(types => {
        this.leaveTypes = types;
      });
  }

  private loadData(): void {
    this.isLoading = true;
    
    // Load leave types from backend
    this.leaveService.getLeaveTypes().subscribe({
      next: (types) => {
        this.leaveTypes = types;
        this.leaveService.updateLeaveTypes(types);
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading leave types:', error);
        this.isLoading = false;
        alert('Error loading leave types. Please try again.');
      }
    });

    // TODO: Load credit settings from backend when API is available
    // For now, keep the mock data
    this.creditSettings = [
      { leaveTypeId: 1, employmentType: 'Regular', annualCap: 15, monthlyCap: 1.25 },
      { leaveTypeId: 2, employmentType: 'Regular', annualCap: 10, monthlyCap: 0.83 },
      { leaveTypeId: 1, employmentType: 'Probationary', annualCap: 5, monthlyCap: 0.42 },
    ];
  }

  // Breadcrumbs for header
  breadcrumbs: Breadcrumb[] = [
    { label: 'Home', url: '/home' },
    { label: 'Leave Management', url: '/leave-management' },
    { label: 'Leave Settings', active: true }
  ];

  // Leave Types CRUD
  openAddType(): void {
    this.editingTypeIndex = null;
    this.typeForm.reset({ code: '', name: '', maxDaysPerYear: 0, requiresDocs: false });
    this.showTypeModal = true;
  }

  openEditType(index: number): void {
    this.editingTypeIndex = index;
    const t = this.leaveTypes[index];
    this.typeForm.setValue({ code: t.code, name: t.name, maxDaysPerYear: t.maxDaysPerYear, requiresDocs: t.requiresDocs });
    this.showTypeModal = true;
  }

  saveType(): void {
    if (this.typeForm.invalid) { this.typeForm.markAllAsTouched(); return; }
    const payload = this.typeForm.value as Partial<LeaveType>;
    if (this.editingTypeIndex === null) {
      // prevent duplicate code
      if (this.leaveTypes.some(t => t.code.toLowerCase() === payload.code?.toLowerCase())) {
        alert('A leave type with this code already exists.');
        return;
      }
      this.leaveService.createLeaveType(payload).subscribe({
        next: (newType) => {
          this.leaveTypes = [...this.leaveTypes, newType];
          this.leaveService.updateLeaveTypes(this.leaveTypes);
          this.closeTypeModal();
          alert('Leave type created successfully!');
        },
        error: (error: any) => {
          console.error('Error creating leave type:', error);
          alert('Failed to create leave type. Please try again.');
        }
      });
    } else {
      const next = [...this.leaveTypes];
      next[this.editingTypeIndex] = { ...next[this.editingTypeIndex], ...payload };
      this.leaveService.updateLeaveType(next[this.editingTypeIndex].id, payload).subscribe({
        next: (updatedType) => {
          this.leaveTypes = next;
          this.leaveService.updateLeaveTypes(this.leaveTypes);
          this.closeTypeModal();
          alert('Leave type updated successfully!');
        },
        error: (error: any) => {
          console.error('Error updating leave type:', error);
          alert('Failed to update leave type. Please try again.');
        }
      });
    }
  }

  requestDeleteType(index: number): void {
    const t = this.leaveTypes[index];
    this.openConfirm('Delete Leave Type', `Delete "${t.name}" (${t.code})?`, () => {
      this.leaveService.deleteLeaveType(t.id).subscribe({
        next: () => {
          this.leaveService.updateLeaveTypes(this.leaveTypes.filter((_, i) => i !== index));
        },
        error: (error) => {
          console.error('Error deleting leave type:', error);
          alert('Failed to delete leave type. Please try again.');
        }
      });
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
      this.leaveService.addLeaveCreditSetting(payload).subscribe({
        next: (newCredit) => {
          this.creditSettings = [...this.creditSettings, newCredit];
          this.leaveService.updateLeaveCreditSettings(this.creditSettings);
          this.closeCreditModal();
          alert('Credit setting created successfully!');
        },
        error: (error: any) => {
          console.error('Error adding credit setting:', error);
          alert('Failed to add credit setting. Please try again.');
        }
      });
    } else {
      const next = [...this.creditSettings];
      next[this.editingCreditIndex] = { ...next[this.editingCreditIndex], ...payload };
      if (next[this.editingCreditIndex].id) {
        this.leaveService.updateLeaveCreditSetting(next[this.editingCreditIndex].id!, payload).subscribe({
          next: (updatedCredit) => {
            this.creditSettings = next;
            this.leaveService.updateLeaveCreditSettings(this.creditSettings);
            this.closeCreditModal();
            alert('Credit setting updated successfully!');
          },
          error: (error: any) => {
            console.error('Error updating credit setting:', error);
            alert('Failed to update credit setting. Please try again.');
          }
        });
      } else {
        // If no ID, just update locally
        this.creditSettings = next;
        this.leaveService.updateLeaveCreditSettings(this.creditSettings);
        this.closeCreditModal();
      }
    }
  }

  requestDeleteCredit(index: number): void {
    const c = this.creditSettings[index];
    this.openConfirm('Delete Credit Setting', `Delete credit for leave type ${c.leaveTypeId} - ${c.employmentType}?`, () => {
      if (c.id) {
        this.leaveService.deleteLeaveCreditSetting(c.id).subscribe({
          next: () => {
            this.creditSettings = this.creditSettings.filter((_, i) => i !== index);
            this.leaveService.updateLeaveCreditSettings(this.creditSettings);
            alert('Credit setting deleted successfully!');
          },
          error: (error: any) => {
            console.error('Error deleting credit setting:', error);
            alert('Failed to delete credit setting. Please try again.');
          }
        });
      } else {
        // If no ID, just remove locally
        this.creditSettings = this.creditSettings.filter((_, i) => i !== index);
        this.leaveService.updateLeaveCreditSettings(this.creditSettings);
      }
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

  // Utility methods
  getLeaveTypeName(leaveTypeId: number): string {
    const leaveType = this.leaveTypes.find(lt => lt.id === leaveTypeId);
    return leaveType ? leaveType.name : `Type ${leaveTypeId}`;
  }
}
