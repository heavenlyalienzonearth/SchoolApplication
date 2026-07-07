import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ContentService } from '../../../core/services/content.service';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <footer class="main-footer">
      <div class="container footer-grid">
        <!-- Logo & Tagline -->
        <div class="footer-col brand-col">
          <a routerLink="/" class="logo-area">
            <img [src]="settings.site_logo || '/assets/images/logo.png'" [alt]="settings.site_name || 'Logo'" class="logo" />
            <h3>{{ settings.site_name || 'Kangaroo Club' }}</h3>
          </a>
          <p class="tagline">Providing a vibrant environment for early childhood education, nurturing independence, curiosity, and play.</p>
          <div class="social-links">
            <a *ngIf="settings.facebook_url" [href]="settings.facebook_url" target="_blank" class="facebook" aria-label="Facebook">
              <svg viewBox="0 0 24 24" class="social-svg-logo" style="fill: currentColor; width: 16px; height: 16px;">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
            </a>
            <a *ngIf="settings.instagram_url" [href]="settings.instagram_url" target="_blank" class="instagram" aria-label="Instagram">
              <svg viewBox="0 0 24 24" class="social-svg-logo" style="fill: currentColor; width: 16px; height: 16px;">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.051.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/>
              </svg>
            </a>
            <a *ngIf="settings.twitter_url" [href]="settings.twitter_url" target="_blank" class="twitter" aria-label="Twitter">
              <svg viewBox="0 0 24 24" class="social-svg-logo" style="fill: currentColor; width: 16px; height: 16px;">
                <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
              </svg>
            </a>
            <a *ngIf="settings.youtube_url" [href]="settings.youtube_url" target="_blank" class="youtube" aria-label="Youtube">
              <svg viewBox="0 0 24 24" class="social-svg-logo" style="fill: currentColor; width: 16px; height: 16px;">
                <path d="M23.498 6.163a3.003 3.003 0 0 0-2.11-2.11C19.518 3.545 12 3.545 12 3.545s-7.518 0-9.388.508a3.003 3.003 0 0 0-2.11 2.11C0 8.033 0 12 0 12s0 3.967.502 5.837a3.003 3.003 0 0 0 2.11 2.11c1.87.508 9.388.508 9.388.508s7.518 0 9.388-.508a3.003 3.003 0 0 0 2.11-2.11C24 15.967 24 12 24 12s0-3.967-.502-5.837zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
              </svg>
            </a>
          </div>
        </div>

        <!-- Quick Links -->
        <div class="footer-col links-col">
          <h4>Quick Links</h4>
          <ul>
            <li><a routerLink="/about">About Us</a></li>
            <li><a routerLink="/why-us">Why Choose Us</a></li>
            <li><a routerLink="/programs">Our Programs</a></li>
            <li><a routerLink="/curriculum">Curriculum</a></li>
            <li><a routerLink="/admissions">Admissions</a></li>
            <li><a routerLink="/centers">Our Centers</a></li>
          </ul>
        </div>

        <!-- Support Links -->
        <div class="footer-col links-col">
          <h4>Support & Info</h4>
          <ul>
            <li><a routerLink="/gallery">School Gallery</a></li>
            <li><a routerLink="/careers">Careers</a></li>
            <li><a routerLink="/franchise">Franchise</a></li>
            <li><a routerLink="/blog">Blog</a></li>
            <li><a routerLink="/faq">FAQ</a></li>
            <li><a routerLink="/privacy-policy">Privacy Policy</a></li>
            <li><a routerLink="/terms">Terms & Conditions</a></li>
          </ul>
        </div>

        <!-- Contact details -->
        <div class="footer-col contact-col">
          <h4>Contact Us</h4>
          <ul class="contact-details">
            <li *ngIf="settings.address">
              <span class="icon">📍</span>
              <p>{{ settings.address }}</p>
            </li>
            <li *ngIf="settings.contact_phone">
              <span class="icon">📞</span>
              <p>{{ settings.contact_phone }}</p>
            </li>
            <li *ngIf="settings.contact_email">
              <span class="icon">✉️</span>
              <p>{{ settings.contact_email }}</p>
            </li>
            <li *ngIf="settings.opening_hours">
              <span class="icon">⏰</span>
              <p>{{ settings.opening_hours }}</p>
            </li>
          </ul>
        </div>
      </div>

      <div class="footer-bottom">
        <div class="container bottom-container">
          <p>{{ settings.footer_text || '© 2026 Kangaroo Club. All rights reserved.' }}</p>
          <div class="bottom-links">
            <a routerLink="/privacy-policy">Privacy Policy</a>
            <span class="divider">|</span>
            <a routerLink="/terms">Terms of Use</a>
          </div>
        </div>
      </div>
    </footer>
  `,
  styles: [`
    .main-footer {
      background-color: #1E293B;
      color: #E2E8F0;
      padding: 70px 0 0 0;
      font-family: var(--font-body);
    }

    .footer-grid {
      display: grid;
      grid-template-columns: 2.2fr 1fr 1fr 1.8fr;
      gap: 40px;
      margin-bottom: 50px;
    }

    .footer-col h4 {
      font-family: var(--font-heading);
      color: var(--secondary);
      font-size: 1.2rem;
      margin-bottom: 24px;
      position: relative;
    }

    .footer-col h4::after {
      content: '';
      position: absolute;
      left: 0;
      bottom: -6px;
      width: 40px;
      height: 3px;
      background-color: var(--primary);
      border-radius: 2px;
    }

    .brand-col .logo-area {
      display: flex;
      align-items: center;
      gap: 12px;
      text-decoration: none;
      margin-bottom: 20px;
    }

    .brand-col .logo {
      height: 48px;
    }

    .brand-col h3 {
      font-family: var(--font-heading);
      font-size: 1.3rem;
      color: var(--white);
    }

    .tagline {
      font-size: 0.95rem;
      color: #94A3B8;
      margin-bottom: 24px;
    }

    .social-links {
      display: flex;
      gap: 10px;
    }

    .social-links a {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background-color: rgba(255, 255, 255, 0.05);
      color: #94A3B8;
      display: flex;
      align-items: center;
      justify-content: center;
      text-decoration: none;
      transition: var(--transition);
      border: 1px solid rgba(255, 255, 255, 0.08);
    }

    .social-links a.facebook:hover {
      background-color: #1877F2;
      color: var(--white);
      border-color: #1877F2;
      transform: translateY(-3px);
    }

    .social-links a.instagram:hover {
      background-color: #d6249f;
      color: var(--white);
      border-color: #d6249f;
      transform: translateY(-3px);
    }

    .social-links a.twitter:hover {
      background-color: #1DA1F2;
      color: var(--white);
      border-color: #1DA1F2;
      transform: translateY(-3px);
    }

    .social-links a.youtube:hover {
      background-color: #FF0000;
      color: var(--white);
      border-color: #FF0000;
      transform: translateY(-3px);
    }

    .links-col ul {
      list-style: none;
    }

    .links-col li {
      margin-bottom: 12px;
    }

    .links-col a {
      color: #94A3B8;
      text-decoration: none;
      transition: var(--transition);
      font-weight: 500;
      font-size: 0.95rem;
    }

    .links-col a:hover {
      color: var(--secondary);
      padding-left: 5px;
    }

    .contact-details {
      list-style: none;
    }

    .contact-details li {
      display: flex;
      gap: 12px;
      margin-bottom: 18px;
      align-items: flex-start;
    }

    .contact-details .icon {
      font-size: 1.2rem;
    }

    .contact-details p {
      font-size: 0.95rem;
      color: #94A3B8;
      margin: 0;
    }

    .footer-bottom {
      border-top: 1px solid rgba(255, 255, 255, 0.05);
      padding: 24px 0;
      background-color: #0F172A;
      font-size: 0.9rem;
      color: #64748B;
    }

    .bottom-container {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 15px;
    }

    .bottom-links a {
      color: #64748B;
      text-decoration: none;
      transition: var(--transition);
    }

    .bottom-links a:hover {
      color: var(--secondary);
    }

    .divider {
      margin: 0 10px;
    }

    @media (max-width: 900px) {
      .footer-grid {
        grid-template-columns: 1fr 1fr;
      }
    }

    @media (max-width: 500px) {
      .footer-grid {
        grid-template-columns: 1fr;
      }
      .bottom-container {
        flex-direction: column;
        text-align: center;
      }
    }
  `]
})
export class FooterComponent implements OnInit {
  settings: any = {};

  constructor(private contentService: ContentService) {}

  ngOnInit(): void {
    this.contentService.getSettings().subscribe({
      next: (data) => {
        this.settings = data;
      },
      error: () => {}
    });
  }
}
