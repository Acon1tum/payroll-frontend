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
  isSidebarCollapsed = false;
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
    this.loadData();
  }

  loadData() {
    this.isLoading = true;
    // Simulate API calls
    setTimeout(() => {
      // Load departments
      this.departments = [
        { id: 1, name: 'Software Development' },
        { id: 2, name: 'Human Resources' },
        { id: 3, name: 'Marketing' },
        { id: 4, name: 'Finance' },
        { id: 5, name: 'Sales' },
        { id: 6, name: 'Operations' }
      ];

      // Load employees
      this.employees = [
        {
          id: 1,
          employeeId: 'EMP001',
          firstName: 'John',
          lastName: 'Smith',
          email: 'john.smith@company.com',
          phone: '+1 (555) 123-4567',
          dateOfBirth: new Date('1985-03-15'),
          hireDate: new Date('2020-01-15'),
          departmentId: 1,
          departmentName: 'Software Development',
          position: 'Senior Software Engineer',
          salary: 85000,
          employmentStatus: 'active',
          systemRole: 'employee',
          managerId: 3,
          managerName: 'Sarah Johnson',
          address: '123 Main St, City, State 12345',
          emergencyContact: {
            name: 'Jane Smith',
            relationship: 'Spouse',
            phone: '+1 (555) 987-6543'
          },
          employmentHistory: [
            {
              id: 1,
              position: 'Software Engineer',
              department: 'Software Development',
              startDate: new Date('2020-01-15'),
              salary: 75000
            }
          ],
          createdAt: new Date('2020-01-15'),
          updatedAt: new Date('2024-01-15')
        },
        {
          id: 2,
          employeeId: 'EMP002',
          firstName: 'Sarah',
          lastName: 'Johnson',
          email: 'sarah.johnson@company.com',
          phone: '+1 (555) 234-5678',
          dateOfBirth: new Date('1988-07-22'),
          hireDate: new Date('2019-06-01'),
          departmentId: 1,
          departmentName: 'Software Development',
          position: 'Engineering Manager',
          salary: 95000,
          employmentStatus: 'active',
          systemRole: 'admin',
          address: '456 Oak Ave, City, State 12345',
          emergencyContact: {
            name: 'Mike Johnson',
            relationship: 'Spouse',
            phone: '+1 (555) 876-5432'
          },
          employmentHistory: [
            {
              id: 2,
              position: 'Senior Software Engineer',
              department: 'Software Development',
              startDate: new Date('2019-06-01'),
              endDate: new Date('2022-03-01'),
              salary: 85000
            },
            {
              id: 3,
              position: 'Engineering Manager',
              department: 'Software Development',
              startDate: new Date('2022-03-01'),
              salary: 95000
            }
          ],
          createdAt: new Date('2019-06-01'),
          updatedAt: new Date('2024-01-15')
        },
        {
          id: 3,
          employeeId: 'EMP003',
          firstName: 'Mike',
          lastName: 'Chen',
          email: 'mike.chen@company.com',
          phone: '+1 (555) 345-6789',
          dateOfBirth: new Date('1990-11-08'),
          hireDate: new Date('2021-03-10'),
          departmentId: 2,
          departmentName: 'Human Resources',
          position: 'HR Specialist',
          salary: 65000,
          employmentStatus: 'active',
          systemRole: 'hr',
          address: '789 Pine St, City, State 12345',
          emergencyContact: {
            name: 'Lisa Chen',
            relationship: 'Sister',
            phone: '+1 (555) 765-4321'
          },
          employmentHistory: [
            {
              id: 4,
              position: 'HR Specialist',
              department: 'Human Resources',
              startDate: new Date('2021-03-10'),
              salary: 65000
            }
          ],
          createdAt: new Date('2021-03-10'),
          updatedAt: new Date('2024-01-15')
        },
        {
          id: 4,
          employeeId: 'EMP004',
          firstName: 'Emily',
          lastName: 'Davis',
          email: 'emily.davis@company.com',
          phone: '+1 (555) 456-7890',
          dateOfBirth: new Date('1987-04-12'),
          hireDate: new Date('2022-08-15'),
          departmentId: 4,
          departmentName: 'Finance',
          position: 'Financial Analyst',
          salary: 70000,
          employmentStatus: 'resigned',
          systemRole: 'employee',
          address: '321 Elm St, City, State 12345',
          emergencyContact: {
            name: 'Robert Davis',
            relationship: 'Father',
            phone: '+1 (555) 654-3210'
          },
          employmentHistory: [
            {
              id: 5,
              position: 'Financial Analyst',
              department: 'Finance',
              startDate: new Date('2022-08-15'),
              endDate: new Date('2024-01-10'),
              salary: 70000,
              reason: 'Personal reasons'
            }
          ],
          createdAt: new Date('2022-08-15'),
          updatedAt: new Date('2024-01-10')
        },
        {
          id: 5,
          employeeId: 'EMP005',
          firstName: 'David',
          lastName: 'Wilson',
          email: 'david.wilson@company.com',
          phone: '+1 (555) 567-8901',
          dateOfBirth: new Date('1983-09-25'),
          hireDate: new Date('2020-11-01'),
          departmentId: 4,
          departmentName: 'Finance',
          position: 'Payroll Manager',
          salary: 80000,
          employmentStatus: 'active',
          systemRole: 'payroll_manager',
          address: '654 Maple Dr, City, State 12345',
          emergencyContact: {
            name: 'Jennifer Wilson',
            relationship: 'Spouse',
            phone: '+1 (555) 543-2109'
          },
          employmentHistory: [
            {
              id: 6,
              position: 'Payroll Manager',
              department: 'Finance',
              startDate: new Date('2020-11-01'),
              salary: 80000
            }
          ],
          createdAt: new Date('2020-11-01'),
          updatedAt: new Date('2024-01-15')
        },
        {
          id: 6,
          employeeId: 'EMP006',
          firstName: 'Lisa',
          lastName: 'Brown',
          email: 'lisa.brown@company.com',
          phone: '+1 (555) 678-9012',
          dateOfBirth: new Date('1992-05-18'),
          hireDate: new Date('2023-02-01'),
          departmentId: 3,
          departmentName: 'Marketing',
          position: 'Marketing Specialist',
          salary: 60000,
          employmentStatus: 'active',
          systemRole: 'employee',
          address: '987 Cedar Ln, City, State 12345',
          emergencyContact: {
            name: 'Tom Brown',
            relationship: 'Brother',
            phone: '+1 (555) 432-1098'
          },
          employmentHistory: [
            {
              id: 7,
              position: 'Marketing Specialist',
              department: 'Marketing',
              startDate: new Date('2023-02-01'),
              salary: 60000
            }
          ],
          createdAt: new Date('2023-02-01'),
          updatedAt: new Date('2024-01-15')
        },
        {
          id: 7,
          employeeId: 'EMP007',
          firstName: 'James',
          lastName: 'Taylor',
          email: 'james.taylor@company.com',
          phone: '+1 (555) 789-0123',
          dateOfBirth: new Date('1986-12-03'),
          hireDate: new Date('2021-09-15'),
          departmentId: 5,
          departmentName: 'Sales',
          position: 'Sales Representative',
          salary: 55000,
          employmentStatus: 'suspended',
          systemRole: 'employee',
          address: '456 Birch Rd, City, State 12345',
          emergencyContact: {
            name: 'Mary Taylor',
            relationship: 'Mother',
            phone: '+1 (555) 321-0987'
          },
          employmentHistory: [
            {
              id: 8,
              position: 'Sales Representative',
              department: 'Sales',
              startDate: new Date('2021-09-15'),
              endDate: new Date('2024-01-05'),
              salary: 55000,
              reason: 'Policy violation'
            }
          ],
          createdAt: new Date('2021-09-15'),
          updatedAt: new Date('2024-01-05')
        },
        {
          id: 8,
          employeeId: 'EMP008',
          firstName: 'Amanda',
          lastName: 'Garcia',
          email: 'amanda.garcia@company.com',
          phone: '+1 (555) 890-1234',
          dateOfBirth: new Date('1989-08-14'),
          hireDate: new Date('2022-01-10'),
          departmentId: 6,
          departmentName: 'Operations',
          position: 'Operations Coordinator',
          salary: 58000,
          employmentStatus: 'active',
          systemRole: 'employee',
          address: '123 Spruce Ave, City, State 12345',
          emergencyContact: {
            name: 'Carlos Garcia',
            relationship: 'Spouse',
            phone: '+1 (555) 210-9876'
          },
          employmentHistory: [
            {
              id: 9,
              position: 'Operations Coordinator',
              department: 'Operations',
              startDate: new Date('2022-01-10'),
              salary: 58000
            }
          ],
          createdAt: new Date('2022-01-10'),
          updatedAt: new Date('2024-01-15')
        }
      ];

      this.filteredEmployees = [...this.employees];
      this.isLoading = false;
    }, 1000);
  }

  searchEmployees() {
    if (!this.searchTerm.trim() && !this.selectedDepartmentId && !this.selectedStatus && !this.selectedRole) {
      this.filteredEmployees = [...this.employees];
    } else {
      this.filteredEmployees = this.employees.filter(emp =>
        (emp.firstName.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
         emp.lastName.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
         emp.email.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
         emp.employeeId.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
         emp.position.toLowerCase().includes(this.searchTerm.toLowerCase())) &&
        (!this.selectedDepartmentId || emp.departmentId === this.selectedDepartmentId) &&
        (!this.selectedStatus || emp.employmentStatus === this.selectedStatus) &&
        (!this.selectedRole || emp.systemRole === this.selectedRole)
      );
    }
  }

  onFilterChange() {
    this.searchEmployees();
  }

  addEmployee() {
    this.isAddMode = true;
    this.isEditMode = false;
    this.isViewMode = false;
    this.isRoleAssignmentMode = false;
    this.isAccessManagementMode = false;
    this.selectedEmployee = null;
    this.resetEmployeeForm();
  }

  viewEmployee(employee: Employee) {
    this.isViewMode = true;
    this.isAddMode = false;
    this.isEditMode = false;
    this.isRoleAssignmentMode = false;
    this.isAccessManagementMode = false;
    this.selectedEmployee = employee;
  }

  editEmployee(employee: Employee) {
    this.isEditMode = true;
    this.isAddMode = false;
    this.isViewMode = false;
    this.isRoleAssignmentMode = false;
    this.isAccessManagementMode = false;
    this.selectedEmployee = employee;
    this.employeeForm = {
      employeeId: employee.employeeId,
      firstName: employee.firstName,
      lastName: employee.lastName,
      email: employee.email,
      phone: employee.phone,
      dateOfBirth: this.formatDateForInput(employee.dateOfBirth),
      hireDate: this.formatDateForInput(employee.hireDate),
      departmentId: employee.departmentId,
      position: employee.position,
      salary: employee.salary,
      employmentStatus: employee.employmentStatus,
      systemRole: employee.systemRole,
      managerId: employee.managerId || null,
      address: employee.address,
      emergencyContactName: employee.emergencyContact.name,
      emergencyContactRelationship: employee.emergencyContact.relationship,
      emergencyContactPhone: employee.emergencyContact.phone
    };
  }

  assignRole(employee: Employee) {
    this.isRoleAssignmentMode = true;
    this.isAddMode = false;
    this.isEditMode = false;
    this.isViewMode = false;
    this.isAccessManagementMode = false;
    this.selectedEmployee = employee;
    this.roleAssignmentForm = {
      employeeId: employee.id,
      systemRole: employee.systemRole
    };
  }

  manageAccess(employee: Employee) {
    this.isAccessManagementMode = true;
    this.isAddMode = false;
    this.isEditMode = false;
    this.isViewMode = false;
    this.isRoleAssignmentMode = false;
    this.selectedEmployee = employee;
    this.accessManagementForm = {
      employeeId: employee.id,
      email: employee.email,
      resetPassword: false,
      newPassword: ''
    };
  }

  saveEmployee() {
    if (this.isAddMode) {
      const department = this.departments.find(dept => dept.id === this.employeeForm.departmentId);
      const manager = this.employees.find(emp => emp.id === this.employeeForm.managerId);
      
      const newEmployee: Employee = {
        id: this.employees.length + 1,
        employeeId: this.employeeForm.employeeId,
        firstName: this.employeeForm.firstName,
        lastName: this.employeeForm.lastName,
        email: this.employeeForm.email,
        phone: this.employeeForm.phone,
        dateOfBirth: new Date(this.employeeForm.dateOfBirth),
        hireDate: new Date(this.employeeForm.hireDate),
        departmentId: this.employeeForm.departmentId!,
        departmentName: department?.name || '',
        position: this.employeeForm.position,
        salary: this.employeeForm.salary!,
        employmentStatus: this.employeeForm.employmentStatus,
        systemRole: this.employeeForm.systemRole,
        managerId: this.employeeForm.managerId || undefined,
        managerName: manager?.firstName + ' ' + manager?.lastName,
        address: this.employeeForm.address,
        emergencyContact: {
          name: this.employeeForm.emergencyContactName,
          relationship: this.employeeForm.emergencyContactRelationship,
          phone: this.employeeForm.emergencyContactPhone
        },
        employmentHistory: [{
          id: 1,
          position: this.employeeForm.position,
          department: department?.name || '',
          startDate: new Date(this.employeeForm.hireDate),
          salary: this.employeeForm.salary!
        }],
        createdAt: new Date(),
        updatedAt: new Date()
      };
      this.employees.push(newEmployee);
      this.filteredEmployees = [...this.employees];
    } else if (this.isEditMode && this.selectedEmployee) {
      const department = this.departments.find(dept => dept.id === this.employeeForm.departmentId);
      const manager = this.employees.find(emp => emp.id === this.employeeForm.managerId);
      const index = this.employees.findIndex(emp => emp.id === this.selectedEmployee!.id);
      
      if (index !== -1) {
        this.employees[index] = {
          ...this.selectedEmployee,
          employeeId: this.employeeForm.employeeId,
          firstName: this.employeeForm.firstName,
          lastName: this.employeeForm.lastName,
          email: this.employeeForm.email,
          phone: this.employeeForm.phone,
          dateOfBirth: new Date(this.employeeForm.dateOfBirth),
          hireDate: new Date(this.employeeForm.hireDate),
          departmentId: this.employeeForm.departmentId!,
          departmentName: department?.name || '',
          position: this.employeeForm.position,
          salary: this.employeeForm.salary!,
          employmentStatus: this.employeeForm.employmentStatus,
          systemRole: this.employeeForm.systemRole,
          managerId: this.employeeForm.managerId || undefined,
          managerName: manager?.firstName + ' ' + manager?.lastName,
          address: this.employeeForm.address,
          emergencyContact: {
            name: this.employeeForm.emergencyContactName,
            relationship: this.employeeForm.emergencyContactRelationship,
            phone: this.employeeForm.emergencyContactPhone
          },
          updatedAt: new Date()
        };
        this.filteredEmployees = [...this.employees];
      }
    }
    this.cancelEdit();
  }

  saveRoleAssignment() {
    if (this.roleAssignmentForm.employeeId && this.roleAssignmentForm.systemRole) {
      const index = this.employees.findIndex(emp => emp.id === this.roleAssignmentForm.employeeId);
      if (index !== -1) {
        this.employees[index].systemRole = this.roleAssignmentForm.systemRole;
        this.employees[index].updatedAt = new Date();
        this.filteredEmployees = [...this.employees];
      }
    }
    this.cancelEdit();
  }

  saveAccessManagement() {
    if (this.accessManagementForm.employeeId) {
      const index = this.employees.findIndex(emp => emp.id === this.accessManagementForm.employeeId);
      if (index !== -1) {
        this.employees[index].email = this.accessManagementForm.email;
        this.employees[index].updatedAt = new Date();
        this.filteredEmployees = [...this.employees];
        
        if (this.accessManagementForm.resetPassword) {
          // In a real app, this would trigger a password reset email
          alert('Password reset email sent to ' + this.accessManagementForm.email);
        }
      }
    }
    this.cancelEdit();
  }

  deleteEmployee(employee: Employee) {
    if (confirm(`Are you sure you want to delete ${employee.firstName} ${employee.lastName}?`)) {
      this.employees = this.employees.filter(emp => emp.id !== employee.id);
      this.filteredEmployees = [...this.employees];
    }
  }

  updateEmploymentStatus(employee: Employee, status: 'active' | 'resigned' | 'suspended' | 'terminated') {
    employee.employmentStatus = status;
    employee.updatedAt = new Date();
    
    if (status !== 'active') {
      const endDate = new Date();
      const lastHistory = employee.employmentHistory[employee.employmentHistory.length - 1];
      if (lastHistory && !lastHistory.endDate) {
        lastHistory.endDate = endDate;
        lastHistory.reason = status === 'resigned' ? 'Resigned' : 
                           status === 'suspended' ? 'Suspended' : 'Terminated';
      }
    }
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

  toggleSidebar() {
    this.isSidebarCollapsed = !this.isSidebarCollapsed;
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

