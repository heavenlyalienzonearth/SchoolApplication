import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

export interface ClassAssignment {
  id: number;
  program_id: number;
  teacher_id?: number;
  title: string;
  description?: string;
  files_json: string; // JSON array string
  date: string; // YYYY-MM-DD
  created_at: string;
  program?: any;
  teacher?: any;
}

@Injectable({
  providedIn: 'root'
})
export class AssignmentService {
  constructor(private apiService: ApiService) {}

  uploadAssignment(formData: FormData): Observable<any> {
    // Send standard multi-part form data
    return this.apiService.post<any>('/assignments/upload', formData);
  }

  getTeacherAssignments(): Observable<ClassAssignment[]> {
    return this.apiService.get<ClassAssignment[]>('/assignments/teacher');
  }

  getParentAssignments(studentId: number): Observable<ClassAssignment[]> {
    return this.apiService.get<ClassAssignment[]>(`/assignments/parent/${studentId}`);
  }

  deleteAssignment(assignmentId: number): Observable<any> {
    return this.apiService.delete<any>(`/assignments/${assignmentId}`);
  }
}
