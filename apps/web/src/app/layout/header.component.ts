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
            <a routerLink="/" fragment="courses">Courses</a>
            <a routerLink="/my-learning">My Learning</a>
            <a routerLink="/phase/15">Mock Assessment</a>
            <a routerLink="/phase/16">Readiness</a>
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
          <a routerLink="/" fragment="courses" (click)="close()">Courses</a>
          <a routerLink="/my-learning" (click)="close()">My Learning</a>
          <a routerLink="/phase/15" (click)="close()">Mock Assessment</a>
          <a routerLink="/phase/16" (click)="close()">Readiness</a>
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
