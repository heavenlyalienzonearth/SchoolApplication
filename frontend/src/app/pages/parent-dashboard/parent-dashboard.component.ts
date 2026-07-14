import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ApiService } from '../../core/services/api.service';
import { ParentService, Bill, Milestone, MilestoneGroup, LeaveRequest } from '../../core/services/parent.service';
import { MomentsService, StudentMoment } from '../../core/services/moments.service';
import { ContentService } from '../../core/services/content.service';

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
            <h1>Vidyankuram Kids</h1>
            <p>Parent Portal</p>
          </div>
        </div>
        
        <div class="user-profile-menu">
          <span class="welcome-user">👋 Welcome, {{ parentName }}</span>
          <button class="btn-logout" (click)="onLogout()">
            Sign Out
          </button>
        </div>
      </header>

      <!-- Subheader Tabs Bar -->
      <div class="tabs-bar-container">
        <div class="tabs-bar">
          <button class="tab-btn" [class.active]="activeTab === 'overview'" (click)="setTab('overview')">
            📋 Portal Overview
          </button>
          <button class="tab-btn" [class.active]="activeTab === 'billing'" (click)="setTab('billing')">
            💳 Fees & Ledger
          </button>
          <button class="tab-btn" [class.active]="activeTab === 'milestones'" (click)="setTab('milestones')">
            🎯 Milestones Tracker
          </button>
          <button class="tab-btn" [class.active]="activeTab === 'leaves'" (click)="setTab('leaves')">
            📅 Absence Requests
          </button>
          <button class="tab-btn" [class.active]="activeTab === 'calendar'" (click)="setTab('calendar')">
            🗓️ School Calendar
          </button>
        </div>
      </div>

      <!-- Alert banners -->
      <div class="alert alert-danger" *ngIf="errorMessage" style="margin: 20px auto; max-width: 1200px;">
        ⚠️ {{ errorMessage }}
      </div>
      <div class="alert alert-success" *ngIf="successMessage" style="margin: 20px auto; max-width: 1200px;">
        ✨ {{ successMessage }}
      </div>

      <!-- Loading State -->
      <div class="loading-container" *ngIf="loading">
        <div class="spinner"></div>
        <p>Retrieving kid's portal data...</p>
      </div>

      <!-- Main Portal Layout -->
      <main class="dashboard-main" *ngIf="!loading && dashboardData">

        <!-- 1. OVERVIEW TAB -->
        <div *ngIf="activeTab === 'overview'" class="tab-content animate-fade-in">
          <div class="welcome-banner">
            <h2>Welcome Back!</h2>
            <p>Here is a summary of <strong>{{ dashboardData.kid?.name }}'s</strong> school profile, daily schedule, and attendance record.</p>
          </div>

          <div class="dashboard-grid">
            <!-- Left Column: Kid Profile & Attendance -->
            <div class="col-left">
              <!-- Kid Profile Card -->
              <div class="card kid-card">
                <div class="kid-header">
                  <div class="avatar-wrapper">
                    <img [src]="dashboardData.kid?.photo_url ? mediaBaseUrl + dashboardData.kid.photo_url : 'assets/parent_avatar1_1783324784413.png'" alt="Kid Photo" class="kid-photo" (error)="onImgError($event)" />
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
              <div class="card attendance-card" style="margin-top: 30px;">
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
                        'badge-late': rec.status.toUpperCase() === 'LATE',
                        'badge-leave': rec.status.toUpperCase() === 'LEAVE'
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
              <!-- 📸 Daily Moments Card -->
              <div class="card moments-card" style="margin-bottom: 30px; border: 2.5px solid var(--secondary);">
                <h3 class="card-title" style="display: flex; align-items: center; justify-content: space-between;">
                  <span>📸 Daily Moments</span>
                  <button *ngIf="parentMoments.length > 0" (click)="downloadAllMoments()" class="btn btn-sm btn-secondary" style="font-size: 0.72rem; padding: 6px 10px; border: none; font-weight: 700; background: var(--secondary); color: white; border-radius: 4px; cursor: pointer;">
                    📥 Download All
                  </button>
                </h3>
                <p class="subtitle" style="margin-top: -15px; margin-bottom: 20px; font-size: 0.85rem; color: #64748B;">
                  Daily snapshots and video clips shared by class teachers. Media automatically expires after 2 days.
                </p>

                <div *ngIf="parentMomentsLoading" style="text-align: center; padding: 20px; color: #64748b;">
                  <p>Loading moments...</p>
                </div>

                <div *ngIf="!parentMomentsLoading">
                  <!-- Grid of active Moments -->
                  <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 15px;" *ngIf="parentMoments.length > 0">
                    <div *ngFor="let moment of parentMoments" style="border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; background: #f8fafc; display: flex; flex-direction: column;">
                      <div style="position: relative; background: #0f172a; height: 130px; display: flex; align-items: center; justify-content: center;">
                        <img *ngIf="moment.file_type === 'image'" [src]="mediaBaseUrl + moment.file_path" style="width: 100%; height: 100%; object-fit: cover;" />
                        <video *ngIf="moment.file_type === 'video'" [src]="mediaBaseUrl + moment.file_path" controls style="width: 100%; height: 100%; object-fit: cover;"></video>
                        
                        <span style="position: absolute; bottom: 8px; right: 8px; background: rgba(239, 68, 68, 0.95); color: white; padding: 2px 6px; border-radius: 4px; font-size: 0.65rem; font-weight: 700;">
                          ⏰ {{ moment.hours_remaining }}h left
                        </span>
                      </div>
                      <div style="padding: 10px; display: flex; flex-direction: column; justify-content: space-between; flex: 1;">
                        <div>
                          <p style="margin: 0; font-size: 0.8rem; font-weight: 700; color: #1e293b; line-height: 1.3;">{{ moment.title }}</p>
                          <span style="font-size: 0.68rem; color: #64748b; display: block; margin-top: 6px; font-weight: 600;">
                            📅 {{ moment.created_at | date:'mediumDate' }} at {{ moment.created_at | date:'shortTime' }}
                          </span>
                        </div>
                        <a [href]="mediaBaseUrl + moment.file_path" [download]="moment.title || 'moment'" target="_blank" style="margin-top: 10px; display: inline-flex; align-items: center; justify-content: center; gap: 4px; font-size: 0.72rem; font-weight: 700; color: var(--primary); text-decoration: none; padding: 5px; border: 1px solid var(--primary); border-radius: 4px; transition: all 0.2s;" onmouseover="this.style.background='var(--primary)'; this.style.color='white'" onmouseout="this.style.background='none'; this.style.color='var(--primary)'">
                          📥 Download Media
                        </a>
                      </div>
                    </div>
                  </div>

                  <div *ngIf="parentMoments.length === 0" style="text-align: center; color: #94a3b8; font-style: italic; padding: 30px; border: 2px dashed #e2e8f0; border-radius: 6px; background: #fafafa;">
                    No moments shared for today yet. Check back later!
                  </div>
                </div>
              </div>

              <!-- Timetable & Breakfast Menu Card -->
              <div class="card timetable-card">
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
                <div class="card checklist-card">
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
                <div class="card orders-card">
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
        </div>


        <!-- 2. FEES & BILLING TAB -->
        <div *ngIf="activeTab === 'billing'" class="tab-content animate-fade-in">
          <div class="billing-summary-grid">
            <div class="billing-summary-card outstanding-card">
              <span class="summary-icon">💸</span>
              <div>
                <h3>₹{{ totalOutstanding | number:'1.2-2' }}</h3>
                <p>Total Outstanding Balance</p>
              </div>
            </div>
            
            <div class="billing-summary-card count-card">
              <span class="summary-icon">📜</span>
              <div>
                <h3>{{ billsList.length }}</h3>
                <p>Total Invoiced Demands</p>
              </div>
            </div>
          </div>

          <div class="card ledger-card" style="margin-top: 30px;">
            <h3 class="card-title">🧾 Fee Demands & Payments Ledger</h3>
            <div style="overflow-x: auto;">
              <table class="ledger-table">
                <thead>
                  <tr>
                    <th>Invoice / Demand description</th>
                    <th>Amount</th>
                    <th>Due Date</th>
                    <th>Status</th>
                    <th>Paid Date</th>
                    <th>Method</th>
                    <th style="text-align: right;">Action</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let bill of billsList">
                    <td><strong>{{ bill.title }}</strong></td>
                    <td class="amount-cell">₹{{ bill.amount | number:'1.2-2' }}</td>
                    <td>{{ bill.due_date | date:'mediumDate' }}</td>
                    <td>
                      <span class="badge" [ngClass]="{
                        'badge-present': bill.status.toUpperCase() === 'PAID',
                        'badge-absent': bill.status.toUpperCase() === 'UNPAID'
                      }">{{ bill.status }}</span>
                    </td>
                    <td>{{ bill.paid_date ? (bill.paid_date | date:'mediumDate') : '--' }}</td>
                    <td>{{ bill.payment_method || '--' }}</td>
                    <td style="text-align: right;">
                      <button *ngIf="bill.status === 'Unpaid'" class="btn-action btn-pay" (click)="payWithRazorpay(bill)" [disabled]="processingPayment">
                        💳 {{ processingPayment && selectedBill?.id === bill.id ? 'Processing...' : 'Pay Now' }}
                      </button>
                      <a *ngIf="bill.status === 'Paid'" [href]="mediaBaseUrl + '/api/v1/parent/billing/' + bill.id + '/receipt'" target="_blank" class="btn-action btn-receipt">
                        🖨️ Receipt
                      </a>
                    </td>
                  </tr>
                  <tr *ngIf="billsList.length === 0">
                    <td colspan="7" class="no-records" style="text-align: center; padding: 30px;">No fee ledger entries found for this student.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>


        <!-- 3. MILESTONES TRACKER TAB -->
        <div *ngIf="activeTab === 'milestones'" class="tab-content animate-fade-in">
          <div class="milestones-intro">
            <h2>🎯 Developmental Progress Tracker</h2>
            <p>Track your child's key developmental milestones verified by the classroom supervisor.</p>
          </div>

          <div class="milestones-columns" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 20px;">
            <!-- Dynamic columns -->
            <div class="milestone-column" *ngFor="let catKey of getMilestonesCategories()">
              <div class="col-hdr" [ngClass]="{
                'cognitive-hdr': catKey === 'Cognitive',
                'physical-hdr': catKey === 'Physical',
                'emotional-hdr': catKey === 'Emotional'
              }" style="display: flex; justify-content: space-between; align-items: center; padding: 10px; border-bottom: 2px solid #e2e8f0; margin-bottom: 12px;">
                <h4 style="margin: 0; font-size: 0.9rem; font-weight: 700; color: #1e293b;">
                  {{ catKey === 'Cognitive' ? '🧠 Cognitive & Learning' : catKey === 'Physical' ? '🏃 Physical & Motor' : catKey === 'Emotional' ? '🤝 Social & Emotional' : '🎯 ' + catKey }}
                </h4>
                <span class="count-badge" style="font-size: 0.7rem; font-weight: 700; background: #e2e8f0; color: #475569; padding: 2px 6px; border-radius: 4px;">{{ getProgressString(catKey) }}</span>
              </div>
              <div class="milestone-list">
                <div class="milestone-card" *ngFor="let m of getMilestonesByCategory(catKey)" [ngClass]="m.status.toLowerCase()">
                  <div class="card-top">
                    <span class="status-indicator"></span>
                    <h5>{{ m.milestone_name }}</h5>
                  </div>
                  <p class="comments" *ngIf="m.teacher_comments">
                    <strong>Feedback:</strong> "{{ m.teacher_comments }}"
                  </p>
                  <span class="completion-date" *ngIf="m.completed_date">✓ Met on: {{ m.completed_date | date:'mediumDate' }}</span>
                </div>
                <div *ngIf="getMilestonesByCategory(catKey)?.length === 0" class="no-records">No milestones configured.</div>
              </div>
            </div>
          </div>
        </div>


        <!-- 4. LEAVE REQUESTS TAB -->
        <div *ngIf="activeTab === 'leaves'" class="tab-content animate-fade-in">
          <div class="leaves-layout">
            <!-- Left Panel: Submission Form -->
            <div class="card leave-form-card">
              <h3 class="card-title">📝 Apply for Absence Leave</h3>
              <form (submit)="onLeaveSubmit($event)" class="leave-form">
                <div class="form-group">
                  <label for="startDate">Start Date</label>
                  <input type="date" id="startDate" name="startDate" [(ngModel)]="leaveForm.startDate" required class="form-control" />
                </div>

                <div class="form-group">
                  <label for="endDate">End Date</label>
                  <input type="date" id="endDate" name="endDate" [(ngModel)]="leaveForm.endDate" required class="form-control" />
                </div>

                <div class="form-group">
                  <label for="reason">Absence Reason / medical Note</label>
                  <textarea id="reason" name="reason" [(ngModel)]="leaveForm.reason" rows="4" required placeholder="Describe the reason for leave..." class="form-control"></textarea>
                </div>

                <button type="submit" class="btn-submit-leave" [disabled]="submittingLeave">
                  {{ submittingLeave ? 'Sending request...' : '🚀 Submit Leave Request' }}
                </button>
              </form>
            </div>

            <!-- Right Panel: Leave Logs History -->
            <div class="card leave-history-card">
              <h3 class="card-title">📜 Absence Logs & status</h3>
              
              <div class="leaves-timeline">
                <div class="leave-log-box" *ngFor="let req of leavesList" style="border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; margin-bottom: 12px; background: white;">
                  <div class="log-hdr" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                    <span class="dates-range" style="font-weight: 700; font-size: 0.82rem; color: #1e293b;">📅 {{ req.start_date | date:'mediumDate' }} to {{ req.end_date | date:'mediumDate' }}</span>
                    <span class="badge" [ngClass]="{
                      'badge-present': req.status === 'Approved',
                      'badge-absent': req.status === 'Declined',
                      'badge-late': req.status === 'Pending'
                    }" style="font-weight: 700; font-size: 0.72rem; padding: 3px 8px; border-radius: 4px;">{{ req.status }}</span>
                  </div>
                  <p class="reason-txt" style="margin: 4px 0; font-size: 0.78rem; color: #475569;"><strong>Reason:</strong> {{ req.reason }}</p>
                  
                  <!-- Admin Remarks / Comment Box -->
                  <div *ngIf="req.admin_comment" style="margin-top: 8px; padding: 8px; background: #f8fafc; border-left: 3px solid var(--secondary); border-radius: 4px; font-size: 0.75rem; color: #334155; font-style: italic;">
                    <strong>Remarks:</strong> "{{ req.admin_comment }}"
                  </div>
                  
                  <span class="submitted-time" style="font-size: 0.65rem; color: #94a3b8; display: block; margin-top: 8px;">Submitted: {{ req.created_at | date:'short' }}</span>
                </div>
                <div *ngIf="leavesList.length === 0" class="no-records" style="padding: 40px 0;">
                  No leave requests submitted yet.
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 5. CALENDAR & EVENTS TAB -->
        <div *ngIf="activeTab === 'calendar'" class="tab-content animate-fade-in calendar-tab-wrapper">
          <!-- Playful Decorative Floating Elements -->
          <div class="calendar-deco cloud-1">☁️</div>
          <div class="calendar-deco cloud-2">☁️</div>
          <div class="calendar-deco balloon">🎈</div>
          <div class="calendar-deco kite">🪁</div>
          
          <div class="calendar-layout" style="position: relative; z-index: 2;">
            
            <!-- Left Panel: Calendar Grid -->
            <div class="card calendar-card">
              <div class="calendar-header">
                <button class="calendar-nav-btn" (click)="prevMonth()" title="Previous Month" style="display: flex; align-items: center; justify-content: center; width: 36px; height: 36px; padding: 0;">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                </button>
                <h3 class="calendar-title" style="letter-spacing: -0.3px;">{{ monthNames[currentMonth] }} {{ currentYear }}</h3>
                <button class="calendar-nav-btn" (click)="nextMonth()" title="Next Month" style="display: flex; align-items: center; justify-content: center; width: 36px; height: 36px; padding: 0;">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                </button>
              </div>
              
              <div class="calendar-grid">
                <!-- Weekdays Header -->
                <div class="weekday-name">Sun</div>
                <div class="weekday-name">Mon</div>
                <div class="weekday-name">Tue</div>
                <div class="weekday-name">Wed</div>
                <div class="weekday-name">Thu</div>
                <div class="weekday-name">Fri</div>
                <div class="weekday-name">Sat</div>
                
                <!-- Calendar Day Cells -->
                <div *ngFor="let day of calendarDays" 
                     class="calendar-day" 
                     [class.adjacent-month]="!day.isCurrentMonth"
                     [class.today]="day.isToday"
                     [class.selected]="selectedDateStr === day.dateStr"
                     (click)="selectDate(day.date, day.dateStr)">
                  
                  <span class="day-number">{{ day.dayNum }}</span>
                  
                  <!-- Event Indicator Dots -->
                  <div class="event-dots" *ngIf="day.events && day.events.length > 0">
                    <span *ngFor="let ev of day.events" 
                          class="event-dot" 
                          [style.background-color]="getEventCategoryColor(ev.type)"
                          [title]="ev.type + ': ' + ev.title"></span>
                  </div>
                </div>
              </div>
              
              <!-- Legend Indicator Panel -->
              <div class="calendar-legend">
                <div class="legend-item"><span class="legend-dot" style="background-color: #0652DD;"></span> School Events</div>
                <div class="legend-item"><span class="legend-dot" style="background-color: #EF4444;"></span> National Holidays</div>
                <div class="legend-item"><span class="legend-dot" style="background-color: #F97316;"></span> Vacations</div>
                <div class="legend-item"><span class="legend-dot" style="background-color: #10B981;"></span> Public Events</div>
                <div class="legend-item"><span class="legend-dot" style="background-color: #A855F7;"></span> Religious Events</div>
              </div>
            </div>
            
            <!-- Right Panel: Selected Day Details & Upcoming Events -->
            <div class="calendar-details-panel">
              <!-- Selected Day Events List -->
              <div class="card selected-day-card">
                <h4 class="details-hdr">📅 Events for {{ formatEventDate(selectedDateStr) }}</h4>
                
                <div class="selected-events-list" *ngIf="selectedDateEvents && selectedDateEvents.length > 0">
                  <div class="selected-event-item" *ngFor="let ev of selectedDateEvents">
                    <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 8px;">
                      <span class="event-badge" [ngStyle]="{
                        'background-color': ev.type === 'School Event' ? '#DBEAFE' : 
                                            ev.type === 'National Holiday' ? '#FEE2E2' : 
                                            ev.type === 'Vacation' ? '#FFEDD5' : 
                                            ev.type === 'Public Event' ? '#D1FAE5' : '#F3E8FF',
                        'color': ev.type === 'School Event' ? '#1E40AF' : 
                                 ev.type === 'National Holiday' ? '#991B1B' : 
                                 ev.type === 'Vacation' ? '#C2410C' : 
                                 ev.type === 'Public Event' ? '#065F46' : '#6B21A8'
                      }">
                        {{ ev.type }}
                      </span>
                      <span class="event-location" *ngIf="ev.location">📍 {{ ev.location }}</span>
                    </div>
                    
                    <h5 class="event-title">{{ ev.title }}</h5>
                    <p class="event-desc">{{ ev.description || 'No description provided.' }}</p>
                    
                    <div *ngIf="ev.image" class="event-image-container" style="margin-top: 10px; border-radius: 6px; overflow: hidden; max-height: 150px;">
                      <img [src]="ev.image.startsWith('http') ? ev.image : mediaBaseUrl + ev.image" alt="Event Image" style="width: 100%; height: 100%; object-fit: cover;" />
                    </div>
                  </div>
                </div>
                
                <div class="no-events-selected" *ngIf="!selectedDateEvents || selectedDateEvents.length === 0">
                  <div style="font-size: 2rem; margin-bottom: 10px; opacity: 0.5;">🍂</div>
                  <p>No events or holidays scheduled for this date.</p>
                </div>
              </div>
              
              <!-- Upcoming Events List -->
              <div class="card upcoming-events-card">
                <h4 class="details-hdr">🚀 Upcoming School Events</h4>
                
                <div class="upcoming-events-list">
                  <div class="upcoming-item" *ngFor="let ev of getUpcomingEvents()" (click)="selectUpcomingEvent(ev)">
                    <div class="upcoming-date-box" [style.border-color]="getEventCategoryColor(ev.type)">
                      <span class="upcoming-date-day">{{ ev.dateStr.split('-')[2] }}</span>
                      <span class="upcoming-date-month">{{ getMonthNameAbbreviation(ev.dateStr) }}</span>
                    </div>
                    <div class="upcoming-details">
                      <h5 class="upcoming-title">{{ ev.title }}</h5>
                      <span class="upcoming-type" [style.color]="getEventCategoryColor(ev.type)">{{ ev.type }}</span>
                    </div>
                  </div>
                  
                  <div class="no-events-selected" *ngIf="getUpcomingEvents().length === 0" style="padding: 20px;">
                    <p>No upcoming events scheduled.</p>
                  </div>
                </div>
              </div>
            </div>
            
          </div>
        </div>

      </main>

      <!-- SIMULATED RAZORPAY CHECKOUT MODAL -->
      <div class="modal-backdrop" *ngIf="showRazorpayMockModal">
        <div class="modal-card animate-fade-in" style="max-width: 420px; border-radius: 8px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.15); border: none;">
          <!-- Razorpay Blue Theme Header -->
          <div style="background-color: #0c2b64; color: white; padding: 25px 20px; display: flex; flex-direction: column; position: relative;">
            <button (click)="closeRazorpayMockModal()" style="position: absolute; top: 15px; right: 15px; background: none; border: none; color: #94a3b8; font-size: 1.5rem; cursor: pointer; line-height: 1;">×</button>
            <div style="display: flex; align-items: center; gap: 12px;">
              <span style="font-size: 1.8rem; background: rgba(255,255,255,0.15); width: 45px; height: 45px; display: flex; align-items: center; justify-content: center; border-radius: 50%;">🦘</span>
              <div>
                <h4 style="margin: 0; font-size: 1.1rem; font-weight: 800; letter-spacing: 0.3px;">Vidyankuram Kids School</h4>
                <p style="margin: 2px 0 0 0; font-size: 0.72rem; color: #3b82f6; font-weight: 700; text-transform: uppercase;">Razorpay Checkout <span style="background: #2563eb; color: white; padding: 1px 4px; border-radius: 2px; font-size: 0.6rem; margin-left: 4px;">TEST MODE</span></p>
              </div>
            </div>
          </div>
          
          <div class="modal-body" style="padding: 20px; background-color: #f8fafc;">
            <div class="bill-summary-box" style="background: white; border: 1px solid #e2e8f0; border-radius: 6px; padding: 15px; text-align: center; margin-bottom: 20px;">
              <span style="font-size: 0.75rem; color: #64748b; font-weight: 700; text-transform: uppercase;">Amount to Pay</span>
              <h2 style="font-size: 1.8rem; font-weight: 800; color: #0f172a; margin: 4px 0 0 0;">₹{{ (razorpayOrderData?.amount / 100) | number:'1.2-2' }}</h2>
              <p style="margin: 5px 0 0 0; font-size: 0.8rem; color: #475569; font-weight: 600;">{{ razorpayOrderData?.title }}</p>
            </div>
            
            <div style="background: white; border: 1px solid #e2e8f0; border-radius: 6px; padding: 15px;">
              <h5 style="margin: 0 0 10px 0; font-size: 0.75rem; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px;">Prefilled Contact</h5>
              <div style="display: flex; flex-direction: column; gap: 8px; font-size: 0.82rem; color: #334155;">
                <div style="display: flex; justify-content: space-between;"><span style="color: #64748b;">Name:</span><strong>{{ parentName }}</strong></div>
                <div style="display: flex; justify-content: space-between;"><span style="color: #64748b;">Email:</span><strong>{{ authService.currentUserValue?.email || '--' }}</strong></div>
              </div>
            </div>

            <div style="margin-top: 20px; text-align: center;">
              <span style="font-size: 0.72rem; color: #94a3b8; font-weight: 600; display: block; margin-bottom: 8px;">💳 Simulated Test Gateway</span>
              <p style="font-size: 0.72rem; color: #64748b; line-height: 1.4; margin: 0;">
                No real money will be charged. Click below to verify and complete order signature simulation.
              </p>
            </div>
          </div>

          <div class="modal-footer" style="padding: 15px 20px; background-color: white; border-top: 1px solid #f1f5f9; display: flex; gap: 10px;">
            <button class="btn-modal btn-cancel" (click)="closeRazorpayMockModal()" style="flex: 1; padding: 10px; font-weight: 700; font-size: 0.85rem; border-radius: 4px; border: 1px solid #cbd5e1; background: none; cursor: pointer;">Cancel</button>
            <button class="btn-modal btn-confirm" (click)="confirmRazorpayMockPayment()" [disabled]="processingPayment" style="flex: 2; padding: 10px; font-weight: 700; font-size: 0.85rem; border-radius: 4px; border: none; background-color: #2563eb; color: white; cursor: pointer;">
              {{ processingPayment ? 'Verifying payment...' : 'Simulate Success' }}
            </button>
          </div>
        </div>
      </div>

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
      color: #EE5A24;
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

    /* Tabs Bar styling */
    .tabs-bar-container {
      background: white;
      border-bottom: 1px solid #E2E8F0;
      padding: 0 40px;
    }

    .tabs-bar {
      display: flex;
      max-width: 1200px;
      margin: 0 auto;
      gap: 30px;
    }

    .tab-btn {
      background: none;
      border: none;
      padding: 16px 8px;
      font-size: 0.95rem;
      font-weight: 700;
      color: #64748B;
      cursor: pointer;
      position: relative;
      transition: color 0.2s;
    }

    .tab-btn:hover {
      color: #1E293B;
    }

    .tab-btn.active {
      color: #EE5A24;
    }

    .tab-btn.active::after {
      content: '';
      position: absolute;
      bottom: -1px;
      left: 0;
      right: 0;
      height: 3px;
      background: #EE5A24;
      border-radius: 3px 3px 0 0;
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

    .badge-leave {
      background: #E0F2FE;
      color: #0369A1;
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

    .alert-success {
      background-color: #D1FAE5;
      color: #065F46;
      border: 1px solid #A7F3D0;
    }

    /* Billing Tab Styling */
    .billing-summary-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 30px;
    }

    .billing-summary-card {
      background: white;
      border-radius: 12px;
      border: 1px solid #E2E8F0;
      padding: 25px;
      display: flex;
      align-items: center;
      gap: 20px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.02);
    }

    .outstanding-card {
      background: linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%);
      border-color: #FDE68A;
    }

    .outstanding-card h3 {
      color: #92400E;
      font-size: 1.8rem;
      margin: 0;
      font-weight: 800;
    }

    .outstanding-card p {
      margin: 2px 0 0 0;
      color: #B45309;
      font-size: 0.85rem;
      font-weight: 600;
    }

    .count-card h3 {
      font-size: 1.8rem;
      margin: 0;
      font-weight: 800;
      color: #1E293B;
    }

    .count-card p {
      margin: 2px 0 0 0;
      color: #64748B;
      font-size: 0.85rem;
      font-weight: 600;
    }

    .summary-icon {
      font-size: 2.2rem;
    }

    .ledger-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.9rem;
    }

    .ledger-table th {
      background: #F8FAFC;
      padding: 12px;
      font-weight: 700;
      color: #475569;
      border-bottom: 2px solid #E2E8F0;
      text-align: left;
    }

    .ledger-table td {
      padding: 14px 12px;
      border-bottom: 1px solid #F1F5F9;
    }

    .amount-cell {
      font-weight: 700;
      color: #1E293B;
    }

    .btn-action {
      border: none;
      padding: 6px 12px;
      border-radius: 4px;
      font-size: 0.8rem;
      font-weight: 700;
      cursor: pointer;
      transition: background 0.2s;
      display: inline-block;
      text-decoration: none;
    }

    .btn-pay {
      background: #EE5A24;
      color: white;
    }

    .btn-pay:hover {
      background: #EA541F;
    }

    .btn-receipt {
      background: #E2E8F0;
      color: #475569;
    }

    .btn-receipt:hover {
      background: #CBD5E1;
      color: #1E293B;
    }

    /* Milestones Tab */
    .milestones-intro {
      margin-bottom: 25px;
    }

    .milestones-intro h2 {
      margin: 0;
      font-weight: 800;
      font-size: 1.5rem;
      color: #1E293B;
    }

    .milestones-intro p {
      margin: 4px 0 0 0;
      color: #64748B;
      font-size: 0.9rem;
    }

    .milestones-columns {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 30px;
    }

    .milestone-column {
      background: white;
      border-radius: 12px;
      border: 1px solid #E2E8F0;
      overflow: hidden;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.02);
    }

    .col-hdr {
      padding: 16px 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid #E2E8F0;
    }

    .col-hdr h4 {
      margin: 0;
      font-size: 0.95rem;
      font-weight: 800;
    }

    .cognitive-hdr {
      background: #EFF6FF;
      color: #1E40AF;
    }

    .physical-hdr {
      background: #ECFDF5;
      color: #065F46;
    }

    .emotional-hdr {
      background: #FDF2F8;
      color: #9D174D;
    }

    .count-badge {
      font-size: 0.75rem;
      font-weight: 700;
      background: white;
      padding: 2px 8px;
      border-radius: 20px;
      box-shadow: 0 1px 2px rgba(0,0,0,0.05);
    }

    .milestone-list {
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 15px;
      max-height: 500px;
      overflow-y: auto;
    }

    .milestone-card {
      border: 1px solid #E2E8F0;
      border-radius: 8px;
      padding: 12px 15px;
      background: #F8FAFC;
      transition: all 0.2s;
    }

    .milestone-card.completed {
      background: #F0FDF4;
      border-color: #BBF7D0;
    }

    .milestone-card.in_progress {
      background: #FFFBEB;
      border-color: #FDE68A;
    }

    .card-top {
      display: flex;
      align-items: flex-start;
      gap: 10px;
    }

    .status-indicator {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      margin-top: 5px;
      flex-shrink: 0;
    }

    .completed .status-indicator { background: #10B981; }
    .in_progress .status-indicator { background: #F59E0B; }
    .not_started .status-indicator { background: #94A3B8; }

    .card-top h5 {
      margin: 0;
      font-size: 0.85rem;
      font-weight: 700;
      line-height: 1.3;
      color: #1E293B;
    }

    .comments {
      margin: 8px 0 0 0;
      font-size: 0.75rem;
      color: #475569;
      line-height: 1.4;
      background: rgba(255, 255, 255, 0.6);
      padding: 6px 8px;
      border-radius: 4px;
    }

    .completion-date {
      display: block;
      margin-top: 8px;
      font-size: 0.7rem;
      font-weight: 700;
      color: #059669;
    }

    /* Leaves Tab */
    .leaves-layout {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 30px;
    }

    .leave-form {
      display: flex;
      flex-direction: column;
      gap: 18px;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .form-group label {
      font-size: 0.85rem;
      font-weight: 700;
      color: #475569;
    }

    .form-control {
      border: 1px solid #CBD5E1;
      border-radius: 6px;
      padding: 10px 12px;
      font-size: 0.9rem;
      font-family: inherit;
      color: #1E293B;
      outline: none;
      transition: border-color 0.2s;
    }

    .form-control:focus {
      border-color: #EE5A24;
    }

    .btn-submit-leave {
      background: #EE5A24;
      color: white;
      border: none;
      padding: 12px;
      border-radius: 6px;
      font-weight: 700;
      font-size: 0.9rem;
      cursor: pointer;
      transition: background 0.2s;
    }

    .btn-submit-leave:hover {
      background: #EA541F;
    }

    .btn-submit-leave:disabled {
      background: #F1F5F9;
      color: #94A3B8;
      cursor: not-allowed;
    }

    .leaves-timeline {
      display: flex;
      flex-direction: column;
      gap: 15px;
      max-height: 420px;
      overflow-y: auto;
      padding-right: 5px;
    }

    .leave-log-box {
      border: 1px solid #E2E8F0;
      border-radius: 8px;
      padding: 15px;
      background: #FAFAFA;
    }

    .log-hdr {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }

    .dates-range {
      font-weight: 700;
      color: #1E293B;
      font-size: 0.85rem;
    }

    .reason-txt {
      margin: 6px 0;
      font-size: 0.8rem;
      color: #475569;
      line-height: 1.4;
    }

    .submitted-time {
      font-size: 0.7rem;
      color: #94A3B8;
      font-weight: 600;
    }

    /* Modal Backdrop & card */
    .modal-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(15, 23, 42, 0.45);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }

    .modal-card {
      background: white;
      width: 420px;
      border-radius: 12px;
      border: 1px solid #E2E8F0;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
      overflow: hidden;
    }

    .modal-header {
      padding: 16px 20px;
      background: #F8FAFC;
      border-bottom: 1px solid #E2E8F0;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .modal-header h4 {
      margin: 0;
      font-size: 0.95rem;
      font-weight: 800;
      color: #1E293B;
    }

    .btn-close {
      background: none;
      border: none;
      font-size: 1.5rem;
      color: #94A3B8;
      cursor: pointer;
      line-height: 1;
    }

    .modal-body {
      padding: 20px;
    }

    .bill-summary-box {
      text-align: center;
      background: #FFFBEB;
      border: 1px solid #FDE68A;
      padding: 15px;
      border-radius: 8px;
      margin-bottom: 20px;
    }

    .bill-title {
      margin: 0 0 5px 0;
      font-size: 0.8rem;
      color: #B45309;
      font-weight: 600;
    }

    .bill-amount {
      margin: 0;
      font-size: 1.6rem;
      font-weight: 800;
      color: #92400E;
    }

    .payment-method-selector {
      display: flex;
      flex-direction: column;
      margin-bottom: 15px;
    }

    .method-option {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 0.9rem;
      font-weight: 700;
      color: #475569;
      cursor: pointer;
    }

    .modal-input {
      width: 100%;
      border: 1px solid #CBD5E1;
      border-radius: 6px;
      padding: 10px;
      font-size: 0.85rem;
      outline: none;
      font-family: inherit;
      box-sizing: border-box;
    }

    .modal-input:focus {
      border-color: #EE5A24;
    }

    .modal-footer {
      padding: 15px 20px;
      background: #F8FAFC;
      border-top: 1px solid #E2E8F0;
      display: flex;
      justify-content: flex-end;
      gap: 12px;
    }

    .btn-modal {
      border: none;
      padding: 8px 16px;
      border-radius: 6px;
      font-weight: 700;
      font-size: 0.85rem;
      cursor: pointer;
    }

    .btn-cancel {
      background: #E2E8F0;
      color: #475569;
    }

    .btn-cancel:hover {
      background: #CBD5E1;
    }

    .btn-confirm {
      background: #10B981;
      color: white;
    }

    .btn-confirm:hover {
      background: #059669;
    }

    .btn-confirm:disabled {
      background: #E2E8F0;
      color: #94A3B8;
      cursor: not-allowed;
    }

    .animate-fade-in {
      animation: fadeIn 0.3s ease-out;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(8px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .calendar-tab-wrapper {
      position: relative;
      background: linear-gradient(135deg, #FFFDF5 0%, #F0F9FF 100%);
      padding: 30px;
      border-radius: 24px;
      border: 3px dashed #BAE6FD;
      overflow: hidden;
      box-shadow: inset 0 0 40px rgba(224, 242, 254, 0.5);
    }
    
    .calendar-deco {
      position: absolute;
      font-size: 3rem;
      opacity: 0.08;
      pointer-events: none;
      user-select: none;
      z-index: 1;
      filter: blur(0.5px);
    }
    
    .cloud-1 {
      top: 15px;
      left: 20px;
      font-size: 4rem;
      animation: floatSlow 8s ease-in-out infinite alternate;
    }
    
    .cloud-2 {
      bottom: 25px;
      right: 15%;
      font-size: 4.5rem;
      animation: floatSlow 11s ease-in-out infinite alternate-reverse;
    }
    
    .balloon {
      top: 40%;
      left: 5%;
      font-size: 3.5rem;
      animation: floatVertical 12s ease-in-out infinite;
    }
    
    .kite {
      top: 15%;
      right: 5%;
      font-size: 3.5rem;
      animation: floatSlow 10s ease-in-out infinite alternate;
    }
    
    @keyframes floatSlow {
      0% { transform: translate(0, 0) rotate(0deg); }
      100% { transform: translate(15px, -10px) rotate(3deg); }
    }
    
    @keyframes floatVertical {
      0% { transform: translateY(0) rotate(0deg); }
      50% { transform: translateY(-20px) rotate(-5deg); }
      100% { transform: translateY(0) rotate(0deg); }
    }

    /* Calendar Tab Layout */
    .calendar-layout {
      display: grid;
      grid-template-columns: 7fr 4fr;
      gap: 25px;
      margin-top: 5px;
    }
    
    .calendar-card {
      background: white;
      border-radius: 16px;
      border: 1px solid #E2E8F0;
      padding: 25px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.02);
    }
    
    .calendar-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 25px;
      padding-bottom: 15px;
      border-bottom: 1px solid #F1F5F9;
    }
    
    .calendar-title {
      font-size: 1.3rem;
      font-weight: 800;
      color: #1E293B;
      margin: 0;
    }
    
    .calendar-nav-btn {
      background: #F1F5F9;
      border: none;
      color: #475569;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      font-weight: bold;
      transition: all 0.2s ease;
    }
    
    .calendar-nav-btn:hover {
      background: var(--primary);
      color: white;
    }
    
    .calendar-grid {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      gap: 10px;
    }
    
    .weekday-name {
      text-align: center;
      font-weight: 700;
      color: #64748B;
      font-size: 0.85rem;
      padding-bottom: 10px;
      border-bottom: 2px solid #F1F5F9;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    .calendar-day {
      aspect-ratio: 1.2;
      border-radius: 12px;
      border: 1px solid #F1F5F9;
      background: #FFFFFF;
      padding: 10px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      cursor: pointer;
      transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
      position: relative;
    }
    
    .calendar-day:hover {
      border-color: var(--primary);
      box-shadow: 0 10px 20px -5px rgba(0,0,0,0.05);
      transform: translateY(-2px);
      z-index: 2;
    }
    
    .calendar-day.adjacent-month {
      background: #F8FAFC;
      opacity: 0.55;
    }
    
    .calendar-day.adjacent-month:hover {
      opacity: 0.9;
    }
    
    .calendar-day.adjacent-month .day-number {
      color: #94A3B8;
      font-weight: 500;
    }
    
    .calendar-day.today {
      background: #EFF6FF;
      border-color: #3B82F6;
      box-shadow: inset 0 0 0 1px #3B82F6;
    }
    
    .calendar-day.today .day-number {
      color: #2563EB;
      font-weight: 800;
    }
    
    .calendar-day.selected {
      background: var(--primary-light, #FFF4E5);
      border-color: var(--primary);
    }
    
    .calendar-day.selected .day-number {
      color: var(--primary);
      font-weight: 800;
    }
    
    .day-number {
      font-size: 1rem;
      font-weight: 600;
      color: #334155;
    }
    
    .event-dots {
      display: flex;
      gap: 4px;
      flex-wrap: wrap;
      margin-top: 5px;
      justify-content: center;
    }
    
    .event-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
    }
    
    .calendar-legend {
      display: flex;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 12px;
      margin-top: 25px;
      padding-top: 20px;
      border-top: 1px solid #F1F5F9;
    }
    
    .legend-item {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 0.82rem;
      font-weight: 600;
      color: #475569;
    }
    
    .legend-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      display: inline-block;
    }
    
    /* Details Panel Column */
    .calendar-details-panel {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }
    
    .selected-day-card {
      background: white;
      border-radius: 16px;
      border: 1px solid #E2E8F0;
      padding: 25px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.02);
      flex: 1;
      min-height: 250px;
      display: flex;
      flex-direction: column;
    }
    
    .details-hdr {
      font-size: 1.05rem;
      font-weight: 800;
      color: #1E293B;
      margin-top: 0;
      margin-bottom: 20px;
      border-bottom: 1px solid #F1F5F9;
      padding-bottom: 12px;
    }
    
    .selected-events-list {
      display: flex;
      flex-direction: column;
      gap: 15px;
      overflow-y: auto;
      max-height: 350px;
      padding-right: 5px;
    }
    
    .selected-event-item {
      border: 1px solid #E2E8F0;
      border-radius: 12px;
      padding: 15px;
      background: #F8FAFC;
    }
    
    .event-badge {
      font-size: 0.72rem;
      font-weight: 700;
      padding: 4px 10px;
      border-radius: 20px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    .event-location {
      font-size: 0.75rem;
      color: #64748B;
      font-weight: 600;
    }
    
    .event-title {
      font-size: 1.05rem;
      font-weight: 700;
      color: #1E293B;
      margin: 10px 0 6px 0;
    }
    
    .event-desc {
      font-size: 0.85rem;
      color: #475569;
      margin: 0;
      line-height: 1.5;
    }
    
    .no-events-selected {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      flex: 1;
      color: #64748B;
      font-size: 0.9rem;
      font-weight: 600;
      text-align: center;
      padding: 20px 0;
    }
    
    /* Upcoming Events Panel */
    .upcoming-events-card {
      background: white;
      border-radius: 16px;
      border: 1px solid #E2E8F0;
      padding: 25px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.02);
    }
    
    .upcoming-events-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    
    .upcoming-item {
      display: flex;
      align-items: center;
      gap: 15px;
      padding: 10px;
      border-radius: 12px;
      border: 1px solid #F1F5F9;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    
    .upcoming-item:hover {
      background: #F8FAFC;
      border-color: var(--primary);
    }
    
    .upcoming-date-box {
      width: 50px;
      height: 50px;
      border-radius: 10px;
      border: 2px solid #E2E8F0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background: white;
      flex-shrink: 0;
    }
    
    .upcoming-date-day {
      font-size: 1.1rem;
      font-weight: 800;
      color: #1E293B;
      line-height: 1;
    }
    
    .upcoming-date-month {
      font-size: 0.65rem;
      font-weight: 700;
      color: #64748B;
      text-transform: uppercase;
    }
    
    .upcoming-details {
      flex: 1;
      min-width: 0;
    }
    
    .upcoming-title {
      font-size: 0.88rem;
      font-weight: 700;
      color: #1E293B;
      margin: 0 0 2px 0;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    
    .upcoming-type {
      font-size: 0.72rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }
  `]
})
export class ParentDashboardComponent implements OnInit {
  mediaBaseUrl = window.location.hostname === 'localhost' ? 'http://localhost:8000' : '';
  parentName = '';
  loading = true;
  errorMessage = '';
  successMessage = '';
  dashboardData: any = null;
  activeTab = 'overview';

  // Billing State
  billsList: Bill[] = [];
  totalOutstanding = 0;
  showPaymentModal = false;
  selectedBill: Bill | null = null;
  payMethod = 'Online';
  processingPayment = false;

  // Razorpay Integration State
  razorpayScriptLoaded = false;
  showRazorpayMockModal = false;
  razorpayOrderData: any = null;

  // Milestones State
  milestonesGroup: MilestoneGroup | null = null;

  // Leave State
  leavesList: LeaveRequest[] = [];
  submittingLeave = false;
  leaveForm = {
    startDate: '',
    endDate: '',
    reason: ''
  };

  // Parent Moments State
  parentMoments: StudentMoment[] = [];
  parentMomentsLoading = false;

  // Calendar & Events State
  eventsList: any[] = [];
  holidaysList: any[] = [];
  allCalendarEvents: any[] = [];
  calendarEventsLoading = false;
  currentMonth: number = new Date().getMonth();
  currentYear: number = new Date().getFullYear();
  calendarDays: any[] = [];
  monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  selectedDateEvents: any[] = [];
  selectedDateStr: string = '';
  selectedDate: Date = new Date();

  constructor(
    public authService: AuthService,
    private apiService: ApiService,
    private parentService: ParentService,
    private router: Router,
    private momentsService: MomentsService,
    private contentService: ContentService
  ) {}

  ngOnInit(): void {
    const user = this.authService.currentUserValue;
    if (!user || user.role?.toUpperCase() !== 'PARENT') {
      this.router.navigate(['/admin/login']);
      return;
    }
    
    this.parentName = user.full_name || 'Parent';
    this.loadDashboardData();
    this.loadParentMoments();
    this.loadRazorpayScript().then(() => {
      this.razorpayScriptLoaded = true;
    });
  }

  loadRazorpayScript(): Promise<void> {
    return new Promise((resolve) => {
      if ((window as any).Razorpay) {
        resolve();
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve();
      script.onerror = () => {
        console.error('Failed to load Razorpay Checkout script');
        resolve();
      };
      document.body.appendChild(script);
    });
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

  setTab(tab: string): void {
    this.activeTab = tab;
    this.errorMessage = '';
    this.successMessage = '';

    if (tab === 'billing') {
      this.loadBilling();
    } else if (tab === 'milestones') {
      this.loadMilestones();
    } else if (tab === 'leaves') {
      this.loadLeaves();
    } else if (tab === 'calendar') {
      this.loadCalendarData();
    } else if (tab === 'overview') {
      this.loadDashboardData();
    }
  }

  // --- BILLING LEDGER ---
  loadBilling(): void {
    this.parentService.getBilling().subscribe({
      next: (res) => {
        this.billsList = res.bills;
        this.totalOutstanding = res.total_due;
      },
      error: (err) => {
        this.errorMessage = err.error?.detail || 'Failed to load billing ledger.';
      }
    });
  }

  payWithRazorpay(bill: Bill): void {
    this.selectedBill = bill;
    this.processingPayment = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.parentService.createRazorpayOrder(bill.id).subscribe({
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
              this.verifyRazorpayPayment(bill.id, {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                is_mock: false
              });
            },
            prefill: {
              name: this.parentName,
              email: this.authService.currentUserValue?.email || ''
            },
            theme: {
              color: "#EE5A24"
            }
          };
          const rzp = new (window as any).Razorpay(options);
          rzp.open();
        }
      },
      error: (err) => {
        this.processingPayment = false;
        this.errorMessage = err.error?.detail || 'Failed to initialize payment gateway checkout.';
      }
    });
  }

  verifyRazorpayPayment(billId: number, payload: any): void {
    this.processingPayment = true;
    this.errorMessage = '';
    this.parentService.verifyRazorpayPayment(billId, payload).subscribe({
      next: (res) => {
        this.processingPayment = false;
        this.showRazorpayMockModal = false;
        this.selectedBill = null;
        this.razorpayOrderData = null;
        this.successMessage = res.message || 'Payment processed successfully!';
        this.loadBilling();
        this.loadDashboardData();
        setTimeout(() => this.successMessage = '', 5000);
      },
      error: (err) => {
        this.processingPayment = false;
        this.showRazorpayMockModal = false;
        this.selectedBill = null;
        this.razorpayOrderData = null;
        this.errorMessage = err.error?.detail || 'Razorpay payment verification failed.';
      }
    });
  }

  confirmRazorpayMockPayment(): void {
    if (!this.razorpayOrderData) return;
    this.verifyRazorpayPayment(this.razorpayOrderData.bill_id, {
      is_mock: true
    });
  }

  closeRazorpayMockModal(): void {
    this.showRazorpayMockModal = false;
    this.selectedBill = null;
    this.razorpayOrderData = null;
  }

  // --- MILESTONES ---
  loadMilestones(): void {
    this.parentService.getMilestones().subscribe({
      next: (res) => {
        this.milestonesGroup = res;
      },
      error: (err) => {
        this.errorMessage = err.error?.detail || 'Failed to retrieve progress milestones.';
      }
    });
  }

  getProgressString(category: string): string {
    if (!this.milestonesGroup) return '0/0';
    const list = (this.milestonesGroup as any)[category] || [];
    const completed = list.filter((m: any) => m.status.toUpperCase() === 'COMPLETED').length;
    return `${completed}/${list.length} Met`;
  }

  // --- LEAVE OF ABSENCE ---
  loadLeaves(): void {
    this.parentService.getLeaves().subscribe({
      next: (res) => {
        this.leavesList = res;
      },
      error: (err) => {
        this.errorMessage = err.error?.detail || 'Failed to load leave history log.';
      }
    });
  }

  onLeaveSubmit(event: Event): void {
    event.preventDefault();
    if (!this.leaveForm.startDate || !this.leaveForm.endDate || !this.leaveForm.reason) {
      this.errorMessage = 'Please complete all form fields.';
      return;
    }
    
    this.submittingLeave = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.parentService.submitLeave(
      this.leaveForm.startDate,
      this.leaveForm.endDate,
      this.leaveForm.reason
    ).subscribe({
      next: () => {
        this.submittingLeave = false;
        this.successMessage = 'Leave request submitted and auto-marked successfully!';
        this.leaveForm = { startDate: '', endDate: '', reason: '' };
        this.loadLeaves();
        setTimeout(() => this.successMessage = '', 4000);
      },
      error: (err) => {
        this.submittingLeave = false;
        this.errorMessage = err.error?.detail || 'Failed to submit leave request.';
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

  loadParentMoments(): void {
    this.parentMomentsLoading = true;
    this.momentsService.getParentMoments().subscribe({
      next: (data) => {
        this.parentMoments = data;
        this.parentMomentsLoading = false;
      },
      error: (err) => {
        this.parentMomentsLoading = false;
        console.error('Failed to load parent daily moments:', err);
      }
    });
  }

  downloadAllMoments(): void {
    if (this.parentMoments.length === 0) return;
    this.parentMoments.forEach((moment, idx) => {
      const link = document.createElement('a');
      link.href = this.mediaBaseUrl + moment.file_path;
      const ext = moment.file_path.split('.').pop() || (moment.file_type === 'video' ? 'mp4' : 'jpg');
      link.download = moment.title ? `${moment.title.replace(/\s+/g, '_')}.${ext}` : `moment_${moment.id || idx}.${ext}`;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });
  }

  getMilestonesCategories(): string[] {
    if (!this.milestonesGroup) return [];
    return Object.keys(this.milestonesGroup);
  }

  getMonthNameAbbreviation(dateStr: string): string {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const monthIdx = Number(parts[1]) - 1;
      if (monthIdx >= 0 && monthIdx < 12) {
        return this.monthNames[monthIdx].slice(0, 3);
      }
    }
    return '';
  }

  getMilestonesByCategory(category: string): any[] {
    if (!this.milestonesGroup) return [];
    return (this.milestonesGroup as any)[category] || [];
  }

  loadCalendarData(): void {
    this.calendarEventsLoading = true;
    this.contentService.getHolidays(this.currentYear).subscribe({
      next: (holidays) => {
        this.holidaysList = holidays;
        this.contentService.getEvents().subscribe({
          next: (events) => {
            this.eventsList = events;
            this.combineAndMapEvents();
            this.calendarEventsLoading = false;
          },
          error: (err) => {
            console.error('Failed to load events:', err);
            this.combineAndMapEvents();
            this.calendarEventsLoading = false;
          }
        });
      },
      error: (err) => {
        console.error('Failed to load holidays:', err);
        this.calendarEventsLoading = false;
      }
    });
  }

  combineAndMapEvents(): void {
    const combined = [];

    // Add school events
    for (const event of this.eventsList) {
      if (event.is_active !== false) {
        const dateStr = new Date(event.event_date).toISOString().split('T')[0];
        combined.push({
          id: 'event_' + event.id,
          title: event.title,
          description: event.description,
          dateStr: dateStr,
          type: 'School Event',
          location: event.location,
          image: event.image_url
        });
      }
    }

    // Add holidays
    for (const h of this.holidaysList) {
      if (h.is_active) {
        combined.push({
          id: 'holiday_' + h.id,
          title: h.title,
          description: h.description,
          dateStr: h.holiday_date,
          type: h.category || 'National Holiday',
          image: h.image_url
        });
      }
    }

    this.allCalendarEvents = combined;
    this.generateCalendarGrid();
    
    // Auto-select active date details
    const selectedExists = this.calendarDays.find(d => d.dateStr === this.selectedDateStr);
    if (!selectedExists) {
      const today = new Date();
      const offset = today.getTimezoneOffset();
      const localToday = new Date(today.getTime() - (offset * 60 * 1000));
      this.selectDate(today, localToday.toISOString().split('T')[0]);
    } else {
      this.selectDate(this.selectedDate, this.selectedDateStr);
    }
  }

  generateCalendarGrid(): void {
    const firstDayIndex = new Date(this.currentYear, this.currentMonth, 1).getDay();
    const totalDays = new Date(this.currentYear, this.currentMonth + 1, 0).getDate();
    
    const days = [];
    
    // 1. Add preceding days from the previous month
    const prevMonthDays = new Date(this.currentYear, this.currentMonth, 0).getDate();
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const dayNum = prevMonthDays - i;
      const date = new Date(this.currentYear, this.currentMonth - 1, dayNum);
      const offset = date.getTimezoneOffset();
      const localDate = new Date(date.getTime() - (offset * 60 * 1000));
      const dateStr = localDate.toISOString().split('T')[0];
      
      days.push({
        date: date,
        dayNum: dayNum,
        dateStr: dateStr,
        events: this.allCalendarEvents.filter(e => e.dateStr === dateStr),
        isToday: this.isToday(date),
        isCurrentMonth: false
      });
    }
    
    // 2. Add current month days
    for (let d = 1; d <= totalDays; d++) {
      const date = new Date(this.currentYear, this.currentMonth, d);
      const offset = date.getTimezoneOffset();
      const localDate = new Date(date.getTime() - (offset * 60 * 1000));
      const dateStr = localDate.toISOString().split('T')[0];
      
      const dayEvents = this.allCalendarEvents.filter(e => e.dateStr === dateStr);
      
      days.push({
        date: date,
        dayNum: d,
        dateStr: dateStr,
        events: dayEvents,
        isToday: this.isToday(date),
        isCurrentMonth: true
      });
    }
    
    // 3. Add succeeding days from the next month to complete the 42-day (6-week) grid
    const remainingCells = 42 - days.length;
    for (let i = 1; i <= remainingCells; i++) {
      const date = new Date(this.currentYear, this.currentMonth + 1, i);
      const offset = date.getTimezoneOffset();
      const localDate = new Date(date.getTime() - (offset * 60 * 1000));
      const dateStr = localDate.toISOString().split('T')[0];
      
      days.push({
        date: date,
        dayNum: i,
        dateStr: dateStr,
        events: this.allCalendarEvents.filter(e => e.dateStr === dateStr),
        isToday: this.isToday(date),
        isCurrentMonth: false
      });
    }
    
    this.calendarDays = days;
  }

  prevMonth(): void {
    if (this.currentMonth === 0) {
      this.currentMonth = 11;
      this.currentYear--;
    } else {
      this.currentMonth--;
    }
    this.loadCalendarData();
  }

  nextMonth(): void {
    if (this.currentMonth === 11) {
      this.currentMonth = 0;
      this.currentYear++;
    } else {
      this.currentMonth++;
    }
    this.loadCalendarData();
  }

  selectDate(date: Date, dateStr: string): void {
    if (!dateStr) return;
    this.selectedDate = date;
    this.selectedDateStr = dateStr;
    this.selectedDateEvents = this.allCalendarEvents.filter(e => e.dateStr === dateStr);
  }

  selectUpcomingEvent(ev: any): void {
    const parts = ev.dateStr.split('-');
    if (parts.length === 3) {
      const date = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      this.selectDate(date, ev.dateStr);
    }
  }

  isToday(date: Date): boolean {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  }

  getEventCategoryColor(type: string): string {
    switch (type) {
      case 'School Event':
        return '#0652DD';
      case 'National Holiday':
        return '#EF4444';
      case 'Vacation':
        return '#F97316';
      case 'Public Event':
        return '#10B981';
      case 'Religious Event':
        return '#A855F7';
      default:
        return '#64748B';
    }
  }

  getUpcomingEvents(): any[] {
    const today = new Date();
    const offset = today.getTimezoneOffset();
    const localToday = new Date(today.getTime() - (offset * 60 * 1000));
    const todayStr = localToday.toISOString().split('T')[0];
    return this.allCalendarEvents
      .filter(e => e.dateStr >= todayStr)
      .sort((a, b) => a.dateStr.localeCompare(b.dateStr))
      .slice(0, 5);
  }

  formatEventDate(dateStr: string): string {
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    const date = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
  }
}
