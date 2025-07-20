import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

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
export class HeaderComponent {
  @Input() breadcrumbs: Breadcrumb[] = [];
  @Input() title: string = 'Dashboard';
  
  isProfileDropdownOpen = false;
  isMobileMenuOpen = false;
  
  // Sample user data
  currentUser = {
    name: 'John Doe',
    email: 'john.doe@company.com',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
    role: 'Administrator'
  };

  constructor(private router: Router) {}

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
        // Handle logout logic
        console.log('Logging out...');
        this.router.navigate(['/login']);
        break;
    }
    this.closeProfileDropdown();
  }

  navigateToBreadcrumb(breadcrumb: Breadcrumb) {
    if (breadcrumb.path && !breadcrumb.active) {
      this.router.navigate([breadcrumb.path]);
    }
  }
}
