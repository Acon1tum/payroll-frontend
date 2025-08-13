import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environment/environment';
import { AuthService } from './auth.service';

export interface EmployeeDto {
  id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  photoUrl?: string | null;
  dateOfBirth: string | Date;
  hireDate: string | Date;
  departmentId?: string | null;
  departmentName?: string;
  position: string;
  salary: number;
  employmentStatus: 'active' | 'resigned' | 'suspended' | 'terminated';
  systemRole: 'admin' | 'hrStaff' | 'payrollManager' | 'employee';
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface CreateEmployeeDto {
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  dateOfBirth: string;
  hireDate: string;
  departmentId: number | null;
  departmentName?: string;
  position: string;
  salary: number;
  employmentStatus: 'active' | 'resigned' | 'suspended' | 'terminated';
  systemRole: 'admin' | 'hrStaff' | 'payrollManager' | 'employee';
  photoUrl?: string | null; // base64
}

export interface UpdateEmployeeDto {
  firstName: string;
  lastName: string;
  email: string;
  dateOfBirth: string;
  hireDate: string;
  departmentId: number | null;
  departmentName?: string;
  position: string;
  salary: number;
  employmentStatus: 'active' | 'resigned' | 'suspended' | 'terminated';
  systemRole: 'admin' | 'hrStaff' | 'payrollManager' | 'employee';
  photoUrl?: string | null; // base64
}

@Injectable({ providedIn: 'root' })
export class EmployeeService {
  private apiUrl = `${environment.apiUrl}/system/employee-management`;

  constructor(private http: HttpClient, private auth: AuthService) {}

  private getHeaders(): HttpHeaders {
    const token = this.auth.token;
    return new HttpHeaders({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    });
  }

  getEmployees(): Observable<{ success: boolean; data: EmployeeDto[] }> {
    return this.http.get<{ success: boolean; data: EmployeeDto[] }>(this.apiUrl, {
      headers: this.getHeaders(),
    });
  }

  createEmployee(employeeData: CreateEmployeeDto): Observable<{ success: boolean; data: EmployeeDto; message: string }> {
    return this.http.post<{ success: boolean; data: EmployeeDto; message: string }>(this.apiUrl, employeeData, {
      headers: this.getHeaders(),
    });
  }

  updateEmployee(id: string, employeeData: UpdateEmployeeDto): Observable<{ success: boolean; data: EmployeeDto; message: string }> {
    return this.http.put<{ success: boolean; data: EmployeeDto; message: string }>(`${this.apiUrl}/${id}`, employeeData, {
      headers: this.getHeaders(),
    });
  }

  deleteEmployee(id: string): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(`${this.apiUrl}/${id}`, {
      headers: this.getHeaders(),
    });
  }
}


