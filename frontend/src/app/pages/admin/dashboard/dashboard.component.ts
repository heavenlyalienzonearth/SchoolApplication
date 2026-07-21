import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ApiService } from '../../../core/services/api.service';
import { ContentService } from '../../../core/services/content.service';
import { StationaryService, StationaryItem, StationaryOrder } from '../../../core/services/stationary.service';
import { MomentsService, StudentMoment } from '../../../core/services/moments.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit, OnDestroy {
  activeTab = 'analytics';
  loginTime: string = '';
  clockInterval: any;

  // Feature Access Control Matrix
  permissionsList: any[] = [];
  permissionGrid: { [feature: string]: { [role: string]: boolean } } = {};
  rolesList: string[] = ['Admin', 'Principal', 'Teacher', 'Parent'];
  rateLimitPerMin: number = 50;
  featuresList: { code: string; name: string }[] = [
    { code: 'analytics', name: '📊 Rolewise CPanel' },
    { code: 'settings', name: '⚙️ Public Settings' },
    { code: 'hero', name: '🖼️ Hero/Banner Management' },
    { code: 'programs', name: '🎓 Program List' },
    { code: 'holidays', name: '📅 Holidays Management' },
    { code: 'gallery', name: '📷 Gallery Management' },
    { code: 'inquiries', name: '📨 Admission Enquiries' },
    { code: 'users', name: '👤 Teacher Updates' },
    { code: 'circulars', name: '📢 Circulars Management' },
    { code: 'library', name: '📚 Library Management' },
    { code: 'admissions', name: '📝 Admissions Management' },
    { code: 'milestones', name: '🎯 SetUp Milestones' },
    { code: 'testimonials', name: '⭐ Parent Reviews' },
    { code: 'attendance', name: '✅ Student Attendance' },
    { code: 'finance-structures', name: '💵 Fee Structures' },
    { code: 'finance-ledger', name: '🧾 Invoices & Ledger' },
    { code: 'stationary', name: '✏️ Stationery Center' },
    { code: 'moments', name: '✨ Daily Moments' },
    { code: 'leaves', name: '✉️ Parent Requests' },
    { code: 'traffic', name: '📡 Traffic Analytics' }
  ];

  // Traffic Analytics
  trafficDays: number = 7;
  trafficExcludeLocal: boolean = true;
  trafficLoading: boolean = false;
  trafficSummary: any = null;
  trafficLogs: any[] = [];
  trafficTotal: number = 0;
  trafficPage: number = 1;
  trafficPageSize: number = 50;
  trafficFilter: { ip: string; country: string } = { ip: '', country: '' };
  
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

  // Selection arrays for bulk delete
  selectedContactIds: number[] = [];
  selectedFranchiseIds: number[] = [];
  selectedJobIds: number[] = [];
  selectedAdmissionIds: number[] = [];

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
  newHoliday = { title: '', description: '', holiday_date: '', year: 2026, category: 'National Holiday', image_url: '', is_active: true, send_email: false };
  editingHolidayId: number | null = null;
  uploadingHolidayImage = false;

  // Circulars State
  circularsList: any[] = [];
  newCircular: { title: string; content: string; program_id: number | null; attachment_url: string; is_active: boolean } = {
    title: '',
    content: '',
    program_id: null,
    attachment_url: '',
    is_active: true
  };
  editingCircularId: number | null = null;

  // Library State
  booksList: any[] = [];
  borrowsList: any[] = [];
  studentsList: any[] = [];
  newBook: { title: string; author: string; isbn: string; category: string; total_copies: number } = {
    title: '',
    author: '',
    isbn: '',
    category: 'Picture Book',
    total_copies: 1
  };
  editingBookId: number | null = null;
  newBorrow: { book_id: number | null; student_id: number | null; borrow_date: string; due_date: string } = {
    book_id: null,
    student_id: null,
    borrow_date: new Date().toISOString().split('T')[0],
    due_date: new Date(Date.now() + 7*24*60*60*1000).toISOString().split('T')[0]
  };

  // Custom Bulk Holiday Email Form State
  customHolidayEmail = { reason: '', start_date: '', end_date: '', reopen_date: '' };
  sendingBulkEmail = false;

  // Two-Factor Authentication (2FA) State
  currentUser: any = null;
  tfaSetupData: any = null;
  tfaSetupCode = '';
  tfaDisableCode = '';
  tfaSuccess = '';
  tfaError = '';
  tfaLoading = false;

  // Super Admin Managed 2FA State
  active2faUser: any = null;
  active2faSetupData: any = null;
  active2faSetupCode = '';
  tfaSetupLoading = false;

  // User Management State
  usersList: any[] = [];
  newUser = {
    full_name: '',
    email: '',
    password: '',
    role: 'Teacher',
    education: '',
    experience: '',
    achievements: '',
    cv_url: '',
    assigned_program_id: null as number | null
  };
  editingUserId: number | null = null;
  usersLoading = false;
  usersError = '';
  usersSuccess = '';
  uploadingCV = false;
  cvUploadSuccess = false;

  // Stationery Management State
  stationaryItems: StationaryItem[] = [];
  stationaryOrders: StationaryOrder[] = [];
  stationaryCategory: 'school' | 'teacher' | 'student' = 'school';
  newStationaryItem: any = { name: '', description: '', category: 'Books', price: 0, stock: 0, order_date: '', total_amount: 0, stationery_type: 'school' };
  editingStationaryItemId: number | null = null;
  stationaryLoading = false;
  stationaryError = '';
  stationarySuccess = '';

  // Vendor Management
  stationaryVendors: { id: number; name: string; contact: string; address?: string }[] = [
    { id: 1, name: 'Akash Stationery Stores', contact: '98765-43210', address: 'MG Road, Bengaluru' },
    { id: 2, name: 'NavYug Book Depot', contact: '98001-23456', address: 'Gandhi Nagar, Mysuru' },
    { id: 3, name: 'Shree Ganesh Traders', contact: '99887-76543', address: 'Jayanagar, Bengaluru' }
  ];
  newVendor: { name: string; contact: string; address: string } = { name: '', contact: '', address: '' };
  selectedVendorId: any = '';
  nextVendorId = 4;

  // Stationery Shopping Cart
  stationaryCart: { item: StationaryItem; quantity: number }[] = [];
  orderStudentName = '';
  orderClassName = '';
  orderError = '';
  orderSuccess = '';

  // Toast Notification
  toastMessage = '';
  toastType: 'success' | 'error' = 'success';
  toastVisible = false;

  mediaBaseUrl = (typeof window !== 'undefined' && window.location.hostname === 'localhost') ? 'http://localhost:8000' : '';
  adminLeaves: any[] = [];
  adminLeavesLoading = false;
  leaveComments: { [key: number]: string } = {};

  // Admin parent requests / meal suspensions state
  adminMealSuspensions: any[] = [];
  adminMealSuspensionsLoading = false;
  adminRequestSubTab: 'leaves' | 'meals' = 'leaves';

  milestoneActiveSubTab = 'templates'; // 'templates' | 'progress'
  milestoneTemplates: any[] = [];
  newMilestoneTemplate = { program_id: 0, milestone_name: '', category: 'Cognitive' };
  selectedMilestoneProgramId = 0;
  editingTemplateId: number | null = null;
  editingTemplateData = { milestone_name: '', category: 'Cognitive' };
  showCustomCategory = false;
  customCategoryName = '';
  
  milestoneStudents: any[] = [];
  milestoneStudentProgramId = 0;
  selectedMilestoneStudentId = 0;
  selectedMilestoneStudentName = '';
  studentMilestones: any[] = [];
  savingStudentMilestones = false;
  milestoneStudentSearchQuery = '';
  
  // Printing Progress booklet
  printBookletStudent: any = null;
  printBookletMilestones: any[] = [];
  printBookletOpen = false;
  printBookletProgramTitle = '';
  schoolManagementExpanded = false;
  publicSettingsExpanded = false;
  financeExpanded = false;
  reviewsExpanded = false;
  attendanceExpanded = false;
  stationeryExpanded = false;
  dailyUpdatesExpanded = false;

  feeStructures: any[] = [];
  invoices: any[] = [];
  outstandingCollectionsTotal = 0;
  financeLoading = false;
  invoiceFilters = { status: '', program_id: 0, search: '' };
  newFeeStructure = { name: '', category: 'Tuition', amount: 0, frequency: 'Termly', program_id: 0 };
  editingFeeStructureId: number | null = null;
  transportPreset: string = '';
  invoiceGeneration = { term_name: 'Term 1 - 2026', program_id: 0, due_date: '' };
  genInvoiceModalOpen = false;
  selectedInvoice: any = null;
  invoiceEditModalOpen = false;
  editingInvoiceId: number | null = null;
  deleteConfirmModalOpen = false;
  invoiceToDeleteId: number | null = null;
  invoiceToDeleteTitle = '';
  invoiceToDeleteStudent = '';
  deleteFeeConfirmModalOpen = false;
  feeToDeleteId: number | null = null;
  feeToDeleteName = '';
  feeToDeleteCategory = '';
  deleteStationaryOrderConfirmModalOpen = false;
  stationaryOrderToDeleteId: number | null = null;
  stationaryOrderToDeleteTitle = '';
  stationaryOrderToDeleteStudent = '';
  editInvoiceForm = { title: '', amount: 0, waiver_amount: 0, due_date: '', status: 'Unpaid', notes: '', payment_method: '', receipt_no: '' };
  paymentModalOpen = false;
  paymentMethod = 'Cash';
  paymentReceiptNo = '';
  paymentDate = '';
  showRazorpayMockModal = false;
  razorpayOrderData: any = null;
  processingPayment = false;
  razorpayPaymentType: 'invoice' | 'stationary' = 'invoice';
  stationaryOrderToPay: any = null;
  waiverModalOpen = false;
  waiverAmount = 0;
  waiverReason = '';
  waiverDate = '';
  waiverApprovedBy = 'Principal';
  waiverFileUrl = '';
  uploadingWaiverFile = false;
  waiverFileUploadSuccess = false;
  waiverError = '';

  // Daily Moments State
  momentsList: StudentMoment[] = [];
  momentsLoading = false;
  momentsUploading = false;
  momentSelectedStudentId: number | null = null;
  momentSelectedProgramId = 0;
  momentDescription = '';
  momentFiles: File[] = [];
  momentFilePreviews: { url: string, type: string }[] = [];
  momentStudents: any[] = [];
  momentStudentSearchQuery = '';

  constructor(
    private authService: AuthService,
    private apiService: ApiService,
    private contentService: ContentService,
    private router: Router,
    private stationaryService: StationaryService,
    private momentsService: MomentsService
  ) {}

  ngOnInit(): void {
    const updateClock = () => {
      const day = new Date().toLocaleDateString('en-US', { weekday: 'long' });
      const time = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
      this.loginTime = `${day}, ${time}`;
    };
    updateClock();
    this.clockInterval = setInterval(updateClock, 1000);
    const schoolMgmtTabs = ['programs', 'holidays', 'gallery', 'inquiries', 'users', 'circulars', 'library', 'admissions', 'milestones'];
    if (schoolMgmtTabs.includes(this.activeTab)) {
      this.schoolManagementExpanded = true;
    }
    const publicSettingsTabs = ['settings', 'hero', 'traffic', 'permissions'];
    if (publicSettingsTabs.includes(this.activeTab)) {
      this.publicSettingsExpanded = true;
    }
    const financeMgmtTabs = ['finance-structures', 'finance-ledger'];
    if (financeMgmtTabs.includes(this.activeTab)) {
      this.financeExpanded = true;
    }
    if (['testimonials'].includes(this.activeTab)) {
      this.reviewsExpanded = true;
    }
    if (['attendance'].includes(this.activeTab)) {
      this.attendanceExpanded = true;
    }
    if (['stationary'].includes(this.activeTab)) {
      this.stationeryExpanded = true;
    }
    if (['moments', 'leaves'].includes(this.activeTab)) {
      this.dailyUpdatesExpanded = true;
    }
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      if (user?.role?.toUpperCase() === 'TEACHER') {
        this.activeTab = 'moments';
        this.setTab('moments');
      }
    });
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
    if (tab === 'permissions' && this.currentUser?.role?.toUpperCase() !== 'SUPERADMIN') {
      this.activeTab = 'analytics';
      return;
    }
    if (tab !== 'permissions' && tab !== 'analytics' && !this.hasPermission(tab)) {
      return;
    }
    this.activeTab = tab;
    if (tab === 'analytics') {
      this.loadAnalytics();
    } else if (tab === 'attendance') {
      this.onAttendanceTabSelect();
    } else if (tab === 'admissions') {
      this.loadAdmissions();
    } else if (tab === 'holidays') {
      this.loadHolidays();
    } else if (tab === 'users') {
      this.loadUsers();
    } else if (tab === 'stationary') {
      this.loadStationary();
    } else if (tab === 'milestones') {
      if (this.programs.length > 0) {
        this.selectedMilestoneProgramId = this.programs[0].id;
        this.milestoneStudentProgramId = this.programs[0].id;
        this.newMilestoneTemplate.program_id = this.programs[0].id;
        this.loadMilestoneTemplates();
        this.loadMilestoneStudents();
      }
    } else if (tab === 'leaves') {
      this.loadLeavesAdmin();
      this.loadMealSuspensionsAdmin();
    } else if (tab === 'finance-structures') {
      this.loadFeeStructures();
    } else if (tab === 'finance-ledger') {
      if (this.programs.length > 0 && !this.invoiceFilters.program_id) {
        this.invoiceFilters.program_id = this.programs[0].id;
      }
      this.loadInvoices();
    } else if (tab === 'moments') {
      this.onMomentsTabSelect();
    } else if (tab === 'circulars') {
      this.loadCirculars();
    } else if (tab === 'library') {
      this.loadLibraryData();
    } else if (tab === 'traffic') {
      this.loadTrafficSummary();
      this.loadTrafficLogs();
    } else if (tab === 'permissions') {
      this.loadPermissions();
    }
  }

  toggleSchoolManagement(): void {
    this.schoolManagementExpanded = !this.schoolManagementExpanded;
  }

  togglePublicSettings(): void {
    this.publicSettingsExpanded = !this.publicSettingsExpanded;
  }

  toggleFinance(): void {
    this.financeExpanded = !this.financeExpanded;
  }

  toggleReviews(): void {
    this.reviewsExpanded = !this.reviewsExpanded;
  }

  toggleAttendance(): void {
    this.attendanceExpanded = !this.attendanceExpanded;
  }

  toggleStationery(): void {
    this.stationeryExpanded = !this.stationeryExpanded;
  }

  toggleDailyUpdates(): void {
    this.dailyUpdatesExpanded = !this.dailyUpdatesExpanded;
  }

  // --- ADMIN FINANCE & BILLING METHODS ---
  loadFeeStructures(): void {
    if (this.programs.length > 0 && !this.newFeeStructure.program_id) {
      this.newFeeStructure.program_id = this.programs[0].id;
    }
    this.contentService.getFeeStructures().subscribe({
      next: (data) => {
        this.feeStructures = data;
      },
      error: (err) => {
        this.showToast(err.error?.detail || 'Failed to load fee structures.', 'error');
      }
    });
  }

  createFeeStructure(): void {
    if (!this.newFeeStructure.name.trim()) {
      this.showToast('Please enter a structure name.', 'error');
      return;
    }
    if (this.newFeeStructure.amount <= 0) {
      this.showToast('Amount must be positive.', 'error');
      return;
    }
    const payload = {
      name: this.newFeeStructure.name,
      category: this.newFeeStructure.category,
      amount: Number(this.newFeeStructure.amount),
      frequency: this.newFeeStructure.frequency,
      program_id: this.newFeeStructure.program_id ? Number(this.newFeeStructure.program_id) : null
    };

    if (this.editingFeeStructureId) {
      this.contentService.updateFeeStructure(this.editingFeeStructureId, payload).subscribe({
        next: () => {
          this.showToast('Fee structure updated successfully.', 'success');
          this.resetFeeStructureForm();
          this.loadFeeStructures();
        },
        error: (err) => {
          this.showToast(err.error?.detail || 'Failed to update fee structure.', 'error');
        }
      });
    } else {
      this.contentService.createFeeStructure(payload).subscribe({
        next: () => {
          this.showToast('Fee structure defined successfully.', 'success');
          this.resetFeeStructureForm();
          this.loadFeeStructures();
        },
        error: (err) => {
          this.showToast(err.error?.detail || 'Failed to create fee structure.', 'error');
        }
      });
    }
  }

  editFeeStructure(fee: any): void {
    this.editingFeeStructureId = fee.id;
    this.newFeeStructure = {
      name: fee.name,
      category: fee.category,
      amount: fee.amount,
      frequency: fee.frequency,
      program_id: fee.program_id || 0
    };
  }

  applyTransportPreset(): void {
    if (this.transportPreset === '5') {
      this.newFeeStructure.name = 'Transport Fee (Upto 5km)';
      this.newFeeStructure.amount = 1000;
      this.newFeeStructure.frequency = 'Monthly';
    } else if (this.transportPreset === '15') {
      this.newFeeStructure.name = 'Transport Fee (5km to 15km)';
      this.newFeeStructure.amount = 3500;
      this.newFeeStructure.frequency = 'Monthly';
    } else if (this.transportPreset === '30') {
      this.newFeeStructure.name = 'Transport Fee (15km to 30km)';
      this.newFeeStructure.amount = 4500;
      this.newFeeStructure.frequency = 'Monthly';
    }
  }

  resetFeeStructureForm(): void {
    this.editingFeeStructureId = null;
    this.transportPreset = '';
    this.newFeeStructure = {
      name: '',
      category: 'Tuition',
      amount: 0,
      frequency: 'Termly',
      program_id: this.programs.length > 0 ? this.programs[0].id : 0
    };
  }

  getGroupedFeeStructures(): any[] {
    const groups: { [key: string]: any } = {};
    
    // Initialize group for General/All Programs
    groups['General / All Programs'] = {
      title: '🌍 General / All Programs',
      fees: []
    };

    // Initialize groups for each active program
    this.programs.forEach(prog => {
      groups[prog.title] = {
        title: `🏫 Class: ${prog.title}`,
        fees: []
      };
    });

    // Populate fees into their respective program groups
    this.feeStructures.forEach(fee => {
      const groupName = fee.program_title || 'General / All Programs';
      if (!groups[groupName]) {
        groups[groupName] = {
          title: `🏫 Class: ${groupName}`,
          fees: []
        };
      }
      groups[groupName].fees.push(fee);
    });

    // Return as array, filtering out empty groups
    return Object.values(groups).filter((g: any) => g.fees.length > 0);
  }

  getCategoryLabel(category: string): string {
    const labels: { [key: string]: string } = {
      'Tuition': 'Tuition Fee',
      'Books': 'Book Charges',
      'Uniforms': 'Dress / Uniform',
      'ExtraCurricular': 'Extra-Curricular',
      'Transport': 'Transportation',
      'Other': 'Other Fee'
    };
    return labels[category] || category;
  }

  getCategoryColor(category: string): { bg: string; text: string } {
    const colors: { [key: string]: { bg: string; text: string } } = {
      'Tuition': { bg: '#EFF6FF', text: '#1E40AF' },         // Blue
      'Books': { bg: '#F5F3FF', text: '#5B21B6' },           // Purple
      'Uniforms': { bg: '#ECFDF5', text: '#065F46' },        // Green
      'ExtraCurricular': { bg: '#FDF2F8', text: '#9D174D' }, // Pink
      'Transport': { bg: '#FEF3C7', text: '#B45309' },       // Amber
      'Other': { bg: '#F3F4F6', text: '#374151' }            // Gray
    };
    return colors[category] || { bg: '#F3F4F6', text: '#374151' };
  }

  confirmDeleteFeeStructure(fee: any): void {
    this.feeToDeleteId = fee.id;
    this.feeToDeleteName = fee.name;
    this.feeToDeleteCategory = fee.category;
    this.deleteFeeConfirmModalOpen = true;
  }

  executeDeleteFeeStructure(): void {
    if (!this.feeToDeleteId) return;
    this.contentService.deleteFeeStructure(this.feeToDeleteId).subscribe({
      next: () => {
        this.showToast('Fee structure deleted successfully.', 'success');
        this.deleteFeeConfirmModalOpen = false;
        this.feeToDeleteId = null;
        this.loadFeeStructures();
      },
      error: (err) => {
        this.showToast(err.error?.detail || 'Failed to delete fee structure.', 'error');
      }
    });
  }

  loadInvoices(): void {
    this.financeLoading = true;
    const params = {
      status: this.invoiceFilters.status || undefined,
      program_id: this.invoiceFilters.program_id ? Number(this.invoiceFilters.program_id) : undefined,
      search: this.invoiceFilters.search || undefined
    };
    this.contentService.getInvoices(params).subscribe({
      next: (data) => {
        this.invoices = data.invoices;
        this.outstandingCollectionsTotal = data.outstanding_total;
        this.financeLoading = false;
      },
      error: (err) => {
        this.financeLoading = false;
        this.showToast(err.error?.detail || 'Failed to load invoices.', 'error');
      }
    });
  }

  openGenInvoiceModal(): void {
    if (this.programs.length > 0) {
      this.invoiceGeneration.program_id = this.programs[0].id;
    }
    const d = new Date();
    d.setMonth(d.getMonth() + 1);
    this.invoiceGeneration.due_date = d.toISOString().split('T')[0];
    this.genInvoiceModalOpen = true;
  }

  generateTermInvoices(): void {
    if (!this.invoiceGeneration.term_name.trim() || !this.invoiceGeneration.due_date) {
      this.showToast('Please provide a term name and due date.', 'error');
      return;
    }
    const payload = {
      term_name: this.invoiceGeneration.term_name,
      program_id: this.invoiceGeneration.program_id ? Number(this.invoiceGeneration.program_id) : null,
      due_date: this.invoiceGeneration.due_date
    };
    this.contentService.generateTermInvoices(payload).subscribe({
      next: (res) => {
        this.showToast(res.message, 'success');
        this.genInvoiceModalOpen = false;
        this.loadInvoices();
      },
      error: (err) => {
        this.showToast(err.error?.detail || 'Failed to generate term invoices.', 'error');
      }
    });
  }

  openRecordPaymentModal(invoice: any): void {
    this.selectedInvoice = invoice;
    this.paymentMethod = 'Cash';
    this.paymentReceiptNo = '';
    
    // Set default paid date to today in local timezone YYYY-MM-DD
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    this.paymentDate = `${yyyy}-${mm}-${dd}`;
    
    this.paymentModalOpen = true;
  }

  recordInvoicePayment(): void {
    if (!this.selectedInvoice) return;
    if (this.paymentMethod === 'Online Pay') {
      this.initiateOnlinePay();
      return;
    }
    const payload = {
      payment_method: this.paymentMethod,
      receipt_no: this.paymentReceiptNo.trim() || undefined,
      paid_date: this.paymentDate || undefined
    };
    this.contentService.recordInvoicePayment(this.selectedInvoice.id, payload).subscribe({
      next: (res) => {
        this.showToast(res.message || 'Payment recorded successfully.', 'success');
        this.paymentModalOpen = false;
        this.selectedInvoice = null;
        this.loadInvoices();
      },
      error: (err) => {
        this.showToast(err.error?.detail || 'Failed to record payment.', 'error');
      }
    });
  }

  initiateOnlinePay(): void {
    if (!this.selectedInvoice) return;
    this.processingPayment = true;
    const invId = this.selectedInvoice.id;
    this.paymentModalOpen = false; // Close Record Payment modal
    
    this.contentService.createInvoiceRazorpayOrder(invId).subscribe({
      next: (data) => {
        this.processingPayment = false;
        if (data.is_mock) {
          // Open simulated Razorpay modal
          this.razorpayOrderData = data;
          this.showRazorpayMockModal = true;
        } else {
          // Load native Razorpay Checkout window
          const options = {
            key: data.key_id,
            amount: data.amount,
            currency: data.currency,
            name: "Vidyankuram Kids School",
            description: data.title,
            order_id: data.order_id,
            handler: (response: any) => {
              this.verifyOnlinePayment(invId, {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                is_mock: false
              });
            },
            prefill: {
              name: this.selectedInvoice.student_name,
              email: this.selectedInvoice.parent_email || ''
            },
            theme: {
              color: "#2563eb"
            }
          };
          const rzp = new (window as any).Razorpay(options);
          rzp.open();
        }
      },
      error: (err) => {
        this.processingPayment = false;
        this.showToast(err.error?.detail || 'Failed to initialize payment gateway checkout.', 'error');
      }
    });
  }

  verifyOnlinePayment(invoiceId: number, payload: any): void {
    this.processingPayment = true;
    this.contentService.verifyInvoiceRazorpayPayment(invoiceId, payload).subscribe({
      next: (res) => {
        this.processingPayment = false;
        this.showRazorpayMockModal = false;
        this.selectedInvoice = null;
        this.razorpayOrderData = null;
        this.showToast(res.message || 'Payment processed successfully!', 'success');
        this.loadInvoices();
      },
      error: (err) => {
        this.processingPayment = false;
        this.showRazorpayMockModal = false;
        this.selectedInvoice = null;
        this.razorpayOrderData = null;
        this.showToast(err.error?.detail || 'Razorpay payment verification failed.', 'error');
      }
    });
  }

  confirmRazorpayMockPayment(): void {
    if (!this.razorpayOrderData) return;
    if (this.razorpayPaymentType === 'stationary') {
      this.verifyStationaryOrderPayment(this.razorpayOrderData.bill_id, {
        is_mock: true
      });
    } else {
      this.verifyOnlinePayment(this.razorpayOrderData.bill_id, {
        is_mock: true
      });
    }
  }

  closeRazorpayMockModal(): void {
    this.showRazorpayMockModal = false;
    this.selectedInvoice = null;
    this.stationaryOrderToPay = null;
    this.razorpayOrderData = null;
  }

  payStationaryOrderWithRazorpay(order: any): void {
    this.stationaryOrderToPay = order;
    this.processingPayment = true;
    this.razorpayPaymentType = 'stationary';
    
    this.stationaryService.createStationaryOrderRazorpayOrder(order.id).subscribe({
      next: (data) => {
        this.processingPayment = false;
        if (data.is_mock) {
          this.razorpayOrderData = data;
          this.showRazorpayMockModal = true;
        } else {
          const options = {
            key: data.key_id,
            amount: data.amount,
            currency: data.currency,
            name: "Vidyankuram Kids School",
            description: data.title,
            order_id: data.order_id,
            handler: (response: any) => {
              this.verifyStationaryOrderPayment(order.id, {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                is_mock: false
              });
            },
            prefill: {
              name: order.created_by?.full_name || 'Staff',
              email: order.created_by?.email || ''
            },
            theme: {
              color: "#2563eb"
            }
          };
          const rzp = new (window as any).Razorpay(options);
          rzp.open();
        }
      },
      error: (err) => {
        this.processingPayment = false;
        this.showToast(err.error?.detail || 'Failed to initialize payment gateway checkout.', 'error');
      }
    });
  }

  verifyStationaryOrderPayment(orderId: number, payload: any): void {
    this.processingPayment = true;
    this.stationaryService.verifyStationaryOrderRazorpayPayment(orderId, payload).subscribe({
      next: (res) => {
        this.processingPayment = false;
        this.showRazorpayMockModal = false;
        this.stationaryOrderToPay = null;
        this.razorpayOrderData = null;
        this.showToast(res.message || 'Payment processed successfully!', 'success');
        this.loadStationary();
      },
      error: (err) => {
        this.processingPayment = false;
        this.showRazorpayMockModal = false;
        this.stationaryOrderToPay = null;
        this.razorpayOrderData = null;
        this.showToast(err.error?.detail || 'Razorpay payment verification failed.', 'error');
      }
    });
  }

  requestReimbursement(orderId: number): void {
    this.stationaryService.requestReimbursement(orderId).subscribe({
      next: (res) => {
        this.showToast(res.message || 'Reimbursement ticket raised successfully.', 'success');
        this.loadStationary();
      },
      error: (err) => {
        this.showToast(err.error?.detail || 'Failed to request reimbursement.', 'error');
      }
    });
  }

  approveReimbursement(orderId: number): void {
    this.stationaryService.approveReimbursement(orderId).subscribe({
      next: (res) => {
        this.showToast(res.message || 'Reimbursement request approved.', 'success');
        this.loadStationary();
      },
      error: (err) => {
        this.showToast(err.error?.detail || 'Failed to approve reimbursement.', 'error');
      }
    });
  }

  rejectReimbursement(orderId: number): void {
    this.stationaryService.rejectReimbursement(orderId).subscribe({
      next: (res) => {
        this.showToast(res.message || 'Reimbursement request rejected.', 'success');
        this.loadStationary();
      },
      error: (err) => {
        this.showToast(err.error?.detail || 'Failed to reject reimbursement.', 'error');
      }
    });
  }

  openEditInvoiceModal(invoice: any): void {
    this.editingInvoiceId = invoice.id;
    this.editInvoiceForm = {
      title: invoice.title,
      amount: invoice.amount,
      waiver_amount: invoice.waiver_amount || 0,
      due_date: invoice.due_date,
      status: invoice.status,
      notes: invoice.notes || '',
      payment_method: invoice.payment_method || '',
      receipt_no: invoice.receipt_no || ''
    };
    this.invoiceEditModalOpen = true;
  }

  updateInvoice(): void {
    if (!this.editingInvoiceId) return;
    if (!this.editInvoiceForm.title.trim()) {
      this.showToast('Please enter an invoice item title.', 'error');
      return;
    }
    if (this.editInvoiceForm.amount < 0) {
      this.showToast('Amount cannot be negative.', 'error');
      return;
    }
    const payload = {
      title: this.editInvoiceForm.title.trim(),
      amount: Number(this.editInvoiceForm.amount),
      waiver_amount: Number(this.editInvoiceForm.waiver_amount),
      due_date: this.editInvoiceForm.due_date,
      status: this.editInvoiceForm.status,
      notes: this.editInvoiceForm.notes ? this.editInvoiceForm.notes.trim() : null,
      payment_method: this.editInvoiceForm.payment_method ? this.editInvoiceForm.payment_method.trim() : null,
      receipt_no: this.editInvoiceForm.receipt_no ? this.editInvoiceForm.receipt_no.trim() : null
    };

    this.contentService.updateInvoice(this.editingInvoiceId, payload).subscribe({
      next: (res) => {
        this.showToast(res.message || 'Invoice updated successfully.', 'success');
        this.invoiceEditModalOpen = false;
        this.editingInvoiceId = null;
        this.loadInvoices();
      },
      error: (err) => {
        this.showToast(err.error?.detail || 'Failed to update invoice.', 'error');
      }
    });
  }

  confirmDeleteInvoice(invoice: any): void {
    this.invoiceToDeleteId = invoice.id;
    this.invoiceToDeleteTitle = invoice.title;
    this.invoiceToDeleteStudent = invoice.student_name;
    this.deleteConfirmModalOpen = true;
  }

  executeDeleteInvoice(): void {
    if (!this.invoiceToDeleteId) return;
    this.contentService.deleteInvoice(this.invoiceToDeleteId).subscribe({
      next: (res) => {
        this.showToast(res.message || 'Invoice deleted successfully.', 'success');
        this.deleteConfirmModalOpen = false;
        this.invoiceToDeleteId = null;
        this.loadInvoices();
      },
      error: (err) => {
        this.showToast(err.error?.detail || 'Failed to delete invoice.', 'error');
      }
    });
  }

  confirmDeleteStationaryOrder(order: any): void {
    this.stationaryOrderToDeleteId = order.id;
    this.stationaryOrderToDeleteTitle = `Order #${order.id} (₹${order.total_price})`;
    this.stationaryOrderToDeleteStudent = order.student_name || order.created_by?.full_name || 'Staff';
    this.deleteStationaryOrderConfirmModalOpen = true;
  }

  executeDeleteStationaryOrder(): void {
    if (!this.stationaryOrderToDeleteId) return;
    this.stationaryService.deleteOrder(this.stationaryOrderToDeleteId).subscribe({
      next: (res) => {
        this.showToast(res.message || 'Stationery order deleted successfully.', 'success');
        this.deleteStationaryOrderConfirmModalOpen = false;
        this.stationaryOrderToDeleteId = null;
        this.loadStationary();
      },
      error: (err) => {
        this.showToast(err.error?.detail || 'Failed to delete stationery order.', 'error');
      }
    });
  }

  openWaiverModal(invoice: any): void {
    this.selectedInvoice = invoice;
    this.waiverAmount = 0;
    this.waiverReason = '';
    this.waiverApprovedBy = 'Principal';
    this.waiverFileUrl = '';
    this.waiverFileUploadSuccess = false;
    this.uploadingWaiverFile = false;
    this.waiverError = '';

    // Set default waiver date to today
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    this.waiverDate = `${yyyy}-${mm}-${dd}`;

    this.waiverModalOpen = true;
  }

  onWaiverFileSelected(event: any): void {
    const file: File = event.target.files[0];
    if (file) {
      this.uploadingWaiverFile = true;
      this.waiverFileUploadSuccess = false;
      this.waiverError = '';
      this.authService.uploadCV(file).subscribe({
        next: (res) => {
          this.waiverFileUrl = res.cv_url;
          this.uploadingWaiverFile = false;
          this.waiverFileUploadSuccess = true;
        },
        error: (err) => {
          this.uploadingWaiverFile = false;
          this.waiverError = 'File upload failed: ' + (err.error?.detail || err.message);
        }
      });
    }
  }

  issueInvoiceWaiver(): void {
    if (!this.selectedInvoice) return;
    if (this.waiverAmount <= 0 || this.waiverAmount > this.selectedInvoice.amount) {
      this.showToast('Waiver amount must be greater than 0 and less than or equal to the due amount.', 'error');
      return;
    }
    if (!this.waiverReason.trim()) {
      this.showToast('Please state a reason for issuing the waiver.', 'error');
      return;
    }
    if (!this.waiverDate) {
      this.showToast('Please select the waiver approval date.', 'error');
      return;
    }
    if (!this.waiverApprovedBy) {
      this.showToast('Please specify who approved this waiver.', 'error');
      return;
    }

    const payload = {
      waiver_amount: Number(this.waiverAmount),
      reason: this.waiverReason.trim(),
      waiver_approved_by: this.waiverApprovedBy,
      waiver_date: this.waiverDate,
      waiver_file_url: this.waiverFileUrl || null
    };

    this.contentService.issueInvoiceWaiver(this.selectedInvoice.id, payload).subscribe({
      next: (res) => {
        this.showToast(res.message || 'Waiver recorded.', 'success');
        this.waiverModalOpen = false;
        this.selectedInvoice = null;
        this.loadInvoices();
      },
      error: (err) => {
        this.showToast(err.error?.detail || 'Failed to record waiver.', 'error');
      }
    });
  }

  sendInvoiceReminder(id: number): void {
    this.contentService.sendInvoiceReminder(id).subscribe({
      next: (res) => {
        this.showToast(res.message, 'success');
      },
      error: (err) => {
        this.showToast(err.error?.detail || 'Failed to send reminder.', 'error');
      }
    });
  }

  sendBulkInvoiceReminders(): void {
    if (!confirm('Are you sure you want to send overdue email reminders to all parents with unpaid invoices?')) return;
    this.contentService.sendBulkInvoiceReminders().subscribe({
      next: (res) => {
        this.showToast(res.message, 'success');
      },
      error: (err) => {
        this.showToast(err.error?.detail || 'Failed to send bulk reminders.', 'error');
      }
    });
  }

  // --- ADMIN LEAVE APPROVALS ---
  loadLeavesAdmin(): void {
    this.adminLeavesLoading = true;
    this.contentService.getLeavesAdmin().subscribe({
      next: (data) => {
        this.adminLeaves = data;
        this.adminLeavesLoading = false;
        // Populate existing comments
        data.forEach((l: any) => {
          this.leaveComments[l.id] = l.admin_comment || '';
        });
      },
      error: (err) => {
        this.adminLeavesLoading = false;
        this.showToast(err.error?.detail || 'Failed to load leave requests.', 'error');
      }
    });
  }

  approveLeave(leaveId: number): void {
    const comment = this.leaveComments[leaveId] || '';
    this.contentService.updateLeaveStatus(leaveId, 'Approved', comment).subscribe({
      next: () => {
        this.showToast('Leave request approved and synced with attendance roster.', 'success');
        this.loadLeavesAdmin();
      },
      error: (err) => {
        this.showToast(err.error?.detail || 'Failed to approve leave request.', 'error');
      }
    });
  }

  declineLeave(leaveId: number): void {
    const comment = this.leaveComments[leaveId] || '';
    this.contentService.updateLeaveStatus(leaveId, 'Declined', comment).subscribe({
      next: () => {
        this.showToast('Leave request declined.', 'success');
        this.loadLeavesAdmin();
      },
      error: (err) => {
        this.showToast(err.error?.detail || 'Failed to decline leave request.', 'error');
      }
    });
  }

  loadMealSuspensionsAdmin(): void {
    this.adminMealSuspensionsLoading = true;
    this.apiService.get<any[]>('/meals/suspensions').subscribe({
      next: (data) => {
        this.adminMealSuspensions = data;
        this.adminMealSuspensionsLoading = false;
      },
      error: (err) => {
        this.adminMealSuspensionsLoading = false;
        this.showToast(err.error?.detail || 'Failed to load meal instruction list.', 'error');
      }
    });
  }

  acknowledgeSuspension(suspensionId: number): void {
    this.apiService.post<any>(`/meals/suspensions/${suspensionId}/acknowledge`, {}).subscribe({
      next: (res) => {
        this.showToast(res.message || 'Meal instruction acknowledged successfully.', 'success');
        this.loadMealSuspensionsAdmin();
      },
      error: (err) => {
        this.showToast(err.error?.detail || 'Failed to acknowledge meal instruction.', 'error');
      }
    });
  }


  // --- MILESTONES TEMPLATES & STUDENT PROGRESS ---
  setMilestoneSubTab(subTab: string): void {
    this.milestoneActiveSubTab = subTab;
    if (subTab === 'templates') {
      this.loadMilestoneTemplates();
    } else {
      this.loadMilestoneStudents();
    }
  }

  loadMilestoneTemplates(): void {
    if (!this.selectedMilestoneProgramId) return;
    this.contentService.getMilestoneTemplates(this.selectedMilestoneProgramId).subscribe({
      next: (data) => {
        this.milestoneTemplates = data;
      },
      error: (err) => {
        this.showToast(err.error?.detail || 'Failed to load milestone templates.', 'error');
      }
    });
  }

  onMilestoneProgramChange(): void {
    this.newMilestoneTemplate.program_id = this.selectedMilestoneProgramId;
    this.loadMilestoneTemplates();
  }

  addMilestoneTemplate(): void {
    if (!this.newMilestoneTemplate.milestone_name.trim()) {
      this.showToast('Please enter a milestone description.', 'error');
      return;
    }
    
    const finalData = { ...this.newMilestoneTemplate };
    if (this.showCustomCategory) {
      if (!this.customCategoryName.trim()) {
        this.showToast('Please specify a custom category name.', 'error');
        return;
      }
      finalData.category = this.customCategoryName.trim();
    }

    this.contentService.createMilestoneTemplate(finalData).subscribe({
      next: () => {
        this.showToast('Milestone template added successfully.', 'success');
        this.newMilestoneTemplate.milestone_name = '';
        this.showCustomCategory = false;
        this.customCategoryName = '';
        this.loadMilestoneTemplates();
      },
      error: (err) => {
        this.showToast(err.error?.detail || 'Failed to add milestone template.', 'error');
      }
    });
  }

  get allMilestoneCategories(): string[] {
    const cats = new Set<string>(['Cognitive', 'Physical', 'Emotional']);
    this.milestoneTemplates.forEach(t => {
      if (t.category) cats.add(t.category);
    });
    return Array.from(cats);
  }

  getTemplatesByCategory(category: string): any[] {
    return this.milestoneTemplates.filter(t => t.category === category);
  }

  deleteMilestoneTemplate(id: number): void {
    if (!confirm('Are you sure you want to delete this template milestone?')) return;
    this.contentService.deleteMilestoneTemplate(id).subscribe({
      next: () => {
        this.showToast('Milestone template deleted successfully.', 'success');
        this.loadMilestoneTemplates();
      },
      error: (err) => {
        this.showToast(err.error?.detail || 'Failed to delete template.', 'error');
      }
    });
  }

  startEditTemplate(temp: any): void {
    this.editingTemplateId = temp.id;
    this.editingTemplateData = {
      milestone_name: temp.milestone_name || '',
      category: temp.category || 'Cognitive'
    };
  }

  cancelEditTemplate(): void {
    this.editingTemplateId = null;
  }

  saveEditTemplate(id: number): void {
    if (!this.editingTemplateData.milestone_name.trim()) {
      this.showToast('Milestone description cannot be empty.', 'error');
      return;
    }
    this.contentService.updateMilestoneTemplate(id, this.editingTemplateData).subscribe({
      next: () => {
        this.showToast('Milestone template updated successfully.', 'success');
        this.editingTemplateId = null;
        this.loadMilestoneTemplates();
      },
      error: (err) => {
        this.showToast(err.error?.detail || 'Failed to update milestone template.', 'error');
      }
    });
  }

  get filteredMilestoneStudents(): any[] {
    if (!this.milestoneStudentSearchQuery.trim()) {
      return this.milestoneStudents;
    }
    const q = this.milestoneStudentSearchQuery.toLowerCase().trim();
    return this.milestoneStudents.filter(s => s.name && s.name.toLowerCase().includes(q));
  }

  onStudentSearchQueryChange(): void {
    const filtered = this.filteredMilestoneStudents;
    if (filtered.length > 0) {
      const exists = filtered.some(s => s.id === Number(this.selectedMilestoneStudentId));
      if (!exists) {
        this.selectedMilestoneStudentId = filtered[0].id;
        this.selectedMilestoneStudentName = filtered[0].name;
        this.loadStudentMilestones();
      }
    }
  }

  // Student progress marking
  loadMilestoneStudents(): void {
    if (!this.milestoneStudentProgramId) return;
    this.milestoneStudentSearchQuery = '';
    this.contentService.getStudents(this.milestoneStudentProgramId).subscribe({
      next: (data) => {
        this.milestoneStudents = data;
        if (data.length > 0) {
          this.selectedMilestoneStudentId = data[0].id;
          this.selectedMilestoneStudentName = data[0].name;
          this.loadStudentMilestones();
        } else {
          this.selectedMilestoneStudentId = 0;
          this.selectedMilestoneStudentName = '';
          this.studentMilestones = [];
        }
      },
      error: (err) => {
        this.showToast(err.error?.detail || 'Failed to load class students.', 'error');
      }
    });
  }

  onMilestoneStudentChange(): void {
    const student = this.milestoneStudents.find(s => s.id === Number(this.selectedMilestoneStudentId));
    if (student) {
      this.selectedMilestoneStudentName = student.name;
      this.loadStudentMilestones();
    }
  }

  loadStudentMilestones(): void {
    if (!this.selectedMilestoneStudentId) return;
    this.contentService.getStudentMilestones(this.selectedMilestoneStudentId).subscribe({
      next: (data) => {
        this.studentMilestones = data;
      },
      error: (err) => {
        this.showToast(err.error?.detail || 'Failed to load student progress milestones.', 'error');
      }
    });
  }

  saveStudentMilestones(): void {
    if (!this.selectedMilestoneStudentId) return;
    this.savingStudentMilestones = true;
    const payload = { milestones: this.studentMilestones };
    this.contentService.saveStudentMilestones(this.selectedMilestoneStudentId, payload).subscribe({
      next: () => {
        this.savingStudentMilestones = false;
        this.showToast('Student milestones updated successfully.', 'success');
        this.loadStudentMilestones();
      },
      error: (err) => {
        this.savingStudentMilestones = false;
        this.showToast(err.error?.detail || 'Failed to save student milestones.', 'error');
      }
    });
  }

  markStudentMilestoneStatus(milestoneId: number, status: string): void {
    const m = this.studentMilestones.find(item => item.id === milestoneId);
    if (m) {
      m.status = status;
      if (status.toUpperCase() === 'COMPLETED' && !m.completed_date) {
        m.completed_date = new Date().toISOString().split('T')[0];
      }
    }
  }

  // printable Report Booklet
  generateReportBooklet(): void {
    if (!this.selectedMilestoneStudentId) return;
    const student = this.milestoneStudents.find(s => s.id === Number(this.selectedMilestoneStudentId));
    const program = this.programs.find(p => p.id === Number(this.milestoneStudentProgramId));
    
    this.printBookletStudent = student;
    this.printBookletProgramTitle = program ? program.title : 'Playgroup';
    this.printBookletMilestones = this.studentMilestones;
    this.printBookletOpen = true;
  }

  closePrintBooklet(): void {
    this.printBookletOpen = false;
    this.printBookletStudent = null;
    this.printBookletMilestones = [];
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
              const slides = JSON.parse(hero.content_json);
              this.heroSlides = slides.map((s: any) => ({
                ...s,
                original_title_color: s.title_color || '#ffffff',
                original_subtitle_color: s.subtitle_color || '#FFDE4D',
                title_color: s.title_color || '#ffffff',
                subtitle_color: s.subtitle_color || '#FFDE4D'
              }));
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
      title_color: '#ffffff',
      subtitle_color: '#FFDE4D',
      original_title_color: '#ffffff',
      original_subtitle_color: '#FFDE4D',
      image: '/assets/images/hero_kids_learning.jpg',
      cta_text: 'Click Here',
      cta_link: '/'
    });
  }

  removeHeroSlide(index: number): void {
    this.heroSlides.splice(index, 1);
  }

  resetSlideColors(index: number): void {
    const slide = this.heroSlides[index];
    if (slide) {
      slide.title_color = slide.original_title_color || '#ffffff';
      slide.subtitle_color = slide.original_subtitle_color || '#FFDE4D';
    }
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
        // Update baselines
        this.heroSlides.forEach(s => {
          s.original_title_color = s.title_color;
          s.original_subtitle_color = s.subtitle_color;
        });
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

  getActivePrograms(): any[] {
    return this.programs ? this.programs.filter(p => p.is_active) : [];
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
        uniform_items: 'Books, School Blazer, School Shorts, Pants, Vidyankuram Shoes, Girls Dress, School Tie',
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

  getMediaUrl(url: string): string {
    if (!url) return '';
    let cleaned = url;
    if (cleaned.includes('localhost:8000')) {
      cleaned = cleaned.replace(/^https?:\/\/localhost:8000/, '');
    } else if (cleaned.includes('127.0.0.1:8000')) {
      cleaned = cleaned.replace(/^https?:\/\/127.0.0.1:8000/, '');
    }
    
    // Rewrite legacy /photos/ prefix to /static/photos/ for Nginx compatibility
    if (cleaned.startsWith('/photos/')) {
      cleaned = '/static' + cleaned;
    } else if (cleaned.startsWith('photos/')) {
      cleaned = '/static/' + cleaned;
    }
    
    // If it is a backend upload (starts with static/ or doesn't start with /assets)
    if (!cleaned.startsWith('/assets') && !cleaned.startsWith('assets') && !cleaned.startsWith('http')) {
      return (this.mediaBaseUrl || '') + (cleaned.startsWith('/') ? cleaned : '/' + cleaned);
    }
    
    return (cleaned.startsWith('/') || cleaned.startsWith('http')) ? cleaned : '/' + cleaned;
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

  // --- INQUIRIES & ADMISSIONS DELETE METHODS (ADMIN/SUPERADMIN ONLY) ---
  canDeleteInquiries(): boolean {
    const role = this.currentUser?.role?.toUpperCase();
    return role === 'ADMIN' || role === 'SUPERADMIN';
  }

  // --- CONTACTS ---
  toggleContactSelection(id: number): void {
    const idx = this.selectedContactIds.indexOf(id);
    if (idx > -1) {
      this.selectedContactIds.splice(idx, 1);
    } else {
      this.selectedContactIds.push(id);
    }
  }

  isContactSelected(id: number): boolean {
    return this.selectedContactIds.includes(id);
  }

  toggleAllContacts(): void {
    if (this.areAllContactsSelected()) {
      this.selectedContactIds = [];
    } else {
      this.selectedContactIds = this.contacts.map(c => c.id);
    }
  }

  areAllContactsSelected(): boolean {
    return this.contacts.length > 0 && this.selectedContactIds.length === this.contacts.length;
  }

  deleteSingleContact(id: number): void {
    if (!this.canDeleteInquiries()) {
      this.showToast('You do not have permission to delete inquiries.', 'error');
      return;
    }
    if (!confirm('Are you sure you want to delete this contact submission permanently?')) return;
    this.contentService.deleteContact(id).subscribe({
      next: (res) => {
        this.showToast(res.message || 'Contact inquiry deleted.', 'success');
        this.selectedContactIds = this.selectedContactIds.filter(cid => cid !== id);
        this.loadInquiries();
      },
      error: (err) => this.showToast(err.error?.detail || 'Failed to delete inquiry.', 'error')
    });
  }

  deleteSelectedContacts(): void {
    if (!this.canDeleteInquiries()) {
      this.showToast('You do not have permission to delete inquiries.', 'error');
      return;
    }
    if (this.selectedContactIds.length === 0) return;
    if (!confirm(`Are you sure you want to delete the ${this.selectedContactIds.length} selected contact submissions permanently?`)) return;
    this.contentService.bulkDeleteContacts(this.selectedContactIds).subscribe({
      next: (res) => {
        this.showToast(res.message || 'Selected inquiries deleted.', 'success');
        this.selectedContactIds = [];
        this.loadInquiries();
      },
      error: (err) => this.showToast(err.error?.detail || 'Failed to delete inquiries.', 'error')
    });
  }

  // --- FRANCHISES ---
  toggleFranchiseSelection(id: number): void {
    const idx = this.selectedFranchiseIds.indexOf(id);
    if (idx > -1) {
      this.selectedFranchiseIds.splice(idx, 1);
    } else {
      this.selectedFranchiseIds.push(id);
    }
  }

  isFranchiseSelected(id: number): boolean {
    return this.selectedFranchiseIds.includes(id);
  }

  toggleAllFranchises(): void {
    if (this.areAllFranchisesSelected()) {
      this.selectedFranchiseIds = [];
    } else {
      this.selectedFranchiseIds = this.franchises.map(f => f.id);
    }
  }

  areAllFranchisesSelected(): boolean {
    return this.franchises.length > 0 && this.selectedFranchiseIds.length === this.franchises.length;
  }

  deleteSingleFranchise(id: number): void {
    if (!this.canDeleteInquiries()) {
      this.showToast('You do not have permission to delete inquiries.', 'error');
      return;
    }
    if (!confirm('Are you sure you want to delete this franchise inquiry permanently?')) return;
    this.contentService.deleteFranchise(id).subscribe({
      next: (res) => {
        this.showToast(res.message || 'Franchise inquiry deleted.', 'success');
        this.selectedFranchiseIds = this.selectedFranchiseIds.filter(fid => fid !== id);
        this.loadInquiries();
      },
      error: (err) => this.showToast(err.error?.detail || 'Failed to delete inquiry.', 'error')
    });
  }

  deleteSelectedFranchises(): void {
    if (!this.canDeleteInquiries()) {
      this.showToast('You do not have permission to delete inquiries.', 'error');
      return;
    }
    if (this.selectedFranchiseIds.length === 0) return;
    if (!confirm(`Are you sure you want to delete the ${this.selectedFranchiseIds.length} selected franchise inquiries permanently?`)) return;
    this.contentService.bulkDeleteFranchises(this.selectedFranchiseIds).subscribe({
      next: (res) => {
        this.showToast(res.message || 'Selected inquiries deleted.', 'success');
        this.selectedFranchiseIds = [];
        this.loadInquiries();
      },
      error: (err) => this.showToast(err.error?.detail || 'Failed to delete inquiries.', 'error')
    });
  }

  // --- JOBS ---
  toggleJobSelection(id: number): void {
    const idx = this.selectedJobIds.indexOf(id);
    if (idx > -1) {
      this.selectedJobIds.splice(idx, 1);
    } else {
      this.selectedJobIds.push(id);
    }
  }

  isJobSelected(id: number): boolean {
    return this.selectedJobIds.includes(id);
  }

  toggleAllJobs(): void {
    if (this.areAllJobsSelected()) {
      this.selectedJobIds = [];
    } else {
      this.selectedJobIds = this.applications.map(a => a.id);
    }
  }

  areAllJobsSelected(): boolean {
    return this.applications.length > 0 && this.selectedJobIds.length === this.applications.length;
  }

  deleteSingleJob(id: number): void {
    if (!this.canDeleteInquiries()) {
      this.showToast('You do not have permission to delete inquiries.', 'error');
      return;
    }
    if (!confirm('Are you sure you want to delete this job application permanently?')) return;
    this.contentService.deleteJobApplication(id).subscribe({
      next: (res) => {
        this.showToast(res.message || 'Job application deleted.', 'success');
        this.selectedJobIds = this.selectedJobIds.filter(jid => jid !== id);
        this.loadInquiries();
      },
      error: (err) => this.showToast(err.error?.detail || 'Failed to delete application.', 'error')
    });
  }

  deleteSelectedJobs(): void {
    if (!this.canDeleteInquiries()) {
      this.showToast('You do not have permission to delete inquiries.', 'error');
      return;
    }
    if (this.selectedJobIds.length === 0) return;
    if (!confirm(`Are you sure you want to delete the ${this.selectedJobIds.length} selected job applications permanently?`)) return;
    this.contentService.bulkDeleteJobApplications(this.selectedJobIds).subscribe({
      next: (res) => {
        this.showToast(res.message || 'Selected job applications deleted.', 'success');
        this.selectedJobIds = [];
        this.loadInquiries();
      },
      error: (err) => this.showToast(err.error?.detail || 'Failed to delete applications.', 'error')
    });
  }

  // --- ADMISSIONS ---
  toggleAdmissionSelection(id: number): void {
    const idx = this.selectedAdmissionIds.indexOf(id);
    if (idx > -1) {
      this.selectedAdmissionIds.splice(idx, 1);
    } else {
      this.selectedAdmissionIds.push(id);
    }
  }

  isAdmissionSelected(id: number): boolean {
    return this.selectedAdmissionIds.includes(id);
  }

  toggleAllAdmissions(): void {
    if (this.areAllAdmissionsSelected()) {
      this.selectedAdmissionIds = [];
    } else {
      this.selectedAdmissionIds = this.admissions.map(a => a.id);
    }
  }

  areAllAdmissionsSelected(): boolean {
    return this.admissions.length > 0 && this.selectedAdmissionIds.length === this.admissions.length;
  }

  deleteSingleAdmission(id: number): void {
    if (!this.canDeleteInquiries()) {
      this.showToast('You do not have permission to delete admissions.', 'error');
      return;
    }
    if (!confirm('Are you sure you want to delete this admission application permanently?')) return;
    this.contentService.deleteAdmissionApplication(id).subscribe({
      next: (res) => {
        this.showToast(res.message || 'Admission application deleted.', 'success');
        this.selectedAdmissionIds = this.selectedAdmissionIds.filter(aid => aid !== id);
        this.loadAdmissions();
      },
      error: (err) => this.showToast(err.error?.detail || 'Failed to delete admission.', 'error')
    });
  }

  deleteSelectedAdmissions(): void {
    if (!this.canDeleteInquiries()) {
      this.showToast('You do not have permission to delete admissions.', 'error');
      return;
    }
    if (this.selectedAdmissionIds.length === 0) return;
    if (!confirm(`Are you sure you want to delete the ${this.selectedAdmissionIds.length} selected admission applications permanently?`)) return;
    this.contentService.bulkDeleteAdmissionApplications(this.selectedAdmissionIds).subscribe({
      next: (res) => {
        this.showToast(res.message || 'Selected admissions deleted.', 'success');
        this.selectedAdmissionIds = [];
        this.loadAdmissions();
      },
      error: (err) => this.showToast(err.error?.detail || 'Failed to delete admissions.', 'error')
    });
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
      category: holiday.category || 'National Holiday',
      image_url: holiday.image_url || '',
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
      category: 'National Holiday',
      image_url: '',
      is_active: true,
      send_email: false
    };
  }

  onHolidayFileSelected(event: any): void {
    const file: File = event.target.files[0];
    if (file) {
      this.uploadingHolidayImage = true;
      this.contentService.uploadImage(file).subscribe({
        next: (res) => {
          this.newHoliday.image_url = res.url;
          this.uploadingHolidayImage = false;
          this.showToast('🎉 Holiday image uploaded successfully!');
        },
        error: (err) => {
          this.uploadingHolidayImage = false;
          this.showToast('❌ Upload failed: ' + (err.error?.detail || err.message), 'error');
        }
      });
    }
  }

  removeHolidayImage(): void {
    this.newHoliday.image_url = '';
  }

  // --- CIRCULARS TAB ---
  loadCirculars(): void {
    this.contentService.getCircularsAdmin().subscribe({
      next: (data) => {
        this.circularsList = data;
      },
      error: (err) => {
        this.showToast('❌ Failed to load circulars: ' + (err.error?.detail || err.message), 'error');
      }
    });
  }

  saveCircular(): void {
    const circularData = { ...this.newCircular };
    
    if (this.editingCircularId) {
      this.contentService.updateCircular(this.editingCircularId, circularData).subscribe({
        next: () => {
          this.showToast('🎉 Circular updated successfully!');
          this.loadCirculars();
          this.resetCircularForm();
        },
        error: (err) => {
          this.showToast('❌ Failed to update circular: ' + (err.error?.detail || err.message), 'error');
        }
      });
    } else {
      this.contentService.createCircular(circularData).subscribe({
        next: () => {
          this.showToast('🎉 Circular published and parents notified!');
          this.loadCirculars();
          this.resetCircularForm();
        },
        error: (err) => {
          this.showToast('❌ Failed to create circular: ' + (err.error?.detail || err.message), 'error');
        }
      });
    }
  }

  editCircular(circular: any): void {
    this.editingCircularId = circular.id;
    this.newCircular = {
      title: circular.title,
      content: circular.content,
      program_id: circular.program_id,
      attachment_url: circular.attachment_url || '',
      is_active: circular.is_active
    };
  }

  deleteCircularFromRoster(id: number): void {
    if (confirm('Are you sure you want to delete this circular?')) {
      this.contentService.deleteCircular(id).subscribe({
        next: () => {
          this.showToast('🎉 Circular deleted successfully!');
          this.loadCirculars();
        },
        error: (err) => {
          this.showToast('❌ Failed to delete circular: ' + (err.error?.detail || err.message), 'error');
        }
      });
    }
  }

  resetCircularForm(): void {
    this.editingCircularId = null;
    this.newCircular = {
      title: '',
      content: '',
      program_id: null,
      attachment_url: '',
      is_active: true
    };
  }

  getProgramTitle(id: number | null): string {
    if (!id) return 'School-Wide';
    const prog = this.programs.find(p => p.id === id);
    return prog ? prog.title : 'School-Wide';
  }

  // --- LIBRARY METHODS ---
  loadLibraryData(): void {
    this.contentService.getBooks().subscribe({
      next: (data) => this.booksList = data,
      error: (err) => this.showToast('❌ Failed to load books: ' + (err.error?.detail || err.message), 'error')
    });
    this.contentService.getBorrows().subscribe({
      next: (data) => this.borrowsList = data,
      error: (err) => this.showToast('❌ Failed to load borrows: ' + (err.error?.detail || err.message), 'error')
    });
    this.contentService.getStudents().subscribe({
      next: (data) => this.studentsList = data,
      error: (err) => this.showToast('❌ Failed to load students: ' + (err.error?.detail || err.message), 'error')
    });
  }

  saveBook(): void {
    if (this.editingBookId) {
      this.contentService.updateBook(this.editingBookId, this.newBook).subscribe({
        next: () => {
          this.showToast('🎉 Book updated successfully!');
          this.loadLibraryData();
          this.resetBookForm();
        },
        error: (err) => this.showToast('❌ Failed to update book: ' + (err.error?.detail || err.message), 'error')
      });
    } else {
      this.contentService.createBook(this.newBook).subscribe({
        next: () => {
          this.showToast('🎉 Book added to library catalog!');
          this.loadLibraryData();
          this.resetBookForm();
        },
        error: (err) => this.showToast('❌ Failed to add book: ' + (err.error?.detail || err.message), 'error')
      });
    }
  }

  editBook(book: any): void {
    this.editingBookId = book.id;
    this.newBook = {
      title: book.title,
      author: book.author,
      isbn: book.isbn || '',
      category: book.category,
      total_copies: book.total_copies
    };
  }

  deleteBookFromCatalog(id: number): void {
    if (confirm('Are you sure you want to delete this book? This will also delete all its active borrows.')) {
      this.contentService.deleteBook(id).subscribe({
        next: () => {
          this.showToast('🎉 Book deleted from catalog!');
          this.loadLibraryData();
        },
        error: (err) => this.showToast('❌ Failed to delete book: ' + (err.error?.detail || err.message), 'error')
      });
    }
  }

  resetBookForm(): void {
    this.editingBookId = null;
    this.newBook = { title: '', author: '', isbn: '', category: 'Picture Book', total_copies: 1 };
  }

  getAvailableBooks(): any[] {
    return this.booksList.filter(b => b.available_copies > 0);
  }

  issueBook(): void {
    if (!this.newBorrow.book_id || !this.newBorrow.student_id || !this.newBorrow.borrow_date || !this.newBorrow.due_date) {
      this.showToast('⚠️ Please fill out all borrowing fields.', 'error');
      return;
    }
    const borrowData = {
      book_id: Number(this.newBorrow.book_id),
      student_id: Number(this.newBorrow.student_id),
      borrow_date: this.newBorrow.borrow_date,
      due_date: this.newBorrow.due_date
    };
    this.contentService.issueBook(borrowData).subscribe({
      next: () => {
        this.showToast('🎉 Book issued successfully to student!');
        this.loadLibraryData();
        // Reset borrow fields
        this.newBorrow = {
          book_id: null,
          student_id: null,
          borrow_date: new Date().toISOString().split('T')[0],
          due_date: new Date(Date.now() + 7*24*60*60*1000).toISOString().split('T')[0]
        };
      },
      error: (err) => this.showToast('❌ Failed to issue book: ' + (err.error?.detail || err.message), 'error')
    });
  }

  returnBorrowedBook(borrowId: number): void {
    this.contentService.returnBook(borrowId).subscribe({
      next: () => {
        this.showToast('🎉 Book returned successfully to library inventory!');
        this.loadLibraryData();
      },
      error: (err) => this.showToast('❌ Failed to return book: ' + (err.error?.detail || err.message), 'error')
    });
  }

  getBookTitle(bookId: number): string {
    const book = this.booksList.find(b => b.id === bookId);
    return book ? book.title : 'Unknown Book';
  }

  getStudentName(studentId: number): string {
    const student = this.studentsList.find(s => s.id === studentId);
    return student ? student.name : 'Unknown Student';
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

  // --- TWO-FACTOR AUTHENTICATION (2FA) METHODS ---
  init2FASetup(): void {
    this.tfaLoading = true;
    this.tfaSuccess = '';
    this.tfaError = '';
    this.authService.get2faSetup().subscribe({
      next: (res) => {
        this.tfaSetupData = res;
        this.tfaLoading = false;
      },
      error: (err) => {
        this.tfaLoading = false;
        this.tfaError = err.error?.detail || 'Failed to initialize 2FA setup.';
      }
    });
  }

  verify2FASetup(): void {
    if (!this.tfaSetupCode || this.tfaSetupCode.length !== 6) {
      this.tfaError = 'Please enter a valid 6-digit verification code.';
      return;
    }
    this.tfaLoading = true;
    this.tfaSuccess = '';
    this.tfaError = '';
    this.authService.verify2faSetup(this.tfaSetupData.secret, this.tfaSetupCode).subscribe({
      next: (user) => {
        this.tfaLoading = false;
        this.tfaSetupData = null;
        this.tfaSetupCode = '';
        this.tfaSuccess = 'Two-Factor Authentication has been successfully enabled!';
      },
      error: (err) => {
        this.tfaLoading = false;
        this.tfaError = err.error?.detail || 'Failed to verify verification code.';
      }
    });
  }

  cancel2FASetup(): void {
    this.tfaSetupData = null;
    this.tfaSetupCode = '';
    this.tfaSuccess = '';
    this.tfaError = '';
  }

  disable2FA(): void {
    if (!this.tfaDisableCode || this.tfaDisableCode.length !== 6) {
      this.tfaError = 'Please enter a valid 6-digit verification code.';
      return;
    }
    this.tfaLoading = true;
    this.tfaSuccess = '';
    this.tfaError = '';
    this.authService.disable2fa(this.tfaDisableCode).subscribe({
      next: (user) => {
        this.tfaLoading = false;
        this.tfaDisableCode = '';
        this.tfaSuccess = 'Two-Factor Authentication has been successfully disabled.';
      },
      error: (err) => {
        this.tfaLoading = false;
        this.tfaError = err.error?.detail || 'Failed to disable Two-Factor Authentication.';
      }
    });
  }

  // --- SUPER ADMIN 2FA MANAGEMENT METHODS ---
  openUser2FASetup(user: any): void {
    this.active2faUser = user;
    this.tfaSetupLoading = true;
    this.active2faSetupData = null;
    this.active2faSetupCode = '';
    this.authService.getUser2faSetup(user.id).subscribe({
      next: (res) => {
        this.active2faSetupData = res;
        this.tfaSetupLoading = false;
      },
      error: (err) => {
        this.tfaSetupLoading = false;
        alert(err.error?.detail || 'Failed to initialize 2FA setup for this user.');
        this.closeUser2FASetup();
      }
    });
  }

  closeUser2FASetup(): void {
    this.active2faUser = null;
    this.active2faSetupData = null;
    this.active2faSetupCode = '';
  }

  verifyUser2FASetup(): void {
    if (!this.active2faSetupCode || this.active2faSetupCode.length !== 6) {
      alert('Please enter a valid 6-digit confirmation code.');
      return;
    }
    this.tfaSetupLoading = true;
    this.authService.verifyUser2faSetup(this.active2faUser.id, this.active2faSetupData.secret, this.active2faSetupCode).subscribe({
      next: () => {
        this.tfaSetupLoading = false;
        alert(`2FA security has been successfully enabled for ${this.active2faUser.full_name}!`);
        this.closeUser2FASetup();
        this.loadUsers();
      },
      error: (err) => {
        this.tfaSetupLoading = false;
        alert(err.error?.detail || 'Verification code failed. Please verify and try again.');
      }
    });
  }

  disableUser2FA(user: any): void {
    if (!confirm(`Are you sure you want to deactivate and remove Two-Factor Authentication (2FA) security for ${user.full_name}?`)) {
      return;
    }
    this.usersLoading = true;
    this.authService.disableUser2fa(user.id).subscribe({
      next: () => {
        this.usersLoading = false;
        alert(`2FA security has been successfully disabled for ${user.full_name}.`);
        this.loadUsers();
      },
      error: (err) => {
        this.usersLoading = false;
        alert(err.error?.detail || 'Failed to disable 2FA security.');
      }
    });
  }

  // --- USER MANAGEMENT ---
  loadUsers(): void {
    this.usersLoading = true;
    this.usersError = '';
    this.authService.getUsers().subscribe({
      next: (users) => {
        this.usersList = users;
        this.usersLoading = false;
      },
      error: (err) => {
        this.usersLoading = false;
        this.usersError = err.error?.detail || 'Failed to load users list.';
      }
    });
  }

  saveUser(): void {
    if (!this.newUser.email || !this.newUser.full_name || (!this.editingUserId && !this.newUser.password)) {
      this.usersError = 'Please fill in all required fields.';
      return;
    }

    this.usersLoading = true;
    this.usersError = '';
    this.usersSuccess = '';

    if (this.editingUserId) {
      const updateData: any = {
        full_name: this.newUser.full_name,
        email: this.newUser.email,
        role: this.newUser.role,
        education: this.newUser.education,
        experience: this.newUser.experience,
        achievements: this.newUser.achievements,
        cv_url: this.newUser.cv_url,
        assigned_program_id: this.newUser.assigned_program_id
      };
      if (this.newUser.password) {
        updateData.password = this.newUser.password;
      }
      this.authService.updateUser(this.editingUserId, updateData).subscribe({
        next: () => {
          this.usersLoading = false;
          this.usersSuccess = 'User account updated successfully!';
          this.resetUserForm();
          this.loadUsers();
        },
        error: (err) => {
          this.usersLoading = false;
          this.usersError = err.error?.detail || 'Failed to update user account.';
        }
      });
    } else {
      this.authService.createUser(this.newUser).subscribe({
        next: () => {
          this.usersLoading = false;
          this.usersSuccess = 'New user account created successfully!';
          this.resetUserForm();
          this.loadUsers();
        },
        error: (err) => {
          this.usersLoading = false;
          this.usersError = err.error?.detail || 'Failed to create user account.';
        }
      });
    }
  }

  onCVFileSelected(event: any): void {
    const file: File = event.target.files[0];
    if (file && this.newUser) {
      this.uploadingCV = true;
      this.cvUploadSuccess = false;
      this.usersError = '';
      this.authService.uploadCV(file).subscribe({
        next: (res) => {
          this.newUser.cv_url = res.cv_url;
          this.uploadingCV = false;
          this.cvUploadSuccess = true;
        },
        error: (err) => {
          this.uploadingCV = false;
          this.usersError = 'CV Upload failed: ' + (err.error?.detail || err.message);
        }
      });
    }
  }

  editUser(user: any): void {
    this.editingUserId = user.id;
    this.newUser = {
      full_name: user.full_name,
      email: user.email,
      password: '',
      role: user.role,
      education: user.education || '',
      experience: user.experience || '',
      achievements: user.achievements || '',
      cv_url: user.cv_url || '',
      assigned_program_id: user.assigned_program_id || null
    };
    this.usersError = '';
    this.usersSuccess = '';
    this.cvUploadSuccess = false;
    this.uploadingCV = false;
    this.clearCVFileInput();
  }

  toggleUserStatus(user: any): void {
    this.usersLoading = true;
    this.usersError = '';
    this.usersSuccess = '';
    this.authService.updateUser(user.id, { is_active: !user.is_active }).subscribe({
      next: () => {
        this.usersLoading = false;
        this.usersSuccess = `User account ${user.is_active ? 'deactivated' : 'activated'} successfully!`;
        this.loadUsers();
      },
      error: (err) => {
        this.usersLoading = false;
        this.usersError = err.error?.detail || 'Failed to change user status.';
      }
    });
  }

  deleteUser(userId: number): void {
    if (!confirm('Are you sure you want to delete this user account permanently?')) return;
    this.usersLoading = true;
    this.usersError = '';
    this.usersSuccess = '';
    this.authService.deleteUser(userId).subscribe({
      next: () => {
        this.usersLoading = false;
        this.usersSuccess = 'User account deleted successfully!';
        this.loadUsers();
      },
      error: (err) => {
        this.usersLoading = false;
        this.usersError = err.error?.detail || 'Failed to delete user account.';
      }
    });
  }

  clearCVFileInput(): void {
    const fileInput = document.getElementById('cvFileInput') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }

  resetUserForm(): void {
    this.editingUserId = null;
    this.newUser = {
      full_name: '',
      email: '',
      password: '',
      role: 'Teacher',
      education: '',
      experience: '',
      achievements: '',
      cv_url: '',
      assigned_program_id: null
    };
    this.cvUploadSuccess = false;
    this.uploadingCV = false;
    this.clearCVFileInput();
  }

  getFilteredStationaryOrders(): any[] {
    if (!this.stationaryOrders) return [];
    return this.stationaryOrders.filter(order => {
      if (!order.items || order.items.length === 0) return false;
      return order.items.some((item: any) => {
        const itemType = item.item?.stationery_type || 'school';
        return itemType === this.stationaryCategory;
      });
    });
  }

  getFilteredStationaryItems(): any[] {
    if (!this.stationaryItems) return [];
    return this.stationaryItems.filter((item: any) => {
      return item.stationery_type === this.stationaryCategory || !item.stationery_type;
    });
  }

  setStationaryCategory(category: 'school' | 'teacher' | 'student'): void {
    this.stationaryCategory = category;
    this.stationaryCart = []; // Clear cart on category change to prevent mixing types in checkout
  }

  // --- STATIONERY CENTER ---
  loadStationary(): void {
    this.stationaryLoading = true;
    this.stationaryError = '';
    
    this.stationaryService.getItems().subscribe({
      next: (items) => {
        this.stationaryItems = items;
        this.stationaryLoading = false;
      },
      error: (err) => {
        this.stationaryLoading = false;
        this.stationaryError = err.error?.detail || 'Failed to load stationery inventory.';
      }
    });

    this.stationaryService.getOrders().subscribe({
      next: (orders) => {
        this.stationaryOrders = orders;
      },
      error: () => {}
    });
  }

  saveStationaryItem(): void {
    if (!this.newStationaryItem.name || !this.newStationaryItem.category || this.newStationaryItem.price <= 0) {
      this.stationaryError = 'Please fill in item details correctly.';
      return;
    }

    this.stationaryLoading = true;
    this.stationaryError = '';
    this.stationarySuccess = '';

    if (this.editingStationaryItemId) {
      this.stationaryService.updateItem(this.editingStationaryItemId, this.newStationaryItem).subscribe({
        next: () => {
          this.stationaryLoading = false;
          this.stationarySuccess = 'Stationery item updated successfully!';
          this.resetStationaryForm();
          this.loadStationary();
        },
        error: (err) => {
          this.stationaryLoading = false;
          this.stationaryError = err.error?.detail || 'Failed to update stationery item.';
        }
      });
    } else {
      this.stationaryService.createItem(this.newStationaryItem).subscribe({
        next: () => {
          this.stationaryLoading = false;
          this.stationarySuccess = 'New stationery item added successfully!';
          this.resetStationaryForm();
          this.loadStationary();
        },
        error: (err) => {
          this.stationaryLoading = false;
          this.stationaryError = err.error?.detail || 'Failed to add stationery item.';
        }
      });
    }
  }

  editStationaryItem(item: StationaryItem): void {
    this.editingStationaryItemId = item.id;
    this.newStationaryItem = {
      name: item.name,
      description: item.description || '',
      category: item.category,
      price: item.price,
      stock: item.stock
    };
    this.stationaryError = '';
    this.stationarySuccess = '';
  }

  deleteStationaryItem(itemId: number): void {
    if (!confirm('Are you sure you want to delete this stationery item?')) return;
    this.stationaryLoading = true;
    this.stationaryError = '';
    this.stationarySuccess = '';
    this.stationaryService.deleteItem(itemId).subscribe({
      next: () => {
        this.stationaryLoading = false;
        this.stationarySuccess = 'Stationery item deleted successfully!';
        this.loadStationary();
      },
      error: (err) => {
        this.stationaryLoading = false;
        this.stationaryError = err.error?.detail || 'Failed to delete stationery item.';
      }
    });
  }

  resetStationaryForm(): void {
    this.editingStationaryItemId = null;
    this.newStationaryItem = { name: '', description: '', category: 'Books', price: 0, stock: 0, order_date: '', total_amount: 0, stationery_type: this.stationaryCategory };
  }

  getStationaryByCategory(): any[] {
    return this.stationaryItems.filter(item =>
      (item as any).stationery_type === this.stationaryCategory || !(item as any).stationery_type
    );
  }

  addVendor(): void {
    if (!this.newVendor.name.trim() || !this.newVendor.contact.trim()) {
      alert('Vendor name and contact are required.');
      return;
    }
    this.stationaryVendors.push({
      id: this.nextVendorId++,
      name: this.newVendor.name.trim(),
      contact: this.newVendor.contact.trim(),
      address: this.newVendor.address.trim() || undefined
    });
    this.newVendor = { name: '', contact: '', address: '' };
  }

  deleteVendor(id: number): void {
    if (confirm('Remove this vendor?')) {
      this.stationaryVendors = this.stationaryVendors.filter(v => v.id !== id);
      if (this.selectedVendorId === id) this.selectedVendorId = '';
    }
  }

  // --- SHOPPING CART ---
  addToCart(item: StationaryItem, qtyInput: any): void {
    const qty = parseInt(qtyInput.value, 10);
    if (isNaN(qty) || qty <= 0) return;
    if (qty > item.stock) {
      alert(`Only ${item.stock} items are in stock.`);
      return;
    }

    const existingCartIdx = this.stationaryCart.findIndex(c => c.item.id === item.id);
    if (existingCartIdx > -1) {
      const newQty = this.stationaryCart[existingCartIdx].quantity + qty;
      if (newQty > item.stock) {
        alert(`Cannot add more. Max stock available: ${item.stock}`);
        return;
      }
      this.stationaryCart[existingCartIdx].quantity = newQty;
    } else {
      this.stationaryCart.push({ item, quantity: qty });
    }
    
    qtyInput.value = '1';
  }

  removeFromCart(idx: number): void {
    this.stationaryCart.splice(idx, 1);
  }

  getCartTotal(): number {
    return this.stationaryCart.reduce((acc, curr) => acc + (curr.item.price * curr.quantity), 0);
  }

  checkoutOrder(): void {
    if (this.stationaryCart.length === 0) return;
    
    this.orderError = '';
    this.orderSuccess = '';
    this.stationaryLoading = true;

    const itemsPayload = this.stationaryCart.map(c => ({
      item_id: c.item.id,
      quantity: c.quantity
    }));

    this.stationaryService.placeOrder({
      student_name: this.orderStudentName || undefined,
      class_name: this.orderClassName || undefined,
      items: itemsPayload
    }).subscribe({
      next: () => {
        this.stationaryLoading = false;
        this.stationaryCart = [];
        this.orderStudentName = '';
        this.orderClassName = '';
        this.orderSuccess = 'Order placed successfully! Stock has been updated.';
        this.loadStationary();
      },
      error: (err) => {
        this.stationaryLoading = false;
        this.orderError = err.error?.detail || 'Failed to place stationary order.';
      }
    });
  }

  updateOrderStatus(orderId: number, status: string): void {
    this.stationaryLoading = true;
    this.stationaryService.updateOrderStatus(orderId, status).subscribe({
      next: () => {
        this.stationaryLoading = false;
        this.loadStationary();
      },
      error: (err) => {
        this.stationaryLoading = false;
        alert(err.error?.detail || 'Failed to update order status.');
      }
    });
  }

  // --- STUDENT MOMENTS METHODS ---
  onMomentsTabSelect(): void {
    if (this.programs.length > 0) {
      if (!this.momentSelectedProgramId) {
        this.momentSelectedProgramId = this.programs[0].id;
      }
      this.loadMomentsStudents();
    }
  }

  loadMomentsStudents(): void {
    if (!this.momentSelectedProgramId) return;
    this.momentStudentSearchQuery = '';
    this.contentService.getStudents(Number(this.momentSelectedProgramId)).subscribe({
      next: (data) => {
        this.momentStudents = data;
        if (data.length > 0) {
          this.momentSelectedStudentId = data[0].id;
          this.loadStudentMoments();
        } else {
          this.momentSelectedStudentId = null;
          this.momentsList = [];
        }
      },
      error: (err) => {
        this.showToast('Failed to load students for this program.', 'error');
      }
    });
  }

  get filteredMomentStudents(): any[] {
    if (!this.momentStudentSearchQuery.trim()) {
      return this.momentStudents;
    }
    const q = this.momentStudentSearchQuery.toLowerCase().trim();
    return this.momentStudents.filter(s => s.name && s.name.toLowerCase().includes(q));
  }

  onMomentStudentSearchQueryChange(): void {
    const filtered = this.filteredMomentStudents;
    if (filtered.length > 0) {
      const exists = filtered.some(s => s.id === Number(this.momentSelectedStudentId));
      if (!exists) {
        this.momentSelectedStudentId = filtered[0].id;
        this.loadStudentMoments();
      }
    }
  }

  onMomentStudentSelect(): void {
    this.loadStudentMoments();
  }

  loadStudentMoments(): void {
    if (!this.momentSelectedStudentId) {
      this.momentsList = [];
      return;
    }
    this.momentsLoading = true;
    this.momentsService.getMomentsByStudent(Number(this.momentSelectedStudentId)).subscribe({
      next: (data) => {
        this.momentsList = data;
        this.momentsLoading = false;
      },
      error: (err) => {
        this.momentsLoading = false;
        this.showToast('Failed to load active moments.', 'error');
      }
    });
  }

  onMomentFileChange(event: any): void {
    const selectedFiles = event.target.files;
    if (!selectedFiles || selectedFiles.length === 0) return;
    
    this.momentFiles = [];
    this.momentFilePreviews = [];
    
    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
        this.showToast(`File ${file.name} is not a valid image or video.`, 'error');
        continue;
      }
      this.momentFiles.push(file);
      
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.momentFilePreviews.push({
          url: e.target.result,
          type: file.type.startsWith('video/') ? 'video' : 'image'
        });
      };
      reader.readAsDataURL(file);
    }
  }

  uploadStudentMoment(): void {
    if (!this.momentSelectedStudentId) {
      this.showToast('Please select a student.', 'error');
      return;
    }
    if (this.momentFiles.length === 0) {
      this.showToast('Please select at least one image or video file to upload.', 'error');
      return;
    }
    if (!this.momentDescription.trim()) {
      this.showToast('Please enter a caption description.', 'error');
      return;
    }

    this.momentsUploading = true;
    this.momentsService.uploadMoment(
      Number(this.momentSelectedStudentId),
      this.momentDescription,
      this.momentFiles
    ).subscribe({
      next: (res) => {
        this.momentsUploading = false;
        this.showToast(`Successfully uploaded ${res.moments?.length || this.momentFiles.length} moments and notified parents!`, 'success');
        
        // Reset upload fields
        this.momentDescription = '';
        this.momentFiles = [];
        this.momentFilePreviews = [];
        
        // Clear input file element
        const fileInput = document.getElementById('momentFileInput') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
        
        // Reload list
        this.loadStudentMoments();
      },
      error: (err) => {
        this.momentsUploading = false;
        this.showToast(err.error?.detail || 'Failed to upload moment.', 'error');
      }
    });
  }

  deleteStudentMoment(momentId: number): void {
    if (!confirm('Are you sure you want to delete this moment? It will be permanently removed.')) return;
    
    this.momentsService.deleteMoment(momentId).subscribe({
      next: () => {
        this.showToast('Moment deleted successfully.', 'success');
        this.loadStudentMoments();
      },
      error: (err) => {
        this.showToast(err.error?.detail || 'Failed to delete moment.', 'error');
      }
    });
  }

  // --- TRAFFIC ANALYTICS ---
  loadTrafficSummary(): void {
    this.trafficLoading = true;
    this.apiService.get<any>(`/traffic/summary`, { 
      days: this.trafficDays,
      exclude_local: this.trafficExcludeLocal 
    }).subscribe({
      next: (data) => { this.trafficSummary = data; this.trafficLoading = false; },
      error: () => { this.trafficLoading = false; }
    });
  }

  loadTrafficLogs(): void {
    const params: any = { 
      page: this.trafficPage, 
      page_size: this.trafficPageSize, 
      days: this.trafficDays,
      exclude_local: this.trafficExcludeLocal
    };
    if (this.trafficFilter.ip) params.ip = this.trafficFilter.ip;
    if (this.trafficFilter.country) params.country = this.trafficFilter.country;
    this.apiService.get<any>('/traffic/logs', params).subscribe({
      next: (data) => { this.trafficLogs = data.logs; this.trafficTotal = data.total; },
      error: () => {}
    });
  }

  onExcludeLocalChange(): void {
    this.trafficPage = 1; // reset page
    this.loadTrafficSummary();
    this.loadTrafficLogs();
  }

  purgeTrafficLogs(): void {
    if (!confirm('Delete all traffic logs older than 30 days?')) return;
    this.apiService.delete<any>('/traffic/logs/purge?older_than_days=30').subscribe({
      next: (res) => { alert(res.message); this.loadTrafficSummary(); this.loadTrafficLogs(); },
      error: () => alert('Failed to purge logs.')
    });
  }

  clearTrafficLogs(): void {
    if (!confirm('⚠️ WARNING: This will permanently delete ALL traffic logs from the database, resetting the grid and charts completely. This cannot be undone.\n\nAre you sure you want to proceed?')) return;
    this.apiService.delete<any>('/traffic/logs/clear').subscribe({
      next: (res) => { alert(res.message); this.loadTrafficSummary(); this.loadTrafficLogs(); },
      error: () => alert('Failed to clear traffic logs.')
    });
  }

  getBarHeight(value: number, data: any[]): number {
    const max = Math.max(...data.map((d: any) => d.visits || d.attempts || 1), 1);
    return Math.round((value / max) * 100);
  }

  getHeatColor(value: number, data: any[]): string {
    const max = Math.max(...data.map((d: any) => d.visits), 1);
    const pct = value / max;
    const r = Math.round(59 + pct * (239 - 59));
    const g = Math.round(130 + pct * (68 - 130));
    const b = Math.round(246 + pct * (68 - 246));
    return `rgb(${r},${g},${b})`;
  }

  // --- ROLE-BASED ACCESS CONTROL METHODS ---
  loadPermissions(): void {
    // Load rate limit setting first
    this.apiService.get<any>('/settings').subscribe({
      next: (settings) => {
        if (settings && settings.rate_limit_per_min) {
          this.rateLimitPerMin = parseInt(settings.rate_limit_per_min, 10);
        }
      }
    });

    this.apiService.get<any[]>('/permissions/all').subscribe({
      next: (data) => {
        this.permissionsList = data;
        this.permissionGrid = {};
        for (const feature of this.featuresList) {
          this.permissionGrid[feature.code] = {};
          for (const role of this.rolesList) {
            this.permissionGrid[feature.code][role] = false;
          }
        }
        for (const perm of data) {
          if (this.permissionGrid[perm.feature]) {
            this.permissionGrid[perm.feature][perm.role] = perm.is_enabled;
          }
        }
      },
      error: () => this.showToast('Failed to load permission configurations.', 'error')
    });
  }

  savePermissions(): void {
    const updates: any[] = [];
    for (const feature of this.featuresList) {
      for (const role of this.rolesList) {
        updates.push({
          role: role,
          feature: feature.code,
          is_enabled: this.permissionGrid[feature.code][role] || false
        });
      }
    }

    // Save the rate limit setting first, then save the permissions
    this.apiService.put<any>('/settings', {
      rate_limit_per_min: this.rateLimitPerMin.toString()
    }).subscribe({
      next: () => {
        this.apiService.put<any>('/permissions', updates).subscribe({
          next: (res) => {
            this.showToast(res.message || 'Permissions and settings saved successfully!', 'success');
            this.loadPermissions();
          },
          error: () => this.showToast('Failed to save feature permissions.', 'error')
        });
      },
      error: () => this.showToast('Failed to save rate limit settings.', 'error')
    });
  }

  hasPermission(feature: string): boolean {
    return this.authService.hasPermission(feature);
  }

  ngOnDestroy(): void {
    if (this.clockInterval) {
      clearInterval(this.clockInterval);
    }
  }
}
