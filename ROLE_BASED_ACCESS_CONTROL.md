# Role-Based Access Control (RBAC) Implementation

This document describes the implementation of role-based access control in the payroll management system.

## Overview

The system implements a multi-layered security approach to ensure users can only access pages and features appropriate to their role level.

## User Roles

The system supports the following user roles:

- **admin**: Full system access
- **hrStaff**: HR-related functions (employee management, leave management)
- **payrollManager**: Payroll-related functions
- **employee**: Employee self-service functions

## Security Layers

### 1. Route Guards

Four levels of route protection:

#### LoggedInGuard
- Prevents logged-in users from accessing login page
- Redirects logged-in users to appropriate dashboard
- Only applies to public routes (login, root)

#### AuthGuard
- Ensures user is authenticated
- Redirects to login if not authenticated

#### RoleGuard
- Checks if user has required roles for specific routes
- Redirects to unauthorized page if access denied
- Prevents manual URL access to unauthorized routes

#### UnauthorizedAccessGuard
- Prevents direct access to unauthorized page via manual URL input
- Only allows access when redirected there by other guards
- Redirects users to appropriate dashboard if they try to access directly

### 2. Route Configuration

Routes are protected with appropriate guards:

```typescript
// Public routes (logged-in users cannot access)
{ path: 'login', component: LoginComponent, canActivate: [LoggedInGuard] }

// Protected routes with role restrictions
{
  path: 'dashboard',
  component: DashboardComponent,
  canActivate: [AuthGuard, RoleGuard],
  data: { roles: ['admin', 'hrStaff', 'payrollManager'] }
}

// Routes requiring only authentication
{ path: 'landing', component: LandingComponent, canActivate: [AuthGuard] }
```

### 3. Navigation Service

Centralized service managing:
- Role-based navigation items
- Route access validation
- Default dashboard paths per role

## Usage Examples

### In Templates

Use the `appRole` directive to conditionally show elements:

```html
<!-- Show for admin users only -->
<div *appRole="'admin'">
  Admin only content
</div>

<!-- Show for multiple roles -->
<div *appRole="['admin', 'hrStaff']">
  Admin and HR content
</div>

<!-- Show for users with ALL roles (AND operator) -->
<div *appRole="['admin', 'hrStaff']" appRoleOperator="AND">
  User must have both admin AND hrStaff roles
</div>
```

### In Components

```typescript
import { NavigationService } from '../services/navigation.service';
import { AuthService } from '../services/auth.service';

export class MyComponent {
  constructor(
    private navigationService: NavigationService,
    private authService: AuthService
  ) {}

  // Get navigation items for current user
  getNavigationItems() {
    return this.navigationService.getNavigationItems();
  }

  // Check if user can access a specific route
  canAccessRoute(routePath: string): boolean {
    return this.navigationService.canAccessRoute(routePath);
  }

  // Get user's default dashboard
  getDefaultDashboard() {
    return this.navigationService.getDefaultDashboardPath();
  }
}
```

## Route Access Matrix

| Route | Admin | HR Staff | Payroll Manager | Employee |
|-------|-------|----------|-----------------|----------|
| Dashboard | ✅ | ✅ | ✅ | ❌ |
| Employee Dashboard | ❌ | ❌ | ❌ | ✅ |
| Employee Management | ✅ | ✅ | ❌ | ❌ |
| Payroll Management | ✅ | ❌ | ✅ | ❌ |
| Leave Management | ✅ | ✅ | ❌ | ❌ |
| Reports & Remittances | ✅ | ❌ | ✅ | ❌ |
| Audit Trail | ✅ | ❌ | ❌ | ❌ |
| Employee Profile | ❌ | ❌ | ❌ | ✅ |
| Employee Payslip | ❌ | ❌ | ❌ | ✅ |

## Security Features

### 1. URL Protection
- Users cannot manually type URLs to access unauthorized pages
- Logged-in users cannot access login page (redirected to dashboard)
- All routes are protected by appropriate guard layers
- Automatic redirects to appropriate pages

### 2. Navigation Control
- Dynamic navigation based on user role
- Hidden menu items for unauthorized features
- Role-based dashboard routing

### 3. Session Management
- Token-based authentication
- Automatic logout on session expiry
- Secure storage of user credentials

## Error Handling

### Unauthorized Access
- Users are redirected to `/unauthorized` page
- Clear messaging about access restrictions
- Options to go back or navigate to dashboard

### Authentication Failures
- Automatic redirect to login page
- Session cleanup on logout
- Secure token handling

## Best Practices

1. **Always use guards**: Never create routes without appropriate guards
2. **Role validation**: Validate roles both on frontend and backend
3. **Navigation consistency**: Use NavigationService for all navigation logic
4. **Error handling**: Provide clear feedback for access denied scenarios
5. **Testing**: Test all role combinations and edge cases

## Troubleshooting

### Common Issues

1. **Route not accessible**: Check if route has proper guards and role data
2. **Navigation not showing**: Verify user role and NavigationService configuration
3. **Unauthorized redirects**: Check RoleGuard and RouteAccessGuard configuration

### Debug Mode

Enable debug logging in guards to troubleshoot access issues:

```typescript
// In guards, add console.log statements
console.log('User role:', this.authService.currentUser?.role);
console.log('Required roles:', route.data['roles']);
console.log('Has access:', this.authService.hasAnyRole(requiredRoles));
```

## Future Enhancements

1. **Dynamic role management**: Admin ability to modify user roles
2. **Permission granularity**: More fine-grained permissions within roles
3. **Audit logging**: Track all access attempts and role changes
4. **Role inheritance**: Hierarchical role system
5. **Temporary access**: Time-limited role assignments
