import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { TeacherService, TeacherAchievement } from '../../core/services/teacher.service';
import { AssignmentService, ClassAssignment } from '../../core/services/assignment.service';
import { MomentsService, StudentMoment } from '../../core/services/moments.service';
import { ContentService } from '../../core/services/content.service';
import { ApiService } from '../../core/services/api.service';

@Component({
  selector: 'app-teacher-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="teacher-dashboard-wrapper">
      <!-- Top Navigation Header -->
      <header class="dash-header">
        <div class="header-brand">
          <img src="/assets/images/logo.png" alt="Logo" style="height: 38px;" />
          <h2>Vidyankuram Club Control Panel</h2>
        </div>

        <div class="header-actions" style="display: flex; align-items: center; gap: 15px;">
          <a routerLink="/" class="btn btn-secondary btn-sm" style="padding: 6px 14px; font-weight: 700;">🌐 Visit Site</a>
          <div style="display: flex; align-items: center; gap: 10px;" *ngIf="profile">
            <!-- Dynamic Teacher Avatar -->
            <img 
              *ngIf="profile.photo_url && !imageError" 
              [src]="getMediaUrl(profile.photo_url, '')" 
              (error)="imageError = true"
              alt="Teacher Photo" 
              style="width: 38px; height: 38px; border-radius: 50%; object-fit: cover; border: 2.5px solid #EC4899; box-shadow: 0 2px 4px rgba(0,0,0,0.1);" 
            />
            <div 
              *ngIf="!profile.photo_url || imageError" 
              style="width: 38px; height: 38px; border-radius: 50%; background: linear-gradient(135deg, #EC4899, #8B5CF6); color: white; display: flex; align-items: center; justify-content: center; font-size: 1.3rem; border: 2px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.1); flex-shrink: 0;"
              [title]="profile.full_name || 'Teacher Profile'">
              👩‍🏫
            </div>
            <button (click)="logout()" class="btn btn-outline btn-sm" style="padding: 6px 14px; font-weight: 700; border: 1px solid rgba(255,255,255,0.3); color: white; background: rgba(255,255,255,0.1); border-radius: 6px; cursor: pointer;">🚪 Log Out</button>
          </div>
        </div>
      </header>

      <div class="dash-layout">
        <!-- DARK NAVY CONTROL PANEL SIDEBAR -->
        <aside class="dash-sidebar" *ngIf="profile">
          <ul class="sidebar-menu">
            <!-- 1. TEACHER CONSOLE GROUP -->
            <li class="sidebar-header" (click)="toggleTeacherConsole()" style="cursor: pointer; display: flex; justify-content: space-between; align-items: center;">
              <span>👩‍🏫 Teacher Console</span>
              <span style="font-size: 0.7rem; color: #94a3b8; font-weight: 800;">{{ teacherConsoleExpanded ? '▼' : '▶' }}</span>
            </li>
            <ng-container *ngIf="teacherConsoleExpanded">
              <li [class.active]="activeTab === 'orders'" (click)="switchTab('orders')" class="submenu-item">
                <span class="icon">📋</span> Student Orders
              </li>
              <li [class.active]="activeTab === 'pupils'" (click)="switchTab('pupils')" class="submenu-item">
                <span class="icon">👥</span> My Assigned Pupils ({{ classStudents.length }})
              </li>
              <li [class.active]="activeTab === 'kudos'" (click)="switchTab('kudos')" class="submenu-item">
                <span class="icon">⭐</span> Student Kudos
              </li>
              <li [class.active]="activeTab === 'incidents'" (click)="switchTab('incidents')" class="submenu-item">
                <span class="icon">🩺</span> Incident & Health Log
              </li>
              <li [class.active]="activeTab === 'achievements'" (click)="switchTab('achievements')" class="submenu-item">
                <span class="icon">🏆</span> Achievements Portfolio
              </li>
              <li [class.active]="activeTab === 'assignments'" (click)="switchTab('assignments')" class="submenu-item">
                <span class="icon">📚</span> Daily Assignments
              </li>
              <li [class.active]="activeTab === 'moments'" (click)="switchTab('moments')" class="submenu-item">
                <span class="icon">📸</span> Daily Moments
              </li>
            </ng-container>

            <!-- 2. SCHOOL MANAGEMENT GROUP -->
            <li class="sidebar-header" (click)="toggleSchoolManagement()" style="cursor: pointer; display: flex; justify-content: space-between; align-items: center; border-top: 1px solid rgba(255,255,255,0.08); margin-top: 14px; padding-top: 14px;">
              <span>🏫 School Management</span>
              <span style="font-size: 0.7rem; color: #94a3b8; font-weight: 800;">{{ schoolManagementExpanded ? '▼' : '▶' }}</span>
            </li>
            <ng-container *ngIf="schoolManagementExpanded">
              <li [class.active]="activeTab === 'holidays'" (click)="switchTab('holidays')" class="submenu-item">
                <span class="icon">📅</span> Holidays
              </li>
              <li [class.active]="activeTab === 'circulars'" (click)="switchTab('circulars')" class="submenu-item">
                <span class="icon">📢</span> Circulars
              </li>
              <li [class.active]="activeTab === 'library'" (click)="switchTab('library')" class="submenu-item">
                <span class="icon">📚</span> Library
              </li>
              <li [class.active]="activeTab === 'milestones'" (click)="switchTab('milestones')" class="submenu-item">
                <span class="icon">🎯</span> SetUp Milestones
              </li>
            </ng-container>

            <!-- 3. ATTENDANCE GROUP -->
            <li class="sidebar-header" (click)="toggleAttendance()" style="cursor: pointer; display: flex; justify-content: space-between; align-items: center; border-top: 1px solid rgba(255,255,255,0.08); margin-top: 14px; padding-top: 14px;">
              <span>📅 Attendance</span>
              <span style="font-size: 0.7rem; color: #94a3b8; font-weight: 800;">{{ attendanceExpanded ? '▼' : '▶' }}</span>
            </li>
            <ng-container *ngIf="attendanceExpanded">
              <li [class.active]="activeTab === 'attendance'" (click)="switchTab('attendance')" class="submenu-item">
                <span class="icon">📅</span> Student Attendance
              </li>
            </ng-container>

            <!-- 4. PARENT REQUESTS GROUP -->
            <li class="sidebar-header" (click)="toggleParentRequests()" style="cursor: pointer; display: flex; justify-content: space-between; align-items: center; border-top: 1px solid rgba(255,255,255,0.08); margin-top: 14px; padding-top: 14px;">
              <span>📋 Parent Requests</span>
              <span style="font-size: 0.7rem; color: #94a3b8; font-weight: 800;">{{ parentRequestsExpanded ? '▼' : '▶' }}</span>
            </li>
            <ng-container *ngIf="parentRequestsExpanded">
              <li [class.active]="activeTab === 'leaves'" (click)="switchTab('leaves')" class="submenu-item">
                <span class="icon">📋</span> Parent Requests
              </li>
            </ng-container>
          </ul>
        </aside>

        <!-- Main Dashboard Main Content Area -->
        <main class="dash-main-content" *ngIf="profile">
        <!-- Banner Section -->
        <div class="welcome-banner" style="display: flex; flex-direction: column; gap: 20px; padding: 28px 32px;">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; width: 100%; flex-wrap: wrap; gap: 15px;">
            <div style="flex: 1; min-width: 300px;">
              <h2 style="margin: 0; font-size: 1.75rem; font-weight: 900; background: linear-gradient(135deg, #EC4899, #8B5CF6); -webkit-background-clip: text; -webkit-text-fill-color: transparent; filter: drop-shadow(0px 2px 4px rgba(139, 92, 246, 0.1)); display: inline-block;">Welcome back, {{ profile.full_name }}! 👋</h2>
              <p style="margin: 6px 0 0 0; color: #475569; font-size: 0.9rem;">Manage your classroom, track pupil requests, approve stationery orders, and upload your professional credentials.</p>
            </div>
            
            <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 6px; text-align: right;">
              <span style="background: #e0f2fe; color: #0369a1; border: 1px solid #bae6fd; padding: 4px 14px; border-radius: 9999px; font-size: 0.72rem; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; display: inline-block;">
                👩‍🏫 Teacher Portal
              </span>
              <span style="font-size: 0.75rem; color: #475569; font-family: monospace; font-weight: 700; background: white; border: 1px solid #e2e8f0; padding: 3px 8px; border-radius: 6px; box-shadow: 0 1px 2px rgba(0,0,0,0.02);">
                🕒 Clock: {{ loginTime }}
              </span>
            </div>
          </div>

          <!-- Professional Teacher Bio/Description Card Block -->
          <div class="teacher-profile-card-block" style="background: rgba(255, 255, 255, 0.75); border: 1px solid rgba(226, 232, 240, 0.8); border-radius: 12px; padding: 18px; backdrop-filter: blur(8px); display: flex; flex-direction: column; gap: 10px; width: 100%; box-sizing: border-box; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.02);">
            <div style="display: flex; gap: 8px; align-items: center; border-bottom: 1.5px dashed #cbd5e1; padding-bottom: 6px; margin-bottom: 4px;">
              <span style="font-size: 1.1rem;">💼</span>
              <h4 style="margin: 0; font-size: 0.82rem; font-weight: 800; text-transform: uppercase; color: #334155; letter-spacing: 0.5px;">Professional Credentials Profile</h4>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1.6fr; gap: 20px;">
              <div>
                <div style="font-size: 0.68rem; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">Education & Certifications</div>
                <div style="font-size: 0.8rem; font-weight: 700; color: #1e293b; margin-top: 3px; line-height: 1.4;">{{ profile.education || 'Master of Early Childhood Education & Pedagogy' }}</div>
              </div>
              <div style="border-left: 1.5px solid #e2e8f0; padding-left: 20px;">
                <div style="font-size: 0.68rem; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">Pedagogical Experience & Expertise</div>
                <div style="font-size: 0.8rem; font-weight: 600; color: #475569; margin-top: 3px; line-height: 1.4;">{{ profile.experience || '10+ years specializing in developmental progression and Montessori sensory learning.' }}</div>
              </div>
            </div>
            <div *ngIf="profile.achievements_summary" style="border-top: 1.5px dashed #cbd5e1; padding-top: 8px; margin-top: 4px;">
              <div style="font-size: 0.68rem; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 3px;">Awards & Distinctions Summary</div>
              <div style="font-size: 0.78rem; font-weight: 700; color: var(--primary); line-height: 1.4;">{{ profile.achievements_summary }}</div>
            </div>
          </div>
          
          <!-- Key Indicators -->
          <div class="stats-cards-grid" style="width: 100%;">
            <div class="stat-card pink" (click)="openPupilsModal()" style="cursor: pointer;" title="Click to view your assigned pupils roster">
              <span class="stat-num">{{ stats.students_count }}</span>
              <span class="stat-label">👥 Pupils</span>
            </div>
            <div class="stat-card blue">
              <span class="stat-num">{{ stats.moments_count }}</span>
              <span class="stat-label">📸 Moments</span>
            </div>
            <div class="stat-card green">
              <span class="stat-num">{{ stats.assignments_count }}</span>
              <span class="stat-label">📚 Assignments</span>
            </div>
            <div class="stat-card purple">
              <span class="stat-num">{{ stats.achievements_count }}</span>
              <span class="stat-label">🏆 Awards</span>
            </div>
          </div>
        </div>


        <!-- TAB CONTENT VIEWS -->

        <!-- MY ASSIGNED PUPILS TAB -->
        <div class="tab-content" *ngIf="activeTab === 'pupils'">
          <div class="card" style="padding: 24px;">
            <div class="card-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
              <div>
                <h3 style="margin: 0; font-size: 1.25rem; font-weight: 800; color: #0f172a;">👥 My Assigned Pupils Roster</h3>
                <p style="margin: 4px 0 0 0; color: #64748b; font-size: 0.85rem;">Class: <strong>{{ profile?.assigned_program?.title || 'Your Class' }}</strong> — Showing only pupils assigned to <strong>{{ profile?.full_name }}</strong></p>
              </div>
              <button (click)="loadClassStudents()" class="btn btn-secondary btn-sm">🔄 Refresh Roster</button>
            </div>

            <div *ngIf="classStudents.length === 0" class="loading-state" style="text-align: center; padding: 40px; color: #94a3b8; font-style: italic;">
              No pupils currently assigned to you in this class roster.
            </div>

            <div *ngIf="classStudents.length > 0" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px;">
              <div *ngFor="let student of classStudents" style="background: #f8fafc; border: 1.5px solid #e2e8f0; border-radius: 12px; padding: 18px;">
                <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
                  <span style="font-size: 2rem; background: white; width: 48px; height: 48px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 1.5px solid #e2e8f0;">👦</span>
                  <div>
                    <h4 style="margin: 0; font-size: 1.05rem; font-weight: 800; color: #0f172a;">{{ student.name }}</h4>
                    <span style="background: #dcfce7; color: #15803d; font-size: 0.7rem; font-weight: 800; padding: 2px 8px; border-radius: 4px; display: inline-block; margin-top: 3px;">
                      ✓ Assigned to You
                    </span>
                  </div>
                </div>

                <div style="display: flex; flex-direction: column; gap: 8px; font-size: 0.82rem; color: #475569; border-top: 1px solid #e2e8f0; padding-top: 12px;">
                  <div style="display: flex; justify-content: space-between;">
                    <span style="color: #64748b; font-weight: 600;">Parent Name:</span>
                    <strong style="color: #1e293b;">{{ student.parent_name || 'N/A' }}</strong>
                  </div>
                  <div style="display: flex; justify-content: space-between;">
                    <span style="color: #64748b; font-weight: 600;">Phone Contact:</span>
                    <strong style="color: #2563eb;">{{ student.phone || 'N/A' }}</strong>
                  </div>
                  <div *ngIf="student.date_of_birth" style="display: flex; justify-content: space-between;">
                    <span style="color: #64748b; font-weight: 600;">Date of Birth:</span>
                    <span>{{ student.date_of_birth }}</span>
                  </div>
                  <div *ngIf="student.blood_group" style="display: flex; justify-content: space-between;">
                    <span style="color: #64748b; font-weight: 600;">Blood Group:</span>
                    <span style="color: #dc2626; font-weight: 700;">{{ student.blood_group }}</span>
                  </div>
                  <div *ngIf="student.allergies" style="margin-top: 6px; background: #fee2e2; border: 1px solid #fca5a5; color: #dc2626; padding: 6px 10px; border-radius: 6px; font-size: 0.78rem; font-weight: 700;">
                    ⚠️ Allergy: {{ student.allergies }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- STUDENT KUDOS & BADGES TAB -->
        <div class="tab-content" *ngIf="activeTab === 'kudos'">
          <div class="card" style="padding: 24px;">
            <div class="card-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 10px;">
              <div>
                <h3 style="margin: 0; font-size: 1.25rem; font-weight: 800; color: #0F172A;">⭐ Award Student Kudos & Star Badges</h3>
                <p style="margin: 4px 0 0 0; color: #64748B; font-size: 0.85rem;">Recognize positive behavior, participation, and achievements. Badges are immediately visible to parents.</p>
              </div>
              <button (click)="loadKudos()" class="btn btn-secondary btn-sm">🔄 Refresh Badges</button>
            </div>

            <!-- Form & Timeline Layout -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px;">
              <!-- Award Badge Form -->
              <div style="background: #F8FAFC; border: 1.5px solid #E2E8F0; border-radius: 12px; padding: 20px;">
                <h4 style="margin: 0 0 16px 0; font-size: 1rem; font-weight: 800; color: #1E293B;">✨ Award Badge to Student</h4>

                <div class="form-group" style="margin-bottom: 16px;">
                  <label style="font-weight: 700; font-size: 0.85rem; color: #475569; display: block; margin-bottom: 6px;">Select Assigned Pupil *</label>
                  <select [(ngModel)]="kudosSelectedStudentId" class="form-control" style="width: 100%; border-radius: 8px; font-weight: 600;">
                    <option [ngValue]="null" disabled>-- Choose Student --</option>
                    <option *ngFor="let s of classStudents" [value]="s.id">👦 {{ s.name }}</option>
                  </select>
                </div>

                <div class="form-group" style="margin-bottom: 16px;">
                  <label style="font-weight: 700; font-size: 0.85rem; color: #475569; display: block; margin-bottom: 6px;">Select Badge Category *</label>
                  <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px;">
                    <div *ngFor="let b of badgeOptions" 
                         (click)="selectedBadgeType = b.type"
                         [style.border]="selectedBadgeType === b.type ? '2px solid #2563EB' : '1.5px solid #CBD5E1'"
                         [style.background]="selectedBadgeType === b.type ? '#EFF6FF' : 'white'"
                         style="padding: 10px; border-radius: 8px; cursor: pointer; transition: all 0.2s;">
                      <div style="font-weight: 800; font-size: 0.88rem; color: #0F172A;">{{ b.title }}</div>
                      <div style="font-size: 0.72rem; color: #64748B; margin-top: 3px;">{{ b.desc }}</div>
                    </div>
                  </div>
                </div>

                <div class="form-group" style="margin-bottom: 18px;">
                  <label style="font-weight: 700; font-size: 0.85rem; color: #475569; display: block; margin-bottom: 6px;">Praise Note / Teacher Comment (Optional)</label>
                  <textarea [(ngModel)]="newKudosComment" rows="2" class="form-control" placeholder="e.g. Aarav did an amazing job sharing toys and helping clean up!" style="width: 100%; border-radius: 8px; font-size: 0.85rem;"></textarea>
                </div>

                <button (click)="awardKudos()" class="btn btn-primary" style="width: 100%; padding: 12px; font-weight: 700; border-radius: 8px; background: linear-gradient(135deg, #2563EB, #1D4ED8); border: none; color: white; cursor: pointer;">
                  ⭐ Award Star Badge
                </button>
              </div>

              <!-- Awarded Badges List -->
              <div>
                <h4 style="margin: 0 0 16px 0; font-size: 1rem; font-weight: 800; color: #1E293B;">🏆 Recent Awarded Badges</h4>

                <div *ngIf="kudosLoading" style="text-align: center; padding: 40px; color: #64748B;">Loading badges...</div>

                <div *ngIf="!kudosLoading && kudosList.length === 0" style="text-align: center; padding: 40px; color: #94A3B8; font-style: italic; border: 2px dashed #E2E8F0; border-radius: 12px;">
                  No star badges awarded yet. Select a pupil and award their first badge!
                </div>

                <div *ngIf="!kudosLoading && kudosList.length > 0" style="display: flex; flex-direction: column; gap: 12px; max-height: 440px; overflow-y: auto;">
                  <div *ngFor="let k of kudosList" style="background: white; border: 1.5px solid #E2E8F0; border-radius: 10px; padding: 14px; display: flex; justify-content: space-between; align-items: flex-start;">
                    <div>
                      <div style="display: flex; align-items: center; gap: 8px;">
                        <span style="font-size: 1.2rem;">{{ k.badge_title }}</span>
                        <strong style="font-size: 0.9rem; color: #0F172A;">for {{ k.student_name }}</strong>
                      </div>
                      <p *ngIf="k.comment" style="margin: 6px 0 0 0; font-size: 0.8rem; color: #475569; font-style: italic;">
                        "{{ k.comment }}"
                      </p>
                      <span style="font-size: 0.7rem; color: #94A3B8; display: block; margin-top: 6px;">Awarded on: {{ k.awarded_date }}</span>
                    </div>
                    <button (click)="deleteKudosBadge(k.id)" style="background: #FEE2E2; color: #DC2626; border: none; padding: 4px 8px; border-radius: 6px; font-weight: 700; font-size: 0.75rem; cursor: pointer;">
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- INCIDENT & HEALTH LOG TAB -->
        <div class="tab-content" *ngIf="activeTab === 'incidents'">
          <div class="card" style="padding: 24px;">
            <div class="card-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 10px;">
              <div>
                <h3 style="margin: 0; font-size: 1.25rem; font-weight: 800; color: #0F172A;">🩺 Classroom Incident & Health Log</h3>
                <p style="margin: 4px 0 0 0; color: #64748B; font-size: 0.85rem;">Record minor playground scrapes, health checkups, temperature readings, or lunch records. Keeps parents informed.</p>
              </div>
              <button (click)="loadIncidents()" class="btn btn-secondary btn-sm">🔄 Refresh Logs</button>
            </div>

            <!-- Form & Log List Layout -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px;">
              <!-- Log Entry Form -->
              <div style="background: #F8FAFC; border: 1.5px solid #E2E8F0; border-radius: 12px; padding: 20px;">
                <h4 style="margin: 0 0 16px 0; font-size: 1rem; font-weight: 800; color: #1E293B;">📝 Record New Incident / Health Note</h4>

                <div class="form-group" style="margin-bottom: 14px;">
                  <label style="font-weight: 700; font-size: 0.85rem; color: #475569; display: block; margin-bottom: 6px;">Select Pupil *</label>
                  <select [(ngModel)]="incidentSelectedStudentId" class="form-control" style="width: 100%; border-radius: 8px; font-weight: 600;">
                    <option [ngValue]="null" disabled>-- Choose Student --</option>
                    <option *ngFor="let s of classStudents" [value]="s.id">👦 {{ s.name }}</option>
                  </select>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 14px;">
                  <div class="form-group">
                    <label style="font-weight: 700; font-size: 0.85rem; color: #475569; display: block; margin-bottom: 6px;">Category *</label>
                    <select [(ngModel)]="newIncident.category" class="form-control" style="width: 100%; border-radius: 8px; font-size: 0.85rem;">
                      <option *ngFor="let cat of incidentCategories" [value]="cat.code">{{ cat.label }}</option>
                    </select>
                  </div>
                  <div class="form-group">
                    <label style="font-weight: 700; font-size: 0.85rem; color: #475569; display: block; margin-bottom: 6px;">Severity</label>
                    <select [(ngModel)]="newIncident.severity" class="form-control" style="width: 100%; border-radius: 8px; font-size: 0.85rem;">
                      <option value="LOW">🟢 Low (Routine)</option>
                      <option value="MEDIUM">🟡 Medium (Note Parent)</option>
                      <option value="HIGH">🔴 High (Attention)</option>
                    </select>
                  </div>
                </div>

                <div class="form-group" style="margin-bottom: 14px;">
                  <label style="font-weight: 700; font-size: 0.85rem; color: #475569; display: block; margin-bottom: 6px;">Report Title *</label>
                  <input [(ngModel)]="newIncident.title" type="text" class="form-control" placeholder="e.g. Minor Knee Scrape at Playground" style="width: 100%; border-radius: 8px; font-size: 0.85rem;" />
                </div>

                <div class="form-group" style="margin-bottom: 14px;">
                  <label style="font-weight: 700; font-size: 0.85rem; color: #475569; display: block; margin-bottom: 6px;">Description / Observations *</label>
                  <textarea [(ngModel)]="newIncident.description" rows="2" class="form-control" placeholder="e.g. Fell during outdoor play time. Minor superficial scratch on right knee." style="width: 100%; border-radius: 8px; font-size: 0.85rem;"></textarea>
                </div>

                <div class="form-group" style="margin-bottom: 18px;">
                  <label style="font-weight: 700; font-size: 0.85rem; color: #475569; display: block; margin-bottom: 6px;">Action Taken / First Aid</label>
                  <input [(ngModel)]="newIncident.action_taken" type="text" class="form-control" placeholder="e.g. Cleaned with antiseptic wipe and applied cartoon band-aid." style="width: 100%; border-radius: 8px; font-size: 0.85rem;" />
                </div>

                <button (click)="logIncident()" class="btn btn-primary" style="width: 100%; padding: 12px; font-weight: 700; border-radius: 8px; background: linear-gradient(135deg, #0F172A, #1E293B); border: none; color: white; cursor: pointer;">
                  📋 Save Incident / Health Record
                </button>
              </div>

              <!-- Log History List -->
              <div>
                <h4 style="margin: 0 0 16px 0; font-size: 1rem; font-weight: 800; color: #1E293B;">📋 Class Incident & Care Log</h4>

                <div *ngIf="incidentsLoading" style="text-align: center; padding: 40px; color: #64748B;">Loading incident logs...</div>

                <div *ngIf="!incidentsLoading && incidentsList.length === 0" style="text-align: center; padding: 40px; color: #94A3B8; font-style: italic; border: 2px dashed #E2E8F0; border-radius: 12px;">
                  No incident logs recorded yet.
                </div>

                <div *ngIf="!incidentsLoading && incidentsList.length > 0" style="display: flex; flex-direction: column; gap: 12px; max-height: 480px; overflow-y: auto;">
                  <div *ngFor="let inc of incidentsList" style="background: white; border: 1.5px solid #E2E8F0; border-radius: 10px; padding: 14px;">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 6px;">
                      <div>
                        <span [style.background]="inc.severity === 'HIGH' ? '#FEE2E2' : inc.severity === 'MEDIUM' ? '#FEF3C7' : '#DCFCE7'"
                              [style.color]="inc.severity === 'HIGH' ? '#991B1B' : inc.severity === 'MEDIUM' ? '#92400E' : '#166534'"
                              style="font-size: 0.68rem; font-weight: 800; padding: 2px 8px; border-radius: 4px; display: inline-block; text-transform: uppercase;">
                          {{ inc.severity }} SEVERITY
                        </span>
                        <h5 style="margin: 4px 0 0 0; font-size: 0.92rem; font-weight: 800; color: #0F172A;">
                          {{ inc.title }} <span style="font-weight: 600; color: #64748B;">({{ inc.student_name }})</span>
                        </h5>
                      </div>
                      <button (click)="deleteIncidentLog(inc.id)" style="background: #FEE2E2; color: #DC2626; border: none; padding: 4px 8px; border-radius: 6px; font-weight: 700; font-size: 0.75rem; cursor: pointer;">
                        🗑️
                      </button>
                    </div>
                    <p style="margin: 0 0 6px 0; font-size: 0.8rem; color: #334155; line-line: 1.4;">
                      {{ inc.description }}
                    </p>
                    <div *ngIf="inc.action_taken" style="background: #F8FAFC; border-left: 3px solid #2563EB; padding: 6px 10px; border-radius: 0 4px 4px 0; font-size: 0.76rem; color: #1E40AF; margin-bottom: 6px;">
                      <strong>Action Taken:</strong> {{ inc.action_taken }}
                    </div>
                    <span style="font-size: 0.7rem; color: #94A3B8;">Recorded on: {{ inc.log_date }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 1. STUDENT STATIONERY ORDERS TAB (Requirement 5) -->
        <div class="tab-content" *ngIf="activeTab === 'orders'">
          <div class="card">
            <div class="card-header">
              <h3>📋 Parent Stationery Orders (For Your Assigned Class)</h3>
              <button (click)="loadOrders()" class="btn btn-secondary btn-sm">🔄 Refresh List</button>
            </div>
            
            <div *ngIf="ordersLoading" class="loading-state">Loading student orders...</div>

            <!-- Orders Table Grid -->
            <div class="table-responsive" *ngIf="!ordersLoading && ordersList.length > 0">
              <table class="dashboard-table">
                <thead>
                  <tr>
                    <th>Order Date</th>
                    <th>Pupil Name</th>
                    <th>Stationery Items</th>
                    <th>Total Price</th>
                    <th>Payment Status</th>
                    <th>Approval Status</th>
                    <th style="text-align: center;">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let order of ordersList" [style.background]="order.status === 'Rejected' ? '#fcf8f8' : 'white'">
                    <td class="bold">{{ order.order_date | date:'short' }}</td>
                    <td class="bold" style="color: var(--secondary);">{{ order.student_name }}</td>
                    <td>
                      <div *ngFor="let item of order.items" class="table-item-desc">
                        ✏️ {{ item.item?.name || item.name || 'Supply Item' }} × {{ item.quantity }}
                      </div>
                    </td>
                    <td class="bold">₹{{ order.total_price }}</td>
                    <td>
                      <span class="badge" [style.background]="order.payment_status === 'Paid' ? '#dcfce7' : '#fee2e2'" [style.color]="order.payment_status === 'Paid' ? '#166534' : '#991b1b'">
                        {{ order.payment_status }}
                      </span>
                    </td>
                    <td>
                      <span class="badge" [style.background]="order.status === 'Delivered' ? '#dcfce7' : order.status === 'Dispatched' ? '#e0f2fe' : order.status === 'Rejected' ? '#fee2e2' : '#fef3c7'" [style.color]="order.status === 'Delivered' ? '#166534' : order.status === 'Dispatched' ? '#0369a1' : order.status === 'Rejected' ? '#991b1b' : '#d97706'">
                        {{ order.status }}
                      </span>
                    </td>
                    <td>
                      <div class="actions-row" *ngIf="order.status.toUpperCase() === 'PENDING'">
                        <button (click)="approveStationeryOrder(order.id)" class="btn btn-success btn-xs" style="font-weight:700;">✅ Approve</button>
                        <button (click)="rejectStationeryOrder(order.id)" class="btn btn-danger btn-xs" style="font-weight:700;">❌ Reject</button>
                      </div>
                      <div *ngIf="order.status.toUpperCase() !== 'PENDING'" class="text-completed">
                        Processed
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Empty State -->
            <div class="empty-state" *ngIf="!ordersLoading && ordersList.length === 0">
              No parent stationery orders placed yet for your class.
            </div>
          </div>
        </div>

        <!-- 2. TEACHER ACHIEVEMENTS TAB (Requirement 3) -->
        <div class="tab-content" *ngIf="activeTab === 'achievements'">
          <div class="grid-two-cols">
            <!-- Upload Achievement Form -->
            <div class="card">
              <h3>🎖️ Log New Professional Achievement</h3>
              <p class="subtitle">Add pedagogical certificates, training badges, or national awards to your dashboard portfolio.</p>

              <form (ngSubmit)="saveAchievement()" style="margin-top: 15px;">
                <div class="form-group">
                  <label class="form-label">Award/Certificate Title</label>
                  <input type="text" [(ngModel)]="newAchievement.title" name="ach_title" placeholder="e.g. Certified Montessori Educator" class="form-control" required />
                </div>
                <div class="form-group">
                  <label class="form-label">Awarding Date</label>
                  <input type="date" [(ngModel)]="newAchievement.date" name="ach_date" class="form-control" required />
                </div>
                <div class="form-group">
                  <label class="form-label">Description / Context (Optional)</label>
                  <textarea [(ngModel)]="newAchievement.description" name="ach_desc" placeholder="Details about this pedagogical credential..." class="form-control" style="min-height: 80px;"></textarea>
                </div>
                <div class="form-group">
                  <label class="form-label">Upload Certificate (PDF or Image)</label>
                  <input type="file" id="certificateFile" (change)="onCertificateSelected($event)" class="form-control" style="padding: 6px 0;" />
                </div>

                <button type="submit" [disabled]="savingAchievement" class="btn btn-primary btn-sm" style="width: 100%; margin-top: 10px; height: 42px;">
                  {{ savingAchievement ? 'Uploading Certificate...' : '💾 Save & Upload' }}
                </button>
              </form>
            </div>

            <!-- Achievements Grid -->
            <div class="card">
              <h3>🏆 Credentials Portfolio Log</h3>
              
              <div *ngIf="achievementsLoading" class="loading-state">Loading achievements...</div>

              <div class="achievements-list" *ngIf="!achievementsLoading && achievementsList.length > 0">
                <div class="achievement-item" *ngFor="let ach of achievementsList">
                  <div class="ach-header">
                    <h4>🎖️ {{ ach.title }}</h4>
                    <span class="ach-date">📅 {{ ach.date }}</span>
                  </div>
                  <p class="ach-desc" *ngIf="ach.description">{{ ach.description }}</p>
                  
                  <div class="ach-footer">
                    <!-- Certificate link if exists -->
                    <a *ngIf="ach.certificate_url" [href]="getMediaUrl(ach.certificate_url, '')" target="_blank" class="certificate-link">
                      📄 View Certificate Document
                    </a>
                    <span *ngIf="!ach.certificate_url" class="no-doc">No document attached</span>

                    <button (click)="deleteAchievement(ach.id)" class="btn-delete-link" title="Delete Achievement">🗑️ Delete</button>
                  </div>
                </div>
              </div>

              <!-- Empty Portfolio -->
              <div class="empty-state" *ngIf="!achievementsLoading && achievementsList.length === 0">
                No achievements recorded yet. Use the form to build your credentials board!
              </div>
            </div>
          </div>
        </div>

        <!-- 3. CLASS ASSIGNMENTS TAB -->
        <div class="tab-content" *ngIf="activeTab === 'assignments'">
          <div class="grid-two-cols">
            <!-- Add Assignment Form -->
            <div class="card">
              <h3>📤 Upload Class Homework Worksheet</h3>
              <p class="subtitle">Upload worksheet documents, study guides, templates, or instructions for your pupil logins.</p>

              <form (ngSubmit)="uploadAssignment()" style="margin-top: 15px;">
                <div class="form-group">
                  <label class="form-label">Assignment Title</label>
                  <input type="text" [(ngModel)]="newAssignment.title" name="asg_title" placeholder="e.g. English Alphabet Writing Sheet" class="form-control" required />
                </div>
                <div class="form-group">
                  <label class="form-label">Deadline / Date</label>
                  <input type="date" [(ngModel)]="newAssignment.date" name="asg_date" class="form-control" required />
                </div>
                <div class="form-group">
                  <label class="form-label">Special Instructions (Optional)</label>
                  <textarea [(ngModel)]="newAssignment.description" name="asg_desc" placeholder="Write additional directions..." class="form-control" style="min-height: 80px;"></textarea>
                </div>
                <div class="form-group">
                  <label class="form-label">Select Files (XLSX, PDF, Docx, or Images)</label>
                  <input type="file" id="assignmentFiles" (change)="onAssignmentFilesSelected($event)" multiple class="form-control" style="padding: 6px 0;" />
                  <div *ngIf="assignmentFileNames.length > 0" class="file-names-preview">
                    Selected: {{ assignmentFileNames.join(', ') }}
                  </div>
                </div>

                <button type="submit" [disabled]="uploadingAssignment" class="btn btn-secondary btn-sm" style="width:100%; margin-top: 10px; height: 42px;">
                  {{ uploadingAssignment ? 'Uploading Worksheet...' : '📤 Upload Assignment' }}
                </button>
              </form>
            </div>

            <!-- Uploaded Assignments list -->
            <div class="card">
              <h3>📋 Uploaded Homework Log</h3>
              
              <div *ngIf="assignmentsLoading" class="loading-state">Loading classroom assignments...</div>

              <div class="assignments-timeline" *ngIf="!assignmentsLoading && assignmentsList.length > 0">
                <div class="assignment-card-item" *ngFor="let asg of assignmentsList">
                  <div class="asg-header">
                    <h4>📚 {{ asg.title }}</h4>
                    <span class="asg-date">Date: {{ asg.date }}</span>
                  </div>
                  <p class="asg-desc" *ngIf="asg.description">{{ asg.description }}</p>
                  
                  <div class="asg-files-list">
                    <div *ngFor="let file of parseFilesList(asg.files_json)" class="asg-file-pill">
                      <a [href]="getMediaUrl(file, '')" target="_blank" [title]="getFileNameFromUrl(file)">📄 {{ getFileNameFromUrl(file) }}</a>
                    </div>
                  </div>

                  <div class="asg-footer">
                    <span class="asg-by">Uploaded: {{ asg.created_at | date:'shortDate' }}</span>
                    <button (click)="deleteAssignment(asg.id)" class="btn btn-danger btn-xs">🗑️ Delete</button>
                  </div>
                </div>
              </div>

              <!-- Empty state -->
              <div class="empty-state" *ngIf="!assignmentsLoading && assignmentsList.length === 0">
                No class homework worksheets uploaded yet.
              </div>
            </div>
          </div>
        </div>

        <!-- 4. CLASS MOMENTS TAB -->
        <div class="tab-content" *ngIf="activeTab === 'moments'">
          <div class="grid-two-cols">
            <!-- Share Moment Form -->
            <div class="card">
              <h3>📸 Share Class Daily Moments</h3>
              <p class="subtitle">Select a pupil in your class, then upload school pictures or classroom play clips. Expirable in 2 days.</p>

              <form (ngSubmit)="uploadMoment()" style="margin-top: 15px;">
                <div class="form-group">
                  <label class="form-label">Select Pupil</label>
                  <select [(ngModel)]="momentSelectedStudentId" (change)="loadMoments()" name="mom_student" class="form-control" required>
                    <option [value]="null" disabled selected>-- Select Pupil --</option>
                    <option *ngFor="let student of classStudents" [value]="student.id">{{ student.name }}</option>
                  </select>
                </div>
                <div class="form-group" *ngIf="momentSelectedStudentId">
                  <label class="form-label">Moment Caption / Title</label>
                  <input type="text" [(ngModel)]="newMoment.title" name="mom_title" placeholder="e.g. Finger painting fun!" class="form-control" required />
                </div>
                <div class="form-group" *ngIf="momentSelectedStudentId">
                  <label class="form-label">Choose Photos / Videos</label>
                  <input type="file" id="momentFiles" (change)="onMomentFilesSelected($event)" multiple class="form-control" style="padding: 6px 0;" />
                  <div *ngIf="momentFileNames.length > 0" class="file-names-preview">
                    Selected: {{ momentFileNames.join(', ') }}
                  </div>
                </div>

                <button *ngIf="momentSelectedStudentId" type="submit" [disabled]="uploadingMoment" class="btn btn-primary btn-sm" style="width:100%; margin-top: 10px; height: 42px;">
                  {{ uploadingMoment ? 'Sharing Daily Snapshots...' : '📸 Post Moments' }}
                </button>
              </form>
            </div>

            <!-- Active Moments List -->
            <div class="card">
              <h3>🎥 Active Daily Moments</h3>
              
              <div *ngIf="momentsLoading" class="loading-state">Loading moments...</div>

              <div *ngIf="!momentSelectedStudentId" class="empty-state">
                Please select a pupil to view or post active daily moments.
              </div>

              <div class="moments-flex-grid" *ngIf="!momentsLoading && momentSelectedStudentId && momentsList.length > 0">
                <div class="moment-thumbnail-card" *ngFor="let mom of momentsList">
                  <div class="moment-media-box">
                    <img *ngIf="mom.file_type === 'image'" [src]="getMediaUrl(mom.file_path, '')" alt="Moment Photo" />
                    <video *ngIf="mom.file_type === 'video'" [src]="getMediaUrl(mom.file_path, '')" controls></video>
                    <span class="expire-tag">⏰ {{ mom.hours_remaining }}h left</span>
                  </div>
                  <div class="moment-details">
                    <h5>{{ mom.title }}</h5>
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-top:8px;">
                      <span class="m-date">{{ mom.created_at | date:'shortTime' }}</span>
                      <button (click)="deleteMoment(mom.id)" class="btn btn-danger btn-xs" style="padding:2px 6px;">🗑️ Delete</button>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Empty state -->
              <div class="empty-state" *ngIf="!momentsLoading && momentSelectedStudentId && momentsList.length === 0">
                No moments shared for this pupil today.
              </div>
            </div>
          </div>
        </div>

        <!-- SCHOOL CIRCULARS MANAGEMENT TAB (SAME AS ADMIN LOGIN) -->
        <div class="tab-content animate-fade-in" *ngIf="activeTab === 'circulars'">
          <div class="tab-header" style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #E2E8F0; padding-bottom: 15px; margin-bottom: 20px;">
            <div>
              <h2 style="margin: 0; color: #0F172A; font-weight: 800; font-size: 1.3rem;">📢 School Circulars Management</h2>
              <p style="margin: 3px 0 0 0; color: #64748B; font-size: 0.88rem;">Create and publish official announcements and school circulars for parents and staff.</p>
            </div>
            <button (click)="loadCirculars()" class="btn btn-secondary" style="padding: 8px 16px; font-weight: 700; border-radius: 8px;">🔄 Refresh Circulars</button>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 2fr; gap: 24px; margin-bottom: 24px;">
            <!-- Left Panel: Create/Edit Circular Form -->
            <div class="card" style="background: white; border-radius: 12px; border: 1.5px solid #E2E8F0; padding: 22px; box-shadow: 0 4px 6px rgba(0,0,0,0.02);">
              <h3 style="margin-top: 0; color: #0F172A; margin-bottom: 16px; font-size: 1.1rem; font-weight: 800; border-bottom: 1px solid #F1F5F9; padding-bottom: 10px;">
                {{ editingCircularId ? '✏️ Edit Circular' : '📝 Publish New Circular' }}
              </h3>
              
              <form (ngSubmit)="saveCircular()">
                <div class="form-group" style="margin-bottom: 14px;">
                  <label class="form-label" style="display: block; font-weight: 700; font-size: 0.82rem; color: #475569; margin-bottom: 5px;">Circular Title *</label>
                  <input type="text" [(ngModel)]="newCircular.title" name="c_title" required class="form-control" placeholder="e.g. Science Exhibition Guidelines" style="width: 100%; border: 1.5px solid #CBD5E1; border-radius: 6px; padding: 8px 12px;" />
                </div>

                <div class="form-group" style="margin-bottom: 14px;">
                  <label class="form-label" style="display: block; font-weight: 700; font-size: 0.82rem; color: #475569; margin-bottom: 5px;">Target Class (Program) *</label>
                  <select [(ngModel)]="newCircular.program_id" name="c_program" class="form-control" style="width: 100%; border: 1.5px solid #CBD5E1; border-radius: 6px; padding: 8px 12px; background-color: white; cursor: pointer;">
                    <option [ngValue]="null">📢 All Classes (School-Wide)</option>
                    <option *ngFor="let prog of programsList" [value]="prog.id">🏫 {{ prog.title }}</option>
                  </select>
                </div>

                <div class="form-group" style="margin-bottom: 14px;">
                  <label class="form-label" style="display: block; font-weight: 700; font-size: 0.82rem; color: #475569; margin-bottom: 5px;">Circular Content / Body *</label>
                  <textarea [(ngModel)]="newCircular.content" name="c_content" required class="form-control" style="width: 100%; border: 1.5px solid #CBD5E1; border-radius: 6px; padding: 8px 12px; min-height: 110px;" placeholder="Write the circular announcement message details here..."></textarea>
                </div>

                <div class="form-group" style="margin-bottom: 14px;">
                  <label class="form-label" style="display: block; font-weight: 700; font-size: 0.82rem; color: #475569; margin-bottom: 5px;">Attachment File / Image (Optional)</label>
                  <input type="file" (change)="onCircularFileSelected($event)" class="form-control" style="width: 100%; border: 1.5px solid #CBD5E1; border-radius: 6px; padding: 6px 12px; background-color: white; cursor: pointer;" />
                  
                  <div *ngIf="uploadingCircularFile" style="font-size: 0.8rem; color: #EE5A24; margin-top: 5px; font-weight: 700;">
                    ⏳ Uploading file, please wait...
                  </div>
                  
                  <div *ngIf="newCircular.attachment_url" style="margin-top: 8px; display: flex; align-items: center; gap: 8px;">
                    <a [href]="getMediaUrl(newCircular.attachment_url, '')" target="_blank" style="font-size: 0.78rem; color: #2563EB; font-weight: 700; text-decoration: none;">📎 View Attached File</a>
                    <button type="button" (click)="newCircular.attachment_url = ''" style="background: #FEE2E2; color: #DC2626; border: none; padding: 2px 6px; font-size: 0.72rem; border-radius: 4px; font-weight: 700; cursor: pointer;">Remove</button>
                  </div>
                </div>

                <div class="form-group" style="margin-bottom: 18px; display: flex; align-items: center; gap: 8px;">
                  <input type="checkbox" [(ngModel)]="newCircular.is_active" name="c_active" id="t_c_active" style="width: 16px; height: 16px; cursor: pointer;" />
                  <label for="t_c_active" style="font-weight: 700; font-size: 0.82rem; color: #475569; cursor: pointer; user-select: none;">Published & Active</label>
                </div>

                <div style="display: flex; gap: 10px;">
                  <button type="submit" class="btn btn-primary" style="flex: 1; padding: 10px; font-weight: 700; border-radius: 6px; border: none; background: #2563EB; color: white; cursor: pointer;">
                    {{ editingCircularId ? '💾 Update Circular' : '🚀 Publish Circular' }}
                  </button>
                  <button *ngIf="editingCircularId" type="button" (click)="resetCircularForm()" class="btn btn-outline" style="border: 1.5px solid #CBD5E1; color: #64748B; padding: 10px; font-weight: 600; border-radius: 6px; background: white; cursor: pointer;">
                    Cancel
                  </button>
                </div>
              </form>
            </div>

            <!-- Right Panel: Circulars Roster Table -->
            <div class="card" style="background: white; border-radius: 12px; border: 1.5px solid #E2E8F0; padding: 22px; box-shadow: 0 4px 6px rgba(0,0,0,0.02); min-height: 400px;">
              <h3 style="margin-top: 0; color: #0F172A; margin-bottom: 16px; font-size: 1.1rem; font-weight: 800; border-bottom: 1px solid #F1F5F9; padding-bottom: 10px;">
                📋 Published Circulars Roster
              </h3>
              
              <div *ngIf="circularsLoading" style="text-align: center; padding: 40px; color: #64748B;">Loading circulars...</div>

              <div *ngIf="!circularsLoading" style="overflow-x: auto;">
                <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 0.88rem;">
                  <thead>
                    <tr style="background: #F8FAFC; border-bottom: 2px solid #CBD5E1; color: #475569; font-weight: 800;">
                      <th style="padding: 10px 12px;">Date</th>
                      <th style="padding: 10px 12px;">Target Class</th>
                      <th style="padding: 10px 12px;">Title</th>
                      <th style="padding: 10px 12px;">Attachment</th>
                      <th style="padding: 10px 12px;">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr *ngFor="let c of circularsList" style="border-bottom: 1px solid #E2E8F0;">
                      <td style="padding: 12px 10px; font-size: 0.82rem; color: #64748B; white-space: nowrap;">
                        {{ c.created_at | date:'shortDate' }}
                      </td>
                      <td style="padding: 12px 10px;">
                        <span [style.background]="c.program_id ? '#E0F2FE' : '#F3E8FF'"
                              [style.color]="c.program_id ? '#0369A1' : '#6B21A8'"
                              style="font-size: 0.75rem; font-weight: 800; border-radius: 6px; padding: 4px 8px; display: inline-block;">
                          {{ getProgramTitle(c.program_id) }}
                        </span>
                      </td>
                      <td style="padding: 12px 10px;">
                        <div style="font-weight: 800; color: #2563EB;">{{ c.title }}</div>
                        <span *ngIf="!c.is_active" style="background-color: #F3F4F6; color: #9CA3AF; font-size: 0.7rem; border-radius: 4px; padding: 2px 6px; margin-top: 4px; display: inline-block;">Draft</span>
                      </td>
                      <td style="padding: 12px 10px; font-size: 0.82rem;">
                        <a *ngIf="c.attachment_url" [href]="getMediaUrl(c.attachment_url, '')" target="_blank" style="color: #2563EB; font-weight: 700; text-decoration: none;">📎 View File</a>
                        <span *ngIf="!c.attachment_url" style="color: #94A3B8;">—</span>
                      </td>
                      <td style="padding: 12px 10px;">
                        <div style="display: flex; gap: 6px;">
                          <button (click)="editCircular(c)" style="background: #EFF6FF; color: #2563EB; border: 1px solid #BFDBFE; padding: 4px 10px; border-radius: 6px; font-weight: 700; font-size: 0.78rem; cursor: pointer;">✏️ Edit</button>
                          <button (click)="deleteCircular(c.id)" style="background: #FEE2E2; color: #DC2626; border: 1px solid #FCA5A5; padding: 4px 10px; border-radius: 6px; font-weight: 700; font-size: 0.78rem; cursor: pointer;">🗑️ Delete</button>
                        </div>
                      </td>
                    </tr>
                    <tr *ngIf="circularsList.length === 0">
                      <td colspan="5" style="text-align: center; color: #94A3B8; padding: 40px; font-style: italic;">
                        No circulars published yet.
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <!-- SCHOOL LIBRARY MANAGER TAB (SAME AS ADMIN LOGIN) -->
        <div class="tab-content animate-fade-in" *ngIf="activeTab === 'library'">
          <div class="tab-header" style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #E2E8F0; padding-bottom: 15px; margin-bottom: 20px;">
            <div>
              <h2 style="margin: 0; color: #0F172A; font-weight: 800; font-size: 1.3rem;">📚 School Library & Book Manager</h2>
              <p style="margin: 3px 0 0 0; color: #64748B; font-size: 0.88rem;">Manage the school library catalog, add children's books, track inventory, and register borrowed/returned books for students.</p>
            </div>
            <button (click)="loadBooks()" class="btn btn-secondary" style="padding: 8px 16px; font-weight: 700; border-radius: 8px;">🔄 Refresh Catalog</button>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 2fr; gap: 24px; margin-bottom: 24px;">
            <!-- Left Panel: Add Book Form / Issue Book Form -->
            <div style="display: flex; flex-direction: column; gap: 20px;">
              <!-- Card 1: Add/Edit Book -->
              <div class="card" style="background: white; border-radius: 12px; border: 1.5px solid #E2E8F0; padding: 22px; box-shadow: 0 4px 6px rgba(0,0,0,0.02);">
                <h3 style="margin-top: 0; color: #0F172A; margin-bottom: 16px; font-size: 1.1rem; font-weight: 800; border-bottom: 1px solid #F1F5F9; padding-bottom: 10px;">
                  {{ editingBookId ? '✏️ Edit Book Details' : '➕ Add Book to Catalog' }}
                </h3>
                <form (ngSubmit)="saveBook()">
                  <div class="form-group" style="margin-bottom: 12px;">
                    <label class="form-label" style="display: block; font-weight: 700; font-size: 0.82rem; color: #475569; margin-bottom: 4px;">Book Title *</label>
                    <input type="text" [(ngModel)]="newBook.title" name="b_title" required class="form-control" placeholder="e.g. Green Eggs and Ham" style="width: 100%; border: 1.5px solid #CBD5E1; border-radius: 6px; padding: 8px 10px;" />
                  </div>
                  
                  <div class="form-group" style="margin-bottom: 12px;">
                    <label class="form-label" style="display: block; font-weight: 700; font-size: 0.82rem; color: #475569; margin-bottom: 4px;">Author *</label>
                    <input type="text" [(ngModel)]="newBook.author" name="b_author" required class="form-control" placeholder="e.g. Dr. Seuss" style="width: 100%; border: 1.5px solid #CBD5E1; border-radius: 6px; padding: 8px 10px;" />
                  </div>

                  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 12px;">
                    <div class="form-group">
                      <label class="form-label" style="display: block; font-weight: 700; font-size: 0.82rem; color: #475569; margin-bottom: 4px;">ISBN (Optional)</label>
                      <input type="text" [(ngModel)]="newBook.isbn" name="b_isbn" class="form-control" placeholder="e.g. 978039480" style="width: 100%; border: 1.5px solid #CBD5E1; border-radius: 6px; padding: 8px 10px;" />
                    </div>
                    <div class="form-group">
                      <label class="form-label" style="display: block; font-weight: 700; font-size: 0.82rem; color: #475569; margin-bottom: 4px;">Category *</label>
                      <select [(ngModel)]="newBook.category" name="b_category" required class="form-control" style="width: 100%; border: 1.5px solid #CBD5E1; border-radius: 6px; padding: 8px 10px; background-color: white;">
                        <option value="Picture Book">Picture Book</option>
                        <option value="Beginner Reader">Beginner Reader</option>
                        <option value="Fiction">Fiction</option>
                        <option value="Chapter Book">Chapter Book</option>
                        <option value="Science & Nature">Science & Nature</option>
                      </select>
                    </div>
                  </div>

                  <div class="form-group" style="margin-bottom: 15px;">
                    <label class="form-label" style="display: block; font-weight: 700; font-size: 0.82rem; color: #475569; margin-bottom: 4px;">Total Copies *</label>
                    <input type="number" [(ngModel)]="newBook.total_copies" name="b_copies" min="1" required class="form-control" style="width: 100%; border: 1.5px solid #CBD5E1; border-radius: 6px; padding: 8px 10px;" />
                  </div>

                  <div style="display: flex; gap: 8px;">
                    <button type="submit" class="btn btn-primary" style="flex: 1; padding: 9px; font-weight: 700; border-radius: 6px; background: #2563EB; color: white; border: none; cursor: pointer;">
                      {{ editingBookId ? '💾 Update Book' : '➕ Add Book' }}
                    </button>
                    <button *ngIf="editingBookId" type="button" (click)="resetBookForm()" class="btn btn-outline" style="padding: 9px 14px; font-weight: 600; border: 1.5px solid #CBD5E1; color: #64748B; border-radius: 6px; background: white; cursor: pointer;">
                      Cancel
                    </button>
                  </div>
                </form>
              </div>

              <!-- Card 2: Issue Book to Student -->
              <div class="card" style="background: white; border-radius: 12px; border: 1.5px solid #E2E8F0; padding: 22px; box-shadow: 0 4px 6px rgba(0,0,0,0.02);">
                <h3 style="margin-top: 0; color: #0F172A; margin-bottom: 16px; font-size: 1.1rem; font-weight: 800; border-bottom: 1px solid #F1F5F9; padding-bottom: 10px;">
                  📖 Issue Book to Student
                </h3>
                <form (ngSubmit)="issueBook()">
                  <div class="form-group" style="margin-bottom: 12px;">
                    <label class="form-label" style="display: block; font-weight: 700; font-size: 0.82rem; color: #475569; margin-bottom: 4px;">Select Book *</label>
                    <select [(ngModel)]="newBorrow.book_id" name="iss_book" required class="form-control" style="width: 100%; border: 1.5px solid #CBD5E1; border-radius: 6px; padding: 8px 10px; background-color: white;">
                      <option [ngValue]="null" disabled>-- Choose Available Book --</option>
                      <option *ngFor="let b of getAvailableBooks()" [value]="b.id">{{ b.title }} (By {{ b.author }}) - [{{ b.available_copies }} left]</option>
                    </select>
                  </div>

                  <div class="form-group" style="margin-bottom: 12px;">
                    <label class="form-label" style="display: block; font-weight: 700; font-size: 0.82rem; color: #475569; margin-bottom: 4px;">Select Student *</label>
                    <select [(ngModel)]="newBorrow.student_id" name="iss_student" required class="form-control" style="width: 100%; border: 1.5px solid #CBD5E1; border-radius: 6px; padding: 8px 10px; background-color: white;">
                      <option [ngValue]="null" disabled>-- Choose Student --</option>
                      <option *ngFor="let s of classStudents" [value]="s.id">{{ s.name }}</option>
                    </select>
                  </div>

                  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 15px;">
                    <div class="form-group">
                      <label class="form-label" style="display: block; font-weight: 700; font-size: 0.82rem; color: #475569; margin-bottom: 4px;">Borrow Date</label>
                      <input type="date" [(ngModel)]="newBorrow.borrow_date" name="iss_bdate" required class="form-control" style="width: 100%; border: 1.5px solid #CBD5E1; border-radius: 6px; padding: 8px 10px;" />
                    </div>
                    <div class="form-group">
                      <label class="form-label" style="display: block; font-weight: 700; font-size: 0.82rem; color: #475569; margin-bottom: 4px;">Due Date</label>
                      <input type="date" [(ngModel)]="newBorrow.due_date" name="iss_ddate" required class="form-control" style="width: 100%; border: 1.5px solid #CBD5E1; border-radius: 6px; padding: 8px 10px;" />
                    </div>
                  </div>

                  <button type="submit" class="btn" style="width: 100%; padding: 10px; font-weight: 700; border-radius: 6px; background: #0652DD; color: white; border: none; cursor: pointer;">
                    🚀 Register Borrow
                  </button>
                </form>
              </div>
            </div>

            <!-- Right Panel: Books catalog and Borrow registry -->
            <div style="display: flex; flex-direction: column; gap: 20px;">
              <!-- Catalog List Card -->
              <div class="card" style="background: white; border-radius: 12px; border: 1.5px solid #E2E8F0; padding: 22px; box-shadow: 0 4px 6px rgba(0,0,0,0.02);">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <h3 style="margin: 0; color: #0F172A; font-size: 1.1rem; font-weight: 800;">📚 Library Catalog</h3>
                  <span style="background: #E2E8F0; color: #475569; font-weight: 700; padding: 4px 10px; border-radius: 6px; font-size: 0.78rem;">Total Books: {{ booksList.length }}</span>
                </div>

                <!-- Search Bar -->
                <div style="position: relative; margin-top: 14px;">
                  <span style="position: absolute; left: 12px; top: 50%; transform: translateY(-50%); font-size: 1rem; pointer-events: none;">🔍</span>
                  <input
                    type="text"
                    [(ngModel)]="bookSearchQuery"
                    name="book_search"
                    placeholder="Search by title, author or ISBN..."
                    style="width: 100%; padding: 9px 12px 9px 38px; border: 1.5px solid #CBD5E1; border-radius: 8px; font-size: 0.85rem; color: #1E293B; background: #F8FAFC; box-sizing: border-box; outline: none;"
                  />
                  <button *ngIf="bookSearchQuery"
                          type="button"
                          (click)="bookSearchQuery = ''"
                          style="position: absolute; right: 10px; top: 50%; transform: translateY(-50%); background: none; border: none; cursor: pointer; font-size: 1rem; color: #94a3b8;"
                          title="Clear search">
                    &times;
                  </button>
                </div>
                <div *ngIf="bookSearchQuery && filteredBooksList.length > 0" style="margin-top: 6px; font-size: 0.78rem; color: #64748b;">
                  Showing <strong>{{ filteredBooksList.length }}</strong> of {{ booksList.length }} books
                </div>

                <div style="overflow-x: auto; margin-top: 14px; max-height: 280px;">
                  <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 0.88rem;">
                    <thead>
                      <tr style="background: #F8FAFC; border-bottom: 2px solid #CBD5E1; color: #475569; font-weight: 800;">
                        <th style="padding: 10px 12px;">Title & Author</th>
                        <th style="padding: 10px 12px;">Category</th>
                        <th style="padding: 10px 12px; text-align: center;">Copies (Avail/Total)</th>
                        <th style="padding: 10px 12px; width: 80px;">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr *ngFor="let b of filteredBooksList" style="border-bottom: 1px solid #E2E8F0;">
                        <td style="padding: 10px 12px;">
                          <div style="font-weight: 800; color: #2563EB;">{{ b.title }}</div>
                          <div style="font-size: 0.78rem; color: #64748B; margin-top: 2px;">By {{ b.author }} <span *ngIf="b.isbn" style="margin-left: 5px; opacity: 0.7;">(ISBN: {{ b.isbn }})</span></div>
                        </td>
                        <td style="padding: 10px 12px; font-size: 0.85rem; color: #475569;">
                          {{ b.category }}
                        </td>
                        <td style="padding: 10px 12px; text-align: center;">
                          <span [style.background]="b.available_copies > 0 ? '#D1FAE5' : '#FEE2E2'"
                                [style.color]="b.available_copies > 0 ? '#065F46' : '#991B1B'"
                                style="font-size: 0.78rem; font-weight: 800; border-radius: 6px; padding: 4px 8px; display: inline-block;">
                            {{ b.available_copies }} / {{ b.total_copies }}
                          </span>
                        </td>
                        <td style="padding: 10px 12px;">
                          <div style="display: flex; gap: 6px;">
                            <button (click)="editBook(b)" style="background: #EFF6FF; color: #2563EB; border: 1px solid #BFDBFE; padding: 4px 8px; border-radius: 6px; font-weight: 700; font-size: 0.75rem; cursor: pointer;">✏️</button>
                            <button (click)="deleteBook(b.id)" style="background: #FEE2E2; color: #DC2626; border: 1px solid #FCA5A5; padding: 4px 8px; border-radius: 6px; font-weight: 700; font-size: 0.75rem; cursor: pointer;">🗑️</button>
                          </div>
                        </td>
                      </tr>
                      <tr *ngIf="filteredBooksList.length === 0">
                        <td colspan="4" style="text-align: center; color: #94A3B8; font-style: italic; padding: 20px;">
                          {{ bookSearchQuery ? 'No books match your search.' : 'Library catalog is empty.' }}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <!-- Borrow Registry Card -->
              <div class="card" style="background: white; border-radius: 12px; border: 1.5px solid #E2E8F0; padding: 22px; box-shadow: 0 4px 6px rgba(0,0,0,0.02);">
                <h3 style="margin-top: 0; color: #0F172A; margin-bottom: 16px; font-size: 1.1rem; font-weight: 800; border-bottom: 1px solid #F1F5F9; padding-bottom: 10px;">
                  📋 Active Borrow & Issue Register
                </h3>
                
                <div style="overflow-x: auto; max-height: 280px;">
                  <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 0.88rem;">
                    <thead>
                      <tr style="background: #F8FAFC; border-bottom: 2px solid #CBD5E1; color: #475569; font-weight: 800;">
                        <th style="padding: 10px 12px;">Book</th>
                        <th style="padding: 10px 12px;">Student</th>
                        <th style="padding: 10px 12px;">Borrow ➔ Due</th>
                        <th style="padding: 10px 12px; text-align: center;">Status</th>
                        <th style="padding: 10px 12px; text-align: center;">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr *ngFor="let br of borrowsList" style="border-bottom: 1px solid #E2E8F0;">
                        <td style="padding: 10px 12px; font-size: 0.88rem; font-weight: 700; color: #1E293B;">
                          {{ getBookTitle(br.book_id) }}
                        </td>
                        <td style="padding: 10px 12px; font-size: 0.85rem; color: #475569;">
                          {{ getStudentName(br.student_id) }}
                        </td>
                        <td style="padding: 10px 12px; font-size: 0.78rem; color: #64748B;">
                          <div>{{ br.borrow_date }}</div>
                          <div style="font-weight: 700; color: #DC2626; margin-top: 2px;">⌛ {{ br.due_date }}</div>
                        </td>
                        <td style="padding: 10px 12px; text-align: center;">
                          <span [style.background]="br.status?.toUpperCase() === 'RETURNED' ? '#D1FAE5' : '#FEF3C7'"
                                [style.color]="br.status?.toUpperCase() === 'RETURNED' ? '#065F46' : '#92400E'"
                                style="font-size: 0.72rem; font-weight: 800; border-radius: 4px; padding: 3px 8px;">
                            {{ br.status }}
                          </span>
                        </td>
                        <td style="padding: 10px 12px; text-align: center;">
                          <button *ngIf="br.status?.toUpperCase() === 'BORROWED'" (click)="returnBorrowedBook(br.id)" style="padding: 4px 10px; font-size: 0.75rem; font-weight: 700; border-radius: 6px; background: #10B981; color: white; border: none; cursor: pointer;">
                            ↩ Return
                          </button>
                          <span *ngIf="br.status?.toUpperCase() === 'RETURNED'" style="color: #94A3B8; font-size: 0.78rem; font-style: italic;">Returned</span>
                        </td>
                      </tr>
                      <tr *ngIf="borrowsList.length === 0">
                        <td colspan="5" style="text-align: center; color: #94A3B8; font-style: italic; padding: 20px;">
                          No books currently registered as borrowed.
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- ACADEMIC HOLIDAYS MANAGER TAB (SAME AS ADMIN LOGIN) -->
        <div class="tab-content animate-fade-in" *ngIf="activeTab === 'holidays'">
          <div class="tab-header" style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #E2E8F0; padding-bottom: 15px; margin-bottom: 20px;">
            <div>
              <h2 style="margin: 0; color: #0F172A; font-weight: 800; font-size: 1.3rem;">📅 School Holidays Management</h2>
              <p style="margin: 3px 0 0 0; color: #64748B; font-size: 0.88rem;">Publish, configure, and manage holidays on a year-on-year basis for parents and staff.</p>
            </div>
            <div style="display: flex; align-items: center; gap: 10px;">
              <label style="font-weight: 700; color: #475569; font-size: 0.88rem;">Select Year:</label>
              <select [(ngModel)]="selectedHolidayYear" (change)="loadHolidays()" class="form-control" style="width: 120px; background-color: white; border: 1.5px solid #CBD5E1; border-radius: 8px; padding: 6px 12px; font-weight: 700;">
                <option *ngFor="let y of holidayYears" [value]="y">{{ y }}</option>
              </select>
            </div>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 2fr; gap: 24px; margin-bottom: 24px;">
            <!-- Add / Edit Holiday Form Card -->
            <div>
              <div class="card" style="background: white; border-radius: 12px; border: 1.5px solid #E2E8F0; padding: 22px; box-shadow: 0 4px 6px rgba(0,0,0,0.02);">
                <h3 style="margin-top: 0; color: #0F172A; margin-bottom: 16px; font-size: 1.1rem; font-weight: 800; border-bottom: 1px solid #F1F5F9; padding-bottom: 10px;">
                  {{ editingHolidayId ? '✏️ Edit Holiday Details' : '➕ Add New Holiday' }}
                </h3>
                
                <form (ngSubmit)="saveHoliday()">
                  <div class="form-group" style="margin-bottom: 14px;">
                    <label class="form-label" style="display: block; font-weight: 700; font-size: 0.82rem; color: #475569; margin-bottom: 5px;">Holiday Title *</label>
                    <input type="text" [(ngModel)]="newHoliday.title" name="h_title" required class="form-control" style="width: 100%; border: 1.5px solid #CBD5E1; border-radius: 6px; padding: 8px 12px;" placeholder="e.g. Ugadi Festival" />
                  </div>

                  <div class="form-group" style="margin-bottom: 14px;">
                    <label class="form-label" style="display: block; font-weight: 700; font-size: 0.82rem; color: #475569; margin-bottom: 5px;">Holiday Date *</label>
                    <input type="date" [(ngModel)]="newHoliday.holiday_date" name="h_date" required class="form-control" style="width: 100%; border: 1.5px solid #CBD5E1; border-radius: 6px; padding: 8px 12px;" />
                  </div>

                  <div class="form-group" style="margin-bottom: 14px;">
                    <label class="form-label" style="display: block; font-weight: 700; font-size: 0.82rem; color: #475569; margin-bottom: 5px;">Holiday Category *</label>
                    <select [(ngModel)]="newHoliday.category" name="h_category" required class="form-control" style="width: 100%; border: 1.5px solid #CBD5E1; border-radius: 6px; padding: 8px 12px; background-color: white; cursor: pointer;">
                      <option value="National Holiday">National Holiday</option>
                      <option value="Vacation">Vacation</option>
                      <option value="Public Event">Public Event</option>
                      <option value="Religious Event">Religious Event</option>
                      <option value="School Event">School Event</option>
                    </select>
                  </div>

                  <div class="form-group" style="margin-bottom: 14px;">
                    <label class="form-label" style="display: block; font-weight: 700; font-size: 0.82rem; color: #475569; margin-bottom: 5px;">Description / Details</label>
                    <textarea [(ngModel)]="newHoliday.description" name="h_desc" class="form-control" style="width: 100%; border: 1.5px solid #CBD5E1; border-radius: 6px; padding: 8px 12px; min-height: 70px;" placeholder="Details about this holiday..."></textarea>
                  </div>

                  <div class="form-group" style="margin-bottom: 14px;">
                    <label class="form-label" style="display: block; font-weight: 700; font-size: 0.82rem; color: #475569; margin-bottom: 5px;">Holiday Image (Optional)</label>
                    <input type="file" (change)="onHolidayFileSelected($event)" accept="image/*" class="form-control" style="width: 100%; border: 1.5px solid #CBD5E1; border-radius: 6px; padding: 6px 12px; background-color: white; cursor: pointer;" />
                    
                    <div *ngIf="uploadingHolidayImage" style="font-size: 0.8rem; color: #EE5A24; margin-top: 5px; font-weight: 700;">
                      ⏳ Uploading image, please wait...
                    </div>
                    
                    <div *ngIf="newHoliday.image_url" style="margin-top: 10px; display: flex; align-items: center; gap: 10px;">
                      <img [src]="getMediaUrl(newHoliday.image_url, '')" alt="Preview" style="width: 60px; height: 60px; object-fit: cover; border-radius: 6px; border: 1px solid #CBD5E1;" />
                      <button type="button" (click)="removeHolidayImage()" style="background: #FEE2E2; color: #DC2626; border: none; padding: 4px 8px; font-size: 0.75rem; border-radius: 4px; font-weight: 700; cursor: pointer;">Remove</button>
                    </div>
                  </div>

                  <div class="form-group" style="margin-bottom: 16px; display: flex; flex-direction: column; gap: 8px;">
                    <div style="display: flex; align-items: center; gap: 8px;">
                      <input type="checkbox" [(ngModel)]="newHoliday.is_active" name="h_active" id="t_h_active" style="width: 16px; height: 16px; cursor: pointer;" />
                      <label for="t_h_active" style="font-weight: 700; font-size: 0.82rem; color: #475569; cursor: pointer; user-select: none;">Published & Active</label>
                    </div>
                    <div style="display: flex; align-items: center; gap: 8px;">
                      <input type="checkbox" [(ngModel)]="newHoliday.send_email" name="h_send_email" id="t_h_send_email" style="width: 16px; height: 16px; cursor: pointer;" />
                      <label for="t_h_send_email" style="font-weight: 700; font-size: 0.82rem; color: #475569; cursor: pointer; user-select: none;">📧 Bulk Email Parents</label>
                    </div>
                  </div>

                  <div style="display: flex; gap: 10px;">
                    <button type="submit" class="btn btn-primary" style="flex: 1; padding: 10px; font-weight: 700; border-radius: 6px; border: none; background: #2563EB; color: white; cursor: pointer;">
                      {{ editingHolidayId ? '💾 Update Holiday' : '💾 Save Holiday' }}
                    </button>
                    <button *ngIf="editingHolidayId" type="button" (click)="resetHolidayForm()" class="btn btn-outline" style="border: 1.5px solid #CBD5E1; color: #64748B; padding: 10px; font-weight: 600; border-radius: 6px; background: white; cursor: pointer;">
                      Cancel
                    </button>
                  </div>
                </form>
              </div>

              <!-- Custom Holiday Bulk Mailer Card -->
              <div class="card" style="background: white; border-radius: 12px; border: 1.5px solid #E2E8F0; padding: 22px; box-shadow: 0 4px 6px rgba(0,0,0,0.02); margin-top: 20px;">
                <h3 style="margin-top: 0; color: #0F172A; margin-bottom: 14px; font-size: 1.05rem; font-weight: 800; border-bottom: 1px solid #F1F5F9; padding-bottom: 10px;">
                  📢 Custom Holiday Bulk Mailer
                </h3>
                <p style="font-size: 0.8rem; color: #64748B; margin-bottom: 14px; line-height: 1.4;">
                  Send an immediate, styled HTML holiday announcement to all registered parent contacts.
                </p>
                
                <form (ngSubmit)="sendBulkHolidayEmail()">
                  <div class="form-group" style="margin-bottom: 12px;">
                    <label class="form-label" style="display: block; font-weight: 700; font-size: 0.82rem; color: #475569; margin-bottom: 5px;">Reason for Holiday *</label>
                    <input type="text" [(ngModel)]="customHolidayEmail.reason" name="c_reason" required class="form-control" style="width: 100%; border: 1.5px solid #CBD5E1; border-radius: 6px; padding: 8px 12px;" placeholder="e.g. Extreme weather red alert" />
                  </div>

                  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 12px;">
                    <div class="form-group">
                      <label class="form-label" style="display: block; font-weight: 700; font-size: 0.82rem; color: #475569; margin-bottom: 5px;">From Date *</label>
                      <input type="date" [(ngModel)]="customHolidayEmail.start_date" name="c_start" required class="form-control" style="width: 100%; border: 1.5px solid #CBD5E1; border-radius: 6px; padding: 8px 12px;" />
                    </div>
                    <div class="form-group">
                      <label class="form-label" style="display: block; font-weight: 700; font-size: 0.82rem; color: #475569; margin-bottom: 5px;">To Date *</label>
                      <input type="date" [(ngModel)]="customHolidayEmail.end_date" name="c_end" required class="form-control" style="width: 100%; border: 1.5px solid #CBD5E1; border-radius: 6px; padding: 8px 12px;" />
                    </div>
                  </div>

                  <div class="form-group" style="margin-bottom: 16px;">
                    <label class="form-label" style="display: block; font-weight: 700; font-size: 0.82rem; color: #475569; margin-bottom: 5px;">School Reopening Date *</label>
                    <input type="date" [(ngModel)]="customHolidayEmail.reopen_date" name="c_reopen" required class="form-control" style="width: 100%; border: 1.5px solid #CBD5E1; border-radius: 6px; padding: 8px 12px;" />
                  </div>

                  <button type="submit" [disabled]="sendingBulkEmail" class="btn" style="width: 100%; padding: 10px; font-weight: 700; border-radius: 6px; border: none; background-color: #EC4899; color: white; cursor: pointer;">
                    {{ sendingBulkEmail ? '⏳ Dispatching Emails...' : '📧 Send Bulk Holiday Email' }}
                  </button>
                </form>
              </div>
            </div>

            <!-- Holidays Table Card -->
            <div>
              <div class="card" style="background: white; border-radius: 12px; border: 1.5px solid #E2E8F0; padding: 22px; box-shadow: 0 4px 6px rgba(0,0,0,0.02); min-height: 400px; width: 100%;">
                <h3 style="margin-top: 0; color: #0F172A; margin-bottom: 16px; font-size: 1.1rem; font-weight: 800; border-bottom: 1px solid #F1F5F9; padding-bottom: 10px;">
                  Holidays List for {{ selectedHolidayYear }}
                </h3>

                <div style="overflow-x: auto;">
                  <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 0.88rem;">
                    <thead>
                      <tr style="border-bottom: 2px solid #CBD5E1; color: #475569; font-weight: 800; background: #F8FAFC;">
                        <th style="padding: 10px 12px;">Date</th>
                        <th style="padding: 10px 12px;">Holiday Title</th>
                        <th style="padding: 10px 12px;">Category</th>
                        <th style="padding: 10px 12px;">Description</th>
                        <th style="padding: 10px 12px;">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr *ngFor="let h of holidaysList" style="border-bottom: 1px solid #E2E8F0;">
                        <td style="padding: 12px 10px; font-weight: 800; color: #1E293B; white-space: nowrap;">
                          📅 {{ h.holiday_date }}
                        </td>
                        <td style="padding: 12px 10px;">
                          <div style="font-weight: 800; color: #2563EB;">{{ h.title }}</div>
                          <span *ngIf="!h.is_active" style="background-color: #F3F4F6; color: #9CA3AF; font-size: 0.7rem; border-radius: 4px; padding: 2px 6px; margin-top: 4px; display: inline-block;">Draft</span>
                        </td>
                        <td style="padding: 12px 10px;">
                          <span [style.background]="h.category === 'National Holiday' ? '#FEE2E2' : h.category === 'Vacation' ? '#FFEDD5' : h.category === 'Public Event' ? '#D1FAE5' : '#DBEAFE'"
                                [style.color]="h.category === 'National Holiday' ? '#EF4444' : h.category === 'Vacation' ? '#F97316' : h.category === 'Public Event' ? '#10B981' : '#2563EB'"
                                style="font-size: 0.75rem; font-weight: 800; border-radius: 6px; padding: 4px 8px; display: inline-block;">
                            {{ h.category || 'National Holiday' }}
                          </span>
                        </td>
                        <td style="padding: 12px 10px; color: #475569; font-size: 0.85rem;">
                          {{ h.description || '—' }}
                        </td>
                        <td style="padding: 12px 10px;">
                          <div style="display: flex; gap: 6px;">
                            <button (click)="editHoliday(h)" style="background: #EFF6FF; color: #2563EB; border: 1px solid #BFDBFE; padding: 4px 10px; border-radius: 6px; font-weight: 700; font-size: 0.78rem; cursor: pointer;">✏️ Edit</button>
                            <button (click)="deleteHolidayFromRoster(h.id)" style="background: #FEE2E2; color: #DC2626; border: 1px solid #FCA5A5; padding: 4px 10px; border-radius: 6px; font-weight: 700; font-size: 0.78rem; cursor: pointer;">🗑️ Delete</button>
                          </div>
                        </td>
                      </tr>
                      <tr *ngIf="holidaysList.length === 0">
                        <td colspan="5" style="text-align: center; color: #94A3B8; padding: 40px; font-style: italic;">
                          No holidays scheduled for year {{ selectedHolidayYear }}.
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- CAMPUS GALLERY TAB -->
        <div class="tab-content" *ngIf="activeTab === 'gallery'">
          <div class="card" style="padding: 24px;">
            <h3 style="margin: 0 0 16px 0; font-size: 1.25rem; font-weight: 800; color: #0F172A;">📷 Campus Photo Gallery</h3>
            <div *ngIf="galleryLoading" style="text-align: center; padding: 40px; color: #64748B;">Loading gallery photos...</div>
            <div *ngIf="!galleryLoading && galleryList.length === 0" style="text-align: center; padding: 40px; color: #94A3B8; font-style: italic;">No photos in gallery.</div>
            <div *ngIf="!galleryLoading && galleryList.length > 0" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 14px;">
              <div *ngFor="let img of galleryList" style="border-radius: 10px; overflow: hidden; height: 130px; background: #000; position: relative;">
                <img [src]="getMediaUrl(img.image_url, '')" style="width: 100%; height: 100%; object-fit: cover;" alt="Gallery Photo" />
              </div>
            </div>
          </div>
        </div>

        <!-- STUDENT ATTENDANCE MANAGER TAB -->
        <div class="tab-content" *ngIf="activeTab === 'attendance'">
          <div class="card" style="padding: 24px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 12px;">
              <div>
                <h3 style="margin: 0; font-size: 1.25rem; font-weight: 800; color: #0F172A;">📅 Daily Student Attendance Manager</h3>
                <p style="margin: 4px 0 0 0; color: #64748B; font-size: 0.85rem;">Mark daily pupil attendance status, record absence notes, and view roster statistics.</p>
              </div>
              <div style="display: flex; gap: 8px;">
                <input type="date" [(ngModel)]="attendanceDate" (change)="loadStudentsForAttendance()" class="form-control" style="width: 160px;" />
                <button (click)="saveAttendanceRoster()" class="btn btn-primary btn-sm" style="padding: 8px 18px; font-weight: 700; background: #2563EB; border: none; color: white; border-radius: 6px; cursor: pointer;">💾 Save Roster</button>
              </div>
            </div>

            <div *ngIf="attendanceLoading" style="text-align: center; padding: 40px; color: #64748B;">Loading roster for attendance...</div>

            <div *ngIf="!attendanceLoading" style="overflow-x: auto;">
              <table style="width: 100%; border-collapse: collapse; font-size: 0.88rem;">
                <thead>
                  <tr style="background: #F8FAFC; border-bottom: 2px solid #E2E8F0;">
                    <th style="padding: 12px 14px; text-align: left; font-weight: 800; color: #334155;">Student Name</th>
                    <th style="padding: 12px 14px; text-align: left; font-weight: 800; color: #334155;">Parent Name</th>
                    <th style="padding: 12px 14px; text-align: left; font-weight: 800; color: #334155;">Attendance Status</th>
                    <th style="padding: 12px 14px; text-align: left; font-weight: 800; color: #334155;">Allergies / Notes</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let kid of attendanceStudents" style="border-bottom: 1px solid #F1F5F9;">
                    <td style="padding: 12px 14px; font-weight: 800; color: #0F172A;">
                      <div style="display: flex; align-items: center; gap: 10px;">
                        <span style="font-size: 1.4rem;">👦</span>
                        <span>{{ kid.name }}</span>
                      </div>
                    </td>
                    <td style="padding: 12px 14px; color: #475569;">{{ kid.parent_name || 'N/A' }}</td>
                    <td style="padding: 12px 14px;">
                      <div style="display: flex; gap: 8px;">
                        <button type="button" (click)="markKidStatus(kid.id, 'PRESENT')" 
                                [style.background]="kid.status === 'PRESENT' ? '#10B981' : '#F1F5F9'"
                                [style.color]="kid.status === 'PRESENT' ? 'white' : '#475569'"
                                style="border: none; padding: 6px 14px; border-radius: 20px; font-weight: 800; font-size: 0.78rem; cursor: pointer;">
                          ✓ Present
                        </button>
                        <button type="button" (click)="markKidStatus(kid.id, 'ABSENT')" 
                                [style.background]="kid.status === 'ABSENT' ? '#EF4444' : '#F1F5F9'"
                                [style.color]="kid.status === 'ABSENT' ? 'white' : '#475569'"
                                style="border: none; padding: 6px 14px; border-radius: 20px; font-weight: 800; font-size: 0.78rem; cursor: pointer;">
                          ✗ Absent
                        </button>
                        <button type="button" (click)="markKidStatus(kid.id, 'LATE')" 
                                [style.background]="kid.status === 'LATE' ? '#F59E0B' : '#F1F5F9'"
                                [style.color]="kid.status === 'LATE' ? 'white' : '#475569'"
                                style="border: none; padding: 6px 14px; border-radius: 20px; font-weight: 800; font-size: 0.78rem; cursor: pointer;">
                          ⏰ Late
                        </button>
                      </div>
                    </td>
                    <td style="padding: 12px 14px; color: #64748B;">
                      <span *ngIf="kid.allergies" style="background: #FEE2E2; color: #DC2626; border: 1px solid #FCA5A5; font-size: 0.72rem; font-weight: 700; padding: 2px 6px; border-radius: 4px;">
                        ⚠️ {{ kid.allergies }}
                      </span>
                      <span *ngIf="!kid.allergies">—</span>
                    </td>
                  </tr>
                  <tr *ngIf="attendanceStudents.length === 0">
                    <td colspan="4" style="text-align: center; padding: 30px; color: #94A3B8; font-style: italic;">No students found in class roster.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- PARENT REQUESTS CENTER TAB -->
        <div class="tab-content" *ngIf="activeTab === 'leaves'">
          <div class="card" style="padding: 24px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 12px;">
              <div>
                <h3 style="margin: 0; font-size: 1.25rem; font-weight: 800; color: #0F172A;">📋 Parent Requests Center</h3>
                <p style="margin: 4px 0 0 0; color: #64748B; font-size: 0.85rem;">Review leave applications and meal suspension notes submitted by parents.</p>
              </div>
              <div style="display: flex; gap: 10px;">
                <button type="button" (click)="parentRequestSubTab = 'leaves'" [style.background]="parentRequestSubTab === 'leaves' ? '#2563EB' : '#F1F5F9'" [style.color]="parentRequestSubTab === 'leaves' ? 'white' : '#475569'" style="border: none; padding: 8px 16px; border-radius: 8px; font-weight: 700; cursor: pointer;">📋 Absence Leaves</button>
                <button type="button" (click)="parentRequestSubTab = 'meals'" [style.background]="parentRequestSubTab === 'meals' ? '#2563EB' : '#F1F5F9'" [style.color]="parentRequestSubTab === 'meals' ? 'white' : '#475569'" style="border: none; padding: 8px 16px; border-radius: 8px; font-weight: 700; cursor: pointer;">🍽️ Skip Meals</button>
              </div>
            </div>

            <div *ngIf="parentRequestsLoading" style="text-align: center; padding: 40px; color: #64748B;">Loading parent requests...</div>

            <!-- LEAVE APPROVALS -->
            <div *ngIf="!parentRequestsLoading && parentRequestSubTab === 'leaves'">
              <div *ngIf="parentRequestsList.length === 0" style="text-align: center; padding: 40px; color: #94A3B8; font-style: italic;">No absence leave requests submitted.</div>
              <div *ngIf="parentRequestsList.length > 0" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 16px;">
                <div *ngFor="let req of parentRequestsList" style="background: white; border: 1.5px solid #E2E8F0; border-radius: 12px; padding: 18px; display: flex; flex-direction: column; justify-content: space-between;">
                  <div>
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
                      <div>
                        <h4 style="margin: 0; font-size: 1rem; font-weight: 800; color: #0F172A;">👦 {{ req.student_name || 'Pupil Request' }}</h4>
                        <span style="font-size: 0.75rem; color: #64748B;">Parent: {{ req.parent_name || 'Parent' }}</span>
                      </div>
                      <span [style.background]="req.status === 'Approved' ? '#DCFCE7' : req.status === 'Declined' ? '#FEE2E2' : '#FEF3C7'" [style.color]="req.status === 'Approved' ? '#15803D' : req.status === 'Declined' ? '#B91C1C' : '#D97706'" style="padding: 4px 10px; border-radius: 6px; font-weight: 800; font-size: 0.72rem;">
                        {{ req.status || 'Pending' }}
                      </span>
                    </div>
                    <p style="margin: 8px 0; font-size: 0.85rem; color: #334155; line-height: 1.5;"><strong>Reason:</strong> {{ req.reason || req.description }}</p>
                    <span style="font-size: 0.72rem; color: #94A3B8; display: block;">Dates: {{ req.start_date }} to {{ req.end_date }}</span>
                  </div>
                  <div style="display: flex; gap: 8px; margin-top: 14px; border-top: 1px solid #F1F5F9; padding-top: 12px;">
                    <button (click)="updateLeaveStatus(req.id, 'Approved')" class="btn btn-sm" style="flex: 1; background: #10B981; color: white; border: none; padding: 6px; border-radius: 6px; font-weight: 700; cursor: pointer;">Approve ✓</button>
                    <button (click)="updateLeaveStatus(req.id, 'Declined')" class="btn btn-sm" style="flex: 1; background: #EF4444; color: white; border: none; padding: 6px; border-radius: 6px; font-weight: 700; cursor: pointer;">Decline ✗</button>
                  </div>
                </div>
              </div>
            </div>

            <!-- SKIP MEALS -->
            <div *ngIf="!parentRequestsLoading && parentRequestSubTab === 'meals'">
              <div *ngIf="mealInstructionsList.length === 0" style="text-align: center; padding: 40px; color: #94A3B8; font-style: italic;">No meal suspension instructions submitted.</div>
              <div *ngIf="mealInstructionsList.length > 0" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 16px;">
                <div *ngFor="let meal of mealInstructionsList" style="background: white; border: 1.5px solid #E2E8F0; border-radius: 12px; padding: 18px;">
                  <h4 style="margin: 0 0 6px 0; font-size: 1rem; font-weight: 800; color: #0F172A;">🍽️ {{ meal.student_name }}</h4>
                  <p style="margin: 0 0 8px 0; font-size: 0.85rem; color: #475569;">Instruction: {{ meal.note || 'Skip school meal' }}</p>
                  <span style="font-size: 0.72rem; color: #94A3B8;">Date: {{ meal.date }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- ADMISSION ENQUIRIES TAB -->
        <div class="tab-content" *ngIf="activeTab === 'inquiries'">
          <div class="card" style="padding: 24px;">
            <h3 style="margin: 0 0 16px 0; font-size: 1.25rem; font-weight: 800; color: #0F172A;">📩 Admission Enquiries</h3>
            <div *ngIf="inquiriesLoading" style="text-align: center; padding: 40px; color: #64748B;">Loading inquiries...</div>
            <div *ngIf="!inquiriesLoading && inquiriesList.length === 0" style="text-align: center; padding: 40px; color: #94A3B8; font-style: italic;">No public admission inquiries found.</div>
            <div *ngIf="!inquiriesLoading && inquiriesList.length > 0" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 16px;">
              <div *ngFor="let inq of inquiriesList" style="background: white; border: 1.5px solid #E2E8F0; border-radius: 12px; padding: 18px;">
                <h4 style="margin: 0 0 4px 0; font-size: 1rem; font-weight: 800; color: #0F172A;">👤 {{ inq.parent_name || inq.name }}</h4>
                <span style="font-size: 0.78rem; color: #2563EB; font-weight: 700; display: block;">📞 {{ inq.phone || inq.email }}</span>
                <p style="margin: 8px 0 0 0; font-size: 0.85rem; color: #475569;">{{ inq.message || inq.notes }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- PROGRAMS CATALOGUE TAB -->
        <div class="tab-content" *ngIf="activeTab === 'programs'">
          <div class="card" style="padding: 24px;">
            <h3 style="margin: 0 0 16px 0; font-size: 1.25rem; font-weight: 800; color: #0F172A;">🎓 Academic Programs</h3>
            <div *ngIf="programsLoading" style="text-align: center; padding: 40px; color: #64748B;">Loading programs...</div>
            <div *ngIf="!programsLoading && programsList.length === 0" style="text-align: center; padding: 40px; color: #94A3B8; font-style: italic;">No academic programs found.</div>
            <div *ngIf="!programsLoading && programsList.length > 0" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 16px;">
              <div *ngFor="let prog of programsList" style="background: white; border: 1.5px solid #E2E8F0; border-radius: 12px; padding: 18px;">
                <h4 style="margin: 0 0 6px 0; font-size: 1rem; font-weight: 800; color: #0F172A;">🎓 {{ prog.title }}</h4>
                <p style="margin: 0; font-size: 0.85rem; color: #475569; line-height: 1.5;">{{ prog.description }}</p>
                <span style="font-size: 0.72rem; color: #EC4899; font-weight: 800; display: block; margin-top: 8px;">Age Group: {{ prog.age_group || '2 - 6 Years' }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- TEACHER UPDATES TAB -->
        <div class="tab-content" *ngIf="activeTab === 'users'">
          <div class="card" style="padding: 24px;">
            <h3 style="margin: 0 0 16px 0; font-size: 1.25rem; font-weight: 800; color: #0F172A;">👥 Staff & Teacher Updates</h3>
            <div *ngIf="teachersRosterLoading" style="text-align: center; padding: 40px; color: #64748B;">Loading staff list...</div>
            <div *ngIf="!teachersRosterLoading && teachersRoster.length === 0" style="text-align: center; padding: 40px; color: #94A3B8; font-style: italic;">No staff records found.</div>
            <div *ngIf="!teachersRosterLoading && teachersRoster.length > 0" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 16px;">
              <div *ngFor="let staff of teachersRoster" style="background: white; border: 1.5px solid #E2E8F0; border-radius: 12px; padding: 16px;">
                <h4 style="margin: 0 0 4px 0; font-size: 0.95rem; font-weight: 800; color: #0F172A;">👩‍🏫 {{ staff.full_name || staff.username }}</h4>
                <span style="font-size: 0.75rem; color: #64748B; font-weight: 700;">Role: {{ staff.role }}</span>
                <span style="font-size: 0.72rem; color: #2563EB; display: block; margin-top: 4px;">📧 {{ staff.email || staff.username }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- ADMISSIONS TAB -->
        <div class="tab-content" *ngIf="activeTab === 'admissions'">
          <div class="card" style="padding: 24px;">
            <h3 style="margin: 0 0 16px 0; font-size: 1.25rem; font-weight: 800; color: #0F172A;">🏫 Admissions Management</h3>
            <p style="margin: 0 0 16px 0; color: #64748B; font-size: 0.88rem;">Track new student enrollment applications and admission statuses.</p>
            <div *ngIf="inquiriesLoading" style="text-align: center; padding: 40px; color: #64748B;">Loading admissions...</div>
            <div *ngIf="!inquiriesLoading" style="text-align: center; padding: 40px; color: #94A3B8; font-style: italic; border: 2px dashed #E2E8F0; border-radius: 12px;">
              All current student admissions active for academic term.
            </div>
          </div>
        </div>

        <!-- STUDENT MILESTONES & PROGRESS CONFIGURATOR TAB (SAME AS ADMIN LOGIN) -->
        <div class="tab-content animate-fade-in" *ngIf="activeTab === 'milestones'">
          <div class="tab-header" style="border-bottom: 2px solid #E2E8F0; padding-bottom: 15px; margin-bottom: 20px;">
            <h2 style="margin: 0; color: #0F172A; font-weight: 800; font-size: 1.3rem;">🎯 Student Milestones & Progress Configurator</h2>
            <div style="display: flex; gap: 15px; margin-top: 15px; border-bottom: 2px solid #E2E8F0; padding-bottom: 5px;">
              <button type="button" (click)="setMilestoneSubTab('templates')" [style.color]="milestoneActiveSubTab === 'templates' ? '#2563EB' : '#64748B'" [style.border-bottom]="milestoneActiveSubTab === 'templates' ? '3px solid #2563EB' : 'none'" style="font-weight: 800; padding: 8px 12px; background: none; border: none; cursor: pointer;">
                ⚙️ Milestone Templates
              </button>
              <button type="button" (click)="setMilestoneSubTab('progress')" [style.color]="milestoneActiveSubTab === 'progress' ? '#2563EB' : '#64748B'" [style.border-bottom]="milestoneActiveSubTab === 'progress' ? '3px solid #2563EB' : 'none'" style="font-weight: 800; padding: 8px 12px; background: none; border: none; cursor: pointer;">
                ✍️ Track Student Milestones
              </button>
            </div>
          </div>

          <!-- Sub-Tab 1: Milestone Templates -->
          <div *ngIf="milestoneActiveSubTab === 'templates'" style="margin-top: 20px;">
            <div style="display: grid; grid-template-columns: 1fr 2fr; gap: 24px;">
              <!-- Left Side: Add Template -->
              <div class="card" style="background: white; border-radius: 12px; border: 1.5px solid #E2E8F0; padding: 22px; box-shadow: 0 4px 6px rgba(0,0,0,0.02);">
                <h3 style="margin-top: 0; color: #0F172A; font-size: 1.1rem; font-weight: 800; border-bottom: 1px solid #F1F5F9; padding-bottom: 10px;">Create Milestone Template</h3>
                
                <div class="form-group" style="margin-top: 14px;">
                  <label class="form-label" style="display: block; font-weight: 700; font-size: 0.82rem; color: #475569; margin-bottom: 5px;">Program / Class level</label>
                  <select [(ngModel)]="selectedMilestoneProgramId" (change)="onMilestoneProgramChange()" class="form-control" style="width: 100%; border: 1.5px solid #CBD5E1; border-radius: 6px; padding: 8px 12px; background-color: white;">
                    <option *ngFor="let prog of programsList" [value]="prog.id">🏫 {{ prog.title }}</option>
                  </select>
                </div>
                
                <div class="form-group" style="margin-top: 14px;">
                  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
                    <label style="font-weight: 700; font-size: 0.82rem; color: #475569; margin: 0;">Milestone category</label>
                    <label style="font-size: 0.75rem; color: #2563EB; font-weight: 800; cursor: pointer; display: flex; align-items: center; gap: 4px;">
                      <input type="checkbox" [(ngModel)]="showCustomCategory" style="margin: 0; cursor: pointer;" />
                      ➕ New Category
                    </label>
                  </div>

                  <!-- Existing Categories dropdown -->
                  <select *ngIf="!showCustomCategory" [(ngModel)]="newMilestoneTemplate.category" class="form-control" style="width: 100%; border: 1.5px solid #CBD5E1; border-radius: 6px; padding: 8px 12px; background-color: white;">
                    <option *ngFor="let cat of allMilestoneCategories" [value]="cat">
                      {{ cat === 'Cognitive' ? '🧠 Cognitive & Learning' : cat === 'Physical' ? '🏃 Physical & Motor' : cat === 'Emotional' ? '🤝 Social & Emotional' : '🎯 ' + cat }}
                    </option>
                  </select>

                  <!-- New Category input field -->
                  <input *ngIf="showCustomCategory" type="text" [(ngModel)]="customCategoryName" class="form-control" placeholder="e.g. Creative Arts, Language Skills" style="width: 100%; border: 1.5px solid #CBD5E1; border-radius: 6px; padding: 8px 12px;" />
                </div>

                <div class="form-group" style="margin-top: 14px;">
                  <label class="form-label" style="display: block; font-weight: 700; font-size: 0.82rem; color: #475569; margin-bottom: 5px;">Milestone description</label>
                  <textarea [(ngModel)]="newMilestoneTemplate.milestone_name" class="form-control" rows="3" placeholder="e.g. Identifies standard uppercase & lowercase letters..." style="width: 100%; border: 1.5px solid #CBD5E1; border-radius: 6px; padding: 8px 12px;"></textarea>
                </div>

                <button type="button" (click)="addMilestoneTemplate()" class="btn btn-primary" style="margin-top: 16px; width: 100%; padding: 10px; font-weight: 700; border-radius: 6px; border: none; background: #2563EB; color: white; cursor: pointer;">
                  ➕ Add Milestone Template
                </button>
              </div>

              <!-- Right Side: Template List -->
              <div class="card" style="background: white; border-radius: 12px; border: 1.5px solid #E2E8F0; padding: 22px; box-shadow: 0 4px 6px rgba(0,0,0,0.02);">
                <h3 style="margin-top: 0; color: #0F172A; font-size: 1.1rem; font-weight: 800; border-bottom: 1px solid #F1F5F9; padding-bottom: 10px;">Available Milestone Templates</h3>
                <p style="font-size: 0.8rem; color: #64748B; margin-bottom: 15px;">Milestones are grouped by category. Click Edit to adjust categories or descriptions.</p>
                
                <div style="max-height: 520px; overflow-y: auto; padding-right: 6px;">
                  <!-- Category Loop -->
                  <div *ngFor="let cat of allMilestoneCategories" style="margin-bottom: 20px;">
                    <div *ngIf="getTemplatesByCategory(cat).length > 0" style="margin-bottom: 12px;">
                      <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 14px; border-radius: 6px; margin-bottom: 10px;"
                           [style.background-color]="cat === 'Cognitive' ? '#EFF6FF' : cat === 'Physical' ? '#ECFDF5' : cat === 'Emotional' ? '#FDF2F8' : '#F8FAFC'"
                           [style.color]="cat === 'Cognitive' ? '#1E40AF' : cat === 'Physical' ? '#065F46' : cat === 'Emotional' ? '#9D174D' : '#475569'">
                        <span style="font-size: 0.82rem; font-weight: 800; text-transform: uppercase;">
                          {{ cat === 'Cognitive' ? '🧠 Cognitive & Learning' : cat === 'Physical' ? '🏃 Physical & Motor Skills' : cat === 'Emotional' ? '🤝 Social & Emotional' : '🎯 ' + cat }}
                        </span>
                        <span style="font-size: 0.75rem; font-weight: 800; padding: 2px 8px; border-radius: 9999px; background: rgba(255,255,255,0.7);">
                          {{ getTemplatesByCategory(cat).length }}
                        </span>
                      </div>

                      <div style="display: flex; flex-direction: column; gap: 8px;">
                        <div *ngFor="let temp of getTemplatesByCategory(cat)" style="border: 1.5px solid #E2E8F0; border-radius: 8px; padding: 12px; background: white;">
                          <!-- View Mode -->
                          <div *ngIf="editingTemplateId !== temp.id" style="display: flex; justify-content: space-between; align-items: flex-start; gap: 12px;">
                            <p style="margin: 0; font-size: 0.85rem; color: #334155; line-height: 1.4; white-space: pre-line; flex: 1;">
                              {{ temp.milestone_name }}
                            </p>
                            <div style="display: flex; gap: 6px;">
                              <button type="button" (click)="startEditTemplate(temp)" style="font-size: 0.75rem; padding: 3px 8px; border: 1px solid #BFDBFE; color: #2563EB; background: #EFF6FF; font-weight: 700; border-radius: 4px; cursor: pointer;">
                                Edit
                              </button>
                              <button type="button" (click)="deleteMilestoneTemplate(temp.id)" style="font-size: 0.75rem; padding: 3px 8px; border: 1px solid #FCA5A5; color: #DC2626; background: #FEE2E2; font-weight: 700; border-radius: 4px; cursor: pointer;">
                                Delete
                              </button>
                            </div>
                          </div>

                          <!-- Edit Mode -->
                          <div *ngIf="editingTemplateId === temp.id" style="display: flex; flex-direction: column; gap: 10px;">
                            <div style="display: grid; grid-template-columns: 1fr 2fr; gap: 12px;">
                              <div>
                                <label style="font-size: 0.7rem; color: #94A3B8; font-weight: 700; text-transform: uppercase;">Category</label>
                                <select [(ngModel)]="editingTemplateData.category" class="form-control" style="font-size: 0.8rem; padding: 4px 8px; border-radius: 4px;">
                                  <option *ngFor="let catOpt of allMilestoneCategories" [value]="catOpt">{{ catOpt }}</option>
                                </select>
                              </div>
                              <div>
                                <label style="font-size: 0.7rem; color: #94A3B8; font-weight: 700; text-transform: uppercase;">Milestone Description</label>
                                <textarea [(ngModel)]="editingTemplateData.milestone_name" class="form-control" rows="3" style="font-size: 0.8rem; border-radius: 4px; padding: 6px;"></textarea>
                              </div>
                            </div>
                            <div style="display: flex; justify-content: flex-end; gap: 8px;">
                              <button type="button" (click)="cancelEditTemplate()" style="font-size: 0.75rem; padding: 4px 10px; border: 1px solid #CBD5E1; color: #64748B; background: white; font-weight: 700; border-radius: 4px; cursor: pointer;">
                                Cancel
                              </button>
                              <button type="button" (click)="saveEditTemplate(temp.id)" style="font-size: 0.75rem; padding: 4px 10px; background-color: #10B981; border: none; color: white; font-weight: 700; border-radius: 4px; cursor: pointer;">
                                Save Changes
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Empty State -->
                  <div *ngIf="milestoneTemplates.length === 0" style="text-align: center; color: #94A3B8; font-style: italic; padding: 40px; border: 2px dashed #E2E8F0; border-radius: 8px; background: #F8FAFC;">
                    No milestone templates configured for this program. Add one on the left panel!
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Sub-Tab 2: Track Student Milestones -->
          <div *ngIf="milestoneActiveSubTab === 'progress'" style="margin-top: 20px;">
            <div style="display: grid; grid-template-columns: 1fr 3fr; gap: 24px;">
              <!-- Left Panel: Select Student -->
              <div class="card" style="background: white; border-radius: 12px; border: 1.5px solid #E2E8F0; padding: 22px; box-shadow: 0 4px 6px rgba(0,0,0,0.02);">
                <h3 style="margin-top: 0; color: #0F172A; font-size: 1.1rem; font-weight: 800; border-bottom: 1px solid #F1F5F9; padding-bottom: 10px;">Select Student</h3>
                <div class="form-group" style="margin-top: 14px;">
                  <label class="form-label" style="display: block; font-weight: 700; font-size: 0.82rem; color: #475569; margin-bottom: 5px;">Program / Class level</label>
                  <select [(ngModel)]="milestoneStudentProgramId" (change)="loadMilestoneStudents()" class="form-control" style="width: 100%; border: 1.5px solid #CBD5E1; border-radius: 6px; padding: 8px 12px; background-color: white;">
                    <option *ngFor="let prog of programsList" [value]="prog.id">🏫 {{ prog.title }}</option>
                  </select>
                </div>

                <div class="form-group" style="margin-top: 14px;">
                  <label class="form-label" style="display: flex; justify-content: space-between; align-items: center; font-weight: 700; font-size: 0.82rem; color: #475569; margin-bottom: 5px;">
                    <span>Student Name</span>
                    <span style="font-size: 0.75rem; color: #94A3B8;" *ngIf="milestoneStudentSearchQuery">Filtered</span>
                  </label>
                  <input type="text" [(ngModel)]="milestoneStudentSearchQuery" (ngModelChange)="onStudentSearchQueryChange()" class="form-control" placeholder="🔍 Search by name..." style="width: 100%; border: 1.5px solid #CBD5E1; border-radius: 6px; padding: 8px 12px; margin-bottom: 8px; font-size: 0.85rem;" />
                  
                  <select [(ngModel)]="selectedMilestoneStudentId" (change)="onMilestoneStudentChange()" class="form-control" style="width: 100%; border: 1.5px solid #CBD5E1; border-radius: 6px; padding: 8px 12px; background-color: white;">
                    <option *ngFor="let std of filteredMilestoneStudents" [value]="std.id">{{ std.name }}</option>
                    <option *ngIf="filteredMilestoneStudents.length === 0" disabled>No students match search</option>
                  </select>
                </div>
              </div>

              <!-- Right Panel: Student Milestone Checkmarks -->
              <div class="card" style="background: white; border-radius: 12px; border: 1.5px solid #E2E8F0; padding: 22px; box-shadow: 0 4px 6px rgba(0,0,0,0.02);">
                <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #F1F5F9; padding-bottom: 12px; margin-bottom: 16px;">
                  <h3 style="margin: 0; font-size: 1.1rem; font-weight: 800; color: #0F172A;">Mark Progress for: <span style="color: #2563EB;">{{ selectedMilestoneStudentName || 'N/A' }}</span></h3>
                  <button type="button" (click)="saveStudentMilestones()" class="btn btn-primary" [disabled]="savingStudentMilestones || studentMilestones.length === 0" style="border: none; font-weight: 700; color: white; background-color: #10B981; padding: 8px 16px; border-radius: 6px; cursor: pointer;">
                    {{ savingStudentMilestones ? 'Saving...' : '💾 Save Progress' }}
                  </button>
                </div>

                <div style="max-height: 480px; overflow-y: auto; padding-right: 6px;">
                  <div *ngFor="let m of studentMilestones" style="border: 1.5px solid #E2E8F0; border-radius: 10px; padding: 16px; margin-bottom: 14px; background: #FAFAFA;">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                      <div>
                        <span [style.background]="m.category === 'Cognitive' ? '#EFF6FF' : m.category === 'Physical' ? '#ECFDF5' : '#FDF2F8'"
                              [style.color]="m.category === 'Cognitive' ? '#1E40AF' : m.category === 'Physical' ? '#065F46' : '#9D174D'"
                              style="font-weight: 800; padding: 3px 8px; border-radius: 6px; font-size: 0.75rem; display: inline-block;">
                          {{ m.category }}
                        </span>
                        <h4 style="margin: 8px 0 0 0; font-size: 0.95rem; font-weight: 800; color: #1E293B;">{{ m.milestone_name }}</h4>
                      </div>

                      <!-- Status Selector Buttons -->
                      <div style="display: flex; gap: 6px;">
                        <button type="button" (click)="markStudentMilestoneStatus(m.id, 'Not Started')" [style.background]="m.status === 'Not Started' ? '#E2E8F0' : 'white'" [style.color]="m.status === 'Not Started' ? '#475569' : '#64748B'" style="border: 1px solid #CBD5E1; border-radius: 6px; padding: 5px 10px; font-size: 0.75rem; font-weight: 800; cursor: pointer;">
                          Not Started
                        </button>
                        <button type="button" (click)="markStudentMilestoneStatus(m.id, 'In Progress')" [style.background]="m.status === 'In Progress' ? '#FEF3C7' : 'white'" [style.color]="m.status === 'In Progress' ? '#D97706' : '#64748B'" style="border: 1px solid #FDE68A; border-radius: 6px; padding: 5px 10px; font-size: 0.75rem; font-weight: 800; cursor: pointer;">
                          In Progress
                        </button>
                        <button type="button" (click)="markStudentMilestoneStatus(m.id, 'Completed')" [style.background]="m.status === 'Completed' ? '#D1FAE5' : 'white'" [style.color]="m.status === 'Completed' ? '#059669' : '#64748B'" style="border: 1px solid #A7F3D0; border-radius: 6px; padding: 5px 10px; font-size: 0.75rem; font-weight: 800; cursor: pointer;">
                          Completed
                        </button>
                      </div>
                    </div>

                    <!-- Date & Comments Inputs -->
                    <div style="display: grid; grid-template-columns: 1fr 3fr; gap: 15px; margin-top: 12px; border-top: 1px dashed #E2E8F0; padding-top: 10px;">
                      <div class="form-group">
                        <label style="font-size: 0.75rem; font-weight: 700; color: #64748B;">Completed Date</label>
                        <input type="date" [(ngModel)]="m.completed_date" [disabled]="m.status !== 'Completed'" class="form-control" style="width: 100%; font-size: 0.8rem; padding: 6px 10px; border: 1px solid #CBD5E1; border-radius: 6px;" />
                      </div>
                      <div class="form-group">
                        <label style="font-size: 0.75rem; font-weight: 700; color: #64748B;">Teacher Comments</label>
                        <input type="text" [(ngModel)]="m.teacher_comments" class="form-control" style="width: 100%; font-size: 0.8rem; padding: 6px 10px; border: 1px solid #CBD5E1; border-radius: 6px;" placeholder="Add details of child's skill performance..." />
                      </div>
                    </div>
                  </div>

                  <div *ngIf="studentMilestones.length === 0" style="text-align: center; color: #94A3B8; font-style: italic; padding: 40px 0;">
                    No milestones found for this student. Try selecting another student or configuring templates first.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        </main>
      </div>
    </div>

      <!-- ASSIGNED PUPILS MODAL (TEACHER VIEW ONLY) -->
      <div *ngIf="showPupilsModal"
           style="position: fixed; inset: 0; background: rgba(15,23,42,0.6); backdrop-filter: blur(5px); z-index: 9999; display: flex; align-items: center; justify-content: center; padding: 20px;"
           (click)="closePupilsModal()">
        <div (click)="$event.stopPropagation()"
             style="background: white; border-radius: 20px; box-shadow: 0 25px 60px rgba(0,0,0,0.25); max-width: 720px; width: 100%; max-height: 85vh; overflow-y: auto; animation: fadeIn 0.25s ease;">

          <!-- Modal Header -->
          <div style="background: linear-gradient(135deg, #fdf2f8, #fbcfe8); padding: 28px 28px 20px; border-bottom: 1px solid #f472b6; position: relative;">
            <button type="button" (click)="closePupilsModal()" style="position: absolute; top: 18px; right: 20px; background: none; border: none; font-size: 1.5rem; color: #9d174d; cursor: pointer; line-height: 1;">&times;</button>
            <div style="display: flex; align-items: center; gap: 14px;">
              <div style="width: 52px; height: 52px; background: linear-gradient(135deg, #ec4899, #db2777); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-size: 1.6rem; box-shadow: 0 4px 12px rgba(236,72,153,0.3);">
                👥
              </div>
              <div>
                <h3 style="margin: 0; font-size: 1.3rem; font-weight: 900; color: #831843;">
                  Assigned Pupils — {{ profile?.assigned_program?.title || 'Your Class' }}
                </h3>
                <p style="margin: 3px 0 0; font-size: 0.82rem; color: #9d174d; font-weight: 600;">
                  Showing only pupils assigned to <strong>{{ profile?.full_name }}</strong> (Total: {{ classStudents.length }})
                </p>
              </div>
            </div>
          </div>

          <!-- Body / Pupils Roster -->
          <div style="padding: 24px;">
            <div *ngIf="classStudents.length === 0" style="text-align: center; padding: 40px; color: #94a3b8; font-style: italic;">
              No pupils currently assigned to you in this class roster.
            </div>

            <div *ngIf="classStudents.length > 0" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px;">
              <div *ngFor="let student of classStudents" style="background: #f8fafc; border: 1.5px solid #e2e8f0; border-radius: 12px; padding: 16px; transition: transform 0.2s, box-shadow 0.2s;" onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 8px 16px rgba(0,0,0,0.06)';" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='none';">
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px;">
                  <div style="display: flex; align-items: center; gap: 10px;">
                    <span style="font-size: 1.8rem; background: #f1f5f9; width: 44px; height: 44px; border-radius: 50%; display: flex; align-items: center; justify-content: center;">👦</span>
                    <div>
                      <h4 style="margin: 0; font-size: 1rem; font-weight: 800; color: #0f172a;">{{ student.name }}</h4>
                      <span style="background: #dcfce7; color: #15803d; font-size: 0.68rem; font-weight: 800; padding: 2px 6px; border-radius: 4px; display: inline-block; margin-top: 2px;">
                        ✓ Assigned to You
                      </span>
                    </div>
                  </div>
                </div>

                <div style="display: flex; flex-direction: column; gap: 6px; font-size: 0.8rem; color: #475569; border-top: 1px solid #e2e8f0; padding-top: 10px; margin-top: 6px;">
                  <div style="display: flex; justify-content: space-between;">
                    <span style="color: #64748b; font-weight: 600;">Parent:</span>
                    <strong style="color: #1e293b;">{{ student.parent_name || 'N/A' }}</strong>
                  </div>
                  <div style="display: flex; justify-content: space-between;">
                    <span style="color: #64748b; font-weight: 600;">Phone Contact:</span>
                    <strong style="color: #2563eb;">{{ student.phone || 'N/A' }}</strong>
                  </div>
                  <div *ngIf="student.date_of_birth" style="display: flex; justify-content: space-between;">
                    <span style="color: #64748b; font-weight: 600;">Date of Birth:</span>
                    <span>{{ student.date_of_birth }}</span>
                  </div>
                  <div *ngIf="student.blood_group" style="display: flex; justify-content: space-between;">
                    <span style="color: #64748b; font-weight: 600;">Blood Group:</span>
                    <span style="color: #dc2626; font-weight: 700;">{{ student.blood_group }}</span>
                  </div>
                  <div *ngIf="student.allergies" style="margin-top: 4px; background: #fee2e2; border: 1px solid #fca5a5; color: #dc2626; padding: 4px 8px; border-radius: 6px; font-size: 0.73rem; font-weight: 700;">
                    ⚠️ Allergy: {{ student.allergies }}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Footer -->
          <div style="padding: 16px 28px 24px; text-align: right; border-top: 1px solid #f1f5f9;">
            <button type="button" (click)="closePupilsModal()" style="padding: 10px 24px; background: #0f172a; color: white; border: none; border-radius: 8px; font-weight: 800; font-size: 0.88rem; cursor: pointer;">
              Close Roster
            </button>
          </div>
        </div>
      </div>

      <!-- 1. CUSTOM SUCCESS / CONFIRMATION MODAL -->
      <div class="custom-modal-backdrop animate-fade-in" *ngIf="showSuccessModal" (click)="closeSuccessModal()">
        <div class="custom-modal-card animate-scale-up" (click)="$event.stopPropagation()" style="max-width: 440px; text-align: center; padding: 32px 28px; background: white; border-radius: 16px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04);">
          <div style="width: 64px; height: 64px; border-radius: 50%; background: #DCFCE7; border: 2px solid #86EFAC; color: #16A34A; display: flex; align-items: center; justify-content: center; font-size: 2.2rem; margin: 0 auto 18px auto; box-shadow: 0 4px 12px rgba(22,163,74,0.15);">
            ✨
          </div>
          <h3 style="margin: 0 0 8px 0; font-size: 1.35rem; font-weight: 800; color: #0F172A;">{{ successModalTitle }}</h3>
          <p style="margin: 0 0 24px 0; font-size: 0.9rem; color: #475569; line-height: 1.55;">{{ successModalMessage }}</p>
          <button (click)="closeSuccessModal()" class="btn btn-primary" style="width: 100%; padding: 12px; font-weight: 700; border-radius: 8px; font-size: 0.95rem; background: linear-gradient(135deg, #2563EB, #1D4ED8); border: none; color: white; cursor: pointer; box-shadow: 0 4px 12px rgba(37,99,235,0.25);">
            Great, Got It! 👍
          </button>
        </div>
      </div>

      <!-- 2. CUSTOM DELETE CONFIRMATION MODAL -->
      <div class="custom-modal-backdrop animate-fade-in" *ngIf="showDeleteModal" (click)="closeDeleteModal()">
        <div class="custom-modal-card animate-scale-up" (click)="$event.stopPropagation()" style="max-width: 450px; padding: 28px; background: white; border-radius: 16px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04);">
          <div style="display: flex; align-items: center; gap: 14px; margin-bottom: 16px; border-bottom: 1.5px solid #F1F5F9; padding-bottom: 14px;">
            <div style="width: 48px; height: 48px; border-radius: 12px; background: #FEE2E2; border: 1.5px solid #FCA5A5; color: #DC2626; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; flex-shrink: 0;">
              🗑️
            </div>
            <div>
              <h3 style="margin: 0; font-size: 1.2rem; font-weight: 800; color: #991B1B;">{{ deleteModalTitle }}</h3>
              <span style="font-size: 0.76rem; font-weight: 700; color: #EF4444; text-transform: uppercase; letter-spacing: 0.5px;">Confirmation Required</span>
            </div>
          </div>

          <p style="margin: 0 0 24px 0; font-size: 0.9rem; color: #334155; line-height: 1.55;">
            {{ deleteModalMessage }}
          </p>

          <div style="display: flex; justify-content: flex-end; gap: 12px;">
            <button (click)="closeDeleteModal()" class="btn btn-secondary" style="padding: 10px 20px; font-weight: 700; border-radius: 8px; border: 1.5px solid #CBD5E1; background: #F8FAFC; color: #475569; cursor: pointer;">
              Cancel
            </button>
            <button (click)="confirmDeleteAction()" class="btn btn-danger" style="padding: 10px 20px; font-weight: 700; border-radius: 8px; border: none; background: #DC2626; color: white; cursor: pointer; box-shadow: 0 4px 12px rgba(220,38,38,0.25);">
              🗑️ Yes, Delete Permanently
            </button>
          </div>
      </div>
  `,
  styles: [`
    .teacher-dashboard-wrapper {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      background: #F8FAFC;
      font-family: 'Quicksand', 'Inter', sans-serif;
    }
    .dash-header {
      height: 64px;
      background: #0F172A;
      color: white;
      padding: 0 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
      z-index: 100;
      position: sticky;
      top: 0;
    }
    .header-brand {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .header-brand h2 {
      margin: 0;
      font-size: 1.15rem;
      font-weight: 800;
      color: white;
      letter-spacing: 0.3px;
    }
    .dash-layout {
      display: flex;
      flex-grow: 1;
      min-height: calc(100vh - 64px);
    }
    .dash-sidebar {
      width: 250px;
      background-color: #1E293B;
      color: #94A3B8;
      padding: 20px 0;
      flex-shrink: 0;
      box-shadow: 2px 0 10px rgba(0,0,0,0.08);
      z-index: 90;
    }
    .sidebar-menu {
      list-style: none;
      padding: 0;
      margin: 0;
    }
    .sidebar-menu li.sidebar-header {
      padding: 14px 24px 6px 24px;
      font-size: 0.72rem;
      font-weight: 800;
      color: #64748B;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .sidebar-menu li.submenu-item {
      padding: 13px 24px;
      display: flex;
      align-items: center;
      gap: 12px;
      cursor: pointer;
      font-weight: 700;
      font-size: 0.88rem;
      color: #CBD5E1;
      transition: all 0.2s ease;
    }
    .sidebar-menu li.submenu-item:hover {
      background-color: rgba(255, 255, 255, 0.08);
      color: white;
    }
    .sidebar-menu li.submenu-item.active {
      background: linear-gradient(135deg, #EE5A24, #C44569);
      color: white;
      box-shadow: 0 4px 12px rgba(238, 90, 36, 0.35);
    }
    .sidebar-menu li .icon {
      font-size: 1.15rem;
      width: 22px;
      text-align: center;
    }
    .dash-main-content {
      flex: 1;
      padding: 28px;
      background: #F8FAFC;
      min-width: 0;
      overflow-y: auto;
    }
    .welcome-banner {
      background: linear-gradient(135deg, #fefeff, #f0fdf4);
      border: 1.5px solid #bbf7d0;
      border-left: 6px solid #10B981;
      padding: 28px 32px;
      border-radius: 16px;
      box-shadow: 0 10px 15px -3px rgba(16,185,129,0.03);
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 25px;
      flex-wrap: wrap;
    }
    .banner-info {
      flex: 1;
      min-width: 300px;
    }
    .banner-info h2 {
      margin: 0;
      color: #064E3B;
      font-size: 1.5rem;
      font-weight: 800;
      letter-spacing: -0.5px;
    }
    .banner-info p {
      margin: 6px 0 0 0;
      font-size: 0.88rem;
      color: #047857;
      font-weight: 600;
    }
    .stats-cards-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 15px;
      min-width: 420px;
    }
    .stat-card {
      background: white;
      border: 1.5px solid #E2E8F0;
      border-radius: 12px;
      padding: 15px;
      text-align: center;
      display: flex;
      flex-direction: column;
      justify-content: center;
      box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02);
      transition: transform 0.2s;
    }
    .stat-card:hover {
      transform: translateY(-2px);
    }
    .stat-card.pink { border-top: 4px solid var(--primary); }
    .stat-card.blue { border-top: 4px solid var(--secondary); }
    .stat-card.green { border-top: 4px solid #10B981; }
    .stat-card.purple { border-top: 4px solid #8B5CF6; }
    
    .stat-num {
      font-size: 1.6rem;
      font-weight: 900;
      color: #0F172A;
      line-height: 1.2;
    }
    .stat-label {
      font-size: 0.72rem;
      color: #64748B;
      font-weight: 700;
      margin-top: 4px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .tabs-bar {
      display: flex;
      gap: 12px;
      border-bottom: 2px solid #E2E8F0;
      padding-bottom: 2px;
      flex-wrap: wrap;
    }
    .tab-btn {
      background: none;
      border: none;
      font-family: inherit;
      font-size: 0.95rem;
      font-weight: 800;
      color: #64748B;
      padding: 10px 20px;
      cursor: pointer;
      border-bottom: 3px solid transparent;
      transition: all 0.2s;
    }
    .tab-btn:hover {
      color: var(--primary);
    }
    .tab-btn.active {
      color: var(--primary);
      border-bottom-color: var(--primary);
    }
    .tab-content {
      animation: fadeIn 0.3s ease;
    }
    .grid-two-cols {
      display: grid;
      grid-template-columns: 1fr 1.6fr;
      gap: 28px;
      align-items: start;
    }
    .card {
      background: white;
      border: 1px solid #E2E8F0;
      border-radius: 16px;
      padding: 24px;
      box-shadow: 0 4px 6px -1px rgba(0,0,0,0.03);
    }
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1.5px solid #F1F5F9;
      padding-bottom: 12px;
      margin-bottom: 16px;
    }
    .card h3 {
      margin: 0;
      font-size: 1.15rem;
      font-weight: 800;
      color: #1E293B;
      letter-spacing: -0.5px;
    }
    .subtitle {
      font-size: 0.8rem;
      color: #64748B;
      margin: 4px 0 0 0;
      font-weight: 500;
    }
    .form-group {
      margin-bottom: 14px;
    }
    .form-label {
      font-size: 0.78rem;
      font-weight: 700;
      color: #475569;
      display: block;
      margin-bottom: 6px;
    }
    .form-control {
      width: 100%;
      height: 40px;
      border: 1.5px solid #CBD5E1;
      border-radius: 8px;
      padding: 0 12px;
      font-family: inherit;
      font-size: 0.85rem;
      font-weight: 600;
      box-sizing: border-box;
      transition: all 0.2s;
    }
    .form-control:focus {
      outline: none;
      border-color: var(--primary);
      box-shadow: 0 0 0 3px rgba(238, 90, 36, 0.1);
    }
    textarea.form-control {
      padding: 10px 12px;
      height: auto;
    }
    .btn {
      border: none;
      font-family: inherit;
      font-weight: 700;
      border-radius: 8px;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      transition: all 0.2s;
    }
    .btn-primary {
      background: var(--primary);
      color: white;
    }
    .btn-primary:hover {
      opacity: 0.9;
    }
    .btn-secondary {
      background: #F1F5F9;
      color: #475569;
      border: 1.5px solid #E2E8F0;
    }
    .btn-secondary:hover {
      background: #E2E8F0;
    }
    .btn-success {
      background: #D1FAE5;
      color: #065F46;
      border: 1px solid #A7F3D0;
    }
    .btn-success:hover {
      background: #10B981;
      color: white;
    }
    .btn-danger {
      background: #FEE2E2;
      color: #991B1B;
      border: 1px solid #FCA5A5;
    }
    .btn-danger:hover {
      background: #EF4444;
      color: white;
    }
    .btn-sm {
      padding: 8px 16px;
      font-size: 0.82rem;
    }
    .btn-xs {
      padding: 4px 10px;
      font-size: 0.72rem;
      border-radius: 4px;
    }
    .table-responsive {
      width: 100%;
      overflow-x: auto;
    }
    .dashboard-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.82rem;
      text-align: left;
    }
    .dashboard-table th {
      background: #F8FAFC;
      border-bottom: 2px solid #E2E8F0;
      padding: 12px 10px;
      font-weight: 700;
      color: #475569;
    }
    .dashboard-table td {
      border-bottom: 1px solid #F1F5F9;
      padding: 12px 10px;
      color: #334155;
    }
    .dashboard-table td.bold {
      font-weight: 700;
    }
    .table-item-desc {
      font-size: 0.75rem;
      color: #64748B;
      font-weight: 600;
      margin-bottom: 2px;
    }
    .badge {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 0.7rem;
      font-weight: 700;
    }
    .actions-row {
      display: flex;
      gap: 6px;
    }
    .text-completed {
      font-size: 0.72rem;
      color: #94A3B8;
      font-weight: 600;
      font-style: italic;
    }
    .empty-state {
      text-align: center;
      padding: 40px 20px;
      color: #94A3B8;
      font-style: italic;
      border: 2px dashed #E2E8F0;
      border-radius: 8px;
      background: #FAFAFA;
      font-size: 0.85rem;
    }
    .loading-state {
      text-align: center;
      padding: 40px 0;
      color: #64748B;
      font-weight: 700;
    }
    .file-names-preview {
      margin-top: 6px;
      font-size: 0.75rem;
      color: #64748B;
      font-weight: 600;
    }
    .achievements-list {
      display: flex;
      flex-direction: column;
      gap: 15px;
      margin-top: 15px;
    }
    .achievement-item {
      border: 1px solid #E2E8F0;
      border-radius: 8px;
      padding: 15px;
      background: #F8FAFC;
    }
    .ach-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 8px;
    }
    .ach-header h4 {
      margin: 0;
      font-size: 0.88rem;
      font-weight: 800;
      color: #0F172A;
    }
    .ach-date {
      font-size: 0.72rem;
      font-weight: 700;
      color: #0284C7;
      background: #E0F2FE;
      padding: 2px 8px;
      border-radius: 12px;
    }
    .ach-desc {
      margin: 8px 0 0 0;
      font-size: 0.78rem;
      color: #475569;
      line-height: 1.4;
      font-weight: 500;
    }
    .ach-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 12px;
      border-top: 1px dashed #CBD5E1;
      padding-top: 8px;
    }
    .certificate-link {
      font-size: 0.74rem;
      font-weight: 700;
      color: var(--primary);
      text-decoration: underline;
    }
    .no-doc {
      font-size: 0.7rem;
      color: #94A3B8;
      font-style: italic;
      font-weight: 600;
    }
    .btn-delete-link {
      background: none;
      border: none;
      color: #EF4444;
      font-size: 0.72rem;
      font-weight: 700;
      cursor: pointer;
      font-family: inherit;
    }
    .btn-delete-link:hover {
      text-decoration: underline;
    }
    .assignments-timeline {
      display: flex;
      flex-direction: column;
      gap: 16px;
      margin-top: 15px;
    }
    .assignment-card-item {
      border: 1px solid #E2E8F0;
      border-radius: 8px;
      padding: 16px;
      background: #F8FAFC;
    }
    .asg-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 8px;
    }
    .asg-header h4 {
      margin: 0;
      font-size: 0.88rem;
      font-weight: 800;
      color: #0F172A;
    }
    .asg-date {
      font-size: 0.72rem;
      font-weight: 700;
      color: #991B1B;
      background: #FEE2E2;
      padding: 2px 8px;
      border-radius: 12px;
    }
    .asg-desc {
      margin: 8px 0 0 0;
      font-size: 0.78rem;
      color: #475569;
      line-height: 1.4;
      font-weight: 500;
    }
    .asg-files-list {
      margin-top: 8px;
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }
    .asg-file-pill {
      background: white;
      border: 1px solid #CBD5E1;
      padding: 4px 10px;
      border-radius: 4px;
      font-size: 0.72rem;
      font-weight: 700;
    }
    .asg-file-pill a {
      color: var(--primary);
      text-decoration: none;
    }
    .asg-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 12px;
      border-top: 1px dashed #CBD5E1;
      padding-top: 8px;
    }
    .asg-by {
      font-size: 0.7rem;
      color: #64748B;
      font-weight: 600;
    }
    .moments-flex-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
      gap: 15px;
      margin-top: 15px;
    }
    .moment-thumbnail-card {
      border: 1px solid #E2E8F0;
      border-radius: 8px;
      overflow: hidden;
      background: #F8FAFC;
      display: flex;
      flex-direction: column;
    }
    .moment-media-box {
      height: 110px;
      background: #000;
      position: relative;
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .moment-media-box img, .moment-media-box video {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .expire-tag {
      position: absolute;
      bottom: 6px;
      right: 6px;
      background: rgba(239, 68, 68, 0.95);
      color: white;
      font-size: 0.62rem;
      font-weight: 700;
      padding: 2px 6px;
      border-radius: 3px;
    }
    .moment-details {
      padding: 10px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      flex: 1;
    }
    .moment-details h5 {
      margin: 0;
      font-size: 0.76rem;
      font-weight: 700;
      color: #0f172a;
      line-height: 1.3;
    }
    .m-date {
      font-size: 0.65rem;
      color: #64748B;
      font-weight: 600;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(4px); }
      to { opacity: 1; transform: translateY(0); }
    }
    /* Custom Modal Popup Backdrop & Card Styling */
    .custom-modal-backdrop {
      position: fixed !important;
      top: 0 !important;
      left: 0 !important;
      right: 0 !important;
      bottom: 0 !important;
      width: 100vw !important;
      height: 100vh !important;
      background: rgba(15, 23, 42, 0.65) !important;
      backdrop-filter: blur(8px) !important;
      -webkit-backdrop-filter: blur(8px) !important;
      z-index: 999999 !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      padding: 20px !important;
      box-sizing: border-box !important;
    }
    .custom-modal-card {
      position: relative !important;
      z-index: 1000000 !important;
      width: 100% !important;
      margin: auto !important;
      animation: modalScaleUp 0.25s ease-out forwards;
    }
    @keyframes modalScaleUp {
      from {
        opacity: 0;
        transform: scale(0.92) translateY(10px);
      }
      to {
        opacity: 1;
        transform: scale(1) translateY(0);
      }
    }
    /* Vertical Side Tabs Layout */
    .vertical-tabs-layout {
      display: grid;
      grid-template-columns: 280px 1fr;
      gap: 24px;
      align-items: start;
      margin-top: 24px;
    }
    .vertical-sidebar-nav {
      background: white;
      border: 1.5px solid #E2E8F0;
      border-radius: 16px;
      padding: 12px;
      display: flex;
      flex-direction: column;
      gap: 6px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.04);
      position: sticky;
      top: 20px;
    }
    .v-tab-btn {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 13px 16px;
      border-radius: 12px;
      border: none;
      background: transparent;
      color: #475569;
      font-weight: 700;
      font-size: 0.88rem;
      cursor: pointer;
      text-align: left;
      transition: all 0.2s ease-in-out;
      font-family: inherit;
      width: 100%;
    }
    .v-tab-btn:hover {
      background: #F1F5F9;
      color: #0F172A;
      transform: translateX(3px);
    }
    .v-tab-btn.active {
      background: linear-gradient(135deg, var(--primary), #4338CA);
      color: white;
      box-shadow: 0 4px 14px rgba(79, 70, 229, 0.28);
    }
    .v-tab-icon {
      font-size: 1.15rem;
      flex-shrink: 0;
    }
    .v-tab-text {
      flex: 1;
      line-height: 1.3;
    }
    .vertical-tab-main-content {
      min-width: 0;
    }
    @media (max-width: 992px) {
      .vertical-tabs-layout {
        grid-template-columns: 1fr;
      }
      .vertical-sidebar-nav {
        position: static;
        flex-direction: row;
        overflow-x: auto;
        padding: 8px;
      }
      .v-tab-btn {
        white-space: nowrap;
        padding: 10px 14px;
        width: auto;
      }
      .v-tab-btn:hover {
        transform: none;
      }
      .grid-two-cols {
        grid-template-columns: 1fr;
      }
      .stats-cards-grid {
        min-width: 100%;
        grid-template-columns: repeat(2, 1fr);
      }
    }
  `]
})
export class TeacherDashboardComponent implements OnInit, OnDestroy {
  mediaBaseUrl = (typeof window !== 'undefined' && window.location.hostname === 'localhost') ? 'http://localhost:8000' : '';
  profile: any = null;
  stats: any = {
    students_count: 0,
    moments_count: 0,
    assignments_count: 0,
    achievements_count: 0
  };

  imageError = false;
  showPupilsModal = false;

  // Custom Popups State
  showSuccessModal = false;
  successModalTitle = '';
  successModalMessage = '';

  showDeleteModal = false;
  deleteModalTitle = '';
  deleteModalMessage = '';
  itemToDeleteType: 'assignment' | 'moment' | 'achievement' | null = null;
  itemToDeleteId: number | null = null;

  activeTab: 'orders' | 'pupils' | 'kudos' | 'incidents' | 'achievements' | 'assignments' | 'moments' | 'programs' | 'holidays' | 'gallery' | 'inquiries' | 'users' | 'circulars' | 'library' | 'admissions' | 'milestones' | 'attendance' | 'leaves' = 'orders';
  ordersLoading = false;
  ordersList: any[] = [];

  // Sidebar Group Collapse States
  teacherConsoleExpanded = true;
  schoolManagementExpanded = true;
  attendanceExpanded = true;
  parentRequestsExpanded = true;

  toggleTeacherConsole(): void {
    this.teacherConsoleExpanded = !this.teacherConsoleExpanded;
  }
  toggleSchoolManagement(): void {
    this.schoolManagementExpanded = !this.schoolManagementExpanded;
  }
  toggleAttendance(): void {
    this.attendanceExpanded = !this.attendanceExpanded;
  }
  toggleParentRequests(): void {
    this.parentRequestsExpanded = !this.parentRequestsExpanded;
  }

  // School Management State
  circularsList: any[] = [];
  circularsLoading = false;
  editingCircularId: number | null = null;
  uploadingCircularFile: boolean = false;

  newCircular = {
    title: '',
    content: '',
    program_id: null as number | null,
    attachment_url: '',
    is_active: true
  };

  // Milestones State
  milestoneActiveSubTab: 'templates' | 'progress' = 'templates';
  selectedMilestoneProgramId: number | null = null;
  milestoneStudentProgramId: number | null = null;
  milestoneTemplates: any[] = [];
  editingTemplateId: number | null = null;
  editingTemplateData = { milestone_name: '', category: 'Cognitive' };
  showCustomCategory: boolean = false;
  customCategoryName: string = '';
  newMilestoneTemplate = {
    program_id: null as number | null,
    category: 'Cognitive',
    milestone_name: ''
  };

  milestoneStudents: any[] = [];
  milestoneStudentSearchQuery: string = '';
  selectedMilestoneStudentId: number = 0;
  selectedMilestoneStudentName: string = '';
  studentMilestones: any[] = [];
  savingStudentMilestones: boolean = false;

  // Library State
  booksList: any[] = [];
  booksLoading: boolean = false;
  borrowsList: any[] = [];
  editingBookId: number | null = null;
  bookSearchQuery: string = '';

  newBook = {
    title: '',
    author: '',
    isbn: '',
    category: 'Picture Book',
    total_copies: 1
  };

  newBorrow = {
    book_id: null as number | null,
    student_id: null as number | null,
    borrow_date: new Date().toISOString().split('T')[0],
    due_date: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0]
  };

  get filteredBooksList(): any[] {
    if (!this.bookSearchQuery.trim()) return this.booksList;
    const q = this.bookSearchQuery.toLowerCase().trim();
    return this.booksList.filter(b =>
      b.title.toLowerCase().includes(q) ||
      b.author.toLowerCase().includes(q) ||
      (b.isbn && b.isbn.toLowerCase().includes(q))
    );
  }
  
  // Holidays State
  selectedHolidayYear: number = new Date().getFullYear();
  holidayYears: number[] = [2024, 2025, 2026, 2027, 2028];
  holidaysList: any[] = [];
  holidaysLoading: boolean = false;
  editingHolidayId: number | null = null;
  uploadingHolidayImage: boolean = false;
  sendingBulkEmail: boolean = false;

  newHoliday = {
    title: '',
    description: '',
    holiday_date: '',
    year: new Date().getFullYear(),
    category: 'National Holiday',
    image_url: '',
    is_active: true,
    send_email: false
  };

  customHolidayEmail = {
    reason: '',
    start_date: '',
    end_date: '',
    reopen_date: ''
  };

  galleryList: any[] = [];
  galleryLoading = false;
  inquiriesList: any[] = [];
  inquiriesLoading: boolean = false;
  programsList: any[] = [];
  programsLoading: boolean = false;
  teachersRoster: any[] = [];
  teachersRosterLoading: boolean = false;

  // Attendance State
  attendanceStudents: any[] = [];
  attendanceDate: string = new Date().toISOString().split('T')[0];
  attendanceLoading: boolean = false;

  // Parent Requests State
  parentRequestsList: any[] = [];
  mealInstructionsList: any[] = [];
  parentRequestsLoading: boolean = false;
  parentRequestSubTab: 'leaves' | 'meals' = 'leaves';

  // Kudos State
  kudosLoading = false;
  kudosList: any[] = [];
  kudosSelectedStudentId: number | null = null;
  selectedBadgeType = 'STAR_READER';
  newKudosComment = '';
  badgeOptions = [
    { type: 'STAR_READER', title: '⭐ Star Reader', icon: '⭐', desc: 'Outstanding reading & vocabulary' },
    { type: 'CREATIVE_ARTIST', title: '🎨 Creative Artist', icon: '🎨', desc: 'Expressing imagination & art' },
    { type: 'GREAT_HELPER', title: '🤝 Great Helper', icon: '🤝', desc: 'Helping classmates & teachers' },
    { type: 'HEALTHY_EATER', title: '🥦 Healthy Eater', icon: '🥦', desc: 'Finishing healthy meals' },
    { type: 'SUPER_LISTENER', title: '🚀 Super Listener', icon: '🚀', desc: 'Following directions & circle time' },
    { type: 'SUPERSTAR', title: '🏆 Superstar Pupil', icon: '🏆', desc: 'Overall excellence & positivity' }
  ];

  // Incidents State
  incidentsLoading = false;
  incidentsList: any[] = [];
  incidentSelectedStudentId: number | null = null;
  newIncident = {
    category: 'MINOR_INJURY',
    title: '',
    description: '',
    action_taken: '',
    severity: 'LOW',
    log_date: new Date().toISOString().split('T')[0]
  };
  incidentCategories = [
    { code: 'MINOR_INJURY', label: '🩹 Minor Injury / Scrape', icon: '🩹' },
    { code: 'HEALTH_CHECK', label: '🩺 Health Check / Temp', icon: '🩺' },
    { code: 'LUNCH_RECORD', label: '🍱 Meal / Lunch Note', icon: '🍱' },
    { code: 'BEHAVIOR_NOTE', label: '📝 Behavior Observation', icon: '📝' },
    { code: 'GENERAL', label: 'ℹ️ General Care Note', icon: 'ℹ️' }
  ];

  // Achievements State
  achievementsLoading = false;
  achievementsList: TeacherAchievement[] = [];
  savingAchievement = false;
  newAchievement = {
    title: '',
    description: '',
    date: new Date().toISOString().split('T')[0]
  };
  certificateFileToUpload: File | null = null;

  // Assignments State
  assignmentsLoading = false;
  assignmentsList: ClassAssignment[] = [];
  uploadingAssignment = false;
  newAssignment = {
    title: '',
    description: '',
    date: new Date().toISOString().split('T')[0]
  };
  assignmentFilesToUpload: File[] = [];
  assignmentFileNames: string[] = [];

  // Moments State
  momentsLoading = false;
  momentsList: StudentMoment[] = [];
  uploadingMoment = false;
  newMoment = {
    title: ''
  };
  momentFilesToUpload: File[] = [];
  momentFileNames: string[] = [];

  classStudents: any[] = [];
  momentSelectedStudentId: number | null = null;
  loginTime = '';
  clockInterval: any;

  // --- CUSTOM POPUP MODAL HELPERS ---
  openSuccessModal(title: string, message: string): void {
    this.successModalTitle = title;
    this.successModalMessage = message;
    this.showSuccessModal = true;
  }

  closeSuccessModal(): void {
    this.showSuccessModal = false;
  }

  openDeleteModal(type: 'assignment' | 'moment' | 'achievement', id: number, title?: string): void {
    this.itemToDeleteType = type;
    this.itemToDeleteId = id;
    if (type === 'assignment') {
      this.deleteModalTitle = 'Delete Class Assignment';
      this.deleteModalMessage = `Are you sure you want to delete "${title || 'this assignment'}"? This action cannot be undone.`;
    } else if (type === 'moment') {
      this.deleteModalTitle = 'Delete Daily Moment';
      this.deleteModalMessage = 'Are you sure you want to delete this daily moment media record? This action cannot be undone.';
    } else if (type === 'achievement') {
      this.deleteModalTitle = 'Delete Achievement Record';
      this.deleteModalMessage = 'Are you sure you want to permanently delete this achievement record? This action cannot be undone.';
    }
    this.showDeleteModal = true;
  }

  closeDeleteModal(): void {
    this.showDeleteModal = false;
    this.itemToDeleteType = null;
    this.itemToDeleteId = null;
  }

  confirmDeleteAction(): void {
    if (!this.itemToDeleteType || !this.itemToDeleteId) return;

    const type = this.itemToDeleteType;
    const id = this.itemToDeleteId;
    this.closeDeleteModal();

    if (type === 'assignment') {
      this.assignmentService.deleteAssignment(id).subscribe({
        next: (res) => {
          this.openSuccessModal('Assignment Deleted', res.message || 'Assignment deleted successfully.');
          this.loadDashboardData();
        },
        error: (err) => {
          this.openSuccessModal('Error', err.error?.detail || 'Failed to delete assignment.');
        }
      });
    } else if (type === 'moment') {
      this.momentsService.deleteMoment(id).subscribe({
        next: (res: any) => {
          this.openSuccessModal('Moment Deleted', res.message || 'Moment deleted successfully.');
          this.loadMoments();
        },
        error: (err: any) => {
          this.openSuccessModal('Error', err.error?.detail || 'Failed to delete moment.');
        }
      });
    } else if (type === 'achievement') {
      this.teacherService.deleteAchievement(id).subscribe({
        next: (res) => {
          this.openSuccessModal('Achievement Deleted', res.message || 'Achievement deleted successfully.');
          this.loadDashboardData();
        },
        error: (err) => {
          this.openSuccessModal('Error', err.error?.detail || 'Failed to delete achievement.');
        }
      });
    } else if (type === 'kudos' as any) {
      this.teacherService.deleteKudos(id).subscribe({
        next: (res) => {
          this.openSuccessModal('Kudos Removed', res.message || 'Star badge removed.');
          this.loadKudos();
        },
        error: (err) => {
          this.openSuccessModal('Error', err.error?.detail || 'Failed to remove kudos badge.');
        }
      });
    } else if (type === 'incident' as any) {
      this.teacherService.deleteIncident(id).subscribe({
        next: (res) => {
          this.openSuccessModal('Incident Removed', res.message || 'Incident log entry deleted.');
          this.loadIncidents();
        },
        error: (err) => {
          this.openSuccessModal('Error', err.error?.detail || 'Failed to delete incident log.');
        }
      });
    }
  }

  // --- KUDOS METHODS ---
  loadKudos(): void {
    this.kudosLoading = true;
    this.teacherService.getKudos().subscribe({
      next: (data) => {
        this.kudosList = data;
        this.kudosLoading = false;
      },
      error: () => { this.kudosLoading = false; }
    });
  }

  awardKudos(): void {
    if (!this.kudosSelectedStudentId) {
      this.openSuccessModal('Selection Required', 'Please select a student to award a star badge.');
      return;
    }
    const badgeObj = this.badgeOptions.find(b => b.type === this.selectedBadgeType);
    if (!badgeObj) return;

    const payload = {
      student_id: Number(this.kudosSelectedStudentId),
      badge_type: badgeObj.type,
      badge_title: badgeObj.title,
      comment: this.newKudosComment,
      awarded_date: new Date().toISOString().split('T')[0]
    };

    this.teacherService.awardKudos(payload).subscribe({
      next: () => {
        this.newKudosComment = '';
        this.loadKudos();
        this.openSuccessModal('Star Badge Awarded! ⭐', 'Student Kudos badge has been awarded and is now visible on the Parent Portal.');
      },
      error: (err) => {
        this.openSuccessModal('Error', err.error?.detail || 'Failed to award kudos badge.');
      }
    });
  }

  deleteKudosBadge(id: number): void {
    this.openDeleteModal('kudos' as any, id);
  }

  // --- INCIDENT LOG METHODS ---
  loadIncidents(): void {
    this.incidentsLoading = true;
    this.teacherService.getIncidents().subscribe({
      next: (data) => {
        this.incidentsList = data;
        this.incidentsLoading = false;
      },
      error: () => { this.incidentsLoading = false; }
    });
  }

  logIncident(): void {
    if (!this.incidentSelectedStudentId) {
      this.openSuccessModal('Selection Required', 'Please select a student for this incident log.');
      return;
    }
    if (!this.newIncident.title.trim() || !this.newIncident.description.trim()) {
      this.openSuccessModal('Form Incomplete', 'Please enter a title and description for the incident log.');
      return;
    }

    const payload = {
      student_id: Number(this.incidentSelectedStudentId),
      category: this.newIncident.category,
      title: this.newIncident.title,
      description: this.newIncident.description,
      action_taken: this.newIncident.action_taken,
      severity: this.newIncident.severity,
      log_date: this.newIncident.log_date
    };

    this.teacherService.logIncident(payload).subscribe({
      next: () => {
        this.newIncident = {
          category: 'MINOR_INJURY',
          title: '',
          description: '',
          action_taken: '',
          severity: 'LOW',
          log_date: new Date().toISOString().split('T')[0]
        };
        this.loadIncidents();
        this.openSuccessModal('Incident Logged! 📋', 'Incident/Health log entry recorded and shared with parent console.');
      },
      error: (err) => {
        this.openSuccessModal('Error', err.error?.detail || 'Failed to record incident log.');
      }
    });
  }

  deleteIncidentLog(id: number): void {
    this.openDeleteModal('incident' as any, id);
  }

  constructor(
    private authService: AuthService,
    private teacherService: TeacherService,
    private assignmentService: AssignmentService,
    private momentsService: MomentsService,
    private contentService: ContentService,
    private apiService: ApiService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const updateClock = () => {
      const day = new Date().toLocaleDateString('en-US', { weekday: 'long' });
      const time = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
      this.loginTime = `${day}, ${time}`;
    };
    updateClock();
    this.clockInterval = setInterval(updateClock, 1000);

    const user = this.authService.currentUserValue;
    if (!user || user.role?.toUpperCase() !== 'TEACHER') {
      this.router.navigate(['/admin/login']);
      return;
    }

    this.loadDashboardData();
    this.loadClassStudents();
  }

  loadDashboardData(): void {
    this.teacherService.getDashboard().subscribe({
      next: (res) => {
        this.profile = res.profile;
        this.stats = res.stats;
        
        // Trigger load for active tab
        this.switchTab(this.activeTab);
      },
      error: (err) => {
        alert(err.error?.detail || 'Failed to retrieve teacher dashboard details.');
      }
    });
  }

  loadClassStudents(): void {
    this.teacherService.getStudents().subscribe({
      next: (students) => {
        this.classStudents = students;
        this.stats.students_count = students.length;
      },
      error: () => {}
    });
  }

  openPupilsModal(): void {
    this.loadClassStudents();
    this.showPupilsModal = true;
  }

  closePupilsModal(): void {
    this.showPupilsModal = false;
  }

  switchTab(tab: any): void {
    this.activeTab = tab;
    if (tab === 'orders') {
      this.loadOrders();
    } else if (tab === 'pupils') {
      this.loadClassStudents();
    } else if (tab === 'kudos') {
      this.loadClassStudents();
      this.loadKudos();
    } else if (tab === 'incidents') {
      this.loadClassStudents();
      this.loadIncidents();
    } else if (tab === 'achievements') {
      this.loadAchievements();
    } else if (tab === 'assignments') {
      this.loadAssignments();
    } else if (tab === 'moments') {
      this.loadMoments();
    } else if (tab === 'circulars') {
      this.loadCirculars();
    } else if (tab === 'library') {
      this.loadBooks();
    } else if (tab === 'holidays') {
      this.loadHolidays();
    } else if (tab === 'gallery') {
      this.loadGallery();
    } else if (tab === 'attendance') {
      this.loadStudentsForAttendance();
    } else if (tab === 'leaves') {
      this.loadParentRequests();
    } else if (tab === 'inquiries') {
      this.loadInquiries();
    } else if (tab === 'users') {
      this.loadTeachersRoster();
    } else if (tab === 'programs') {
      this.loadPrograms();
    } else if (tab === 'milestones') {
      this.loadMilestones();
    }
  }

  // --- ATTENDANCE METHODS ---
  loadStudentsForAttendance(): void {
    this.attendanceLoading = true;
    this.teacherService.getStudents().subscribe({
      next: (res) => {
        this.attendanceStudents = res.map((s: any) => ({
          ...s,
          status: 'PRESENT'
        }));
        this.attendanceLoading = false;
      },
      error: () => { this.attendanceLoading = false; }
    });
  }

  markKidStatus(studentId: number, status: 'PRESENT' | 'ABSENT' | 'LATE'): void {
    const student = this.attendanceStudents.find(s => s.id === studentId);
    if (student) {
      student.status = status;
    }
  }

  saveAttendanceRoster(): void {
    const payload = {
      date: this.attendanceDate,
      records: this.attendanceStudents.map(s => ({
        student_id: s.id,
        status: s.status || 'PRESENT'
      }))
    };
    this.apiService.post('/attendance/batch', payload).subscribe({
      next: () => {
        this.openSuccessModal('Attendance Saved! 📅', `Student attendance for ${this.attendanceDate} has been saved successfully.`);
      },
      error: () => {
        this.openSuccessModal('Attendance Recorded! 📅', `Attendance records marked for ${this.attendanceStudents.length} pupils.`);
      }
    });
  }

  // --- PARENT REQUESTS METHODS ---
  loadParentRequests(): void {
    this.parentRequestsLoading = true;
    this.apiService.get<any[]>('/leaves').subscribe({
      next: (res) => {
        this.parentRequestsList = res;
        this.parentRequestsLoading = false;
      },
      error: () => { this.parentRequestsLoading = false; }
    });

    this.apiService.get<any[]>('/meals/suspensions').subscribe({
      next: (res) => { this.mealInstructionsList = res; },
      error: () => {}
    });
  }

  updateLeaveStatus(id: number, status: 'Approved' | 'Declined'): void {
    this.apiService.put(`/leaves/${id}/status`, { status }).subscribe({
      next: () => {
        this.openSuccessModal('Request Updated', `Parent request status changed to ${status}.`);
        this.loadParentRequests();
      },
      error: () => {
        this.openSuccessModal('Status Updated', `Parent request status changed to ${status}.`);
        this.loadParentRequests();
      }
    });
  }

  // --- INQUIRIES & USERS METHODS ---
  loadInquiries(): void {
    this.inquiriesLoading = true;
    this.apiService.get<any[]>('/inquiries').subscribe({
      next: (res) => { this.inquiriesList = res; this.inquiriesLoading = false; },
      error: () => { this.inquiriesLoading = false; }
    });
  }

  loadPrograms(): void {
    this.programsLoading = true;
    this.contentService.getPrograms().subscribe({
      next: (res) => { this.programsList = res; this.programsLoading = false; },
      error: () => { this.programsLoading = false; }
    });
  }

  loadTeachersRoster(): void {
    this.teachersRosterLoading = true;
    this.apiService.get<any[]>('/users').subscribe({
      next: (res) => { this.teachersRoster = res; this.teachersRosterLoading = false; },
      error: () => { this.teachersRosterLoading = false; }
    });
  }

  // --- SCHOOL MANAGEMENT METHODS ---
  loadCirculars(): void {
    this.circularsLoading = true;
    this.contentService.getCircularsAdmin().subscribe({
      next: (res) => {
        this.circularsList = res;
        this.circularsLoading = false;
      },
      error: () => {
        this.contentService.getCirculars().subscribe({
          next: (res) => {
            this.circularsList = res;
            this.circularsLoading = false;
          },
          error: () => { this.circularsLoading = false; }
        });
      }
    });

    if (this.programsList.length === 0) {
      this.loadPrograms();
    }
  }

  saveCircular(): void {
    if (!this.newCircular.title || !this.newCircular.content) {
      this.openSuccessModal('Form Incomplete', 'Please fill in both Circular Title and Content.');
      return;
    }

    if (this.editingCircularId) {
      this.contentService.updateCircular(this.editingCircularId, this.newCircular).subscribe({
        next: () => {
          this.openSuccessModal('Circular Updated! 📢', 'Circular announcement updated successfully.');
          this.resetCircularForm();
          this.loadCirculars();
        },
        error: (err) => {
          this.openSuccessModal('Error', 'Failed to update circular: ' + (err.error?.detail || err.message));
        }
      });
    } else {
      this.contentService.createCircular(this.newCircular).subscribe({
        next: () => {
          this.openSuccessModal('Circular Published! 📢', 'New circular published and broadcasted.');
          this.resetCircularForm();
          this.loadCirculars();
        },
        error: (err) => {
          this.openSuccessModal('Error', 'Failed to publish circular: ' + (err.error?.detail || err.message));
        }
      });
    }
  }

  editCircular(circular: any): void {
    this.editingCircularId = circular.id;
    this.newCircular = {
      title: circular.title,
      content: circular.content,
      program_id: circular.program_id || null,
      attachment_url: circular.attachment_url || '',
      is_active: circular.is_active
    };
  }

  deleteCircular(id: number): void {
    if (confirm('Are you sure you want to delete this circular?')) {
      this.contentService.deleteCircular(id).subscribe({
        next: () => {
          this.openSuccessModal('Circular Removed', 'Circular notice deleted.');
          this.loadCirculars();
        },
        error: (err) => {
          this.openSuccessModal('Error', 'Failed to delete circular: ' + (err.error?.detail || err.message));
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

  onCircularFileSelected(event: any): void {
    const file: File = event.target.files[0];
    if (file) {
      this.uploadingCircularFile = true;
      this.contentService.uploadImage(file).subscribe({
        next: (res) => {
          this.newCircular.attachment_url = res.url;
          this.uploadingCircularFile = false;
          this.openSuccessModal('File Uploaded', 'Circular attachment uploaded successfully!');
        },
        error: (err) => {
          this.uploadingCircularFile = false;
          this.openSuccessModal('Upload Failed', 'Failed to upload file: ' + (err.error?.detail || err.message));
        }
      });
    }
  }

  getProgramTitle(programId: number | null): string {
    if (!programId) return '📢 All Classes (School-Wide)';
    const prog = this.programsList.find(p => p.id === programId);
    return prog ? `🏫 ${prog.title}` : `Class #${programId}`;
  }

  loadBooks(): void {
    this.booksLoading = true;
    this.contentService.getBooks().subscribe({
      next: (res) => {
        this.booksList = res;
        this.booksLoading = false;
      },
      error: () => { this.booksLoading = false; }
    });

    this.contentService.getBorrows().subscribe({
      next: (res) => { this.borrowsList = res; },
      error: () => {}
    });

    if (this.classStudents.length === 0) {
      this.loadClassStudents();
    }
  }

  saveBook(): void {
    if (!this.newBook.title || !this.newBook.author) {
      this.openSuccessModal('Form Incomplete', 'Please fill in both Book Title and Author.');
      return;
    }

    if (this.editingBookId) {
      this.contentService.updateBook(this.editingBookId, this.newBook).subscribe({
        next: () => {
          this.openSuccessModal('Book Updated! 📚', 'Book details updated in library catalog.');
          this.resetBookForm();
          this.loadBooks();
        },
        error: (err) => {
          this.openSuccessModal('Error', 'Failed to update book: ' + (err.error?.detail || err.message));
        }
      });
    } else {
      this.contentService.createBook(this.newBook).subscribe({
        next: () => {
          this.openSuccessModal('Book Added! 📚', 'New book added to library catalog.');
          this.resetBookForm();
          this.loadBooks();
        },
        error: (err) => {
          this.openSuccessModal('Error', 'Failed to add book: ' + (err.error?.detail || err.message));
        }
      });
    }
  }

  editBook(book: any): void {
    this.editingBookId = book.id;
    this.newBook = {
      title: book.title,
      author: book.author,
      isbn: book.isbn || '',
      category: book.category || 'Picture Book',
      total_copies: book.total_copies || 1
    };
  }

  deleteBook(id: number): void {
    if (confirm('Are you sure you want to delete this book from the catalog?')) {
      this.contentService.deleteBook(id).subscribe({
        next: () => {
          this.openSuccessModal('Book Removed', 'Book deleted from library catalog.');
          this.loadBooks();
        },
        error: (err) => {
          this.openSuccessModal('Error', 'Failed to delete book: ' + (err.error?.detail || err.message));
        }
      });
    }
  }

  resetBookForm(): void {
    this.editingBookId = null;
    this.newBook = {
      title: '',
      author: '',
      isbn: '',
      category: 'Picture Book',
      total_copies: 1
    };
  }

  getAvailableBooks(): any[] {
    return this.booksList.filter(b => b.available_copies > 0);
  }

  issueBook(): void {
    if (!this.newBorrow.book_id || !this.newBorrow.student_id) {
      this.openSuccessModal('Selection Required', 'Please select both a Book and a Student.');
      return;
    }

    this.contentService.issueBook(this.newBorrow).subscribe({
      next: () => {
        this.openSuccessModal('Book Issued! 🚀', 'Book borrow registered successfully.');
        this.newBorrow.book_id = null;
        this.newBorrow.student_id = null;
        this.loadBooks();
      },
      error: (err) => {
        this.openSuccessModal('Error', 'Failed to issue book: ' + (err.error?.detail || err.message));
      }
    });
  }

  returnBorrowedBook(borrowId: number): void {
    this.contentService.returnBook(borrowId).subscribe({
      next: () => {
        this.openSuccessModal('Book Returned! ↩', 'Book returned and inventory updated.');
        this.loadBooks();
      },
      error: (err) => {
        this.openSuccessModal('Error', 'Failed to return book: ' + (err.error?.detail || err.message));
      }
    });
  }

  getBookTitle(bookId: number): string {
    const b = this.booksList.find(x => x.id === bookId);
    return b ? b.title : `Book #${bookId}`;
  }

  getStudentName(studentId: number): string {
    const s = this.classStudents.find(x => x.id === studentId);
    return s ? s.name : `Student #${studentId}`;
  }

  loadHolidays(): void {
    this.holidaysLoading = true;
    this.contentService.getHolidays(this.selectedHolidayYear).subscribe({
      next: (data) => {
        this.holidaysList = data;
        this.holidaysLoading = false;
      },
      error: (err) => {
        this.holidaysLoading = false;
        this.openSuccessModal('Error', 'Failed to load holidays: ' + (err.error?.detail || err.message));
      }
    });
  }

  saveHoliday(): void {
    if (!this.newHoliday.title || !this.newHoliday.holiday_date) {
      this.openSuccessModal('Form Incomplete', 'Please fill in both Title and Date.');
      return;
    }

    const parts = this.newHoliday.holiday_date.split('-');
    if (parts.length === 3) {
      this.newHoliday.year = Number(parts[0]);
    }

    if (this.editingHolidayId) {
      this.contentService.updateHoliday(this.editingHolidayId, this.newHoliday).subscribe({
        next: () => {
          this.openSuccessModal('Holiday Updated! 📅', 'Holiday details updated successfully.');
          this.resetHolidayForm();
          this.loadHolidays();
        },
        error: (err) => {
          this.openSuccessModal('Error', 'Failed to update holiday: ' + (err.error?.detail || err.message));
        }
      });
    } else {
      this.contentService.createHoliday(this.newHoliday).subscribe({
        next: () => {
          this.openSuccessModal('Holiday Added! 📅', 'New holiday added to the school academic calendar.');
          this.resetHolidayForm();
          this.loadHolidays();
        },
        error: (err) => {
          this.openSuccessModal('Error', 'Failed to add holiday: ' + (err.error?.detail || err.message));
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
          this.openSuccessModal('Holiday Removed', 'Holiday deleted from calendar roster.');
          this.loadHolidays();
        },
        error: (err) => {
          this.openSuccessModal('Error', 'Failed to delete holiday: ' + (err.error?.detail || err.message));
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
          this.openSuccessModal('Image Uploaded', 'Holiday image uploaded successfully!');
        },
        error: (err) => {
          this.uploadingHolidayImage = false;
          this.openSuccessModal('Upload Failed', 'Failed to upload image: ' + (err.error?.detail || err.message));
        }
      });
    }
  }

  removeHolidayImage(): void {
    this.newHoliday.image_url = '';
  }

  sendBulkHolidayEmail(): void {
    const f = this.customHolidayEmail;
    if (!f.reason || !f.start_date || !f.end_date || !f.reopen_date) {
      this.openSuccessModal('Form Incomplete', 'Please fill in all fields of the Bulk Holiday Mailer.');
      return;
    }

    this.sendingBulkEmail = true;
    this.contentService.sendCustomHolidayEmail(f).subscribe({
      next: (res) => {
        this.openSuccessModal('Emails Dispatched! 📧', res.message || 'Custom holiday emails sent to all registered parent contacts.');
        this.resetCustomEmailForm();
        this.sendingBulkEmail = false;
      },
      error: (err) => {
        this.openSuccessModal('Error', 'Failed to send bulk emails: ' + (err.error?.detail || err.message));
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

  loadGallery(): void {
    this.galleryLoading = true;
    this.contentService.getGalleryItems().subscribe({
      next: (res) => { this.galleryList = res; this.galleryLoading = false; },
      error: () => { this.galleryLoading = false; }
    });
  }

  // --- TAB 1: STATIONERY ORDERS ---
  loadOrders(): void {
    this.ordersLoading = true;
    this.teacherService.getClassOrders().subscribe({
      next: (res) => {
        this.ordersList = res;
        this.ordersLoading = false;
      },
      error: (err) => {
        this.ordersLoading = false;
        alert(err.error?.detail || 'Failed to load class stationery orders.');
      }
    });
  }

  approveStationeryOrder(orderId: number): void {
    if (!confirm('Are you sure you want to approve this student stationery order?')) return;
    this.teacherService.approveOrder(orderId).subscribe({
      next: () => {
        alert('Order approved and status updated to Dispatched!');
        this.loadOrders();
      },
      error: (err) => {
        alert(err.error?.detail || 'Failed to approve order.');
      }
    });
  }

  rejectStationeryOrder(orderId: number): void {
    if (!confirm('Are you sure you want to reject this student stationery order? It will be marked as Rejected.')) return;
    this.teacherService.rejectOrder(orderId).subscribe({
      next: () => {
        alert('Order has been rejected. Item stock restored to inventory.');
        this.loadOrders();
      },
      error: (err) => {
        alert(err.error?.detail || 'Failed to reject order.');
      }
    });
  }

  // --- TAB 2: TEACHER ACHIEVEMENTS ---
  loadAchievements(): void {
    this.achievementsLoading = true;
    this.teacherService.getAchievements().subscribe({
      next: (res) => {
        this.achievementsList = res;
        this.achievementsLoading = false;
      },
      error: (err) => {
        this.achievementsLoading = false;
        alert(err.error?.detail || 'Failed to load achievements.');
      }
    });
  }

  onCertificateSelected(event: any): void {
    const files = event.target.files;
    if (files && files.length > 0) {
      this.certificateFileToUpload = files[0];
    }
  }

  saveAchievement(): void {
    if (!this.newAchievement.title.trim()) {
      alert('Achievement title is required.');
      return;
    }

    this.savingAchievement = true;
    const formData = new FormData();
    formData.append('title', this.newAchievement.title);
    formData.append('description', this.newAchievement.description || '');
    formData.append('date', this.newAchievement.date);
    
    if (this.certificateFileToUpload) {
      formData.append('certificate', this.certificateFileToUpload, this.certificateFileToUpload.name);
    }

    this.teacherService.uploadAchievement(formData).subscribe({
      next: () => {
        this.savingAchievement = false;
        this.resetAchievementForm();
        this.loadDashboardData();
        this.openSuccessModal('Achievement Saved!', 'Teaching achievement portfolio record has been saved successfully.');
      },
      error: (err) => {
        this.savingAchievement = false;
        this.openSuccessModal('Save Failed', err.error?.detail || 'Failed to save achievement.');
      }
    });
  }

  deleteAchievement(id: number): void {
    this.openDeleteModal('achievement', id);
  }

  resetAchievementForm(): void {
    this.newAchievement = {
      title: '',
      description: '',
      date: new Date().toISOString().split('T')[0]
    };
    this.certificateFileToUpload = null;
    const fileInput = document.getElementById('certificateFile') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  }

  // --- TAB 3: DAILY ASSIGNMENTS ---
  loadAssignments(): void {
    this.assignmentsLoading = true;
    this.assignmentService.getTeacherAssignments().subscribe({
      next: (res) => {
        // Filter assignments strictly for teacher's class
        this.assignmentsList = res.filter(a => a.program_id === this.profile?.assigned_program?.id);
        this.assignmentsLoading = false;
      },
      error: (err) => {
        this.assignmentsLoading = false;
        alert(err.error?.detail || 'Failed to load assignments.');
      }
    });
  }

  onAssignmentFilesSelected(event: any): void {
    const files = event.target.files;
    if (files && files.length > 0) {
      this.assignmentFilesToUpload = Array.from(files);
      this.assignmentFileNames = this.assignmentFilesToUpload.map(f => f.name);
    }
  }

  uploadAssignment(): void {
    if (!this.newAssignment.title.trim()) {
      alert('Assignment title is required.');
      return;
    }
    if (!this.profile?.assigned_program?.id) {
      alert('You must be assigned to a school class to upload assignments.');
      return;
    }

    this.uploadingAssignment = true;
    const formData = new FormData();
    formData.append('program_id', this.profile.assigned_program.id.toString());
    formData.append('title', this.newAssignment.title);
    formData.append('description', this.newAssignment.description || '');
    formData.append('date', this.newAssignment.date);
    
    for (let file of this.assignmentFilesToUpload) {
      formData.append('files', file, file.name);
    }

    this.assignmentService.uploadAssignment(formData).subscribe({
      next: () => {
        this.uploadingAssignment = false;
        this.resetAssignmentForm();
        this.loadDashboardData();
        this.openSuccessModal('Worksheet Uploaded!', 'Daily class assignment has been uploaded and shared with pupils/parents successfully.');
      },
      error: (err) => {
        this.uploadingAssignment = false;
        this.openSuccessModal('Upload Failed', err.error?.detail || 'Failed to upload assignment.');
      }
    });
  }

  deleteAssignment(asg: any): void {
    const id = typeof asg === 'number' ? asg : asg.id;
    const title = typeof asg === 'object' ? asg.title : '';
    this.openDeleteModal('assignment', id, title);
  }

  resetAssignmentForm(): void {
    this.newAssignment = {
      title: '',
      description: '',
      date: new Date().toISOString().split('T')[0]
    };
    this.assignmentFilesToUpload = [];
    this.assignmentFileNames = [];
    const fileInput = document.getElementById('assignmentFiles') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  }

  // --- TAB 4: DAILY MOMENTS ---
  loadMoments(): void {
    if (!this.momentSelectedStudentId) {
      this.momentsList = [];
      return;
    }
    this.momentsLoading = true;
    this.momentsService.getMomentsByStudent(Number(this.momentSelectedStudentId)).subscribe({
      next: (data: StudentMoment[]) => {
        this.momentsList = data;
        this.momentsLoading = false;
      },
      error: (err: any) => {
        this.momentsLoading = false;
        alert(err.error?.detail || 'Failed to load moments.');
      }
    });
  }

  onMomentFilesSelected(event: any): void {
    const files = event.target.files;
    if (files && files.length > 0) {
      this.momentFilesToUpload = Array.from(files);
      this.momentFileNames = this.momentFilesToUpload.map(f => f.name);
    }
  }

  uploadMoment(): void {
    if (!this.momentSelectedStudentId) {
      alert('Please select a student.');
      return;
    }
    if (!this.newMoment.title.trim()) {
      alert('Moment title/caption is required.');
      return;
    }
    if (this.momentFilesToUpload.length === 0) {
      alert('Please select at least one media file.');
      return;
    }

    this.uploadingMoment = true;
    this.momentsService.uploadMoment(
      Number(this.momentSelectedStudentId),
      this.newMoment.title,
      this.momentFilesToUpload
    ).subscribe({
      next: () => {
        this.uploadingMoment = false;
        this.resetMomentForm();
        this.loadMoments();
        this.openSuccessModal('Daily Moment Shared!', 'Daily class moment/photo has been uploaded and shared with pupil parents successfully.');
      },
      error: (err: any) => {
        this.uploadingMoment = false;
        this.openSuccessModal('Upload Failed', err.error?.detail || 'Failed to upload moments.');
      }
    });
  }

  deleteMoment(id: number): void {
    this.openDeleteModal('moment', id);
  }

  resetMomentForm(): void {
    this.newMoment = {
      title: ''
    };
    this.momentFilesToUpload = [];
    this.momentFileNames = [];
    const fileInput = document.getElementById('momentFiles') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  }

  // --- UTILS ---
  parseFilesList(filesJson: string): string[] {
    try {
      return JSON.parse(filesJson);
    } catch {
      return [];
    }
  }

  getFileNameFromUrl(url: string): string {
    if (!url) return '';
    let name = url.substring(url.lastIndexOf('/') + 1);
    name = name.replace(/^[a-f0-9]{32}_/i, '');
    name = name.replace(/_[a-f0-9]{6}(\.[a-zA-Z0-9]+)$/i, '$1');
    return name;
  }

  getMediaUrl(url: string | null | undefined, defaultUrl: string): string {
    if (!url) return defaultUrl;
    let cleaned = url;
    if (cleaned.includes('localhost:8000')) {
      cleaned = cleaned.replace(/^https?:\/\/localhost:8000/, '');
    } else if (cleaned.includes('127.0.0.1:8000')) {
      cleaned = cleaned.replace(/^https?:\/\/127.0.0.1:8000/, '');
    }
    
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

  // --- MILESTONES METHODS ---
  loadMilestones(): void {
    if (this.programsList.length === 0) {
      this.contentService.getPrograms().subscribe({
        next: (res) => {
          this.programsList = res;
          this.setMilestoneSubTab(this.milestoneActiveSubTab);
        },
        error: () => { this.setMilestoneSubTab(this.milestoneActiveSubTab); }
      });
    } else {
      this.setMilestoneSubTab(this.milestoneActiveSubTab);
    }
  }

  setMilestoneSubTab(subTab: 'templates' | 'progress'): void {
    this.milestoneActiveSubTab = subTab;
    if (subTab === 'templates') {
      this.loadMilestoneTemplates();
    } else {
      this.loadMilestoneStudents();
    }
  }

  loadMilestoneTemplates(): void {
    if (!this.selectedMilestoneProgramId && this.programsList.length > 0) {
      this.selectedMilestoneProgramId = this.programsList[0].id;
    }
    if (!this.selectedMilestoneProgramId) return;
    this.newMilestoneTemplate.program_id = this.selectedMilestoneProgramId;

    this.contentService.getMilestoneTemplates(this.selectedMilestoneProgramId).subscribe({
      next: (data) => { this.milestoneTemplates = data; },
      error: (err) => {
        this.openSuccessModal('Error', err.error?.detail || 'Failed to load milestone templates.');
      }
    });
  }

  onMilestoneProgramChange(): void {
    this.newMilestoneTemplate.program_id = this.selectedMilestoneProgramId;
    this.loadMilestoneTemplates();
  }

  addMilestoneTemplate(): void {
    if (!this.newMilestoneTemplate.milestone_name.trim()) {
      this.openSuccessModal('Field Required', 'Please enter a milestone description.');
      return;
    }
    
    const finalData = { ...this.newMilestoneTemplate };
    if (this.showCustomCategory) {
      if (!this.customCategoryName.trim()) {
        this.openSuccessModal('Field Required', 'Please specify a custom category name.');
        return;
      }
      finalData.category = this.customCategoryName.trim();
    }

    this.contentService.createMilestoneTemplate(finalData).subscribe({
      next: () => {
        this.openSuccessModal('Template Added 🎯', 'Milestone template created successfully.');
        this.newMilestoneTemplate.milestone_name = '';
        this.showCustomCategory = false;
        this.customCategoryName = '';
        this.loadMilestoneTemplates();
      },
      error: (err) => {
        this.openSuccessModal('Error', err.error?.detail || 'Failed to add milestone template.');
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
        this.openSuccessModal('Template Deleted', 'Milestone template removed.');
        this.loadMilestoneTemplates();
      },
      error: (err) => {
        this.openSuccessModal('Error', err.error?.detail || 'Failed to delete template.');
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
      this.openSuccessModal('Field Required', 'Milestone description cannot be empty.');
      return;
    }
    this.contentService.updateMilestoneTemplate(id, this.editingTemplateData).subscribe({
      next: () => {
        this.openSuccessModal('Template Updated 🎯', 'Milestone template updated successfully.');
        this.editingTemplateId = null;
        this.loadMilestoneTemplates();
      },
      error: (err) => {
        this.openSuccessModal('Error', err.error?.detail || 'Failed to update milestone template.');
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

  loadMilestoneStudents(): void {
    if (!this.milestoneStudentProgramId && this.programsList.length > 0) {
      this.milestoneStudentProgramId = this.programsList[0].id;
    }
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
        this.openSuccessModal('Error', err.error?.detail || 'Failed to load class students.');
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
      next: (data) => { this.studentMilestones = data; },
      error: (err) => {
        this.openSuccessModal('Error', err.error?.detail || 'Failed to load student progress milestones.');
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
        this.openSuccessModal('Progress Saved! 🎯', 'Student milestones updated successfully.');
        this.loadStudentMilestones();
      },
      error: (err) => {
        this.savingStudentMilestones = false;
        this.openSuccessModal('Error', err.error?.detail || 'Failed to save student milestones.');
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

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/admin/login']);
  }

  ngOnDestroy(): void {
    if (this.clockInterval) {
      clearInterval(this.clockInterval);
    }
  }
}
