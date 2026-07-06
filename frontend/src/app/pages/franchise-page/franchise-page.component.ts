import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { HeaderComponent } from '../../shared/components/header/header.component';
import { FooterComponent } from '../../shared/components/footer/footer.component';
import { ContentService } from '../../core/services/content.service';

@Component({
  selector: 'app-franchise-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, HeaderComponent, FooterComponent],
  template: `
    <app-header></app-header>
    
    <div class="banner-area">
      <div class="container">
        <h1>Partner with Us (Franchise)</h1>
        <p class="breadcrumbs"><a routerLink="/">Home</a> / Franchise</p>
      </div>
    </div>

    <div class="page-content-wrapper container grid-2">
      <!-- Franchise Info -->
      <div class="franchise-info">
        <h2>Why Partner with Kangaroo Club?</h2>
        <p class="intro">Join our award-winning network of preschools and make a significant difference in child education while running a highly rewarding business.</p>
        
        <div class="benefits-list">
          <div class="benefit-item">
            <span class="bullet">🚀</span>
            <div>
              <h3>Proven Business Model</h3>
              <p>Over a decade of operational excellence with established school management templates and standard operating procedures.</p>
            </div>
          </div>
          <div class="benefit-item">
            <span class="bullet">📚</span>
            <div>
              <h3>Premium Curriculum Support</h3>
              <p>Access to our complete child-centric curriculum, daily lesson schedules, training portals, and activity worksheets.</p>
            </div>
          </div>
          <div class="benefit-item">
            <span class="bullet">👩‍🏫</span>
            <div>
              <h3>Staff Recruitment & Training</h3>
              <p>Comprehensive assistance in hiring and training teachers, curriculum managers, and support administrators.</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Franchise Form -->
      <div class="card franchise-form-card">
        <h3 class="form-title">Franchise Inquiry Form</h3>
        
        <div class="alert alert-success" *ngIf="formSuccess">
          🎉 Thank you for your interest! Our Business Development Head will connect with you via email or phone within 48 hours.
        </div>
        <div class="alert alert-danger" *ngIf="formError">
          ⚠️ {{ formError }}
        </div>

        <form (ngSubmit)="onSubmit()" #franchiseForm="ngForm" *ngIf="!formSuccess">
          <div class="form-group">
            <label class="form-label" for="name">Your Name *</label>
            <input type="text" id="name" name="name" [(ngModel)]="inquiryData.name" class="form-control" required placeholder="Enter full name" />
          </div>

          <div class="grid-2">
            <div class="form-group">
              <label class="form-label" for="email">Email *</label>
              <input type="email" id="email" name="email" [(ngModel)]="inquiryData.email" class="form-control" required placeholder="name@email.com" />
            </div>
            <div class="form-group">
              <label class="form-label" for="phone">Phone *</label>
              <input type="tel" id="phone" name="phone" [(ngModel)]="inquiryData.phone" class="form-control" required placeholder="Contact number" />
            </div>
          </div>

          <div class="grid-2">
            <div class="form-group">
              <label class="form-label" for="city">Target City *</label>
              <input type="text" id="city" name="city" [(ngModel)]="inquiryData.city" class="form-control" required placeholder="e.g., Pune" />
            </div>
            <div class="form-group">
              <label class="form-label" for="state">State *</label>
              <input type="text" id="state" name="state" [(ngModel)]="inquiryData.state" class="form-control" required placeholder="e.g., Maharashtra" />
            </div>
          </div>

          <div class="form-group">
            <label class="form-label" for="investment">Planned Investment Budget</label>
            <select id="investment" name="investment_range" [(ngModel)]="inquiryData.investment_range" class="form-control">
              <option value="INR 10 - 15 Lakhs">INR 10 - 15 Lakhs</option>
              <option value="INR 15 - 25 Lakhs">INR 15 - 25 Lakhs</option>
              <option value="INR 25 Lakhs+">INR 25 Lakhs+</option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label" for="message">Detailed Note / Experience</label>
            <textarea id="message" name="message" [(ngModel)]="inquiryData.message" class="form-control" rows="4" placeholder="Briefly describe your business background..."></textarea>
          </div>

          <button type="submit" class="btn btn-primary btn-block" [disabled]="loading">
            {{ loading ? 'Submitting Form...' : 'Submit Inquiry' }}
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

    .franchise-info h2 {
      font-size: 2rem;
      color: var(--text-dark);
      margin-bottom: 12px;
    }

    .franchise-info .intro {
      font-size: 1.1rem;
      color: var(--text-light);
      margin-bottom: 30px;
    }

    .benefits-list {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    .benefit-item {
      display: flex;
      gap: 16px;
      align-items: flex-start;
    }

    .benefit-item .bullet {
      font-size: 1.6rem;
      flex-shrink: 0;
    }

    .benefit-item h3 {
      font-size: 1.1rem;
      color: var(--text-dark);
      margin-bottom: 4px;
    }

    .benefit-item p {
      font-size: 0.95rem;
      color: var(--text-light);
      line-height: 1.5;
    }

    .franchise-form-card {
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
export class FranchisePageComponent implements OnInit {
  inquiryData = { name: '', email: '', phone: '', city: '', state: '', investment_range: 'INR 10 - 15 Lakhs', message: '' };
  loading = false;
  formSuccess = false;
  formError = '';

  constructor(private contentService: ContentService) {}

  ngOnInit(): void {}

  onSubmit(): void {
    if (!this.inquiryData.name || !this.inquiryData.email || !this.inquiryData.phone || !this.inquiryData.city || !this.inquiryData.state) {
      this.formError = 'Please fill out all required fields.';
      return;
    }

    this.loading = true;
    this.formError = '';
    this.formSuccess = false;

    this.contentService.submitFranchiseInquiry(this.inquiryData).subscribe({
      next: () => {
        this.loading = false;
        this.formSuccess = true;
        this.inquiryData = { name: '', email: '', phone: '', city: '', state: '', investment_range: 'INR 10 - 15 Lakhs', message: '' };
      },
      error: () => {
        this.loading = false;
        this.formError = 'Failed to submit form. Please check details and try again.';
      }
    });
  }
}
