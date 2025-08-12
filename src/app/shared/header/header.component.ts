import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService, User } from '../../services/auth.service';
import { SidebarService } from '../sidebar/sidebar.service';

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
export class HeaderComponent implements OnInit, OnDestroy {
  @Input() breadcrumbs: Breadcrumb[] = [];
  @Input() title: string = 'Dashboard';
  
  isProfileDropdownOpen = false;
  isMobileMenuOpen = false;
  isSidebarCollapsed = false;
  
  currentUser: User | null = null;

  private sidebarSub: Subscription | undefined;

  constructor(
    private router: Router,
    private authService: AuthService,
    private sidebarService: SidebarService
  ) {}

  ngOnInit() {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });

    // Subscribe to sidebar state changes
    this.sidebarSub = this.sidebarService.isCollapsed$.subscribe(
      collapsed => this.isSidebarCollapsed = collapsed
    );
  }

  ngOnDestroy() {
    this.sidebarSub?.unsubscribe();
  }

  toggleProfileDropdown() {
    this.isProfileDropdownOpen = !this.isProfileDropdownOpen;
  }

  toggleMobileMenu() {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }

  toggleSidebar() {
    this.sidebarService.toggleSidebar();
  }

  closeProfileDropdown() {
    this.isProfileDropdownOpen = false;
  }

  onProfileAction(action: string) {
    switch (action) {
      case 'profile':
        this.router.navigate(['/employee/profile']);
        break;
      case 'settings':
        this.router.navigate(['/employee/settings']);
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
