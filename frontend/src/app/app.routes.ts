import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { GeneralPageComponent } from './pages/general-page/general-page.component';
import { AboutPageComponent } from './pages/about-page/about-page.component';
import { GalleryPageComponent } from './pages/gallery-page/gallery-page.component';
import { BlogPageComponent } from './pages/blog-page/blog-page.component';
import { FAQPageComponent } from './pages/faq-page/faq-page.component';
import { ContactPageComponent } from './pages/contact-page/contact-page.component';
import { FranchisePageComponent } from './pages/franchise-page/franchise-page.component';
import { CareersPageComponent } from './pages/careers-page/careers-page.component';
import { AdmissionsPageComponent } from './pages/admissions-page/admissions-page.component';
import { LoginComponent } from './pages/admin/login/login.component';
import { DashboardComponent } from './pages/admin/dashboard/dashboard.component';
import { ResetPasswordComponent } from './pages/admin/reset-password/reset-password.component';
import { ParentDashboardComponent } from './pages/parent-dashboard/parent-dashboard.component';
import { TeacherDashboardComponent } from './pages/teacher-dashboard/teacher-dashboard.component';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  // Public Landing & Sections Pages
  { path: '', component: HomeComponent },
  { path: 'about', component: AboutPageComponent },
  { path: 'why-us', component: GeneralPageComponent, data: { pageCode: 'why_us', title: 'Why Choose Us' } },
  { path: 'programs', component: GeneralPageComponent, data: { pageCode: 'programs_info', title: 'Our Programs' } },
  { path: 'programs/preschool', component: GeneralPageComponent, data: { pageCode: 'preschool_program', title: 'PreSchooling' } },
  { path: 'curriculum', component: GeneralPageComponent, data: { pageCode: 'curriculum', title: 'Our Curriculum' } },
  { path: 'admissions', component: AdmissionsPageComponent },
  { path: 'centers', component: GeneralPageComponent, data: { pageCode: 'centers', title: 'Our Centers' } },
  
  // Custom Interaction Pages
  { path: 'gallery', component: GalleryPageComponent },
  { path: 'careers', component: CareersPageComponent },
  { path: 'franchise', component: FranchisePageComponent },
  { path: 'blog', component: BlogPageComponent },
  { path: 'blog/:slug', component: BlogPageComponent },
  { path: 'contact', component: ContactPageComponent },
  { path: 'faq', component: FAQPageComponent },
  
  // Policies
  { path: 'privacy-policy', component: GeneralPageComponent, data: { pageCode: 'privacy_policy', title: 'Privacy Policy' } },
  { path: 'terms', component: GeneralPageComponent, data: { pageCode: 'terms', title: 'Terms & Conditions' } },

  // Admin Routes
  { path: 'admin/login', component: LoginComponent },
  { path: 'admin/reset-password', component: ResetPasswordComponent },
  { path: 'admin/dashboard', component: DashboardComponent, canActivate: [authGuard] },
  { path: 'parent/dashboard', component: ParentDashboardComponent, canActivate: [authGuard] },
  { path: 'teacher/dashboard', component: TeacherDashboardComponent, canActivate: [authGuard] },

  // Wildcard Fallback
  { path: '**', redirectTo: '' }
];
