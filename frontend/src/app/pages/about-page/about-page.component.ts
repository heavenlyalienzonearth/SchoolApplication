import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HeaderComponent } from '../../shared/components/header/header.component';
import { FooterComponent } from '../../shared/components/footer/footer.component';
import { ContentService } from '../../core/services/content.service';

@Component({
  selector: 'app-about-page',
  standalone: true,
  imports: [CommonModule, RouterModule, HeaderComponent, FooterComponent],
  templateUrl: './about-page.component.html',
  styleUrls: ['./about-page.component.css']
})
export class AboutPageComponent implements OnInit {
  aboutIntro: any = {};
  aboutFeatures: any[] = [];
  visionSection: any = {};
  purposeSection: any = {};
  philosophySection: any = {};
  philosophyValues: any[] = [];
  loading = true;

  constructor(private contentService: ContentService) {}

  ngOnInit(): void {
    this.contentService.getPageSections('about').subscribe({
      next: (sections: any[]) => {
        sections.forEach(sec => {
          if (sec.section_code === 'about_intro') {
            this.aboutIntro = sec;
            if (sec.content_json) {
              try {
                this.aboutFeatures = JSON.parse(sec.content_json);
              } catch {
                this.aboutFeatures = [];
              }
            }
          } else if (sec.section_code === 'about_vision') {
            this.visionSection = sec;
          } else if (sec.section_code === 'about_purpose') {
            this.purposeSection = sec;
          } else if (sec.section_code === 'about_philosophy') {
            this.philosophySection = sec;
            if (sec.content_json) {
              try {
                this.philosophyValues = JSON.parse(sec.content_json);
              } catch {
                this.philosophyValues = [];
              }
            }
          }
        });
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }
}
