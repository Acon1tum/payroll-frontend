import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HeaderComponent } from '../../../../shared/header/header.component';
import { SidebarComponent } from '../../../../shared/sidebar/sidebar.component';
import { UserService, User, CreateUserDto, UpdateUserDto, ChangePasswordDto, AssignRoleDto } from '../../../../services/user.service';
import { catchError, finalize } from 'rxjs/operators';
import { of } from 'rxjs';

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
  selector: 'app-user-management',
  standalone: true,
  imports: [CommonModule, FormsModule, HeaderComponent, SidebarComponent],
  templateUrl: './user-management.component.html',
  styleUrl: './user-management.component.scss'
})
export class UserManagementComponent implements OnInit {
  users: User[] = [];
  filteredUsers: User[] = [];
  selectedUser: User | null = null;
  isAddMode = false;
  isEditMode = false;
  isViewMode = false;
  isRoleAssignmentMode = false;
  isAccessManagementMode = false;
  searchTerm = '';
  selectedRole: string = '';
  isLoading = false;
  errorMessage = '';
  successMessage = '';
  currentTab = 'list'; // 'list', 'roles', 'access'

  // Breadcrumbs for header
  breadcrumbs: Breadcrumb[] = [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'System Administration', path: '/admin/system-administration' },
    { label: 'User Management', active: true }
  ];

  // System roles configuration
  systemRoles: SystemRole[] = [
    { value: 'admin', label: 'Admin', description: 'Full system access and administration' },
    { value: 'hrStaff', label: 'HR Staff', description: 'Human resources management and employee records' },
    { value: 'payrollManager', label: 'Payroll Manager', description: 'Payroll processing and financial management' },
    { value: 'employee', label: 'Employee', description: 'Basic employee access and self-service' }
  ];

  // Form data
  userForm = {
    email: '',
    password: '',
    role: 'employee' as 'admin' | 'hrStaff' | 'payrollManager' | 'employee'
  };

  roleAssignmentForm = {
    userId: null as string | null,
    role: 'employee' as 'admin' | 'hrStaff' | 'payrollManager' | 'employee'
  };

  accessManagementForm = {
    userId: null as string | null,
    email: '',
    resetPassword: false,
    newPassword: ''
  };

  constructor(private userService: UserService) {}

  ngOnInit() {
    // Debug: Check authentication status
    console.log('=== User Management Component Debug ===');
    console.log('Auth service:', this.userService['auth']);
    console.log('Current user:', this.userService['auth'].currentUser);
    console.log('Is authenticated:', this.userService['auth'].isAuthenticated);
    console.log('Token:', this.userService['auth'].token);
    console.log('=====================================');
    
    this.loadUsers();
  }

  loadUsers() {
    this.isLoading = true;
    this.errorMessage = '';
    
    // Debug: Log current user and token
    console.log('Current user:', this.userService['auth'].currentUser);
    console.log('Current user role:', this.userService['auth'].currentUser?.role);
    console.log('Token exists:', !!this.userService['auth'].token);
    
    this.userService.getUsers()
      .pipe(
        catchError(error => {
          console.error('Error loading users:', error);
          this.errorMessage = 'Failed to load users. Please try again.';
          return of({ success: false, data: [] });
        }),
        finalize(() => this.isLoading = false)
      )
      .subscribe(response => {
        if (response.success) {
          this.users = response.data;
          this.filteredUsers = [...this.users];
        }
      });
  }

  cancelEdit() {
    this.isAddMode = false;
    this.isEditMode = false;
    this.isViewMode = false;
    this.isRoleAssignmentMode = false;
    this.isAccessManagementMode = false;
    this.selectedUser = null;
    this.resetUserForm();
    this.resetRoleAssignmentForm();
    this.resetAccessManagementForm();
    this.successMessage = '';
    this.errorMessage = '';
  }

  saveUser() {
    if (this.isAddMode) {
      const userData: CreateUserDto = {
        email: this.userForm.email,
        password: this.userForm.password,
        role: this.userForm.role
      };

      this.userService.createUser(userData)
        .pipe(
          catchError(error => {
            console.error('Error creating user:', error);
            this.errorMessage = 'Failed to create user. Please try again.';
            return of({ success: false, data: {} as User });
          })
        )
        .subscribe(response => {
          if (response.success) {
            this.successMessage = 'User created successfully!';
            this.loadUsers();
            setTimeout(() => this.cancelEdit(), 2000);
          }
        });
    } else if (this.isEditMode && this.selectedUser) {
      const userData: UpdateUserDto = {
        email: this.userForm.email,
        role: this.userForm.role
      };

      this.userService.updateUser(this.selectedUser.id, userData)
        .pipe(
          catchError(error => {
            console.error('Error updating user:', error);
            this.errorMessage = 'Failed to update user. Please try again.';
            return of({ success: false, data: {} as User });
          })
        )
        .subscribe(response => {
          if (response.success) {
            this.successMessage = 'User updated successfully!';
            this.loadUsers();
            setTimeout(() => this.cancelEdit(), 2000);
          }
        });
    }
  }

  saveRoleAssignment() {
    if (this.roleAssignmentForm.userId) {
      const roleData: AssignRoleDto = {
        role: this.roleAssignmentForm.role
      };

      this.userService.assignRole(this.roleAssignmentForm.userId, roleData)
        .pipe(
          catchError(error => {
            console.error('Error assigning role:', error);
            this.errorMessage = 'Failed to assign role. Please try again.';
            return of({ success: false, message: '' });
          })
        )
        .subscribe(response => {
          if (response.success) {
            this.successMessage = 'Role assigned successfully!';
            this.loadUsers();
            setTimeout(() => this.cancelEdit(), 2000);
          }
        });
    }
  }

  saveAccessManagement() {
    if (this.accessManagementForm.userId && this.accessManagementForm.resetPassword) {
      const passwordData: ChangePasswordDto = {
        newPassword: this.accessManagementForm.newPassword
      };

      this.userService.changePassword(this.accessManagementForm.userId, passwordData)
        .pipe(
          catchError(error => {
            console.error('Error changing password:', error);
            this.errorMessage = 'Failed to change password. Please try again.';
            return of({ success: false, message: '' });
          })
        )
        .subscribe(response => {
          if (response.success) {
            this.successMessage = 'Password changed successfully!';
            this.loadUsers();
            setTimeout(() => this.cancelEdit(), 2000);
          }
        });
    }
  }

  deleteUser(user: User) {
    if (confirm(`Are you sure you want to delete user ${user.email}?`)) {
      this.userService.deleteUser(user.id)
        .pipe(
          catchError(error => {
            console.error('Error deleting user:', error);
            this.errorMessage = 'Failed to delete user. Please try again.';
            return of({ success: false, message: '' });
          })
        )
        .subscribe(response => {
          if (response.success) {
            this.successMessage = 'User deleted successfully!';
            this.loadUsers();
            setTimeout(() => this.successMessage = '', 3000);
          }
        });
    }
  }

  resetUserForm() {
    this.userForm = {
      email: '',
      password: '',
      role: 'employee'
    };
  }

  resetRoleAssignmentForm() {
    this.roleAssignmentForm = {
      userId: null,
      role: 'employee'
    };
  }

  resetAccessManagementForm() {
    this.accessManagementForm = {
      userId: null,
      email: '',
      resetPassword: false,
      newPassword: ''
    };
  }

  addUser() {
    this.isAddMode = true;
    this.isEditMode = false;
    this.isViewMode = false;
    this.isRoleAssignmentMode = false;
    this.isAccessManagementMode = false;
    this.selectedUser = null;
    this.resetUserForm();
  }

  editUser(user: User) {
    this.selectedUser = user;
    this.isEditMode = true;
    this.isAddMode = false;
    this.isViewMode = false;
    this.isRoleAssignmentMode = false;
    this.isAccessManagementMode = false;
    
    this.userForm = {
      email: user.email,
      password: '',
      role: user.role
    };
  }

  viewUser(user: User) {
    this.selectedUser = user;
    this.isViewMode = true;
    this.isAddMode = false;
    this.isEditMode = false;
    this.isRoleAssignmentMode = false;
    this.isAccessManagementMode = false;
  }

  assignRole(user: User) {
    this.selectedUser = user;
    this.isRoleAssignmentMode = true;
    this.isAddMode = false;
    this.isEditMode = false;
    this.isViewMode = false;
    this.isAccessManagementMode = false;
    
    this.roleAssignmentForm = {
      userId: user.id,
      role: user.role
    };
  }

  manageAccess(user: User) {
    this.selectedUser = user;
    this.isAccessManagementMode = true;
    this.isAddMode = false;
    this.isEditMode = false;
    this.isViewMode = false;
    this.isRoleAssignmentMode = false;
    
    this.accessManagementForm = {
      userId: user.id,
      email: user.email,
      resetPassword: false,
      newPassword: ''
    };
  }

  getRoleLabel(role: string): string {
    const roleObj = this.systemRoles.find(r => r.value === role);
    return roleObj ? roleObj.label : role;
  }

  getRoleDescription(role: string): string {
    const roleObj = this.systemRoles.find(r => r.value === role);
    return roleObj ? roleObj.description : '';
  }

  getRoleColor(role: string): string {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'hrStaff': return 'bg-blue-100 text-blue-800';
      case 'payrollManager': return 'bg-green-100 text-green-800';
      case 'employee': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  formatDate(date: string | Date): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getFullName(user: User): string {
    if (user.employee) {
      return `${user.employee.firstName} ${user.employee.lastName}`;
    }
    return 'No Employee Record';
  }

  getUsersByRole(roleValue: string): User[] {
    return this.users.filter(user => user.role === roleValue);
  }

  getUserCountByRole(roleValue: string): number {
    return this.users.filter(user => user.role === roleValue).length;
  }

  filterUsers() {
    if (!this.searchTerm && !this.selectedRole) {
      this.filteredUsers = [...this.users];
      return;
    }

    this.filteredUsers = this.users.filter(user => {
      const matchesSearch = !this.searchTerm || 
        user.email.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        (user.employee && (
          user.employee.firstName.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
          user.employee.lastName.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
          user.employee.employeeNumber.toLowerCase().includes(this.searchTerm.toLowerCase())
        ));
      
      const matchesRole = !this.selectedRole || user.role === this.selectedRole;
      
      return matchesSearch && matchesRole;
    });
  }

  onSearchChange() {
    this.filterUsers();
  }

  onRoleFilterChange() {
    this.filterUsers();
  }

  clearFilters() {
    this.searchTerm = '';
    this.selectedRole = '';
    this.filterUsers();
  }
}
