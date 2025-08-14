import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-unauthorized',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="unauthorized-container">
      <div class="unauthorized-content">
        <div class="icon">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" fill="#f44336"/>
          </svg>
        </div>
        <h1>Access Denied</h1>
        <p>You don't have permission to access this page.</p>
        <div class="actions">
          <button class="btn btn-primary" (click)="goBack()">Go Back</button>
          <button class="btn btn-secondary" (click)="goToDashboard()">Go to Dashboard</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .unauthorized-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      background-color: #f5f5f5;
    }
    
    .unauthorized-content {
      text-align: center;
      background: white;
      padding: 3rem;
      border-radius: 8px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      max-width: 500px;
    }
    
    .icon {
      margin-bottom: 1rem;
      display: flex;
      justify-content: center;
      align-items: center;
    }
    
    h1 {
      color: #333;
      margin-bottom: 1rem;
      font-size: 2rem;
    }
    
    p {
      color: #666;
      margin-bottom: 2rem;
      font-size: 1.1rem;
    }
    
    .actions {
      display: flex;
      gap: 1rem;
      justify-content: center;
      flex-wrap: wrap;
    }
    
    .btn {
      padding: 0.75rem 1.5rem;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 1rem;
      transition: all 0.3s ease;
    }
    
    .btn-primary {
      background-color: #007bff;
      color: white;
    }
    
    .btn-primary:hover {
      background-color: #0056b3;
    }
    
    .btn-secondary {
      background-color: #6c757d;
      color: white;
    }
    
    .btn-secondary:hover {
      background-color: #545b62;
    }
  `]
})
export class UnauthorizedComponent {
  constructor(private router: Router) {}

  goBack(): void {
    window.history.back();
  }

  goToDashboard(): void {
    // Navigate to appropriate dashboard based on user role
    this.router.navigate(['/dashboard']);
  }
}
