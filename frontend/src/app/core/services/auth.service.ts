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
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: User;
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

  login(email: string, password: string): Observable<AuthResponse> {
    return this.apiService.post<AuthResponse>('/auth/login', { email, password }).pipe(
      tap(res => {
        if (this.isBrowser) {
          localStorage.setItem('access_token', res.access_token);
          localStorage.setItem('refresh_token', res.refresh_token);
          localStorage.setItem('school_user', JSON.stringify(res.user));
        }
        this.currentUserSubject.next(res.user);
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
          localStorage.setItem('access_token', res.access_token);
          localStorage.setItem('refresh_token', res.refresh_token);
          localStorage.setItem('school_user', JSON.stringify(res.user));
        }
        this.currentUserSubject.next(res.user);
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
}
