import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HeaderComponent } from '../../../shared/header/header.component';
import { SidebarComponent } from '../../../shared/sidebar/sidebar.component';

interface DashboardMetrics {
  totalEmployees: number;
  activeEmployees: number;
  onLeaveEmployees: number;
  totalDepartments: number;
  currentPayrollCutoff: string;
  nextPayrollDate: string;
  totalLeaveRequests: number;
  pendingApprovals: number;
  totalPayrollAmount: number;
  averageSalary: number;
}

interface Notification {
  id: number;
  type: 'leave' | 'payroll' | 'system' | 'warning';
  title: string;
  message: string;
  timestamp: Date;
  isRead: boolean;
  priority: 'low' | 'medium' | 'high';
}

interface QuickAction {
  id: number;
  title: string;
  description: string;
  icon: string;
  route: string;
  color: string;
  badge?: string;
}

interface ActivityItem {
  id: number;
  type: 'employee' | 'payroll' | 'leave' | 'system';
  action: string;
  user: string;
  details: string;
  timestamp: Date;
  icon: string;
  color: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, HeaderComponent, SidebarComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit, OnDestroy {
  metrics: DashboardMetrics = {
    totalEmployees: 0,
    activeEmployees: 0,
    onLeaveEmployees: 0,
    totalDepartments: 0,
    currentPayrollCutoff: '',
    nextPayrollDate: '',
    totalLeaveRequests: 0,
    pendingApprovals: 0,
    totalPayrollAmount: 0,
    averageSalary: 0
  };

  notifications: Notification[] = [];
  quickActions: QuickAction[] = [];
  recentActivity: ActivityItem[] = [];
  unreadNotifications = 0;

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.loadDashboardData();
    this.loadNotifications();
    this.loadQuickActions();
    this.loadRecentActivity();
  }

  ngOnDestroy(): void {
    // Cleanup if needed
  }

  loadDashboardData(): void {
    // Simulate API call for dashboard metrics
    this.metrics = {
      totalEmployees: 156,
      activeEmployees: 142,
      onLeaveEmployees: 8,
      totalDepartments: 12,
      currentPayrollCutoff: '2024-01-15',
      nextPayrollDate: '2024-01-31',
      totalLeaveRequests: 23,
      pendingApprovals: 7,
      totalPayrollAmount: 2450000,
      averageSalary: 15705
    };
  }

  loadNotifications(): void {
    this.notifications = [
      {
        id: 1,
        type: 'leave',
        title: 'Leave Request Pending',
        message: 'John Smith requested 3 days of vacation leave',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        isRead: false,
        priority: 'medium'
      },
      {
        id: 2,
        type: 'payroll',
        title: 'Payroll Processing Complete',
        message: 'January 2024 payroll has been processed successfully',
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
        isRead: false,
        priority: 'high'
      },
      {
        id: 3,
        type: 'system',
        title: 'System Maintenance',
        message: 'Scheduled maintenance on Sunday, 2:00 AM - 4:00 AM',
        timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
        isRead: true,
        priority: 'low'
      },
      {
        id: 4,
        type: 'warning',
        title: 'Low Leave Balance',
        message: '5 employees have less than 5 days of leave remaining',
        timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000), // 8 hours ago
        isRead: false,
        priority: 'medium'
      },
      {
        id: 5,
        type: 'payroll',
        title: 'Tax Filing Due',
        message: 'Monthly tax filing is due in 3 days',
        timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12 hours ago
        isRead: false,
        priority: 'high'
      }
    ];

    this.unreadNotifications = this.notifications.filter(n => !n.isRead).length;
  }

  loadQuickActions(): void {
    this.quickActions = [
      {
        id: 1,
        title: 'Add Employee',
        description: 'Register new employee',
        icon: 'person_add',
        route: '/admin/employee-management',
        color: 'bg-blue-500 hover:bg-blue-600',
        badge: 'New'
      },
      {
        id: 2,
        title: 'Run Payroll',
        description: 'Process monthly payroll',
        icon: 'payments',
        route: '/admin/payroll-management',
        color: 'bg-green-500 hover:bg-green-600'
      },
      {
        id: 3,
        title: 'Upload Forms',
        description: 'Submit government forms',
        icon: 'upload_file',
        route: '/admin/payroll-management',
        color: 'bg-purple-500 hover:bg-purple-600'
      },
      {
        id: 4,
        title: 'Leave Requests',
        description: 'Review pending requests',
        icon: 'event_note',
        route: '/admin/leave-management',
        color: 'bg-orange-500 hover:bg-orange-600',
        badge: '7'
      },
      {
        id: 5,
        title: 'Reports',
        description: 'Generate reports',
        icon: 'assessment',
        route: '/admin/reports',
        color: 'bg-indigo-500 hover:bg-indigo-600'
      },
      {
        id: 6,
        title: 'Settings',
        description: 'System configuration',
        icon: 'settings',
        route: '/admin/settings',
        color: 'bg-gray-500 hover:bg-gray-600'
      }
    ];
  }

  loadRecentActivity(): void {
    this.recentActivity = [
      {
        id: 1,
        type: 'employee',
        action: 'Added new employee',
        user: 'Sarah Johnson',
        details: 'Added John Smith to Engineering department',
        timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
        icon: 'person_add',
        color: 'text-blue-600'
      },
      {
        id: 2,
        type: 'payroll',
        action: 'Processed payroll',
        user: 'Admin User',
        details: 'January 2024 payroll processed for 142 employees',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        icon: 'payments',
        color: 'text-green-600'
      },
      {
        id: 3,
        type: 'leave',
        action: 'Approved leave request',
        user: 'Manager',
        details: 'Approved vacation leave for Mary Wilson',
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
        icon: 'event_available',
        color: 'text-orange-600'
      },
      {
        id: 4,
        type: 'system',
        action: 'System backup completed',
        user: 'System',
        details: 'Daily backup completed successfully',
        timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
        icon: 'backup',
        color: 'text-gray-600'
      },
      {
        id: 5,
        type: 'employee',
        action: 'Updated employee profile',
        user: 'HR Manager',
        details: 'Updated salary information for David Brown',
        timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000), // 8 hours ago
        icon: 'edit',
        color: 'text-blue-600'
      },
      {
        id: 6,
        type: 'payroll',
        action: 'Generated tax report',
        user: 'Admin User',
        details: 'Monthly tax report generated and exported',
        timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12 hours ago
        icon: 'description',
        color: 'text-green-600'
      }
    ];
  }

  markNotificationAsRead(notification: Notification): void {
    notification.isRead = true;
    this.unreadNotifications = this.notifications.filter(n => !n.isRead).length;
  }

  markAllNotificationsAsRead(): void {
    this.notifications.forEach(n => n.isRead = true);
    this.unreadNotifications = 0;
  }

  navigateToAction(action: QuickAction): void {
    this.router.navigate([action.route]);
  }

  getNotificationIcon(type: string): string {
    const icons: { [key: string]: string } = {
      leave: 'event_note',
      payroll: 'payments',
      system: 'system_update',
      warning: 'warning'
    };
    return icons[type] || 'notifications';
  }

  getNotificationColor(type: string): string {
    const colors: { [key: string]: string } = {
      leave: 'text-orange-600 bg-orange-100',
      payroll: 'text-green-600 bg-green-100',
      system: 'text-blue-600 bg-blue-100',
      warning: 'text-red-600 bg-red-100'
    };
    return colors[type] || 'text-gray-600 bg-gray-100';
  }

  getPriorityColor(priority: string): string {
    const colors: { [key: string]: string } = {
      low: 'bg-gray-100 text-gray-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-red-100 text-red-800'
    };
    return colors[priority] || 'bg-gray-100 text-gray-800';
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }

  formatDate(date: Date): string {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  }

  getTimeAgo(date: Date): string {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  }
}
