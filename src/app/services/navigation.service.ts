import { Injectable } from '@angular/core';
import { AuthService, User } from './auth.service';

export interface NavigationItem {
  path: string;
  label: string;
  icon?: string;
  roles: string[];
  children?: NavigationItem[];
}

@Injectable({
  providedIn: 'root'
})
export class NavigationService {
  
  private readonly navigationItems: NavigationItem[] = [
    // Admin Navigation
    {
      path: '/dashboard',
      label: 'Dashboard',
      icon: 'dashboard',
      roles: ['admin', 'hrStaff', 'payrollManager']
    },
    {
      path: '/employee-management',
      label: 'Employee Management',
      icon: 'people',
      roles: ['admin', 'hrStaff'],
      children: [
        {
          path: '/employee-management',
          label: 'Employee List',
          roles: ['admin', 'hrStaff']
        }
      ]
    },
    {
      path: '/payroll-management',
      label: 'Payroll Management',
      icon: 'account_balance_wallet',
      roles: ['admin', 'payrollManager'],
      children: [
        {
          path: '/run-payroll',
          label: 'Run Payroll',
          roles: ['admin', 'payrollManager']
        },
        {
          path: '/payslip-center',
          label: 'Payslip Center',
          roles: ['admin', 'payrollManager']
        },
        {
          path: '/final-pay-process',
          label: 'Final Pay Process',
          roles: ['admin', 'payrollManager']
        },
        {
          path: '/thirteen-month-pay',
          label: '13th Month Pay',
          roles: ['admin', 'payrollManager']
        }
      ]
    },
    {
      path: '/contributions-deductions',
      label: 'Contributions & Deductions',
      icon: 'account_balance',
      roles: ['admin', 'hrStaff', 'payrollManager'],
      children: [
        {
          path: '/mandatory-contributions',
          label: 'Mandatory Contributions',
          roles: ['admin', 'hrStaff', 'payrollManager']
        },
        {
          path: '/deductions',
          label: 'Deductions',
          roles: ['admin', 'hrStaff', 'payrollManager']
        },
        {
          path: '/loans',
          label: 'Loans',
          roles: ['admin', 'hrStaff', 'payrollManager']
        }
      ]
    },
    {
      path: '/leave-management',
      label: 'Leave Management',
      icon: 'event',
      roles: ['admin', 'hrStaff'],
      children: [
        {
          path: '/leave-requests',
          label: 'Leave Requests',
          roles: ['admin', 'hrStaff']
        },
        {
          path: '/leave-settings',
          label: 'Leave Settings',
          roles: ['admin', 'hrStaff']
        },
        {
          path: '/leave-reports',
          label: 'Leave Reports',
          roles: ['admin', 'hrStaff']
        }
      ]
    },
    {
      path: '/reports-remittances',
      label: 'Reports & Remittances',
      icon: 'assessment',
      roles: ['admin', 'payrollManager'],
      children: [
        {
          path: '/payroll-summary',
          label: 'Payroll Summary',
          roles: ['admin', 'payrollManager']
        },
        {
          path: '/llc-summary',
          label: 'LLC Summary',
          roles: ['admin', 'payrollManager']
        },
        {
          path: '/govt-reports',
          label: 'Government Reports',
          roles: ['admin', 'payrollManager']
        }
      ]
    },
    {
      path: '/bank-file-generation',
      label: 'Bank File Generation',
      icon: 'account_balance',
      roles: ['admin', 'payrollManager']
    },
    {
      path: '/audit-trail',
      label: 'Audit Trail',
      icon: 'security',
      roles: ['admin'],
      children: [
        {
          path: '/activity-logs',
          label: 'Activity Logs',
          roles: ['admin']
        },
        {
          path: '/access-logs',
          label: 'Access Logs',
          roles: ['admin']
        }
      ]
    },
    // Employee Navigation
    {
      path: '/employee-dashboard',
      label: 'Dashboard',
      icon: 'dashboard',
      roles: ['employee']
    },
    {
      path: '/employee/profile',
      label: 'Profile',
      icon: 'person',
      roles: ['employee']
    },
    {
      path: '/employee/payslip',
      label: 'Payslip',
      icon: 'receipt',
      roles: ['employee']
    },
    {
      path: '/employee/contributions',
      label: 'Contributions',
      icon: 'account_balance',
      roles: ['employee']
    },
    {
      path: '/employee/leave-management',
      label: 'Leave Management',
      icon: 'event',
      roles: ['employee']
    },
    {
      path: '/employee/13th-final-pay',
      label: '13th Month & Final Pay',
      icon: 'account_balance_wallet',
      roles: ['employee']
    },
    {
      path: '/request-loan',
      label: 'Request Loan',
      icon: 'credit_card',
      roles: ['employee']
    },
    {
      path: '/employee/settings',
      label: 'Settings',
      icon: 'settings',
      roles: ['employee']
    },
    {
      path: '/employee/reports',
      label: 'Reports',
      icon: 'assessment',
      roles: ['employee']
    }
  ];

  constructor(private authService: AuthService) {}

  /**
   * Get navigation items based on user role
   */
  getNavigationItems(): NavigationItem[] {
    const currentUser = this.authService.currentUser;
    if (!currentUser) {
      return [];
    }

    return this.navigationItems.filter(item => 
      this.hasAccess(item, currentUser.role)
    );
  }

  /**
   * Get navigation items for a specific role
   */
  getNavigationItemsByRole(role: string): NavigationItem[] {
    return this.navigationItems.filter(item => 
      this.hasAccess(item, role)
    );
  }

  /**
   * Check if user has access to a specific navigation item
   */
  hasAccess(item: NavigationItem, userRole: string): boolean {
    if (!item.roles || item.roles.length === 0) {
      return true;
    }
    return item.roles.includes(userRole);
  }

  /**
   * Check if user can access a specific route
   */
  canAccessRoute(routePath: string): boolean {
    const currentUser = this.authService.currentUser;
    if (!currentUser) {
      return false;
    }

    // Find the navigation item for this route
    const item = this.findNavigationItemByPath(routePath);
    if (!item) {
      return false;
    }

    return this.hasAccess(item, currentUser.role);
  }

  /**
   * Find navigation item by path
   */
  private findNavigationItemByPath(path: string): NavigationItem | null {
    for (const item of this.navigationItems) {
      if (item.path === path) {
        return item;
      }
      if (item.children) {
        const childItem = item.children.find(child => child.path === path);
        if (childItem) {
          return childItem;
        }
      }
    }
    return null;
  }

  /**
   * Get user's default dashboard path
   */
  getDefaultDashboardPath(): string {
    const currentUser = this.authService.currentUser;
    if (!currentUser) {
      return '/login';
    }

    switch (currentUser.role) {
      case 'employee':
        return '/employee-dashboard';
      case 'admin':
      case 'hrStaff':
      case 'payrollManager':
        return '/dashboard';
      default:
        return '/login';
    }
  }

  /**
   * Get all accessible routes for current user
   */
  getAccessibleRoutes(): string[] {
    const currentUser = this.authService.currentUser;
    if (!currentUser) {
      return [];
    }

    const routes: string[] = [];
    
    for (const item of this.navigationItems) {
      if (this.hasAccess(item, currentUser.role)) {
        routes.push(item.path);
        if (item.children) {
          item.children.forEach(child => {
            if (this.hasAccess(child, currentUser.role)) {
              routes.push(child.path);
            }
          });
        }
      }
    }

    return routes;
  }
}
