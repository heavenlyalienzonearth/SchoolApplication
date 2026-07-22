import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ApiService } from '../../core/services/api.service';
import { ParentService, Bill, Milestone, MilestoneGroup, LeaveRequest } from '../../core/services/parent.service';
import { MomentsService, StudentMoment } from '../../core/services/moments.service';
import { ContentService } from '../../core/services/content.service';
import { StationaryService, StationaryItem, StationaryOrder } from '../../core/services/stationary.service';
import { AssignmentService, ClassAssignment } from '../../core/services/assignment.service';

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

      <!-- Premium Horizontal Capsule Tab Bar -->
      <div class="tabs-bar-container" *ngIf="!loading && dashboardData" style="background: white; border-bottom: 1px solid #E2E8F0; padding: 15px 20px; box-shadow: 0 4px 6px rgba(0,0,0,0.01);">
        <div class="tabs-bar" style="display: flex; flex-wrap: wrap; justify-content: center; gap: 12px; max-width: 1200px; margin: 0 auto;">
          <button class="tab-btn-pill" [class.active]="activeTab === 'overview'" (click)="setTab('overview')">
            <span>📋</span> Portal Overview
          </button>
          <button class="tab-btn-pill" [class.active]="activeTab === 'billing'" (click)="setTab('billing')" *ngIf="hasPermission('finance-ledger')">
            <span>💳</span> Fees & Ledger
          </button>
          <button class="tab-btn-pill" [class.active]="activeTab === 'milestones'" (click)="setTab('milestones')" *ngIf="hasPermission('milestones')">
            <span>🎯</span> Milestones Tracker
          </button>
          <button class="tab-btn-pill" [class.active]="activeTab === 'meals'" (click)="setTab('meals')" *ngIf="hasPermission('meals')">
            <span>🍽️</span> Weekly Menu
          </button>
          <button class="tab-btn-pill" [class.active]="activeTab === 'leaves'" (click)="setTab('leaves')" *ngIf="hasPermission('leaves')">
            <span>📅</span> Parent Requests
          </button>
          <button class="tab-btn-pill" [class.active]="activeTab === 'calendar'" (click)="setTab('calendar')" *ngIf="hasPermission('holidays')">
            <span>🗓️</span> School Calendar
          </button>
          <button class="tab-btn-pill" [class.active]="activeTab === 'circulars'" (click)="setTab('circulars')" *ngIf="hasPermission('circulars')">
            <span>📢</span> School Circulars
          </button>
          <button class="tab-btn-pill" [class.active]="activeTab === 'stationary'" (click)="setTab('stationary')" *ngIf="hasPermission('stationary')">
            <span>✏️</span> Stationery Store
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

      <!-- Main Portal Layout (Horizontal View) -->
      <main class="dashboard-main" *ngIf="!loading && dashboardData" style="max-width: 1200px; margin: 30px auto; padding: 0 20px;">

        <!-- 1. OVERVIEW TAB -->
        <div *ngIf="activeTab === 'overview'" class="tab-content animate-fade-in">
          <div class="welcome-banner" style="background: linear-gradient(135deg, #f0fdf4, #e0f2fe); border: 1.5px solid #bbf7d0; border-left: 6px solid #4ade80; padding: 24px 32px; border-radius: 16px; margin-bottom: 28px; box-shadow: 0 10px 15px -3px rgba(34,197,94,0.04); display: flex; justify-content: space-between; align-items: center; gap: 20px; flex-wrap: wrap; text-align: left;">
            <div style="flex: 1; min-width: 250px;">
              <h2 style="margin: 0; color: #166534; font-size: 1.55rem; font-weight: 800; letter-spacing: -0.5px; display: flex; align-items: center; gap: 8px;">
                🎒 Welcome, {{ parentName }}
              </h2>
              <p style="margin: 8px 0 0 0; font-size: 0.88rem; color: #1e3a8a; line-height: 1.5; font-weight: 600;">
                Here is a summary of <strong>{{ dashboardData.kid?.name }}'s</strong> school profile, daily schedule, and attendance record.
              </p>
            </div>
            
            <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 6px; min-width: 180px; text-align: right;">
              <span style="background: #dcfce7; color: #16a34a; border: 1px solid #bbf7d0; padding: 4px 14px; border-radius: 9999px; font-size: 0.75rem; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; display: inline-block;">
                🌈 PARENT CPANEL
              </span>
              <span style="font-size: 0.78rem; color: #475569; font-family: monospace; font-weight: 700;">
                🕒 Session: {{ loginTime }}
              </span>
            </div>
          </div>

          <div class="dashboard-grid">
            <!-- Left Column: Kid Profile & Attendance -->
            <div class="col-left">
              <!-- Kid Profile Card -->
              <div class="card kid-card">
                <div class="kid-header">
                  <div class="avatar-wrapper">
                    <img [src]="getMediaUrl(dashboardData.kid?.photo_url, 'assets/images/parent_avatar1.jpg')" alt="Kid Photo" class="kid-photo" (error)="onImgError($event)" />
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

              <!-- Teacher's Board Card -->
              <div class="card teacher-board-card" *ngIf="dashboardData.teacher_board" style="margin-top: 30px; border-left: 4px solid var(--secondary); background: white;">
                <h3 class="card-title" style="margin-bottom: 15px;">👩‍🏫 Classroom Teacher's Board</h3>
                <div class="teacher-info" style="display: flex; gap: 16px; align-items: start; margin-bottom: 15px;">
                  <img [src]="getMediaUrl(dashboardData.teacher_board.photo_url, 'assets/images/parent_avatar2.jpg')" 
                       alt="Teacher Photo" 
                       style="width: 65px; height: 65px; border-radius: 50%; object-fit: cover; border: 2.5px solid #E2E8F0;"
                       (error)="onImgError($event)" />
                  <div style="flex: 1;">
                    <h4 style="margin: 0; font-size: 1.05rem; font-weight: 800; color: #1e293b;">{{ dashboardData.teacher_board.name }}</h4>
                    <p style="margin: 3px 0 0 0; font-size: 0.76rem; color: var(--secondary); font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">Class Mentor</p>
                  </div>
                </div>

                <div class="teacher-details" style="display: flex; flex-direction: column; gap: 12px; font-size: 0.82rem; line-height: 1.45;">
                  <div>
                    <strong style="color: #475569; display: block; margin-bottom: 2px;">🎓 Educational Background:</strong>
                    <span style="color: #334155;">{{ dashboardData.teacher_board.education }}</span>
                  </div>
                  <div>
                    <strong style="color: #475569; display: block; margin-bottom: 2px;">💼 Overall Experience:</strong>
                    <span style="color: #334155;">{{ dashboardData.teacher_board.experience }}</span>
                  </div>
                  <div>
                    <strong style="color: #475569; display: block; margin-bottom: 2px;">🌟 Achievements & Awards:</strong>
                    <span style="color: #334155; white-space: pre-line;">{{ dashboardData.teacher_board.achievements }}</span>
                  </div>
                  <div *ngIf="dashboardData.teacher_board.cv_url" style="border-top: 1px dashed #E2E8F0; padding-top: 10px; margin-top: 5px;">
                    <strong style="color: #475569; display: block; margin-bottom: 4px;">📄 Professional Credentials:</strong>
                    <a [href]="getMediaUrl(dashboardData.teacher_board.cv_url, '')" target="_blank" style="color: var(--secondary); font-weight: 700; text-decoration: underline; display: inline-flex; align-items: center; gap: 4px;">
                      📥 View Teacher's Professional CV / Resume
                    </a>
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

              <!-- 📚 Class Assignments Card -->
              <div class="card assignments-card" style="margin-bottom: 30px; border: 2.5px solid var(--primary); background: white; padding: 20px; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
                <h3 class="card-title" style="display: flex; align-items: center; justify-content: space-between; font-size: 1.15rem; font-weight: 800; color: #1e293b; margin: 0 0 8px 0;">
                  <span>📚 Class Assignments</span>
                </h3>
                <p class="subtitle" style="margin: 0 0 20px 0; font-size: 0.85rem; color: #64748B; font-weight: 600;">
                  Daily class assignments, homework activities, and templates shared by teachers. Files expire after 3 days.
                </p>

                <div *ngIf="parentAssignmentsLoading" style="text-align: center; padding: 20px; color: #64748b; font-weight: 600;">
                  <p>Loading assignments...</p>
                </div>

                <div *ngIf="!parentAssignmentsLoading">
                  <!-- Grid of Assignments -->
                  <div style="display: flex; flex-direction: column; gap: 16px;" *ngIf="parentAssignments.length > 0">
                    <div *ngFor="let assign of parentAssignments" style="border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px; background: #f8fafc; display: flex; flex-direction: column; gap: 8px;">
                      <div>
                        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 6px;">
                          <span style="font-size: 0.9rem; font-weight: 800; color: #1e293b;">{{ assign.title }}</span>
                          <span style="font-size: 0.68rem; background: #e0f2fe; color: #0369a1; padding: 3px 8px; border-radius: 12px; font-weight: 700;">📅 {{ assign.date }}</span>
                        </div>
                        <p *ngIf="assign.description" style="margin: 6px 0 0 0; font-size: 0.8rem; color: #475569; line-height: 1.45; font-weight: 500;">
                          {{ assign.description }}
                        </p>
                      </div>

                      <div style="border-top: 1px dashed #cbd5e1; padding-top: 10px; margin-top: 4px;">
                        <span style="font-size: 0.72rem; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; display: block; margin-bottom: 8px;">📎 Assignment Attachments</span>
                        <div style="display: flex; flex-direction: column; gap: 6px;">
                          <div *ngFor="let file of parseFilesList(assign.files_json)">
                            <a [href]="mediaBaseUrl + file" target="_blank" [download]="getFileNameFromUrl(file)" [title]="getFileNameFromUrl(file)" style="display: inline-flex; align-items: center; gap: 6px; font-size: 0.76rem; font-weight: 700; color: var(--primary); text-decoration: none; padding: 6px 12px; background: white; border: 1.5px solid var(--primary); border-radius: 6px; transition: all 0.2s;" onmouseover="this.style.background='var(--primary)'; this.style.color='white'" onmouseout="this.style.background='white'; this.style.color='var(--primary)'">
                              📥 {{ getFileNameFromUrl(file) }}
                            </a>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div *ngIf="parentAssignments.length === 0" style="text-align: center; color: #94a3b8; font-style: italic; padding: 30px; border: 2px dashed #e2e8f0; border-radius: 8px; background: #fafafa; font-size: 0.88rem;">
                     No active assignments shared for your child's class in the last 3 days.
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
                        <td class="day-cell"><strong>{{ getDayName(day) }}</strong></td>
                        <ng-container *ngIf="getHolidayForDay(day) as holiday; else regularRow">
                          <td colspan="4" style="background-color: #FEF2F2; color: #DC2626; text-align: center; font-weight: 700; padding: 12px; font-size: 0.85rem; border-left: 4px solid #EF4444;">
                            🎉 Holiday: {{ holiday.title }} ({{ holiday.category || 'School Holiday' }})
                          </td>
                        </ng-container>
                        <ng-template #regularRow>
                          <td>{{ dashboardData.weekly_plan?.[day]?.study || '--' }}</td>
                          <td>{{ dashboardData.weekly_plan?.[day]?.physical || '--' }}</td>
                          <td>{{ dashboardData.weekly_plan?.[day]?.games || '--' }}</td>
                          <td class="breakfast-cell">🥞 {{ dashboardData.weekly_plan?.[day]?.breakfast || '--' }}</td>
                        </ng-template>
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

          <!-- Radar Chart Card -->
          <div class="card radar-chart-card" style="background: white; border-radius: 16px; border: 1px solid #E2E8F0; padding: 30px; margin-bottom: 35px; display: grid; grid-template-columns: 1.1fr 1fr; gap: 40px; align-items: center; box-shadow: 0 10px 30px rgba(0,0,0,0.03);" *ngIf="dashboardData?.development_radar?.length > 0">
            <div>
              <span style="font-size: 0.72rem; text-transform: uppercase; letter-spacing: 1.5px; font-weight: 800; color: var(--secondary); background: #EFF6FF; padding: 4px 12px; border-radius: 20px; display: inline-block; margin-bottom: 12px;">Development Analytics</span>
              <h3 style="margin: 0 0 12px 0; color: var(--primary); font-size: 1.4rem; font-weight: 800; display: flex; align-items: center; gap: 8px;">
                📊 Holistic Progress Spectrum
              </h3>
              <p style="color: var(--text-light); font-size: 0.88rem; line-height: 1.6; margin-bottom: 25px;">
                Hover over the chart nodes or progress bars to highlight developmental categories and explore milestones.
              </p>
              
              <!-- Development Bands Legend -->
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 25px; background: #F8FAFC; padding: 15px; border-radius: 10px; border: 1px solid #F1F5F9; font-size: 0.8rem;">
                <div>
                  <span style="display: block; font-size: 0.7rem; font-weight: 700; color: #94A3B8; text-transform: uppercase;">Grid Bands (Scale)</span>
                  <div style="display: flex; flex-direction: column; gap: 4px; margin-top: 6px; color: #475569;">
                    <span style="display: flex; align-items: center; gap: 6px;"><span style="width: 8px; height: 8px; border-radius: 50%; background: #E2E8F0;"></span> Outer Ring: 100% Mastery</span>
                    <span style="display: flex; align-items: center; gap: 6px;"><span style="width: 8px; height: 8px; border-radius: 50%; background: #CBD5E1;"></span> Mid Rings: 40% - 80%</span>
                  </div>
                </div>
                <div>
                  <span style="display: block; font-size: 0.7rem; font-weight: 700; color: #94A3B8; text-transform: uppercase;">Growth Legend</span>
                  <div style="display: flex; flex-direction: column; gap: 4px; margin-top: 6px; color: #475569;">
                    <span style="display: flex; align-items: center; gap: 6px;"><span style="width: 14px; height: 10px; background: rgba(99, 102, 241, 0.2); border: 1.5px solid var(--primary); border-radius: 2px;"></span> Completed Growth</span>
                    <span style="display: flex; align-items: center; gap: 6px;"><span style="width: 8px; height: 8px; border-radius: 50%; background: var(--secondary);"></span> Active Nodes</span>
                  </div>
                </div>
              </div>

              <!-- List Details with Progress Bars -->
              <div style="display: flex; flex-direction: column; gap: 14px;">
                <div *ngFor="let cat of dashboardData?.development_radar" style="font-size: 0.88rem; cursor: pointer; transition: transform 0.2s;" 
                     (mouseenter)="hoveredCategory = cat.category" (mouseleave)="hoveredCategory = null"
                     [style.transform]="hoveredCategory === cat.category ? 'scale(1.02)' : 'none'">
                  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
                    <span style="font-weight: 700; display: flex; align-items: center; gap: 6px; transition: color 0.2s;"
                          [style.color]="hoveredCategory === cat.category ? 'var(--primary)' : '#334155'">
                      <span>{{ cat.category === 'Cognitive' ? '🧠' : cat.category === 'Physical' ? '🏃' : cat.category === 'Emotional' ? '🤝' : cat.category === 'Creative' ? '🎨' : '🗣️' }}</span>
                      {{ cat.category === 'Cognitive' ? 'Cognitive & Learning' : cat.category === 'Physical' ? 'Physical & Motor' : cat.category === 'Emotional' ? 'Social & Emotional' : cat.category }}
                    </span>
                    <span style="font-weight: 800; transition: color 0.2s;" [style.color]="hoveredCategory === cat.category ? 'var(--secondary)' : 'var(--primary)'">
                      {{ cat.percentage }}% <span style="font-weight: 600; color: #94A3B8; font-size: 0.78rem;">({{ cat.completed }}/{{ cat.total }})</span>
                    </span>
                  </div>
                  <!-- Progress Bar -->
                  <div style="width: 100%; height: 8px; background: #F1F5F9; border-radius: 10px; overflow: hidden; transition: all 0.2s;"
                       [style.box-shadow]="hoveredCategory === cat.category ? '0 0 8px rgba(99, 102, 241, 0.4)' : 'none'">
                    <div [style.width.%]="cat.percentage" style="height: 100%; background: linear-gradient(90deg, var(--primary), var(--secondary)); border-radius: 10px;"></div>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- Professional SVG Plotting -->
            <div style="display: flex; justify-content: center; align-items: center; background: #FAFAFA; border-radius: 16px; padding: 25px 15px; border: 1px dashed #E2E8F0;">
              <svg viewBox="0 0 600 380" style="width: 100%; max-width: 520px; height: auto;">
                <defs>
                  <!-- Premium Radial / Linear Gradients for Pentagon Fill -->
                  <linearGradient id="radarGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stop-color="var(--primary)" stop-opacity="0.38" />
                    <stop offset="100%" stop-color="var(--secondary)" stop-opacity="0.18" />
                  </linearGradient>
                </defs>

                <!-- Grid concentric scale bands (20%, 40%, 60%, 80%, 100%) -->
                <polygon [attr.points]="getRadarGridPoints(0.2)" fill="none" stroke="#F1F5F9" stroke-width="1.2" />
                <polygon [attr.points]="getRadarGridPoints(0.4)" fill="none" stroke="#E2E8F0" stroke-width="1.2" />
                <polygon [attr.points]="getRadarGridPoints(0.6)" fill="none" stroke="#CBD5E1" stroke-width="1.2" stroke-dasharray="3" />
                <polygon [attr.points]="getRadarGridPoints(0.8)" fill="none" stroke="#94A3B8" stroke-width="1.2" stroke-dasharray="3" />
                <polygon [attr.points]="getRadarGridPoints(1.0)" fill="none" stroke="#64748B" stroke-width="1.8" />

                <!-- Dynamic Axis Lines -->
                <line *ngFor="let axis of getRadarAxes()" 
                      [attr.x1]="axis.x1" [attr.y1]="axis.y1" 
                      [attr.x2]="axis.x2" [attr.y2]="axis.y2" 
                      [attr.stroke]="hoveredCategory === axis.category ? 'var(--secondary)' : '#94A3B8'" 
                      [attr.stroke-width]="hoveredCategory === axis.category ? 2.5 : 1" 
                      [attr.stroke-dasharray]="hoveredCategory === axis.category ? 'none' : '2'" 
                      style="transition: all 0.2s;" />

                <!-- Solid center hub node -->
                <circle cx="300" cy="190" r="4.5" fill="#475569" />

                <!-- Main Dynamic Radar Growth Polygon Shape -->
                <polygon [attr.points]="getRadarPolygonPoints(dashboardData?.development_radar)" fill="url(#radarGrad)" stroke="var(--primary)" stroke-width="2.5" />

                <!-- Markers (Interactive Hover Dots) -->
                <circle *ngFor="let pt of getRadarCircles(dashboardData?.development_radar)" 
                        [attr.cx]="pt.x" [attr.cy]="pt.y" 
                        [attr.r]="hoveredCategory === pt.category ? 9 : 6" 
                        [attr.fill]="hoveredCategory === pt.category ? 'var(--primary)' : 'var(--secondary)'" 
                        stroke="white" [attr.stroke-width]="hoveredCategory === pt.category ? 2.5 : 1.8" 
                        style="cursor: pointer; transition: all 0.2s;"
                        (mouseenter)="hoveredCategory = pt.category" (mouseleave)="hoveredCategory = null" />

                <!-- Dynamic Labels with Percentage Highlight Toggles -->
                <text *ngFor="let axis of getRadarAxes()" 
                      [attr.x]="axis.textX" [attr.y]="axis.textY" 
                      [attr.text-anchor]="axis.textAnchor" 
                      font-size="12.5" font-weight="800" 
                      [attr.fill]="hoveredCategory === axis.category ? 'var(--primary)' : '#334155'" 
                      [style.font-size]="hoveredCategory === axis.category ? '14px' : '12.5px'" 
                      style="cursor: pointer; transition: all 0.2s; user-select: none;"
                      (mouseenter)="hoveredCategory = axis.category" (mouseleave)="hoveredCategory = null">
                  {{ axis.emoji }} {{ axis.label }} ({{ axis.percentage }}%)
                </text>
              </svg>
            </div>
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


        <!-- 4. PARENT REQUESTS TAB (LEAVES & MEAL SUSPENSIONS) -->
        <div *ngIf="activeTab === 'leaves'" class="tab-content animate-fade-in">
          <!-- Parent Requests Inner Sub-Tabs Navigation -->
          <div class="parent-requests-subtabs" style="display: flex; gap: 15px; margin-bottom: 20px; border-bottom: 2px solid #E2E8F0; padding-bottom: 10px;">
            <button (click)="activeParentRequestSubTab = 'leaves'" 
                    [style.color]="activeParentRequestSubTab === 'leaves' ? '#EE5A24' : '#64748B'" 
                    [style.border-bottom]="activeParentRequestSubTab === 'leaves' ? '3px solid #EE5A24' : 'none'"
                    style="background: none; border: none; padding: 10px 15px; font-weight: 700; font-size: 0.95rem; cursor: pointer; transition: all 0.2s;">
              📋 Absence Leave Requests
            </button>
            <button (click)="activeParentRequestSubTab = 'meals'" 
                    [style.color]="activeParentRequestSubTab === 'meals' ? '#EE5A24' : '#64748B'" 
                    [style.border-bottom]="activeParentRequestSubTab === 'meals' ? '3px solid #EE5A24' : 'none'"
                    style="background: none; border: none; padding: 10px 15px; font-weight: 700; font-size: 0.95rem; cursor: pointer; transition: all 0.2s;">
              🍽️ Skip Meal Requests
            </button>
          </div>

          <!-- SUB-TAB 1: ABSENCE LEAVE REQUESTS -->
          <div *ngIf="activeParentRequestSubTab === 'leaves'" class="leaves-layout animate-fade-in">
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

          <!-- SUB-TAB 2: SKIP MEAL REQUESTS -->
          <div *ngIf="activeParentRequestSubTab === 'meals'" class="leaves-layout animate-fade-in">
            <!-- Left Panel: Skip Meal Form -->
            <div class="card leave-form-card">
              <h3 class="card-title">🍽️ Skip Meal Request</h3>
              <p style="font-size: 0.8rem; color: #64748B; margin-bottom: 15px; line-height: 1.4;">
                Intimate the classroom teacher not to provide meals (Breakfast, Lunch, or Snack) to your child on a specific day.
              </p>
              
              <form (submit)="onSuspensionSubmit($event)" class="leave-form">
                <div class="form-group">
                  <label for="requestDate">Suspension Date</label>
                  <input type="date" id="requestDate" name="requestDate" [(ngModel)]="suspensionForm.requestDate" required class="form-control" />
                </div>

                <div class="form-group">
                  <label for="suspensionReason">Reason / Special Instruction</label>
                  <textarea id="suspensionReason" name="suspensionReason" [(ngModel)]="suspensionForm.reason" rows="4" required placeholder="E.g., Child is fasting / bringing home-cooked food today / has a doctor appointment..." class="form-control"></textarea>
                </div>

                <button type="submit" class="btn-submit-leave" [disabled]="submittingSuspension" style="background: #e28743;">
                  {{ submittingSuspension ? 'Sending instructions...' : '🚀 Intimate Classroom Teacher' }}
                </button>
              </form>
            </div>

            <!-- Right Panel: Suspension Logs & Teacher Acknowledgment status -->
            <div class="card leave-history-card">
              <h3 class="card-title">📜 Meal Instruction Logs</h3>
              
              <div class="leaves-timeline">
                <div class="leave-log-box" *ngFor="let req of suspensionsList" style="border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; margin-bottom: 12px; background: white;">
                  <div class="log-hdr" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                    <span class="dates-range" style="font-weight: 700; font-size: 0.82rem; color: #1e293b;">📅 Skip meals on: {{ req.request_date | date:'mediumDate' }}</span>
                    <span class="badge" [ngClass]="{
                      'badge-present': req.status === 'Acknowledged',
                      'badge-late': req.status === 'Pending'
                    }" style="font-weight: 700; font-size: 0.72rem; padding: 3px 8px; border-radius: 4px;">{{ req.status }}</span>
                  </div>
                  <p class="reason-txt" style="margin: 4px 0; font-size: 0.78rem; color: #475569;"><strong>Instructions:</strong> {{ req.reason }}</p>
                  
                  <!-- Teacher Acknowledgment Status -->
                  <div *ngIf="req.status === 'Acknowledged'" style="margin-top: 8px; padding: 8px; background: #f0fdf4; border-left: 3px solid #22c55e; border-radius: 4px; font-size: 0.75rem; color: #15803d; font-weight: 700;">
                    ✓ Acknowledged by Teacher ({{ req.acknowledged_by }})
                    <span style="font-size: 0.65rem; color: #16a34a; font-weight: normal; display: block; margin-top: 2px;">At: {{ req.acknowledged_at | date:'short' }}</span>
                  </div>
                  <div *ngIf="req.status === 'Pending'" style="margin-top: 8px; padding: 8px; background: #fffbeb; border-left: 3px solid #d97706; border-radius: 4px; font-size: 0.75rem; color: #b45309;">
                    ⏳ Awaiting Teacher Acknowledgment
                  </div>

                  <span class="submitted-time" style="font-size: 0.65rem; color: #94a3b8; display: block; margin-top: 8px;">Submitted: {{ req.created_at | date:'short' }}</span>
                </div>
                <div *ngIf="suspensionsList.length === 0" class="no-records" style="padding: 40px 0;">
                  No meal instructions submitted yet.
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

        <!-- 6. SCHOOL CIRCULARS TAB -->
        <div *ngIf="activeTab === 'circulars'" class="tab-content animate-fade-in circulars-tab-wrapper">
          <!-- Playful Decorative Floating Elements (inherits parent background theme) -->
          <div class="calendar-deco cloud-1">☁️</div>
          <div class="calendar-deco cloud-2">☁️</div>
          <div class="calendar-deco balloon">🎈</div>
          
          <div class="circulars-layout" style="position: relative; z-index: 2;">
            <div class="card circulars-card">
              <div class="circulars-header" style="margin-bottom: 20px; border-bottom: 1px solid #F1F5F9; padding-bottom: 15px;">
                <h3 class="circulars-title" style="font-size: 1.3rem; font-weight: 800; color: #1E293B; margin: 0;">📢 School Circulars & Notices</h3>
                <p style="color: #64748B; font-size: 0.85rem; margin-top: 5px;">Stay updated with the latest official announcements from Vidyankuram School administration.</p>
              </div>

              <!-- Circulars List -->
              <div class="circulars-list" *ngIf="circularsList.length > 0">
                <div class="circular-item-box" *ngFor="let c of circularsList" (click)="selectCircular(c)" [class.selected]="selectedCircular?.id === c.id">
                  <div class="circular-item-header">
                    <span class="circular-date">{{ c.created_at | date:'longDate' }}</span>
                    <span class="badge" [ngStyle]="{
                      'background-color': c.program_id ? '#E0F2FE' : '#F3E8FF',
                      'color': c.program_id ? '#0369A1' : '#6B21A8'
                    }">
                      {{ c.program_id ? 'Class Notice' : 'School-Wide' }}
                    </span>
                  </div>
                  <h4 class="circular-item-title">{{ c.title }}</h4>
                  <p class="circular-item-snippet">{{ c.content | slice:0:150 }}{{ c.content.length > 150 ? '...' : '' }}</p>
                  <div class="circular-item-footer" style="display: flex; justify-content: space-between; align-items: center; margin-top: 12px; padding-top: 10px; border-top: 1px dashed #F1F5F9;">
                    <span style="color: var(--primary); font-weight: 700; font-size: 0.82rem;">Read Announcement →</span>
                    <span *ngIf="c.attachment_url" style="color: #64748B; font-size: 0.8rem; display: flex; align-items: center; gap: 4px;">
                      📎 Has Attachment
                    </span>
                  </div>
                </div>
              </div>

              <div *ngIf="circularsList.length === 0" class="no-records" style="padding: 60px 20px; text-align: center;">
                <div style="font-size: 3rem; margin-bottom: 10px;">📯</div>
                <p style="font-weight: 600; color: #64748B;">No circulars or notices published for your child's class yet.</p>
              </div>
            </div>

            <!-- Details Panel -->
            <div class="calendar-details-panel">
              <div class="card selected-day-card" style="height: 100%; display: flex; flex-direction: column; justify-content: space-between; min-height: 400px;">
                <div *ngIf="selectedCircular">
                  <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 12px;">
                    <span class="event-badge" [ngStyle]="{
                      'background-color': selectedCircular.program_id ? '#DBEAFE' : '#F3E8FF',
                      'color': selectedCircular.program_id ? '#1E40AF' : '#6B21A8'
                    }">
                      {{ selectedCircular.program_id ? 'Class-Specific Notice' : 'School-Wide Circular' }}
                    </span>
                    <span style="font-size: 0.8rem; color: #64748B; font-weight: 600;">📅 {{ selectedCircular.created_at | date:'mediumDate' }}</span>
                  </div>

                  <h3 style="font-size: 1.25rem; font-weight: 800; color: #1E293B; margin-bottom: 15px; line-height: 1.4;">{{ selectedCircular.title }}</h3>
                  
                  <div style="background-color: #F8FAFC; border-radius: 12px; padding: 20px; border: 1px solid #F1F5F9; margin-bottom: 20px;">
                    <p style="color: #334155; font-size: 0.92rem; line-height: 1.6; white-space: pre-line; margin: 0;">{{ selectedCircular.content }}</p>
                  </div>

                  <div *ngIf="selectedCircular.attachment_url" style="background-color: #EFF6FF; border: 1px solid #BFDBFE; border-radius: 8px; padding: 12px 15px; display: flex; align-items: center; justify-content: space-between;">
                    <span style="font-size: 0.85rem; font-weight: 600; color: #1E40AF; display: flex; align-items: center; gap: 8px;">
                      📄 Attachment Document Included
                    </span>
                    <a [href]="selectedCircular.attachment_url" target="_blank" class="btn-table save" style="padding: 6px 12px; font-size: 0.8rem; border-radius: 4px; text-decoration: none; text-align: center; display: inline-block;">
                      Download File
                    </a>
                  </div>
                </div>

                <div class="no-events-selected" *ngIf="!selectedCircular" style="margin: auto; text-align: center; padding: 40px 10px;">
                  <div style="font-size: 3rem; margin-bottom: 15px; opacity: 0.4;">📢</div>
                  <h4 style="font-weight: 700; color: #475569; margin-bottom: 5px;">No Circular Selected</h4>
                  <p style="font-size: 0.85rem; color: #64748B; max-width: 250px; margin: auto;">Select any circular from the list on the left to read its full official details.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 7. WEEKLY MENU & MEAL PLANNER TAB -->
        <div *ngIf="activeTab === 'meals'" class="tab-content animate-fade-in" style="padding: 20px 0;">
          <div style="border-bottom: 2px solid #E2E8F0; padding-bottom: 15px; margin-bottom: 25px;">
            <h2 style="margin: 0; color: var(--primary);">🍽️ School Nutrition & Meal Planner</h2>
            <p style="margin: 3px 0 0 0; color: var(--text-light); font-size: 0.9rem;">View the weekly breakfast, lunch, and snack menu curated for healthy growing kids.</p>
          </div>

          <!-- Allergen Alert Banner -->
          <div class="alert alert-danger" *ngIf="allergenWarningFlag" style="margin-bottom: 25px; display: flex; align-items: center; gap: 15px; border-left: 5px solid #EF4444; background: #FEF2F2; color: #991B1B; padding: 15px; border-radius: 8px;">
            <span style="font-size: 1.5rem;">⚠️</span>
            <div>
              <strong style="font-size: 0.95rem; display: block;">Allergen Alert Detected!</strong>
              <span style="font-size: 0.85rem;">This week's menu contains items matching your child's logged food allergies (<strong>{{ dashboardData?.kid?.allergies }}</strong>). Please review the warning labels below.</span>
            </div>
          </div>

          <!-- Loading state for meals -->
          <div *ngIf="mealsLoading" style="text-align: center; padding: 40px; color: #64748B;">
            <div class="spinner" style="margin: 0 auto 10px auto;"></div>
            <p>Loading weekly menu details...</p>
          </div>

          <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 30px; align-items: start;" *ngIf="!mealsLoading">
            <!-- Weekly Menu Grid -->
            <div style="display: flex; flex-direction: column; gap: 20px;">
              <div *ngFor="let day of ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']" class="card" style="background: white; border-radius: 12px; border: 1px solid #E2E8F0; padding: 22px; box-shadow: 0 4px 6px rgba(0,0,0,0.01);">
                <h4 style="margin: 0 0 15px 0; color: var(--primary); font-size: 1.1rem; font-weight: 800; border-bottom: 2px solid #F1F5F9; padding-bottom: 8px; display: flex; justify-content: space-between; align-items: center;">
                  <span>📅 {{ day }}</span>
                  <span style="font-size: 0.78rem; font-weight: 600; color: #64748B; background: #F1F5F9; padding: 2px 10px; border-radius: 20px;">Nutritious Day Plan</span>
                </h4>

                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px;">
                  <!-- Breakfast, Lunch, Snack cards -->
                  <div *ngFor="let type of ['Breakfast', 'Lunch', 'Snack']" [style.border]="hasMealAllergenConflict(getMealForDayAndType(day, type)) ? '1.5px solid #FCA5A5' : '1px solid #E2E8F0'" [style.background]="hasMealAllergenConflict(getMealForDayAndType(day, type)) ? '#FEF2F2' : '#F8FAFC'" style="border-radius: 8px; padding: 12px; display: flex; flex-direction: column; justify-content: space-between; min-height: 130px;">
                    <div>
                      <span [style.background]="type === 'Breakfast' ? '#FFE4E6' : type === 'Lunch' ? '#D1FAE5' : '#FEF3C7'" [style.color]="type === 'Breakfast' ? '#9F1239' : type === 'Lunch' ? '#065F46' : '#92400E'" style="font-size: 0.7rem; font-weight: 800; text-transform: uppercase; padding: 2px 8px; border-radius: 12px; display: inline-block; margin-bottom: 8px;">
                        {{ type }}
                      </span>
                      <strong style="display: block; font-size: 0.88rem; color: #1E293B; margin-bottom: 4px;">{{ getMealForDayAndType(day, type)?.menu_item || 'Not Scheduled' }}</strong>
                      <p style="font-size: 0.75rem; color: #64748B; margin: 0; line-height: 1.4;">{{ getMealForDayAndType(day, type)?.description || '--' }}</p>
                    </div>

                    <div style="margin-top: 10px; border-top: 1px dashed #E2E8F0; padding-top: 6px; display: flex; justify-content: space-between; align-items: center; font-size: 0.72rem;">
                      <span style="color: #94A3B8; font-weight: 600;">🔥 {{ getMealForDayAndType(day, type)?.calories || '0' }} kcal</span>
                      <span *ngIf="getMealForDayAndType(day, type)?.allergens && getMealForDayAndType(day, type)?.allergens !== 'None'" [style.color]="hasMealAllergenConflict(getMealForDayAndType(day, type)) ? '#B91C1C' : '#475569'" style="font-weight: 700;">
                        ⚠️ {{ hasMealAllergenConflict(getMealForDayAndType(day, type)) ? 'Allergy Warning!' : 'Contains: ' + getMealForDayAndType(day, type)?.allergens }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Allergy Panel & Information -->
            <div class="card" style="background: white; border-radius: 12px; border: 1px solid #E2E8F0; padding: 22px; box-shadow: 0 4px 6px rgba(0,0,0,0.02); display: flex; flex-direction: column; gap: 15px;">
              <h3 style="margin: 0; color: var(--primary); font-size: 1.1rem; font-weight: 800; border-bottom: 1px solid #F1F5F9; padding-bottom: 8px;">
                🧬 Child Allergy Profile
              </h3>
              
              <p style="font-size: 0.85rem; color: #64748B; line-height: 1.5; margin: 0;">
                Allergies are automatically matched against ingredients in the daily menu planner. Contact admin if you need to update this profile.
              </p>

              <div style="background: #F8FAFC; border-radius: 8px; padding: 15px; border: 1px solid #E2E8F0;">
                <span style="font-size: 0.72rem; text-transform: uppercase; font-weight: 700; color: #94A3B8; display: block; margin-bottom: 4px;">Registered Allergies</span>
                <strong style="font-size: 1rem; color: #EF4444; display: block;">{{ dashboardData?.kid?.allergies || 'None' }}</strong>
              </div>

              <div style="border-top: 1px solid #F1F5F9; padding-top: 15px;">
                <h4 style="margin: 0 0 10px 0; font-size: 0.88rem; color: #1E293B; font-weight: 700;">Nutrition Guidelines</h4>
                <p style="font-size: 0.75rem; color: #64748B; line-height: 1.5; margin: 0 0 8px 0;">
                  Our menus are designed by certified pediatric nutritionists to provide:
                </p>
                <ul style="font-size: 0.75rem; color: #64748B; padding-left: 15px; margin: 0; line-height: 1.6;">
                  <li>High protein content for muscle growth</li>
                  <li>Low sugar to prevent energy crashes</li>
                  <li>Locally sourced organic fruits and grains</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <!-- 8. STATIONERY STORE & SUPPLIES TAB -->
        <div *ngIf="activeTab === 'stationary'" class="tab-content animate-fade-in">
          <div style="border-bottom: 2px solid #E2E8F0; padding-bottom: 15px; margin-bottom: 25px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 15px;">
            <div>
              <h2 style="margin: 0; color: var(--primary);">✏️ Stationery Store &amp; Supplies</h2>
              <p style="margin: 3px 0 0 0; color: var(--text-light); font-size: 0.9rem;">Browse available items, place orders for your child, and pay for approved orders.</p>
            </div>
            <button class="btn-action-primary" (click)="openOrderModal()" style="display: inline-flex; align-items: center; gap: 8px; font-weight: 700; background: var(--secondary); color: white; border: none; border-radius: 8px; padding: 10px 20px; cursor: pointer; transition: transform 0.2s;">
              🛒 Place Stationery Order
            </button>
          </div>

          <div style="display: grid; grid-template-columns: 2fr 1.25fr; gap: 30px; align-items: start;">
            <!-- Left Side: Catalog / Store Items -->
            <div class="card" style="background: white; border-radius: 12px; border: 1px solid #E2E8F0; padding: 25px; box-shadow: 0 4px 6px rgba(0,0,0,0.02);">
              <h3 style="margin-top: 0; color: var(--primary); margin-bottom: 20px; font-size: 1.1rem; font-weight: 700; border-bottom: 1px solid #F1F5F9; padding-bottom: 10px;">
                🎒 Available Student Supplies
              </h3>

              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                <div *ngFor="let item of stationaryItems" style="border: 1px solid #E2E8F0; border-radius: 8px; padding: 15px; background: #FAFAFA; display: flex; flex-direction: column; justify-content: space-between; min-height: 140px;">
                  <div>
                    <div style="display: flex; justify-content: space-between; align-items: start;">
                      <strong style="color: #1E293B; font-size: 0.92rem;">{{ item.name }}</strong>
                      <span style="font-size: 0.72rem; background: #F1F5F9; color: #475569; padding: 2px 6px; border-radius: 4px; font-weight: 600;">{{ item.category }}</span>
                    </div>
                    <p style="font-size: 0.78rem; color: #64748B; margin: 4px 0 10px 0; line-height: 1.4;">{{ item.description || 'No description available.' }}</p>
                  </div>
                  
                  <div>
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                      <span style="font-weight: 800; color: var(--primary); font-size: 1.05rem;">₹{{ item.price }}</span>
                      <span style="font-size: 0.72rem; font-weight: 600; color: #64748B;">Available: {{ item.stock }}</span>
                    </div>
                    
                    <!-- Add Action -->
                    <div style="display: flex; gap: 8px;" *ngIf="item.stock > 0">
                      <input type="number" value="1" min="1" [max]="item.stock" #qtyInput style="width: 50px; border: 1px solid #CBD5E1; border-radius: 4px; padding: 4px; text-align: center; font-weight: 700; font-size: 0.8rem;" />
                      <button type="button" (click)="addStationaryToCart(item, qtyInput)" style="flex: 1; background: var(--secondary); color: white; border: none; padding: 5px 10px; border-radius: 4px; font-weight: 700; font-size: 0.78rem; cursor: pointer;">
                        🛒 Add
                      </button>
                    </div>
                    <div *ngIf="item.stock === 0" style="text-align: center; color: #EF4444; font-weight: 700; font-size: 0.8rem; padding: 5px 0;">
                      🚫 Out of Stock
                    </div>
                  </div>
                </div>
              </div>

              <div *ngIf="stationaryItems.length === 0" style="text-align: center; color: var(--text-light); padding: 40px; font-style: italic;">
                No student supplies available in store right now.
              </div>
            </div>

            <!-- Right Side: Cart Summary & Orders History -->
            <div style="display: flex; flex-direction: column; gap: 30px;">
              
              <!-- Cart Details -->
              <div class="card" *ngIf="stationaryCart.length > 0" style="background: white; border-radius: 12px; border: 1px solid #E2E8F0; padding: 22px; box-shadow: 0 4px 6px rgba(0,0,0,0.02);">
                <h3 style="margin-top: 0; color: var(--primary); margin-bottom: 15px; font-size: 1.1rem; font-weight: 700; border-bottom: 1px solid #F1F5F9; padding-bottom: 8px;">
                  🛒 Shopping Cart
                </h3>

                <div style="display: flex; flex-direction: column; gap: 8px; max-height: 180px; overflow-y: auto; margin-bottom: 15px; padding-right: 5px;">
                  <div *ngFor="let c of stationaryCart; let i = index" style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #F1F5F9; padding-bottom: 6px;">
                    <div>
                      <strong style="color: #1E293B; font-size: 0.82rem; display: block;">{{ c.item.name }}</strong>
                      <span style="font-size: 0.78rem; color: #64748B;">₹{{ c.item.price }} × {{ c.quantity }}</span>
                    </div>
                    <div style="display: flex; align-items: center; gap: 8px;">
                      <span style="font-weight: 700; color: #1E293B; font-size: 0.85rem;">₹{{ c.item.price * c.quantity }}</span>
                      <button type="button" (click)="removeStationaryFromCart(i)" style="background: none; border: none; color: #EF4444; font-size: 1.1rem; cursor: pointer; padding: 0;" title="Remove">×</button>
                    </div>
                  </div>
                </div>

                <div style="border-top: 2px solid #E2E8F0; padding-top: 10px; margin-bottom: 15px;">
                  <div style="display: flex; justify-content: space-between; align-items: center; font-weight: 800; font-size: 1rem; color: #1E293B;">
                    <span>Total:</span>
                    <span style="color: var(--primary);">₹{{ getStationaryCartTotal() }}</span>
                  </div>
                </div>

                <button type="button" (click)="openOrderModal()" style="width: 100%; padding: 10px; border-radius: 6px; border: none; background: var(--primary); color: white; font-weight: 700; font-size: 0.85rem; cursor: pointer;">
                  📦 Confirm Order
                </button>
              </div>

              <!-- Orders History -->
              <div class="card" style="background: white; border-radius: 12px; border: 1px solid #E2E8F0; padding: 22px; box-shadow: 0 4px 6px rgba(0,0,0,0.02);">
                <h3 style="margin-top: 0; color: var(--primary); margin-bottom: 15px; font-size: 1.1rem; font-weight: 700; border-bottom: 1px solid #F1F5F9; padding-bottom: 8px;">
                  📜 Supplies Orders History
                </h3>

                <div style="overflow-y: auto; max-height: 400px; display: flex; flex-direction: column; gap: 12px; padding-right: 5px;">
                  <div *ngFor="let order of stationaryOrders" style="border: 1px solid #E2E8F0; border-radius: 8px; padding: 12px; background: #FAFAFA; font-size: 0.82rem;">
                    <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 6px;">
                      <div>
                        <strong style="color: var(--primary);">Order #{{ order.id }}</strong>
                        <span style="color: #64748B; font-size: 0.72rem; margin-left: 6px;">{{ order.order_date | date:'dd MMM yy HH:mm' }}</span>
                      </div>
                      <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 3px;">
                        <span class="badge" [style.background-color]="order.status === 'Delivered' ? '#D1FAE5' : order.status === 'Dispatched' ? '#E0F2FE' : '#FEF3C7'" [style.color]="order.status === 'Delivered' ? '#065F46' : order.status === 'Dispatched' ? '#0369A1' : '#D97706'" style="border-radius: 4px; padding: 2px 6px; font-weight: 700; font-size: 0.7rem;">
                          {{ order.status }}
                        </span>
                        <span class="badge" [style.background-color]="order.payment_status === 'Paid' ? '#D1FAE5' : '#FEE2E2'" [style.color]="order.payment_status === 'Paid' ? '#065F46' : '#991B1B'" style="border-radius: 4px; padding: 2px 6px; font-weight: 700; font-size: 0.7rem;">
                          {{ order.payment_status }}
                        </span>
                      </div>
                    </div>

                    <!-- Items List -->
                    <div style="border-top: 1px solid #E2E8F0; padding-top: 6px; margin-bottom: 8px;">
                      <div *ngFor="let item of order.items" style="display: flex; justify-content: space-between; color: #64748B; font-size: 0.78rem; margin-bottom: 3px;">
                        <span>{{ item.item?.name || item.name || 'Supply Item' }} × {{ item.quantity }}</span>
                        <span>₹{{ item.unit_price * item.quantity }}</span>
                      </div>
                      <div style="display: flex; justify-content: space-between; font-weight: 800; font-size: 0.85rem; color: #1E293B; margin-top: 5px; border-top: 1px dashed #E2E8F0; padding-top: 4px;">
                        <span>Total Amount:</span>
                        <span>₹{{ order.total_price }}</span>
                      </div>
                    </div>

                    <!-- Pay & Delete Actions -->
                    <div style="display: flex; justify-content: flex-end; gap: 8px; margin-top: 6px;">
                      <!-- Trash/Delete Button (Only for Pending Unpaid orders) -->
                      <button *ngIf="order.status.toUpperCase() === 'PENDING' && order.payment_status !== 'Paid'"
                              type="button"
                              (click)="openDeleteConfirmModal(order.id)"
                              style="background: #fee2e2; color: #dc2626; border: 1px solid #fca5a5; border-radius: 4px; padding: 4px 10px; font-size: 0.75rem; font-weight: 700; cursor: pointer; transition: all 0.2s; display: inline-flex; align-items: center; gap: 4px;"
                              onmouseover="this.style.background='#ef4444'; this.style.color='white';"
                              onmouseout="this.style.background='#fee2e2'; this.style.color='#dc2626';">
                        🗑️ Delete Order
                      </button>
                      <button *ngIf="order.payment_status !== 'Paid' && (order.status === 'Dispatched' || order.status === 'Delivered')"
                              type="button"
                              (click)="startOrderPayment(order)"
                              style="background: #10B981; color: white; border: none; padding: 4px 10px; border-radius: 4px; font-size: 0.75rem; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 4px;">
                        💳 Pay ₹{{ order.total_price }} Now
                      </button>
                    </div>
                    <div *ngIf="order.payment_status !== 'Paid' && order.status === 'Pending'" style="color: #64748B; font-size: 0.72rem; text-align: right; font-style: italic; margin-top: 4px;">
                      🕒 Pending approval before payment.
                    </div>
                  </div>

                  <div *ngIf="stationaryOrders.length === 0" style="text-align: center; color: var(--text-light); padding: 20px 0; font-style: italic;">
                    No stationery orders placed yet.
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>

        <!-- STATIONERY ORDER SUBMISSION MODAL -->
        <div class="modal-backdrop" *ngIf="showOrderModal">
          <div class="modal-card animate-fade-in" style="max-width: 500px; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.15); border: none; background: white;">
            <div style="background-color: var(--primary); color: white; padding: 20px; display: flex; justify-content: space-between; align-items: center; position: relative;">
              <h3 style="margin: 0; font-size: 1.15rem; font-weight: 700;">📦 Place Supply Order</h3>
              <button (click)="closeOrderModal()" style="background: none; border: none; color: white; font-size: 1.6rem; cursor: pointer; padding: 0;">×</button>
            </div>
            
            <div class="modal-body" style="padding: 20px;">
              <div class="alert alert-danger" *ngIf="orderError" style="margin-bottom: 15px;">
                ⚠️ {{ orderError }}
              </div>
              <div class="alert alert-success" *ngIf="orderSuccess" style="margin-bottom: 15px;">
                🎉 {{ orderSuccess }}
              </div>

              <form (ngSubmit)="submitStationaryOrder()">
                <div class="form-group" style="margin-bottom: 12px;">
                  <label class="form-label" style="display: block; font-weight: 600; font-size: 0.82rem; color: #475569; margin-bottom: 4px;">Student Name</label>
                  <input type="text" [(ngModel)]="orderStudentName" name="o_student" required class="form-control" placeholder="e.g. Child Name" style="width: 100%; border: 1px solid #CBD5E1; border-radius: 6px; padding: 8px 10px; box-sizing: border-box;" />
                </div>
                
                <div class="form-group" style="margin-bottom: 15px;">
                  <label class="form-label" style="display: block; font-weight: 600; font-size: 0.82rem; color: #475569; margin-bottom: 4px;">Class / Program Name</label>
                  <input type="text" [(ngModel)]="orderClassName" name="o_class" required class="form-control" placeholder="e.g. Nursery A" style="width: 100%; border: 1px solid #CBD5E1; border-radius: 6px; padding: 8px 10px; box-sizing: border-box;" />
                </div>

                <div style="border-top: 1px solid #E2E8F0; padding-top: 12px; margin-bottom: 15px;">
                  <strong style="font-size: 0.85rem; color: #475569; display: block; margin-bottom: 8px;">Order Summary:</strong>
                  <div style="display: flex; flex-direction: column; gap: 5px; max-height: 120px; overflow-y: auto;">
                    <div *ngFor="let c of stationaryCart" style="display: flex; justify-content: space-between; font-size: 0.8rem; color: #64748B;">
                      <span>{{ c.item.name }} × {{ c.quantity }}</span>
                      <span>₹{{ c.item.price * c.quantity }}</span>
                    </div>
                  </div>
                  <div style="display: flex; justify-content: space-between; font-weight: 800; font-size: 0.95rem; color: #1E293B; margin-top: 10px; border-top: 1px dashed #E2E8F0; padding-top: 8px;">
                    <span>Grand Total:</span>
                    <span style="color: var(--primary);">₹{{ getStationaryCartTotal() }}</span>
                  </div>
                </div>

                <div class="modal-footer" style="padding: 10px 0 0 0; display: flex; gap: 10px;">
                  <button type="button" class="btn btn-cancel" (click)="closeOrderModal()" style="flex: 1; padding: 10px; border-radius: 6px; border: 1px solid #cbd5e1; background: none; font-weight: 700; cursor: pointer;">Cancel</button>
                  <button type="submit" class="btn btn-primary" [disabled]="placingOrder || stationaryCart.length === 0" style="flex: 2; padding: 10px; border-radius: 6px; border: none; background-color: var(--primary); color: white; font-weight: 700; cursor: pointer;">
                    {{ placingOrder ? 'Placing Order...' : '🚀 Submit Order' }}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        <!-- SIMULATED STATIONERY RAZORPAY CHECKOUT MODAL -->
        <div class="modal-backdrop" *ngIf="showStationaryPayModal">
          <div class="modal-card animate-fade-in" style="max-width: 420px; border-radius: 8px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.15); border: none; background: white;">
            <!-- Razorpay Blue Theme Header -->
            <div style="background-color: #0c2b64; color: white; padding: 25px 20px; display: flex; flex-direction: column; position: relative;">
              <button (click)="closeStationaryPayModal()" style="position: absolute; top: 15px; right: 15px; background: none; border: none; color: #94a3b8; font-size: 1.5rem; cursor: pointer; line-height: 1;">×</button>
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
                <h2 style="font-size: 1.8rem; font-weight: 800; color: #0f172a; margin: 4px 0 0 0;">₹{{ payingOrder?.total_price }}</h2>
                <p style="margin: 5px 0 0 0; font-size: 0.8rem; color: #475569; font-weight: 600;">Stationery Order #{{ payingOrder?.id }}</p>
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
                  No real money will be charged. Click below to verify and complete stationery payment simulation.
                </p>
              </div>
            </div>

            <div class="modal-footer" style="padding: 15px 20px; background-color: white; border-top: 1px solid #f1f5f9; display: flex; gap: 10px;">
              <button class="btn-modal btn-cancel" (click)="closeStationaryPayModal()" style="flex: 1; padding: 10px; font-weight: 700; font-size: 0.85rem; border-radius: 4px; border: 1px solid #cbd5e1; background: none; cursor: pointer;">Cancel</button>
              <button class="btn-modal btn-confirm" (click)="confirmStationaryPayment()" [disabled]="processingStationaryPayment" style="flex: 2; padding: 10px; font-weight: 700; font-size: 0.85rem; border-radius: 4px; border: none; background-color: #2563eb; color: white; cursor: pointer;">
                {{ processingStationaryPayment ? 'Verifying payment...' : 'Simulate Success' }}
              </button>
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

      <!-- CUSTOM DELETE CONFIRMATION MODAL -->
      <div *ngIf="showDeleteConfirmModal"
           style="position: fixed; inset: 0; background: rgba(15,23,42,0.55); backdrop-filter: blur(4px); z-index: 9999; display: flex; align-items: center; justify-content: center; padding: 20px; animation: fadeIn 0.2s ease;"
           (click)="cancelDeleteOrder()">
        <div (click)="$event.stopPropagation()"
             style="background: white; border-radius: 20px; box-shadow: 0 25px 60px rgba(0,0,0,0.2); max-width: 420px; width: 100%; overflow: hidden; animation: slideUp 0.25s ease;">

          <!-- Modal Header -->
          <div style="background: linear-gradient(135deg, #fff1f2, #fef2f2); padding: 32px 28px 20px; text-align: center; border-bottom: 1px solid #fee2e2;">
            <!-- Animated Warning Icon -->
            <div style="width: 72px; height: 72px; background: linear-gradient(135deg, #ef4444, #dc2626); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px; box-shadow: 0 8px 24px rgba(220,38,38,0.3); animation: pulse 2s infinite;">
              <span style="font-size: 2rem; line-height: 1;">🗑️</span>
            </div>
            <h3 style="margin: 0 0 6px; font-size: 1.3rem; font-weight: 800; color: #0f172a;">Cancel This Order?</h3>
            <p style="margin: 0; font-size: 0.88rem; color: #64748b; line-height: 1.5;">This action will permanently remove your stationery order and cannot be undone.</p>
          </div>

          <!-- Order Info Box -->
          <div style="padding: 20px 28px;">
            <div style="background: #fafafa; border: 1px solid #f1f5f9; border-radius: 10px; padding: 14px 18px; display: flex; align-items: center; gap: 12px;">
              <span style="font-size: 1.4rem;">📦</span>
              <div>
                <div style="font-size: 0.75rem; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px;">Order Reference</div>
                <div style="font-size: 1rem; font-weight: 800; color: #0f172a;">#{{ deleteConfirmOrderId }}</div>
                <div style="font-size: 0.75rem; color: #64748b; margin-top: 2px;">Status: <span style="color: #d97706; font-weight: 700;">Pending Approval</span></div>
              </div>
            </div>

            <p style="margin: 16px 0 0; font-size: 0.82rem; color: #94a3b8; text-align: center;">
              ⚠️ Only pending &amp; unpaid orders can be cancelled by parents.
            </p>
          </div>

          <!-- Action Buttons -->
          <div style="padding: 0 28px 28px; display: flex; gap: 12px;">
            <button type="button"
                    (click)="cancelDeleteOrder()"
                    [disabled]="deletingOrder"
                    style="flex: 1; padding: 12px 16px; border-radius: 10px; border: 2px solid #e2e8f0; background: white; color: #475569; font-weight: 700; font-size: 0.9rem; cursor: pointer; transition: all 0.2s;"
                    onmouseover="this.style.borderColor='#94a3b8'; this.style.background='#f8fafc';"
                    onmouseout="this.style.borderColor='#e2e8f0'; this.style.background='white';">
              Keep Order
            </button>
            <button type="button"
                    (click)="confirmDeleteOrder()"
                    [disabled]="deletingOrder"
                    style="flex: 2; padding: 12px 16px; border-radius: 10px; border: none; background: linear-gradient(135deg, #ef4444, #dc2626); color: white; font-weight: 800; font-size: 0.9rem; cursor: pointer; transition: all 0.2s; box-shadow: 0 4px 12px rgba(220,38,38,0.3); display: flex; align-items: center; justify-content: center; gap: 8px;"
                    onmouseover="this.style.transform='translateY(-1px)'; this.style.boxShadow='0 6px 18px rgba(220,38,38,0.4)';"
                    onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 12px rgba(220,38,38,0.3)';">
              <span *ngIf="!deletingOrder">🗑️ Yes, Cancel Order</span>
              <span *ngIf="deletingOrder" style="display:flex; align-items:center; gap:8px;">
                <span style="width:16px; height:16px; border:2px solid white; border-top-color:transparent; border-radius:50%; display:inline-block; animation:spin 0.7s linear infinite;"></span>
                Deleting...
              </span>
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
    /* Premium Horizontal Capsule Tab Bar Styling */
    .tab-btn-pill {
      background: #F1F5F9;
      border: 1px solid #E2E8F0;
      color: #475569;
      font-weight: 700;
      padding: 10px 20px;
      border-radius: 30px;
      cursor: pointer;
      font-size: 0.88rem;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .tab-btn-pill:hover {
      background: #E2E8F0;
      color: #1E293B;
      transform: translateY(-1px);
    }

    .tab-btn-pill.active {
      background: #EE5A24;
      border-color: #EE5A24;
      color: white;
      box-shadow: 0 4px 12px rgba(238, 90, 36, 0.25);
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

    @keyframes slideUp {
      from { opacity: 0; transform: translateY(30px) scale(0.97); }
      to { opacity: 1; transform: translateY(0) scale(1); }
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    @keyframes pulse {
      0%, 100% { box-shadow: 0 8px 24px rgba(220,38,38,0.3); }
      50% { box-shadow: 0 8px 32px rgba(220,38,38,0.55); }
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

    .circulars-tab-wrapper {
      position: relative;
      background: linear-gradient(135deg, #FFFDF5 0%, #F0F9FF 100%);
      padding: 30px;
      border-radius: 24px;
      border: 3px dashed #BAE6FD;
      overflow: hidden;
      box-shadow: inset 0 0 40px rgba(224, 242, 254, 0.5);
    }
    
    .circulars-layout {
      display: grid;
      grid-template-columns: 7fr 5fr;
      gap: 25px;
      margin-top: 5px;
    }

    .circulars-card {
      background: white;
      border-radius: 16px;
      border: 1px solid #E2E8F0;
      padding: 25px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.02);
      display: flex;
      flex-direction: column;
    }

    .circulars-list {
      display: flex;
      flex-direction: column;
      gap: 15px;
      max-height: 550px;
      overflow-y: auto;
      padding-right: 5px;
    }

    .circular-item-box {
      background: #F8FAFC;
      border: 1px solid #E2E8F0;
      border-radius: 12px;
      padding: 18px;
      cursor: pointer;
      transition: all 0.2s ease-in-out;
    }

    .circular-item-box:hover {
      border-color: var(--primary);
      background: #FFFFFF;
      box-shadow: 0 10px 15px -3px rgba(0,0,0,0.05);
      transform: translateY(-2px);
    }

    .circular-item-box.selected {
      border-color: var(--primary);
      background: #FFFDF9;
      box-shadow: 0 10px 15px -3px rgba(251, 146, 60, 0.1);
    }

    .circular-item-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }

    .circular-date {
      font-size: 0.78rem;
      font-weight: 600;
      color: #94A3B8;
    }

    .circular-item-title {
      font-size: 1.05rem;
      font-weight: 800;
      color: #1E293B;
      margin: 0 0 8px 0;
      line-height: 1.3;
    }

    .circular-item-snippet {
      font-size: 0.85rem;
      color: #475569;
      margin: 0;
      line-height: 1.5;
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

    /* PREMIUM MOBILE & DEVICE RESPONSIVENESS */
    @media (max-width: 991px) {
      .dashboard-grid {
        grid-template-columns: 1fr !important;
        gap: 20px;
      }
      .dashboard-header {
        padding: 15px 24px !important;
      }
    }

    @media (max-width: 768px) {
      .dashboard-header {
        flex-direction: column;
        align-items: center;
        gap: 12px;
        padding: 15px 20px !important;
        text-align: center;
      }
      .user-profile-menu {
        width: 100%;
        justify-content: space-between;
      }
      .tabs-bar-container {
        padding: 10px 10px !important;
      }
      .tabs-bar {
        flex-wrap: nowrap !important;
        justify-content: flex-start !important;
        overflow-x: auto;
        padding-bottom: 8px;
        -webkit-overflow-scrolling: touch;
      }
      .tabs-bar::-webkit-scrollbar {
        display: none;
      }
      .tab-btn-pill {
        flex-shrink: 0;
        padding: 8px 16px !important;
        font-size: 0.8rem !important;
      }
      .dashboard-main {
        margin: 15px auto !important;
      }
      .kid-card, .card {
        padding: 16px !important;
      }
      .welcome-banner {
        padding: 16px 20px !important;
      }
      .welcome-banner h2 {
        font-size: 1.3rem !important;
      }
      .welcome-banner p {
        font-size: 0.85rem !important;
      }
      /* Make tables inside tabs side-scrollable on tiny screens */
      .table-responsive-wrapper {
        width: 100%;
        overflow-x: auto;
      }
    }
  `]
})
export class ParentDashboardComponent implements OnInit, OnDestroy {
  mediaBaseUrl = (typeof window !== 'undefined' && window.location.hostname === 'localhost') ? 'http://localhost:8000' : '';
  parentName = '';
  loginTime = '';
  clockInterval: any;
  loading = true;
  errorMessage = '';
  successMessage = '';
  dashboardData: any = null;
  activeTab = 'overview';

  // Circulars State
  circularsList: any[] = [];
  selectedCircular: any = null;
  circularsLoading = false;
 
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

  // Radar Chart Helper Methods & Hover State
  hoveredCategory: string | null = null;

  getRadarAxes(): any[] {
    const radarData = this.dashboardData?.development_radar || [];
    if (radarData.length === 0) return [];
    
    const cx = 300;
    const cy = 190;
    const maxRadius = 75;
    const N = radarData.length;
    const axes: any[] = [];
    
    for (let i = 0; i < N; i++) {
      const item = radarData[i];
      const angle = i * (360 / N);
      const angleRad = ((angle - 90) * Math.PI) / 180;
      
      const x2 = cx + maxRadius * Math.cos(angleRad);
      const y2 = cy + maxRadius * Math.sin(angleRad);
      
      const textRadius = maxRadius + 22;
      const textX = cx + textRadius * Math.cos(angleRad);
      const textY = cy + textRadius * Math.sin(angleRad);
      
      let textAnchor = 'middle';
      const angleDeg = angle % 360;
      if (angleDeg > 15 && angleDeg < 165) {
        textAnchor = 'start';
      } else if (angleDeg > 195 && angleDeg < 345) {
        textAnchor = 'end';
      }
      
      let emoji = '🎯';
      const catLower = item.category.toLowerCase();
      if (catLower.includes('cognitive')) emoji = '🧠';
      else if (catLower.includes('physical')) emoji = '🏃';
      else if (catLower.includes('emotional') || catLower.includes('social')) emoji = '🤝';
      else if (catLower.includes('creative')) emoji = '🎨';
      else if (catLower.includes('language')) emoji = '🗣️';
      
      axes.push({
        category: item.category,
        label: item.category,
        emoji: emoji,
        x1: cx,
        y1: cy,
        x2: x2,
        y2: y2,
        textX: textX,
        textY: textY,
        textAnchor: textAnchor,
        percentage: item.percentage
      });
    }
    return axes;
  }

  getRadarGridPoints(scale: number): string {
    const radarData = this.dashboardData?.development_radar || [];
    const cx = 300;
    const cy = 190;
    const maxRadius = 75;
    const N = radarData.length;
    if (N === 0) return '';
    
    const points: string[] = [];
    for (let i = 0; i < N; i++) {
      const angle = i * (360 / N);
      const angleRad = ((angle - 90) * Math.PI) / 180;
      const r = maxRadius * scale;
      points.push(`${cx + r * Math.cos(angleRad)},${cy + r * Math.sin(angleRad)}`);
    }
    return points.join(' ');
  }

  getRadarPolygonPoints(radarData: any[]): string {
    const cx = 300;
    const cy = 190;
    const maxRadius = 75;
    if (!radarData || radarData.length === 0) return `${cx},${cy} ${cx},${cy} ${cx},${cy}`;
    const N = radarData.length;
    const points: string[] = [];
    
    for (let i = 0; i < N; i++) {
      const item = radarData[i];
      const angle = i * (360 / N);
      const angleRad = ((angle - 90) * Math.PI) / 180;
      const pct = item.percentage / 100;
      const r = maxRadius * pct;
      points.push(`${cx + r * Math.cos(angleRad)},${cy + r * Math.sin(angleRad)}`);
    }
    return points.join(' ');
  }

  getRadarCircles(radarData: any[]): any[] {
    const cx = 300;
    const cy = 190;
    const maxRadius = 75;
    if (!radarData || radarData.length === 0) return [];
    const N = radarData.length;
    const circles: any[] = [];
    
    for (let i = 0; i < N; i++) {
      const item = radarData[i];
      const angle = i * (360 / N);
      const angleRad = ((angle - 90) * Math.PI) / 180;
      const pct = item.percentage / 100;
      const r = maxRadius * pct;
      circles.push({
        category: item.category,
        x: cx + r * Math.cos(angleRad),
        y: cy + r * Math.sin(angleRad)
      });
    }
    return circles;
  }




  // Weekly Menu Planner State & Methods
  mealPlansList: any[] = [];
  mealsLoading = false;
  allergenWarningFlag = false;

  loadMealsData(): void {
    this.mealsLoading = true;
    this.apiService.get<any[]>('/meals').subscribe({
      next: (data) => {
        this.mealPlansList = data;
        this.mealsLoading = false;
        this.checkAllergenWarnings();
      },
      error: (err) => {
        this.mealsLoading = false;
        console.error('Failed to load meal plans:', err);
      }
    });
  }

  checkAllergenWarnings(): void {
    if (!this.dashboardData?.kid?.allergies || this.dashboardData.kid.allergies.toLowerCase() === 'none') {
      this.allergenWarningFlag = false;
      return;
    }
    const kidAllergies = this.dashboardData.kid.allergies.toLowerCase().split(',').map((a: string) => a.trim());
    this.allergenWarningFlag = this.mealPlansList.some(meal => {
      if (!meal.allergens || meal.allergens.toLowerCase() === 'none') return false;
      const mealAllergens = meal.allergens.toLowerCase().split(',').map((a: string) => a.trim());
      return kidAllergies.some((allergy: string) => mealAllergens.includes(allergy));
    });
  }

  hasMealAllergenConflict(meal: any): boolean {
    if (!this.dashboardData?.kid?.allergies || !meal || !meal.allergens || meal.allergens.toLowerCase() === 'none') return false;
    const kidAllergies = this.dashboardData.kid.allergies.toLowerCase().split(',').map((a: string) => a.trim());
    const mealAllergens = meal.allergens.toLowerCase().split(',').map((a: string) => a.trim());
    return kidAllergies.some((allergy: string) => mealAllergens.includes(allergy));
  }

  getMealForDayAndType(day: string, type: string): any {
    return this.mealPlansList.find(meal => meal.day_of_week === day && meal.meal_type === type);
  }


  // Leave State
  leavesList: LeaveRequest[] = [];
  submittingLeave = false;
  leaveForm = {
    startDate: '',
    endDate: '',
    reason: ''
  };

  // Meal Suspension State
  suspensionsList: any[] = [];
  submittingSuspension = false;
  suspensionForm = {
    requestDate: '',
    reason: ''
  };
  activeParentRequestSubTab: 'leaves' | 'meals' = 'leaves';


  // Parent Moments State
  parentMoments: StudentMoment[] = [];
  parentMomentsLoading = false;

  // Parent Class Assignments State
  parentAssignments: ClassAssignment[] = [];
  parentAssignmentsLoading = false;
  parentAssignmentsError = '';

  // Calendar & Events State
  eventsList: any[] = [];
  holidaysList: any[] = [];
  allCalendarEvents: any[] = [];
  calendarEventsLoading = false;
  
  // Stationery Orders State
  stationaryItems: StationaryItem[] = [];
  stationaryCart: { item: StationaryItem; quantity: number }[] = [];
  stationaryOrders: StationaryOrder[] = [];
  showOrderModal = false;
  placingOrder = false;
  orderStudentName = '';
  orderClassName = '';
  orderSuccess = '';
  orderError = '';
  payingOrder: StationaryOrder | null = null;
  showStationaryPayModal = false;
  processingStationaryPayment = false;
  // --- Delete Confirmation Modal ---
  showDeleteConfirmModal = false;
  deleteConfirmOrderId: number | null = null;
  deletingOrder = false;
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
    private contentService: ContentService,
    private stationaryService: StationaryService,
    private assignmentService: AssignmentService
  ) {}

  hasPermission(feature: string): boolean {
    return this.authService.hasPermission(feature);
  }

  ngOnInit(): void {
    const updateClock = () => {
      const day = new Date().toLocaleDateString('en-US', { weekday: 'long' });
      const time = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
      this.loginTime = `${day}, ${time}`;
    };
    updateClock();
    this.clockInterval = setInterval(updateClock, 1000);
    const user = this.authService.currentUserValue;
    if (!user || user.role?.toUpperCase() !== 'PARENT') {
      this.router.navigate(['/admin/login']);
      return;
    }
    
    this.parentName = user.full_name || 'Parent';
    this.loadDashboardData();
    this.loadParentMoments();
    this.loadParentAssignments();
    this.loadCalendarData();
    this.loadStationaryOrders();
    this.loadStationaryCatalog();
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
    const permissionKeyMap: { [key: string]: string } = {
      'billing': 'finance-ledger',
      'milestones': 'milestones',
      'meals': 'meals',
      'leaves': 'leaves',
      'calendar': 'holidays',
      'circulars': 'circulars',
      'stationary': 'stationary'
    };
    const feature = permissionKeyMap[tab];
    if (feature && !this.hasPermission(feature)) {
      return;
    }
    this.activeTab = tab;
    this.errorMessage = '';
    this.successMessage = '';

    if (tab === 'billing') {
      this.loadBilling();
    } else if (tab === 'milestones') {
      this.loadMilestones();
    } else if (tab === 'meals') {
      this.loadMealsData();
    } else if (tab === 'leaves') {
      this.loadLeaves();
      this.loadMealSuspensions();
    } else if (tab === 'calendar') {
      this.loadCalendarData();
    } else if (tab === 'overview') {
      this.loadDashboardData();
    } else if (tab === 'circulars') {
      this.loadCircularsData();
    } else if (tab === 'stationary') {
      this.loadStationaryOrders();
      this.loadStationaryCatalog();
    }
  }

  loadCircularsData(): void {
    this.circularsLoading = true;
    const progId = this.dashboardData?.student?.program_id;
    this.contentService.getCirculars(progId).subscribe({
      next: (data) => {
        this.circularsList = data;
        this.circularsLoading = false;
        if (data.length > 0 && !this.selectedCircular) {
          this.selectedCircular = data[0];
        }
      },
      error: (err) => {
        this.circularsLoading = false;
        console.error('Failed to load circulars:', err);
      }
    });
  }

  selectCircular(c: any): void {
    this.selectedCircular = c;
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

  // --- STATIONERY ORDERS ---
  loadStationaryCatalog(): void {
    this.stationaryService.getItems().subscribe({
      next: (items) => { this.stationaryItems = items; },
      error: () => {}
    });
  }

  loadStationaryOrders(): void {
    this.stationaryService.getOrders().subscribe({
      next: (orders) => { this.stationaryOrders = orders; },
      error: () => {}
    });
  }

  openOrderModal(): void {
    this.orderStudentName = this.dashboardData?.kid?.name || '';
    this.orderClassName = this.dashboardData?.kid?.program_title || '';
    this.orderSuccess = '';
    this.orderError = '';
    this.showOrderModal = true;
    this.loadStationaryCatalog();
  }

  closeOrderModal(): void {
    this.showOrderModal = false;
    this.stationaryCart = [];
  }

  addStationaryToCart(item: StationaryItem, quantityInput: HTMLInputElement): void {
    const qty = parseInt(quantityInput.value, 10) || 1;
    if (qty <= 0) return;
    if (qty > item.stock) {
      alert(`Only ${item.stock} items available in stock.`);
      return;
    }
    const existing = this.stationaryCart.find(c => c.item.id === item.id);
    if (existing) {
      if (existing.quantity + qty > item.stock) {
        alert(`Cannot add more. Total stock is ${item.stock}.`);
        return;
      }
      existing.quantity += qty;
    } else {
      this.stationaryCart.push({ item, quantity: qty });
    }
    quantityInput.value = '1';
  }

  removeStationaryFromCart(index: number): void {
    this.stationaryCart.splice(index, 1);
  }

  getStationaryCartTotal(): number {
    return this.stationaryCart.reduce((acc, c) => acc + (c.item.price * c.quantity), 0);
  }

  submitStationaryOrder(): void {
    if (this.stationaryCart.length === 0) {
      this.orderError = 'Your cart is empty.';
      return;
    }
    this.placingOrder = true;
    this.orderError = '';
    this.orderSuccess = '';
    
    const payload = {
      student_name: this.orderStudentName,
      class_name: this.orderClassName,
      items: this.stationaryCart.map(c => ({ item_id: c.item.id, quantity: c.quantity }))
    };

    this.stationaryService.placeOrder(payload).subscribe({
      next: (res) => {
        this.placingOrder = false;
        this.orderSuccess = 'Order placed successfully! Awaiting teacher/admin approval.';
        this.stationaryCart = [];
        this.loadStationaryOrders();
        this.loadDashboardData(); // to sync overview history
        setTimeout(() => { this.closeOrderModal(); }, 1500);
      },
      error: (err) => {
        this.placingOrder = false;
        this.orderError = err.error?.detail || 'Failed to place order.';
      }
    });
  }

  startOrderPayment(order: StationaryOrder): void {
    this.payingOrder = order;
    this.showStationaryPayModal = true;
  }

  openDeleteConfirmModal(orderId: number): void {
    this.deleteConfirmOrderId = orderId;
    this.showDeleteConfirmModal = true;
  }

  cancelDeleteOrder(): void {
    this.showDeleteConfirmModal = false;
    this.deleteConfirmOrderId = null;
    this.deletingOrder = false;
  }

  confirmDeleteOrder(): void {
    if (!this.deleteConfirmOrderId) return;
    this.deletingOrder = true;
    this.stationaryService.deleteOrder(this.deleteConfirmOrderId).subscribe({
      next: (res) => {
        this.deletingOrder = false;
        this.showDeleteConfirmModal = false;
        this.deleteConfirmOrderId = null;
        this.successMessage = res.message || 'Order cancelled and removed successfully.';
        this.loadStationaryOrders();
        this.loadDashboardData();
        setTimeout(() => this.successMessage = '', 4000);
      },
      error: (err) => {
        this.deletingOrder = false;
        this.showDeleteConfirmModal = false;
        this.deleteConfirmOrderId = null;
        alert(err.error?.detail || 'Failed to delete order. Please try again.');
      }
    });
  }

  // Legacy alias kept for any older references
  deleteParentOrder(orderId: number): void {
    this.openDeleteConfirmModal(orderId);
  }

  closeStationaryPayModal(): void {
    this.showStationaryPayModal = false;
    this.payingOrder = null;
  }

  confirmStationaryPayment(): void {
    if (!this.payingOrder) return;
    this.processingStationaryPayment = true;
    this.apiService.put<any>(`/stationary/orders/${this.payingOrder.id}/pay`, {}).subscribe({
      next: (res) => {
        this.processingStationaryPayment = false;
        this.showStationaryPayModal = false;
        this.payingOrder = null;
        this.successMessage = 'Stationery payment completed successfully!';
        this.loadStationaryOrders();
        this.loadDashboardData();
        setTimeout(() => this.successMessage = '', 4000);
      },
      error: (err) => {
        this.processingStationaryPayment = false;
        alert(err.error?.detail || 'Payment simulation failed.');
      }
    });
  }

  getMediaUrl(url: string | null | undefined, defaultUrl: string): string {
    if (!url) return defaultUrl;
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

    if (cleaned.startsWith('http://') || cleaned.startsWith('https://')) return cleaned;
    if (cleaned.startsWith('assets/') || cleaned.startsWith('/assets/')) {
      return cleaned.startsWith('/') ? cleaned : '/' + cleaned;
    }
    const base = this.mediaBaseUrl || '';
    const separator = (base && !base.endsWith('/') && !cleaned.startsWith('/')) ? '/' : '';
    return base + separator + cleaned;
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

  loadMealSuspensions(): void {
    this.apiService.get<any[]>('/parent/meals/suspensions').subscribe({
      next: (res) => {
        this.suspensionsList = res;
      },
      error: (err) => {
        this.errorMessage = err.error?.detail || 'Failed to load meal suspension log.';
      }
    });
  }

  onSuspensionSubmit(event: Event): void {
    event.preventDefault();
    if (!this.suspensionForm.requestDate || !this.suspensionForm.reason) {
      this.errorMessage = 'Please select a date and reason.';
      return;
    }

    this.submittingSuspension = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.apiService.post<any>('/parent/meals/suspensions', {
      request_date: this.suspensionForm.requestDate,
      reason: this.suspensionForm.reason
    }).subscribe({
      next: (res) => {
        this.submittingSuspension = false;
        this.successMessage = res.message || 'Meal suspension request submitted successfully!';
        this.suspensionForm = { requestDate: '', reason: '' };
        this.loadMealSuspensions();
        setTimeout(() => this.successMessage = '', 4000);
      },
      error: (err) => {
        this.submittingSuspension = false;
        this.errorMessage = err.error?.detail || 'Failed to submit meal suspension request.';
      }
    });
  }


  getDaysKeys(): string[] {
    if (!this.dashboardData?.weekly_plan) return [];
    return Object.keys(this.dashboardData.weekly_plan);
  }

  getDayName(dayKey: string): string {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    const idx = parseInt(dayKey, 10);
    if (!isNaN(idx) && idx >= 0 && idx < days.length) {
      return days[idx];
    }
    return dayKey;
  }

  getCurrentWeekDates(): { [day: string]: string } {
    const dates: { [day: string]: string } = {};
    const today = new Date();
    const currentDay = today.getDay(); // 0 is Sunday, 1 is Monday...
    const mondayDist = currentDay === 0 ? -6 : 1 - currentDay;
    
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    for (let i = 0; i < 5; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + mondayDist + i);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      dates[days[i]] = `${yyyy}-${mm}-${dd}`;
    }
    return dates;
  }

  getHolidayForDay(dayKey: string): any {
    const dayName = this.getDayName(dayKey);
    const weekDates = this.getCurrentWeekDates();
    const targetDateStr = weekDates[dayName];
    if (!targetDateStr) return null;
    
    if (!this.holidaysList || this.holidaysList.length === 0) return null;
    return this.holidaysList.find(h => h.holiday_date === targetDateStr && h.is_active);
  }


  onImgError(event: any): void {
    event.target.onerror = null;
    event.target.src = 'assets/images/parent_avatar1.jpg';
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

  // --- PARENT DAILY CLASS ASSIGNMENTS ---
  loadParentAssignments(): void {
    const studentId = this.authService.currentUserValue?.student_id;
    if (!studentId) return;

    this.parentAssignmentsLoading = true;
    this.parentAssignmentsError = '';
    this.assignmentService.getParentAssignments(studentId).subscribe({
      next: (data) => {
        this.parentAssignments = data;
        this.parentAssignmentsLoading = false;
      },
      error: (err) => {
        this.parentAssignmentsLoading = false;
        this.parentAssignmentsError = err.error?.detail || 'Failed to load daily class assignments.';
      }
    });
  }

  // Parse files json string safely
  parseFilesList(filesJson: string): string[] {
    try {
      return JSON.parse(filesJson);
    } catch {
      return [];
    }
  }

  // Get file name from URL path
  getFileNameFromUrl(url: string): string {
    return url.substring(url.lastIndexOf('/') + 1);
  }

  ngOnDestroy(): void {
    if (this.clockInterval) {
      clearInterval(this.clockInterval);
    }
  }
}
