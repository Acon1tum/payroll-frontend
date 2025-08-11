import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SidebarComponent } from "../../../../shared/sidebar/sidebar.component";
import { HeaderComponent } from "../../../../shared/header/header.component";
import { DummyDataService } from '../../../../services/dummy-data.service';

export interface Deduction {
  id: string;
  name: string;
  type: 'recurring' | 'one-time';
  amount: number;
  description?: string;
}

export interface EmployeeDeductionAssignment {
  employeeId: string;
  deductionId: string;
  schedule: string; // e.g., 'monthly', 'once', or a date
  startDate?: Date;
  endDate?: Date;
}

interface Breadcrumb {
  label: string;
  path?: string;
  active?: boolean;
}


@Component({
  selector: 'app-deductions',
  templateUrl: './deductions.component.html',
  styleUrl: './deductions.component.scss',
  imports: [CommonModule, FormsModule, SidebarComponent, HeaderComponent]
})
export class DeductionsComponent implements OnInit {
  deductions: Deduction[] = [];
  assignments: EmployeeDeductionAssignment[] = [];

  // Breadcrumbs for header
  breadcrumbs: Breadcrumb[] = [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Contributions & Deductions', path: '/admin/contributions-deductions' },
    { label: 'Deductions', active: true }
  ];

  // UI state for tabs
  selectedTab: 'manage' | 'assign' = 'manage';

  // Modals - Deduction
  showDeductionModal = false;
  deductionEditIndex: number | null = null;
  deductionForm: { id?: string; name: string; type: 'recurring' | 'one-time'; amount: number | null; description?: string } = {
    name: '', type: 'recurring', amount: null, description: ''
  };

  // Modals - Assignment
  showAssignmentModal = false;
  assignmentEditIndex: number | null = null;
  assignmentForm: { employeeId: string; deductionId: string; schedule: string; startDate?: string; endDate?: string } = {
    employeeId: '', deductionId: '', schedule: 'monthly', startDate: '', endDate: ''
  };

  // Confirmation modal (shared)
  showConfirmModal = false;
  confirmTitle = '';
  confirmMessage = '';
  private pendingAction: (() => void) | null = null;

  constructor(private dummy: DummyDataService) {}

  ngOnInit(): void {
    this.deductions = this.dummy.getDeductions();
    this.assignments = this.dummy.getDeductionAssignments();
  }

  // ---------- Deduction CRUD ----------
  openAddDeduction(): void {
    this.deductionEditIndex = null;
    this.deductionForm = { name: '', type: 'recurring', amount: null, description: '' };
    this.showDeductionModal = true;
  }

  openEditDeduction(index: number): void {
    const d = this.deductions[index];
    this.deductionEditIndex = index;
    this.deductionForm = { id: d.id, name: d.name, type: d.type, amount: d.amount, description: d.description } as any;
    this.showDeductionModal = true;
  }

  closeDeductionModal(): void {
    this.showDeductionModal = false;
  }

  saveDeduction(): void {
    const item: Deduction = {
      id: this.deductionForm.id || `D${Date.now()}`,
      name: this.deductionForm.name,
      type: this.deductionForm.type,
      amount: Number(this.deductionForm.amount || 0),
      description: this.deductionForm.description || ''
    };
    if (this.deductionEditIndex == null) {
      this.deductions.push(item);
    } else {
      this.deductions[this.deductionEditIndex] = item;
    }
    this.closeDeductionModal();
  }

  confirmDeleteDeduction(index: number): void {
    this.openConfirm('Delete Deduction', 'Are you sure you want to delete this deduction?', () => {
      this.deductions.splice(index, 1);
    });
  }

  // ---------- Assignment CRUD ----------
  openAddAssignment(): void {
    this.assignmentEditIndex = null;
    this.assignmentForm = { employeeId: '', deductionId: '', schedule: 'monthly', startDate: '', endDate: '' };
    this.showAssignmentModal = true;
  }

  openEditAssignment(index: number): void {
    const a = this.assignments[index];
    this.assignmentEditIndex = index;
    this.assignmentForm = {
      employeeId: a.employeeId,
      deductionId: a.deductionId,
      schedule: a.schedule,
      startDate: a.startDate ? new Date(a.startDate).toISOString().split('T')[0] : '',
      endDate: a.endDate ? new Date(a.endDate).toISOString().split('T')[0] : ''
    };
    this.showAssignmentModal = true;
  }

  closeAssignmentModal(): void {
    this.showAssignmentModal = false;
  }

  saveAssignment(): void {
    const item: EmployeeDeductionAssignment = {
      employeeId: this.assignmentForm.employeeId,
      deductionId: this.assignmentForm.deductionId,
      schedule: this.assignmentForm.schedule,
      startDate: this.assignmentForm.startDate ? new Date(this.assignmentForm.startDate) : undefined,
      endDate: this.assignmentForm.endDate ? new Date(this.assignmentForm.endDate) : undefined
    };
    if (this.assignmentEditIndex == null) {
      this.assignments.push(item);
    } else {
      this.assignments[this.assignmentEditIndex] = item;
    }
    this.closeAssignmentModal();
  }

  confirmDeleteAssignment(index: number): void {
    this.openConfirm('Delete Assignment', 'Are you sure you want to delete this assignment?', () => {
      this.assignments.splice(index, 1);
    });
  }

  // ---------- Confirmation modal helpers ----------
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
}
