import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';

export interface LearnerMe {
  id: string;
  email: string;
  displayName: string;
  initials: string;
  role: string;
}

export interface AuthResponse {
  accessToken: string;
  tokenType: string;
  learner: LearnerMe;
}

const TOKEN_KEY = 'fhi.auth.token';
const LEARNER_KEY = 'fhi.auth.learner';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly base = '/api/v1/auth';

  private readonly tokenSignal = signal<string | null>(localStorage.getItem(TOKEN_KEY));
  private readonly learnerSignal = signal<LearnerMe | null>(this.readLearner());

  readonly learner = this.learnerSignal.asReadonly();
  readonly isLoggedIn = computed(() => {
    const token = this.tokenSignal();
    const learner = this.learnerSignal();
    return !!token && token !== 'undefined' && !!learner?.id;
  });

  token(): string | null {
    return this.tokenSignal();
  }

  login(email: string, password: string): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.base}/login`, { email: email.trim(), password })
      .pipe(tap((res) => this.persist(res)));
  }

  register(email: string, password: string, displayName: string): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.base}/register`, {
        email: email.trim(),
        password,
        displayName,
      })
      .pipe(tap((res) => this.persist(res)));
  }

  me(): Observable<LearnerMe> {
    return this.http.get<LearnerMe>(`${this.base}/me`).pipe(
      tap((learner) => {
        localStorage.setItem(LEARNER_KEY, JSON.stringify(learner));
        this.learnerSignal.set(learner);
      })
    );
  }

  logout(navigateToLogin = true): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(LEARNER_KEY);
    this.tokenSignal.set(null);
    this.learnerSignal.set(null);
    if (navigateToLogin) {
      void this.router.navigateByUrl('/login');
    }
  }

  private persist(res: AuthResponse): void {
    const token = res?.accessToken ?? (res as unknown as { access_token?: string })?.access_token;
    const learner = res?.learner;
    if (!token || !learner?.id) {
      throw new Error('Login response missing accessToken/learner');
    }
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(LEARNER_KEY, JSON.stringify(learner));
    this.tokenSignal.set(token);
    this.learnerSignal.set(learner);
  }

  private readLearner(): LearnerMe | null {
    try {
      const raw = localStorage.getItem(LEARNER_KEY);
      return raw ? (JSON.parse(raw) as LearnerMe) : null;
    } catch {
      return null;
    }
  }
}
