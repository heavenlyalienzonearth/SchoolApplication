import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

export interface StationaryItem {
  id: number;
  name: string;
  description?: string;
  category: string;
  price: number;
  stock: number;
  is_active: boolean;
  created_at: string;
}

export interface StationaryOrderItem {
  item_id: number;
  quantity: number;
}

export interface StationaryOrderItemResponse {
  id: number;
  item_id: number;
  quantity: number;
  unit_price: number;
  item?: StationaryItem;
  name?: string;
}

export interface StationaryOrder {
  id: number;
  student_name?: string;
  class_name?: string;
  order_date: string;
  status: string; // Pending, Dispatched, Delivered
  payment_status?: string; // Unpaid, Paid
  reimbursement_status?: string; // None, Pending, Approved, Rejected
  total_price: number;
  created_by_id: number;
  created_by?: any;
  items: StationaryOrderItemResponse[];
}

@Injectable({
  providedIn: 'root'
})
export class StationaryService {
  constructor(private apiService: ApiService) {}

  getItems(): Observable<StationaryItem[]> {
    return this.apiService.get<StationaryItem[]>('/stationary/items');
  }

  createItem(item: Partial<StationaryItem>): Observable<StationaryItem> {
    return this.apiService.post<StationaryItem>('/stationary/items', item);
  }

  updateItem(itemId: number, item: Partial<StationaryItem>): Observable<StationaryItem> {
    return this.apiService.put<StationaryItem>(`/stationary/items/${itemId}`, item);
  }

  deleteItem(itemId: number): Observable<any> {
    return this.apiService.delete<any>(`/stationary/items/${itemId}`);
  }

  getOrders(): Observable<StationaryOrder[]> {
    return this.apiService.get<StationaryOrder[]>('/stationary/orders');
  }

  placeOrder(orderData: { student_name?: string; class_name?: string; items: StationaryOrderItem[] }): Observable<StationaryOrder> {
    return this.apiService.post<StationaryOrder>('/stationary/orders', orderData);
  }

  updateOrderStatus(orderId: number, status: string): Observable<StationaryOrder> {
    return this.apiService.put<StationaryOrder>(`/stationary/orders/${orderId}/status`, { status });
  }

  createStationaryOrderRazorpayOrder(orderId: number): Observable<any> {
    return this.apiService.post<any>(`/stationary/orders/${orderId}/razorpay-order`, {});
  }

  verifyStationaryOrderRazorpayPayment(orderId: number, payload: any): Observable<any> {
    return this.apiService.post<any>(`/stationary/orders/${orderId}/razorpay-verify`, payload);
  }

  requestReimbursement(orderId: number): Observable<any> {
    return this.apiService.post<any>(`/stationary/orders/${orderId}/reimburse`, {});
  }

  approveReimbursement(orderId: number): Observable<any> {
    return this.apiService.post<any>(`/stationary/orders/${orderId}/reimburse-approve`, {});
  }

  rejectReimbursement(orderId: number): Observable<any> {
    return this.apiService.post<any>(`/stationary/orders/${orderId}/reimburse-reject`, {});
  }
}
