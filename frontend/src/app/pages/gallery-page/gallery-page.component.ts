import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HeaderComponent } from '../../shared/components/header/header.component';
import { FooterComponent } from '../../shared/components/footer/footer.component';
import { ContentService } from '../../core/services/content.service';

@Component({
  selector: 'app-gallery-page',
  standalone: true,
  imports: [CommonModule, RouterModule, HeaderComponent, FooterComponent],
  template: `
    <app-header></app-header>
    
    <div class="banner-area">
      <div class="container">
        <h1>School Gallery</h1>
        <p class="breadcrumbs"><a routerLink="/">Home</a> / Gallery</p>
      </div>
    </div>

    <div class="page-content-wrapper container">
      <!-- Category Filters -->
      <div class="gallery-filters" *ngIf="categories.length > 1">
        <button *ngFor="let cat of categories" 
                [class.active]="cat === selectedCategory"
                (click)="selectCategory(cat)">
          {{ cat }}
        </button>
      </div>

      <!-- Gallery Grid -->
      <div class="gallery-grid" *ngIf="galleryItems.length > 0">
        <div class="gallery-item-card" 
             *ngFor="let item of getFilteredGallery()" 
             (click)="openLightbox(item.media_url)">
          <img [src]="item.media_url" [alt]="item.title" class="gallery-img" />
          <div class="gallery-overlay">
            <span class="zoom-icon">🔍</span>
            <p class="gallery-title">{{ item.title || 'Glimpse' }}</p>
            <span class="gallery-cat">{{ item.category }}</span>
          </div>
        </div>
      </div>

      <div class="no-content" *ngIf="galleryItems.length === 0">
        <p>No gallery images loaded yet.</p>
      </div>
    </div>

    <!-- Lightbox Modal -->
    <div class="lightbox-modal" *ngIf="lightboxImage" (click)="closeLightbox()">
      <div class="lightbox-content" (click)="$event.stopPropagation()">
        <button class="lightbox-close" (click)="closeLightbox()">×</button>
        <img [src]="lightboxImage" alt="Zoom" class="lightbox-img" />
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

    /* Filters */
    .gallery-filters {
      display: flex;
      justify-content: center;
      gap: 12px;
      margin-bottom: 40px;
      flex-wrap: wrap;
    }

    .gallery-filters button {
      background-color: var(--bg-cream);
      border: 2px solid transparent;
      padding: 8px 24px;
      border-radius: 50px;
      font-family: var(--font-heading);
      font-weight: 700;
      font-size: 0.95rem;
      cursor: pointer;
      transition: var(--transition);
      color: var(--text-dark);
    }

    .gallery-filters button:hover, .gallery-filters button.active {
      background-color: var(--primary);
      color: var(--white);
    }

    /* Grid */
    .gallery-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 20px;
    }

    .gallery-item-card {
      position: relative;
      height: 250px;
      border-radius: var(--border-radius-md);
      overflow: hidden;
      box-shadow: var(--box-shadow);
      cursor: pointer;
    }

    .gallery-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: var(--transition);
    }

    .gallery-overlay {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(238, 90, 36, 0.85);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      opacity: 0;
      transition: var(--transition);
      color: var(--white);
      padding: 20px;
      text-align: center;
    }

    .gallery-item-card:hover .gallery-img {
      transform: scale(1.08);
    }

    .gallery-item-card:hover .gallery-overlay {
      opacity: 1;
    }

    .zoom-icon {
      font-size: 2rem;
      margin-bottom: 8px;
    }

    .gallery-title {
      font-family: var(--font-heading);
      font-weight: 700;
      font-size: 1.15rem;
    }

    .gallery-cat {
      font-size: 0.8rem;
      text-transform: uppercase;
      background-color: rgba(255,255,255,0.2);
      padding: 2px 10px;
      border-radius: 50px;
      margin-top: 6px;
    }

    .no-content {
      text-align: center;
      padding: 50px 0;
      color: var(--text-light);
    }

    /* Lightbox Modal */
    .lightbox-modal {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(15, 23, 42, 0.9);
      z-index: 2000;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .lightbox-content {
      position: relative;
      max-width: 90%;
      max-height: 85%;
      border-radius: var(--border-radius-md);
      overflow: hidden;
      border: 4px solid var(--white);
      background-color: var(--white);
    }

    .lightbox-img {
      max-width: 100%;
      max-height: 75vh;
      object-fit: contain;
      display: block;
    }

    .lightbox-close {
      position: absolute;
      top: 10px;
      right: 10px;
      background-color: rgba(15, 23, 42, 0.6);
      color: var(--white);
      border: none;
      font-size: 1.8rem;
      cursor: pointer;
      width: 36px;
      height: 36px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10;
    }
  `]
})
export class GalleryPageComponent implements OnInit {
  galleryItems: any[] = [];
  categories: string[] = ['All'];
  selectedCategory = 'All';
  lightboxImage: string | null = null;

  constructor(private contentService: ContentService) {}

  ngOnInit(): void {
    this.contentService.getGalleryItems().subscribe({
      next: (data) => {
        this.galleryItems = data;
        const cats = new Set(data.map(item => item.category));
        this.categories = ['All', ...Array.from(cats)];
      },
      error: () => {}
    });
  }

  selectCategory(category: string): void {
    this.selectedCategory = category;
  }

  getFilteredGallery(): any[] {
    if (this.selectedCategory === 'All') {
      return this.galleryItems;
    }
    return this.galleryItems.filter(item => item.category === this.selectedCategory);
  }

  openLightbox(url: string): void {
    this.lightboxImage = url;
  }

  closeLightbox(): void {
    this.lightboxImage = null;
  }
}
