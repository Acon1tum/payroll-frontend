import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HeaderComponent } from '../../../../shared/header/header.component';
import { SidebarComponent } from '../../../../shared/sidebar/sidebar.component';
import { EmployeeService, EmployeeDto, CreateEmployeeDto, UpdateEmployeeDto } from '../../../../services/employee.service';

interface Employee {
  id: string; // Changed from number to string to match backend UUID
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: Date;
  hireDate: Date;
  departmentId: number | null;
  departmentName: string;
  position: string;
  salary: number;
  employmentStatus: 'active' | 'resigned' | 'suspended' | 'terminated';
  systemRole: 'admin' | 'hr' | 'payroll_manager' | 'employee';
  managerId?: number;
  managerName?: string;
  address: string;
  emergencyContact: {
    name: string;
    relationship: string;
    phone: string;
  };
  employmentHistory: EmploymentRecord[];
  createdAt: Date;
  updatedAt: Date;
}

interface EmploymentRecord {
  id: number;
  position: string;
  department: string;
  startDate: Date;
  endDate?: Date;
  salary: number;
  reason?: string;
}

interface Department {
  id: number;
  name: string;
}

interface Breadcrumb {
  label: string;
  path?: string;
  active?: boolean;
}

interface SystemRole {
  value: string;
  label: string;
  description: string;
}

@Component({
  selector: 'app-employee-management',
  standalone: true,
  imports: [CommonModule, FormsModule, HeaderComponent, SidebarComponent],
  templateUrl: './employee-management.component.html',
  styleUrl: './employee-management.component.scss'
})
export class EmployeeManagementComponent implements OnInit {
  employees: Employee[] = [];
  filteredEmployees: Employee[] = [];
  departments: Department[] = [];
  selectedEmployee: Employee | null = null;
  isAddMode = false;
  isEditMode = false;
  isViewMode = false;
  isRoleAssignmentMode = false;
  isAccessManagementMode = false;
  searchTerm = '';
  selectedOrganizationId: string = '';
  selectedStatus: string = '';
  selectedRole: string = '';
  isLoading = false;
  isSaving = false;
  errorMessage = '';
  successMessage = '';
  currentTab = 'list'; // 'list', 'roles', 'status'

  // Breadcrumbs for header
  breadcrumbs: Breadcrumb[] = [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'System Administration', path: '/admin/system-administration' },
    { label: 'Employee Management', active: true }
  ];

  // System roles configuration
  systemRoles: SystemRole[] = [
    { value: 'admin', label: 'Admin', description: 'Full system access and administration' },
    { value: 'hr', label: 'HR', description: 'Human resources management and employee records' },
    { value: 'payroll_manager', label: 'Payroll Manager', description: 'Payroll processing and financial management' },
    { value: 'employee', label: 'Employee', description: 'Basic employee access and self-service' }
  ];

  // Form data
  employeeForm = {
    employeeId: '',
    firstName: '',
    lastName: '',
    email: '',
    dateOfBirth: '',
    hireDate: '',
    departmentId: null as number | null,
    position: '',
    salary: null as number | null,
    employmentStatus: 'active' as 'active' | 'resigned' | 'suspended' | 'terminated',
    systemRole: 'employee' as 'admin' | 'hr' | 'payroll_manager' | 'employee',
    photoUrl: '' as string | null
  };

  roleAssignmentForm = {
    employeeId: null as number | null,
    systemRole: 'employee' as 'admin' | 'hr' | 'payroll_manager' | 'employee'
  };

  accessManagementForm = {
    employeeId: null as number | null,
    email: '',
    resetPassword: false,
    newPassword: ''
  };

  constructor(private employeeService: EmployeeService) {}

  ngOnInit() {
    this.loadEmployees();
    
    // Debug: Log initial state after loading
    setTimeout(() => {
      console.log('Initial state after loading:', {
        employees: this.employees.length,
        departments: this.departments.length,
        filteredEmployees: this.filteredEmployees.length
      });
      
      if (this.employees.length > 0) {
        console.log('Sample employee:', this.employees[0]);
      }
      
      if (this.departments.length > 0) {
        console.log('Sample department:', this.departments[0]);
      }
    }, 1000);
  }

  loadEmployees() {
    this.isLoading = true;
    this.employeeService.getEmployees().subscribe({
      next: (resp) => {
        const apiEmployees: EmployeeDto[] = resp.data || [];
        this.employees = apiEmployees.map((e) => ({
          id: e.id, // Use the UUID string directly from backend
          employeeId: e.employeeId,
          firstName: e.firstName,
          lastName: e.lastName,
          email: e.email,
          phone: e.phone || '',
          dateOfBirth: new Date(e.dateOfBirth),
          hireDate: new Date(e.hireDate),
          departmentId: e.departmentName ? this.getDepartmentIdByName(e.departmentName) : null, // Map department name to numeric ID
          departmentName: e.departmentName || '',
          position: e.position,
          salary: e.salary,
          employmentStatus: e.employmentStatus,
          systemRole: this.mapServerRoleToClientRole(e.systemRole),
          address: '',
          emergencyContact: { name: '', relationship: '', phone: '' },
          employmentHistory: [],
          createdAt: new Date(e.createdAt),
          updatedAt: new Date(e.updatedAt),
        }));
        this.filteredEmployees = [...this.employees];
        this.isLoading = false;
        
        // Generate departments from employee data and update department IDs
        this.loadDepartments();
      },
      error: (err) => {
        console.error('Failed to load employees', err);
        this.errorMessage = 'Failed to load employees';
        this.isLoading = false;
      },
    });
  }

  private mapServerRoleToClientRole(role: EmployeeDto['systemRole']): 'admin' | 'hr' | 'payroll_manager' | 'employee' {
    switch (role) {
      case 'hrStaff':
        return 'hr';
      case 'payrollManager':
        return 'payroll_manager';
      case 'admin':
        return 'admin';
      default:
        return 'employee';
    }
  }

  private mapClientRoleToServerRole(role: 'admin' | 'hr' | 'payroll_manager' | 'employee'): EmployeeDto['systemRole'] {
    switch (role) {
      case 'hr':
        return 'hrStaff';
      case 'payroll_manager':
        return 'payrollManager';
      case 'admin':
        return 'admin';
      default:
        return 'employee';
    }
  }

  private getDepartmentIdByName(departmentName: string): number | null {
    if (!departmentName || !this.departments || this.departments.length === 0) {
      console.log('getDepartmentIdByName: No department name or no departments available');
      return null;
    }
    
    const dept = this.departments.find(d => d.name === departmentName);
    if (dept) {
      console.log(`getDepartmentIdByName: Found department "${departmentName}" with ID ${dept.id}`);
      return dept.id;
    } else {
      console.log(`getDepartmentIdByName: Department "${departmentName}" not found`);
      console.log('Available departments:', this.departments.map(d => `${d.name} (ID: ${d.id})`));
      return null;
    }
  }

  loadDepartments() {
    // Generate departments dynamically from employee data
    this.generateDepartmentsFromEmployees();
  }

  private generateDepartmentsFromEmployees() {
    // Extract unique department names from employee data
    const uniqueDepartments = new Set<string>();
    
    this.employees.forEach(emp => {
      if (emp.departmentName && emp.departmentName.trim()) {
        uniqueDepartments.add(emp.departmentName.trim());
      }
    });

    // Convert to department objects with sequential IDs
    this.departments = Array.from(uniqueDepartments).map((deptName, index) => ({
      id: index + 1,
      name: deptName
    }));

    console.log('Generated departments from employee data:', this.departments);
    
    // Update employee department IDs and apply filters
    if (this.employees.length > 0) {
      this.updateEmployeeDepartmentIds();
      this.applyFilters();
    }
  }

  private updateEmployeeDepartmentIds() {
    console.log('Updating employee department IDs...');
    this.employees.forEach(emp => {
      if (emp.departmentName) {
        const oldId = emp.departmentId;
        emp.departmentId = this.getDepartmentIdByName(emp.departmentName);
        console.log(`Employee ${emp.firstName} ${emp.lastName}: ${emp.departmentName} -> ID ${oldId} -> ${emp.departmentId}`);
      }
    });
    console.log('Finished updating department IDs');
  }

  cancelEdit() {
    this.isAddMode = false;
    this.isEditMode = false;
    this.isViewMode = false;
    this.isRoleAssignmentMode = false;
    this.isAccessManagementMode = false;
    this.selectedEmployee = null;
    this.resetEmployeeForm();
    this.resetRoleAssignmentForm();
    this.resetAccessManagementForm();
  }

  saveEmployee() {
    console.log('Saving employee...', this.employeeForm);
    
    // Set saving state
    this.isSaving = true;
    
    // Validate form before saving
    if (!this.validateEmployeeForm()) {
      console.log('Form validation failed');
      this.isSaving = false;
      return;
    }

    if (this.isEditMode && this.selectedEmployee) {
      // Update existing employee
      console.log('Updating existing employee:', this.selectedEmployee.id);
      this.updateEmployee();
    } else {
      // Add new employee
      console.log('Adding new employee');
      this.addEmployee();
    }
  }

  private addEmployee() {
    try {
      console.log('Adding new employee...');
      
      // Prepare data for API call
      const departmentName = this.getDepartmentNameById(this.employeeForm.departmentId);
      console.log('Create - Form department ID:', this.employeeForm.departmentId);
      console.log('Create - Mapped department name:', departmentName);
      
      const createEmployeeData: CreateEmployeeDto = {
        employeeId: this.employeeForm.employeeId.trim(),
        firstName: this.employeeForm.firstName.trim(),
        lastName: this.employeeForm.lastName.trim(),
        email: this.employeeForm.email.trim().toLowerCase(),
        dateOfBirth: this.employeeForm.dateOfBirth,
        hireDate: this.employeeForm.hireDate,
        departmentId: this.employeeForm.departmentId,
        departmentName: departmentName,
        position: this.employeeForm.position.trim(),
        salary: this.employeeForm.salary || 0,
        employmentStatus: this.employeeForm.employmentStatus,
        systemRole: this.mapClientRoleToServerRole(this.employeeForm.systemRole),
        photoUrl: this.employeeForm.photoUrl || undefined
      };

      console.log('Creating employee with data:', createEmployeeData);

      // Call the service to create employee
      this.employeeService.createEmployee(createEmployeeData).subscribe({
        next: (response) => {
          console.log('Employee created successfully:', response);
          
          // Add the new employee to the local array
          const newEmployee: Employee = {
            id: response.data.id, // Use the UUID string directly
            employeeId: response.data.employeeId,
            firstName: response.data.firstName,
            lastName: response.data.lastName,
            email: response.data.email,
            phone: response.data.phone || '',
            // @ts-ignore - extend locally with optional photoUrl
            photoUrl: response.data.photoUrl || null,
            dateOfBirth: new Date(response.data.dateOfBirth),
            hireDate: new Date(response.data.hireDate),
            departmentId: response.data.departmentId ? parseInt(response.data.departmentId) : null,
            departmentName: response.data.departmentName || '',
            position: response.data.position,
            salary: response.data.salary,
            employmentStatus: response.data.employmentStatus,
            systemRole: this.mapServerRoleToClientRole(response.data.systemRole),
            managerId: undefined,
            address: '',
            emergencyContact: {
              name: '',
              relationship: '',
              phone: ''
            },
            employmentHistory: [],
            createdAt: new Date(response.data.createdAt),
            updatedAt: new Date(response.data.updatedAt)
          };

          this.employees.push(newEmployee);
          console.log('Employee added to local array. Total employees:', this.employees.length);
          
          // Refresh departments and apply filters
          this.refreshDepartments();
          
          // Show success message
          this.showSuccessMessage(response.message || 'Employee added successfully!');
          
          // Close modal
          this.cancelEdit();
        },
        error: (error) => {
          console.error('Error creating employee:', error);
          let errorMessage = 'An error occurred while adding the employee.';
          
          if (error.error && error.error.message) {
            errorMessage = error.error.message;
          } else if (error.status === 400) {
            errorMessage = 'Invalid data provided. Please check your input.';
          } else if (error.status === 409) {
            errorMessage = 'Employee ID or email already exists.';
          }
          
          this.showErrorMessage(errorMessage);
        }
      });
      
    } catch (error) {
      console.error('Error preparing employee data:', error);
      this.showErrorMessage('An error occurred while preparing employee data. Please try again.');
    } finally {
      this.isSaving = false;
    }
  }

  private updateEmployee() {
    try {
      if (!this.selectedEmployee) {
        console.error('No employee selected for update');
        this.showErrorMessage('No employee selected for update.');
        return;
      }

      console.log('Updating employee:', this.selectedEmployee.id);

      // Prepare data for API call
      const departmentName = this.getDepartmentNameById(this.employeeForm.departmentId);
      console.log('Update - Form department ID:', this.employeeForm.departmentId);
      console.log('Update - Mapped department name:', departmentName);
      
      const updateEmployeeData: UpdateEmployeeDto = {
        firstName: this.employeeForm.firstName.trim(),
        lastName: this.employeeForm.lastName.trim(),
        email: this.employeeForm.email.trim().toLowerCase(),
        dateOfBirth: this.employeeForm.dateOfBirth,
        hireDate: this.employeeForm.hireDate,
        departmentId: this.employeeForm.departmentId,
        departmentName: departmentName,
        position: this.employeeForm.position.trim(),
        salary: this.employeeForm.salary || 0,
        employmentStatus: this.employeeForm.employmentStatus,
        systemRole: this.mapClientRoleToServerRole(this.employeeForm.systemRole),
        photoUrl: this.employeeForm.photoUrl || undefined
      };

      console.log('Updating employee with data:', updateEmployeeData);

      // Call the service to update employee
      this.employeeService.updateEmployee(this.selectedEmployee.id, updateEmployeeData).subscribe({
        next: (response) => {
          console.log('Employee updated successfully:', response);
          
          // Update the employee in the local array
          const employeeIndex = this.employees.findIndex(emp => emp.id === this.selectedEmployee?.id);
          if (employeeIndex !== -1) {
            this.employees[employeeIndex] = {
              ...this.employees[employeeIndex],
              firstName: response.data.firstName,
              lastName: response.data.lastName,
              email: response.data.email,
              // @ts-ignore
              photoUrl: response.data.photoUrl || null,
              dateOfBirth: new Date(response.data.dateOfBirth),
              hireDate: new Date(response.data.hireDate),
              departmentId: response.data.departmentId ? parseInt(response.data.departmentId) : null,
              departmentName: response.data.departmentName || '',
              position: response.data.position,
              salary: response.data.salary,
              employmentStatus: response.data.employmentStatus,
              systemRole: this.mapServerRoleToClientRole(response.data.systemRole),
              updatedAt: new Date(response.data.updatedAt)
            };
          }

          console.log('Employee updated in local array');

          // Refresh departments and apply filters
          this.refreshDepartments();
          
          // Show success message
          this.showSuccessMessage(response.message || 'Employee updated successfully!');
          
          // Close modal
    this.cancelEdit();
        },
        error: (error) => {
          console.error('Error updating employee:', error);
          let errorMessage = 'An error occurred while updating the employee.';
          
          if (error.error && error.error.message) {
            errorMessage = error.error.message;
          } else if (error.status === 400) {
            errorMessage = 'Invalid data provided. Please check your input.';
          } else if (error.status === 404) {
            errorMessage = 'Employee not found. Please refresh and try again.';
          }
          
          this.showErrorMessage(errorMessage);
        }
      });
      
    } catch (error) {
      console.error('Error preparing update data:', error);
      this.showErrorMessage('An error occurred while preparing update data. Please try again.');
    } finally {
      this.isSaving = false;
    }
  }

  private validateEmployeeForm(): boolean {
    console.log('Validating employee form...', this.employeeForm);
    
    const requiredFields = [
      'employeeId', 'firstName', 'lastName', 'email',
      'dateOfBirth', 'hireDate', 'departmentId', 'position', 'salary'
    ];

    for (const field of requiredFields) {
      const value = this.employeeForm[field as keyof typeof this.employeeForm];
      if (!value || (typeof value === 'string' && value.trim() === '') || value === null) {
        const fieldName = field.replace(/([A-Z])/g, ' $1').toLowerCase();
        this.showErrorMessage(`Please fill in the ${fieldName} field.`);
        console.log(`Validation failed: ${field} is empty`);
        return false;
      }
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.employeeForm.email)) {
      this.showErrorMessage('Please enter a valid email address.');
      console.log('Validation failed: Invalid email format');
      return false;
    }

    // Validate salary is positive
    if (this.employeeForm.salary && this.employeeForm.salary <= 0) {
      this.showErrorMessage('Salary must be greater than 0.');
      console.log('Validation failed: Invalid salary');
      return false;
    }

    console.log('Form validation passed');
    return true;
  }

  private getDepartmentNameById(departmentId: number | null): string {
    if (!departmentId) {
      console.log('getDepartmentNameById: No department ID provided');
      return '';
    }
    const dept = this.departments.find(d => d.id === departmentId);
    if (dept) {
      console.log(`getDepartmentNameById: Found department ${dept.name} for ID ${departmentId}`);
      return dept.name;
    } else {
      console.log(`getDepartmentNameById: No department found for ID ${departmentId}`);
      console.log('Available departments:', this.departments);
      return '';
    }
  }

  private showSuccessMessage(message: string) {
    this.successMessage = message;
    // Clear success message after 5 seconds
    setTimeout(() => {
      this.successMessage = '';
    }, 5000);
  }

  private showErrorMessage(message: string) {
    this.errorMessage = message;
    // Clear error message after 5 seconds
    setTimeout(() => {
      this.errorMessage = '';
    }, 5000);
  }

  saveRoleAssignment() {
    // Implementation for saving role assignment
    console.log('Saving role assignment:', this.roleAssignmentForm);
    this.cancelEdit();
  }

  saveAccessManagement() {
    // Implementation for saving access management
    console.log('Saving access management:', this.accessManagementForm);
    this.cancelEdit();
  }

  resetEmployeeForm() {
    this.employeeForm = {
      employeeId: '',
      firstName: '',
      lastName: '',
      email: '',
      dateOfBirth: '',
      hireDate: '',
      departmentId: null,
      position: '',
      salary: null,
      employmentStatus: 'active',
      systemRole: 'employee',
      photoUrl: ''
    };
  }

  resetRoleAssignmentForm() {
    this.roleAssignmentForm = {
      employeeId: null,
      systemRole: 'employee'
    };
  }

  resetAccessManagementForm() {
    this.accessManagementForm = {
      employeeId: null,
      email: '',
      resetPassword: false,
      newPassword: ''
    };
  }



  getRoleLabel(role: string): string {
    const roleObj = this.systemRoles.find(r => r.value === role);
    return roleObj ? roleObj.label : role;
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'resigned': return 'bg-yellow-100 text-yellow-800';
      case 'suspended': return 'bg-orange-100 text-orange-800';
      case 'terminated': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  formatDateForInput(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  // Photo handlers
  onPhotoSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    const file = input.files[0];
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      this.employeeForm.photoUrl = base64;
    };
    reader.readAsDataURL(file);
  }

  removePhoto() {
    this.employeeForm.photoUrl = '';
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }

  getFullName(employee: Employee): string {
    return `${employee.firstName} ${employee.lastName}`;
  }

  getEmployeesByRole(roleValue: string): Employee[] {
    return this.employees.filter(emp => emp.systemRole === roleValue);
  }

  getEmployeesByStatus(status: string): Employee[] {
    return this.employees.filter(emp => emp.employmentStatus === status);
  }

  getEmployeeCountByRole(roleValue: string): number {
    return this.employees.filter(emp => emp.systemRole === roleValue).length;
  }

  getEmployeeCountByStatus(status: string): number {
    return this.employees.filter(emp => emp.employmentStatus === status).length;
  }

  // Add new method to apply filters
  applyFilters() {
    console.log('Applying filters:', {
      searchTerm: this.searchTerm,
          selectedOrganizationId: this.selectedOrganizationId,
      selectedStatus: this.selectedStatus,
      selectedRole: this.selectedRole
    });
    
    this.filteredEmployees = this.employees.filter(employee => {
      // Search term filter
      const searchMatch = !this.searchTerm || 
        employee.firstName.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        employee.lastName.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        employee.email.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        employee.employeeId.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        employee.position.toLowerCase().includes(this.searchTerm.toLowerCase());

      // Department filter
      const departmentMatch = !this.selectedOrganizationId ||
        employee.departmentId === parseInt(this.selectedOrganizationId, 10);
      
      console.log(`Employee ${employee.firstName} ${employee.lastName}: departmentId=${employee.departmentId}, selectedOrganizationId=${this.selectedOrganizationId}, departmentMatch=${departmentMatch}`);

      // Status filter
      const statusMatch = !this.selectedStatus || 
        employee.employmentStatus === this.selectedStatus;

      // Role filter
      const roleMatch = !this.selectedRole || 
        employee.systemRole === this.selectedRole;

      return searchMatch && departmentMatch && statusMatch && roleMatch;
    });
    
    console.log(`Filtered employees: ${this.filteredEmployees.length} of ${this.employees.length}`);
  }

  // Method to handle search term changes
  onSearchChange() {
    this.applyFilters();
  }

  // Method to handle department filter changes
  onDepartmentChange() {
    console.log('Department filter changed to:', this.selectedOrganizationId);
    this.applyFilters();
  }

  // Method to handle status filter changes
  onStatusChange() {
    this.applyFilters();
  }

  // Method to handle role filter changes
  onRoleChange() {
    this.applyFilters();
  }

  // Method to clear all filters
  clearFilters() {
    this.searchTerm = '';
    this.selectedOrganizationId = '';
    this.selectedStatus = '';
    this.selectedRole = '';
    this.applyFilters();
  }

  // Method to populate form for editing
  populateEmployeeForm(employee: Employee) {
    const mappedDepartmentId = this.getDepartmentIdByName(employee.departmentName);
    console.log('Populating form for employee:', employee.firstName, employee.lastName);
    console.log('Employee department name:', employee.departmentName);
    console.log('Mapped department ID:', mappedDepartmentId);
    console.log('Available departments:', this.departments);
    
    this.employeeForm = {
      employeeId: employee.employeeId,
      firstName: employee.firstName,
      lastName: employee.lastName,
      email: employee.email,
      dateOfBirth: this.formatDateForInput(employee.dateOfBirth),
      hireDate: this.formatDateForInput(employee.hireDate),
      departmentId: mappedDepartmentId, // Use the correct department ID mapping
      position: employee.position,
      salary: employee.salary,
      employmentStatus: employee.employmentStatus,
      systemRole: employee.systemRole,
      photoUrl: (employee as any).photoUrl || ''
    };
  }

  // Method to handle edit button click
  editEmployee(employee: Employee) {
    this.selectedEmployee = employee;
    this.isEditMode = true;
    this.populateEmployeeForm(employee);
  }

  // Method to handle delete button click
  deleteEmployee(employee: Employee) {
    if (confirm(`Are you sure you want to delete ${employee.firstName} ${employee.lastName}? This action cannot be undone.`)) {
      this.isLoading = true;
      
      this.employeeService.deleteEmployee(employee.id).subscribe({
        next: (response) => {
          console.log('Employee deleted successfully:', response);
          
          // Remove employee from local array
          const index = this.employees.findIndex(emp => emp.id === employee.id);
          if (index !== -1) {
            this.employees.splice(index, 1);
          }
          
          // Refresh departments and apply filters
          this.refreshDepartments();
          
          // Show success message
          this.showSuccessMessage(response.message || 'Employee deleted successfully!');
          
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error deleting employee:', error);
          let errorMessage = 'An error occurred while deleting the employee.';
          
          if (error.error && error.error.message) {
            errorMessage = error.error.message;
          } else if (error.status === 404) {
            errorMessage = 'Employee not found.';
          }
          
          this.showErrorMessage(errorMessage);
          this.isLoading = false;
        }
      });
    }
  }

  // Debug method to test department filtering
  testDepartmentFilter() {
    console.log('Testing department filter...');
    console.log('Current employees:', this.employees.map(e => ({
      name: `${e.firstName} ${e.lastName}`,
      departmentId: e.departmentId,
      departmentName: e.departmentName
    })));
    console.log('Current departments:', this.departments);
    console.log('Selected department ID:', this.selectedOrganizationId);
    
    // Test with first department
    if (this.departments.length > 0) {
      this.selectedOrganizationId = this.departments[0].id.toString();
      console.log('Setting department filter to:', this.selectedOrganizationId);
      this.applyFilters();
    }
  }

  // Debug method to show department mapping
  showDepartmentMapping() {
    console.log('=== Department Mapping Debug ===');
    console.log('Departments:', this.departments);
    console.log('Employees with department info:', this.employees.map(e => ({
      name: `${e.firstName} ${e.lastName}`,
      departmentId: e.departmentId,
      departmentName: e.departmentName,
      mappedId: this.getDepartmentIdByName(e.departmentName)
    })));
  }

  // Method to refresh departments from current employee data
  refreshDepartments() {
    console.log('Refreshing departments from employee data...');
    this.generateDepartmentsFromEmployees();
  }

  // Method to get employee count for a specific department
  getEmployeeCountByDepartment(departmentId: number): number {
    return this.employees.filter(emp => emp.departmentId === departmentId).length;
  }

  // Method to export department data for debugging
  exportDepartmentData() {
    const data = {
      departments: this.departments,
      employees: this.employees.map(emp => ({
        name: `${emp.firstName} ${emp.lastName}`,
        departmentId: emp.departmentId,
        departmentName: emp.departmentName
      })),
      timestamp: new Date().toISOString()
    };
    
    console.log('=== Department Data Export ===');
    console.log(JSON.stringify(data, null, 2));
    
    // Also log to console in a readable format
    console.log('Departments:', this.departments);
    console.log('Employee Department Mapping:', data.employees);
  }
}

