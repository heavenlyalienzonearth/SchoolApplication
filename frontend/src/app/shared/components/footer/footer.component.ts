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
            <a *ngIf="settings.facebook_url" [href]="settings.facebook_url" target="_blank" class="facebook">FB</a>
            <a *ngIf="settings.instagram_url" [href]="settings.instagram_url" target="_blank" class="instagram">IG</a>
            <a *ngIf="settings.twitter_url" [href]="settings.twitter_url" target="_blank" class="twitter">TW</a>
            <a *ngIf="settings.youtube_url" [href]="settings.youtube_url" target="_blank" class="youtube">YT</a>
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
      color: var(--white);
      display: flex;
      align-items: center;
      justify-content: center;
      text-decoration: none;
      font-weight: 700;
      font-size: 0.8rem;
      transition: var(--transition);
    }

    .social-links a:hover {
      background-color: var(--primary);
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
