import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

export interface Bill {
  id: number;
  title: string;
  amount: number;
  due_date: string;
  status: string;
  paid_date?: string;
  payment_method?: string;
  receipt_no?: string;
}

export interface BillingResponse {
  bills: Bill[];
  total_due: number;
}

export interface Milestone {
  id: number;
  milestone_name: string;
  status: string;
  completed_date?: string;
  teacher_comments?: string;
}

export interface MilestoneGroup {
  Cognitive: Milestone[];
  Physical: Milestone[];
  Emotional: Milestone[];
}

export interface LeaveRequest {
  id: number;
  start_date: string;
  end_date: string;
  reason: string;
  status: string;
  created_at: string;
}

@Injectable({
  providedIn: 'root'
})
export class ParentService {
  constructor(private apiService: ApiService) {}

  getBilling(): Observable<BillingResponse> {
    return this.apiService.get<BillingResponse>('/parent/billing');
  }

  payBill(billId: number, paymentMethod: string): Observable<any> {
    return this.apiService.post<any>(`/parent/billing/${billId}/pay`, { payment_method: paymentMethod });
  }

  createRazorpayOrder(billId: number): Observable<any> {
    return this.apiService.post<any>(`/parent/billing/${billId}/razorpay-order`, {});
  }

  verifyRazorpayPayment(billId: number, payload: any): Observable<any> {
    return this.apiService.post<any>(`/parent/billing/${billId}/razorpay-verify`, payload);
  }

  getMilestones(): Observable<MilestoneGroup> {
    return this.apiService.get<MilestoneGroup>('/parent/milestones');
  }

  getLeaves(): Observable<LeaveRequest[]> {
    return this.apiService.get<LeaveRequest[]>('/parent/leaves');
  }

  submitLeave(startDate: string, endDate: string, reason: string): Observable<any> {
    return this.apiService.post<any>('/parent/leaves', {
      start_date: startDate,
      end_date: endDate,
      reason: reason
    });
  }
}
