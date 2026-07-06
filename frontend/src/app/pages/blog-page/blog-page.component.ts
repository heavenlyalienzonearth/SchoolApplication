import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { HeaderComponent } from '../../shared/components/header/header.component';
import { FooterComponent } from '../../shared/components/footer/footer.component';
import { ContentService } from '../../core/services/content.service';

@Component({
  selector: 'app-blog-page',
  standalone: true,
  imports: [CommonModule, RouterModule, HeaderComponent, FooterComponent],
  template: `
    <app-header></app-header>
    
    <div class="banner-area">
      <div class="container">
        <h1>{{ isSinglePost ? 'School Blog Post' : 'Educational Blog' }}</h1>
        <p class="breadcrumbs">
          <a routerLink="/">Home</a> / 
          <a routerLink="/blog" *ngIf="isSinglePost">Blog</a>
          <span *ngIf="isSinglePost"> / Article</span>
          <span *ngIf="!isSinglePost">Blog</span>
        </p>
      </div>
    </div>

    <div class="page-content-wrapper container">
      <!-- Loading State -->
      <div class="loading" *ngIf="loading">
        <p>Loading blog content...</p>
      </div>

      <!-- SINGLE BLOG POST VIEW -->
      <div class="single-post" *ngIf="!loading && isSinglePost && currentBlog">
        <article class="blog-article card">
          <div class="article-meta">
            <span class="cat">{{ currentBlog.category }}</span>
            <span class="date">{{ currentBlog.published_at | date:'longDate' }}</span>
          </div>
          <h2 class="article-title">{{ currentBlog.title }}</h2>
          <p class="author">By {{ currentBlog.author_name || 'Coordinator' }}</p>
          
          <img [src]="currentBlog.image_url" [alt]="currentBlog.title" class="article-img shadow" />
          
          <div class="article-content" [innerHTML]="currentBlog.content"></div>
        </article>
      </div>

      <!-- BLOGS LIST VIEW -->
      <div class="blogs-list-view" *ngIf="!loading && !isSinglePost">
        <div class="grid-3" *ngIf="blogs.length > 0">
          <div class="card blog-card" *ngFor="let blog of blogs">
            <div class="blog-img-area">
              <img [src]="blog.image_url" [alt]="blog.title" class="blog-img" />
              <div class="blog-cat-badge">{{ blog.category }}</div>
            </div>
            <div class="blog-content">
              <span class="blog-date">{{ blog.published_at | date:'longDate' }}</span>
              <h3>{{ blog.title }}</h3>
              <p class="blog-summary">{{ blog.summary }}</p>
              <a [routerLink]="['/blog', blog.slug]" class="read-more">Read Full Post →</a>
            </div>
          </div>
        </div>

        <div class="no-content" *ngIf="blogs.length === 0">
          <p>No articles published yet.</p>
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
      max-width: 900px;
    }

    .loading, .no-content {
      text-align: center;
      padding: 50px 0;
      color: var(--text-light);
    }

    /* Single post */
    .blog-article {
      padding: 40px;
      background-color: var(--white);
    }

    .article-meta {
      display: flex;
      gap: 15px;
      font-weight: 700;
      font-size: 0.85rem;
      text-transform: uppercase;
      margin-bottom: 12px;
    }

    .article-meta .cat { color: var(--primary); }
    .article-meta .date { color: var(--text-light); }

    .article-title {
      font-size: 2.4rem;
      margin-bottom: 10px;
    }

    .author {
      font-weight: 600;
      color: var(--text-light);
      margin-bottom: 24px;
    }

    .article-img {
      width: 100%;
      height: auto;
      max-height: 400px;
      object-fit: cover;
      border-radius: var(--border-radius-md);
      margin-bottom: 30px;
    }

    .article-content {
      font-size: 1.1rem;
      line-height: 1.8;
      color: var(--text-dark);
    }

    .article-content ::ng-deep h4 {
      font-size: 1.4rem;
      color: var(--primary);
      margin: 25px 0 10px 0;
    }

    .article-content ::ng-deep p {
      margin-bottom: 15px;
    }

    /* Blog lists card design matching main site */
    .blog-card {
      padding: 0;
      display: flex;
      flex-direction: column;
    }

    .blog-img-area {
      position: relative;
      height: 180px;
    }

    .blog-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .blog-cat-badge {
      position: absolute;
      top: 15px;
      right: 15px;
      background-color: var(--secondary);
      color: var(--text-dark);
      padding: 3px 12px;
      border-radius: 50px;
      font-size: 0.75rem;
      font-weight: 700;
    }

    .blog-content {
      padding: 24px;
      display: flex;
      flex-direction: column;
      flex-grow: 1;
    }

    .blog-date {
      font-size: 0.8rem;
      color: var(--text-light);
      margin-bottom: 6px;
    }

    .blog-content h3 {
      font-size: 1.15rem;
      margin-bottom: 8px;
    }

    .blog-summary {
      font-size: 0.92rem;
      color: var(--text-light);
      margin-bottom: 18px;
      flex-grow: 1;
    }

    .read-more {
      font-family: var(--font-heading);
      font-weight: 700;
      color: var(--primary);
      text-decoration: none;
      font-size: 0.9rem;
      align-self: flex-start;
      transition: var(--transition);
    }

    .read-more:hover {
      color: var(--accent);
      transform: translateX(4px);
    }
  `]
})
export class BlogPageComponent implements OnInit {
  isSinglePost = false;
  loading = true;
  blogs: any[] = [];
  currentBlog: any = null;

  constructor(
    private route: ActivatedRoute,
    private contentService: ContentService
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const slug = params.get('slug');
      if (slug) {
        this.isSinglePost = true;
        this.loadSingleBlog(slug);
      } else {
        this.isSinglePost = false;
        this.loadBlogs();
      }
    });
  }

  loadBlogs(): void {
    this.loading = true;
    this.contentService.getBlogs().subscribe({
      next: (data) => {
        this.blogs = data;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  loadSingleBlog(slug: string): void {
    this.loading = true;
    this.contentService.getBlogBySlug(slug).subscribe({
      next: (data) => {
        this.currentBlog = data;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }
}
