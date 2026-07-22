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
          <h2>School Portal Sign In</h2>
          <p>Select your portal, verify credentials and access your dashboard</p>
        </div>

        <div class="alert alert-danger" *ngIf="errorMessage">
          ⚠️ {{ errorMessage }}
        </div>

        <!-- Portal Type Selector Tabs -->
        <div style="display: flex; gap: 8px; margin-bottom: 14px; background: #F1F5F9; padding: 4px; border-radius: 8px;">
          <button type="button" (click)="setPortalTab('staff')"
                  [style.background]="activePortalTab === 'staff' ? 'white' : 'transparent'"
                  [style.color]="activePortalTab === 'staff' ? '#0F172A' : '#64748B'"
                  [style.box-shadow]="activePortalTab === 'staff' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'"
                  style="flex: 1; padding: 7px; font-weight: 800; font-size: 0.85rem; border: none; border-radius: 6px; cursor: pointer; transition: all 0.2s;">
            🛡️ Staff / Admin Login
          </button>
          <button type="button" (click)="setPortalTab('parent')"
                  [style.background]="activePortalTab === 'parent' ? 'white' : 'transparent'"
                  [style.color]="activePortalTab === 'parent' ? '#2563EB' : '#64748B'"
                  [style.box-shadow]="activePortalTab === 'parent' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'"
                  style="flex: 1; padding: 7px; font-weight: 800; font-size: 0.85rem; border: none; border-radius: 6px; cursor: pointer; transition: all 0.2s;">
            👨‍👩‍👧 Parent Login by Class
          </button>
        </div>

        <!-- Class-Based Parent Helper Selector -->
        <div *ngIf="activePortalTab === 'parent' && !twoFactorRequired && !forgotPasswordActive"
             style="background: #EFF6FF; border: 1.5px solid #BFDBFE; border-radius: 8px; padding: 10px 14px; margin-bottom: 14px;">
          <div style="font-weight: 800; color: #1E40AF; font-size: 0.82rem; margin-bottom: 6px;">
            🏫 Select Student Class & Parent Account
          </div>
          
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 4px;">
            <div>
              <label style="display: block; font-size: 0.72rem; font-weight: 700; color: #1E3A8A; margin-bottom: 3px;">1. Student Class</label>
              <select [(ngModel)]="selectedParentClassId" (change)="onParentClassChange()" class="form-control" style="font-size: 0.8rem; padding: 5px 8px; background: white; border: 1px solid #93C5FD;">
                <option *ngFor="let cls of parentClasses" [value]="cls.program_id">
                  {{ cls.program_title }}
                </option>
              </select>
            </div>

            <div>
              <label style="display: block; font-size: 0.72rem; font-weight: 700; color: #1E3A8A; margin-bottom: 3px;">2. Student / Child</label>
              <select [(ngModel)]="selectedParentStudentId" (change)="onParentStudentChange()" class="form-control" style="font-size: 0.8rem; padding: 5px 8px; background: white; border: 1px solid #93C5FD;">
                <option *ngFor="let std of selectedParentStudents" [value]="std.student_id">
                  {{ std.student_name }} ({{ std.parent_name }})
                </option>
                <option *ngIf="selectedParentStudents.length === 0" disabled>No students registered</option>
              </select>
            </div>
          </div>
        </div>

        <form (ngSubmit)="onSubmit()" #loginForm="ngForm" *ngIf="!twoFactorRequired && !forgotPasswordActive">
          <!-- Side-by-side Email & Password Grid -->
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 12px;">
            <div class="form-group" style="margin-bottom: 0;">
              <label class="form-label" for="email" style="font-size: 0.8rem; margin-bottom: 4px;">{{ activePortalTab === 'parent' ? 'Parent Email' : 'Email Address' }}</label>
              <input type="email" id="email" name="email" [(ngModel)]="loginData.email" class="form-control" required [placeholder]="activePortalTab === 'parent' ? 'parent@school.com' : 'admin@school.com'" style="padding: 7px 10px; font-size: 0.88rem;" />
            </div>

            <div class="form-group" style="margin-bottom: 0;">
              <label class="form-label" for="password" style="font-size: 0.8rem; margin-bottom: 4px;">Password</label>
              <input type="password" id="password" name="password" [(ngModel)]="loginData.password" class="form-control" required placeholder="••••••••" style="padding: 7px 10px; font-size: 0.88rem;" />
            </div>
          </div>

          <!-- Captcha Verification Field (Side-by-Side SVG & Input) -->
          <div class="form-group captcha-wrapper" style="margin-bottom: 14px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
              <label class="form-label" for="captcha" style="margin-bottom: 0; font-weight: 700; color: var(--primary); font-size: 0.82rem;">Security Verification</label>
              <button type="button" (click)="loadCaptcha()" class="btn-refresh" style="background: none; border: none; color: var(--secondary); font-size: 0.75rem; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 4px; padding: 2px 4px; border-radius: 4px;">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="display: inline-block;"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/></svg>
                Refresh Code
              </button>
            </div>
            
            <div class="captcha-card" style="display: flex; flex-direction: row; gap: 12px; align-items: center; background-color: #F8FAFC; border: 1.5px solid #E2E8F0; border-radius: 8px; padding: 8px 12px; transition: all 0.2s;">
              <div style="flex: 1; display: flex; justify-content: center; align-items: center; background: white; border-radius: 6px; padding: 4px 8px; border: 1px solid #E2E8F0; cursor: pointer; height: 42px;" (click)="loadCaptcha()" title="Click to refresh">
                <div [innerHTML]="captchaSvg" style="display: flex; align-items: center; justify-content: center; height: 38px;"></div>
              </div>
              <input type="text" id="captcha" name="captcha" [(ngModel)]="captchaCodeInput" class="form-control captcha-input" required placeholder="5-char code" autocomplete="off" style="flex: 1; height: 42px; text-align: center; font-size: 1rem; font-weight: 800; letter-spacing: 2px; text-transform: uppercase; border: 1.5px solid #CBD5E1; border-radius: 6px; padding: 6px;" />
            </div>
          </div>

          <!-- Remember Me & Forgot Password -->
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px;">
            <label style="display: flex; align-items: center; gap: 8px; font-size: 0.8rem; color: var(--text-light); cursor: pointer; user-select: none;">
              <input type="checkbox" [(ngModel)]="rememberMe" name="rememberMe" style="width: 14px; height: 14px; border-radius: 4px; border: 1px solid #CBD5E1; accent-color: var(--secondary);" />
              Remember Me
            </label>
            <a (click)="toggleForgotPassword(true)" style="font-size: 0.8rem; color: var(--secondary); font-weight: 700; text-decoration: none; cursor: pointer;">
              Forgot Password?
            </a>
          </div>

          <button type="submit" class="btn btn-primary btn-block" [disabled]="loading" style="padding: 10px; font-size: 0.95rem; font-weight: 800;">
            {{ loading ? 'Signing in...' : 'Sign In' }}
          </button>
        </form>

        <!-- Forgot Password Form -->
        <form (ngSubmit)="onSendResetLink()" #forgotForm="ngForm" *ngIf="forgotPasswordActive && !resetLinkSent">
          <div class="form-group" style="margin-bottom: 16px;">
            <label class="form-label" for="forgotEmail" style="font-size: 0.82rem;">Email Address</label>
            <p style="font-size: 0.8rem; color: var(--text-light); margin-top: 4px; margin-bottom: 10px; line-height: 1.4;">
              Enter your registered administrator email address and we will dispatch a secure password reset link.
            </p>
            <input type="email" id="forgotEmail" name="forgotEmail" [(ngModel)]="forgotEmail" class="form-control" required placeholder="admin@school.com" style="padding: 8px 10px;" />
          </div>

          <button type="submit" class="btn btn-primary btn-block" [disabled]="loading" style="padding: 10px; font-weight: 700;">
            {{ loading ? 'Sending link...' : 'Send Reset Link' }}
          </button>

          <button type="button" class="btn btn-outline btn-block" (click)="toggleForgotPassword(false)" style="margin-top: 10px; border: 1px solid #CBD5E1; background: white; border-radius: 6px; cursor: pointer; padding: 8px;">
             Back to Login
          </button>
        </form>

        <!-- Forgot Password Success Screen -->
        <div *ngIf="forgotPasswordActive && resetLinkSent" style="text-align: center; padding: 10px 0;">
          <div style="font-size: 2.5rem; margin-bottom: 10px;">✉️</div>
          <h3 style="color: var(--primary); margin-bottom: 8px; font-weight: 700; font-size: 1.2rem;">Reset Link Dispatched</h3>
          <p style="font-size: 0.85rem; color: #475569; line-height: 1.5; margin-bottom: 16px;">
            If the email address <strong>{{ forgotEmail }}</strong> is registered, a password reset link has been dispatched successfully.
          </p>
          <button type="button" class="btn btn-primary btn-block" (click)="resetForgotState()" style="padding: 9px;">
            Back to Login
          </button>
        </div>

        <!-- 2FA Form -->
        <form (ngSubmit)="onVerify2FA()" #twoFactorForm="ngForm" *ngIf="twoFactorRequired">
          <div class="form-group" style="margin-bottom: 16px;">
            <label class="form-label" for="2facode" style="font-size: 0.82rem;">Two-Factor Authentication Code</label>
            <p style="font-size: 0.8rem; color: var(--text-light); margin-top: 4px; margin-bottom: 10px; line-height: 1.4;">
              Enter the 6-digit verification code from your Google Authenticator app.
            </p>
            <input type="text" id="2facode" name="2facode" [(ngModel)]="twoFactorCode" class="form-control" required placeholder="123456" maxlength="6" autocomplete="off" style="text-align: center; letter-spacing: 6px; font-size: 1.3rem; font-weight: bold; padding: 8px;" />
          </div>

          <button type="submit" class="btn btn-primary btn-block" [disabled]="loading" style="padding: 10px; font-weight: 700;">
            {{ loading ? 'Verifying...' : 'Verify & Login' }}
          </button>

          <button type="button" class="btn btn-outline btn-block" (click)="cancel2FA()" style="margin-top: 10px; border: 1px solid #CBD5E1; background: white; border-radius: 6px; cursor: pointer; padding: 8px;">
            ← Back to Login
          </button>
        </form>

        <div class="back-link" style="margin-top: 14px;">
          <a routerLink="/" style="font-size: 0.82rem;">← Back to Home Page</a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .login-wrapper {
      height: 100vh;
      width: 100vw;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, rgba(15, 23, 42, 0.75), rgba(30, 58, 138, 0.65)), url('/assets/images/space_exploration.png') center/cover no-repeat;
      padding: 16px;
      overflow: hidden;
      box-sizing: border-box;
      position: relative;
    }

    .login-card {
      background-color: rgba(255, 255, 255, 0.96);
      backdrop-filter: blur(12px);
      padding: 28px 40px;
      border-radius: 24px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3), 0 0 25px rgba(59, 130, 246, 0.25);
      width: 100%;
      max-width: 650px;
      border: 3px solid #60A5FA;
      box-sizing: border-box;
      max-height: 98vh;
      overflow-y: auto;
      position: relative;
      z-index: 2;
    }


    .brand {
      text-align: center;
      margin-bottom: 16px;
    }

    .logo {
      height: 48px;
      margin-bottom: 6px;
      object-fit: contain;
    }

    .brand h2 {
      color: var(--primary);
      font-size: 1.35rem;
      font-family: var(--font-heading);
      margin-bottom: 2px;
    }

    .brand p {
      font-size: 0.82rem;
      color: var(--text-light);
      margin: 0;
    }

    .alert {
      padding: 10px;
      background-color: #FEE2E2;
      color: #991B1B;
      border-radius: var(--border-radius-sm);
      font-size: 0.85rem;
      margin-bottom: 14px;
      font-weight: 600;
    }

    .btn-block {
      width: 100%;
      padding: 10px;
      margin-top: 6px;
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
      margin-top: 12px;
    }

    .back-link a {
      color: var(--text-light);
      text-decoration: none;
      font-size: 0.82rem;
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
        this.router.navigate(['/teacher/dashboard']);
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

  // Class-Based Parent Login State
  activePortalTab: 'staff' | 'parent' = 'staff';
  parentClasses: any[] = [];
  selectedParentClassId: number | null = null;
  selectedParentStudentId: number | null = null;
  selectedParentStudents: any[] = [];

  ngOnInit(): void {
    this.loadCaptcha();
    this.loadParentClasses();
  }

  setPortalTab(tab: 'staff' | 'parent'): void {
    this.activePortalTab = tab;
    if (tab === 'parent' && this.parentClasses.length === 0) {
      this.loadParentClasses();
    }
  }

  loadParentClasses(): void {
    this.authService.getParentClasses().subscribe({
      next: (res) => {
        this.parentClasses = res;
        if (res.length > 0) {
          this.selectedParentClassId = res[0].program_id;
          this.onParentClassChange();
        }
      },
      error: () => {}
    });
  }

  onParentClassChange(): void {
    const cls = this.parentClasses.find(c => c.program_id === Number(this.selectedParentClassId));
    if (cls && cls.students.length > 0) {
      this.selectedParentStudents = cls.students;
      this.selectedParentStudentId = cls.students[0].student_id;
      this.onParentStudentChange();
    } else {
      this.selectedParentStudents = [];
      this.selectedParentStudentId = null;
    }
  }

  onParentStudentChange(): void {
    const std = this.selectedParentStudents.find(s => s.student_id === Number(this.selectedParentStudentId));
    if (std) {
      this.loginData.email = std.parent_email;
      this.loginData.password = std.default_password || 'Parent@123';
    }
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
            this.router.navigate(['/teacher/dashboard']);
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
          this.router.navigate(['/teacher/dashboard']);
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
