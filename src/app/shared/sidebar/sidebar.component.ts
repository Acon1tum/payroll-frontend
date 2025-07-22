import { Component, Input, Output, EventEmitter, OnInit, HostListener, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd, RouterLink, RouterLinkActive } from '@angular/router';
import { Subscription } from 'rxjs';

interface MenuItem {
  name: string;
  icon: string;
  path?: string;
  children?: MenuItem[];
  roles?: string[];
}

@Component({
  selector: 'app-sidebar',
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss'
})
export class SidebarComponent implements OnInit, OnDestroy {
  @Input() isCollapsed = false;
  @Input() userRole: string = 'admin'; // Default role, can be changed via input
  @Output() toggleCollapse = new EventEmitter<void>();

  menuItems: MenuItem[] = [];
  expandedItem: string | null = null;
  isMobile = window.innerWidth <= 768;

  // Role-based menu configuration
  menuItemsByRole: { [role: string]: MenuItem[] } = {
    admin: [
      { name: 'Dashboard', icon: 'dashboard', path: '/dashboard' },
      { name: 'System Administration', icon: 'admin_panel_settings', children: [
        { name: 'Organization Management', icon: 'business', path: '/org-management' },
        { name: 'User Management', icon: 'manage_accounts', path: '/user-management' },
        { name: 'Department Management', icon: 'apartment', path: '/department-management' },
        { name: 'Employee Management', icon: 'person', path: '/employee-management' }
      ] },
      { name: 'Payroll Management', icon: 'payments', children: [
        { name: 'Run Payroll', icon: 'assessment', path: '/run-payroll' },
        { name: 'Payslip Center', icon: 'assessment', path: '/payslip-center' },
        { name: 'Thirteen Month Pay', icon: 'assessment', path: '/thirteen-month-pay' },
        { name: 'Final Pay Process', icon: 'calculate', path: '/final-pay-process' },
      ] },
      { name: 'Employee Self-Service', icon: 'person', children: [
        { name: 'My Profile', icon: 'account_circle', path: '/employee/profile' },
        { name: 'Time Tracking', icon: 'schedule', path: '/employee/time-tracking' }
      ] },
      { name: 'Contributions & Deductions', icon: 'person', children: [
        { name: 'Mandatory Contirbutions', icon: 'account_circle', path: '/mandatory-contributions' },
        { name: 'Deductions', icon: 'schedule', path: '/deductions' },
        { name: 'Loans', icon: 'schedule', path: '/loans' }
      ] }
    ],
    employee: [
      { name: 'Dashboard', icon: 'dashboard', path: '/dashboard' },
      { name: 'Employee Dashboard', icon: 'person', path: '/employee-dashboard' },
      { name: 'My Profile', icon: 'account_circle', path: '/employee/profile' },
      { name: 'Time Tracking', icon: 'schedule', path: '/employee/time-tracking' },
      { name: 'My Requests', icon: 'request_page', path: '/employee/requests' },
      { name: 'My Reports', icon: 'report', path: '/employee/reports' }
    ]
  };

  get currentMenuItems(): MenuItem[] {
    return this.menuItemsByRole[this.userRole] || [];
  }

  private routerSub: Subscription | undefined;

  constructor(private router: Router) {}

  @HostListener('window:resize', ['$event'])
  onResize() {
    this.isMobile = window.innerWidth <= 768;
  }

  ngOnInit() {
    this.updateMenuItems();
    
    this.routerSub = this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        this.updateMenuItems();
      }
    });
  }

  ngOnDestroy() {
    this.routerSub?.unsubscribe();
  }

  private updateMenuItems() {
    this.menuItems = this.currentMenuItems;
  }

  toggleMenuItem(itemName: string, event: Event) {
    event.preventDefault();
    event.stopPropagation();

    if (this.expandedItem === itemName) {
      this.expandedItem = null;
    } else {
      this.expandedItem = itemName;
    }
  }

  isMenuItemExpanded(itemName: string): boolean {
    return this.expandedItem === itemName;
  }

  onMenuItemClick() {
    if (this.isMobile) {
      // Close sidebar on mobile after menu item click
    }
  }

  toggleSidebar() {
    this.toggleCollapse.emit();
  }


}
