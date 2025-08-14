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
    return !!this.currentUserSubject.value;
  }

  get token(): string | null {
    return localStorage.getItem('auth_token');
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
    localStorage.removeItem('auth_token');
    localStorage.removeItem('current_user');
    this.currentUserSubject.next(null);
    
    // Force navigation to login page and clear any cached routes
    this.router.navigate(['/login'], { replaceUrl: true });
  }

  private setSession(response: LoginResponse): void {
    localStorage.setItem('auth_token', response.token);
    localStorage.setItem('current_user', JSON.stringify(response.user));
    this.currentUserSubject.next(response.user);
  }

  private loadStoredUser(): void {
    const storedUser = localStorage.getItem('current_user');
    if (!storedUser || storedUser === 'undefined' || storedUser === 'null') {
      // Clean up any invalid persisted value
      localStorage.removeItem('current_user');
      return;
    }

    try {
      const user = JSON.parse(storedUser);
      // Basic shape validation to avoid runtime issues
      if (user && typeof user === 'object' && typeof user.email === 'string' && typeof user.role === 'string') {
        this.currentUserSubject.next(user);
      } else {
        localStorage.removeItem('current_user');
      }
    } catch (error) {
      console.error('Error parsing stored user:', error);
      localStorage.removeItem('current_user');
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
} 