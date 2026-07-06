import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HeaderComponent } from '../../shared/components/header/header.component';
import { FooterComponent } from '../../shared/components/footer/footer.component';
import { ContentService } from '../../core/services/content.service';

interface HeroSlide {
  title: string;
  subtitle: string;
  image: string;
  cta_text: string;
  cta_link: string;
}

interface AboutFeature {
  title: string;
  desc: string;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, HeaderComponent, FooterComponent],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit, OnDestroy {
  // Page Sections data
  heroSection: any = {};
  heroSlides: HeroSlide[] = [];
  currentSlide = 0;
  slideInterval: any;

  aboutSection: any = {};
  aboutFeatures: AboutFeature[] = [];

  programsSection: any = {};
  programs: any[] = [];

  gallerySection: any = {};
  galleryItems: any[] = [];
  categories: string[] = ['All'];
  selectedCategory = 'All';
  lightboxImage: string | null = null;

  testimonialsSection: any = {};
  testimonials: any[] = [];
  currentTestimonial = 0;

  eventsSection: any = {};
  events: any[] = [];

  blogsSection: any = {};
  blogs: any[] = [];

  contactSection: any = {};

  // Form Model
  contactData = {
    name: '',
    email: '',
    phone: '',
    subject: 'General Enquiry',
    message: ''
  };
  formSubmitted = false;
  formSuccess = false;
  formError = '';

  constructor(private contentService: ContentService) {}

  ngOnInit(): void {
    this.loadPageSections();
    this.loadPrograms();
    this.loadGallery();
    this.loadTestimonials();
    this.loadEvents();
    this.loadBlogs();
    this.startHeroTimer();
  }

  ngOnDestroy(): void {
    if (this.slideInterval) {
      clearInterval(this.slideInterval);
    }
  }

  // --- CONTENT LOADING ---
  loadPageSections(): void {
    this.contentService.getPageSections('home').subscribe({
      next: (sections) => {
        sections.forEach(sec => {
          if (sec.section_code === 'hero') {
            this.heroSection = sec;
            if (sec.content_json) {
              try {
                this.heroSlides = JSON.parse(sec.content_json);
              } catch (e) {
                this.heroSlides = [];
              }
            }
          } else if (sec.section_code === 'about') {
            this.aboutSection = sec;
            if (sec.content_json) {
              try {
                this.aboutFeatures = JSON.parse(sec.content_json);
              } catch (e) {
                this.aboutFeatures = [];
              }
            }
          } else if (sec.section_code === 'programs') {
            this.programsSection = sec;
          } else if (sec.section_code === 'gallery') {
            this.gallerySection = sec;
          } else if (sec.section_code === 'testimonials') {
            this.testimonialsSection = sec;
          } else if (sec.section_code === 'events') {
            this.eventsSection = sec;
          } else if (sec.section_code === 'blogs') {
            this.blogsSection = sec;
          } else if (sec.section_code === 'contact') {
            this.contactSection = sec;
          }
        });
      },
      error: () => {}
    });
  }

  loadPrograms(): void {
    this.contentService.getPrograms().subscribe({
      next: (data) => {
        this.programs = data.map(p => {
          if (p.highlights_json) {
            try {
              p.highlights = JSON.parse(p.highlights_json);
            } catch (e) {
              p.highlights = [];
            }
          } else {
            p.highlights = [];
          }
          return p;
        });
      },
      error: () => {}
    });
  }

  loadGallery(): void {
    this.contentService.getGalleryItems().subscribe({
      next: (data) => {
        this.galleryItems = data;
        const cats = new Set(data.map(item => item.category));
        this.categories = ['All', ...Array.from(cats)];
      },
      error: () => {}
    });
  }

  loadTestimonials(): void {
    this.contentService.getTestimonials().subscribe({
      next: (data) => {
        this.testimonials = data;
      },
      error: () => {}
    });
  }

  loadEvents(): void {
    this.contentService.getEvents().subscribe({
      next: (data) => {
        this.events = data.slice(0, 3); // Take top 3
      },
      error: () => {}
    });
  }

  loadBlogs(): void {
    this.contentService.getBlogs().subscribe({
      next: (data) => {
        this.blogs = data.slice(0, 3); // Take top 3
      },
      error: () => {}
    });
  }

  // --- SLIDER CONTROLS ---
  startHeroTimer(): void {
    this.slideInterval = setInterval(() => {
      this.nextSlide();
    }, 6000);
  }

  nextSlide(): void {
    if (this.heroSlides.length > 0) {
      this.currentSlide = (this.currentSlide + 1) % this.heroSlides.length;
    }
  }

  prevSlide(): void {
    if (this.heroSlides.length > 0) {
      this.currentSlide = (this.currentSlide - 1 + this.heroSlides.length) % this.heroSlides.length;
    }
  }

  setSlide(index: number): void {
    this.currentSlide = index;
    // Reset timer
    if (this.slideInterval) {
      clearInterval(this.slideInterval);
      this.startHeroTimer();
    }
  }

  // --- TESTIMONIAL CONTROLS ---
  nextTestimonial(): void {
    if (this.testimonials.length > 0) {
      this.currentTestimonial = (this.currentTestimonial + 1) % this.testimonials.length;
    }
  }

  prevTestimonial(): void {
    if (this.testimonials.length > 0) {
      this.currentTestimonial = (this.currentTestimonial - 1 + this.testimonials.length) % this.testimonials.length;
    }
  }

  setTestimonial(index: number): void {
    this.currentTestimonial = index;
  }

  // --- GALLERY CONTROLS ---
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

  // --- CONTACT SUBMISSION ---
  submitContact(): void {
    this.formSubmitted = true;
    this.formError = '';
    this.formSuccess = false;

    if (!this.contactData.name || !this.contactData.email || !this.contactData.phone || !this.contactData.message) {
      this.formError = 'Please fill out all required fields.';
      this.formSubmitted = false;
      return;
    }

    this.contentService.submitContactForm(this.contactData).subscribe({
      next: () => {
        this.formSuccess = true;
        this.formSubmitted = false;
        this.contactData = {
          name: '',
          email: '',
          phone: '',
          subject: 'General Enquiry',
          message: ''
        };
      },
      error: () => {
        this.formError = 'Something went wrong. Please try again later.';
        this.formSubmitted = false;
      }
    });
  }
}
