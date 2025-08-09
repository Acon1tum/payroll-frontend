import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  imports: [FormsModule, CommonModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  loginData = {
    email: '',
    password: '',
    rememberMe: false
  };

  showPassword = false;
  isLoading = false;
  errorMessage = '';

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  onSubmit() {
    if (!this.loginData.email || !this.loginData.password) {
      this.errorMessage = 'Please enter both email and password.';
      return;
    }

    if (!this.isValidEmail(this.loginData.email)) {
      this.errorMessage = 'Please enter a valid email address.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.authService.login({
      email: this.loginData.email,
      password: this.loginData.password
    }).subscribe({
      next: (response) => {
        console.log('Login successful', response);
        this.isLoading = false;
        
        // Navigate based on user role (routes defined in app.routes.ts)
        const role = response?.user?.role;
        if (role === 'admin' || role === 'hrStaff' || role === 'payrollManager') {
          this.router.navigate(['/dashboard']);
        } else {
          this.router.navigate(['/employee-dashboard']);
        }
      },
      error: (error) => {
        console.error('Login failed', error);
        this.isLoading = false;
        
        if (error.status === 401) {
          this.errorMessage = 'Invalid email or password. Please try again.';
        } else if (error.status === 0) {
          this.errorMessage = 'Unable to connect to server. Please check your connection.';
        } else {
          this.errorMessage = 'Login failed. Please try again later.';
        }
      }
    });
  }
}
