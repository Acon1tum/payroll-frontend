import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HeaderComponent } from '../../../../shared/header/header.component';
import { SidebarComponent } from '../../../../shared/sidebar/sidebar.component';
import { DepartmentService, Department, Employee, Organization, CreateDepartmentRequest, UpdateDepartmentRequest, AssignHeadRequest } from '../../../../services/department.service';

interface Breadcrumb {
  label: string;
  path?: string;
  active?: boolean;
}

@Component({
  selector: 'app-department-management',
  imports: [CommonModule, FormsModule, HeaderComponent, SidebarComponent],
  templateUrl: './department-management.component.html',
  styleUrl: './department-management.component.scss'
})
export class DepartmentManagementComponent implements OnInit {
  departments: Department[] = [];
  filteredDepartments: Department[] = [];
  employees: Employee[] = [];
  organizations: Organization[] = [];
  selectedDepartment: Department | null = null;
  isAddMode = false;
  isEditMode = false;
  isAssignHeadMode = false;
  searchTerm = '';
  selectedOrganizationId: string | null = null;
  isLoading = false;
  errorMessage = '';
  successMessage = '';
  isSidebarCollapsed = false;
  nameValidationMessage: { message: string; isError: boolean } | null = null;

  // Breadcrumbs for header
  breadcrumbs: Breadcrumb[] = [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'System Administration', path: '/admin/system-administration' },
    { label: 'Department Management', active: true }
  ];

  // Form data
  departmentForm = {
    name: '',
    code: '',
    organizationId: null as string | null,
    description: '',
    status: 'active' as 'active' | 'inactive'
  };

  assignHeadForm = {
    departmentId: null as string | null,
    employeeId: null as string | null
  };

  constructor(private departmentService: DepartmentService) {}

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.isLoading = true;
    this.errorMessage = '';
    
    // Load organizations
    this.departmentService.getOrganizations().subscribe({
      next: (response) => {
        this.organizations = response.data;
      },
      error: (error) => {
        console.error('Error loading organizations:', error);
        this.errorMessage = 'Failed to load organizations';
      }
    });

    // Load employees
    this.departmentService.getAvailableEmployees().subscribe({
      next: (response) => {
        console.log('✅ Employees loaded successfully:', response);
        this.employees = response.data;
      },
      error: (error) => {
        console.error('❌ Error loading employees:', error);
        console.error('Error details:', {
          status: error.status,
          statusText: error.statusText,
          message: error.message,
          error: error.error
        });
        this.errorMessage = 'Failed to load employees';
      }
    });

    // Load departments
    this.departmentService.getDepartments().subscribe({
      next: (response) => {
        this.departments = response.data;
        this.filteredDepartments = [...this.departments];
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading departments:', error);
        this.errorMessage = 'Failed to load departments';
        this.isLoading = false;
      }
    });
  }

  searchDepartments() {
    if (!this.searchTerm.trim() && !this.selectedOrganizationId) {
      this.filteredDepartments = [...this.departments];
    } else {
      this.filteredDepartments = this.departments.filter(dept =>
        (dept.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
         dept.organizationName.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
         (dept.departmentHeadName && dept.departmentHeadName.toLowerCase().includes(this.searchTerm.toLowerCase()))) &&
        (!this.selectedOrganizationId || dept.organizationId === this.selectedOrganizationId)
      );
    }
  }

  onOrganizationFilterChange() {
    this.searchDepartments();
  }

  addDepartment() {
    this.isAddMode = true;
    this.isEditMode = false;
    this.isAssignHeadMode = false;
    this.selectedDepartment = null;
    this.resetDepartmentForm();
  }

  editDepartment(department: Department) {
    this.isEditMode = true;
    this.isAddMode = false;
    this.isAssignHeadMode = false;
    this.selectedDepartment = department;
    this.departmentForm = {
      name: department.name,
      code: department.code || '',
      organizationId: department.organizationId,
      description: department.description,
      status: department.status
    };
  }

  assignDepartmentHead(department: Department) {
    this.isAssignHeadMode = true;
    this.isAddMode = false;
    this.isEditMode = false;
    this.selectedDepartment = department;
    this.assignHeadForm = {
      departmentId: department.id,
      employeeId: department.departmentHeadId || null
    };
  }

  saveDepartment() {
    if (this.isAddMode) {
      const createRequest: CreateDepartmentRequest = {
        name: this.departmentForm.name,
        code: this.departmentForm.code || undefined,
        organizationId: this.departmentForm.organizationId!,
        description: this.departmentForm.description,
        status: this.departmentForm.status
      };

      // Check for duplicate name before creating
      this.checkDuplicateBeforeSave(createRequest.name, createRequest.organizationId, () => {
        this.departmentService.createDepartment(createRequest).subscribe({
          next: (response) => {
            this.successMessage = response.message;
            this.loadData(); // Reload data to get the new department
            this.cancelEdit();
            setTimeout(() => this.successMessage = '', 3000);
          },
          error: (error) => {
            console.error('Error creating department:', error);
            if (error.status === 409) {
              this.errorMessage = error.error.message || 'A department with this name already exists in this organization';
            } else {
              this.errorMessage = 'Failed to create department';
            }
            setTimeout(() => this.errorMessage = '', 5000);
          }
        });
      });
    } else if (this.isEditMode && this.selectedDepartment) {
      const updateRequest: UpdateDepartmentRequest = {
        name: this.departmentForm.name,
        code: this.departmentForm.code || undefined,
        organizationId: this.departmentForm.organizationId!,
        description: this.departmentForm.description,
        status: this.departmentForm.status
      };

      // Check for duplicate name before updating
      this.checkDuplicateBeforeSave(updateRequest.name!, updateRequest.organizationId!, () => {
        this.departmentService.updateDepartment(this.selectedDepartment!.id, updateRequest).subscribe({
          next: (response) => {
            this.successMessage = response.message;
            this.loadData(); // Reload data to get updated department
            this.cancelEdit();
            setTimeout(() => this.successMessage = '', 3000);
          },
          error: (error) => {
            console.error('Error updating department:', error);
            if (error.status === 409) {
              this.errorMessage = error.error.message || 'A department with this name already exists in this organization';
            } else {
              this.errorMessage = 'Failed to update department';
            }
            setTimeout(() => this.errorMessage = '', 5000);
          }
        });
      }, this.selectedDepartment.id);
    }
  }

  // Check for duplicate department name before saving
  private checkDuplicateBeforeSave(name: string, organizationId: string, onSuccess: () => void, excludeId?: string) {
    if (!name.trim() || !organizationId) {
      this.errorMessage = 'Please fill in all required fields';
      setTimeout(() => this.errorMessage = '', 5000);
      return;
    }

    this.departmentService.checkDuplicateDepartmentName(name.trim(), organizationId, excludeId).subscribe({
      next: (response) => {
        if (response.isDuplicate) {
          this.errorMessage = response.message || 'A department with this name already exists in this organization';
          setTimeout(() => this.errorMessage = '', 5000);
        } else {
          // No duplicate found, proceed with save
          onSuccess();
        }
      },
      error: (error) => {
        console.error('Error checking duplicate:', error);
        // If duplicate check fails, still try to save (backend will catch duplicates)
        onSuccess();
      }
    });
  }

  saveDepartmentHead() {
    if (this.assignHeadForm.employeeId && this.assignHeadForm.departmentId) {
      const request: AssignHeadRequest = {
        departmentId: this.assignHeadForm.departmentId,
        employeeId: this.assignHeadForm.employeeId
      };

      this.departmentService.assignDepartmentHead(request).subscribe({
        next: (response) => {
          this.successMessage = response.message;
          this.loadData(); // Reload data to get updated department
          this.cancelEdit();
          setTimeout(() => this.successMessage = '', 3000);
        },
        error: (error) => {
          console.error('Error assigning department head:', error);
          this.errorMessage = 'Failed to assign department head';
          setTimeout(() => this.errorMessage = '', 5000);
        }
      });
    }
  }

  deleteDepartment(department: Department) {
    if (confirm(`Are you sure you want to delete ${department.name}?`)) {
      this.departmentService.deleteDepartment(department.id).subscribe({
        next: (response) => {
          this.successMessage = response.message;
          this.loadData(); // Reload data to remove deleted department
          setTimeout(() => this.successMessage = '', 3000);
        },
        error: (error) => {
          console.error('Error deleting department:', error);
          this.errorMessage = 'Failed to delete department';
          setTimeout(() => this.errorMessage = '', 5000);
        }
      });
    }
  }

  toggleStatus(department: Department) {
    this.departmentService.toggleDepartmentStatus(department.id).subscribe({
      next: (response) => {
        this.successMessage = response.message;
        this.loadData(); // Reload data to get updated status
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (error) => {
        console.error('Error toggling department status:', error);
        this.errorMessage = 'Failed to update department status';
        setTimeout(() => this.errorMessage = '', 5000);
      }
    });
  }

  cancelEdit() {
    this.isAddMode = false;
    this.isEditMode = false;
    this.isAssignHeadMode = false;
    this.selectedDepartment = null;
    this.resetDepartmentForm();
    this.resetAssignHeadForm();
  }

  closeModal() {
    this.cancelEdit();
  }

  resetDepartmentForm() {
    this.departmentForm = {
      name: '',
      code: '',
      organizationId: null,
      description: '',
      status: 'active'
    };
  }

  resetAssignHeadForm() {
    this.assignHeadForm = {
      departmentId: null,
      employeeId: null
    };
  }

  toggleSidebar() {
    this.isSidebarCollapsed = !this.isSidebarCollapsed;
  }

  getAvailableEmployees(): Employee[] {
    return this.employees.filter(emp => !emp.isDepartmentHead || emp.departmentId === this.assignHeadForm.departmentId);
  }

  clearMessages() {
    this.errorMessage = '';
    this.successMessage = '';
    this.nameValidationMessage = null;
  }

  // Validate department name for duplicates
  validateDepartmentName() {
    const name = this.departmentForm.name?.trim();
    const organizationId = this.departmentForm.organizationId;
    
    if (!name || !organizationId) {
      this.nameValidationMessage = null;
      return;
    }

    // Clear previous validation message
    this.nameValidationMessage = null;

    // Check for duplicate name
    this.departmentService.checkDuplicateDepartmentName(name, organizationId, this.selectedDepartment?.id).subscribe({
      next: (response) => {
        if (response.isDuplicate) {
          this.nameValidationMessage = {
            message: response.message || 'A department with this name already exists in this organization',
            isError: true
          };
        } else {
          this.nameValidationMessage = {
            message: 'Department name is available',
            isError: false
          };
        }
      },
      error: (error) => {
        console.error('Error validating department name:', error);
        // Don't show error message for validation failures
      }
    });
  }
}