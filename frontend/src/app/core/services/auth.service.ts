import { Injectable, PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { ApiService } from './api.service';

export interface User {
  id: number;
  email: string;
  full_name: string;
  role: string;
  is_active: boolean;
  created_at: string;
  two_factor_enabled?: boolean;
  permissions?: string[];
}

export interface AuthResponse {
  access_token: string | null;
  refresh_token: string | null;
  token_type: string;
  user: User | null;
  two_factor_required?: boolean;
  two_factor_token?: string;
}

export interface CaptchaResponse {
  captcha_id: string;
  captcha_svg: string;
}

export interface TwoFactorSetupResponse {
  secret: string;
  qr_code_url: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  private isBrowser: boolean;

  constructor(
    private apiService: ApiService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
    if (this.isBrowser) {
      const storedUser = localStorage.getItem('school_user');
      if (storedUser) {
        try {
          this.currentUserSubject.next(JSON.parse(storedUser));
        } catch (e) {
          this.clearStorage();
        }
      }
    }
  }

  public get currentUserValue(): User | null {
    return this.currentUserSubject.value;
  }

  getAccessToken(): string | null {
    return this.isBrowser ? localStorage.getItem('access_token') : null;
  }

  getRefreshToken(): string | null {
    return this.isBrowser ? localStorage.getItem('refresh_token') : null;
  }

  getCaptcha(): Observable<CaptchaResponse> {
    return this.apiService.get<CaptchaResponse>('/auth/captcha?t=' + Date.now());
  }

  login(email: string, password: string, captchaId: string, captchaCode: string): Observable<AuthResponse> {
    return this.apiService.post<AuthResponse>('/auth/login', {
      email,
      password,
      captcha_id: captchaId,
      captcha_code: captchaCode
    }).pipe(
      tap(res => {
        if (!res.two_factor_required && res.access_token && res.user) {
          if (this.isBrowser) {
            localStorage.setItem('access_token', res.access_token!);
            localStorage.setItem('refresh_token', res.refresh_token!);
            localStorage.setItem('school_user', JSON.stringify(res.user));
          }
          this.currentUserSubject.next(res.user);
        }
      })
    );
  }

  get2faSetup(): Observable<TwoFactorSetupResponse> {
    return this.apiService.get<TwoFactorSetupResponse>('/auth/2fa/setup');
  }

  verify2faSetup(secret: string, code: string): Observable<User> {
    return this.apiService.post<User>('/auth/2fa/setup/verify', { secret, code }).pipe(
      tap(updatedUser => {
        if (this.isBrowser) {
          localStorage.setItem('school_user', JSON.stringify(updatedUser));
        }
        this.currentUserSubject.next(updatedUser);
      })
    );
  }

  disable2fa(code: string): Observable<User> {
    return this.apiService.post<User>('/auth/2fa/disable', { code }).pipe(
      tap(updatedUser => {
        if (this.isBrowser) {
          localStorage.setItem('school_user', JSON.stringify(updatedUser));
        }
        this.currentUserSubject.next(updatedUser);
      })
    );
  }

  twoFactorLogin(twoFactorToken: string, code: string): Observable<AuthResponse> {
    return this.apiService.post<AuthResponse>('/auth/2fa/login', { two_factor_token: twoFactorToken, code }).pipe(
      tap(res => {
        if (res.access_token && res.user) {
          if (this.isBrowser) {
            localStorage.setItem('access_token', res.access_token!);
            localStorage.setItem('refresh_token', res.refresh_token!);
            localStorage.setItem('school_user', JSON.stringify(res.user));
          }
          this.currentUserSubject.next(res.user);
        }
      })
    );
  }

  refreshToken(): Observable<AuthResponse> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      return throwError(() => new Error('No refresh token available'));
    }
    return this.apiService.post<AuthResponse>('/auth/refresh', { refresh_token: refreshToken }).pipe(
      tap(res => {
        if (this.isBrowser) {
          localStorage.setItem('access_token', res.access_token!);
          localStorage.setItem('refresh_token', res.refresh_token!);
          localStorage.setItem('school_user', JSON.stringify(res.user!));
        }
        this.currentUserSubject.next(res.user!);
      }),
      catchError(err => {
        this.logout();
        return throwError(() => err);
      })
    );
  }

  logout(): void {
    const refreshToken = this.getRefreshToken();
    if (refreshToken) {
      this.apiService.post('/auth/logout', { refresh_token: refreshToken }).subscribe({
        next: () => {},
        error: () => {}
      });
    }
    this.clearStorage();
    this.currentUserSubject.next(null);
  }

  private clearStorage(): void {
    if (this.isBrowser) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('school_user');
    }
  }

  isLoggedIn(): boolean {
    return this.currentUserValue !== null;
  }

  getUsers(): Observable<User[]> {
    return this.apiService.get<User[]>('/auth/users');
  }

  createUser(userData: any): Observable<User> {
    return this.apiService.post<User>('/auth/users', userData);
  }

  updateUser(userId: number, userData: any): Observable<User> {
    return this.apiService.put<User>(`/auth/users/${userId}`, userData);
  }

  deleteUser(userId: number): Observable<any> {
    return this.apiService.delete<any>(`/auth/users/${userId}`);
  }

  forgotPassword(email: string): Observable<any> {
    return this.apiService.post<any>('/auth/forgot-password', { email });
  }

  resetPassword(token: string, newPassword: string): Observable<any> {
    return this.apiService.post<any>('/auth/reset-password', { token, new_password: newPassword });
  }

  hasPermission(feature: string): boolean {
    const user = this.currentUserValue;
    if (!user) return false;
    if (user.role?.toUpperCase() === 'SUPERADMIN') return true;
    if (!user.permissions) return false;
    return user.permissions.includes(feature);
  }
}
