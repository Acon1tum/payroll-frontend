import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SidebarComponent } from '../../../shared/sidebar/sidebar.component';
import { HeaderComponent } from '../../../shared/header/header.component';
import { AuthService, User } from '../../../services/auth.service';
import { ProfileService, PersonalInfo, EmploymentDetails, PasswordChangeRequest } from '../../../services/profile.service';

interface Breadcrumb {
  label: string;
  path?: string;
  active?: boolean;
}

@Component({
  selector: 'app-profile',
  imports: [CommonModule, FormsModule, SidebarComponent, HeaderComponent],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss'
})
export class ProfileComponent implements OnInit {
  user: User | null = null;

  // Breadcrumbs for header
  breadcrumbs: Breadcrumb[] = [
    { label: 'Dashboard', path: '/employee-dashboard' },
    { label: 'My Profile', active: true }
  ];

  // Personal info form
  personalInfoForm: PersonalInfo = {
    firstName: '',
    lastName: '',
    middleName: '',
    phone: '',
    sssNumber: '',
    philHealthNumber: '',
    pagIbigNumber: '',
    tinNumber: ''
  };

  // Employment details
  employment: EmploymentDetails = {
    jobTitle: '-',
    department: '-',
    organization: '-',
    startDate: '-',
    salary: 0,
    employeeNumber: '-',
    employmentStatus: '-',
    payFrequency: '-'
  };

  // Update Password form state
  passwordForm = {
    current: '',
    new: '',
    confirm: ''
  };
  passwordError: string | null = null;
  passwordSuccess: string | null = null;

  // Update Photo state
  photoPreview: string | null = null;
  selectedPhoto: File | null = null;
  photoMessage: string | null = null;
  photoError: string | null = null;

  // Profile update state
  profileMessage: string | null = null;
  profileError: string | null = null;
  isLoading = false;

  // Edit mode
  isEditing = false;

  constructor(
    private auth: AuthService,
    private profileService: ProfileService
  ) {
    this.user = this.auth.currentUser;
  }

  ngOnInit(): void {
    this.loadProfile();
    this.loadEmploymentDetails();
  }

  private loadProfile(): void {
    this.isLoading = true;
    this.profileService.getProfile().subscribe({
      next: (response) => {
        if (response.success && response.data.user.employee) {
          const employee = response.data.user.employee;
          this.user = {
            ...response.data.user,
            role: response.data.user.role as 'admin' | 'hrStaff' | 'payrollManager' | 'employee'
          };
          
          // Populate personal info form
          this.personalInfoForm = {
            firstName: employee.firstName || '',
            lastName: employee.lastName || '',
            middleName: employee.middleName || '',
            phone: '', // Not in current schema
            sssNumber: employee.sssNumber || '',
            philHealthNumber: employee.philHealthNumber || '',
            pagIbigNumber: employee.pagIbigNumber || '',
            tinNumber: employee.tinNumber || ''
          };

          // Set photo preview if exists
          if (employee.photoUrl) {
            this.photoPreview = employee.photoUrl; // photoUrl now contains base64 data directly
          }
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading profile:', error);
        this.isLoading = false;
      }
    });
  }

  private loadEmploymentDetails(): void {
    this.profileService.getEmploymentDetails().subscribe({
      next: (response) => {
        if (response.success && response.data.employmentDetails) {
          const details = response.data.employmentDetails;
          this.employment = {
            jobTitle: details.jobTitle || '-',
            department: details.department || '-',
            organization: details.organization || '-',
            startDate: details.startDate ? new Date(details.startDate).toLocaleDateString() : '-',
            salary: details.salary || 0,
            employeeNumber: details.employeeNumber || '-',
            employmentStatus: details.employmentStatus || '-',
            payFrequency: details.payFrequency || '-'
          };
        }
      },
      error: (error) => {
        console.error('Error loading employment details:', error);
      }
    });
  }

  toggleEditMode(): void {
    this.isEditing = !this.isEditing;
    if (!this.isEditing) {
      // Reset form to current values
      this.loadProfile();
    }
  }

  updateProfile(): void {
    if (!this.personalInfoForm.firstName || !this.personalInfoForm.lastName) {
      this.profileError = 'First name and last name are required.';
      return;
    }

    this.isLoading = true;
    this.profileService.updateProfile(this.personalInfoForm).subscribe({
      next: (response) => {
        this.profileMessage = 'Profile updated successfully!';
        this.profileError = null;
        this.isEditing = false;
        this.isLoading = false;
        
        // Reload profile to get updated data
        this.loadProfile();
        
        // Clear message after 3 seconds
        setTimeout(() => {
          this.profileMessage = null;
        }, 3000);
      },
      error: (error) => {
        this.profileError = error.error?.message || 'Failed to update profile.';
        this.isLoading = false;
      }
    });
  }

  onPhotoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    
    const file = input.files[0];
    
    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      this.photoError = 'File size must be less than 5MB.';
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      this.photoError = 'Please select an image file.';
      return;
    }

    this.selectedPhoto = file;
    this.photoError = null;

    // Convert to base64 for preview (same format as backend storage)
    const reader = new FileReader();
    reader.onload = () => {
      this.photoPreview = reader.result as string;
    };
    reader.readAsDataURL(file);
  }

  savePhoto(): void {
    if (!this.selectedPhoto) {
      this.photoError = 'Please select a photo to upload.';
      return;
    }

    this.isLoading = true;
    this.profileService.updatePhoto(this.selectedPhoto).subscribe({
      next: (response) => {
        this.photoMessage = 'Profile photo updated successfully!';
        this.photoError = null;
        this.selectedPhoto = null;
        this.isLoading = false;
        
        // Reload profile to get updated photo URL
        this.loadProfile();
        
        // Clear message after 3 seconds
        setTimeout(() => {
          this.photoMessage = null;
        }, 3000);
      },
      error: (error) => {
        this.photoError = error.error?.message || 'Failed to update photo.';
        this.isLoading = false;
      }
    });
  }

  changePassword(): void {
    this.passwordError = null;
    this.passwordSuccess = null;

    const { current, new: newPass, confirm } = this.passwordForm as any;
    if (!current || !newPass || !confirm) {
      this.passwordError = 'Please fill out all fields.';
      return;
    }
    if (newPass.length < 8) {
      this.passwordError = 'New password must be at least 8 characters.';
      return;
    }
    if (newPass !== confirm) {
      this.passwordError = 'New password and confirmation do not match.';
      return;
    }

    const passwordData: PasswordChangeRequest = {
      currentPassword: current,
      newPassword: newPass
    };

    this.isLoading = true;
    this.profileService.changePassword(passwordData).subscribe({
      next: (response) => {
        this.passwordSuccess = 'Password updated successfully!';
        this.passwordError = null;
        this.passwordForm = { current: '', new: '', confirm: '' } as any;
        this.isLoading = false;
        
        // Clear success message after 3 seconds
        setTimeout(() => {
          this.passwordSuccess = null;
        }, 3000);
      },
      error: (error) => {
        this.passwordError = error.error?.message || 'Failed to update password.';
        this.isLoading = false;
      }
    });
  }

  // Helper method to format salary
  formatSalary(salary: number): string {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(salary);
  }
}
