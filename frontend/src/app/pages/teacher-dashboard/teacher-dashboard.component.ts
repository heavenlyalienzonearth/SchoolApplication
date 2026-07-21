import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { TeacherService, TeacherAchievement } from '../../core/services/teacher.service';
import { AssignmentService, ClassAssignment } from '../../core/services/assignment.service';
import { MomentsService, StudentMoment } from '../../core/services/moments.service';

@Component({
  selector: 'app-teacher-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="teacher-dashboard-wrapper">
      <!-- Top Navigation Header -->
      <header class="dashboard-header">
        <div class="header-logo">
          <span class="logo-icon">👩‍🏫</span>
          <div class="logo-text">
            <h1>Vidyankuram School</h1>
            <p>Teacher Console Panel</p>
          </div>
        </div>

        <!-- Teacher Quick Stats & Small Picture (Requirement 4) -->
        <div class="header-user-profile" *ngIf="profile">
          <div class="profile-details">
            <span class="profile-name">{{ profile.full_name }}</span>
            <span class="profile-class">Class: {{ profile.assigned_program?.title || 'Unassigned' }}</span>
          </div>
          <img 
            [src]="getMediaUrl(profile.photo_url, 'assets/images/teacher_avatar_ai.png')" 
            alt="Teacher Avatar" 
            class="teacher-small-pic"
          />
          <button (click)="logout()" class="btn-logout" title="Sign Out">Logout 🚪</button>
        </div>
      </header>

      <!-- Main Dashboard Grid -->
      <main class="dashboard-main" *ngIf="profile">
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
            <div class="stat-card pink">
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

        <!-- Console Tab Selector -->
        <div class="tabs-bar">
          <button 
            [class.active]="activeTab === 'orders'" 
            (click)="switchTab('orders')"
            class="tab-btn">
            📋 Student Orders
          </button>
          <button 
            [class.active]="activeTab === 'achievements'" 
            (click)="switchTab('achievements')"
            class="tab-btn">
            🏆 Achievements Portfolio
          </button>
          <button 
            [class.active]="activeTab === 'assignments'" 
            (click)="switchTab('assignments')"
            class="tab-btn">
            📚 Daily Assignments
          </button>
          <button 
            [class.active]="activeTab === 'moments'" 
            (click)="switchTab('moments')"
            class="tab-btn">
            📸 Daily Moments
          </button>
        </div>

        <!-- TAB CONTENT VIEWS -->

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
                      <a [href]="getMediaUrl(file, '')" target="_blank">📄 {{ getFileNameFromUrl(file) | slice:0:30 }}</a>
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

      </main>
    </div>
  `,
  styles: [`
    .teacher-dashboard-wrapper {
      max-width: 1350px;
      margin: 0 auto;
      padding: 0 20px 40px 20px;
      font-family: 'Quicksand', 'Inter', sans-serif;
    }
    .dashboard-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px 0;
      border-bottom: 2.5px solid #F1F5F9;
      margin-bottom: 30px;
    }
    .header-logo {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .logo-icon {
      font-size: 2rem;
    }
    .logo-text h1 {
      margin: 0;
      font-size: 1.45rem;
      font-weight: 800;
      color: #0F172A;
      letter-spacing: -0.5px;
    }
    .logo-text p {
      margin: 2px 0 0 0;
      font-size: 0.78rem;
      font-weight: 700;
      color: var(--primary);
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .header-user-profile {
      display: flex;
      align-items: center;
      gap: 12px;
      background: white;
      border: 1.5px solid #E2E8F0;
      padding: 6px 14px;
      border-radius: 9999px;
      box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02);
    }
    .profile-details {
      display: flex;
      flex-direction: column;
      text-align: right;
    }
    .profile-name {
      font-weight: 800;
      font-size: 0.88rem;
      color: #0F172A;
    }
    .profile-class {
      font-size: 0.72rem;
      color: #64748B;
      font-weight: 700;
    }
    .teacher-small-pic {
      width: 38px;
      height: 38px;
      border-radius: 50%;
      object-fit: cover;
      border: 2px solid var(--primary);
    }
    .btn-logout {
      background: #F1F5F9;
      border: none;
      color: #475569;
      padding: 6px 12px;
      border-radius: 9999px;
      font-weight: 700;
      font-size: 0.75rem;
      cursor: pointer;
      margin-left: 8px;
      transition: all 0.2s;
    }
    .btn-logout:hover {
      background: #fee2e2;
      color: #dc2626;
    }
    .dashboard-main {
      display: flex;
      flex-direction: column;
      gap: 30px;
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
    @media (max-width: 900px) {
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

  activeTab: 'orders' | 'achievements' | 'assignments' | 'moments' = 'orders';
  ordersLoading = false;
  ordersList: any[] = [];

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

  constructor(
    private authService: AuthService,
    private teacherService: TeacherService,
    private assignmentService: AssignmentService,
    private momentsService: MomentsService,
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
      },
      error: () => {}
    });
  }

  switchTab(tab: 'orders' | 'achievements' | 'assignments' | 'moments'): void {
    this.activeTab = tab;
    if (tab === 'orders') {
      this.loadOrders();
    } else if (tab === 'achievements') {
      this.loadAchievements();
    } else if (tab === 'assignments') {
      this.loadAssignments();
    } else if (tab === 'moments') {
      this.loadMoments();
    }
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
        alert('Achievement logged successfully!');
        this.resetAchievementForm();
        this.loadDashboardData();
      },
      error: (err) => {
        this.savingAchievement = false;
        alert(err.error?.detail || 'Failed to save achievement.');
      }
    });
  }

  deleteAchievement(id: number): void {
    if (!confirm('Are you sure you want to permanently delete this achievement record?')) return;
    this.teacherService.deleteAchievement(id).subscribe({
      next: (res) => {
        alert(res.message || 'Achievement deleted successfully.');
        this.loadDashboardData();
      },
      error: (err) => {
        alert(err.error?.detail || 'Failed to delete achievement.');
      }
    });
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
        alert('Worksheet uploaded successfully!');
        this.resetAssignmentForm();
        this.loadDashboardData();
      },
      error: (err) => {
        this.uploadingAssignment = false;
        alert(err.error?.detail || 'Failed to upload assignment.');
      }
    });
  }

  deleteAssignment(id: number): void {
    if (!confirm('Are you sure you want to delete this class assignment?')) return;
    this.assignmentService.deleteAssignment(id).subscribe({
      next: (res) => {
        alert(res.message || 'Assignment deleted successfully.');
        this.loadDashboardData();
      },
      error: (err) => {
        alert(err.error?.detail || 'Failed to delete assignment.');
      }
    });
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
        alert('Daily moments shared successfully!');
        this.resetMomentForm();
        this.loadMoments();
      },
      error: (err: any) => {
        this.uploadingMoment = false;
        alert(err.error?.detail || 'Failed to upload moments.');
      }
    });
  }

  deleteMoment(id: number): void {
    if (!confirm('Are you sure you want to delete this daily moment?')) return;
    this.momentsService.deleteMoment(id).subscribe({
      next: (res: any) => {
        alert(res.message || 'Moment deleted successfully.');
        this.loadMoments();
      },
      error: (err: any) => {
        alert(err.error?.detail || 'Failed to delete moment.');
      }
    });
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
    return url.substring(url.lastIndexOf('/') + 1);
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
