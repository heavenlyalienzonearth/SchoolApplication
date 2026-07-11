import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

export interface StudentMoment {
  id: number;
  student_id: number;
  file_path: string;
  file_type: 'image' | 'video';
  title?: string;
  created_at: string;
  expires_at: string;
  hours_remaining?: number;
}

@Injectable({
  providedIn: 'root'
})
export class MomentsService {
  constructor(private apiService: ApiService) {}

  uploadMoment(studentId: number, title: string, files: File[]): Observable<any> {
    const formData = new FormData();
    formData.append('student_id', studentId.toString());
    formData.append('title', title);
    for (let i = 0; i < files.length; i++) {
      formData.append('files', files[i]);
    }
    return this.apiService.post<any>('/moments/upload', formData);
  }

  getMomentsByStudent(studentId: number): Observable<StudentMoment[]> {
    return this.apiService.get<StudentMoment[]>(`/moments/student/${studentId}`);
  }

  deleteMoment(momentId: number): Observable<any> {
    return this.apiService.delete<any>(`/moments/${momentId}`);
  }

  getParentMoments(): Observable<StudentMoment[]> {
    return this.apiService.get<StudentMoment[]>('/moments/parent/active');
  }
}
