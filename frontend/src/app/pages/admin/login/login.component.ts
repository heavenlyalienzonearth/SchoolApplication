import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-admin-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="login-wrapper">
      <div class="login-card animate-fade-in">
        <div class="brand">
          <img src="/assets/images/logo.png" alt="Logo" class="logo" />
          <h2>School Admin Portal</h2>
          <p>Login to manage site settings and view enquiries</p>
        </div>

        <div class="alert alert-danger" *ngIf="errorMessage">
          ⚠️ {{ errorMessage }}
        </div>

        <form (ngSubmit)="onSubmit()" #loginForm="ngForm">
          <div class="form-group">
            <label class="form-label" for="email">Email Address</label>
            <input type="email" id="email" name="email" [(ngModel)]="loginData.email" class="form-control" required placeholder="admin@school.com" />
          </div>

          <div class="form-group">
            <label class="form-label" for="password">Password</label>
            <input type="password" id="password" name="password" [(ngModel)]="loginData.password" class="form-control" required placeholder="••••••••" />
          </div>

          <button type="submit" class="btn btn-primary btn-block" [disabled]="loading">
            {{ loading ? 'Signing in...' : 'Sign In' }}
          </button>
        </form>

        <div class="back-link">
          <a routerLink="/">← Back to Home Page</a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .login-wrapper {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: var(--bg-cream);
      padding: 24px;
    }

    .login-card {
      background-color: var(--white);
      padding: 40px;
      border-radius: var(--border-radius-lg);
      box-shadow: 0 10px 40px rgba(0,0,0,0.06);
      width: 100%;
      max-width: 420px;
      border: 3px solid var(--secondary);
    }

    .brand {
      text-align: center;
      margin-bottom: 30px;
    }

    .logo {
      height: 70px;
      margin-bottom: 12px;
      object-fit: contain;
    }

    .brand h2 {
      color: var(--primary);
      font-size: 1.6rem;
      font-family: var(--font-heading);
      margin-bottom: 6px;
    }

    .brand p {
      font-size: 0.9rem;
      color: var(--text-light);
    }

    .alert {
      padding: 12px;
      background-color: #FEE2E2;
      color: #991B1B;
      border-radius: var(--border-radius-sm);
      font-size: 0.9rem;
      margin-bottom: 20px;
      font-weight: 600;
    }

    .btn-block {
      width: 100%;
      padding: 12px;
      margin-top: 10px;
    }

    .back-link {
      text-align: center;
      margin-top: 24px;
    }

    .back-link a {
      color: var(--text-light);
      text-decoration: none;
      font-size: 0.9rem;
      font-weight: 600;
      transition: var(--transition);
    }

    .back-link a:hover {
      color: var(--primary);
    }
  `]
})
export class LoginComponent {
  loginData = { email: '', password: '' };
  loading = false;
  errorMessage = '';

  constructor(
    private authService: AuthService,
    private router: Router
  ) {
    if (this.authService.isLoggedIn()) {
      this.router.navigate(['/admin/dashboard']);
    }
  }

  onSubmit(): void {
    if (!this.loginData.email || !this.loginData.password) {
      this.errorMessage = 'Please enter email and password.';
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    this.authService.login(this.loginData.email, this.loginData.password).subscribe({
      next: () => {
        this.loading = false;
        this.router.navigate(['/admin/dashboard']);
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err.error?.detail || 'Incorrect email or password.';
      }
    });
  }
}
