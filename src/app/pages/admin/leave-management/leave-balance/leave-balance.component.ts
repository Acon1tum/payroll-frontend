import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormControl } from '@angular/forms';
import { SidebarComponent } from '../../../../shared/sidebar/sidebar.component';
import { HeaderComponent } from '../../../../shared/header/header.component';
import { LeaveService, LeaveType, LeaveBalance, LeaveAdjustment } from '../../../../services/leave.service';
import { EmployeeService, EmployeeDto } from '../../../../services/employee.service';
import { Subscription, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

interface Breadcrumb {
  label: string;
  url?: string;
}

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  employeeNumber?: string;
  department?: {
    name: string;
  };
}

@Component({
  selector: 'app-leave-balance',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, SidebarComponent, HeaderComponent],
  templateUrl: './leave-balance.component.html',
  styleUrls: ['./leave-balance.component.scss']
})
export class LeaveBalanceComponent implements OnInit, OnDestroy {
  // Forms
  filterForm: FormGroup;
  adjustmentForm: FormGroup;
  resetForm: FormGroup;
  bulkResetForm: FormGroup;

  // Data
  leaveBalances: LeaveBalance[] = [];
  leaveTypes: LeaveType[] = [];
  employees: Employee[] = [];
  adjustments: LeaveAdjustment[] = [];

  // Computed property for unique employees
  get uniqueEmployees(): Employee[] {
    return this.employees.filter((employee, index, self) => 
      index === self.findIndex(e => e.id === employee.id)
    );
  }

  // UI State
  isLoading = false;
  showAdjustmentModal = false;
  showResetModal = false;
  showBulkResetModal = false;
  showReportModal = false;
  showLeaveBalancesModal = false;
  selectedEmployeeForDetails: Employee | null = null;

  // Pagination and Sorting
  currentPage = 1;
  pageSize = 10;
  totalItems = 0;
  sortField = 'employee.lastName';
  sortDirection: 'asc' | 'desc' = 'asc';

  // Selection
  selectedBalances: string[] = [];
  selectedEmployee: Employee | null = null;

  // Utilities
  private destroy$ = new Subject<void>();
  Math = Math;
  
  // Breadcrumbs
  breadcrumbs: Breadcrumb[] = [
    { label: 'Home', url: '/home' },
    { label: 'Leave Management', url: '/leave-management' },
    { label: 'Leave Balances', url: '/leave-balance' }
  ];
  
  constructor(
    private fb: FormBuilder,
    private leaveService: LeaveService,
    private employeeService: EmployeeService
  ) {
    this.adjustmentForm = this.fb.group({
      employeeId: ['', Validators.required],
      leaveTypeId: ['', Validators.required],
      amountDays: ['', [Validators.required, Validators.min(0.5)]],
      adjustmentType: ['credit', Validators.required],
      reason: ['']
    });
    
    this.resetForm = this.fb.group({
      employeeId: ['', Validators.required],
      leaveTypeId: ['', Validators.required],
      year: [new Date().getFullYear(), Validators.required],
      newBalance: ['', [Validators.required, Validators.min(0)]],
      reason: ['']
    });
    
    this.bulkResetForm = this.fb.group({
      year: [new Date().getFullYear(), Validators.required],
      leaveTypeId: ['', Validators.required],
      newBalance: ['', [Validators.required, Validators.min(0)]],
      reason: ['']
    });
    
    this.filterForm = this.fb.group({
      year: [new Date().getFullYear()],
      employeeId: [''],
      leaveTypeId: [''],
      department: ['']
    });
  }
  
  ngOnInit(): void {
    this.loadData();
    this.setupSubscriptions();
    
    // Refresh data periodically to catch new leave types
    this.refreshDataPeriodically();
  }

  private refreshDataPeriodically(): void {
    // Refresh data every 30 seconds to catch new leave types
    setInterval(() => {
      this.loadData();
    }, 30000);
  }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  private setupSubscriptions(): void {
    // Subscribe to service observables
    this.leaveService.leaveBalances$
      .pipe(takeUntil(this.destroy$))
      .subscribe(balances => {
        this.leaveBalances = balances;
        this.totalItems = balances.length;
      });
    
    this.leaveService.leaveTypes$
      .pipe(takeUntil(this.destroy$))
      .subscribe(types => {
        this.leaveTypes = types;
      });
    
    this.leaveService.adjustments$
      .pipe(takeUntil(this.destroy$))
      .subscribe(adjustments => {
        this.adjustments = adjustments;
      });
  }
  
  private loadData(): void {
    this.isLoading = true;
    
    // Load leave types
    this.leaveService.getLeaveTypes().subscribe({
      next: (types) => {
        this.leaveTypes = types;
        this.leaveService.updateLeaveTypes(types);
      },
      error: (error) => {
        console.error('Error loading leave types:', error);
        // You could show a toast notification here
      }
    });
    
    // Load employees
    this.employeeService.getEmployees().subscribe({
      next: (response: { success: boolean; data: EmployeeDto[] }) => {
        this.employees = response.data.map(emp => ({
          id: emp.id,
          firstName: emp.firstName,
          lastName: emp.lastName,
          employeeNumber: emp.employeeId,
          department: emp.departmentName ? { name: emp.departmentName } : undefined
        }));
      },
      error: (error) => {
        console.error('Error loading employees:', error);
      }
    });
    
    // Load leave balances
    this.loadLeaveBalances();
  }
  
  private loadLeaveBalances(): void {
    // Load all leave balances without year filtering to show comprehensive data
    this.leaveService.getLeaveBalances().subscribe({
      next: (balances) => {
        this.leaveBalances = balances;
        this.totalItems = balances.length;
        this.leaveService.updateLeaveBalances(balances);
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading leave balances:', error);
        this.isLoading = false;
        // You could show a toast notification here
      }
    });
  }
  
  // Filter Management
  onFilterChange(): void {
    this.currentPage = 1;
    this.loadLeaveBalances();
  }
  
  clearFilters(): void {
    this.filterForm.reset({
      year: new Date().getFullYear()
    });
    this.onFilterChange();
  }
  
  // Pagination
  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadLeaveBalances();
  }
  
  // Sorting
  onSortChange(field: string): void {
    if (this.sortField === field) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortField = field;
      this.sortDirection = 'asc';
    }
    this.loadLeaveBalances();
  }
  
  // Selection Management
  toggleSelection(id: string): void {
    const index = this.selectedBalances.indexOf(id);
    if (index > -1) {
      this.selectedBalances.splice(index, 1);
    } else {
      this.selectedBalances.push(id);
    }
  }
  
  selectAll(): void {
    this.selectedBalances = this.leaveBalances.map(b => b.id);
  }
  
  deselectAll(): void {
    this.selectedBalances = [];
  }
  
  // Modal Management
  openAdjustmentModal(employee?: Employee): void {
    if (employee) {
      this.selectedEmployee = employee;
      this.adjustmentForm.patchValue({
        employeeId: employee.id
      });
    }
    this.showAdjustmentModal = true;
  }
  
  openResetModal(employee?: Employee): void {
    if (employee) {
      this.selectedEmployee = employee;
      this.resetForm.patchValue({
        employeeId: employee.id
      });
    }
    this.showResetModal = true;
  }
  
  openBulkResetModal(): void {
    this.showBulkResetModal = true;
  }
  
  openReportModal(): void {
    this.showReportModal = true;
  }
  
  closeModals(): void {
    this.showAdjustmentModal = false;
    this.showResetModal = false;
    this.showBulkResetModal = false;
    this.showReportModal = false;
    this.showLeaveBalancesModal = false;
    this.selectedEmployee = null;
    this.selectedEmployeeForDetails = null;
    this.resetForms();
  }
  
  private resetForms(): void {
    this.adjustmentForm.reset({
      adjustmentType: 'credit'
    });
    this.resetForm.reset({
      year: new Date().getFullYear()
    });
    this.bulkResetForm.reset({
      year: new Date().getFullYear()
    });
  }
  
  // Form Submissions
  onSubmitAdjustment(): void {
    if (this.adjustmentForm.valid && !this.isLoading) {
      this.isLoading = true;
      const formData = this.adjustmentForm.value;
      
      this.leaveService.createLeaveAdjustment(formData).subscribe({
        next: (response) => {
          console.log('Leave adjustment created successfully:', response);
          this.isLoading = false;
          this.closeModals();
          this.loadData(); // Reload data to show updated balances
          // You can add a success message here
          alert('Leave balance adjusted successfully!');
        },
        error: (error) => {
          console.error('Error creating leave adjustment:', error);
          this.isLoading = false;
          // You can add an error message here
          alert('Error adjusting leave balance. Please try again.');
        }
      });
    }
  }

  onSubmitReset(): void {
    if (this.resetForm.valid && !this.isLoading) {
      this.isLoading = true;
      const formData = this.resetForm.value;
      
      this.leaveService.resetLeaveBalance(formData).subscribe({
        next: (response) => {
          console.log('Leave balance reset successfully:', response);
          this.isLoading = false;
          this.closeModals();
          this.loadData(); // Reload data to show updated balances
          // You can add a success message here
          alert('Leave balance reset successfully!');
        },
        error: (error) => {
          console.error('Error resetting leave balance:', error);
          this.isLoading = false;
          // You can add an error message here
          alert('Error resetting leave balance. Please try again.');
        }
      });
    }
  }

  onSubmitBulkReset(): void {
    if (this.bulkResetForm.valid && !this.isLoading) {
      this.isLoading = true;
      const formData = this.bulkResetForm.value;
      
      this.leaveService.bulkResetLeaveBalances(
        formData.year, 
        formData.leaveTypeId, 
        formData.newBalance
      ).subscribe({
        next: (response) => {
          console.log('Bulk leave balance reset successful:', response);
          this.isLoading = false;
          this.closeModals();
          this.loadData(); // Reload data to show updated balances
          // You can add a success message here
          alert('Bulk leave balance reset completed successfully!');
        },
        error: (error) => {
          console.error('Error in bulk leave balance reset:', error);
          this.isLoading = false;
          // You can add an error message here
          alert('Error in bulk leave balance reset. Please try again.');
        }
      });
    }
  }
  
  // Export functionality
  exportToExcel(): void {
    console.log('Exporting to Excel...');
    // Implement Excel export logic here
  }
  
  exportToPDF(): void {
    console.log('Exporting to PDF...');
    // Implement PDF export logic here
  }
  
  // Utility methods
  getEmployeeName(employeeId: string): string {
    const employee = this.employees.find(e => e.id === employeeId);
    return employee ? `${employee.firstName} ${employee.lastName}` : 'Unknown Employee';
  }

  getLeaveTypeName(leaveTypeId: number): string {
    const leaveType = this.leaveTypes.find(lt => lt.id === leaveTypeId);
    return leaveType ? leaveType.name : 'Unknown Type';
  }

  getProgressPercentage(remaining: number, maxDays: number): number {
    return (remaining / maxDays) * 100;
  }

  getProgressColor(percentage: number): string {
    if (percentage >= 80) return 'bg-green-500';
    if (percentage >= 50) return 'bg-yellow-500';
    if (percentage >= 20) return 'bg-orange-500';
    return 'bg-red-500';
  }

  // New methods for total calculations
  getTotalRemainingDays(employeeId: string): number {
    const employeeBalances = this.leaveBalances.filter(balance => balance.employeeId === employeeId);
    // Sum across all years, not just current year
    return employeeBalances.reduce((total, balance) => total + Number(balance.remaining), 0);
  }

  getTotalProgressPercentage(employeeId: string): number {
    const totalRemaining = this.getTotalRemainingDays(employeeId);
    // Sum max days across all years for this employee
    const totalMaxDays = this.leaveBalances
      .filter(balance => balance.employeeId === employeeId)
      .reduce((total, balance) => total + (balance.leaveType?.maxDaysPerYear || 0), 0);
    
    return totalMaxDays > 0 ? (totalRemaining / totalMaxDays) * 100 : 0;
  }

  viewLeaveBalances(employee: Employee): void {
    this.selectedEmployeeForDetails = employee;
    this.showLeaveBalancesModal = true;
  }

  getEmployeeLeaveBalances(employeeId?: string): LeaveBalance[] {
    if (!employeeId) return [];
    
    // Get existing balances for this employee across ALL years
    const existingBalances = this.leaveBalances.filter(balance => balance.employeeId === employeeId);
    
    // Create a map of existing balances by leave type and year
    const balanceMap = new Map<string, LeaveBalance>();
    existingBalances.forEach(balance => {
      const key = `${balance.leaveTypeId}-${balance.year}`;
      balanceMap.set(key, balance);
    });
    
    // Get all years that have data for this employee
    const years = [...new Set(existingBalances.map(b => b.year))];
    if (years.length === 0) {
      years.push(new Date().getFullYear()); // Default to current year if no data
    }
    
    const allLeaveTypes = this.leaveTypes;
    const allBalances: LeaveBalance[] = [];
    
    // Add existing balances
    allBalances.push(...existingBalances);
    
    // Add placeholder balances for missing leave types in years that have data
    years.forEach(year => {
      allLeaveTypes.forEach(leaveType => {
        const key = `${leaveType.id}-${year}`;
        if (!balanceMap.has(key)) {
          // Create a placeholder balance record
          const placeholderBalance: LeaveBalance = {
            id: `placeholder-${employeeId}-${leaveType.id}-${year}`,
            employeeId: employeeId,
            leaveTypeId: leaveType.id,
            year: year,
            remaining: 0,
            employee: {
              id: employeeId,
              firstName: this.employees.find(e => e.id === employeeId)?.firstName || '',
              lastName: this.employees.find(e => e.id === employeeId)?.lastName || '',
              employeeId: this.employees.find(e => e.id === employeeId)?.employeeNumber || '',
              department: this.employees.find(e => e.id === employeeId)?.department
            },
            leaveType: leaveType
          };
          allBalances.push(placeholderBalance);
        }
      });
    });
    
    // Sort by year (descending) then by leave type name for better organization
    return allBalances.sort((a, b) => {
      if (a.year !== b.year) {
        return b.year - a.year; // Years in descending order
      }
      const aName = this.getLeaveTypeName(a.leaveTypeId);
      const bName = this.getLeaveTypeName(b.leaveTypeId);
      return aName.localeCompare(bName);
    });
  }

  getCurrentBalance(employeeId: string, leaveTypeId: string): number {
    const balance = this.leaveBalances.find(b => 
      b.employeeId === employeeId && 
      b.leaveTypeId === parseInt(leaveTypeId) &&
      b.year === new Date().getFullYear()
    );
    return balance ? Number(balance.remaining) : 0;
  }

  // Form getters for proper typing
  get yearControl() {
    return this.filterForm.get('year') as FormControl;
  }

  get leaveTypeIdControl() {
    return this.filterForm.get('leaveTypeId') as FormControl;
  }

  get departmentControl() {
    return this.filterForm.get('department') as FormControl;
  }
}
