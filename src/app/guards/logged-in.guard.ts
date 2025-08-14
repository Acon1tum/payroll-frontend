import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class LoggedInGuard implements CanActivate {
  
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    // If user is already logged in, redirect to appropriate dashboard
    if (this.authService.isAuthenticated) {
      const currentUser = this.authService.currentUser;
      
      // Redirect based on user role
      if (currentUser) {
        switch (currentUser.role) {
          case 'employee':
            this.router.navigate(['/employee-dashboard']);
            break;
          case 'admin':
          case 'hrStaff':
          case 'payrollManager':
            this.router.navigate(['/dashboard']);
            break;
          default:
            this.router.navigate(['/dashboard']);
        }
      } else {
        // Fallback to dashboard if role is unknown
        this.router.navigate(['/dashboard']);
      }
      
      return false; // Prevent access to login page
    }
    
    // User is not logged in, allow access to login page
    return true;
  }
}
