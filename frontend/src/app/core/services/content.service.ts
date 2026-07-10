import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root'
})
export class ContentService {
  constructor(private apiService: ApiService) {}

  // --- SITE SETTINGS ---
  getSettings(): Observable<any> {
    return this.apiService.get<any>('/settings');
  }

  getRawSettings(): Observable<any[]> {
    return this.apiService.get<any[]>('/settings/raw');
  }

  updateSettings(updates: any): Observable<any> {
    return this.apiService.put<any>('/settings', updates);
  }

  // --- PAGE SECTIONS ---
  getPageSections(pageCode: string): Observable<any[]> {
    return this.apiService.get<any[]>(`/pages/${pageCode}`);
  }

  getPageSectionsAdmin(pageCode: string): Observable<any[]> {
    return this.apiService.get<any[]>(`/pages/admin/${pageCode}`);
  }

  updatePageSection(pageCode: string, sectionCode: string, data: any): Observable<any> {
    return this.apiService.put<any>(`/pages/${pageCode}/${sectionCode}`, data);
  }

  // --- PROGRAMS ---
  getPrograms(): Observable<any[]> {
    return this.apiService.get<any[]>('/programs');
  }

  getProgramsAdmin(): Observable<any[]> {
    return this.apiService.get<any[]>('/programs/admin');
  }

  createProgram(program: any): Observable<any> {
    return this.apiService.post<any>('/programs', program);
  }

  updateProgram(id: number, program: any): Observable<any> {
    return this.apiService.put<any>(`/programs/${id}`, program);
  }

  deleteProgram(id: number): Observable<any> {
    return this.apiService.delete<any>(`/programs/${id}`);
  }

  // --- TESTIMONIALS ---
  getTestimonials(): Observable<any[]> {
    return this.apiService.get<any[]>('/testimonials');
  }

  getTestimonialsAdmin(): Observable<any[]> {
    return this.apiService.get<any[]>('/testimonials/admin');
  }

  createTestimonial(testimonial: any): Observable<any> {
    return this.apiService.post<any>('/testimonials', testimonial);
  }

  updateTestimonial(id: number, testimonial: any): Observable<any> {
    return this.apiService.put<any>(`/testimonials/${id}`, testimonial);
  }

  deleteTestimonial(id: number): Observable<any> {
    return this.apiService.delete<any>(`/testimonials/${id}`);
  }

  // --- GALLERY ---
  getGalleryItems(): Observable<any[]> {
    return this.apiService.get<any[]>('/gallery');
  }

  getGalleryItemsAdmin(): Observable<any[]> {
    return this.apiService.get<any[]>('/gallery/admin');
  }

  createGalleryItem(item: any): Observable<any> {
    return this.apiService.post<any>('/gallery', item);
  }

  updateGalleryItem(id: number, item: any): Observable<any> {
    return this.apiService.put<any>(`/gallery/${id}`, item);
  }

  deleteGalleryItem(id: number): Observable<any> {
    return this.apiService.delete<any>(`/gallery/${id}`);
  }

  uploadImage(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    return this.apiService.post<any>('/upload', formData);
  }

  // --- EVENTS ---
  getEvents(): Observable<any[]> {
    return this.apiService.get<any[]>('/events');
  }

  getEventsAdmin(): Observable<any[]> {
    return this.apiService.get<any[]>('/events/admin');
  }

  createEvent(event: any): Observable<any> {
    return this.apiService.post<any>('/events', event);
  }

  updateEvent(id: number, event: any): Observable<any> {
    return this.apiService.put<any>(`/events/${id}`, event);
  }

  deleteEvent(id: number): Observable<any> {
    return this.apiService.delete<any>(`/events/${id}`);
  }

  // --- BLOGS ---
  getBlogs(): Observable<any[]> {
    return this.apiService.get<any[]>('/blogs');
  }

  getBlogsAdmin(): Observable<any[]> {
    return this.apiService.get<any[]>('/blogs/admin');
  }

  getBlogBySlug(slug: string): Observable<any> {
    return this.apiService.get<any>(`/blogs/${slug}`);
  }

  createBlog(blog: any): Observable<any> {
    return this.apiService.post<any>('/blogs', blog);
  }

  updateBlog(id: number, blog: any): Observable<any> {
    return this.apiService.put<any>(`/blogs/${id}`, blog);
  }

  deleteBlog(id: number): Observable<any> {
    return this.apiService.delete<any>(`/blogs/${id}`);
  }

  // --- FAQS ---
  getFAQs(): Observable<any[]> {
    return this.apiService.get<any[]>('/faqs');
  }

  getFAQsAdmin(): Observable<any[]> {
    return this.apiService.get<any[]>('/faqs/admin');
  }

  createFAQ(faq: any): Observable<any> {
    return this.apiService.post<any>('/faqs', faq);
  }

  updateFAQ(id: number, faq: any): Observable<any> {
    return this.apiService.put<any>(`/faqs/${id}`, faq);
  }

  deleteFAQ(id: number): Observable<any> {
    return this.apiService.delete<any>(`/faqs/${id}`);
  }

  // --- CAREERS ---
  getCareers(): Observable<any[]> {
    return this.apiService.get<any[]>('/careers');
  }

  getCareersAdmin(): Observable<any[]> {
    return this.apiService.get<any[]>('/careers/admin');
  }

  createCareer(career: any): Observable<any> {
    return this.apiService.post<any>('/careers', career);
  }

  updateCareer(id: number, career: any): Observable<any> {
    return this.apiService.put<any>(`/careers/${id}`, career);
  }

  deleteCareer(id: number): Observable<any> {
    return this.apiService.delete<any>(`/careers/${id}`);
  }

  // --- SUBMISSIONS ---
  submitContactForm(data: any): Observable<any> {
    return this.apiService.post<any>('/contact', data);
  }

  getContactSubmissions(): Observable<any[]> {
    return this.apiService.get<any[]>('/contact/admin');
  }

  updateContactStatus(id: number, status: string): Observable<any> {
    return this.apiService.put<any>(`/contact/admin/${id}`, { status });
  }

  submitFranchiseInquiry(data: any): Observable<any> {
    return this.apiService.post<any>('/franchise', data);
  }

  getFranchiseInquiries(): Observable<any[]> {
    return this.apiService.get<any[]>('/franchise/admin');
  }

  updateFranchiseStatus(id: number, status: string): Observable<any> {
    return this.apiService.put<any>(`/franchise/admin/${id}`, { status });
  }

  applyToJob(data: any): Observable<any> {
    return this.apiService.post<any>('/careers/apply', data);
  }

  getJobApplications(): Observable<any[]> {
    return this.apiService.get<any[]>('/careers/applications/admin');
  }

  getAnalytics(): Observable<any> {
    return this.apiService.get<any>('/submissions/analytics');
  }

  // --- ATTENDANCE ---
  getStudents(programId?: number): Observable<any[]> {
    const url = programId ? `/attendance/students?program_id=${programId}` : '/attendance/students';
    return this.apiService.get<any[]>(url);
  }

  createStudent(student: any): Observable<any> {
    return this.apiService.post<any>('/attendance/students', student);
  }

  deleteStudent(id: number): Observable<any> {
    return this.apiService.delete<any>(`/attendance/students/${id}`);
  }

  getAttendanceRecords(programId: number, date: string): Observable<any[]> {
    return this.apiService.get<any[]>(`/attendance/records?program_id=${programId}&date=${date}`);
  }

  saveAttendanceRecords(data: any): Observable<any> {
    return this.apiService.post<any>('/attendance/records', data);
  }

  getAttendanceStats(programId?: number): Observable<any[]> {
    const url = programId ? `/attendance/stats?program_id=${programId}` : '/attendance/stats';
    return this.apiService.get<any[]>(url);
  }

  // --- ADMIN MILESTONES & LEAVES ---
  getMilestoneTemplates(programId: number): Observable<any[]> {
    return this.apiService.get<any[]>(`/attendance/milestones/templates?program_id=${programId}`);
  }

  createMilestoneTemplate(data: any): Observable<any> {
    return this.apiService.post<any>('/attendance/milestones/templates', data);
  }

  deleteMilestoneTemplate(id: number): Observable<any> {
    return this.apiService.delete<any>(`/attendance/milestones/templates/${id}`);
  }

  getStudentMilestones(studentId: number): Observable<any[]> {
    return this.apiService.get<any[]>(`/attendance/milestones/student/${studentId}`);
  }

  saveStudentMilestones(studentId: number, data: any): Observable<any> {
    return this.apiService.post<any>(`/attendance/milestones/student/${studentId}`, data);
  }

  getLeavesAdmin(): Observable<any[]> {
    return this.apiService.get<any[]>('/attendance/leaves');
  }

  updateLeaveStatus(leaveId: number, status: string): Observable<any> {
    return this.apiService.put<any>(`/attendance/leaves/${leaveId}/status`, { status });
  }

  // --- STUDENT ADMISSIONS ---
  getVaccinations(): Observable<any[]> {
    return this.apiService.get<any[]>('/admissions/vaccinations');
  }

  uploadVaccinationsExcel(formData: FormData): Observable<any> {
    return this.apiService.post<any>('/admissions/vaccinations/upload', formData);
  }

  submitAdmission(data: any): Observable<any> {
    return this.apiService.post<any>('/admissions/apply', data);
  }

  getAdmissionApplications(): Observable<any[]> {
    return this.apiService.get<any[]>('/admissions/applications');
  }

  updateAdmissionStatus(id: number, status: string): Observable<any> {
    return this.apiService.put<any>(`/admissions/applications/${id}/status`, { status });
  }

  uploadChildPhoto(formData: FormData): Observable<any> {
    return this.apiService.post<any>('/admissions/upload-photo', formData);
  }

  emailStudentBadge(admissionId: number): Observable<any> {
    return this.apiService.post<any>(`/admissions/applications/${admissionId}/email-badge`, {});
  }

  getHolidays(year?: number): Observable<any[]> {
    const url = year ? `/holidays?year=${year}` : '/holidays';
    return this.apiService.get<any[]>(url);
  }

  createHoliday(holiday: any): Observable<any> {
    return this.apiService.post<any>('/holidays', holiday);
  }

  updateHoliday(id: number, holiday: any): Observable<any> {
    return this.apiService.put<any>(`/holidays/${id}`, holiday);
  }

  deleteHoliday(id: number): Observable<any> {
    return this.apiService.delete<any>(`/holidays/${id}`);
  }

  sendCustomHolidayEmail(payload: any): Observable<any> {
    return this.apiService.post<any>('/holidays/send-custom-holiday-email', payload);
  }
}
