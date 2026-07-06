import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HeaderComponent } from '../../shared/components/header/header.component';
import { FooterComponent } from '../../shared/components/footer/footer.component';
import { ContentService } from '../../core/services/content.service';

@Component({
  selector: 'app-faq-page',
  standalone: true,
  imports: [CommonModule, RouterModule, HeaderComponent, FooterComponent],
  template: `
    <app-header></app-header>
    
    <div class="banner-area">
      <div class="container">
        <h1>Frequently Asked Questions</h1>
        <p class="breadcrumbs"><a routerLink="/">Home</a> / FAQ</p>
      </div>
    </div>

    <div class="page-content-wrapper container">
      <!-- Loading State -->
      <div class="loading" *ngIf="loading">
        <p>Loading FAQs...</p>
      </div>

      <!-- Collapsible Accordion Grid -->
      <div class="faq-accordion" *ngIf="!loading && faqs.length > 0">
        <div class="faq-item card" *ngFor="let faq of faqs; let i = index" [class.open]="faq.isOpen">
          <div class="faq-question" (click)="toggleFAQ(i)">
            <h3>{{ faq.question }}</h3>
            <span class="faq-icon">{{ faq.isOpen ? '−' : '+' }}</span>
          </div>
          <div class="faq-answer">
            <p>{{ faq.answer }}</p>
          </div>
        </div>
      </div>

      <div class="no-content" *ngIf="!loading && faqs.length === 0">
        <p>No questions posted yet.</p>
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

    .loading, .no-content {
      text-align: center;
      padding: 50px 0;
      color: var(--text-light);
    }

    /* Accordion styles */
    .faq-accordion {
      display: flex;
      flex-direction: column;
      gap: 15px;
    }

    .faq-item {
      padding: 0;
      overflow: hidden;
      border: 1px solid #E2E8F0;
    }

    .faq-question {
      padding: 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      cursor: pointer;
      background-color: var(--white);
      user-select: none;
      transition: var(--transition);
    }

    .faq-question h3 {
      font-size: 1.15rem;
      color: var(--text-dark);
      font-family: var(--font-heading);
      margin: 0;
    }

    .faq-icon {
      font-size: 1.5rem;
      font-weight: bold;
      color: var(--primary);
    }

    .faq-answer {
      max-height: 0;
      overflow: hidden;
      transition: max-height 0.3s cubic-bezier(0, 1, 0, 1);
      background-color: #FFFDF9;
      border-top: 1px solid transparent;
    }

    .faq-answer p {
      padding: 24px;
      color: var(--text-light);
      font-size: 1rem;
      margin: 0;
    }

    /* Open State */
    .faq-item.open .faq-question {
      background-color: #FFFDF9;
    }

    .faq-item.open .faq-answer {
      max-height: 1000px;
      border-top: 1px solid #E2E8F0;
      transition: max-height 0.3s cubic-bezier(0.5, 0, 1, 0.5);
    }
  `]
})
export class FAQPageComponent implements OnInit {
  faqs: any[] = [];
  loading = true;

  constructor(private contentService: ContentService) {}

  ngOnInit(): void {
    this.contentService.getFAQs().subscribe({
      next: (data) => {
        this.faqs = data.map(item => ({ ...item, isOpen: false }));
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  toggleFAQ(index: number): void {
    this.faqs[index].isOpen = !this.faqs[index].isOpen;
  }
}
