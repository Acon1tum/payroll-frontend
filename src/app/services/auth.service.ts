import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap, map } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from '../../environment/environment';

export interface User {
  id: string;
  email: string;
  role: 'admin' | 'hrStaff' | 'payrollManager' | 'employee';
  employee?: {
    id: string;
    firstName: string;
    lastName: string;
    employeeNumber: string;
    position: string;
    photoUrl?: string; // Base64 encoded image data
    organization?: {
      name: string;
    };
    department?: {
      name: string;
    };
  };
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  token: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

    private readonly API_URL = environment.apiUrl;

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    this.loadStoredUser();
  }

  get currentUser(): User | null {
    return this.currentUserSubject.value;
  }

  get isAuthenticated(): boolean {
    // Check if user exists and token is valid
    const user = this.currentUserSubject.value;
    const token = this.token;
    
    if (!user || !token) {
      return false;
    }
    
    // Check if token has expired (optional additional security)
    if (this.isTokenExpired()) {
      this.logout();
      return false;
    }
    
    return true;
  }

  get token(): string | null {
    return sessionStorage.getItem('auth_token');
  }

  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http.post<any>(`${this.API_URL}/auth/login`, credentials)
      .pipe(
        map((resp: any) => {
          // Backend returns ApiResponse<{ user, token }>
          const payload = resp?.data ?? resp;
          const normalized: LoginResponse = { user: payload.user, token: payload.token };
          this.setSession(normalized);
          return normalized;
        })
      );
  }

  logout(): void {
    // Clear all session data for security
    this.clearSession();
    
    // Force navigation to login page and clear any cached routes
    this.router.navigate(['/login'], { replaceUrl: true });
  }

  private setSession(response: LoginResponse): void {
    // Use sessionStorage for better security (cleared when tab closes)
    // Add timestamp for token expiration tracking
    const sessionData = {
      token: response.token,
      user: response.user,
      timestamp: Date.now()
    };
    
    sessionStorage.setItem('auth_token', response.token);
    sessionStorage.setItem('current_user', JSON.stringify(response.user));
    sessionStorage.setItem('session_timestamp', Date.now().toString());
    
    this.currentUserSubject.next(response.user);
  }

  private loadStoredUser(): void {
    const storedUser = sessionStorage.getItem('current_user');
    if (!storedUser || storedUser === 'undefined' || storedUser === 'null') {
      // Clean up any invalid persisted value
      sessionStorage.removeItem('current_user');
      return;
    }

    try {
      const user = JSON.parse(storedUser);
      // Basic shape validation to avoid runtime issues
      if (user && typeof user === 'object' && typeof user.email === 'string' && typeof user.role === 'string') {
        this.currentUserSubject.next(user);
      } else {
        sessionStorage.removeItem('current_user');
      }
    } catch (error) {
      console.error('Error parsing stored user:', error);
      sessionStorage.removeItem('current_user');
    }
  }

  hasRole(role: string): boolean {
    return this.currentUser?.role === role;
  }

  hasAnyRole(roles: string[]): boolean {
    return roles.includes(this.currentUser?.role || '');
  }

  isAdmin(): boolean {
    return this.hasRole('admin');
  }

  isHR(): boolean {
    return this.hasRole('hrStaff');
  }

  isPayrollManager(): boolean {
    return this.hasRole('payrollManager');
  }

  isEmployee(): boolean {
    return this.hasRole('employee');
  }

  /**
   * Check if the current token has expired
   * This provides additional security by validating token freshness
   */
  private isTokenExpired(): boolean {
    const timestamp = sessionStorage.getItem('session_timestamp');
    if (!timestamp) {
      return true;
    }
    
    const sessionAge = Date.now() - parseInt(timestamp);
    const maxSessionAge = 2 * 60 * 60 * 1000; // 2 hours in milliseconds
    
    return sessionAge > maxSessionAge;
  }

  /**
   * Clear all session data for security
   */
  private clearSession(): void {
    sessionStorage.removeItem('auth_token');
    sessionStorage.removeItem('current_user');
    sessionStorage.removeItem('session_timestamp');
    this.currentUserSubject.next(null);
  }
} 