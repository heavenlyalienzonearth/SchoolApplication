import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface ActiveRequest {
  method: string;
  url: string;
}

@Injectable({
  providedIn: 'root'
})
export class LoadingService {
  private activeRequests = 0;
  private requests: ActiveRequest[] = [];
  
  private loadingSubject = new BehaviorSubject<boolean>(false);
  public loading$ = this.loadingSubject.asObservable();

  private messageSubject = new BehaviorSubject<string>('Loading secure data...');
  public message$ = this.messageSubject.asObservable();

  show(method: string, url: string): void {
    this.activeRequests++;
    this.requests.push({ method: method.toUpperCase(), url });
    this.updateMessage();
    this.loadingSubject.next(true);
  }

  hide(method: string, url: string): void {
    if (this.activeRequests > 0) {
      this.activeRequests--;
    }
    const index = this.requests.findIndex(
      r => r.method === method.toUpperCase() && r.url === url
    );
    if (index > -1) {
      this.requests.splice(index, 1);
    }
    this.updateMessage();
    if (this.activeRequests === 0) {
      this.loadingSubject.next(false);
    }
  }

  clear(): void {
    this.activeRequests = 0;
    this.requests = [];
    this.loadingSubject.next(false);
    this.messageSubject.next('Loading secure data...');
  }

  private updateMessage(): void {
    if (this.requests.length === 0) {
      this.messageSubject.next('Loading secure data...');
      return;
    }

    // Match priority authentication operations first
    for (const req of this.requests) {
      const url = req.url.toLowerCase();
      
      if (url.includes('/auth/login') || url.includes('/auth/2fa/login')) {
        this.messageSubject.next('Authenticating credentials...');
        return;
      }
      if (url.includes('/auth/logout')) {
        this.messageSubject.next('Terminating secure session...');
        return;
      }
      if (url.includes('/auth/users') && req.method === 'POST') {
        this.messageSubject.next('Creating new user profile...');
        return;
      }
      if (
        url.includes('/auth/reset-password') || 
        url.includes('/auth/forgot-password') || 
        url.includes('password')
      ) {
        this.messageSubject.next('Updating secure credentials...');
        return;
      }
    }

    // General fallback checks based on HTTP methods
    const activeMethods = this.requests.map(r => r.method);
    if (activeMethods.includes('DELETE')) {
      this.messageSubject.next('Deleting secure data...');
    } else if (activeMethods.includes('POST') || activeMethods.includes('PUT') || activeMethods.includes('PATCH')) {
      this.messageSubject.next('Saving secure updates...');
    } else {
      this.messageSubject.next('Loading secure data...');
    }
  }
}
