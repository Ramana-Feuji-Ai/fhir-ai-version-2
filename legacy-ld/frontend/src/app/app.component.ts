import { Component } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink],
  template: `
    <a class="skip" href="#main">Skip to content</a>
    <header class="site-header">
      <div class="wrap header-inner">
        <a class="brand" routerLink="/">
          <svg class="mark" viewBox="0 0 40 40" aria-hidden="true">
            <rect width="40" height="40" rx="10" fill="#e87722"/>
            <path d="M10 26c4-9 7-13 10-13s6 4 10 13" fill="none" stroke="#0a1c31" stroke-width="2.4"/>
            <circle cx="20" cy="12" r="3" fill="#0a1c31"/>
          </svg>
          <span>
            <span class="brand-name">FHIR <span>L&amp;D</span></span>
            <span class="brand-sub">Learning &amp; Development</span>
          </span>
        </a>
        <nav class="nav open-desktop">
          <a routerLink="/" fragment="curriculum">Curriculum</a>
          <a href="https://fhir.org/" target="_blank" rel="noopener">fhir.org</a>
          <a href="https://hl7.org/fhir/" target="_blank" rel="noopener">Specification</a>
        </nav>
      </div>
    </header>
    <main id="main">
      <router-outlet />
    </main>
    <footer class="site-footer">
      <div class="wrap">
        <p class="legal">FHIR® and the Flame Design mark are registered trademarks of HL7®. This educational site is independent and is not an HL7 or FHIR Foundation publication. Treat hl7.org/fhir as authoritative for conformance. Content is adapted from public FHIR Foundation and HL7 FHIR overview materials.</p>
      </div>
    </footer>
  `
})
export class AppComponent {}
