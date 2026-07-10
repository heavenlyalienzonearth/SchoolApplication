import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ApiService } from '../../core/services/api.service';

@Component({
  selector: 'app-parent-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="parent-dashboard-wrapper">
      <!-- Top Navigation Header -->
      <header class="dashboard-header">
        <div class="header-logo">
          <span class="logo-icon">🦘</span>
          <div class="logo-text">
            <h1>Kangaroo Kids</h1>
            <p>Parent Portal</p>
          </div>
        </div>
        
        <div class="user-profile-menu">
          <span class="welcome-user">👋 Welcome, {{ parentName }}</span>
          <button class="btn-logout" (click)="onLogout()">
            🚪 Sign Out
          </button>
        </div>
      </header>

      <!-- Error Alerts -->
      <div class="alert alert-danger" *ngIf="errorMessage" style="margin: 20px auto; max-width: 1200px;">
        ⚠️ {{ errorMessage }}
      </div>

      <!-- Loading State -->
      <div class="loading-container" *ngIf="loading">
        <div class="spinner"></div>
        <p>Retrieving kid's portal data...</p>
      </div>

      <!-- Main Portal Layout -->
      <main class="dashboard-main" *ngIf="!loading && dashboardData">
        <!-- Welcome Header Banner -->
        <div class="welcome-banner">
          <h2>Welcome Back!</h2>
          <p>Here is a summary of <strong>{{ dashboardData.kid?.name }}'s</strong> school profile, daily schedule, and attendance record.</p>
        </div>

        <div class="dashboard-grid">
          <!-- Left Column: Kid Profile & Attendance -->
          <div class="col-left">
            <!-- Kid Profile Card -->
            <div class="card kid-card animate-fade-in">
              <div class="kid-header">
                <div class="avatar-wrapper">
                  <img [src]="dashboardData.kid?.photo_url ? 'http://localhost:8000' + dashboardData.kid.photo_url : 'assets/parent_avatar1_1783324784413.png'" alt="Kid Photo" class="kid-photo" (error)="onImgError($event)" />
                </div>
                <div class="kid-intro">
                  <span class="badge badge-program">{{ dashboardData.kid?.program_title }}</span>
                  <h3>{{ dashboardData.kid?.name }}</h3>
                  <p class="dob">🎂 DOB: {{ dashboardData.kid?.dob }}</p>
                </div>
              </div>
              
              <div class="kid-details">
                <div class="detail-row">
                  <span class="label">🩸 Blood Group</span>
                  <span class="value">{{ dashboardData.kid?.blood_group }}</span>
                </div>
                <div class="detail-row">
                  <span class="label">⚠️ Food Allergies</span>
                  <span class="value alert-allergies">{{ dashboardData.kid?.allergies }}</span>
                </div>
                <div class="detail-row">
                  <span class="label">📞 Emergency Contact</span>
                  <span class="value">{{ dashboardData.kid?.emergency_phone }}</span>
                </div>
              </div>
            </div>

            <!-- Attendance Stats Card -->
            <div class="card attendance-card animate-fade-in" style="margin-top: 30px;">
              <h3 class="card-title">📅 Attendance Track</h3>
              
              <div class="attendance-summary">
                <!-- Circular Dial -->
                <div class="dial-container">
                  <div class="radial-progress" [style.--percent]="dashboardData.attendance?.percentage">
                    <span class="percent-val">{{ dashboardData.attendance?.percentage }}%</span>
                  </div>
                </div>
                
                <div class="attendance-stats">
                  <div class="stat-box">
                    <span class="stat-count">{{ dashboardData.attendance?.present }}</span>
                    <span class="stat-label">Days Present</span>
                  </div>
                  <div class="stat-box">
                    <span class="stat-count">{{ dashboardData.attendance?.total - dashboardData.attendance?.present }}</span>
                    <span class="stat-label">Days Absent</span>
                  </div>
                </div>
              </div>

              <!-- Recent Logs -->
              <div class="attendance-history">
                <h4>Recent Attendance Records</h4>
                <div class="history-list">
                  <div class="history-item" *ngFor="let rec of dashboardData.attendance?.records">
                    <span class="history-date">{{ rec.date | date:'mediumDate' }}</span>
                    <span class="badge" [ngClass]="{
                      'badge-present': rec.status.toUpperCase() === 'PRESENT',
                      'badge-absent': rec.status.toUpperCase() === 'ABSENT',
                      'badge-late': rec.status.toUpperCase() === 'LATE'
                    }">{{ rec.status }}</span>
                    <span class="history-notes" *ngIf="rec.notes">({{ rec.notes }})</span>
                  </div>
                  <div *ngIf="dashboardData.attendance?.records?.length === 0" class="no-records">
                    No attendance records logged yet.
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Right Column: Timetable, Checklists & Orders -->
          <div class="col-right">
            <!-- Timetable & Breakfast Menu Card -->
            <div class="card timetable-card animate-fade-in">
              <h3 class="card-title">🍳 Daily Timetable & Breakfast Menu</h3>
              <p class="subtitle" style="margin-top: -15px; margin-bottom: 20px; font-size: 0.85rem; color: #64748B;">Weekly day-wise learning activity and nutrition tracker.</p>
              
              <div class="timetable-wrapper" style="overflow-x: auto;">
                <table class="timetable-table">
                  <thead>
                    <tr>
                      <th>Day</th>
                      <th>📖 Study & Mindset</th>
                      <th>🏃 Physical Play</th>
                      <th>🤖 Games / Robotics</th>
                      <th>🥞 Breakfast Menu</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr *ngFor="let day of getDaysKeys()">
                      <td class="day-cell"><strong>{{ day }}</strong></td>
                      <td>{{ dashboardData.weekly_plan?.[day]?.study || '--' }}</td>
                      <td>{{ dashboardData.weekly_plan?.[day]?.physical || '--' }}</td>
                      <td>{{ dashboardData.weekly_plan?.[day]?.games || '--' }}</td>
                      <td class="breakfast-cell">🥞 {{ dashboardData.weekly_plan?.[day]?.breakfast || '--' }}</td>
                    </tr>
                    <tr *ngIf="!dashboardData.weekly_plan">
                      <td colspan="5" class="no-records" style="text-align: center; padding: 20px;">No weekly plan scheduled for this program.</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <!-- Checklists & Orders Row -->
            <div class="checklists-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-top: 30px;">
              <!-- Vaccination & Issued Items Card -->
              <div class="card checklist-card animate-fade-in">
                <h3 class="card-title">🩺 Health & Uniform Kit</h3>
                
                <!-- Vaccinations -->
                <div class="checklist-section">
                  <h4>Vaccinations Checklist</h4>
                  <div class="checklist-list" style="max-height: 160px; overflow-y: auto; padding-right: 5px;">
                    <div class="checklist-item done" *ngFor="let vac of dashboardData.vaccinations">
                      <span class="check-icon">✓</span>
                      <div>
                        <strong style="color: #1E293B; font-size: 0.85rem;">{{ vac.vaccination_name }}</strong>
                        <span style="display: block; font-size: 0.75rem; color: #64748B;">Administered: {{ vac.administered_date | date:'mediumDate' }}</span>
                      </div>
                    </div>
                    <div *ngIf="dashboardData.vaccinations?.length === 0" class="no-records">
                      No vaccination records logged.
                    </div>
                  </div>
                </div>

                <!-- Issued Uniforms -->
                <div class="checklist-section" style="margin-top: 20px;">
                  <h4>Issued Supplies & Uniforms</h4>
                  <div class="supplies-tags">
                    <span class="supply-tag" *ngFor="let item of dashboardData.issued_items">
                      👕 {{ item }}
                    </span>
                    <div *ngIf="dashboardData.issued_items?.length === 0" class="no-records">
                      No uniforms/supplies checked off.
                    </div>
                  </div>
                </div>
              </div>

              <!-- Stationery Orders Card -->
              <div class="card orders-card animate-fade-in">
                <h3 class="card-title">✏️ Supplies Order History</h3>
                
                <div class="orders-timeline" style="max-height: 380px; overflow-y: auto; padding-right: 5px;">
                  <div class="order-box" *ngFor="let order of dashboardData.stationary_orders">
                    <div class="order-hdr">
                      <span class="order-id">Order #{{ order.id }}</span>
                      <span class="badge" [ngClass]="{
                        'badge-pending': order.status.toUpperCase() === 'PENDING',
                        'badge-dispatched': order.status.toUpperCase() === 'DISPATCHED',
                        'badge-delivered': order.status.toUpperCase() === 'DELIVERED'
                      }">{{ order.status }}</span>
                    </div>
                    
                    <div class="order-items-list">
                      <div class="order-item-row" *ngFor="let item of order.items">
                        <span>{{ item.name }} × {{ item.quantity }}</span>
                        <span>₹{{ item.unit_price * item.quantity }}</span>
                      </div>
                    </div>

                    <div class="order-footer">
                      <span class="order-date">{{ order.order_date | date:'short' }}</span>
                      <span class="order-total">Total: ₹{{ order.total_price }}</span>
                    </div>
                  </div>

                  <div *ngIf="dashboardData.stationary_orders?.length === 0" class="no-records" style="padding: 40px 0;">
                    No stationery orders placed yet for {{ dashboardData.kid?.name }}.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  `,
  styles: [`
    .parent-dashboard-wrapper {
      min-height: 100vh;
      background-color: #F8FAFC;
      font-family: 'Outfit', sans-serif;
      color: #1E293B;
      padding-bottom: 50px;
    }

    .dashboard-header {
      background: white;
      border-bottom: 1px solid #E2E8F0;
      padding: 15px 40px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      box-shadow: 0 1px 3px rgba(0,0,0,0.02);
    }

    .header-logo {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .logo-icon {
      font-size: 2.2rem;
    }

    .logo-text h1 {
      margin: 0;
      font-size: 1.3rem;
      font-weight: 800;
      color: #EE5A24; /* primary */
      line-height: 1.1;
    }

    .logo-text p {
      margin: 2px 0 0 0;
      font-size: 0.8rem;
      color: #64748B;
      font-weight: 600;
      letter-spacing: 0.5px;
    }

    .user-profile-menu {
      display: flex;
      align-items: center;
      gap: 20px;
    }

    .welcome-user {
      font-weight: 700;
      color: #475569;
      font-size: 0.95rem;
    }

    .btn-logout {
      background: #F1F5F9;
      border: 1px solid #E2E8F0;
      color: #475569;
      font-weight: 700;
      padding: 8px 16px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 0.85rem;
      transition: all 0.2s;
    }

    .btn-logout:hover {
      background: #E2E8F0;
      color: #1E293B;
    }

    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 350px;
      color: #64748B;
    }

    .spinner {
      border: 4px solid #E2E8F0;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      border-left-color: #EE5A24;
      animation: spin 1s linear infinite;
      margin-bottom: 15px;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .dashboard-main {
      max-width: 1280px;
      margin: 30px auto;
      padding: 0 20px;
    }

    .welcome-banner {
      background: linear-gradient(135deg, #FFEDD5 0%, #FEE2E2 100%);
      border-radius: 12px;
      padding: 24px 30px;
      margin-bottom: 30px;
      box-shadow: 0 4px 6px rgba(238, 90, 36, 0.03);
    }

    .welcome-banner h2 {
      margin: 0;
      color: #9A3412;
      font-size: 1.6rem;
      font-weight: 800;
    }

    .welcome-banner p {
      margin: 6px 0 0 0;
      color: #475569;
      font-size: 0.95rem;
      line-height: 1.5;
    }

    .dashboard-grid {
      display: grid;
      grid-template-columns: 1fr 2fr;
      gap: 30px;
      align-items: start;
    }

    .card {
      background: white;
      border-radius: 12px;
      border: 1px solid #E2E8F0;
      padding: 25px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.02);
    }

    .card-title {
      margin-top: 0;
      color: #1E293B;
      font-size: 1.15rem;
      font-weight: 800;
      border-bottom: 1px solid #F1F5F9;
      padding-bottom: 12px;
      margin-bottom: 20px;
    }

    /* Kid Profile Card */
    .kid-card {
      padding: 30px 25px;
      background: white;
    }

    .kid-header {
      display: flex;
      align-items: center;
      gap: 20px;
      margin-bottom: 25px;
    }

    .avatar-wrapper {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      overflow: hidden;
      border: 3px solid #FFEDD5;
      background: #FAFAFA;
    }

    .kid-photo {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .kid-intro h3 {
      margin: 4px 0;
      font-size: 1.35rem;
      font-weight: 800;
      color: #1E293B;
    }

    .badge-program {
      background-color: #EE5A24;
      color: white;
      font-size: 0.75rem;
      font-weight: 700;
      padding: 3px 8px;
      border-radius: 4px;
      display: inline-block;
    }

    .dob {
      margin: 0;
      font-size: 0.85rem;
      color: #64748B;
      font-weight: 600;
    }

    .kid-details {
      display: flex;
      flex-direction: column;
      gap: 15px;
      border-top: 1px dashed #E2E8F0;
      padding-top: 20px;
    }

    .detail-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 0.9rem;
    }

    .detail-row .label {
      color: #64748B;
      font-weight: 600;
    }

    .detail-row .value {
      font-weight: 700;
      color: #1E293B;
    }

    .alert-allergies {
      color: #DC2626 !important;
      background-color: #FEF2F2;
      padding: 2px 6px;
      border-radius: 4px;
      max-width: 180px;
      text-align: right;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    /* Attendance Card */
    .attendance-summary {
      display: flex;
      align-items: center;
      justify-content: space-around;
      margin-bottom: 25px;
      padding: 15px 0;
      border-bottom: 1px dashed #F1F5F9;
    }

    /* Radial Progress bar custom CSS */
    .radial-progress {
      position: relative;
      width: 90px;
      height: 90px;
      border-radius: 50%;
      background: radial-gradient(closest-side, white 79%, transparent 80% 100%),
                  conic-gradient(#10B981 calc(var(--percent) * 1%), #E2E8F0 0);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .percent-val {
      font-size: 1.15rem;
      font-weight: 800;
      color: #065F46;
    }

    .attendance-stats {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .stat-box {
      display: flex;
      flex-direction: column;
    }

    .stat-count {
      font-size: 1.3rem;
      font-weight: 800;
      color: #1E293B;
      line-height: 1.1;
    }

    .stat-label {
      font-size: 0.75rem;
      color: #64748B;
      font-weight: 600;
    }

    .attendance-history h4 {
      margin: 0 0 12px 0;
      font-size: 0.9rem;
      font-weight: 700;
      color: #475569;
    }

    .history-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
      max-height: 220px;
      overflow-y: auto;
    }

    .history-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 8px 12px;
      background: #F8FAFC;
      border-radius: 6px;
      font-size: 0.85rem;
    }

    .history-date {
      font-weight: 600;
      color: #475569;
    }

    .history-notes {
      font-size: 0.75rem;
      color: #64748B;
      font-style: italic;
    }

    .badge {
      font-size: 0.75rem;
      font-weight: 700;
      padding: 2px 6px;
      border-radius: 4px;
    }

    .badge-present {
      background: #D1FAE5;
      color: #065F46;
    }

    .badge-absent {
      background: #FEE2E2;
      color: #991B1B;
    }

    .badge-late {
      background: #FEF3C7;
      color: #92400E;
    }

    .no-records {
      text-align: center;
      color: #94A3B8;
      font-size: 0.85rem;
      font-style: italic;
      padding: 15px 0;
    }

    /* Timetable Table Styles */
    .timetable-table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
      font-size: 0.85rem;
    }

    .timetable-table th {
      background: #F8FAFC;
      padding: 10px 12px;
      font-weight: 700;
      color: #475569;
      border-bottom: 2px solid #E2E8F0;
    }

    .timetable-table td {
      padding: 12px;
      border-bottom: 1px solid #F1F5F9;
      line-height: 1.4;
      vertical-align: top;
    }

    .day-cell {
      background: #F8FAFC;
      font-weight: 700;
      color: #1E293B;
      width: 100px;
    }

    .breakfast-cell {
      font-weight: 700;
      color: #B45309;
      background-color: #FFFBEB;
    }

    /* Checklist Roster */
    .checklist-section h4 {
      margin: 0 0 10px 0;
      font-size: 0.85rem;
      font-weight: 700;
      color: #475569;
      border-left: 3px solid #EE5A24;
      padding-left: 8px;
    }

    .checklist-list {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .checklist-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 6px 10px;
      background: #F8FAFC;
      border-radius: 6px;
    }

    .checklist-item.done .check-icon {
      color: #10B981;
      font-weight: 800;
      font-size: 1rem;
    }

    .supplies-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .supply-tag {
      background: #E0F2FE;
      color: #0369A1;
      font-weight: 700;
      font-size: 0.75rem;
      padding: 4px 8px;
      border-radius: 4px;
    }

    /* Orders History Timeline */
    .order-box {
      border: 1px solid #E2E8F0;
      border-radius: 8px;
      background: #FAFAFA;
      padding: 12px;
      margin-bottom: 12px;
      font-size: 0.8rem;
    }

    .order-hdr {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }

    .order-id {
      font-weight: 700;
      color: #EE5A24;
    }

    .badge-pending {
      background: #FEF3C7;
      color: #92400E;
    }

    .badge-dispatched {
      background: #E0F2FE;
      color: #0369A1;
    }

    .badge-delivered {
      background: #D1FAE5;
      color: #065F46;
    }

    .order-items-list {
      border-top: 1px solid #E2E8F0;
      padding-top: 6px;
      margin-bottom: 8px;
    }

    .order-item-row {
      display: flex;
      justify-content: space-between;
      color: #475569;
      margin-bottom: 2px;
    }

    .order-footer {
      border-top: 1px dashed #E2E8F0;
      padding-top: 6px;
      display: flex;
      justify-content: space-between;
      font-weight: 700;
      color: #1E293B;
    }

    .order-date {
      font-weight: 600;
      color: #64748B;
      font-size: 0.75rem;
    }

    .alert {
      padding: 12px;
      border-radius: 6px;
      font-size: 0.9rem;
      font-weight: 600;
    }

    .alert-danger {
      background-color: #FEE2E2;
      color: #991B1B;
      border: 1px solid #FCA5A5;
    }

    /* Animations */
    .animate-fade-in {
      animation: fadeIn 0.4s ease-out;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `]
})
export class ParentDashboardComponent implements OnInit {
  parentName = '';
  loading = true;
  errorMessage = '';
  dashboardData: any = null;

  constructor(
    private authService: AuthService,
    private apiService: ApiService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const user = this.authService.currentUserValue;
    if (!user || user.role?.toUpperCase() !== 'PARENT') {
      this.router.navigate(['/admin/login']);
      return;
    }
    
    this.parentName = user.full_name || 'Parent';
    this.loadDashboardData();
  }

  loadDashboardData(): void {
    this.loading = true;
    this.errorMessage = '';
    
    this.apiService.get<any>('/parent/dashboard').subscribe({
      next: (data) => {
        this.dashboardData = data;
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err.error?.detail || 'Failed to retrieve portal dashboard details.';
      }
    });
  }

  getDaysKeys(): string[] {
    if (!this.dashboardData?.weekly_plan) return [];
    return Object.keys(this.dashboardData.weekly_plan);
  }

  onImgError(event: any): void {
    event.target.src = 'assets/parent_avatar1_1783324784413.png';
  }

  onLogout(): void {
    this.authService.logout();
    this.router.navigate(['/admin/login']);
  }
}
