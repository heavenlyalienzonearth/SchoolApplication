import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

export interface TeacherAchievement {
  id: number;
  teacher_id: number;
  title: string;
  description?: string;
  date: string;
  certificate_url?: string;
  created_at: string;
}

@Injectable({
  providedIn: 'root'
})
export class TeacherService {
  constructor(private apiService: ApiService) {}

  getDashboard(): Observable<any> {
    return this.apiService.get<any>('/teacher/dashboard');
  }

  getClassOrders(): Observable<any[]> {
    return this.apiService.get<any[]>('/teacher/orders');
  }

  approveOrder(orderId: number): Observable<any> {
    return this.apiService.put<any>(`/stationary/orders/${orderId}/status`, { status: 'Dispatched' });
  }

  rejectOrder(orderId: number): Observable<any> {
    return this.apiService.put<any>(`/stationary/orders/${orderId}/status`, { status: 'Rejected' });
  }

  getAchievements(): Observable<TeacherAchievement[]> {
    return this.apiService.get<TeacherAchievement[]>('/teacher/achievements');
  }

  uploadAchievement(formData: FormData): Observable<TeacherAchievement> {
    return this.apiService.post<TeacherAchievement>('/teacher/achievements', formData);
  }

  deleteAchievement(id: number): Observable<any> {
    return this.apiService.delete<any>(`/teacher/achievements/${id}`);
  }

  getStudents(): Observable<any[]> {
    return this.apiService.get<any[]>('/teacher/students');
  }

  // --- KUDOS & BADGES ---
  awardKudos(kudosData: any): Observable<any> {
    return this.apiService.post<any>('/teacher/kudos', kudosData);
  }

  getKudos(): Observable<any[]> {
    return this.apiService.get<any[]>('/teacher/kudos');
  }

  deleteKudos(id: number): Observable<any> {
    return this.apiService.delete<any>(`/teacher/kudos/${id}`);
  }

  // --- INCIDENT & HEALTH LOGS ---
  logIncident(incidentData: any): Observable<any> {
    return this.apiService.post<any>('/teacher/incidents', incidentData);
  }

  getIncidents(): Observable<any[]> {
    return this.apiService.get<any[]>('/teacher/incidents');
  }

  deleteIncident(id: number): Observable<any> {
    return this.apiService.delete<any>(`/teacher/incidents/${id}`);
  }
}
