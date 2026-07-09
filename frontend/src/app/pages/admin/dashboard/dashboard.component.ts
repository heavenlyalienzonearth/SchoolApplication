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
  uploadingSlideIndex: number | null = null;
  uploadSlideSuccessIndex: number | null = null;

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
  uploadingGallery = false;
  uploadSuccess = false;

  // Inquiries Tab
  contacts: any[] = [];
  franchises: any[] = [];
  applications: any[] = [];
  inquiryFilter = 'contact'; // contact, franchise, jobs
  selectedInquiry: any = null;
  selectedInquiryType = 'contact'; // 'contact' | 'franchise'
  inquiryModalOpen = false;

  // Attendance Tab State
  attendanceActiveSubTab = 'mark'; // 'mark' | 'roster' | 'stats'
  attendanceDate = new Date().toISOString().split('T')[0]; // Current YYYY-MM-DD
  attendanceProgramId = 0;
  rosterProgramId = 0;
  attendanceStudents: any[] = [];
  rosterStudents: any[] = [];
  attendanceStats: any[] = [];
  newStudent = { name: '', parent_name: '', phone: '', program_id: 0, allergies: '' };

  // Admissions Tab State
  admissions: any[] = [];
  vaccinations: any[] = [];
  admissionsLoading = false;
  selectedFile: File | null = null;

  // ID Badge Generator State
  badgeModalOpen = false;
  badgeApp: any = null;
  emailSending = false;

  // Promotion & TC State
  promoModalOpen = false;
  promoKid: any = null;
  tcModalOpen = false;
  tcKid: any = null;
  currentDateString = new Date().toISOString().split('T')[0];

  // Holidays State
  holidaysList: any[] = [];
  selectedHolidayYear = new Date().getFullYear();
  holidayYears = [2025, 2026, 2027, 2028];
  newHoliday = { title: '', description: '', holiday_date: '', year: 2026, is_active: true, send_email: false };
  editingHolidayId: number | null = null;

  // Custom Bulk Holiday Email Form State
  customHolidayEmail = { reason: '', start_date: '', end_date: '', reopen_date: '' };
  sendingBulkEmail = false;

  // Toast Notification
  toastMessage = '';
  toastType: 'success' | 'error' = 'success';
  toastVisible = false;

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
    } else if (tab === 'attendance') {
      this.onAttendanceTabSelect();
    } else if (tab === 'admissions') {
      this.loadAdmissions();
    } else if (tab === 'holidays') {
      this.loadHolidays();
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
        this.showToast('Settings saved successfully!');
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
        this.showToast('Banner settings saved successfully!');
      },
      error: () => {
        this.heroError = 'Failed to save Hero section.';
      }
    });
  }

  onHeroSlideFileSelected(event: any, index: number): void {
    const file: File = event.target.files[0];
    if (file && this.heroSlides[index]) {
      this.uploadingSlideIndex = index;
      this.uploadSlideSuccessIndex = null;
      this.contentService.uploadImage(file).subscribe({
        next: (res) => {
          this.heroSlides[index].image = res.url;
          this.uploadingSlideIndex = null;
          this.uploadSlideSuccessIndex = index;
        },
        error: (err) => {
          this.uploadingSlideIndex = null;
          this.showToast('Upload failed: ' + (err.error?.detail || err.message), 'error');
        }
      });
    }
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
    const defaultPlan = [
      { day: 'Monday', study: '', physical: '', games: '', breakfast: '' },
      { day: 'Tuesday', study: '', physical: '', games: '', breakfast: '' },
      { day: 'Wednesday', study: '', physical: '', games: '', breakfast: '' },
      { day: 'Thursday', study: '', physical: '', games: '', breakfast: '' },
      { day: 'Friday', study: '', physical: '', games: '', breakfast: '' }
    ];

    if (prog) {
      // Clone program
      this.selectedProgram = { ...prog };
      this.selectedProgram.uniform_items = prog.uniform_items_json ? JSON.parse(prog.uniform_items_json).join(', ') : '';

      if (prog.highlights_json) {
        try {
          this.selectedProgram.highlights = JSON.parse(prog.highlights_json);
        } catch (e) {
          this.selectedProgram.highlights = [];
        }
      } else {
        this.selectedProgram.highlights = [];
      }

      if (prog.weekly_plan_json) {
        try {
          this.selectedProgram.weeklyPlan = JSON.parse(prog.weekly_plan_json);
        } catch (e) {
          this.selectedProgram.weeklyPlan = JSON.parse(JSON.stringify(defaultPlan));
        }
      } else {
        this.selectedProgram.weeklyPlan = JSON.parse(JSON.stringify(defaultPlan));
      }
    } else {
      this.selectedProgram = {
        title: '',
        age_group: '',
        duration: '',
        uniform_items: 'Books, School Blazer, School Shorts, Pants, Kangaroo Shoes, Girls Dress, School Tie',
        description: '',
        highlights: [''],
        weeklyPlan: JSON.parse(JSON.stringify(defaultPlan)),
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
    const uniformArray = this.selectedProgram.uniform_items ? this.selectedProgram.uniform_items.split(',').map((x: string) => x.trim()).filter((x: string) => x) : [];
    const pData = {
      ...this.selectedProgram,
      highlights_json: JSON.stringify(this.selectedProgram.highlights.filter((h: string) => h.trim() !== '')),
      weekly_plan_json: JSON.stringify(this.selectedProgram.weeklyPlan),
      uniform_items_json: JSON.stringify(uniformArray)
    };
    delete pData.highlights;
    delete pData.weeklyPlan;
    delete pData.uniform_items;

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
    this.uploadSuccess = false;
    this.uploadingGallery = false;
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
    this.uploadSuccess = false;
    this.uploadingGallery = false;
  }

  onGalleryFileSelected(event: any): void {
    const file: File = event.target.files[0];
    if (file && this.selectedGallery) {
      this.uploadingGallery = true;
      this.uploadSuccess = false;
      this.contentService.uploadImage(file).subscribe({
        next: (res) => {
          this.selectedGallery.media_url = res.url;
          this.uploadingGallery = false;
          this.uploadSuccess = true;
        },
        error: (err) => {
          this.uploadingGallery = false;
          this.showToast('Upload failed: ' + (err.error?.detail || err.message), 'error');
        }
      });
    }
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

  openInquiryModal(inquiry: any, type: string): void {
    this.selectedInquiry = { ...inquiry };
    this.selectedInquiryType = type;
    this.inquiryModalOpen = true;
  }

  closeInquiryModal(): void {
    this.selectedInquiry = null;
    this.inquiryModalOpen = false;
  }

  resolveFromModal(): void {
    if (!this.selectedInquiry) return;
    const id = this.selectedInquiry.id;
    if (this.selectedInquiryType === 'contact') {
      this.resolveContact(id);
    } else {
      this.resolveFranchise(id);
    }
    this.closeInquiryModal();
  }

  formatSubmissionDate(dateStr: any): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const day = date.getDate();
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    
    let suffix = 'th';
    if (day === 1 || day === 21 || day === 31) {
      suffix = 'st';
    } else if (day === 2 || day === 22) {
      suffix = 'nd';
    } else if (day === 3 || day === 23) {
      suffix = 'rd';
    }
    
    return `${day}${suffix} ${month} ${year}`;
  }

  showToast(message: string, type: 'success' | 'error' = 'success'): void {
    this.toastMessage = message;
    this.toastType = type;
    this.toastVisible = true;
    setTimeout(() => {
      this.toastVisible = false;
    }, 3000);
  }

  // --- ATTENDANCE MANAGEMENT METHODS ---
  onAttendanceTabSelect(): void {
    if (this.programs.length === 0) {
      this.contentService.getProgramsAdmin().subscribe({
        next: (data) => {
          this.programs = data;
          if (data.length > 0) {
            this.attendanceProgramId = data[0].id;
            this.rosterProgramId = data[0].id;
            this.newStudent.program_id = data[0].id;
            this.loadStudentsForAttendance();
            this.loadRosterStudents();
            this.loadAttendanceStats();
          }
        }
      });
    } else {
      if (this.attendanceProgramId === 0 && this.programs.length > 0) {
        this.attendanceProgramId = this.programs[0].id;
        this.rosterProgramId = this.programs[0].id;
        this.newStudent.program_id = this.programs[0].id;
      }
      this.loadStudentsForAttendance();
      this.loadRosterStudents();
      this.loadAttendanceStats();
    }
  }

  setAttendanceSubTab(subTab: string): void {
    this.attendanceActiveSubTab = subTab;
    if (subTab === 'mark') {
      this.loadStudentsForAttendance();
    } else if (subTab === 'roster') {
      this.loadRosterStudents();
    } else if (subTab === 'stats') {
      this.loadAttendanceStats();
    }
  }

  onAttendanceClassChange(id: number): void {
    this.attendanceProgramId = id;
    this.loadStudentsForAttendance();
  }

  onRosterClassChange(id: number): void {
    this.rosterProgramId = id;
    this.newStudent.program_id = id;
    this.loadRosterStudents();
  }

  loadStudentsForAttendance(): void {
    if (!this.attendanceProgramId) return;
    
    // Fetch all students for class
    this.contentService.getStudents(this.attendanceProgramId).subscribe({
      next: (studentsList) => {
        // Fetch existing attendance records for date
        this.contentService.getAttendanceRecords(this.attendanceProgramId, this.attendanceDate).subscribe({
          next: (records) => {
            const recordsMap = new Map(records.map(r => [r.student_id, r]));
            
            // Map students and default to 'PRESENT' if no record exists
            this.attendanceStudents = studentsList.map(s => {
              const rec: any = recordsMap.get(s.id);
              return {
                id: s.id,
                name: s.name,
                parent_name: s.parent_name,
                allergies: s.allergies,
                status: rec ? rec.status : 'PRESENT',
                notes: rec ? rec.notes : ''
              };
            });
          }
        });
      }
    });
  }

  markKidStatus(studentId: number, status: string): void {
    const kid = this.attendanceStudents.find(s => s.id === studentId);
    if (kid) {
      kid.status = status;
    }
  }

  saveAttendance(): void {
    const payload = {
      program_id: this.attendanceProgramId,
      date: this.attendanceDate,
      records: this.attendanceStudents.map(s => ({
        student_id: s.id,
        status: s.status,
        notes: s.notes || ''
      }))
    };

    this.contentService.saveAttendanceRecords(payload).subscribe({
      next: () => {
        this.showToast('🎉 Attendance saved successfully!');
        this.loadAttendanceStats();
      },
      error: (err) => {
        this.showToast('❌ Failed to save attendance: ' + (err.error?.detail || err.message), 'error');
      }
    });
  }

  loadRosterStudents(): void {
    if (!this.rosterProgramId) return;
    this.contentService.getStudents(this.rosterProgramId).subscribe({
      next: (data) => {
        this.rosterStudents = data;
      }
    });
  }

  addStudent(): void {
    if (!this.newStudent.name || !this.newStudent.parent_name || !this.newStudent.phone || !this.newStudent.program_id) {
      this.showToast('❌ Please fill in all fields!', 'error');
      return;
    }

    this.contentService.createStudent(this.newStudent).subscribe({
      next: () => {
        this.showToast('🎉 Student added to roster!');
        this.newStudent = { name: '', parent_name: '', phone: '', program_id: this.rosterProgramId, allergies: '' };
        this.loadRosterStudents();
        this.loadStudentsForAttendance();
        this.loadAttendanceStats();
      },
      error: (err) => {
        this.showToast('❌ Failed to add student: ' + (err.error?.detail || err.message), 'error');
      }
    });
  }

  deleteStudent(id: number): void {
    if (confirm('Are you sure you want to remove this kid from the roster?')) {
      this.contentService.deleteStudent(id).subscribe({
        next: () => {
          this.showToast('🎉 Kid removed from roster!');
          this.loadRosterStudents();
          this.loadStudentsForAttendance();
          this.loadAttendanceStats();
        },
        error: (err) => {
          this.showToast('❌ Failed to delete kid: ' + (err.error?.detail || err.message), 'error');
        }
      });
    }
  }

  loadAttendanceStats(): void {
    if (!this.attendanceProgramId) return;
    this.contentService.getAttendanceStats(this.attendanceProgramId).subscribe({
      next: (data) => {
        this.attendanceStats = data;
      }
    });
  }

  // --- ADMISSIONS METHODS ---
  loadAdmissions(): void {
    this.admissionsLoading = true;
    this.contentService.getAdmissionApplications().subscribe({
      next: (data) => {
        this.admissions = data;
        this.admissionsLoading = false;
      },
      error: () => {
        this.admissionsLoading = false;
      }
    });
    this.contentService.getVaccinations().subscribe({
      next: (data) => {
        this.vaccinations = data;
      }
    });
  }

  updateAdmissionStatus(id: number, status: string): void {
    this.contentService.updateAdmissionStatus(id, status).subscribe({
      next: (updatedApp) => {
        if (status === 'APPROVED') {
          this.showToast('🎉 Application APPROVED! Kid automatically registered into class roster.');
        } else {
          this.showToast('📁 Application status updated to ' + status);
        }
        this.loadAdmissions();
        // reload class rosters as well
        this.loadRosterStudents();
        this.loadStudentsForAttendance();
      },
      error: (err) => {
        this.showToast('❌ Failed to update admission status: ' + (err.error?.detail || err.message), 'error');
      }
    });
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
    }
  }

  uploadVaccinations(): void {
    if (!this.selectedFile) {
      this.showToast('❌ Please select an Excel or CSV file first!', 'error');
      return;
    }

    const formData = new FormData();
    formData.append('file', this.selectedFile);

    this.contentService.uploadVaccinationsExcel(formData).subscribe({
      next: (res) => {
        this.showToast('🎉 ' + res.message);
        this.selectedFile = null;
        // reset file input
        const fileInput = document.getElementById('vaccineFileInput') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
        this.loadAdmissions();
      },
      error: (err) => {
        this.showToast('❌ Upload failed: ' + (err.error?.detail || err.message), 'error');
      }
    });
  }

  getProgramTitleById(id: any): string {
    const prog = this.programs.find(p => p.id === Number(id));
    return prog ? prog.title : 'Program';
  }

  parseItemsJson(jsonStr: string): string[] {
    if (!jsonStr) return [];
    try {
      return JSON.parse(jsonStr);
    } catch (e) {
      return [];
    }
  }

  openBadgeModal(app: any): void {
    this.badgeApp = app;
    this.badgeModalOpen = true;
  }

  closeBadgeModal(): void {
    this.badgeModalOpen = false;
    this.badgeApp = null;
  }

  getParentFirstName(fullName: string): string {
    if (!fullName) return 'Parent';
    return fullName.trim().split(/\s+/)[0];
  }

  sendBadgeToPrinter(): void {
    if (!this.badgeApp) return;

    this.emailSending = true;
    this.contentService.emailStudentBadge(this.badgeApp.id).subscribe({
      next: (res) => {
        this.showToast('🎉 ' + res.message);
        this.emailSending = false;
        this.closeBadgeModal();
      },
      error: (err) => {
        this.showToast('❌ Failed to email badge details: ' + (err.error?.detail || err.message), 'error');
        this.emailSending = false;
      }
    });
  }

  openPromoModal(kid: any): void {
    this.promoKid = kid;
    this.promoModalOpen = true;
  }

  closePromoModal(): void {
    this.promoModalOpen = false;
    this.promoKid = null;
  }

  openTcModal(kid: any): void {
    this.tcKid = kid;
    this.tcModalOpen = true;
  }

  closeTcModal(): void {
    this.tcModalOpen = false;
    this.tcKid = null;
  }

  printCertificate(elementId: string): void {
    const printContent = document.getElementById(elementId);
    if (!printContent) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Print Document</title>
          <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@600;800&family=Playfair+Display:ital,wght@0,600;0,800;1,400&family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
          <style>
            body {
              font-family: 'Inter', sans-serif;
              margin: 0;
              padding: 40px;
              background-color: #ffffff;
              display: flex;
              justify-content: center;
            }
            .cert-print-container {
              width: 100%;
              max-width: 800px;
            }
            @media print {
              body {
                padding: 0;
              }
              .no-print {
                display: none;
              }
            }
          </style>
        </head>
        <body onload="window.print();window.close()">
          <div class="cert-print-container">
            ${printContent.innerHTML}
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
  }

  loadHolidays(): void {
    this.contentService.getHolidays(this.selectedHolidayYear).subscribe({
      next: (data) => {
        this.holidaysList = data;
      },
      error: (err) => {
        this.showToast('❌ Failed to load holidays: ' + (err.error?.detail || err.message), 'error');
      }
    });
  }

  saveHoliday(): void {
    if (!this.newHoliday.title || !this.newHoliday.holiday_date) {
      this.showToast('❌ Please fill in both Title and Date.', 'error');
      return;
    }

    const parts = this.newHoliday.holiday_date.split('-');
    if (parts.length === 3) {
      this.newHoliday.year = Number(parts[0]);
    }

    if (this.editingHolidayId) {
      this.contentService.updateHoliday(this.editingHolidayId, this.newHoliday).subscribe({
        next: () => {
          this.showToast('🎉 Holiday updated successfully!');
          this.resetHolidayForm();
          this.loadHolidays();
        },
        error: (err) => {
          this.showToast('❌ Failed to update holiday: ' + (err.error?.detail || err.message), 'error');
        }
      });
    } else {
      this.contentService.createHoliday(this.newHoliday).subscribe({
        next: () => {
          this.showToast('🎉 Holiday added successfully!');
          this.resetHolidayForm();
          this.loadHolidays();
        },
        error: (err) => {
          this.showToast('❌ Failed to add holiday: ' + (err.error?.detail || err.message), 'error');
        }
      });
    }
  }

  editHoliday(holiday: any): void {
    this.editingHolidayId = holiday.id;
    this.newHoliday = {
      title: holiday.title,
      description: holiday.description || '',
      holiday_date: holiday.holiday_date,
      year: holiday.year,
      is_active: holiday.is_active,
      send_email: false
    };
  }

  deleteHolidayFromRoster(id: number): void {
    if (confirm('Are you sure you want to delete this holiday?')) {
      this.contentService.deleteHoliday(id).subscribe({
        next: () => {
          this.showToast('🎉 Holiday deleted successfully!');
          this.loadHolidays();
        },
        error: (err) => {
          this.showToast('❌ Failed to delete holiday: ' + (err.error?.detail || err.message), 'error');
        }
      });
    }
  }

  resetHolidayForm(): void {
    this.editingHolidayId = null;
    this.newHoliday = {
      title: '',
      description: '',
      holiday_date: '',
      year: this.selectedHolidayYear,
      is_active: true,
      send_email: false
    };
  }

  sendBulkHolidayEmail(): void {
    const f = this.customHolidayEmail;
    if (!f.reason || !f.start_date || !f.end_date || !f.reopen_date) {
      this.showToast('❌ Please fill in all fields of the Bulk Holiday Mailer.', 'error');
      return;
    }

    this.sendingBulkEmail = true;
    this.contentService.sendCustomHolidayEmail(f).subscribe({
      next: (res) => {
        this.showToast('🎉 ' + res.message);
        this.resetCustomEmailForm();
        this.sendingBulkEmail = false;
      },
      error: (err) => {
        this.showToast('❌ Failed to send bulk emails: ' + (err.error?.detail || err.message), 'error');
        this.sendingBulkEmail = false;
      }
    });
  }

  resetCustomEmailForm(): void {
    this.customHolidayEmail = {
      reason: '',
      start_date: '',
      end_date: '',
      reopen_date: ''
    };
  }

  formatHolidayDate(dateStr: string): string {
    if (!dateStr) return '';
    // YYYY-MM-DD splits directly to avoid local timezone offset errors
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
