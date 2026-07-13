import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { HeaderComponent } from '../../shared/components/header/header.component';
import { FooterComponent } from '../../shared/components/footer/footer.component';
import { ContentService } from '../../core/services/content.service';

@Component({
  selector: 'app-careers-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, HeaderComponent, FooterComponent],
  template: `
    <app-header></app-header>
    
    <div class="banner-area">
      <div class="container">
        <h1>Work with Us (Careers)</h1>
        <p class="breadcrumbs"><a routerLink="/">Home</a> / Careers</p>
      </div>
    </div>

    <div class="page-content-wrapper container">
      <div class="intro-section">
        <h2>Join Our Team of Passionate Educators</h2>
        <p>At Vidyankuram Club, we believe our educators and staff are our biggest strength. We provide a collaborative work environment, competitive remuneration packages, and continuous professional training program.</p>
      </div>

      <!-- Loading state -->
      <div class="loading" *ngIf="loading">
        <p>Loading open vacancies...</p>
      </div>

      <!-- Careers List -->
      <div class="jobs-list" *ngIf="!loading && jobs.length > 0">
        <div class="card job-card" *ngFor="let job of jobs">
          <div class="job-header">
            <div>
              <h3>{{ job.title }}</h3>
              <p class="meta">📁 {{ job.department }} | 📍 {{ job.location }}</p>
            </div>
            <button class="btn btn-primary btn-sm" (click)="openApplyModal(job)">Apply Now</button>
          </div>
          
          <div class="job-body">
            <p class="job-desc">{{ job.description }}</p>
            
            <div class="job-reqs" *ngIf="job.requirements && job.requirements.length > 0">
              <h4>Candidate Requirements:</h4>
              <ul>
                <li *ngFor="let req of job.requirements">✓ {{ req }}</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div class="no-content" *ngIf="!loading && jobs.length === 0">
        <p>No open positions currently. You can send your resume to careers&#64;vidyankuramclub.in for future roles.</p>
      </div>
    </div>

    <!-- Apply Modal -->
    <div class="modal-backdrop" *ngIf="modalOpen" (click)="closeApplyModal()">
      <div class="modal-content card" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h3>Apply for: {{ selectedJob?.title }}</h3>
          <button class="modal-close" (click)="closeApplyModal()">×</button>
        </div>

        <div class="alert alert-success" *ngIf="formSuccess">
          🎉 Application submitted successfully! Our HR team will reach out if your profile matches our requirements.
        </div>
        <div class="alert alert-danger" *ngIf="formError">
          ⚠️ {{ formError }}
        </div>

        <form (ngSubmit)="submitApplication()" #applyForm="ngForm" *ngIf="!formSuccess">
          <div class="form-group">
            <label class="form-label" for="name">Your Name *</label>
            <input type="text" id="name" name="name" [(ngModel)]="applyData.applicant_name" class="form-control" required placeholder="Full name" />
          </div>

          <div class="grid-2">
            <div class="form-group">
              <label class="form-label" for="email">Email Address *</label>
              <input type="email" id="email" name="email" [(ngModel)]="applyData.applicant_email" class="form-control" required placeholder="name@email.com" />
            </div>
            <div class="form-group">
              <label class="form-label" for="phone">Phone Number *</label>
              <input type="tel" id="phone" name="phone" [(ngModel)]="applyData.applicant_phone" class="form-control" required placeholder="10-digit number" />
            </div>
          </div>

          <div class="form-group">
            <label class="form-label" for="resume">Resume / CV Link *</label>
            <input type="url" id="resume" name="resume" [(ngModel)]="applyData.resume_url" class="form-control" required placeholder="Link to Google Drive or Dropbox file" />
          </div>

          <div class="form-group">
            <label class="form-label" for="cover">Cover Letter / Note</label>
            <textarea id="cover" name="cover" [(ngModel)]="applyData.cover_letter" class="form-control" rows="4" placeholder="Briefly describe why you are a good fit..."></textarea>
          </div>

          <div class="modal-footer">
            <button type="button" class="btn btn-outline btn-sm" (click)="closeApplyModal()">Cancel</button>
            <button type="submit" class="btn btn-primary btn-sm ml-10" [disabled]="formLoading">
              {{ formLoading ? 'Submitting Application...' : 'Send Application' }}
            </button>
          </div>
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
      max-width: 800px;
    }

    .intro-section {
      text-align: center;
      margin-bottom: 40px;
    }

    .intro-section h2 {
      font-size: 2rem;
      color: var(--text-dark);
      margin-bottom: 12px;
    }

    .intro-section p {
      color: var(--text-light);
      font-size: 1.1rem;
      line-height: 1.6;
    }

    .loading, .no-content {
      text-align: center;
      padding: 40px 0;
      color: var(--text-light);
    }

    /* Job Card */
    .jobs-list {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    .job-card {
      border: 1px solid #E2E8F0;
      padding: 30px;
    }

    .job-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 15px;
      border-bottom: 1px solid #F1F5F9;
      padding-bottom: 15px;
      flex-wrap: wrap;
      gap: 15px;
    }

    .job-header h3 {
      font-size: 1.3rem;
      color: var(--primary);
    }

    .job-header .meta {
      font-size: 0.85rem;
      font-weight: 700;
      color: var(--text-light);
      margin-top: 4px;
    }

    .job-desc {
      color: var(--text-dark);
      font-size: 1rem;
      line-height: 1.6;
      margin-bottom: 20px;
    }

    .job-reqs h4 {
      font-size: 0.95rem;
      color: var(--text-dark);
      margin-bottom: 8px;
    }

    .job-reqs ul {
      list-style: none;
    }

    .job-reqs li {
      font-size: 0.9rem;
      color: var(--text-light);
      margin-bottom: 4px;
    }

    /* Modal Backdrop */
    .modal-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(15, 23, 42, 0.4);
      z-index: 2000;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }

    .modal-content {
      width: 100%;
      max-width: 550px;
      max-height: 90vh;
      overflow-y: auto;
      padding: 30px;
      background-color: var(--white);
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      border-bottom: 1px solid #F1F5F9;
      padding-bottom: 12px;
    }

    .modal-header h3 {
      font-size: 1.25rem;
      color: var(--text-dark);
    }

    .modal-close {
      background: none;
      border: none;
      font-size: 1.8rem;
      cursor: pointer;
      line-height: 1;
      color: var(--text-light);
    }

    .modal-footer {
      display: flex;
      justify-content: flex-end;
      border-top: 1px solid #F1F5F9;
      padding-top: 15px;
      margin-top: 20px;
    }

    .ml-10 { margin-left: 10px; }

    .alert {
      padding: 12px;
      font-size: 0.9rem;
      border-radius: var(--border-radius-sm);
      margin-bottom: 20px;
      font-weight: 600;
    }

    .alert-success { background-color: #DCFCE7; color: #166534; }
    .alert-danger { background-color: #FEE2E2; color: #991B1B; }
  `]
})
export class CareersPageComponent implements OnInit {
  jobs: any[] = [];
  loading = true;
  selectedJob: any = null;
  modalOpen = false;

  applyData = {
    career_id: 0,
    applicant_name: '',
    applicant_email: '',
    applicant_phone: '',
    resume_url: '',
    cover_letter: ''
  };
  formLoading = false;
  formSuccess = false;
  formError = '';

  constructor(private contentService: ContentService) {}

  ngOnInit(): void {
    this.contentService.getCareers().subscribe({
      next: (data) => {
        this.jobs = data.map(job => {
          if (job.requirements_json) {
            try {
              job.requirements = JSON.parse(job.requirements_json);
            } catch (e) {
              job.requirements = [];
            }
          } else {
            job.requirements = [];
          }
          return job;
        });
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  openApplyModal(job: any): void {
    this.selectedJob = job;
    this.applyData = {
      career_id: job.id,
      applicant_name: '',
      applicant_email: '',
      applicant_phone: '',
      resume_url: '',
      cover_letter: ''
    };
    this.formError = '';
    this.formSuccess = false;
    this.modalOpen = true;
  }

  closeApplyModal(): void {
    this.modalOpen = false;
    this.selectedJob = null;
  }

  submitApplication(): void {
    if (!this.applyData.applicant_name || !this.applyData.applicant_email || !this.applyData.applicant_phone || !this.applyData.resume_url) {
      this.formError = 'Please fill out all required fields.';
      return;
    }

    this.formLoading = true;
    this.formError = '';
    this.formSuccess = false;

    this.contentService.applyToJob(this.applyData).subscribe({
      next: () => {
        this.formLoading = false;
        this.formSuccess = true;
        setTimeout(() => this.closeApplyModal(), 2000);
      },
      error: () => {
        this.formLoading = false;
        this.formError = 'Failed to submit application. Please try again.';
      }
    });
  }
}
