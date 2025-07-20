import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

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

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  onSubmit() {
    this.isLoading = true;
    this.errorMessage = '';

    // Simulate API call
    setTimeout(() => {
      if (this.loginData.email === 'admin@paymaster.com' && this.loginData.password === 'password123') {
        // Successful login
        console.log('Login successful', this.loginData);
        // Here you would typically navigate to dashboard or store auth token
      } else {
        // Failed login
        this.errorMessage = 'Invalid email or password. Please try again.';
      }
      this.isLoading = false;
    }, 1500);
  }
}
