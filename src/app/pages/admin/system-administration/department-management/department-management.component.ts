import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HeaderComponent } from '../../../../shared/header/header.component';
import { SidebarComponent } from '../../../../shared/sidebar/sidebar.component';

interface Department {
  id: number;
  name: string;
  organizationId: number;
  organizationName: string;
  departmentHeadId?: number;
  departmentHeadName?: string;
  memberCount: number;
  description: string;
  status: 'active' | 'inactive';
  createdAt: Date;
  updatedAt: Date;
}

interface Employee {
  id: number;
  name: string;
  email: string;
  position: string;
  departmentId?: number;
  isDepartmentHead: boolean;
}

interface Organization {
  id: number;
  name: string;
}

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
  selectedOrganizationId: number | null = null;
  isLoading = false;
  errorMessage = '';
  isSidebarCollapsed = false;

  // Breadcrumbs for header
  breadcrumbs: Breadcrumb[] = [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'System Administration', path: '/admin/system-administration' },
    { label: 'Department Management', active: true }
  ];

  // Form data
  departmentForm = {
    name: '',
    organizationId: null as number | null,
    description: '',
    status: 'active' as 'active' | 'inactive'
  };

  assignHeadForm = {
    departmentId: null as number | null,
    employeeId: null as number | null
  };

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.isLoading = true;
    // Simulate API calls
    setTimeout(() => {
      // Load organizations
      this.organizations = [
        { id: 1, name: 'TechCorp Solutions' },
        { id: 2, name: 'Global Industries Ltd' },
        { id: 3, name: 'Startup Ventures Inc' }
      ];

      // Load employees
      this.employees = [
        { id: 1, name: 'John Smith', email: 'john.smith@company.com', position: 'Senior Manager', isDepartmentHead: true },
        { id: 2, name: 'Sarah Johnson', email: 'sarah.johnson@company.com', position: 'Team Lead', isDepartmentHead: false },
        { id: 3, name: 'Mike Chen', email: 'mike.chen@company.com', position: 'Project Manager', isDepartmentHead: false },
        { id: 4, name: 'Emily Davis', email: 'emily.davis@company.com', position: 'Senior Developer', isDepartmentHead: false },
        { id: 5, name: 'David Wilson', email: 'david.wilson@company.com', position: 'HR Manager', isDepartmentHead: true },
        { id: 6, name: 'Lisa Brown', email: 'lisa.brown@company.com', position: 'Finance Director', isDepartmentHead: false }
      ];

      // Load departments
      this.departments = [
        {
          id: 1,
          name: 'Software Development',
          organizationId: 1,
          organizationName: 'TechCorp Solutions',
          departmentHeadId: 1,
          departmentHeadName: 'John Smith',
          memberCount: 15,
          description: 'Core software development team responsible for product development',
          status: 'active',
          createdAt: new Date('2024-01-15'),
          updatedAt: new Date('2024-01-15')
        },
        {
          id: 2,
          name: 'Human Resources',
          organizationId: 1,
          organizationName: 'TechCorp Solutions',
          departmentHeadId: 5,
          departmentHeadName: 'David Wilson',
          memberCount: 8,
          description: 'HR department handling recruitment, employee relations, and benefits',
          status: 'active',
          createdAt: new Date('2024-02-20'),
          updatedAt: new Date('2024-02-20')
        },
        {
          id: 3,
          name: 'Marketing',
          organizationId: 2,
          organizationName: 'Global Industries Ltd',
          departmentHeadId: undefined,
          departmentHeadName: undefined,
          memberCount: 12,
          description: 'Marketing team responsible for brand management and campaigns',
          status: 'active',
          createdAt: new Date('2024-03-10'),
          updatedAt: new Date('2024-03-10')
        },
        {
          id: 4,
          name: 'Finance',
          organizationId: 2,
          organizationName: 'Global Industries Ltd',
          departmentHeadId: 6,
          departmentHeadName: 'Lisa Brown',
          memberCount: 6,
          description: 'Finance department handling accounting and financial planning',
          status: 'inactive',
          createdAt: new Date('2024-03-15'),
          updatedAt: new Date('2024-03-15')
        }
      ];

      this.filteredDepartments = [...this.departments];
      this.isLoading = false;
    }, 1000);
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
      const organization = this.organizations.find(org => org.id === this.departmentForm.organizationId);
      const newDept: Department = {
        id: this.departments.length + 1,
        name: this.departmentForm.name,
        organizationId: this.departmentForm.organizationId!,
        organizationName: organization?.name || '',
        memberCount: 0,
        description: this.departmentForm.description,
        status: this.departmentForm.status,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      this.departments.push(newDept);
      this.filteredDepartments = [...this.departments];
    } else if (this.isEditMode && this.selectedDepartment) {
      const organization = this.organizations.find(org => org.id === this.departmentForm.organizationId);
      const index = this.departments.findIndex(dept => dept.id === this.selectedDepartment!.id);
      if (index !== -1) {
        this.departments[index] = {
          ...this.selectedDepartment,
          name: this.departmentForm.name,
          organizationId: this.departmentForm.organizationId!,
          organizationName: organization?.name || '',
          description: this.departmentForm.description,
          status: this.departmentForm.status,
          updatedAt: new Date()
        };
        this.filteredDepartments = [...this.departments];
      }
    }
    this.cancelEdit();
  }

  saveDepartmentHead() {
    if (this.assignHeadForm.employeeId && this.assignHeadForm.departmentId) {
      const employee = this.employees.find(emp => emp.id === this.assignHeadForm.employeeId);
      const deptIndex = this.departments.findIndex(dept => dept.id === this.assignHeadForm.departmentId);
      
      if (deptIndex !== -1 && employee) {
        // Remove previous department head status
        this.employees.forEach(emp => {
          if (emp.departmentId === this.assignHeadForm.departmentId) {
            emp.isDepartmentHead = false;
          }
        });

        // Update employee
        const empIndex = this.employees.findIndex(emp => emp.id === this.assignHeadForm.employeeId);
        if (empIndex !== -1) {
          this.employees[empIndex].isDepartmentHead = true;
          this.employees[empIndex].departmentId = this.assignHeadForm.departmentId;
        }

        // Update department
        this.departments[deptIndex].departmentHeadId = this.assignHeadForm.employeeId;
        this.departments[deptIndex].departmentHeadName = employee.name;
        this.departments[deptIndex].updatedAt = new Date();

        this.filteredDepartments = [...this.departments];
      }
    }
    this.cancelEdit();
  }

  deleteDepartment(department: Department) {
    if (confirm(`Are you sure you want to delete ${department.name}?`)) {
      this.departments = this.departments.filter(dept => dept.id !== department.id);
      this.filteredDepartments = [...this.departments];
    }
  }

  cancelEdit() {
    this.isAddMode = false;
    this.isEditMode = false;
    this.isAssignHeadMode = false;
    this.selectedDepartment = null;
    this.resetDepartmentForm();
    this.resetAssignHeadForm();
  }

  resetDepartmentForm() {
    this.departmentForm = {
      name: '',
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

  toggleStatus(department: Department) {
    department.status = department.status === 'active' ? 'inactive' : 'active';
    department.updatedAt = new Date();
  }

  toggleSidebar() {
    this.isSidebarCollapsed = !this.isSidebarCollapsed;
  }

  getAvailableEmployees(): Employee[] {
    return this.employees.filter(emp => !emp.isDepartmentHead || emp.departmentId === this.assignHeadForm.departmentId);
  }
}
