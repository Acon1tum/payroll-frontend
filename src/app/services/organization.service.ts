import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environment/environment';

export interface Organization {
  id: string;
  name: string;
  code: string;
  tin: string;
  address: string;
  contact: string;
  email: string;
  phone?: string;
  status: 'active' | 'inactive';
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateOrganizationRequest {
  name: string;
  code: string;
  tin: string;
  address: string;
  contact: string;
  email: string;
  phone?: string;
  status?: 'active' | 'inactive';
}

export interface UpdateOrganizationRequest {
  name?: string;
  code?: string;
  tin?: string;
  address?: string;
  contact?: string;
  email?: string;
  phone?: string;
  status?: 'active' | 'inactive';
}

export interface DuplicateCheckResponse {
  success: boolean;
  isDuplicate: boolean;
  duplicates: Array<{
    field: string;
    message: string;
  }>;
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class OrganizationService {
  private apiUrl = `${environment.apiUrl}/system/organizations`;

  constructor(private http: HttpClient) { }

  // Get all organizations
  getOrganizations(): Observable<{ success: boolean; data: Organization[] }> {
    return this.http.get<{ success: boolean; data: Organization[] }>(this.apiUrl);
  }

  // Get organization by ID
  getOrganization(id: string): Observable<{ success: boolean; data: Organization }> {
    return this.http.get<{ success: boolean; data: Organization }>(`${this.apiUrl}/${id}`);
  }

  // Create organization
  createOrganization(organization: CreateOrganizationRequest): Observable<{ success: boolean; message: string; data: Organization }> {
    return this.http.post<{ success: boolean; message: string; data: Organization }>(this.apiUrl, organization);
  }

  // Update organization
  updateOrganization(id: string, organization: UpdateOrganizationRequest): Observable<{ success: boolean; message: string; data: Organization }> {
    return this.http.put<{ success: boolean; message: string; data: Organization }>(`${this.apiUrl}/${id}`, organization);
  }

  // Toggle organization status
  toggleOrganizationStatus(id: string): Observable<{ success: boolean; message: string; data: Organization }> {
    return this.http.patch<{ success: boolean; message: string; data: Organization }>(`${this.apiUrl}/${id}/toggle-status`, {});
  }

  // Delete organization
  deleteOrganization(id: string): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(`${this.apiUrl}/${id}`);
  }

  // Check for duplicate organization name, code, or TIN
  checkDuplicateOrganization(name?: string, tin?: string, excludeId?: string, code?: string): Observable<DuplicateCheckResponse> {
    const params: any = {};
    if (name) params.name = name;
    if (tin) params.tin = tin;
    if (code) params.code = code;
    if (excludeId) params.excludeId = excludeId;
    
    return this.http.post<DuplicateCheckResponse>(`${this.apiUrl}/check-duplicate`, params);
  }
}
