import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { HeaderComponent } from '../../shared/components/header/header.component';
import { FooterComponent } from '../../shared/components/footer/footer.component';
import { ContentService } from '../../core/services/content.service';

@Component({
  selector: 'app-general-page',
  standalone: true,
  imports: [CommonModule, RouterModule, HeaderComponent, FooterComponent],
  template: `
    <app-header></app-header>
    
    <div class="banner-area" *ngIf="sections.length > 0">
      <div class="container">
        <h1>{{ pageTitle }}</h1>
        <p class="breadcrumbs"><a routerLink="/">Home</a> / {{ pageTitle }}</p>
      </div>
    </div>

    <div class="page-content-wrapper container">
      <!-- Loading State -->
      <div class="loading" *ngIf="loading">
        <p>Loading page content...</p>
      </div>

      <!-- No Content State -->
      <div class="no-content" *ngIf="!loading && sections.length === 0">
        <h2>Content Coming Soon</h2>
        <p>We are currently updating this page. Please check back later.</p>
        <a routerLink="/" class="btn btn-primary mt-20">Back to Home</a>
      </div>

      <!-- Dynamic Sections Rendering -->
      <div class="dynamic-sections" *ngIf="!loading && sections.length > 0">
        <div class="dynamic-section" *ngFor="let sec of sections; let i = index" [class.reverse]="i % 2 !== 0">
          <div class="section-text">
            <span class="sec-subtitle" *ngIf="sec.subtitle">{{ sec.subtitle }}</span>
            <h2 class="sec-title" *ngIf="sec.title">{{ sec.title }}</h2>
            <p class="sec-desc" *ngIf="sec.description">{{ sec.description }}</p>
            
            <!-- Bullet points if content_json exists -->
            <ul class="sec-bullets" *ngIf="sec.bullets && sec.bullets.length > 0">
              <li *ngFor="let b of sec.bullets">✓ {{ b }}</li>
            </ul>
          </div>
          <div class="section-media" *ngIf="sec.media_url">
            <img [src]="sec.media_url" [alt]="sec.title || 'Page Image'" class="sec-img" />
          </div>
        </div>
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

    .loading, .no-content {
      text-align: center;
      padding: 50px 0;
    }

    .no-content h2 {
      font-size: 2rem;
      color: var(--primary);
      margin-bottom: 12px;
    }

    .no-content p {
      color: var(--text-light);
    }

    .mt-20 { margin-top: 20px; }

    .dynamic-sections {
      display: flex;
      flex-direction: column;
      gap: 60px;
    }

    .dynamic-section {
      display: grid;
      grid-template-columns: 1.2fr 1fr;
      gap: 50px;
      align-items: center;
    }

    .dynamic-section.reverse {
      grid-template-columns: 1fr 1.2fr;
    }

    .dynamic-section.reverse .section-text {
      order: 2;
    }

    .dynamic-section.reverse .section-media {
      order: 1;
    }

    .sec-subtitle {
      font-weight: 700;
      font-size: 0.9rem;
      text-transform: uppercase;
      color: var(--accent);
      letter-spacing: 1px;
    }

    .sec-title {
      font-size: 1.8rem;
      color: var(--text-dark);
      margin: 8px 0 16px 0;
    }

    .sec-desc {
      color: var(--text-light);
      font-size: 1.05rem;
      line-height: 1.6;
    }

    .sec-bullets {
      list-style: none;
      margin-top: 20px;
    }

    .sec-bullets li {
      font-size: 0.95rem;
      font-weight: 600;
      margin-bottom: 8px;
      color: var(--text-dark);
    }

    .sec-img {
      width: 100%;
      border-radius: var(--border-radius-md);
      box-shadow: var(--box-shadow);
      border: 4px solid var(--white);
    }

    @media (max-width: 768px) {
      .dynamic-section, .dynamic-section.reverse {
        grid-template-columns: 1fr;
        gap: 30px;
      }
      .dynamic-section.reverse .section-text {
        order: 1;
      }
      .dynamic-section.reverse .section-media {
        order: 2;
      }
    }
  `]
})
export class GeneralPageComponent implements OnInit {
  pageCode = '';
  pageTitle = '';
  sections: any[] = [];
  loading = true;

  constructor(
    private route: ActivatedRoute,
    private contentService: ContentService
  ) {}

  ngOnInit(): void {
    this.route.data.subscribe(data => {
      this.pageCode = data['pageCode'] || '';
      this.pageTitle = data['title'] || '';
      this.loadContent();
    });
  }

  loadContent(): void {
    this.loading = true;
    this.contentService.getPageSections(this.pageCode).subscribe({
      next: (data) => {
        this.sections = data.map(sec => {
          if (sec.content_json) {
            try {
              sec.bullets = JSON.parse(sec.content_json);
            } catch (e) {
              sec.bullets = [];
            }
          } else {
            sec.bullets = [];
          }
          return sec;
        });
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }
}
