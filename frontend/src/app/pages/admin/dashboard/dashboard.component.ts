import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ContentService } from '../../../core/services/content.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  activeTab = 'analytics';
  
  // Analytics Tab
  analytics: any = {
    admissions: { day: 0, week: 0, month: 0, year: 0 },
    transfer_certificates: { requests: 0, other: 0, percentage: 0 },
    feedback: { good: 0, improvement_needed: 0, total: 0 }
  };
  analyticsLoading = false;
  
  // Settings Tab
  settings: any = {};
  settingsSuccess = false;
  settingsError = '';
  settingsLoading = false;

  // Hero Tab
  heroSection: any = {};
  heroSlides: any[] = [];
  heroSuccess = false;
  heroError = '';

  // Programs Tab
  programs: any[] = [];
  selectedProgram: any = null; // for edit/add modal
  programModalOpen = false;
  programSuccess = false;

  // Testimonials Tab
  testimonials: any[] = [];
  selectedTestimonial: any = null;
  testimonialModalOpen = false;
  testimonialSuccess = false;

  // Gallery Tab
  galleryItems: any[] = [];
  selectedGallery: any = null;
  galleryModalOpen = false;
  gallerySuccess = false;

  // Inquiries Tab
  contacts: any[] = [];
  franchises: any[] = [];
  applications: any[] = [];
  inquiryFilter = 'contact'; // contact, franchise, jobs

  constructor(
    private authService: AuthService,
    private contentService: ContentService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadAnalytics();
    this.loadSettings();
    this.loadHeroSection();
    this.loadPrograms();
    this.loadTestimonials();
    this.loadGallery();
    this.loadInquiries();
  }

  // --- TAB TOGGLE ---
  setTab(tab: string): void {
    this.activeTab = tab;
    if (tab === 'analytics') {
      this.loadAnalytics();
    }
  }

  loadAnalytics(): void {
    this.analyticsLoading = true;
    this.contentService.getAnalytics().subscribe({
      next: (data) => {
        this.analytics = data;
        this.analyticsLoading = false;
      },
      error: () => {
        this.analyticsLoading = false;
      }
    });
  }

  // --- LOGOUT ---
  logout(): void {
    this.authService.logout();
    this.router.navigate(['/admin/login']);
  }

  // --- SETTINGS TAB ---
  loadSettings(): void {
    this.contentService.getSettings().subscribe({
      next: (data) => {
        this.settings = data;
      },
      error: () => {}
    });
  }

  saveSettings(): void {
    this.settingsLoading = true;
    this.settingsSuccess = false;
    this.settingsError = '';
    
    this.contentService.updateSettings(this.settings).subscribe({
      next: (data) => {
        this.settings = data;
        this.settingsLoading = false;
        this.settingsSuccess = true;
      },
      error: () => {
        this.settingsLoading = false;
        this.settingsError = 'Failed to save settings. Please try again.';
      }
    });
  }

  // --- HERO TAB ---
  loadHeroSection(): void {
    this.contentService.getPageSectionsAdmin('home').subscribe({
      next: (sections) => {
        const hero = sections.find(s => s.section_code === 'hero');
        if (hero) {
          this.heroSection = hero;
          if (hero.content_json) {
            try {
              this.heroSlides = JSON.parse(hero.content_json);
            } catch (e) {
              this.heroSlides = [];
            }
          }
        }
      },
      error: () => {}
    });
  }

  addHeroSlide(): void {
    this.heroSlides.push({
      title: 'New Slide Title',
      subtitle: 'New Slide Subtitle',
      image: '/assets/images/hero_kids_learning.jpg',
      cta_text: 'Click Here',
      cta_link: '/'
    });
  }

  removeHeroSlide(index: number): void {
    this.heroSlides.splice(index, 1);
  }

  saveHero(): void {
    this.heroSuccess = false;
    this.heroError = '';
    
    const updateData = {
      title: this.heroSection.title,
      subtitle: this.heroSection.subtitle,
      description: this.heroSection.description,
      content_json: JSON.stringify(this.heroSlides),
      media_url: this.heroSection.media_url,
      is_active: this.heroSection.is_active,
      sort_order: this.heroSection.sort_order
    };

    this.contentService.updatePageSection('home', 'hero', updateData).subscribe({
      next: () => {
        this.heroSuccess = true;
      },
      error: () => {
        this.heroError = 'Failed to save Hero section.';
      }
    });
  }

  // --- PROGRAMS TAB ---
  loadPrograms(): void {
    this.contentService.getProgramsAdmin().subscribe({
      next: (data) => {
        this.programs = data;
      },
      error: () => {}
    });
  }

  openProgramModal(prog: any = null): void {
    this.programSuccess = false;
    if (prog) {
      // Clone program
      this.selectedProgram = { ...prog };
      if (prog.highlights_json) {
        try {
          this.selectedProgram.highlights = JSON.parse(prog.highlights_json);
        } catch (e) {
          this.selectedProgram.highlights = [];
        }
      } else {
        this.selectedProgram.highlights = [];
      }
    } else {
      this.selectedProgram = {
        title: '',
        age_group: '',
        duration: '',
        description: '',
        highlights: [''],
        image_url: '/assets/images/program_toddler.jpg',
        is_active: true,
        sort_order: 0
      };
    }
    this.programModalOpen = true;
  }

  closeProgramModal(): void {
    this.programModalOpen = false;
    this.selectedProgram = null;
  }

  addHighlight(): void {
    this.selectedProgram.highlights.push('');
  }

  removeHighlight(index: number): void {
    this.selectedProgram.highlights.splice(index, 1);
  }

  saveProgram(): void {
    const pData = {
      ...this.selectedProgram,
      highlights_json: JSON.stringify(this.selectedProgram.highlights.filter((h: string) => h.trim() !== ''))
    };
    delete pData.highlights;

    if (pData.id) {
      // Update
      this.contentService.updateProgram(pData.id, pData).subscribe({
        next: () => {
          this.loadPrograms();
          this.programSuccess = true;
          setTimeout(() => this.closeProgramModal(), 1000);
        },
        error: () => {}
      });
    } else {
      // Create
      this.contentService.createProgram(pData).subscribe({
        next: () => {
          this.loadPrograms();
          this.programSuccess = true;
          setTimeout(() => this.closeProgramModal(), 1000);
        },
        error: () => {}
      });
    }
  }

  deleteProgram(id: number): void {
    if (confirm('Are you sure you want to delete this program?')) {
      this.contentService.deleteProgram(id).subscribe({
        next: () => this.loadPrograms(),
        error: () => {}
      });
    }
  }

  // --- TESTIMONIALS TAB ---
  loadTestimonials(): void {
    this.contentService.getTestimonialsAdmin().subscribe({
      next: (data) => {
        this.testimonials = data;
      },
      error: () => {}
    });
  }

  openTestimonialModal(test: any = null): void {
    this.testimonialSuccess = false;
    if (test) {
      this.selectedTestimonial = { ...test };
    } else {
      this.selectedTestimonial = {
        author_name: '',
        author_role: '',
        quote: '',
        rating: 5,
        image_url: '/assets/images/parent_avatar1.jpg',
        is_active: true,
        sort_order: 0
      };
    }
    this.testimonialModalOpen = true;
  }

  closeTestimonialModal(): void {
    this.testimonialModalOpen = false;
    this.selectedTestimonial = null;
  }

  saveTestimonial(): void {
    if (this.selectedTestimonial.id) {
      this.contentService.updateTestimonial(this.selectedTestimonial.id, this.selectedTestimonial).subscribe({
        next: () => {
          this.loadTestimonials();
          this.testimonialSuccess = true;
          setTimeout(() => this.closeTestimonialModal(), 1000);
        },
        error: () => {}
      });
    } else {
      this.contentService.createTestimonial(this.selectedTestimonial).subscribe({
        next: () => {
          this.loadTestimonials();
          this.testimonialSuccess = true;
          setTimeout(() => this.closeTestimonialModal(), 1000);
        },
        error: () => {}
      });
    }
  }

  deleteTestimonial(id: number): void {
    if (confirm('Delete this testimonial?')) {
      this.contentService.deleteTestimonial(id).subscribe({
        next: () => this.loadTestimonials(),
        error: () => {}
      });
    }
  }

  // --- GALLERY TAB ---
  loadGallery(): void {
    this.contentService.getGalleryItemsAdmin().subscribe({
      next: (data) => {
        this.galleryItems = data;
      },
      error: () => {}
    });
  }

  openGalleryModal(item: any = null): void {
    this.gallerySuccess = false;
    if (item) {
      this.selectedGallery = { ...item };
    } else {
      this.selectedGallery = {
        title: '',
        media_url: '/assets/images/gallery_play.jpg',
        media_type: 'IMAGE',
        category: 'Classrooms',
        is_active: true,
        sort_order: 0
      };
    }
    this.galleryModalOpen = true;
  }

  closeGalleryModal(): void {
    this.galleryModalOpen = false;
    this.selectedGallery = null;
  }

  saveGallery(): void {
    if (this.selectedGallery.id) {
      this.contentService.updateGalleryItem(this.selectedGallery.id, this.selectedGallery).subscribe({
        next: () => {
          this.loadGallery();
          this.gallerySuccess = true;
          setTimeout(() => this.closeGalleryModal(), 1000);
        },
        error: () => {}
      });
    } else {
      this.contentService.createGalleryItem(this.selectedGallery).subscribe({
        next: () => {
          this.loadGallery();
          this.gallerySuccess = true;
          setTimeout(() => this.closeGalleryModal(), 1000);
        },
        error: () => {}
      });
    }
  }

  deleteGallery(id: number): void {
    if (confirm('Delete this gallery item?')) {
      this.contentService.deleteGalleryItem(id).subscribe({
        next: () => this.loadGallery(),
        error: () => {}
      });
    }
  }

  // --- INQUIRIES TAB ---
  loadInquiries(): void {
    this.contentService.getContactSubmissions().subscribe({
      next: (data) => this.contacts = data,
      error: () => {}
    });
    this.contentService.getFranchiseInquiries().subscribe({
      next: (data) => this.franchises = data,
      error: () => {}
    });
    this.contentService.getJobApplications().subscribe({
      next: (data) => this.applications = data,
      error: () => {}
    });
  }

  resolveContact(id: number): void {
    this.contentService.updateContactStatus(id, 'RESOLVED').subscribe({
      next: () => this.loadInquiries(),
      error: () => {}
    });
  }

  resolveFranchise(id: number): void {
    this.contentService.updateFranchiseStatus(id, 'RESOLVED').subscribe({
      next: () => this.loadInquiries(),
      error: () => {}
    });
  }

  getPercentage(value: number, total: number): number {
    if (!total || total === 0) return 0;
    return Math.round((value / total) * 100);
  }
}
