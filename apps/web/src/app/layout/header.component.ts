import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../core/auth.service';

@Component({
  selector: 'fhi-header',
  standalone: true,
  imports: [RouterLink],
  template: `
    <header>
      <nav class="wrap">
        <a class="brand" routerLink="/">
          <span class="logo">fhi</span>
          <span><b>FHIR Learning</b><small>Health intelligence academy</small></span>
        </a>
        @if (auth.isLoggedIn()) {
          <div class="navlinks">
            <div class="navGroup learningGroup" title="FHIR Learning Simulator">
              <a routerLink="/" fragment="courses">Courses</a>
              <a routerLink="/my-learning">My Learning</a>
              <a routerLink="/sandbox">Sandbox</a>
              <a routerLink="/phase/15">Mock Assessment</a>
              <a routerLink="/phase/16">Readiness</a>
            </div>
            <span class="navDivider" aria-hidden="true"></span>
            <div class="navGroup copilotGroup" title="FHIR Democratization Assistant">
              <a routerLink="/design">Design</a>
              <a routerLink="/testing">Test</a>
              <a routerLink="/knowledge">Knowledge</a>
            </div>
          </div>
          <button
            class="avatar"
            type="button"
            [attr.aria-label]="auth.learner()?.displayName || 'Learner profile'"
            [title]="auth.learner()?.email || ''"
          >{{ auth.learner()?.initials || '?' }}</button>
          <button class="logoutBtn" type="button" (click)="auth.logout()">Sign out</button>
          <button class="menu" type="button" aria-label="Toggle menu" (click)="toggle()">&#9776;</button>
        }
      </nav>
      @if (auth.isLoggedIn()) {
        <div id="mobile" class="mobile" [class.open]="menuOpen()">
          <span class="mobileGroupLabel">FHIR Learning Simulator</span>
          <a routerLink="/" fragment="courses" (click)="close()">Courses</a>
          <a routerLink="/my-learning" (click)="close()">My Learning</a>
          <a routerLink="/sandbox" (click)="close()">Sandbox</a>
          <a routerLink="/phase/15" (click)="close()">Mock Assessment</a>
          <a routerLink="/phase/16" (click)="close()">Readiness</a>
          <span class="mobileGroupLabel copilot">FHIR Democratization Assistant</span>
          <a class="copilotLink" routerLink="/design" (click)="close()">Design</a>
          <a class="copilotLink" routerLink="/testing" (click)="close()">Test</a>
          <a class="copilotLink" routerLink="/knowledge" (click)="close()">Knowledge</a>
          <button type="button" (click)="auth.logout(); close()">Sign out</button>
        </div>
      }
    </header>
  `,
  styles: `
    .navlinks a, .mobile a, .brand {
      text-decoration: none;
      color: inherit;
    }
    .navlinks {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .navGroup {
      display: flex;
      align-items: center;
      gap: 2px;
    }
    .navlinks a {
      border: 0;
      background: none;
      color: var(--n7);
      font-size: 13px;
      font-weight: 500;
      padding: 8px 12px;
      border-radius: 8px;
    }
    .navlinks a:hover { background: var(--n0); color: var(--n9); }
    .navDivider {
      width: 1px;
      height: 22px;
      background: var(--g3);
      margin: 0 2px;
    }
    /* The Democratization Assistant tabs (Design/Test/Knowledge) get the same orange accent those
       pages use for their own eyebrow text, so the header visually marks them as a second product
       alongside the FHIR Learning Simulator tabs on the left. */
    .copilotGroup {
      background: var(--o1);
      border-radius: 10px;
      padding: 3px;
    }
    .copilotGroup a { color: var(--o7); }
    .copilotGroup a:hover { background: rgba(255, 255, 255, .6); color: var(--o7); }
    .logoutBtn {
      border: 1px solid var(--g3);
      background: white;
      color: var(--n7);
      border-radius: 8px;
      min-height: 36px;
      padding: 0 12px;
      font-size: 12px;
      font-weight: 600;
    }
    .logoutBtn:hover { background: var(--n0); }
    .mobileGroupLabel {
      display: block;
      padding: 10px 16px 4px;
      font-size: 10px;
      font-weight: 750;
      letter-spacing: .08em;
      text-transform: uppercase;
      color: var(--n5);
    }
    .mobileGroupLabel.copilot {
      color: var(--o7);
      border-top: 1px solid var(--g3);
      margin-top: 6px;
    }
    .mobile a.copilotLink {
      background: var(--o1);
      color: var(--o7);
      margin: 2px 8px;
      border-radius: 8px;
      padding: 10px 8px;
    }
    .mobile button {
      display: block;
      width: 100%;
      text-align: left;
      border: 0;
      background: none;
      padding: 12px 16px;
      color: inherit;
      font: inherit;
    }
  `,
})
export class HeaderComponent {
  readonly auth = inject(AuthService);
  readonly menuOpen = signal(false);
  toggle(): void { this.menuOpen.update((v) => !v); }
  close(): void { this.menuOpen.set(false); }
}
