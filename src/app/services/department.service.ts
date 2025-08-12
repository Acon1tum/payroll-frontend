import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environment/environment';

export interface Department {
  id: string;
  name: string;
  code?: string;
  organizationId: string;
  organizationName: string;
  departmentHeadId?: string;
  departmentHeadName?: string;
  memberCount: number;
  description: string;
  status: 'active' | 'inactive';
  createdAt: Date;
  updatedAt: Date;
}

export interface Organization {
  id: string;
  name: string;
}

export interface Employee {
  id: string;
  name: string;
  position: string;
  departmentId?: string;
  isDepartmentHead: boolean;
}

export interface CreateDepartmentRequest {
  name: string;
  code?: string;
  organizationId: string;
  description?: string;
  status?: 'active' | 'inactive';
}

export interface UpdateDepartmentRequest {
  name?: string;
  code?: string;
  organizationId?: string;
  description?: string;
  status?: 'active' | 'inactive';
}

export interface AssignHeadRequest {
  departmentId: string;
  employeeId: string;
}

@Injectable({
  providedIn: 'root'
})
export class DepartmentService {
  private apiUrl = `${environment.apiUrl}/system/departments`;

  constructor(private http: HttpClient) { }

  // Get all departments
  getDepartments(): Observable<{ success: boolean; data: Department[] }> {
    return this.http.get<{ success: boolean; data: Department[] }>(this.apiUrl);
  }

  // Get department by ID
  getDepartment(id: string): Observable<{ success: boolean; data: Department }> {
    return this.http.get<{ success: boolean; data: Department }>(`${this.apiUrl}/${id}`);
  }

  // Get organizations
  getOrganizations(): Observable<{ success: boolean; data: Organization[] }> {
    return this.http.get<{ success: boolean; data: Organization[] }>(`${this.apiUrl}/organizations`);
  }

  // Get available employees
  getAvailableEmployees(): Observable<{ success: boolean; data: Employee[] }> {
    return this.http.get<{ success: boolean; data: Employee[] }>(`${this.apiUrl}/employees`);
  }

  // Create department
  createDepartment(department: CreateDepartmentRequest): Observable<{ success: boolean; message: string; data: Department }> {
    return this.http.post<{ success: boolean; message: string; data: Department }>(this.apiUrl, department);
  }

  // Update department
  updateDepartment(id: string, department: UpdateDepartmentRequest): Observable<{ success: boolean; message: string; data: Department }> {
    return this.http.put<{ success: boolean; message: string; data: Department }>(`${this.apiUrl}/${id}`, department);
  }

  // Assign department head
  assignDepartmentHead(request: AssignHeadRequest): Observable<{ success: boolean; message: string; data: Department }> {
    return this.http.post<{ success: boolean; message: string; data: Department }>(`${this.apiUrl}/assign-head`, request);
  }

  // Toggle department status
  toggleDepartmentStatus(id: string): Observable<{ success: boolean; message: string; data: Department }> {
    return this.http.patch<{ success: boolean; message: string; data: Department }>(`${this.apiUrl}/${id}/toggle-status`, {});
  }

  // Delete department
  deleteDepartment(id: string): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(`${this.apiUrl}/${id}`);
  }

  // Check if department name already exists
  checkDuplicateDepartmentName(name: string, organizationId: string, excludeId?: string): Observable<{ success: boolean; isDuplicate: boolean; message?: string }> {
    const params: any = { name, organizationId };
    if (excludeId) {
      params.excludeId = excludeId;
    }
    
    return this.http.post<{ success: boolean; isDuplicate: boolean; message?: string }>(`${this.apiUrl}/check-duplicate`, params);
  }
}
