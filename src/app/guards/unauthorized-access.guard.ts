import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class UnauthorizedAccessGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    // Check if user is authenticated
    if (!this.authService.isAuthenticated) {
      // If not authenticated, redirect to login
      this.router.navigate(['/login']);
      return false;
    }

    // Check if this is a direct navigation (user manually typed the URL)
    const navigation = this.router.getCurrentNavigation();
    
    // If there's no navigation context or it's a direct navigation, redirect to appropriate dashboard
    if (!navigation || navigation.trigger === 'popstate' || navigation.trigger === 'imperative') {
      const currentUser = this.authService.currentUser;
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
        this.router.navigate(['/dashboard']);
      }
      return false;
    }

    // Allow access only if redirected here by other guards
    return true;
  }
}
