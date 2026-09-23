import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CourseDefinition, PhaseCard } from '../../core/models';
import { CurriculumApi } from '../../core/curriculum.api';
import { ROLE_COURSES, courseBySlug } from '../../core/course.catalog';
import { CourseStateService } from '../../core/course-state.service';

@Component({
  selector: 'fhi-course-page',
  standalone: true,
  imports: [RouterLink],
  template: `
    @if (course(); as selectedCourse) {
      <section class="courseHero" [style.--course-accent]="selectedCourse.accent">
        <div class="heroOrb orb1" aria-hidden="true"></div>
        <div class="heroOrb orb2" aria-hidden="true"></div>
        <svg class="heroMesh" aria-hidden="true" viewBox="0 0 600 600" fill="none">
          <circle cx="300" cy="300" r="180" stroke="rgba(255,255,255,.1)" stroke-width="1" />
          <circle cx="300" cy="300" r="260" stroke="rgba(255,255,255,.07)" stroke-width="1" />
        </svg>

        <div class="wrap heroGrid">
          <div class="heroCopy">
            <a class="backLink" routerLink="/">← Browse all courses</a>
            <p class="eyebrow">{{ selectedCourse.role }}</p>
            <h1>{{ selectedCourse.title }}</h1>
            <p class="heroDescription">{{ selectedCourse.description }}</p>
            <div class="heroMeta">
              <span class="metaPill">{{ selectedCourse.level }}</span>
              <span class="metaPill">{{ selectedCourse.duration }}</span>
              <span class="metaPill">{{ selectedCourse.studyHours }} study hours</span>
              <button type="button" class="metaPill metaPillAction" (click)="scrollToModules()">{{ selectedCourse.phaseIds.length }} modules ↓</button>
            </div>
          </div>
          <aside class="enrollPanel">
            <div class="previewLabel">Role pathway</div>
            @if (!enrolled()) {
              <strong>Start this course</strong>
              <p>Save this pathway to My Learning and keep your place.</p>
              <button class="startButton enrollButton" type="button" [disabled]="enrollPending()" (click)="enroll(selectedCourse.slug)">
                <span>{{ enrollPending() ? 'Enrolling…' : 'Enroll in course' }}</span>
                @if (enrollPending()) { <span class="btnSpinner" aria-hidden="true"></span> } @else { <span aria-hidden="true" class="btnArrow">→</span> }
              </button>
              @if (enrollError()) { <p class="enrollError" role="alert">{{ enrollError() }}</p> }
            } @else {
              <div class="progressRing" [style.--pct]="displayPercent()">
                <svg viewBox="0 0 120 120" aria-hidden="true">
                  <circle class="ringTrack" cx="60" cy="60" r="52" />
                  <circle class="ringFill" cx="60" cy="60" r="52" />
                </svg>
                <div class="ringLabel"><strong>{{ displayPercent() }}%</strong><span>complete</span></div>
              </div>
              <p>{{ completedModules() }} of {{ selectedCourse.phaseIds.length }} modules completed</p>
              <div class="moduleDots" role="list" aria-label="Module progress">
                @for (ph of phases(); track ph.id) {
                  <button
                    type="button"
                    class="dot"
                    role="listitem"
                    [class.done]="ph.completed"
                    [class.current]="!ph.completed && nextPhase()?.id === ph.id"
                    [title]="ph.title"
                    [attr.aria-label]="ph.title + (ph.completed ? ' — completed' : '')"
                    (click)="scrollToModule(ph.id)"
                  ></button>
                }
              </div>
              @if (completionPercent() === 100) {
                <div class="certificateNotice"><div><strong>Course complete 🎉</strong><span>Your certificate is ready to print.</span></div><button type="button" (click)="printCertificate(selectedCourse.slug)">Print certificate</button></div>
              } @else if (nextPhase(); as next) {
                <p class="nextUp"><span>Next up</span>{{ next.title }}</p>
                <a class="startButton" [routerLink]="['/phase', next.id]" [queryParams]="{ course: selectedCourse.slug }"><span>{{ completedModules() ? 'Continue course' : 'Start course' }}</span> <span aria-hidden="true" class="btnArrow">→</span></a>
              }
            }
          </aside>
        </div>
      </section>

      <main class="courseMain wrap">
        <section class="outcomesSection">
          <div>
            <p class="eyebrow">Course outcomes</p>
            <h2>What you will learn</h2>
          </div>
          <ul>
            @for (outcome of selectedCourse.outcomes; track outcome; let i = $index) {
              <li [style.--i]="i"><span aria-hidden="true">✓</span>{{ outcome }}</li>
            }
          </ul>
        </section>

        <section class="courseFacts">
          <div class="factCard"><span>Prerequisites</span><strong>{{ selectedCourse.prerequisites }}</strong></div>
          <div class="factCard"><span>Practical outcome</span><strong>{{ selectedCourse.practicalOutcome }}</strong></div>
        </section>

        <section class="modulesSection" id="modulesSection">
          <div class="sectionHeading">
            <div>
              <p class="eyebrow">Curriculum</p>
              <h2>Course modules</h2>
            </div>
            <span>{{ phases().length }} phases · {{ topicTotal() }} topics</span>
          </div>
          <div class="moduleList">
            @for (phase of phases(); track phase.id; let index = $index) {
              <article class="moduleRow" [id]="'module-' + phase.id" [class.complete]="phase.completed" [style.--i]="index">
                <div class="moduleNumber">{{ (index + 1).toString().padStart(2, '0') }}</div>
                <div class="moduleCopy">
                  <p>Module {{ index + 1 }}</p>
                  <h3>{{ phase.title }}</h3>
                  <span>{{ phase.topicCount }} topics · {{ phase.duration }}</span>
                </div>
                <div class="moduleProgress">
                  <span>{{ phase.percentComplete }}%</span>
                  <div class="progressBar"><i [style.width.%]="phase.percentComplete"></i></div>
                </div>
                <a class="moduleLink" [routerLink]="['/phase', phase.id]" [queryParams]="{ course: selectedCourse.slug }" [attr.aria-label]="'Open ' + phase.title">{{ phase.completed ? 'Review' : 'Open' }} <span aria-hidden="true">→</span></a>
                @if (phase.topicTitles?.length) {
                  <details class="topicList">
                    <summary>View topics</summary>
                    <ul>
                      @for (title of phase.topicTitles; track title) { <li>{{ title }}</li> }
                    </ul>
                  </details>
                }
              </article>
            }
            @if (modulesLoaded() && !phases().length) {
              <p class="moduleError" role="alert">This course has no modules available. Please refresh after the curriculum API is running.</p>
            }
          </div>
        </section>
      </main>
    } @else {
      <div class="wrap emptyState"><h1>Course not found</h1><a routerLink="/">Return to course catalog</a></div>
    }
  `,
  styles: `
    .courseHero {
      position: relative;
      overflow: hidden;
      padding: 64px 0 72px;
      color: #fff;
      background: linear-gradient(125deg, #0B1C2C 0%, #153A55 58%, var(--course-accent) 150%);
    }
    .heroOrb { position: absolute; border-radius: 50%; filter: blur(2px); opacity: .5; pointer-events: none; animation: orbFloat 16s ease-in-out infinite; }
    .orb1 { top: -80px; right: 12%; width: 260px; height: 260px; background: radial-gradient(circle, rgba(255,255,255,.28) 0%, transparent 70%); }
    .orb2 { bottom: -60px; left: 4%; width: 200px; height: 200px; background: radial-gradient(circle, rgba(224,160,106,.4) 0%, transparent 70%); animation-duration: 20s; animation-delay: -6s; }
    @keyframes orbFloat { 0%, 100% { transform: translate(0,0) scale(1); } 50% { transform: translate(20px,-22px) scale(1.08); } }
    .heroMesh { position: absolute; top: 50%; right: -120px; width: 520px; height: 520px; transform: translateY(-50%); opacity: .6; pointer-events: none; animation: meshSpin 70s linear infinite; }
    @keyframes meshSpin { from { transform: translateY(-50%) rotate(0deg); } to { transform: translateY(-50%) rotate(360deg); } }

    .heroGrid { position: relative; z-index: 1; display: grid; grid-template-columns: minmax(0, 1.4fr) minmax(280px, .6fr); gap: 56px; align-items: center; }
    .heroCopy > * { animation: heroFadeUp .6s cubic-bezier(.2,.7,.3,1) both; }
    .backLink { animation-delay: .02s; }
    .courseHero .eyebrow { animation-delay: .08s; }
    h1 { animation-delay: .14s; }
    .heroDescription { animation-delay: .2s; }
    .heroMeta { animation-delay: .26s; }
    @keyframes heroFadeUp { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }

    .backLink { display: inline-block; color: rgba(255,255,255,.74); font-size: 13px; text-decoration: none; transition: color .15s ease, transform .15s ease; }
    .backLink:hover { color: #fff; transform: translateX(-2px); }
    .eyebrow { margin: 0 0 10px; color: var(--o7); font-size: 11px; font-weight: 750; letter-spacing: .1em; text-transform: uppercase; }
    .courseHero .eyebrow { margin-top: 42px; font-size: 14px; color: #E0A06A; }
    h1 { max-width: 720px; margin: 0 0 16px; color: #fff; font-family: var(--display); font-size: clamp(34px, 5vw, 58px); line-height: 1.05; }
    .heroDescription { max-width: 650px; margin: 0; color: rgba(255,255,255,.82); font-size: 18px; line-height: 1.6; }
    .heroMeta { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 28px; }
    .metaPill {
      display: inline-flex; align-items: center; padding: 8px 14px; border-radius: 999px;
      background: rgba(255,255,255,.08); border: 1px solid rgba(255,255,255,.18);
      color: rgba(255,255,255,.88); font-size: 12.5px; font-weight: 650; backdrop-filter: blur(8px);
      transition: transform .18s ease, background .18s ease, border-color .18s ease;
    }
    .metaPill:hover { transform: translateY(-2px); background: rgba(255,255,255,.15); border-color: rgba(224,160,106,.5); }
    .metaPillAction { appearance: none; font: inherit; cursor: pointer; }
    .metaPillAction:hover { background: rgba(224,160,106,.28); border-color: rgba(224,160,106,.7); }

    .moduleDots { display: flex; flex-wrap: wrap; gap: 7px; margin: 2px 0 18px; }
    .dot {
      width: 13px; height: 13px; padding: 0; border-radius: 50%; background: #fff;
      border: 2px solid #D7E2EC; cursor: pointer;
      transition: transform .15s ease, background .15s ease, border-color .15s ease, box-shadow .15s ease;
    }
    .dot:hover { transform: scale(1.3); border-color: var(--gr6); }
    .dot.done { background: var(--gr6); border-color: var(--gr6); }
    .dot.current { border-color: var(--o7); box-shadow: 0 0 0 3px rgba(224,160,106,.28); animation: dotPulse 1.7s ease-in-out infinite; }
    @keyframes dotPulse {
      0%, 100% { box-shadow: 0 0 0 3px rgba(224,160,106,.28); }
      50% { box-shadow: 0 0 0 6px rgba(224,160,106,.12); }
    }
    .nextUp {
      display: flex; flex-direction: column; gap: 2px; margin: 0 0 14px !important; padding: 10px 12px;
      background: #F7FAFC; border: 1px solid #E6EDF3; border-radius: 8px;
      font-size: 12.5px !important; color: var(--n8) !important; line-height: 1.4;
    }
    .nextUp span { color: var(--o7); font-size: 10px; font-weight: 750; text-transform: uppercase; letter-spacing: .06em; }

    .enrollPanel {
      position: relative; z-index: 1; padding: 26px; color: var(--n9);
      background: rgba(255,255,255,.94); border: 1px solid rgba(255,255,255,.6); border-radius: 16px;
      box-shadow: 0 24px 54px rgba(0,0,0,.28); backdrop-filter: blur(10px);
      animation: panelRise .65s cubic-bezier(.2,.7,.3,1) .1s both;
      transition: transform .25s ease, box-shadow .25s ease;
    }
    .enrollPanel:hover { transform: translateY(-3px); box-shadow: 0 30px 64px rgba(0,0,0,.32); }
    @keyframes panelRise { from { opacity: 0; transform: translateY(24px) scale(.96); } to { opacity: 1; transform: translateY(0) scale(1); } }
    .previewLabel { color: var(--o7); font-size: 11px; font-weight: 750; letter-spacing: .1em; text-transform: uppercase; }
    .enrollPanel strong { display: block; margin: 12px 0 8px; color: var(--gr6); font-family: var(--display); font-size: 29px; }
    .enrollPanel p { margin: 10px 0 20px; color: var(--n5); font-size: 12px; }
    .progressBar { height: 6px; overflow: hidden; background: var(--n1); border-radius: 99px; }
    .progressBar i { display: block; height: 100%; background: var(--gr6); border-radius: inherit; transition: width .8s cubic-bezier(.2,.7,.3,1); }

    .progressRing { position: relative; display: grid; place-items: center; width: 120px; height: 120px; margin: 8px auto 4px; }
    .progressRing svg { width: 100%; height: 100%; transform: rotate(-90deg); }
    .ringTrack { fill: none; stroke: var(--n1); stroke-width: 10; }
    .ringFill {
      fill: none; stroke: var(--gr6); stroke-width: 10; stroke-linecap: round;
      stroke-dasharray: 326.7; stroke-dashoffset: calc(326.7 - (326.7 * var(--pct)) / 100);
      transition: stroke-dashoffset 1s cubic-bezier(.2,.7,.3,1);
      animation: ringPulse 2.4s ease-in-out infinite;
    }
    @keyframes ringPulse { 0%, 100% { filter: drop-shadow(0 0 0 rgba(26,122,82,0)); } 50% { filter: drop-shadow(0 0 6px rgba(26,122,82,.45)); } }
    .ringLabel { position: absolute; display: grid; place-items: center; text-align: center; }
    .ringLabel strong { margin: 0 !important; color: var(--gr6); font-family: var(--display); font-size: 26px; line-height: 1; }
    .ringLabel span { color: var(--n5); font-size: 10.5px; text-transform: uppercase; letter-spacing: .06em; }

    .startButton {
      display: flex; align-items: center; justify-content: space-between; min-height: 46px; padding: 0 16px;
      color: #fff; background: var(--n8); border-radius: 10px; font-size: 14px; font-weight: 700; text-decoration: none;
      transition: background .2s ease, transform .15s ease, box-shadow .2s ease;
    }
    .startButton:hover { background: var(--n9); transform: translateY(-2px); box-shadow: 0 10px 22px rgba(11,28,44,.22); }
    .startButton:active { transform: translateY(0); }
    .btnArrow { display: inline-block; transition: transform .2s ease; }
    .startButton:hover .btnArrow { transform: translateX(3px); }
    .enrollButton { width:100%; border:0; cursor:pointer; font:inherit; }
    .enrollButton:disabled { cursor:wait; opacity:.7; transform:none; }
    .btnSpinner { width: 15px; height: 15px; border-radius: 50%; border: 2px solid rgba(255,255,255,.35); border-top-color: #fff; animation: spin .7s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .enrollError { margin:12px 0 0 !important; color:#A33A32 !important; font-size:12px !important; }

    .courseMain { padding-top: 58px; padding-bottom: 80px; }
    .outcomesSection { display: grid; grid-template-columns: .75fr 1.25fr; gap: 48px; padding-bottom: 48px; border-bottom: 1px solid #D7E2EC; }
    h2 { margin: 0; color: var(--n9); font-family: var(--display); font-size: 30px; }
    .outcomesSection ul { display: grid; grid-template-columns: 1fr 1fr; gap: 16px 24px; margin: 0; padding: 0; list-style: none; }
    .outcomesSection li {
      display: flex; gap: 10px; align-items: flex-start; padding: 14px 16px; color: var(--n7); font-size: 14px; line-height: 1.5;
      background: #F7FAFC; border: 1px solid #E6EDF3; border-radius: 10px;
      animation: itemFadeIn .5s cubic-bezier(.2,.7,.3,1) both;
      animation-delay: calc(var(--i, 0) * 70ms);
      transition: transform .18s ease, box-shadow .18s ease, border-color .18s ease;
    }
    .outcomesSection li:hover { transform: translateY(-2px); box-shadow: 0 10px 22px rgba(11,28,44,.08); border-color: #CBD9E5; }
    @keyframes itemFadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
    .outcomesSection li span { display: inline-flex; align-items: center; justify-content: center; width: 22px; height: 22px; flex: 0 0 22px; margin-top: 1px; color: #fff; font-weight: 800; font-size: 11px; background: var(--gr6); border-radius: 50%; }

    .modulesSection { padding-top: 52px; }
    .courseFacts { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; padding: 28px 0; border-bottom: 1px solid #D7E2EC; }
    .factCard {
      display: grid; gap: 7px; padding: 18px 20px; background: #fff; border: 1px solid #E6EDF3; border-left: 3px solid var(--o7);
      border-radius: 10px; transition: transform .18s ease, box-shadow .18s ease;
    }
    .factCard:hover { transform: translateY(-2px); box-shadow: 0 12px 26px rgba(11,28,44,.08); }
    .courseFacts span { color: var(--o7); font-size: 11px; font-weight: 750; letter-spacing: .08em; text-transform: uppercase; }
    .courseFacts strong { color: var(--n7); font-size: 14px; font-weight: 600; line-height: 1.5; }

    .sectionHeading { display: flex; align-items: end; justify-content: space-between; gap: 20px; margin-bottom: 22px; }
    .sectionHeading > span { color: var(--n5); font-size: 13px; }
    .moduleList { display: grid; gap: 14px; }
    .moduleRow {
      position: relative;
      display: grid; grid-template-columns: 48px minmax(0, 1fr) 145px 90px; gap: 20px; align-items: center; padding: 20px;
      background: #fff; border: 1px solid #E6EDF3; border-left: 3px solid #D7E2EC; border-radius: 12px;
      box-shadow: 0 6px 18px rgba(11,28,44,.04);
      animation: rowSlideIn .5s cubic-bezier(.2,.7,.3,1) both;
      animation-delay: calc(var(--i, 0) * 60ms);
      transition: transform .2s ease, box-shadow .2s ease, border-color .2s ease;
    }
    @keyframes rowSlideIn { from { opacity: 0; transform: translateX(-14px); } to { opacity: 1; transform: translateX(0); } }
    .moduleRow:hover { transform: translateY(-2px); box-shadow: 0 16px 32px rgba(11,28,44,.1); border-left-color: var(--o7); }
    .moduleRow.complete { border-left-color: var(--gr6); }
    .moduleNumber {
      display: grid; place-items: center; width: 44px; height: 44px; color: var(--o7); font-family: var(--display); font-size: 17px; font-weight: 750;
      background: linear-gradient(150deg, #FBEEE3, #F7FAFC); border-radius: 10px;
    }
    .moduleRow.complete .moduleNumber { color: var(--gr6); background: linear-gradient(150deg, #E6F5EC, #F7FAFC); }
    .moduleCopy p { margin: 0 0 4px; color: var(--n5); font-size: 11px; text-transform: uppercase; letter-spacing: .06em; }
    .moduleCopy h3 { margin: 0 0 5px; color: var(--n9); font-family: var(--display); font-size: 17px; }
    .moduleCopy span { color: var(--n5); font-size: 12px; }
    .moduleProgress span { display: block; margin-bottom: 6px; color: var(--gr6); font-weight: 650; font-size: 11px; text-align: right; }
    .moduleLink {
      display: inline-flex; align-items: center; justify-content: flex-end; gap: 4px; color: var(--n8); font-size: 13px; font-weight: 700;
      text-align: right; text-decoration: none; transition: color .15s ease, gap .15s ease;
    }
    .moduleLink:hover, .complete .moduleLink { color: var(--gr6); }
    .moduleLink:hover { gap: 8px; }
    .topicList { grid-column: 2 / -1; margin-top: 2px; color: var(--n5); font-size: 12px; }
    .topicList summary { cursor: pointer; color: var(--b6); font-weight: 650; list-style: none; }
    .topicList summary::-webkit-details-marker { display: none; }
    .topicList summary::before { content: '▸'; display: inline-block; margin-right: 6px; transition: transform .2s ease; }
    .topicList[open] summary::before { transform: rotate(90deg); }
    .topicList ul { display: grid; grid-template-columns: 1fr 1fr; gap: 7px 24px; margin: 12px 0 0; padding-left: 18px; animation: itemFadeIn .3s ease both; }
    .topicList li { line-height: 1.4; }
    .moduleError { padding: 24px 0; color: #A33A32; font-size: 13px; }
    .certificateNotice {
      display: flex; align-items: center; justify-content: space-between; gap: 18px; margin-top: 18px; padding: 14px 16px;
      color: #24563F; background: #EAF7EF; border: 1px solid #BFE5CD; border-radius: 10px; font-size: 13px;
      animation: celebrate .5s cubic-bezier(.3,1.4,.5,1) both;
    }
    @keyframes celebrate { from { opacity: 0; transform: scale(.9); } to { opacity: 1; transform: scale(1); } }
    .certificateNotice strong { display: block; margin-bottom: 3px; }
    .certificateNotice button {
      border: 1px solid #8FC9A5; border-radius: 7px; padding: 8px 12px; color: #24563F; background: #fff;
      font: inherit; font-size: 12px; font-weight: 700; cursor: pointer; transition: transform .15s ease, background .15s ease;
    }
    .certificateNotice button:hover { transform: translateY(-1px); background: #F4FBF6; }
    .emptyState { padding-top: 80px; padding-bottom: 120px; }
    .emptyState a { color: var(--b6); }
    @media (prefers-reduced-motion: reduce) {
      .heroOrb, .heroMesh, .heroCopy > *, .enrollPanel, .ringFill, .outcomesSection li, .moduleRow, .certificateNotice { animation: none; }
    }
    @media (max-width: 760px) { .heroGrid, .outcomesSection, .courseFacts { grid-template-columns: 1fr; gap: 30px; } .courseHero .eyebrow { margin-top: 30px; } .outcomesSection ul { grid-template-columns: 1fr; } .moduleRow { grid-template-columns: 36px minmax(0, 1fr) 72px; gap: 12px; } .moduleProgress { display: none; } .moduleLink { font-size: 12px; } }
  `,
})
export class CoursePage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly api = inject(CurriculumApi);
  private readonly courseState = inject(CourseStateService);
  readonly course = signal<CourseDefinition | undefined>(undefined);
  readonly phases = signal<PhaseCard[]>([]);
  readonly modulesLoaded = signal(false);
  readonly enrollPending = signal(false);
  readonly enrollError = signal<string | null>(null);
  readonly displayPercent = signal(0);
  enrolled(): boolean { return this.courseState.isEnrolled(this.course()?.slug || ''); }
  enroll(slug: string): void {
    if (this.enrollPending()) return;
    this.enrollPending.set(true);
    this.enrollError.set(null);
    this.api.enrollCourse(slug).subscribe({
      next: () => {
        this.courseState.enroll(slug);
        this.enrollPending.set(false);
      },
      error: (error) => {
        this.enrollPending.set(false);
        this.enrollError.set(error?.error?.message || error?.message || 'Enrollment failed. Please try again.');
      },
    });
  }

  ngOnInit(): void {
    const slug = this.route.snapshot.paramMap.get('slug') ?? '';
    const selected = courseBySlug(slug);
    this.course.set(selected);
    // Server is the source of truth for enrollment -- sync it in so a fresh session
    // (new browser, cleared storage) never shows "Enroll" again for an already-enrolled course.
    this.api.myEnrollments().subscribe({
      next: (enrollments) => enrollments.forEach((enrollment) => this.courseState.enroll(enrollment.slug)),
    });
    if (!selected) return;
    this.api.course(selected.slug).subscribe({
      next: (detail) => {
        this.course.set(detail.course);
        this.phases.set(detail.modules.map((module) => ({
          id: module.phaseId,
          track: '',
          title: module.title,
          description: module.description,
          duration: module.duration,
          topicCount: module.topicCount,
          sectionCount: 0,
          topicDone: module.topicDone,
          percentComplete: module.percentComplete,
          completed: module.completed,
          topicTitles: module.topicTitles,
        })));
        this.modulesLoaded.set(true);
        this.animatePercent(this.completionPercent());
      },
      error: () => this.modulesLoaded.set(true),
    });
  }

  completedModules(): number { return this.phases().filter((phase) => phase.completed).length; }
  completionPercent(): number { return this.phases().length ? Math.round((this.completedModules() / this.phases().length) * 100) : 0; }
  topicTotal(): number { return this.phases().reduce((total, phase) => total + phase.topicCount, 0); }
  nextPhase(): PhaseCard | undefined { return this.phases().find((phase) => !phase.completed) ?? this.phases()[0]; }
  printCertificate(slug: string): void { this.api.issueCertificate(slug).subscribe({ next: () => window.print() }); }

  scrollToModules(): void {
    document.getElementById('modulesSection')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  scrollToModule(phaseId: number): void {
    document.getElementById('module-' + phaseId)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  /** Eases the progress ring from its current value up to `target` instead of snapping. */
  private animatePercent(target: number): void {
    const start = this.displayPercent();
    const startTime = performance.now();
    const duration = 700;
    const tick = (now: number) => {
      const t = Math.min(1, (now - startTime) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      this.displayPercent.set(Math.round(start + (target - start) * eased));
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }
}

export const courseSlugs = ROLE_COURSES.map((course) => course.slug);
