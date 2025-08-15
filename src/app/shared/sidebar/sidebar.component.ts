import { Component, OnInit, OnDestroy, HostListener, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd, RouterLink, RouterLinkActive } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { SidebarService } from './sidebar.service';

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
export class SidebarComponent implements OnInit, OnDestroy, OnChanges {
  @Input() isCollapsed = false;
  @Input() userRole: string | undefined;
  @Output() toggleCollapse = new EventEmitter<void>();
  menuItems: MenuItem[] = [];
  expandedItem: string | null = null;
  isMobile = window.innerWidth <= 768;
  private internalIsCollapsed = false;
  private useExternalInput = false;

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
      { name: 'Payroll Management', icon: 'payments', path: '/payroll-management', children: [
        { name: 'Run Payroll', icon: 'assessment', path: '/run-payroll' },
        { name: 'Payslip Center', icon: 'assessment', path: '/payslip-center' },
        { name: 'Thirteen Month Pay', icon: 'assessment', path: '/thirteen-month-pay' },
        { name: 'Final Pay Process', icon: 'calculate', path: '/final-pay-process' },
      ] },
      { name: 'Employee Self-Service', icon: 'person', children: [
        { name: 'My Profile', icon: 'account_circle', path: '/employee/profile' },
        { name: 'Time Tracking', icon: 'schedule', path: '/employee/time-tracking' },
        { name: 'Request Loan', icon: 'request_page', path: '/request-loan' },
      ] },
      { name: 'Contributions & Deductions', icon: 'person', children: [
        { name: 'Mandatory Contirbutions', icon: 'account_circle', path: '/mandatory-contributions' },
        { name: 'Deductions', icon: 'schedule', path: '/deductions' },
        { name: 'Loans', icon: 'schedule', path: '/loans' }
      ] },
      { name: 'Leave Management', icon: 'person', children: [
        { name: 'Leave Requests', icon: 'account_circle', path: '/leave-requests' },
        { name: 'Leave Balance', icon: 'account_circle', path: '/leave-balance' },
        { name: 'Leave Settings', icon: 'schedule', path: '/leave-settings' },
        { name: 'Leave Reports', icon: 'schedule', path: '/leave-reports' }
      ] },
      { name: 'Reports & Remittances', icon: 'person', children: [
        { name: 'Payroll Summary', icon: 'account_circle', path: '/payroll-summary' },
        { name: 'Govt Reports', icon: 'schedule', path: '/govt-reports' },
        { name: 'Loans, leaves, Contributions Summary', icon: 'schedule', path: '/llc-summary' }
      ] },
        { name: 'Bank File Generation', icon: 'account_circle', path: '/bank-file-generation' },
        { name: 'Audit & Logs', icon: 'person', children: [
          { name: 'Activity Logs', icon: 'account_circle', path: '/activity-logs' },
        ] },
        
    ],
    employee: [
      { name: 'Dashboard', icon: 'person', path: '/employee-dashboard' },
      { name: 'My Profile', icon: 'account_circle', path: '/employee/profile' },
      { name: 'My Payslip', icon: 'account_circle', path: '/employee/payslip' },
      { name: 'My Contributions', icon: 'account_circle', path: '/employee/contributions' },
      { name: 'My Leave Management', icon: 'account_circle', path: '/employee/leave-management' },
      { name: '13th Month & Final Pay', icon: 'receipt_long', path: '/employee/13th-final-pay' },
      { name: 'Time Tracking', icon: 'schedule', path: '/employee/time-tracking' },
      { name: 'Request Loan', icon: 'request_page', path: '/request-loan' },
      { name: 'My Reports', icon: 'report', path: '/employee/reports' },
      { name: 'Settings', icon: 'settings', path: '/employee/settings' }
    ]
  };

  get currentMenuItems(): MenuItem[] {
    const role = this.userRole || this.auth.currentUser?.role || 'employee';
    return this.menuItemsByRole[role] || [];
  }

  private routerSub: Subscription | undefined;
  private authSub: Subscription | undefined;
  private sidebarSub: Subscription | undefined;

  constructor(
    private router: Router, 
    private auth: AuthService,
    private sidebarService: SidebarService
  ) {}

  @HostListener('window:resize', ['$event'])
  onResize() {
    this.isMobile = window.innerWidth <= 768;
  }

  ngOnInit() {
    this.updateMenuItems();
    
    // Subscribe to sidebar state changes from service
    this.sidebarSub = this.sidebarService.isCollapsed$.subscribe(
      collapsed => {
        this.internalIsCollapsed = collapsed;
        // Only update if we're not using external input
        if (!this.useExternalInput) {
          this.isCollapsed = collapsed;
        }
      }
    );
    
    // React to auth user changes and router navigation
    this.authSub = this.auth.currentUser$.subscribe(() => {
      this.updateMenuItems();
    });

    this.routerSub = this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        this.updateMenuItems();
      }
    });
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['isCollapsed']) {
      if (changes['isCollapsed'].firstChange) {
        // On first change, check if we should use external input
        this.useExternalInput = this.isCollapsed !== false;
        if (this.useExternalInput) {
          // Update service to match external input
          this.sidebarService.setSidebarState(this.isCollapsed);
        }
      } else {
        // On subsequent changes, always update service
        this.sidebarService.setSidebarState(this.isCollapsed);
      }
    }
  }

  ngOnDestroy() {
    this.routerSub?.unsubscribe();
    this.authSub?.unsubscribe();
    this.sidebarSub?.unsubscribe();
  }

  private updateMenuItems() {
    this.menuItems = this.currentMenuItems;
    // Auto-expand parent menu items based on current route
    this.autoExpandActiveMenu();
  }

  private autoExpandActiveMenu() {
    const currentUrl = this.router.url;
    
    // Find which parent menu item should be expanded based on current route
    for (const item of this.menuItems) {
      if (item.children) {
        // Check if any child route matches current URL
        const hasActiveChild = item.children.some(child => 
          child.path && currentUrl.startsWith(child.path)
        );
        
        // Check if the parent route itself matches current URL
        const isParentActive = item.path && currentUrl.startsWith(item.path);
        
        if (hasActiveChild || isParentActive) {
          this.expandedItem = item.name;
          break;
        }
      }
    }
  }

  toggleMenuItem(itemName: string, event: Event) {
    event.preventDefault();
    event.stopPropagation();

    // Find the menu item
    const menuItem = this.menuItems.find(item => item.name === itemName);
    
    if (menuItem) {
      if (menuItem.children) {
        // If it has children, toggle expansion
        if (this.expandedItem === itemName) {
          this.expandedItem = null;
        } else {
          this.expandedItem = itemName;
        }
      }
      // If it has a path, navigation will be handled by routerLink in the template
    }
  }

  isMenuItemExpanded(itemName: string): boolean {
    return this.expandedItem === itemName;
  }

  onMenuItemClick() {
    if (this.isMobile) {
      // Close sidebar on mobile after menu item click
      // You can add logic here to close the sidebar on mobile if needed
    }
    // Don't reset expanded state - let it persist
  }

  toggleSidebar() {
    if (this.useExternalInput) {
      // If using external input, just emit the event
      this.toggleCollapse.emit();
    } else {
      // If using internal state, toggle the service
      this.sidebarService.toggleSidebar();
      this.toggleCollapse.emit();
    }
  }
}
