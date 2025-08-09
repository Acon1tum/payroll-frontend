import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService, User } from '../../services/auth.service';

interface Breadcrumb {
  label: string;
  path?: string;
  active?: boolean;
}

@Component({
  selector: 'app-header',
  imports: [CommonModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent implements OnInit {
  @Input() breadcrumbs: Breadcrumb[] = [];
  @Input() title: string = 'Dashboard';
  
  isProfileDropdownOpen = false;
  isMobileMenuOpen = false;
  
  currentUser: User | null = null;

  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });
  }

  toggleProfileDropdown() {
    this.isProfileDropdownOpen = !this.isProfileDropdownOpen;
  }

  toggleMobileMenu() {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }

  closeProfileDropdown() {
    this.isProfileDropdownOpen = false;
  }

  onProfileAction(action: string) {
    switch (action) {
      case 'profile':
        this.router.navigate(['/profile']);
        break;
      case 'settings':
        this.router.navigate(['/settings']);
        break;
      case 'logout':
        this.authService.logout();
        break;
    }
    this.closeProfileDropdown();
  }

  navigateToBreadcrumb(breadcrumb: Breadcrumb) {
    if (breadcrumb.path && !breadcrumb.active) {
      this.router.navigate([breadcrumb.path]);
    }
  }

  getUserDisplayName(): string {
    if (!this.currentUser) return 'User';
    
    if (this.currentUser.employee) {
      return `${this.currentUser.employee.firstName} ${this.currentUser.employee.lastName}`;
    }
    
    return this.currentUser.email;
  }

  getUserRole(): string {
    if (!this.currentUser) return 'User';
    
    switch (this.currentUser.role) {
      case 'admin':
        return 'System Administrator';
      case 'hrStaff':
        return 'HR Staff';
      case 'payrollManager':
        return 'Payroll Manager';
      case 'employee':
        return 'Employee';
      default:
        return 'User';
    }
  }
}
