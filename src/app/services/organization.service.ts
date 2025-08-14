import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environment/environment';
import { AuthService } from './auth.service';

export interface OrganizationDto {
  id: string;
  name: string;
  code: string;
  tin: string;
  address: string;
  contact: string;
  email: string;
  phone?: string;
  status: string;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface CreateOrganizationDto {
  name: string;
  code: string;
  tin: string;
  address: string;
  contact: string;
  email: string;
  phone?: string;
  status?: string;
}

export interface UpdateOrganizationDto {
  name?: string;
  code?: string;
  tin?: string;
  address?: string;
  contact?: string;
  email?: string;
  phone?: string;
  status?: string;
}

@Injectable({ providedIn: 'root' })
export class OrganizationService {
  private apiUrl = `${environment.apiUrl}/system/organizations`;

  constructor(private http: HttpClient, private auth: AuthService) {}

  private getHeaders(): HttpHeaders {
    const token = this.auth.token;
    return new HttpHeaders({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    });
  }

  getOrganizations(): Observable<{ success: boolean; data: OrganizationDto[] }> {
    return this.http.get<{ success: boolean; data: OrganizationDto[] }>(this.apiUrl, {
      headers: this.getHeaders(),
    });
  }

  getOrganizationById(id: string): Observable<{ success: boolean; data: OrganizationDto }> {
    return this.http.get<{ success: boolean; data: OrganizationDto }>(`${this.apiUrl}/${id}`, {
      headers: this.getHeaders(),
    });
  }

  createOrganization(organizationData: CreateOrganizationDto): Observable<{ success: boolean; data: OrganizationDto; message: string }> {
    return this.http.post<{ success: boolean; data: OrganizationDto; message: string }>(this.apiUrl, organizationData, {
      headers: this.getHeaders(),
    });
  }

  updateOrganization(id: string, organizationData: UpdateOrganizationDto): Observable<{ success: boolean; data: OrganizationDto; message: string }> {
    return this.http.put<{ success: boolean; data: OrganizationDto; message: string }>(`${this.apiUrl}/${id}`, organizationData, {
      headers: this.getHeaders(),
    });
  }

  toggleOrganizationStatus(id: string): Observable<{ success: boolean; data: OrganizationDto; message: string }> {
    return this.http.patch<{ success: boolean; data: OrganizationDto; message: string }>(`${this.apiUrl}/${id}/toggle-status`, {}, {
      headers: this.getHeaders(),
    });
  }

  deleteOrganization(id: string): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(`${this.apiUrl}/${id}`, {
      headers: this.getHeaders(),
    });
  }
}
