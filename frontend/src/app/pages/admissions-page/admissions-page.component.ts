import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { HeaderComponent } from '../../shared/components/header/header.component';
import { FooterComponent } from '../../shared/components/footer/footer.component';
import { ContentService } from '../../core/services/content.service';

@Component({
  selector: 'app-admissions-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, HeaderComponent, FooterComponent],
  template: `
    <app-header></app-header>
    
    <div class="banner-area">
      <div class="container">
        <h1>Preschool Admission Form</h1>
        <p class="breadcrumbs"><a routerLink="/">Home</a> / Admissions</p>
      </div>
    </div>

    <div class="page-content-wrapper container grid-2">
      <!-- Admissions Info Pane -->
      <div class="admissions-info-pane">
        <div class="info-header">
          <h2><span class="text-dark">Admission</span> <span class="text-primary">Enquiry</span></h2>
          <div class="underline-accent"></div>
        </div>
        
        <p class="content-desc">
          Vidyankuram Kids has always been ‘learner centric’ and open to change which has reflected in our approach towards preschool, playschool, kindergarten, and nursery learning over the last 30 years. At Vidyankuram Kids, it has been a constant endeavour to ensure the best preschool learning for our children with our vision for an exciting future for our children. Our new age iCan Learning System has been developed to prepare our children to live in this thriving and accelerated world. Register for Vidyankuram Kids' preschool in India and get admission today!
        </p>

        <div class="admissions-image-box">
          <img src="/assets/images/admissions_banner.jpg" alt="Children heading to kindergarten school" class="admissions-img shadow-lg" />
        </div>
      </div>

      <!-- Admissions Form Pane -->
      <div class="card admissions-form-card">
        <h3 class="form-title">Admission Enquiry AY 2026-27</h3>
        <p class="form-subtitle">Fill in the details below and our counsellor will guide you through the process.</p>
        
        <div class="alert alert-success" *ngIf="formSuccess">
          🎉 Thank you! The admission enquiry has been successfully sent. A school admissions coordinator will call you back within 24 hours.
        </div>
        
        <div class="alert alert-danger" *ngIf="formError">
          ⚠️ {{ formError }}
        </div>

        <form (ngSubmit)="onSubmit()" #enrollForm="ngForm" *ngIf="!formSuccess">
          <div class="form-group">
            <label class="form-label" for="childName">Student Name *</label>
            <input type="text" id="childName" name="childName" [(ngModel)]="formData.childName" class="form-control" required placeholder="Enter child's full name" />
          </div>

          <div class="grid-2">
            <div class="form-group">
              <label class="form-label" for="childDob">Child Date of Birth *</label>
              <input type="date" id="childDob" name="childDob" [(ngModel)]="formData.childDob" class="form-control" required />
            </div>
            <div class="form-group">
              <label class="form-label" for="grade">Program / Grade *</label>
              <select id="grade" name="grade" [(ngModel)]="formData.grade" class="form-control" required>
                <option value="Playgroup">Playgroup (1.5 - 2.5 yrs)</option>
                <option value="Nursery">Nursery (2.5 - 3.5 yrs)</option>
                <option value="Junior KG">Junior KG (3.5 - 4.5 yrs)</option>
                <option value="Senior KG">Senior KG (4.5 - 5.5 yrs)</option>
                <option value="Daycare">Daycare / After School</option>
              </select>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label" for="parentName">Parent / Guardian Name *</label>
            <input type="text" id="parentName" name="parentName" [(ngModel)]="formData.parentName" class="form-control" required placeholder="Enter parent's full name" />
          </div>

          <div class="grid-2">
            <div class="form-group">
              <label class="form-label" for="email">Email Address *</label>
              <input type="email" id="email" name="email" [(ngModel)]="formData.email" class="form-control" required placeholder="parent@email.com" />
            </div>
            <div class="form-group">
              <label class="form-label" for="phone">Mobile Number *</label>
              <input type="tel" id="phone" name="phone" [(ngModel)]="formData.phone" class="form-control" required placeholder="10-digit number" />
            </div>
          </div>

          <div class="grid-2">
            <div class="form-group">
              <label class="form-label" for="city">City *</label>
              <input type="text" id="city" name="city" [(ngModel)]="formData.city" class="form-control" required placeholder="e.g., Mumbai" />
            </div>
            <div class="form-group">
              <label class="form-label" for="center">Preferred Center *</label>
              <select id="center" name="center" [(ngModel)]="formData.center" class="form-control" required>
                <option value="Main Campus Center">Main Campus Center</option>
                <option value="North Valley Hub">North Valley Hub</option>
                <option value="East Sunshine Annex">East Sunshine Annex</option>
              </select>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label" for="message">Comments / Queries (Optional)</label>
            <textarea id="message" name="message" [(ngModel)]="formData.message" class="form-control" rows="3" placeholder="Tell us about your child or ask queries..."></textarea>
          </div>

          <button type="submit" class="btn btn-primary btn-block" [disabled]="loading">
            {{ loading ? 'Sending Enquiry...' : 'Submit Enquiry' }}
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

    .admissions-info-pane {
      display: flex;
      flex-direction: column;
      justify-content: flex-start;
    }

    .info-header h2 {
      font-size: 2.2rem;
      margin-bottom: 8px;
    }

    .underline-accent {
      width: 60px;
      height: 4px;
      background-color: var(--secondary);
      border-radius: 2px;
      margin-bottom: 24px;
    }

    .content-desc {
      font-size: 1.1rem;
      line-height: 1.7;
      color: var(--text-light);
      margin-bottom: 30px;
    }

    .admissions-image-box {
      width: 100%;
      border-radius: var(--border-radius-md);
      overflow: hidden;
    }

    .admissions-img {
      width: 100%;
      height: auto;
      object-fit: cover;
      border: 4px solid var(--white);
      border-radius: var(--border-radius-md);
    }

    .admissions-form-card {
      padding: 36px;
      border: 2px solid var(--secondary);
    }

    .form-title {
      font-size: 1.5rem;
      color: var(--primary);
      margin-bottom: 4px;
    }

    .form-subtitle {
      font-size: 0.9rem;
      color: var(--text-light);
      margin-bottom: 24px;
      font-weight: 600;
    }

    .alert {
      padding: 12px;
      font-size: 0.95rem;
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
export class AdmissionsPageComponent implements OnInit {
  formData = {
    childName: '',
    childDob: '',
    grade: 'Playgroup',
    parentName: '',
    email: '',
    phone: '',
    city: '',
    center: 'Main Campus Center',
    message: ''
  };
  
  loading = false;
  formSuccess = false;
  formError = '';

  constructor(private contentService: ContentService) {}

  ngOnInit(): void {}

  onSubmit(): void {
    if (
      !this.formData.childName ||
      !this.formData.childDob ||
      !this.formData.parentName ||
      !this.formData.email ||
      !this.formData.phone ||
      !this.formData.city
    ) {
      this.formError = 'Please fill out all required fields marked with *';
      return;
    }

    this.loading = true;
    this.formError = '';
    this.formSuccess = false;

    // Package details to submit as contact submission with Admissions subject
    const formattedMessage = `
--- Admissions Enquiry Details ---
Child Name: ${this.formData.childName}
Child DOB: ${this.formData.childDob}
Selected Grade: ${this.formData.grade}
Parent Name: ${this.formData.parentName}
City: ${this.formData.city}
Selected Center: ${this.formData.center}
Comments: ${this.formData.message || 'None'}
    `.trim();

    const submissionPayload = {
      name: this.formData.parentName,
      email: this.formData.email,
      phone: this.formData.phone,
      subject: 'Admissions Inquiries',
      message: formattedMessage
    };

    this.contentService.submitContactForm(submissionPayload).subscribe({
      next: () => {
        this.loading = false;
        this.formSuccess = true;
        this.resetForm();
      },
      error: () => {
        this.loading = false;
        this.formError = 'Failed to submit admissions inquiry. Please try again later.';
      }
    });
  }

  resetForm(): void {
    this.formData = {
      childName: '',
      childDob: '',
      grade: 'Playgroup',
      parentName: '',
      email: '',
      phone: '',
      city: '',
      center: 'Main Campus Center',
      message: ''
    };
  }
}
