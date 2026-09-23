import { Injectable, computed, inject, signal } from '@angular/core';
import { AuthService } from './auth.service';

interface CourseState { role: string | null; enrolled: string[]; }

@Injectable({ providedIn: 'root' })
export class CourseStateService {
  private readonly auth = inject(AuthService);
  private readonly state = signal<CourseState>(this.read());
  readonly role = computed(() => this.state().role);
  readonly enrolled = computed(() => this.state().enrolled);

  isEnrolled(slug: string): boolean { return this.state().enrolled.includes(slug); }
  enroll(slug: string): void { this.update({ enrolled: [...new Set([...this.state().enrolled, slug])] }); }
  setRole(role: string): void { this.update({ role: role || null }); }

  private update(partial: Partial<CourseState>): void {
    const next = { ...this.state(), ...partial };
    this.state.set(next);
    localStorage.setItem(this.key(), JSON.stringify(next));
  }

  private read(): CourseState {
    try { return JSON.parse(localStorage.getItem(this.key()) || '') as CourseState; }
    catch { return { role: null, enrolled: [] }; }
  }

  private key(): string { return `fhi.course-state.${this.auth.learner()?.id || 'anonymous'}`; }
}
