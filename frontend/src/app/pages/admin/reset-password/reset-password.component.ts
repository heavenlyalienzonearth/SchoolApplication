import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="login-wrapper">
      <div class="login-card">
        <div class="brand">
          <h1>Kangaroo Kids</h1>
          <p>Reset Portal Password</p>
        </div>

        <div class="alert alert-danger" *ngIf="errorMessage">
          ⚠️ {{ errorMessage }}
        </div>

        <!-- Reset Password Form -->
        <form (ngSubmit)="onSubmit()" #resetForm="ngForm" *ngIf="!resetSuccess">
          <div class="form-group" style="margin-bottom: 20px;">
            <label class="form-label" for="password">New Password</label>
            <input type="password" id="password" name="password" [(ngModel)]="password" class="form-control" required placeholder="Min 6 characters" />
          </div>

          <div class="form-group" style="margin-bottom: 20px;">
            <label class="form-label" for="confirmPassword">Confirm Password</label>
            <input type="password" id="confirmPassword" name="confirmPassword" [(ngModel)]="confirmPassword" class="form-control" required placeholder="Re-type new password" />
          </div>

          <button type="submit" class="btn btn-primary btn-block" [disabled]="loading">
            {{ loading ? 'Saving password...' : 'Save New Password' }}
          </button>
        </form>

        <!-- Success Screen -->
        <div *ngIf="resetSuccess" style="text-align: center; padding: 10px 0;">
          <div style="font-size: 3rem; margin-bottom: 15px;">🎉</div>
          <h3 style="color: var(--primary); margin-bottom: 10px; font-weight: 700;">Password Updated</h3>
          <p style="font-size: 0.9rem; color: #475569; line-height: 1.6; margin-bottom: 25px;">
            Your administrator password has been successfully reset. You can now sign in with your new credentials.
          </p>
          <a routerLink="/admin/login" class="btn btn-primary btn-block" style="display: block; text-decoration: none; text-align: center; line-height: 24px;">
            Sign In
          </a>
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
      background: linear-gradient(135deg, #FFEDD5 0%, #E0F2FE 100%);
      padding: 20px;
      font-family: 'Outfit', sans-serif;
    }

    .login-card {
      width: 100%;
      max-width: 420px;
      background: white;
      border-radius: 12px;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.05);
      padding: 40px 30px;
      border: 1px solid rgba(255, 255, 255, 0.8);
    }

    .brand {
      text-align: center;
      margin-bottom: 30px;
    }

    .brand h1 {
      color: #EE5A24; /* primary */
      font-size: 1.6rem;
      margin-bottom: 6px;
    }

    .brand p {
      font-size: 0.9rem;
      color: #64748B;
    }

    .form-group {
      margin-bottom: 20px;
    }

    .form-label {
      display: block;
      font-weight: 600;
      font-size: 0.85rem;
      color: #475569;
      margin-bottom: 6px;
    }

    .form-control {
      width: 100%;
      padding: 10px 12px;
      border: 1px solid #CBD5E1;
      border-radius: 6px;
      font-size: 0.95rem;
      transition: all 0.2s;
    }

    .form-control:focus {
      border-color: #EE5A24;
      box-shadow: 0 0 0 3px rgba(238, 90, 36, 0.15);
      outline: none;
    }

    .btn {
      display: inline-block;
      text-align: center;
      font-weight: 700;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.2s;
      font-size: 0.95rem;
    }

    .btn-primary {
      background-color: #EE5A24;
      color: white;
    }

    .btn-primary:hover {
      background-color: #d84a1b;
      transform: translateY(-1px);
    }

    .btn-block {
      width: 100%;
      padding: 12px;
      margin-top: 10px;
    }

    .alert {
      padding: 12px;
      background-color: #FEE2E2;
      color: #991B1B;
      border-radius: 6px;
      font-size: 0.9rem;
      margin-bottom: 20px;
      font-weight: 600;
    }
  `]
})
export class ResetPasswordComponent implements OnInit {
  password = '';
  confirmPassword = '';
  token = '';
  loading = false;
  resetSuccess = false;
  errorMessage = '';

  constructor(
    private route: ActivatedRoute,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.token = params['token'] || '';
      if (!this.token) {
        this.errorMessage = 'Invalid or missing password reset token. Please request a new password reset link.';
      }
    });
  }

  onSubmit(): void {
    if (!this.token) {
      this.errorMessage = 'Reset token is missing. Please request a new link.';
      return;
    }
    if (!this.password || this.password.length < 6) {
      this.errorMessage = 'Password must be at least 6 characters.';
      return;
    }
    if (this.password !== this.confirmPassword) {
      this.errorMessage = 'Passwords do not match.';
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    this.authService.resetPassword(this.token, this.password).subscribe({
      next: () => {
        this.loading = false;
        this.resetSuccess = true;
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err.error?.detail || 'Failed to reset password. The link may have expired.';
      }
    });
  }
}
