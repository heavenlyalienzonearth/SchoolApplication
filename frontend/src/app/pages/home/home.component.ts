import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HeaderComponent } from '../../shared/components/header/header.component';
import { FooterComponent } from '../../shared/components/footer/footer.component';
import { ContentService } from '../../core/services/content.service';

interface HeroSlide {
  title: string;
  subtitle: string;
  title_color?: string;
  subtitle_color?: string;
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
  @ViewChild('gallerySlider', { static: false }) gallerySlider!: ElementRef;
  galleryInterval: any;

  heroSection: any = {};
  heroSlides: HeroSlide[] = [];
  currentSlide = 0;
  slideInterval: any;

  aboutSection: any = {};
  aboutFeatures: AboutFeature[] = [];

  // Cosmic Space Scientists Section
  spaceScientists = [
    {
      name: 'Dr. APJ Abdul Kalam',
      role: "Father of India's Missile Program",
      image: '/assets/images/rocket_classroom.png',
      description: 'Aerospace scientist who led the development of India\'s SLV-3 launcher, ballistic missile technologies, and served as the 11th President of India.',
      floatClass: 'float-path-1'
    },
    {
      name: 'Kalpana Chawla',
      role: 'First Indian-born Woman in Space',
      image: '/assets/images/space_exploration.png',
      description: 'First Indian-born woman to fly in space, serving as a mission specialist and primary robotic arm operator on Space Shuttle Columbia (STS-87/STS-107).',
      floatClass: 'float-path-2'
    },
    {
      name: 'Dr. Vikram Sarabhai',
      role: 'Father of the Indian Space Program',
      image: '/assets/images/telescope_galaxy.png',
      description: 'Visionary physicist who established the Indian Space Research Organisation (ISRO) and spearheaded cosmic ray research and satellite communication in India.',
      floatClass: 'float-path-3'
    },
    {
      name: 'Wing Commander Rakesh Sharma',
      role: 'First Indian Citizen in Space',
      image: '/assets/images/solar_system.png',
      description: 'Former Indian Air Force pilot who flew aboard Soyuz T-11 in 1984, spending over 7 days in space conducting research on the Salyut 7 space station.',
      floatClass: 'float-path-4'
    },
    {
      name: 'Dr. Satish Dhawan',
      role: 'Pioneer of Indian Space Technology',
      image: '/assets/images/space_exploration.png',
      description: 'Longest-serving ISRO Chairman who pioneered fluid dynamics research and established India\'s primary satellite launch facilities at Sriharikota.',
      floatClass: 'float-path-5'
    },
    {
      name: 'Dr. Udupi Ramachandra Rao',
      role: 'Father of Indian Satellite Tech',
      image: '/assets/images/solar_system.png',
      description: 'Space scientist and former ISRO Chairman who led the development of India\'s first satellite Aryabhata in 1975 and pioneered satellite systems.',
      floatClass: 'float-path-6'
    }
  ];

  programsSection: any = {};
  programs: any[] = [];
  activeScheduleProgramId: number | null = null;

  gallerySection: any = {};
  galleryItems: any[] = [];
  categories: string[] = ['All'];
  lightboxImage: string | null = null;
  mediaBaseUrl = window.location.hostname === 'localhost' ? 'http://localhost:8000' : '';

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
  settings: any = {};

  // Admissions Form State
  admissionsModalOpen = false;
  admissionForm = { child_name: '', parent_name: '', email: '', phone: '', date_of_birth: '', program_id: 0, allergies: '', photo_url: '', blood_group: '', emergency_phone: '' };
  allVaccinations: any[] = [];
  selectedVaccines: { vaccination_id: number, name: string, administered: boolean, date: string }[] = [];
  selectedUniforms: { name: string, selected: boolean }[] = [];
  uploadingPhoto = false;
  admissionsSuccess = false;
  admissionsError = '';

  // Holidays State
  holidaysList: any[] = [];
  selectedHolidayYear = new Date().getFullYear();
  holidayYears = [2025, 2026, 2027, 2028];

  constructor(private contentService: ContentService) {}

  ngOnInit(): void {
    this.loadSettings();
    this.loadPageSections();
    this.loadPrograms();
    this.loadGallery();
    this.loadTestimonials();
    this.loadEvents();
    this.loadHolidays();
    this.loadBlogs();
    this.startHeroTimer();
    this.startGalleryTimer();
    this.contentService.getVaccinations().subscribe({
      next: (data) => {
        this.allVaccinations = data;
      }
    });
  }

  loadSettings(): void {
    this.contentService.getSettings().subscribe({
      next: (data) => {
        this.settings = data;
      },
      error: () => {}
    });
  }

  ngOnDestroy(): void {
    if (this.slideInterval) {
      clearInterval(this.slideInterval);
    }
    if (this.galleryInterval) {
      clearInterval(this.galleryInterval);
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

          if (p.weekly_plan_json) {
            try {
              p.weeklyPlan = JSON.parse(p.weekly_plan_json);
            } catch (e) {
              p.weeklyPlan = [];
            }
          } else {
            p.weeklyPlan = [];
          }
          return p;
        });
      },
      error: () => {}
    });
  }

  toggleWeeklyPlan(programId: number): void {
    if (this.activeScheduleProgramId === programId) {
      this.activeScheduleProgramId = null;
    } else {
      this.activeScheduleProgramId = programId;
    }
  }

  getProgramTitleById(id: number): string {
    const prog = this.programs.find(p => p.id === id);
    return prog ? prog.title : '';
  }

  getProgramWeeklyPlanById(id: number): any[] {
    const prog = this.programs.find(p => p.id === id);
    return prog ? (prog.weeklyPlan || []) : [];
  }

  loadGallery(): void {
    this.contentService.getGalleryItems().subscribe({
      next: (data) => {
        this.galleryItems = data;
        const cats = new Set(data.map(item => item.category));
        this.categories = ['All', ...Array.from(cats)];
        setTimeout(() => {
          this.startGalleryTimer();
        }, 100);
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
    if (typeof window === 'undefined') return;
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

  selectCategory(category: string): void {
    this.selectedCategory = category;
  }

  startGalleryTimer(): void {
    if (typeof window === 'undefined') return;
    if (this.galleryInterval) {
      clearInterval(this.galleryInterval);
    }
    this.galleryInterval = setInterval(() => {
      this.scrollGallery(1);
    }, 3500);
  }

  stopGalleryTimer(): void {
    if (this.galleryInterval) {
      clearInterval(this.galleryInterval);
      this.galleryInterval = null;
    }
  }

  scrollGallery(direction: number): void {
    const el = this.gallerySlider?.nativeElement;
    if (!el) return;
    
    const scrollAmount = 300;
    const maxScroll = el.scrollWidth - el.clientWidth;
    
    let newScrollLeft = el.scrollLeft + (direction * scrollAmount);
    
    if (newScrollLeft > maxScroll + 15) {
      newScrollLeft = 0;
    } else if (newScrollLeft < -15) {
      newScrollLeft = maxScroll;
    }
    
    el.scrollTo({
      left: newScrollLeft,
      behavior: 'smooth'
    });
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

  getMediaUrl(url: string): string {
    if (!url) return '';
    let cleaned = url;
    if (cleaned.includes('localhost:8000')) {
      cleaned = cleaned.replace(/^https?:\/\/localhost:8000/, '');
    } else if (cleaned.includes('127.0.0.1:8000')) {
      cleaned = cleaned.replace(/^https?:\/\/127.0.0.1:8000/, '');
    }
    
    // If it is a backend upload (starts with photos/ or gallery/ or doesn't start with /assets)
    if (!cleaned.startsWith('/assets') && !cleaned.startsWith('assets') && !cleaned.startsWith('http')) {
      return (this.mediaBaseUrl || '') + (cleaned.startsWith('/') ? cleaned : '/' + cleaned);
    }
    
    return cleaned;
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

  // --- ADMISSIONS ACTIONS ---
  openAdmissionsModal(): void {
    this.admissionsModalOpen = true;
    this.admissionsSuccess = false;
    this.admissionsError = '';
    this.uploadingPhoto = false;
    this.admissionForm = {
      child_name: '',
      parent_name: '',
      email: '',
      phone: '',
      date_of_birth: '',
      program_id: this.programs.length > 0 ? this.programs[0].id : 0,
      allergies: '',
      photo_url: '',
      blood_group: '',
      emergency_phone: ''
    };
    if (this.admissionForm.program_id) {
      this.onAdmissionProgramChange(this.admissionForm.program_id);
    }
  }

  closeAdmissionsModal(): void {
    this.admissionsModalOpen = false;
  }

  onPhotoSelected(event: any): void {
    const file = event.target.files[0];
    if (!file) return;

    this.uploadingPhoto = true;
    const formData = new FormData();
    formData.append('file', file);

    this.contentService.uploadChildPhoto(formData).subscribe({
      next: (res) => {
        this.admissionForm.photo_url = res.photo_url;
        this.uploadingPhoto = false;
      },
      error: (err) => {
        this.admissionsError = 'Photo upload failed: ' + (err.error?.detail || err.message);
        this.uploadingPhoto = false;
      }
    });
  }

  onAdmissionProgramChange(programId: any): void {
    const progId = Number(programId);
    this.admissionForm.program_id = progId;
    const prog = this.programs.find(p => p.id === progId);
    if (!prog) return;

    // Filter vaccinations that match the selected program's title or age group
    const groupTitle = prog.title;
    this.selectedVaccines = this.allVaccinations
      .filter(v => v.age_group.toLowerCase().includes(groupTitle.toLowerCase()) || groupTitle.toLowerCase().includes(v.age_group.toLowerCase()))
      .map(v => ({
        vaccination_id: v.id,
        name: v.name,
        administered: false,
        date: ''
      }));

    // Configure uniform items list
    const uniformList = prog.uniform_items_json ? JSON.parse(prog.uniform_items_json) : [];
    this.selectedUniforms = uniformList.map((item: string) => ({
      name: item,
      selected: true
    }));
  }

  submitAdmission(): void {
    this.admissionsError = '';
    this.admissionsSuccess = false;

    const f = this.admissionForm;
    if (!f.child_name || !f.parent_name || !f.email || !f.phone || !f.date_of_birth || !f.program_id) {
      this.admissionsError = 'Please fill out all required general fields.';
      return;
    }

    // Map vaccinations checklist
    const vList = this.selectedVaccines
      .filter(v => v.administered)
      .map(v => {
        if (!v.date) {
          v.date = new Date().toISOString().split('T')[0];
        }
        return {
          vaccination_id: v.vaccination_id,
          administered_date: v.date
        };
      });

    // Map selected uniform items list
    const selectedItems = this.selectedUniforms
      .filter(u => u.selected)
      .map(u => u.name);

    const payload = {
      child_name: f.child_name,
      parent_name: f.parent_name,
      email: f.email,
      phone: f.phone,
      date_of_birth: f.date_of_birth,
      program_id: f.program_id,
      allergies: f.allergies || null,
      photo_url: f.photo_url || null,
      issued_items_json: JSON.stringify(selectedItems),
      blood_group: f.blood_group || null,
      emergency_phone: f.emergency_phone || null,
      vaccinations: vList
    };

    this.contentService.submitAdmission(payload).subscribe({
      next: () => {
        this.admissionsSuccess = true;
        setTimeout(() => {
          this.closeAdmissionsModal();
        }, 3000);
      },
      error: (err) => {
        this.admissionsError = err.error?.detail || 'Failed to submit admissions application. Please try again.';
      }
    });
  }

  loadHolidays(): void {
    this.contentService.getHolidays(this.selectedHolidayYear).subscribe({
      next: (data) => {
        this.holidaysList = data;
      },
      error: () => {}
    });
  }

  setHolidayYear(year: number): void {
    this.selectedHolidayYear = year;
    this.loadHolidays();
  }

  formatHolidayDate(dateStr: string): string {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    
    const year = parts[0];
    const monthIndex = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = monthNames[monthIndex] || 'Jan';
    
    let suffix = 'th';
    if (day === 1 || day === 21 || day === 31) suffix = 'st';
    else if (day === 2 || day === 22) suffix = 'nd';
    else if (day === 3 || day === 23) suffix = 'rd';
    
    return `${day}${suffix} ${month} ${year}`;
  }
}
