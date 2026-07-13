import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ContentService } from '../../../core/services/content.service';
import { AuthService, User } from '../../../core/services/auth.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <header class="main-header" [class.scrolled]="isScrolled">
      <!-- Top Accent Bar -->
      <div class="top-accent-line"></div>

      <!-- Top Info Bar -->
      <div class="top-bar">
        <div class="container top-container">
          <div class="contact-info">
            <a *ngIf="settings.contact_phone" [href]="'tel:' + settings.contact_phone" class="info-link">
              <span class="icon">📞</span> {{ settings.contact_phone }}
            </a>
            <a *ngIf="settings.contact_email" [href]="'mailto:' + settings.contact_email" class="info-link email-link">
              <span class="icon">✉️</span> {{ settings.contact_email }}
            </a>
          </div>
          <div class="top-right">
            <div class="auth-area">
              <div *ngIf="currentUser" class="user-pill">
                <span class="user-avatar">👤</span>
                <span class="user-name">Admin</span>
                <a routerLink="/admin/dashboard" class="btn-dash">Dashboard</a>
                <button (click)="logout()" class="btn-logout-small">Logout</button>
              </div>
              <a *ngIf="!currentUser" routerLink="/admin/login" class="login-link">Admin Portal</a>
            </div>
          </div>
        </div>
      </div>

      <!-- Main Navigation -->
      <nav class="nav-bar">
        <div class="container nav-container">
          <a routerLink="/" class="logo-area">
            <div class="logo-wrapper">
              <img [src]="settings.site_logo || '/assets/images/logo.png'" [alt]="settings.site_name || 'Logo'" class="logo" />
            </div>
            <div class="brand-text">
              <span class="site-name">{{ settings.site_name || 'Vidyankuram Club' }}</span>
              <span class="tagline">INTERNATIONAL SCHOOL</span>
            </div>
          </a>
          
          <button class="menu-toggle" [class.open]="menuActive" (click)="toggleMenu()" aria-label="Toggle Navigation">
            <span class="bar"></span>
            <span class="bar"></span>
            <span class="bar"></span>
          </button>

          <!-- Navigation Links -->
          <ul class="nav-menu" [class.active]="menuActive">
            <li><a routerLink="/" routerLinkActive="active-link" [routerLinkActiveOptions]="{exact: true}" (click)="closeMenu()">Home</a></li>
            <li><a routerLink="/about" routerLinkActive="active-link" (click)="closeMenu()">About</a></li>
            <!-- Programs Dropdown -->
            <li class="dropdown-item" (mouseenter)="toggleProgramsDropdown(true)" (mouseleave)="toggleProgramsDropdown(false)">
              <a class="dropdown-trigger" [class.active-link]="isProgramsActive()">
                Program <span class="arrow-icon">▼</span>
              </a>
              <ul class="dropdown-menu" [class.show]="programsDropdownActive">
                <li><a routerLink="/programs/preschool" routerLinkActive="active-link" (click)="closeMenu()">PreSchooling</a></li>
              </ul>
            </li>
            <li><a routerLink="/admissions" routerLinkActive="active-link" (click)="closeMenu()">Admissions</a></li>
            
            <!-- Dynamic Dropdown -->
            <li class="dropdown-item" (mouseenter)="toggleDropdown(true)" (mouseleave)="toggleDropdown(false)">
              <a class="dropdown-trigger" [class.active-link]="isDropdownActive()">
                Explore <span class="arrow-icon">▼</span>
              </a>
              <ul class="dropdown-menu" [class.show]="dropdownActive">
                <li><a routerLink="/why-us" routerLinkActive="active-link" (click)="closeMenu()">Why Choose Us</a></li>
                <li><a routerLink="/curriculum" routerLinkActive="active-link" (click)="closeMenu()">Curriculum</a></li>
                <li><a routerLink="/centers" routerLinkActive="active-link" (click)="closeMenu()">Our Centers</a></li>
                <li><a routerLink="/gallery" routerLinkActive="active-link" (click)="closeMenu()">Photo Gallery</a></li>
                <li><a routerLink="/faq" routerLinkActive="active-link" (click)="closeMenu()">FAQs</a></li>
                <li><a routerLink="/careers" routerLinkActive="active-link" (click)="closeMenu()">Careers</a></li>
                <li><a routerLink="/franchise" routerLinkActive="active-link" (click)="closeMenu()">Franchise</a></li>
              </ul>
            </li>

            <li><a routerLink="/blog" routerLinkActive="active-link" (click)="closeMenu()">Blog</a></li>
            <li><a routerLink="/contact" routerLinkActive="active-link" (click)="closeMenu()">Contact</a></li>
          </ul>

          <div class="nav-actions">
            <a routerLink="/admissions" class="btn btn-primary cta-btn">Apply Now</a>
          </div>
        </div>
      </nav>
    </header>
  `,
  styles: [`
    .main-header {
      width: 100%;
      position: sticky;
      top: 0;
      z-index: 1000;
      background-color: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(12px);
      box-shadow: 0 4px 30px rgba(0, 0, 0, 0.03);
      transition: all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
    }

    .main-header.scrolled {
      background-color: rgba(255, 255, 255, 0.98);
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
      transform: translateY(-2px);
    }
    
    .top-accent-line {
      height: 6px;
      background: linear-gradient(90deg, var(--primary) 0%, var(--secondary) 50%, var(--accent) 100%);
      width: 100%;
    }
    
    .top-bar {
      background-color: #0F172A;
      color: #94A3B8;
      padding: 8px 0;
      font-size: 0.82rem;
      font-weight: 600;
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
      transition: padding 0.3s ease;
    }

    .main-header.scrolled .top-bar {
      padding: 4px 0;
      font-size: 0.8rem;
    }

    .top-container {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .contact-info {
      display: flex;
      gap: 20px;
    }

    .info-link {
      color: #94A3B8;
      text-decoration: none;
      display: flex;
      align-items: center;
      gap: 6px;
      transition: var(--transition);
    }

    .info-link:hover {
      color: var(--white);
    }

    .top-right {
      display: flex;
      align-items: center;
      gap: 24px;
    }

    .auth-area {
      display: flex;
      align-items: center;
    }

    .login-link {
      color: var(--secondary);
      text-decoration: none;
      font-weight: 700;
      transition: var(--transition);
    }

    .login-link:hover {
      color: var(--white);
      text-shadow: 0 0 10px rgba(255,210,63,0.3);
    }

    .user-pill {
      display: flex;
      align-items: center;
      gap: 10px;
      background-color: rgba(255,255,255,0.06);
      padding: 4px 12px;
      border-radius: 50px;
      border: 1px solid rgba(255, 255, 255, 0.1);
    }

    .user-avatar {
      font-size: 0.9rem;
    }

    .user-name {
      color: var(--white);
      font-weight: 700;
    }

    .btn-dash {
      background-color: var(--primary);
      color: var(--white);
      text-decoration: none;
      padding: 2px 10px;
      border-radius: 20px;
      font-size: 0.72rem;
      font-weight: 700;
      transition: var(--transition);
    }

    .btn-dash:hover {
      background-color: var(--white);
      color: var(--primary);
    }

    .btn-logout-small {
      background: none;
      border: none;
      color: #EF4444;
      font-weight: 700;
      font-size: 0.72rem;
      cursor: pointer;
      transition: var(--transition);
    }

    .btn-logout-small:hover {
      text-decoration: underline;
    }

    .nav-bar {
      padding: 16px 0;
      transition: padding 0.3s ease;
    }

    .main-header.scrolled .nav-bar {
      padding: 10px 0;
    }

    .nav-container {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .logo-area {
      display: flex;
      align-items: center;
      gap: 12px;
      text-decoration: none;
    }

    .logo-wrapper {
      background-color: var(--bg-cream);
      border-radius: 50%;
      padding: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
      border: 2px solid var(--secondary);
      transition: var(--transition);
    }

    .logo-area:hover .logo-wrapper {
      transform: rotate(15deg) scale(1.05);
    }

    .logo {
      height: 48px;
      width: 48px;
      object-fit: contain;
    }

    .main-header.scrolled .logo {
      height: 42px;
      width: 42px;
    }

    .brand-text {
      display: flex;
      flex-direction: column;
    }

    .site-name {
      font-family: var(--font-heading);
      font-weight: 800;
      font-size: 1.45rem;
      color: var(--primary);
      line-height: 1;
      transition: font-size 0.3s ease;
    }

    .main-header.scrolled .site-name {
      font-size: 1.3rem;
    }

    .tagline {
      font-size: 0.65rem;
      font-weight: 800;
      color: var(--accent);
      letter-spacing: 2px;
      margin-top: 2px;
    }

    .nav-menu {
      display: flex;
      list-style: none;
      gap: 20px;
      align-items: center;
    }

    .nav-menu a {
      text-decoration: none;
      color: var(--text-dark);
      font-weight: 700;
      font-size: 0.95rem;
      padding: 8px 12px;
      border-radius: 8px;
      transition: var(--transition);
      cursor: pointer;
      position: relative;
    }

    .nav-menu a:hover, .nav-menu a.active-link {
      color: var(--primary);
      background-color: rgba(238, 90, 36, 0.05);
    }

    /* Dropdown design */
    .dropdown-item {
      position: relative;
    }

    .dropdown-trigger {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .arrow-icon {
      font-size: 0.55rem;
      transition: transform 0.3s ease;
    }

    .dropdown-item:hover .arrow-icon {
      transform: rotate(180deg);
    }

    .dropdown-menu {
      position: absolute;
      top: 100%;
      left: 50%;
      transform: translateX(-50%) translateY(10px);
      background-color: var(--white);
      box-shadow: 0 15px 35px rgba(15, 23, 42, 0.12);
      border-radius: var(--border-radius-md);
      padding: 10px;
      list-style: none;
      min-width: 200px;
      opacity: 0;
      visibility: hidden;
      transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
      border: 1px solid #F1F5F9;
      z-index: 1001;
    }

    .dropdown-item:hover .dropdown-menu,
    .dropdown-menu.show {
      opacity: 1;
      visibility: visible;
      transform: translateX(-50%) translateY(0);
    }

    .dropdown-menu li {
      margin-bottom: 2px;
    }

    .dropdown-menu li:last-child {
      margin-bottom: 0;
    }

    .dropdown-menu a {
      display: block;
      padding: 10px 16px;
      font-size: 0.9rem;
      border-radius: 6px;
      color: var(--text-dark);
    }

    .dropdown-menu a:hover, .dropdown-menu a.active-link {
      background-color: rgba(238, 90, 36, 0.05);
      color: var(--primary);
      padding-left: 20px;
    }

    /* CTA Button Bouncy Hover */
    .cta-btn {
      padding: 10px 24px;
      font-size: 0.9rem;
      border-radius: 50px;
      box-shadow: 0 4px 14px rgba(238, 90, 36, 0.25);
    }

    .cta-btn:hover {
      animation: wiggle 0.4s ease-in-out infinite alternate;
    }

    @keyframes wiggle {
      0% { transform: rotate(-2deg) translateY(-2px); }
      100% { transform: rotate(2deg) translateY(-2px); }
    }

    /* Hamburger Toggle */
    .menu-toggle {
      display: none;
      flex-direction: column;
      gap: 5px;
      background: none;
      border: none;
      cursor: pointer;
      padding: 6px;
      border-radius: 6px;
      transition: var(--transition);
    }

    .menu-toggle:hover {
      background-color: rgba(0,0,0,0.03);
    }

    .menu-toggle .bar {
      width: 24px;
      height: 3px;
      background-color: var(--text-dark);
      border-radius: 10px;
      transition: var(--transition);
    }

    /* Open Hamburger State */
    .menu-toggle.open .bar:nth-child(1) {
      transform: translateY(8px) rotate(45deg);
      background-color: var(--primary);
    }
    .menu-toggle.open .bar:nth-child(2) {
      opacity: 0;
    }
    .menu-toggle.open .bar:nth-child(3) {
      transform: translateY(-8px) rotate(-45deg);
      background-color: var(--primary);
    }

    @media (max-width: 1024px) {
      .nav-menu {
        position: absolute;
        top: 100%;
        left: 0;
        width: 100%;
        background-color: var(--white);
        flex-direction: column;
        align-items: stretch;
        padding: 24px;
        box-shadow: 0 15px 30px rgba(0, 0, 0, 0.1);
        gap: 8px;
        border-top: 1px solid #F1F5F9;
        display: none;
        max-height: 80vh;
        overflow-y: auto;
      }

      .nav-menu.active {
        display: flex;
        animation: slideDown 0.3s cubic-bezier(0.25, 0.8, 0.25, 1) forwards;
      }

      @keyframes slideDown {
        from { opacity: 0; transform: translateY(-10px); }
        to { opacity: 1; transform: translateY(0); }
      }

      .nav-menu a {
        display: block;
        padding: 12px 16px;
      }

      /* Mobile dropdown behavior */
      .dropdown-item {
        position: static;
      }

      .dropdown-menu {
        position: static;
        transform: none !important;
        opacity: 1;
        visibility: visible;
        box-shadow: none;
        border: none;
        padding-left: 24px;
        display: none;
        background-color: rgba(0,0,0,0.01);
        margin-top: 4px;
      }

      .dropdown-item:hover .dropdown-menu,
      .dropdown-menu.show {
        display: block;
      }

      .menu-toggle {
        display: flex;
      }

      .nav-actions {
        display: none;
      }
    }
  `]
})
export class HeaderComponent implements OnInit {
  settings: any = {};
  currentUser: User | null = null;
  menuActive = false;
  dropdownActive = false;
  programsDropdownActive = false;
  isScrolled = false;

  constructor(
    private contentService: ContentService,
    private authService: AuthService
  ) {
    // Listen to scroll events to trigger sticky styling
    if (typeof window !== 'undefined') {
      window.addEventListener('scroll', this.onScroll);
    }
  }

  ngOnInit(): void {
    // Load Settings
    this.contentService.getSettings().subscribe({
      next: (data) => {
        this.settings = data;
      },
      error: () => {}
    });

    // Listen to Auth State
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });
  }

  onScroll = (): void => {
    if (typeof window !== 'undefined') {
      this.isScrolled = window.scrollY > 50;
    }
  };

  toggleMenu(): void {
    this.menuActive = !this.menuActive;
    if (!this.menuActive) {
      this.dropdownActive = false;
      this.programsDropdownActive = false;
    }
  }

  closeMenu(): void {
    this.menuActive = false;
    this.dropdownActive = false;
    this.programsDropdownActive = false;
  }

  toggleDropdown(state: boolean): void {
    if (typeof window !== 'undefined' && window.innerWidth > 1024) {
      this.dropdownActive = state;
    } else if (!state) {
      // Toggle for mobile
      this.dropdownActive = !this.dropdownActive;
    }
  }

  toggleProgramsDropdown(state: boolean): void {
    if (typeof window !== 'undefined' && window.innerWidth > 1024) {
      this.programsDropdownActive = state;
    } else if (!state) {
      // Toggle for mobile
      this.programsDropdownActive = !this.programsDropdownActive;
    }
  }

  isProgramsActive(): boolean {
    const activeRoutes = ['/programs', '/programs/preschool'];
    if (typeof window !== 'undefined') {
      return activeRoutes.some(route => window.location.pathname === route);
    }
    return false;
  }

  isDropdownActive(): boolean {
    const activeRoutes = ['/why-us', '/curriculum', '/centers', '/gallery', '/faq', '/careers', '/franchise'];
    if (typeof window !== 'undefined') {
      return activeRoutes.some(route => window.location.pathname === route);
    }
    return false;
  }

  logout(): void {
    this.authService.logout();
  }
}
