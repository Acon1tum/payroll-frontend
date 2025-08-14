import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { NavigationService } from '../services/navigation.service';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class RouteAccessGuard implements CanActivate {
  
  constructor(
    private navigationService: NavigationService,
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot, 
    state: RouterStateSnapshot
  ): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    
    // If user is not authenticated, redirect to login
    if (!this.authService.isAuthenticated) {
      this.router.navigate(['/login']);
      return false;
    }

    const requestedPath = state.url;
    
    // Check if the user has access to this route
    if (this.navigationService.canAccessRoute(requestedPath)) {
      return true;
    }

    // User doesn't have access to this route
    // Redirect to unauthorized page
    this.router.navigate(['/unauthorized']);
    return false;
  }
}
