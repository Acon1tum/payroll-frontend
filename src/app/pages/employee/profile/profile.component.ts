import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SidebarComponent } from '../../../shared/sidebar/sidebar.component';
import { HeaderComponent } from '../../../shared/header/header.component';
import { AuthService, User } from '../../../services/auth.service';

@Component({
  selector: 'app-profile',
  imports: [CommonModule, FormsModule, SidebarComponent, HeaderComponent],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss'
})
export class ProfileComponent {
  user: User | null = null;

  // Derived display fields (with safe fallbacks)
  personalInfo = {
    fullName: '-',
    email: '-',
    phone: '-',
    tin: '-',
    sss: '-',
    philHealth: '-',
    pagibig: '-',
  };

  employment = {
    jobTitle: '-',
    department: '-',
    organization: '-',
    startDate: '-',
    salary: '-',
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

  constructor(private auth: AuthService) {
    this.user = this.auth.currentUser;
    this.hydrateFromUser();
  }

  private hydrateFromUser(): void {
    const employee = this.user?.employee;
    const fullName = employee ? `${employee.firstName} ${employee.lastName}`.trim() : '-';

    this.personalInfo.fullName = fullName || '-';
    this.personalInfo.email = this.user?.email || '-';
    // Placeholders for now; replace when backend fields are available
    this.personalInfo.phone = '-';
    this.personalInfo.tin = '-';
    this.personalInfo.sss = '-';
    this.personalInfo.philHealth = '-';
    this.personalInfo.pagibig = '-';

    this.employment.jobTitle = employee?.position || '-';
    this.employment.department = employee?.department?.name || '-';
    this.employment.organization = employee?.organization?.name || '-';
    this.employment.startDate = '-';
    this.employment.salary = '-';
  }

  onPhotoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    const file = input.files[0];
    this.selectedPhoto = file;

    const reader = new FileReader();
    reader.onload = () => {
      this.photoPreview = reader.result as string;
    };
    reader.readAsDataURL(file);
  }

  savePhoto(): void {
    if (!this.selectedPhoto) {
      this.photoMessage = 'Please select a photo to upload.';
      return;
    }
    // TODO: Wire to backend endpoint
    this.photoMessage = 'Profile photo updated successfully (mock).';
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
    // TODO: Call backend to update password
    this.passwordSuccess = 'Password updated successfully (mock).';
    this.passwordForm = { current: '', new: '', confirm: '' } as any;
  }
}
