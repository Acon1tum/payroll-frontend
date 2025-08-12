import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HeaderComponent } from '../../../shared/header/header.component';
import { SidebarComponent } from '../../../shared/sidebar/sidebar.component';

interface Employee {
  id: number;
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: Date;
  hireDate: Date;
  departmentId: number;
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
  selectedDepartmentId: number | null = null;
  selectedStatus: string = '';
  selectedRole: string = '';
  isLoading = false;
  errorMessage = '';
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
    phone: '',
    dateOfBirth: '',
    hireDate: '',
    departmentId: null as number | null,
    position: '',
    salary: null as number | null,
    employmentStatus: 'active' as 'active' | 'resigned' | 'suspended' | 'terminated',
    systemRole: 'employee' as 'admin' | 'hr' | 'payroll_manager' | 'employee',
    managerId: null as number | null,
    address: '',
    emergencyContactName: '',
    emergencyContactRelationship: '',
    emergencyContactPhone: ''
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

  ngOnInit() {
    this.loadEmployees();
    this.loadDepartments();
  }

  loadEmployees() {
    this.isLoading = true;
    // Simulate API call
    setTimeout(() => {
      this.employees = [
        {
          id: 1,
          employeeId: 'EMP001',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@company.com',
          phone: '+1-555-0123',
          dateOfBirth: new Date('1990-05-15'),
          hireDate: new Date('2020-03-01'),
          departmentId: 1,
          departmentName: 'Engineering',
          position: 'Senior Software Engineer',
          salary: 85000,
          employmentStatus: 'active',
          systemRole: 'employee',
          address: '123 Main St, City, State 12345',
          emergencyContact: {
            name: 'Jane Doe',
            relationship: 'Spouse',
            phone: '+1-555-0124'
          },
          employmentHistory: [
            {
              id: 1,
              position: 'Software Engineer',
              department: 'Engineering',
              startDate: new Date('2020-03-01'),
              endDate: new Date('2022-06-30'),
              salary: 75000
            },
            {
              id: 2,
              position: 'Senior Software Engineer',
              department: 'Engineering',
              startDate: new Date('2022-07-01'),
              salary: 85000
            }
          ],
          createdAt: new Date('2020-03-01'),
          updatedAt: new Date('2024-01-15')
        },
        {
          id: 2,
          employeeId: 'EMP002',
          firstName: 'Jane',
          lastName: 'Smith',
          email: 'jane.smith@company.com',
          phone: '+1-555-0125',
          dateOfBirth: new Date('1985-08-22'),
          hireDate: new Date('2019-11-15'),
          departmentId: 2,
          departmentName: 'Human Resources',
          position: 'HR Manager',
          salary: 75000,
          employmentStatus: 'active',
          systemRole: 'hr',
          managerId: 1,
          managerName: 'John Doe',
          address: '456 Oak Ave, City, State 12345',
          emergencyContact: {
            name: 'Bob Smith',
            relationship: 'Spouse',
            phone: '+1-555-0126'
          },
          employmentHistory: [
            {
              id: 3,
              position: 'HR Manager',
              department: 'Human Resources',
              startDate: new Date('2019-11-15'),
              salary: 75000
            }
          ],
          createdAt: new Date('2019-11-15'),
          updatedAt: new Date('2024-01-10')
        }
      ];
      this.filteredEmployees = [...this.employees];
      this.isLoading = false;
    }, 1000);
  }

  loadDepartments() {
    // Simulate API call
    setTimeout(() => {
      this.departments = [
        { id: 1, name: 'Engineering' },
        { id: 2, name: 'Human Resources' },
        { id: 3, name: 'Finance' },
        { id: 4, name: 'Marketing' },
        { id: 5, name: 'Sales' }
      ];
    }, 500);
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
    // Implementation for saving employee
    console.log('Saving employee:', this.employeeForm);
    this.cancelEdit();
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
      phone: '',
      dateOfBirth: '',
      hireDate: '',
      departmentId: null,
      position: '',
      salary: null,
      employmentStatus: 'active',
      systemRole: 'employee',
      managerId: null,
      address: '',
      emergencyContactName: '',
      emergencyContactRelationship: '',
      emergencyContactPhone: ''
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

  getAvailableManagers(): Employee[] {
    return this.employees.filter(emp => 
      emp.employmentStatus === 'active' && 
      emp.id !== this.selectedEmployee?.id
    );
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
}

