import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { switchMap } from 'rxjs';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'fhi-login-page',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <section class="authPage">
      <div class="authOrb orb1" aria-hidden="true"></div>
      <div class="authOrb orb2" aria-hidden="true"></div>
      <div class="authOrb orb3" aria-hidden="true"></div>
      <svg class="authMesh" aria-hidden="true" viewBox="0 0 600 600" fill="none">
        <circle cx="300" cy="300" r="180" stroke="rgba(224,160,106,.18)" stroke-width="1" />
        <circle cx="300" cy="300" r="260" stroke="rgba(59,143,212,.14)" stroke-width="1" />
        <circle cx="300" cy="300" r="120" stroke="rgba(255,255,255,.1)" stroke-width="1" />
      </svg>

      <div class="wrap authWrap">
        <div class="authCard">
          <div class="authBrand">
            <span class="logo">fhi</span>
            <div>
              <b>FHIR Learning</b>
              <small>Sign in to continue</small>
            </div>
          </div>

          <div class="authTabs">
            <button type="button" [class.on]="mode() === 'login'" (click)="mode.set('login')">Sign in</button>
            <button type="button" [class.on]="mode() === 'register'" (click)="mode.set('register')">Register</button>
            <span class="authTabIndicator" [class.right]="mode() === 'register'" aria-hidden="true"></span>
          </div>

          <form (ngSubmit)="submit()" class="authForm">
            @if (mode() === 'register') {
              <label>
                <span>Display name</span>
                <input name="displayName" [(ngModel)]="displayName" required minlength="2" autocomplete="name" />
              </label>
            }
            <label>
              <span>Email</span>
              <input name="email" type="email" [(ngModel)]="email" required autocomplete="username" />
            </label>
            <label>
              <span>Password</span>
              <input name="password" type="password" [(ngModel)]="password" required minlength="8" autocomplete="current-password" />
            </label>

            @if (error()) {
              <p class="authError shake">{{ error() }}</p>
            }

            <button class="btn" type="submit" [disabled]="busy()">
              {{ busy() ? 'Please wait…' : mode() === 'login' ? 'Sign in' : 'Create account' }}
            </button>
          </form>

          <p class="authHint muted">
            Demo account: <code>mr&#64;fhi.local</code> / <code>ChangeMe123!</code>
          </p>
          <p class="authHint muted"><a routerLink="/">Back to home</a> (requires login)</p>
        </div>
      </div>

      @if (signingIn()) {
        <div class="loginOverlay">
          <div class="spinnerWrap">
            <div class="spinnerRing"></div>
            <div class="spinnerRing ring2"></div>
            <div class="spinnerRing ring3"></div>
            <div class="spinnerLogo">fhi</div>
          </div>
          <p class="overlayText">Signing you in<span class="dots"><i>.</i><i>.</i><i>.</i></span></p>
          <div class="overlayBar"><i></i></div>
        </div>
      }
    </section>
  `,
  styles: `
    .authPage {
      position: relative;
      min-height: calc(100vh - 120px);
      display: grid;
      align-items: center;
      padding: 48px 0;
      overflow: hidden;
      background:
        radial-gradient(900px 420px at 10% 0%, rgba(232,241,248,.9) 0%, transparent 55%),
        radial-gradient(700px 360px at 100% 10%, rgba(243,237,230,.95) 0%, transparent 50%),
        linear-gradient(180deg, #0B1C2C 0%, #14304A 42%, #F7F9FB 42%);
    }
    .authOrb {
      position: absolute;
      border-radius: 50%;
      filter: blur(2px);
      pointer-events: none;
      opacity: .55;
      animation: orbFloat 14s ease-in-out infinite;
    }
    .orb1 { top: -60px; left: 8%; width: 220px; height: 220px; background: radial-gradient(circle, rgba(224,160,106,.5) 0%, transparent 70%); animation-duration: 16s; }
    .orb2 { top: 120px; right: 10%; width: 280px; height: 280px; background: radial-gradient(circle, rgba(59,143,212,.4) 0%, transparent 70%); animation-duration: 20s; animation-delay: -4s; }
    .orb3 { bottom: 40px; left: 42%; width: 180px; height: 180px; background: radial-gradient(circle, rgba(76,175,122,.35) 0%, transparent 70%); animation-duration: 18s; animation-delay: -8s; }
    .authMesh {
      position: absolute;
      top: 50%;
      left: 50%;
      width: 640px;
      height: 640px;
      transform: translate(-50%, -50%);
      opacity: .5;
      pointer-events: none;
      animation: meshSpin 60s linear infinite;
    }
    @keyframes orbFloat {
      0%, 100% { transform: translate(0, 0) scale(1); }
      50% { transform: translate(24px, -28px) scale(1.08); }
    }
    @keyframes meshSpin {
      from { transform: translate(-50%, -50%) rotate(0deg); }
      to { transform: translate(-50%, -50%) rotate(360deg); }
    }
    .authWrap { position: relative; z-index: 2; max-width: 480px; }
    .authCard {
      background: rgba(255,255,255,.62);
      border: 1px solid rgba(255,255,255,.55);
      border-radius: 22px;
      padding: 28px;
      box-shadow: 0 24px 60px rgba(11,28,44,.22);
      backdrop-filter: blur(22px);
      animation: cardRise .6s cubic-bezier(.2,.7,.3,1) both;
    }
    @keyframes cardRise {
      from { opacity: 0; transform: translateY(28px) scale(.97); }
      to { opacity: 1; transform: translateY(0) scale(1); }
    }
    .authBrand {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 22px;
    }
    .authBrand .logo {
      display: inline-flex;
      transition: transform .3s ease;
    }
    .authBrand:hover .logo { transform: rotate(-6deg) scale(1.08); }
    .authBrand b { display: block; font-size: 16px; }
    .authBrand small { color: var(--n5); font-size: 12px; }
    .authTabs {
      position: relative;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
      margin-bottom: 18px;
      padding: 4px;
      border-radius: 12px;
      background: var(--n0);
      border: 1px solid var(--g3);
    }
    .authTabs button {
      position: relative;
      z-index: 1;
      border: none;
      background: transparent;
      border-radius: 8px;
      min-height: 36px;
      font-weight: 600;
      color: var(--n6);
      transition: color .25s ease;
    }
    .authTabs button.on { color: #fff; }
    .authTabIndicator {
      position: absolute;
      top: 4px;
      left: 4px;
      width: calc(50% - 6px);
      height: calc(100% - 8px);
      border-radius: 8px;
      background: var(--n8);
      transition: transform .3s cubic-bezier(.4,.2,.2,1);
    }
    .authTabIndicator.right { transform: translateX(calc(100% + 4px)); }
    .authForm {
      display: grid;
      gap: 14px;
    }
    .authForm label {
      display: grid;
      gap: 6px;
      font-size: 13px;
      font-weight: 600;
      color: var(--n7);
      animation: fieldFadeIn .4s ease both;
    }
    .authForm label:nth-child(1) { animation-delay: .05s; }
    .authForm label:nth-child(2) { animation-delay: .1s; }
    .authForm label:nth-child(3) { animation-delay: .15s; }
    @keyframes fieldFadeIn {
      from { opacity: 0; transform: translateY(6px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .authForm input {
      width: 100%;
      padding: 0 12px;
      transition: border-color .2s ease, box-shadow .2s ease;
    }
    .authForm input:focus {
      border-color: var(--o7);
      box-shadow: 0 0 0 3px rgba(184,90,18,.15);
      outline: none;
    }
    .authForm .btn {
      transition: transform .15s ease, box-shadow .15s ease;
    }
    .authForm .btn:hover:not(:disabled) {
      transform: translateY(-1px);
      box-shadow: 0 8px 20px rgba(11,28,44,.18);
    }
    .authForm .btn:active:not(:disabled) { transform: translateY(0); }
    .authError {
      margin: 0;
      color: #8A3A3A;
      background: #F8EAEA;
      border: 1px solid #E8C8C8;
      border-radius: 8px;
      padding: 10px 12px;
      font-size: 13px;
    }
    .shake { animation: shake .4s ease; }
    @keyframes shake {
      10%, 90% { transform: translateX(-1px); }
      20%, 80% { transform: translateX(2px); }
      30%, 50%, 70% { transform: translateX(-4px); }
      40%, 60% { transform: translateX(4px); }
    }
    .authHint {
      margin: 16px 0 0;
      font-size: 12px;
    }
    .authHint code {
      background: var(--n0);
      padding: 1px 6px;
      border-radius: 4px;
    }
    .authHint a { color: var(--b6); transition: color .15s ease; }
    .authHint a:hover { color: var(--o7); }
    @media (prefers-reduced-motion: reduce) {
      .authOrb, .authMesh, .authCard, .authForm label, .shake { animation: none; }
    }

    .loginOverlay {
      position: fixed;
      inset: 0;
      z-index: 50;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 22px;
      background: linear-gradient(160deg, rgba(11,28,44,.94) 0%, rgba(20,48,74,.94) 60%, rgba(30,63,92,.94) 100%);
      backdrop-filter: blur(8px);
      animation: overlayFade .35s ease both;
    }
    @keyframes overlayFade {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    .spinnerWrap {
      position: relative;
      width: 104px;
      height: 104px;
      display: grid;
      place-items: center;
      animation: spinnerPop .5s cubic-bezier(.2,.7,.3,1) both;
    }
    @keyframes spinnerPop {
      from { opacity: 0; transform: scale(.7); }
      to { opacity: 1; transform: scale(1); }
    }
    .spinnerRing {
      position: absolute;
      inset: 0;
      border-radius: 50%;
      border: 3px solid transparent;
      border-top-color: #E0A06A;
      border-right-color: #E0A06A;
      animation: spin 1s linear infinite;
    }
    .spinnerRing.ring2 {
      inset: 14px;
      border-top-color: #3B8FD4;
      border-right-color: transparent;
      border-bottom-color: #3B8FD4;
      animation: spin 1.3s linear infinite reverse;
    }
    .spinnerRing.ring3 {
      inset: 28px;
      border-top-color: #4CAF7A;
      border-left-color: #4CAF7A;
      border-right-color: transparent;
      border-bottom-color: transparent;
      animation: spin 1.7s linear infinite;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    .spinnerLogo {
      font-family: "IBM Plex Serif", Georgia, serif;
      font-size: 22px;
      font-weight: 700;
      color: #fff;
      letter-spacing: -.02em;
      animation: pulseScale 1.6s ease-in-out infinite;
    }
    @keyframes pulseScale {
      0%, 100% { transform: scale(1); opacity: .85; }
      50% { transform: scale(1.12); opacity: 1; }
    }
    .overlayText {
      margin: 0;
      color: rgba(255,255,255,.88);
      font-size: 14px;
      font-weight: 600;
      letter-spacing: .02em;
    }
    .dots i {
      font-style: normal;
      display: inline-block;
      opacity: 0;
      animation: dotBlink 1.4s infinite;
    }
    .dots i:nth-child(1) { animation-delay: 0s; }
    .dots i:nth-child(2) { animation-delay: .2s; }
    .dots i:nth-child(3) { animation-delay: .4s; }
    @keyframes dotBlink {
      0%, 80%, 100% { opacity: 0; }
      40% { opacity: 1; }
    }
    .overlayBar {
      width: 180px;
      height: 4px;
      border-radius: 99px;
      background: rgba(255,255,255,.15);
      overflow: hidden;
    }
    .overlayBar i {
      display: block;
      height: 100%;
      width: 40%;
      border-radius: 99px;
      background: linear-gradient(90deg, #E0A06A, #3B8FD4);
      animation: overlayBarSlide 3s cubic-bezier(.3,.1,.2,1) both;
    }
    @keyframes overlayBarSlide {
      from { transform: translateX(-100%); width: 30%; }
      to { transform: translateX(280%); width: 40%; }
    }
    @media (prefers-reduced-motion: reduce) {
      .loginOverlay, .spinnerWrap, .spinnerRing, .spinnerLogo, .dots i, .overlayBar i { animation: none; }
    }
  `,
})
export class LoginPage {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly mode = signal<'login' | 'register'>('login');
  readonly busy = signal(false);
  readonly error = signal<string | null>(null);
  readonly signingIn = signal(false);

  email = 'mr@fhi.local';
  password = 'ChangeMe123!';
  displayName = '';

  submit(): void {
    this.busy.set(true);
    this.error.set(null);
    const req$ =
      this.mode() === 'login'
        ? this.auth.login(this.email, this.password)
        : this.auth.register(this.email, this.password, this.displayName || this.email.split('@')[0]);

    req$
      .pipe(switchMap(() => this.auth.me()))
      .subscribe({
        next: () => {
          this.busy.set(false);
          this.signingIn.set(true);
          setTimeout(() => {
            void this.router.navigateByUrl('/', { replaceUrl: true });
          }, 3000);
        },
        error: (err) => {
          this.busy.set(false);
          // Login may have succeeded but token rejected — clear partial session
          if (this.auth.token()) {
            this.auth.logout(false);
          }
          const msg =
            err?.error?.message ||
            err?.error?.detail ||
            err?.error?.error ||
            err?.message ||
            (err?.status === 401 ? 'Invalid email or password' : null) ||
            (err?.status === 409 ? 'Email already registered' : null) ||
            'Sign-in failed. Is the API running?';
          this.error.set(String(msg));
        },
      });
  }
}
