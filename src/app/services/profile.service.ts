import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

export interface PersonalInfo {
  firstName: string;
  lastName: string;
  middleName?: string;
  phone?: string;
  sssNumber?: string;
  philHealthNumber?: string;
  pagIbigNumber?: string;
  tinNumber?: string;
}

export interface EmploymentDetails {
  jobTitle: string;
  department: string;
  organization: string;
  startDate: string;
  salary: number;
  employeeNumber: string;
  employmentStatus: string;
  payFrequency: string;
}

export interface PasswordChangeRequest {
  currentPassword: string;
  newPassword: string;
}

export interface ProfileResponse {
  success: boolean;
  data: {
    user: {
      id: string;
      email: string;
      role: string;
      employee: {
        id: string;
        firstName: string;
        lastName: string;
        middleName?: string;
        employeeNumber: string;
        position: string;
        photoUrl?: string; // Now contains base64 data: "data:image/jpeg;base64,/9j/4AAQ..."
        sssNumber?: string;
        philHealthNumber?: string;
        pagIbigNumber?: string;
        tinNumber?: string;
        department?: {
          name: string;
        };
        organization?: {
          name: string;
        };
      };
    };
  };
}

@Injectable({
  providedIn: 'root'
})
export class ProfileService {
  private readonly API_URL = 'http://localhost:3000/api';

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  private getHeaders(): HttpHeaders {
    const token = this.authService.token;
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  // Get employee profile
  getProfile(): Observable<ProfileResponse> {
    return this.http.get<ProfileResponse>(`${this.API_URL}/profile/profile`, {
      headers: this.getHeaders()
    });
  }

  // Update employee profile
  updateProfile(personalInfo: PersonalInfo): Observable<any> {
    return this.http.put(`${this.API_URL}/profile/profile`, personalInfo, {
      headers: this.getHeaders()
    });
  }

  // Update profile photo
  updatePhoto(photo: File): Observable<any> {
    const formData = new FormData();
    formData.append('photo', photo);

    const token = this.authService.token;
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.post(`${this.API_URL}/profile/profile/photo`, formData, {
      headers
    });
  }

  // Change password
  changePassword(passwordData: PasswordChangeRequest): Observable<any> {
    return this.http.post(`${this.API_URL}/profile/change-password`, passwordData, {
      headers: this.getHeaders()
    });
  }

  // Get employment details
  getEmploymentDetails(): Observable<any> {
    return this.http.get(`${this.API_URL}/profile/employment-details`, {
      headers: this.getHeaders()
    });
  }
} 