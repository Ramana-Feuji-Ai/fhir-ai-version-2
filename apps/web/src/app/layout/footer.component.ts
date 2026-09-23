import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'fhi-footer',
  standalone: true,
  imports: [RouterLink],
  template: `
    <footer>
      <div class="wrap footer">
        <div>
          <a class="brand" routerLink="/">
            <span class="logo">fhi</span>
            <span><b>FHIR Learning</b></span>
          </a>
          <p style="color:#9AA8B8;font-size:13px;margin:12px 0 0;max-width:320px;line-height:1.5">
            Internal academy for FHIR R4 certification preparation, with R4B/R5 labeled as future readiness.
          </p>
        </div>
        <div class="footCol">
          <b>Explore</b>
          <a routerLink="/" fragment="courses">Courses</a>
          <a routerLink="/my-learning">My Learning</a>
          <a routerLink="/phase/15">Mock assessment</a>
          <a routerLink="/phase/16">Readiness program</a>
        </div>
        <div class="footCol">
          <b>Focus</b>
          <span>FHIR R4 baseline</span>
          <span>US Core &amp; payer IGs</span>
          <span>SMART security</span>
          <span>Validation &amp; troubleshooting</span>
        </div>
        <div class="footerNote">
          FHIR R4 certification preparation · R4B and R5 future readiness · Internal learning experience
        </div>
      </div>
    </footer>
  `,
  styles: `
    .brand, .footCol a { text-decoration: none; color: inherit; display: block; }
    .footCol a { background: none; border: 0; text-align: left; padding: 0; margin: 0 0 8px; }
  `,
})
export class FooterComponent {}
