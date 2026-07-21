import { Component, OnInit } from '@angular/core';
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

        <form (ngSubmit)="onSubmit()" #loginForm="ngForm" *ngIf="!twoFactorRequired && !forgotPasswordActive">
          <div class="form-group">
            <label class="form-label" for="email">Email Address</label>
            <input type="email" id="email" name="email" [(ngModel)]="loginData.email" class="form-control" required placeholder="admin@school.com" />
          </div>

          <div class="form-group">
            <label class="form-label" for="password">Password</label>
            <input type="password" id="password" name="password" [(ngModel)]="loginData.password" class="form-control" required placeholder="••••••••" />
          </div>

          <!-- Captcha Verification Field -->
          <div class="form-group captcha-wrapper" style="margin-bottom: 24px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
              <label class="form-label" for="captcha" style="margin-bottom: 0; font-weight: 600; color: var(--primary); font-size: 0.9rem;">Security Verification</label>
              <button type="button" (click)="loadCaptcha()" class="btn-refresh" style="background: none; border: none; color: var(--secondary); font-size: 0.8rem; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 4px; padding: 2px 6px; border-radius: 4px; transition: all 0.2s;">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="display: inline-block;"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/></svg>
                Refresh Code
              </button>
            </div>
            
            <div class="captcha-card" style="display: flex; flex-direction: column; gap: 12px; background-color: #F8FAFC; border: 1.5px solid #E2E8F0; border-radius: 8px; padding: 15px; margin-bottom: 12px; transition: all 0.2s; box-shadow: inset 0 1px 2px rgba(0,0,0,0.02);">
              <div style="display: flex; justify-content: center; align-items: center; background: white; border-radius: 6px; padding: 8px; border: 1px solid #E2E8F0; cursor: pointer;" (click)="loadCaptcha()" title="Click to refresh">
                <div [innerHTML]="captchaSvg" style="display: flex; align-items: center; justify-content: center; height: 50px;"></div>
              </div>
              <input type="text" id="captcha" name="captcha" [(ngModel)]="captchaCodeInput" class="form-control captcha-input" required placeholder="Type the 5-char code" autocomplete="off" style="text-align: center; font-size: 1.1rem; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; border: 1.5px solid #CBD5E1; border-radius: 6px; padding: 10px;" />
            </div>
          </div>

          <!-- Remember Me & Forgot Password -->
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; margin-top: -10px;">
            <label style="display: flex; align-items: center; gap: 8px; font-size: 0.85rem; color: var(--text-light); cursor: pointer; user-select: none;">
              <input type="checkbox" [(ngModel)]="rememberMe" name="rememberMe" style="width: 15px; height: 15px; border-radius: 4px; border: 1px solid #CBD5E1; accent-color: var(--secondary);" />
              Remember Me
            </label>
            <a (click)="toggleForgotPassword(true)" style="font-size: 0.85rem; color: var(--secondary); font-weight: 600; text-decoration: none; cursor: pointer; transition: all 0.2s;">
              Forgot Password?
            </a>
          </div>

          <button type="submit" class="btn btn-primary btn-block" [disabled]="loading">
            {{ loading ? 'Signing in...' : 'Sign In' }}
          </button>
        </form>

        <!-- Forgot Password Form -->
        <form (ngSubmit)="onSendResetLink()" #forgotForm="ngForm" *ngIf="forgotPasswordActive && !resetLinkSent">
          <div class="form-group" style="margin-bottom: 20px;">
            <label class="form-label" for="forgotEmail">Email Address</label>
            <p style="font-size: 0.85rem; color: var(--text-light); margin-top: 4px; margin-bottom: 12px; line-height: 1.4;">
              Enter your registered administrator email address and we will dispatch a secure password reset link.
            </p>
            <input type="email" id="forgotEmail" name="forgotEmail" [(ngModel)]="forgotEmail" class="form-control" required placeholder="admin@school.com" />
          </div>

          <button type="submit" class="btn btn-primary btn-block" [disabled]="loading">
            {{ loading ? 'Sending link...' : 'Send Reset Link' }}
          </button>

          <button type="button" class="btn btn-outline btn-block" (click)="toggleForgotPassword(false)" style="margin-top: 10px; border: 1px solid #CBD5E1; background: white; border-radius: 6px; cursor: pointer;">
             Back to Login
          </button>
        </form>

        <!-- Forgot Password Success Screen -->
        <div *ngIf="forgotPasswordActive && resetLinkSent" style="text-align: center; padding: 10px 0;">
          <div style="font-size: 3rem; margin-bottom: 15px;">✉️</div>
          <h3 style="color: var(--primary); margin-bottom: 10px; font-weight: 700;">Reset Link Dispatched</h3>
          <p style="font-size: 0.9rem; color: #475569; line-height: 1.6; margin-bottom: 20px;">
            If the email address <strong>{{ forgotEmail }}</strong> is registered, a password reset link has been dispatched successfully.
          </p>
          <div style="background-color: #F8FAFC; border: 1px solid #E2E8F0; padding: 12px; border-radius: 8px; font-size: 0.85rem; color: #64748B; margin-bottom: 25px; text-align: left; line-height: 1.5;">
            💡 <strong>Developer Note:</strong> Since this is a local development instance, inspect the <strong>FastAPI server terminal logs</strong> to view the mock email reset link.
          </div>
          <button type="button" class="btn btn-primary btn-block" (click)="resetForgotState()">
            Back to Login
          </button>
        </div>

        <!-- 2FA Form -->
        <form (ngSubmit)="onVerify2FA()" #twoFactorForm="ngForm" *ngIf="twoFactorRequired">
          <div class="form-group" style="margin-bottom: 20px;">
            <label class="form-label" for="2facode">Two-Factor Authentication Code</label>
            <p style="font-size: 0.85rem; color: var(--text-light); margin-top: 4px; margin-bottom: 12px; line-height: 1.4;">
              Enter the 6-digit verification code from your Google Authenticator app.
            </p>
            <input type="text" id="2facode" name="2facode" [(ngModel)]="twoFactorCode" class="form-control" required placeholder="123456" maxlength="6" autocomplete="off" style="text-align: center; letter-spacing: 6px; font-size: 1.4rem; font-weight: bold;" />
          </div>

          <button type="submit" class="btn btn-primary btn-block" [disabled]="loading">
            {{ loading ? 'Verifying...' : 'Verify & Login' }}
          </button>

          <button type="button" class="btn btn-outline btn-block" (click)="cancel2FA()" style="margin-top: 10px; border: 1px solid #CBD5E1; background: white; border-radius: 6px; cursor: pointer;">
            ← Back to Login
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

    .btn-refresh:hover {
      background-color: #F1F5F9 !important;
      color: var(--primary) !important;
    }

    .captcha-input:focus {
      border-color: var(--secondary) !important;
      box-shadow: 0 0 0 3px rgba(238, 90, 36, 0.15) !important;
      outline: none;
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
export class LoginComponent implements OnInit {
  loginData = { email: '', password: '' };
  loading = false;
  errorMessage = '';
  captchaId = '';
  captchaSvg = '';
  captchaCodeInput = '';

  twoFactorRequired = false;
  twoFactorToken = '';
  twoFactorCode = '';

  // Remember Me & Forgot Password State
  rememberMe = false;
  forgotPasswordActive = false;
  forgotEmail = '';
  resetLinkSent = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {
    if (this.authService.isLoggedIn()) {
      const user = this.authService.currentUserValue;
      if (user?.role?.toUpperCase() === 'PARENT') {
        this.router.navigate(['/parent/dashboard']);
      } else if (user?.role?.toUpperCase() === 'TEACHER') {
        this.router.navigate(['/admin/dashboard']);
      } else {
        this.router.navigate(['/admin/dashboard']);
      }
    }
    
    // Check saved email for Remember Me
    if (typeof window !== 'undefined') {
      const savedEmail = localStorage.getItem('remember_email');
      if (savedEmail) {
        this.loginData.email = savedEmail;
        this.rememberMe = true;
      }
    }
  }

  ngOnInit(): void {
    this.loadCaptcha();
  }

  loadCaptcha(): void {
    this.authService.getCaptcha().subscribe({
      next: (res) => {
        this.captchaId = res.captcha_id;
        this.captchaSvg = res.captcha_svg;
        this.captchaCodeInput = '';
      },
      error: () => {
        this.errorMessage = 'Failed to load captcha. Please try refreshing.';
      }
    });
  }

  onSubmit(): void {
    if (!this.loginData.email || !this.loginData.password) {
      this.errorMessage = 'Please enter email and password.';
      return;
    }
    if (!this.captchaCodeInput) {
      this.errorMessage = 'Please enter the verification captcha code.';
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    this.authService.login(
      this.loginData.email,
      this.loginData.password,
      this.captchaId,
      this.captchaCodeInput
    ).subscribe({
      next: (res) => {
        this.loading = false;
        
        // Handle Remember Me
        if (this.rememberMe) {
          localStorage.setItem('remember_email', this.loginData.email);
        } else {
          localStorage.removeItem('remember_email');
        }

        if (res.two_factor_required) {
          this.twoFactorRequired = true;
          this.twoFactorToken = res.two_factor_token || '';
          this.twoFactorCode = '';
        } else {
          if (res.user?.role?.toUpperCase() === 'PARENT') {
            this.router.navigate(['/parent/dashboard']);
          } else if (res.user?.role?.toUpperCase() === 'TEACHER') {
            this.router.navigate(['/admin/dashboard']);
          } else {
            this.router.navigate(['/admin/dashboard']);
          }
        }
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err.error?.detail || 'Incorrect credentials or captcha code.';
        this.loadCaptcha();
      }
    });
  }

  onVerify2FA(): void {
    if (!this.twoFactorCode || this.twoFactorCode.length !== 6) {
      this.errorMessage = 'Please enter a valid 6-digit code.';
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    this.authService.twoFactorLogin(this.twoFactorToken, this.twoFactorCode).subscribe({
      next: () => {
        this.loading = false;
        const user = this.authService.currentUserValue;
        if (user?.role?.toUpperCase() === 'PARENT') {
          this.router.navigate(['/parent/dashboard']);
        } else if (user?.role?.toUpperCase() === 'TEACHER') {
          this.router.navigate(['/admin/dashboard']);
        } else {
          this.router.navigate(['/admin/dashboard']);
        }
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err.error?.detail || 'Incorrect 2FA verification code.';
      }
    });
  }

  cancel2FA(): void {
    this.twoFactorRequired = false;
    this.twoFactorToken = '';
    this.twoFactorCode = '';
    this.errorMessage = '';
    this.loadCaptcha();
  }

  toggleForgotPassword(active: boolean): void {
    this.forgotPasswordActive = active;
    this.forgotEmail = active ? this.loginData.email : '';
    this.resetLinkSent = false;
    this.errorMessage = '';
    if (!active) {
      this.loadCaptcha();
    }
  }

  onSendResetLink(): void {
    if (!this.forgotEmail) {
      this.errorMessage = 'Please enter your email address.';
      return;
    }
    
    this.loading = true;
    this.errorMessage = '';
    
    this.authService.forgotPassword(this.forgotEmail).subscribe({
      next: () => {
        this.loading = false;
        this.resetLinkSent = true;
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err.error?.detail || 'Failed to dispatch reset link.';
      }
    });
  }

  resetForgotState(): void {
    this.toggleForgotPassword(false);
  }
}
