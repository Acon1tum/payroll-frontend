import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environment/environment';
import { AuthService } from './auth.service';

export interface User {
  id: string;
  email: string;
  role: 'admin' | 'payrollManager' | 'hrStaff' | 'employee';
  createdAt: string | Date;
  updatedAt: string | Date;
  employee?: {
    id: string;
    employeeNumber: string;
    firstName: string;
    lastName: string;
    middleName?: string;
    position: string;
    departmentName?: string;
    employmentStatus: 'active' | 'resigned' | 'terminated' | 'suspended';
  };
}

export interface CreateUserDto {
  email: string;
  password: string;
  role: 'admin' | 'payrollManager' | 'hrStaff' | 'employee';
}

export interface UpdateUserDto {
  email?: string;
  role?: 'admin' | 'payrollManager' | 'hrStaff' | 'employee';
}

export interface ChangePasswordDto {
  newPassword: string;
}

export interface AssignRoleDto {
  role: 'admin' | 'payrollManager' | 'hrStaff' | 'employee';
}

export interface UserResponse {
  success: boolean;
  data: User[];
  message?: string;
}

export interface SingleUserResponse {
  success: boolean;
  data: User;
  message?: string;
}

@Injectable({ providedIn: 'root' })
export class UserService {
  private apiUrl = `${environment.apiUrl}/system/users`;

  constructor(private http: HttpClient, private auth: AuthService) {}

  private getHeaders(): HttpHeaders {
    const token = this.auth.token;
    return new HttpHeaders({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    });
  }

  getUsers(): Observable<UserResponse> {
    console.log('=== UserService.getUsers Debug ===');
    console.log('API URL:', this.apiUrl);
    console.log('Headers:', this.getHeaders());
    console.log('Token:', this.auth.token);
    console.log('Current user:', this.auth.currentUser);
    console.log('==================================');
    
    return this.http.get<UserResponse>(this.apiUrl, {
      headers: this.getHeaders(),
    });
  }

  getUser(id: string): Observable<SingleUserResponse> {
    return this.http.get<SingleUserResponse>(`${this.apiUrl}/${id}`, {
      headers: this.getHeaders(),
    });
  }

  createUser(userData: CreateUserDto): Observable<SingleUserResponse> {
    return this.http.post<SingleUserResponse>(this.apiUrl, userData, {
      headers: this.getHeaders(),
    });
  }

  updateUser(id: string, userData: UpdateUserDto): Observable<SingleUserResponse> {
    return this.http.put<SingleUserResponse>(`${this.apiUrl}/${id}`, userData, {
      headers: this.getHeaders(),
    });
  }

  deleteUser(id: string): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(`${this.apiUrl}/${id}`, {
      headers: this.getHeaders(),
    });
  }

  changePassword(id: string, passwordData: ChangePasswordDto): Observable<{ success: boolean; message: string }> {
    return this.http.patch<{ success: boolean; message: string }>(`${this.apiUrl}/${id}/password`, passwordData, {
      headers: this.getHeaders(),
    });
  }

  assignRole(id: string, roleData: AssignRoleDto): Observable<{ success: boolean; message: string }> {
    return this.http.patch<{ success: boolean; message: string }>(`${this.apiUrl}/${id}/roles`, roleData, {
      headers: this.getHeaders(),
    });
  }
}
