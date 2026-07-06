import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { HeaderComponent } from '../../shared/components/header/header.component';
import { FooterComponent } from '../../shared/components/footer/footer.component';
import { ContentService } from '../../core/services/content.service';

@Component({
  selector: 'app-contact-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, HeaderComponent, FooterComponent],
  template: `
    <app-header></app-header>
    
    <div class="banner-area">
      <div class="container">
        <h1>Contact Us</h1>
        <p class="breadcrumbs"><a routerLink="/">Home</a> / Contact</p>
      </div>
    </div>

    <div class="page-content-wrapper container grid-2">
      <!-- Contact Info Card -->
      <div class="contact-info-panel">
        <h2>Get in Touch</h2>
        <p class="intro">We would love to hear from you. Reach out to book a school tour or discuss registration details.</p>

        <ul class="info-list">
          <li *ngIf="settings.address">
            <span class="icon">📍</span>
            <div>
              <h4>Campus Location</h4>
              <p>{{ settings.address }}</p>
            </div>
          </li>
          <li *ngIf="settings.contact_phone">
            <span class="icon">📞</span>
            <div>
              <h4>Phone Number</h4>
              <p>{{ settings.contact_phone }}</p>
            </div>
          </li>
          <li *ngIf="settings.contact_email">
            <span class="icon">✉️</span>
            <div>
              <h4>Email Support</h4>
              <p>{{ settings.contact_email }}</p>
            </div>
          </li>
          <li *ngIf="settings.opening_hours">
            <span class="icon">⏰</span>
            <div>
              <h4>Working Hours</h4>
              <p>{{ settings.opening_hours }}</p>
            </div>
          </li>
        </ul>
      </div>

      <!-- Contact Form Card -->
      <div class="card contact-form-card">
        <h3 class="form-title">Send a message</h3>
        
        <div class="alert alert-success" *ngIf="formSuccess">
          🎉 Thank you! Your message has been received. Our counselor will connect with you soon.
        </div>
        <div class="alert alert-danger" *ngIf="formError">
          ⚠️ {{ formError }}
        </div>

        <form (ngSubmit)="onSubmit()" #contactForm="ngForm" *ngIf="!formSuccess">
          <div class="form-group">
            <label class="form-label" for="name">Your Name *</label>
            <input type="text" id="name" name="name" [(ngModel)]="contactData.name" class="form-control" required placeholder="Enter full name" />
          </div>

          <div class="form-group">
            <label class="form-label" for="email">Your Email *</label>
            <input type="email" id="email" name="email" [(ngModel)]="contactData.email" class="form-control" required placeholder="name@email.com" />
          </div>

          <div class="form-group">
            <label class="form-label" for="phone">Your Phone *</label>
            <input type="tel" id="phone" name="phone" [(ngModel)]="contactData.phone" class="form-control" required placeholder="10-digit mobile number" />
          </div>

          <div class="form-group">
            <label class="form-label" for="subject">Subject</label>
            <select id="subject" name="subject" [(ngModel)]="contactData.subject" class="form-control">
              <option value="General Enquiry">General Enquiry</option>
              <option value="Admissions Inquiries">Admissions Inquiries</option>
              <option value="Franchise Opportunity">Franchise Opportunity</option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label" for="message">Message *</label>
            <textarea id="message" name="message" [(ngModel)]="contactData.message" class="form-control" rows="5" required placeholder="Type your message details..."></textarea>
          </div>

          <button type="submit" class="btn btn-primary btn-block" [disabled]="loading">
            {{ loading ? 'Sending message...' : 'Submit Message' }}
          </button>
        </form>
      </div>
    </div>

    <app-footer></app-footer>
  `,
  styles: [`
    .banner-area {
      background-color: var(--primary);
      color: var(--white);
      padding: 50px 0;
      text-align: center;
    }

    .banner-area h1 {
      font-size: 2.2rem;
      margin-bottom: 8px;
    }

    .breadcrumbs {
      font-size: 0.9rem;
      font-weight: 600;
    }

    .breadcrumbs a {
      color: var(--secondary);
      text-decoration: none;
    }

    .page-content-wrapper {
      padding: 60px 24px;
      min-height: 400px;
    }

    .contact-info-panel h2 {
      font-size: 2rem;
      color: var(--text-dark);
      margin-bottom: 12px;
    }

    .contact-info-panel .intro {
      font-size: 1.1rem;
      color: var(--text-light);
      margin-bottom: 30px;
    }

    .info-list {
      list-style: none;
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    .info-list li {
      display: flex;
      gap: 16px;
      align-items: flex-start;
    }

    .info-list .icon {
      font-size: 1.5rem;
      background-color: rgba(238, 90, 36, 0.1);
      width: 48px;
      height: 48px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      flex-shrink: 0;
    }

    .info-list h4 {
      font-size: 1.05rem;
      color: var(--text-dark);
      margin-bottom: 4px;
    }

    .info-list p {
      font-size: 0.95rem;
      color: var(--text-light);
    }

    .contact-form-card {
      padding: 30px;
    }

    .form-title {
      font-size: 1.4rem;
      margin-bottom: 20px;
    }

    .alert {
      padding: 12px;
      font-size: 0.9rem;
      border-radius: var(--border-radius-sm);
      margin-bottom: 20px;
      font-weight: 600;
    }

    .alert-success { background-color: #DCFCE7; color: #166534; }
    .alert-danger { background-color: #FEE2E2; color: #991B1B; }

    .btn-block {
      width: 100%;
      padding: 12px;
    }
  `]
})
export class ContactPageComponent implements OnInit {
  settings: any = {};
  contactData = { name: '', email: '', phone: '', subject: 'General Enquiry', message: '' };
  loading = false;
  formSuccess = false;
  formError = '';

  constructor(private contentService: ContentService) {}

  ngOnInit(): void {
    this.contentService.getSettings().subscribe({
      next: (data) => this.settings = data,
      error: () => {}
    });
  }

  onSubmit(): void {
    if (!this.contactData.name || !this.contactData.email || !this.contactData.phone || !this.contactData.message) {
      this.formError = 'Please fill out all required fields.';
      return;
    }

    this.loading = true;
    this.formError = '';
    this.formSuccess = false;

    this.contentService.submitContactForm(this.contactData).subscribe({
      next: () => {
        this.loading = false;
        this.formSuccess = true;
        this.contactData = { name: '', email: '', phone: '', subject: 'General Enquiry', message: '' };
      },
      error: () => {
        this.loading = false;
        this.formError = 'Could not submit your enquiry. Please try again later.';
      }
    });
  }
}
