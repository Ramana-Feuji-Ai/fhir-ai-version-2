import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CurriculumApi } from '../../core/curriculum.api';
import { CurriculumSummary, CourseDefinition } from '../../core/models';
import { Hero3DComponent } from '../../shared/hero-3d.component';
import { CourseCardComponent } from '../../shared/course-card.component';
import { ROLE_COURSES } from '../../core/course.catalog';
import { CourseStateService } from '../../core/course-state.service';

/** Foundational courses show left, Advanced show right (per curriculum sequence). */
const LEVEL_ORDER: Record<string, number> = { Foundational: 0, Intermediate: 1, Advanced: 2 };

@Component({
  selector: 'fhi-home-page',
  standalone: true,
  imports: [FormsModule, RouterLink, Hero3DComponent, CourseCardComponent],
  template: `
    @if (summary(); as s) {
      <section class="courseCatalog" id="courses">
        <div class="wrap">
          <div class="catalogHead">
            <div>
              <p class="sectionEyebrow">Learn your way</p>
              <h2>Choose a course for your role</h2>
              <p class="muted">Focused FHIR pathways for developers, architects, QA engineers, project leaders, and healthcare professionals.</p>
            </div>
            <span class="muted">{{ filteredCourses().length }} courses</span>
          </div>

          <div class="rolePicker">
            <div>
              <p class="sectionEyebrow">Personalize your path</p>
              <label for="roleSelect"><b>What is your role?</b></label>
              <p class="muted">Pick a role to see a recommended course and browse the rest by category.</p>
            </div>
            <select id="roleSelect" [ngModel]="courseState.role() || ''" (ngModelChange)="setRole($event)" aria-label="Choose your role">
              <option value="">Choose a role</option>
              @for (course of roleCourses; track course.slug) { <option [value]="course.role">{{ course.role }}</option> }
            </select>
          </div>

          <div class="courseTools">
            <label class="courseSearch"><span aria-hidden="true">⌕</span><input type="search" placeholder="Search courses or roles" [(ngModel)]="courseQuery" aria-label="Search courses or roles" /></label>
            <select [(ngModel)]="courseLevel" aria-label="Filter courses by level">
              <option>All levels</option><option>Foundational</option><option>Intermediate</option><option>Advanced</option>
            </select>
          </div>

          @if (roleLevelMismatch(); as mismatch) {
            <div class="filterNotice" role="status">
              <span class="filterNoticeIcon" aria-hidden="true">ⓘ</span>
              <p>The <b>{{ courseState.role() }}</b> course is rated <b>{{ mismatch }}</b>, so it's hidden by your <b>{{ courseLevel }}</b> level filter.</p>
              <button type="button" (click)="clearLevelFilter()">Show all levels</button>
            </div>
          }

          <div class="courseRow">
            @if (recommendedCourses().length) {
              <div class="courseColumn">
                <h3 class="bucketTitle">Recommended for you</h3>
                <div class="courseGrid">
                  @for (course of recommendedCourses(); track course.slug) {
                    <fhi-course-card [course]="course" [progress]="courseProgress()[course.slug] || 0" />
                  }
                </div>
              </div>
              <div class="columnDivider" aria-hidden="true"></div>
            }

            @for (bucket of bucketedCourses(); track bucket.category) {
              <div class="courseColumn">
                <h3 class="bucketTitle">{{ bucket.category }}</h3>
                <div class="courseGrid">
                  @for (course of bucket.courses; track course.slug) {
                    <fhi-course-card [course]="course" [progress]="courseProgress()[course.slug] || 0" />
                  }
                </div>
              </div>
            }
          </div>

          @if (!filteredCourses().length) { <p class="muted">No courses match your search.</p> }
        </div>
      </section>

      <fhi-hero-3d />

      <section class="features" id="features">
        <div class="wrap">
          <div class="sectionHead">
            <div>
              <h2>Why choose FHIR Learning Academy?</h2>
              <p class="muted">Built for implementers, by implementers — every feature designed to accelerate your FHIR mastery.</p>
            </div>
          </div>
          <div class="featureStrip">
            <article class="featureTile">
              <div class="ftIcon" aria-hidden="true">▣</div>
              <h3>Video-Enhanced Lessons</h3>
              <p>Every topic includes expert-led video walkthroughs with inline timestamps, transcripts, and downloadable resources.</p>
            </article>
            <article class="featureTile">
              <div class="ftIcon" aria-hidden="true">⚡</div>
              <h3>Interactive Slide Decks</h3>
              <p>SCORM-style learning with progress tracking, fullscreen mode, key points rail, and exam tips — keyboard navigable.</p>
            </article>
            <article class="featureTile">
              <div class="ftIcon" aria-hidden="true">🧪</div>
              <h3>Hands-on Mock Assessments</h3>
              <p>Real FHIR server interactions: create, search, validate resources; practice with US Core, SMART, and bulk data.</p>
            </article>
            <article class="featureTile">
              <div class="ftIcon" aria-hidden="true">📊</div>
              <h3>Progress Analytics</h3>
              <p>Detailed dashboards with phase completion, topic mastery, time spent, and weak-area identification.</p>
            </article>
            <article class="featureTile">
              <div class="ftIcon" aria-hidden="true">🎯</div>
              <h3>Blueprint-Aligned</h3>
              <p>Content mapped to HL7 FHIR R4 certification blueprint — R4B/R5 readiness modules included.</p>
            </article>
            <article class="featureTile">
              <div class="ftIcon" aria-hidden="true">🔒</div>
              <h3>Secure & Private</h3>
              <p>No data leaves your environment. Self-hosted option with SSO integration for enterprise teams.</p>
            </article>
          </div>
        </div>
      </section>

      <section class="testimonials" id="testimonials">
        <div class="wrap">
          <div class="sectionHead">
            <h2>Trusted by Implementers Worldwide</h2>
            <p class="muted">Hear from developers, architects, and clinical informaticists who've accelerated their FHIR journey.</p>
          </div>
          <div class="testimonialGrid">
            @for (t of testimonials(); track t.id) {
              <article class="testimonialCard">
                <div class="stars" aria-label="{{ t.rating }} out of 5 stars">★★★★★</div>
                <p class="quote">"{{ t.quote }}"</p>
                <div class="author">
                  <div class="avatar" style="background: {{ t.avatarColor }}">{{ t.initials }}</div>
                  <div>
                    <b>{{ t.name }}</b>
                    <span>{{ t.role }}</span>
                  </div>
                </div>
              </article>
            }
          </div>
        </div>
      </section>

      <section class="ctaFinal" id="get-started">
        <div class="wrap">
          <div class="ctaCard">
            <div class="ctaContent">
              <h2>Ready to master FHIR?</h2>
              <p>Join 2,800+ implementers. Start Phase 1 free — no credit card required.</p>
              <div class="ctaActions">
                <a class="btn primary" routerLink="/phase/1">Start Learning Free</a>
                <a class="btn secondary" routerLink="/" fragment="courses">Browse Courses</a>
              </div>
              <p class="ctaNote">Includes: Video lessons · Interactive slides · Hands-on mock assessments · Progress tracking · Certificate of completion</p>
            </div>
          </div>
        </div>
      </section>

    } @else if (error()) {
      <div class="wrap" style="padding:48px 28px">
        <p>Could not load curriculum. Is the API running on port 18081?</p>
        <pre class="muted">{{ error() }}</pre>
      </div>
    } @else {
      <div class="wrap" style="padding:48px 28px"><p class="muted">Loading academy…</p></div>
    }
  `,
  styles: `
    .ctaRow {
      display: flex;
      flex-wrap: wrap;
      gap: 14px;
      margin-top: 28px;
      align-items: center;
    }
    .ctaRow .btn {
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }
    .overallProgress {
      justify-self: end;
      width: min(100%, 280px);
    }
    @media (max-width: 900px) {
      .overallProgress {
        justify-self: stretch;
        width: 100%;
      }
    }
    .features {
      padding: 80px 0;
      background: linear-gradient(180deg, #F7FAFC 0%, #FFFFFF 100%);
      border-bottom: 1px solid var(--g3);
    }
    .courseCatalog { padding: 76px 0 82px; background: #fff; border-bottom: 1px solid var(--g3); }
    .rolePicker { display:flex; align-items:center; justify-content:space-between; gap:24px; margin-bottom:20px; padding:22px 24px; border:1px solid #D7E2EC; border-radius:10px; background:#F7FAFC; }
    .rolePicker label { display:block; font-size:16px; font-weight:650; color:var(--n9); margin-bottom:4px; }
    .rolePicker p { margin:0; }
    .rolePicker select,
    .courseTools select {
      appearance: none;
      -webkit-appearance: none;
      -moz-appearance: none;
      min-width: 240px;
      min-height: 44px;
      padding: 0 38px 0 14px;
      border: 1px solid #CBD9E5;
      border-radius: 9px;
      background: #fff url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8' fill='none'%3E%3Cpath d='M1 1.5L6 6.5L11 1.5' stroke='%23516373' stroke-width='1.6' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E") no-repeat right 14px center;
      background-size: 11px;
      color: var(--n8);
      font: inherit;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      transition: border-color .18s ease, box-shadow .18s ease, background-color .18s ease;
    }
    .rolePicker select:hover,
    .courseTools select:hover { border-color: var(--o7); }
    .rolePicker select:focus,
    .courseTools select:focus {
      outline: none;
      border-color: var(--o7);
      box-shadow: 0 0 0 3px rgba(184,90,18,.14);
    }
    .rolePicker select:focus-visible,
    .courseTools select:focus-visible { box-shadow: 0 0 0 3px rgba(184,90,18,.14); }
    .filterNotice {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-top: 18px;
      padding: 13px 16px;
      background: #FBF3E9;
      border: 1px solid #F0D9BC;
      border-radius: 10px;
      color: var(--n7);
      font-size: 13px;
      animation: noticeSlideIn .35s cubic-bezier(.2,.7,.3,1) both;
    }
    @keyframes noticeSlideIn {
      from { opacity: 0; transform: translateY(-6px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .filterNoticeIcon {
      display: grid;
      place-items: center;
      width: 22px;
      height: 22px;
      flex: 0 0 22px;
      border-radius: 50%;
      background: #E0A06A;
      color: #fff;
      font-size: 13px;
      font-style: normal;
    }
    .filterNotice p { flex: 1; margin: 0; line-height: 1.5; }
    .filterNotice p b { color: var(--n9); }
    .filterNotice button {
      flex: 0 0 auto;
      border: 1px solid #DDAE79;
      border-radius: 7px;
      padding: 7px 13px;
      background: #fff;
      color: var(--o7);
      font: inherit;
      font-size: 12.5px;
      font-weight: 700;
      cursor: pointer;
      transition: transform .15s ease, background .15s ease;
    }
    .filterNotice button:hover { transform: translateY(-1px); background: #FFF6EC; }
    @media (prefers-reduced-motion: reduce) {
      .filterNotice { animation: none; }
    }
    .courseRow { display:flex; align-items:stretch; gap:36px; margin-top:30px; }
    .courseColumn { flex:1; min-width:0; display:flex; flex-direction:column; }
    .columnDivider { flex:0 0 1px; align-self:stretch; margin:0 8px; background:var(--g3); }
    .bucketTitle { margin:0 0 14px; font-family:var(--display); font-size:16px; color:var(--n8); }
    .courseGrid { display:grid; gap:16px; flex:1; }
    .courseGrid > * { animation: courseCardIn .5s cubic-bezier(.2,.7,.3,1) both; }
    .courseGrid > *:nth-child(1) { animation-delay: .04s; }
    .courseGrid > *:nth-child(2) { animation-delay: .1s; }
    .courseGrid > *:nth-child(3) { animation-delay: .16s; }
    .courseGrid > *:nth-child(4) { animation-delay: .22s; }
    @keyframes courseCardIn {
      from { opacity: 0; transform: translateY(18px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @media (prefers-reduced-motion: reduce) {
      .courseGrid > * { animation: none; }
    }
    .courseTools { display:flex; gap:12px; margin-top:24px; }
    .courseSearch {
      display:flex; align-items:center; flex:1; min-height:44px; padding:0 14px;
      border:1px solid #D7E2EC; border-radius:9px; background:#fff;
      transition: border-color .18s ease, box-shadow .18s ease;
    }
    .courseSearch:focus-within { border-color: var(--o7); box-shadow: 0 0 0 3px rgba(184,90,18,.14); }
    .courseSearch span { margin-right:8px; color:var(--n5); }
    .courseSearch input { width:100%; border:0; outline:0; background:transparent; font:inherit; font-size:13px; }
    .courseTools select { min-width:160px; }
    .sectionEyebrow {
      margin: 0 0 6px;
      font-size: 11px;
      font-weight: 650;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--o7);
    }
    .testimonials {
      padding: 80px 0;
      background: #FFFFFF;
    }
    .testimonialGrid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 20px;
      margin-top: 32px;
    }
    .testimonialCard {
      background: white;
      border: 1px solid #D7E2EC;
      border-radius: 16px;
      padding: 24px;
      transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
    }
    .testimonialCard:hover {
      transform: translateY(-4px);
      box-shadow: 0 12px 32px rgba(11, 28, 44, .08);
      border-color: #C5DBEF;
    }
    .stars {
      font-size: 16px;
      color: #E0A06A;
      letter-spacing: 2px;
      margin-bottom: 12px;
    }
    .quote {
      font-size: 14px;
      line-height: 1.7;
      color: var(--n8);
      margin: 0 0 20px;
      font-style: italic;
    }
    .author {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .author .avatar {
      width: 44px;
      height: 44px;
      border-radius: 50%;
      display: grid;
      place-items: center;
      color: white;
      font-weight: 700;
      font-size: 14px;
    }
    .author b {
      display: block;
      font-size: 14px;
      color: var(--n9);
    }
    .author span {
      display: block;
      font-size: 12px;
      color: var(--n5);
    }
    .ctaFinal {
      padding: 80px 0;
      background: linear-gradient(180deg, #0B1C2C, #14304A);
    }
    .ctaCard {
      background: linear-gradient(135deg, rgba(224,160,106,0.12), rgba(26,107,184,0.12));
      border: 1px solid rgba(224,160,106,0.3);
      border-radius: 20px;
      padding: 48px;
      text-align: center;
      max-width: 720px;
      margin: 0 auto;
    }
    .ctaContent h2 {
      font-family: var(--display);
      font-size: clamp(28px, 4vw, 38px);
      color: white;
      margin: 0 0 16px;
    }
    .ctaContent p {
      color: rgba(255,255,255,0.8);
      font-size: 16px;
      margin: 0 0 28px;
    }
    .ctaActions {
      display: flex;
      flex-wrap: wrap;
      gap: 16px;
      justify-content: center;
      margin-bottom: 20px;
    }
    .ctaNote {
      font-size: 13px;
      color: rgba(255,255,255,0.55);
      margin: 0;
    }
    @media (max-width: 1000px) {
      .courseRow { flex-wrap:wrap; }
      .courseColumn { flex:1 1 calc(50% - 12px); }
      .columnDivider { display:none; }
      .testimonialGrid {
        grid-template-columns: repeat(2, 1fr);
      }
    }
    @media (max-width: 767px) {
      .rolePicker { align-items:stretch; flex-direction:column; }
      .rolePicker select { min-width:0; }
      .courseTools { flex-direction:column; }
      .courseTools select { min-height:42px; }
      .courseColumn { flex:1 1 100%; }
      .testimonialGrid {
        grid-template-columns: 1fr;
      }
      .ctaCard {
        padding: 32px 20px;
      }
      .featureStrip {
        grid-template-columns: 1fr;
      }
    }
  `,
})
export class HomePage implements OnInit {
  private readonly api = inject(CurriculumApi);
  readonly courseState = inject(CourseStateService);
  readonly roleCourses = ROLE_COURSES;
  readonly courseProgress = signal<Record<string, number>>({});
  courseQuery = '';
  courseLevel = 'All levels';

  setRole(role: string): void { this.courseState.setRole(role); }

  /** All courses matching search/level, sorted Foundational -> Intermediate -> Advanced. */
  filteredCourses(): CourseDefinition[] {
    const query = this.courseQuery.trim().toLowerCase();
    return this.roleCourses
      .filter((course) =>
        (!query || `${course.title} ${course.role} ${course.category}`.toLowerCase().includes(query))
        && (this.courseLevel === 'All levels' || course.level === this.courseLevel)
      )
      .sort((a, b) => (LEVEL_ORDER[a.level] ?? 99) - (LEVEL_ORDER[b.level] ?? 99));
  }

  /** The course matching the learner's chosen role, if any. */
  recommendedCourses(): CourseDefinition[] {
    const role = this.courseState.role();
    if (!role) return [];
    return this.filteredCourses().filter((course) => course.role === role);
  }

  /** True (with the hidden course's level) when the chosen role's course exists but is hidden by the level filter — not just "no results". */
  roleLevelMismatch(): string | null {
    const role = this.courseState.role();
    if (!role || this.courseLevel === 'All levels' || this.recommendedCourses().length) return null;
    const ownCourse = this.roleCourses.find((course) => course.role === role);
    return ownCourse && (!this.courseQuery.trim() || `${ownCourse.title} ${ownCourse.role} ${ownCourse.category}`.toLowerCase().includes(this.courseQuery.trim().toLowerCase()))
      ? ownCourse.level
      : null;
  }

  clearLevelFilter(): void { this.courseLevel = 'All levels'; }

  /** Remaining courses, grouped by category, in the same Foundational -> Advanced order. */
  bucketedCourses(): { category: string; courses: CourseDefinition[] }[] {
    const role = this.courseState.role();
    const rest = this.filteredCourses().filter((course) => !role || course.role !== role);
    const groups = new Map<string, CourseDefinition[]>();
    for (const course of rest) {
      const list = groups.get(course.category);
      if (list) list.push(course);
      else groups.set(course.category, [course]);
    }
    return [...groups.entries()].map(([category, courses]) => ({ category, courses }));
  }

  readonly summary = signal<CurriculumSummary | null>(null);
  readonly error = signal<string | null>(null);

  readonly testimonials = signal<Testimonial[]>([
    {
      id: 1,
      name: 'Sarah Chen',
      role: 'Senior FHIR Architect, HealthTech Inc.',
      quote: 'The video lessons combined with hands-on mock assessments gave me confidence to pass the R4 certification on my first attempt. The exam tips alone are worth it.',
      rating: 5,
      initials: 'SC',
      avatarColor: '#B85A12',
    },
    {
      id: 2,
      name: 'Marcus Johnson',
      role: 'Clinical Informaticist, Regional Hospital',
      quote: 'Finally, a FHIR course that understands implementers. The SMART on FHIR and Bulk Data modules saved me weeks of trial-and-error.',
      rating: 5,
      initials: 'MJ',
      avatarColor: '#3B8FD4',
    },
    {
      id: 3,
      name: 'Priya Patel',
      role: 'Software Engineer, EHR Vendor',
      quote: 'The progress tracking kept me accountable. I completed all 17 phases in 8 weeks while working full-time. Highly recommend!',
      rating: 5,
      initials: 'PP',
      avatarColor: '#4CAF7A',
    },
  ]);

  ngOnInit(): void {
    this.api.summary().subscribe({
      next: (s) => {
        this.summary.set(s);
        this.loadCourseProgress();
      },
      error: (e) => this.error.set(String(e?.message ?? e)),
    });
  }

  /** Re-fetches per-course completion so cards reflect progress made elsewhere in the app. */
  private loadCourseProgress(): void {
    this.api.courses().subscribe({
      next: (courses) => {
        const progress: Record<string, number> = {};
        courses.forEach((course) => progress[course.slug] = course.percentComplete);
        this.courseProgress.set(progress);
      },
    });
  }
}

interface Testimonial {
  id: number;
  name: string;
  role: string;
  quote: string;
  rating: number;
  initials: string;
  avatarColor: string;
}
