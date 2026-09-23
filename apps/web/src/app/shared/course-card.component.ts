import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CourseDefinition } from '../core/models';

@Component({
  selector: 'fhi-course-card',
  standalone: true,
  imports: [RouterLink],
  template: `
    <article class="courseCard" [style.--course-accent]="course.accent">
      <div class="courseCardInner">
        <div class="courseFace courseFaceFront">
          <div class="courseBanner"><strong>FHIR</strong><span>{{ course.level }}</span></div>
          <div class="courseBody">
            <p class="courseRole">{{ course.role }}</p>
            <h3>{{ course.title }}</h3>
            <p>{{ course.description }}</p>
            <div class="courseMeta"><span>{{ course.duration }}</span><span>{{ course.studyHours }} hours</span></div>
            <div class="courseProgress"><div><span>{{ progress }}% complete</span><span>{{ progress ? 'Continue learning' : 'Not started' }}</span></div><i [style.width.%]="progress"></i></div>
          </div>
          <div class="courseFoot"><span>Included with Academy</span><a class="courseCta" [routerLink]="['/courses', course.slug]">View course</a></div>
        </div>

        <div class="courseFace courseFaceBack">
          <div class="courseBackGlow" aria-hidden="true"></div>
          <p class="courseRole light">{{ course.role }}</p>
          <h3>{{ course.title }}</h3>
          <p class="backOutcome">{{ course.practicalOutcome }}</p>
          <ul class="backOutcomes">
            @for (outcome of course.outcomes.slice(0, 4); track outcome) {
              <li><span aria-hidden="true">✓</span>{{ outcome }}</li>
            }
          </ul>
          <p class="backPrereq"><b>Prerequisites:</b> {{ course.prerequisites }}</p>
          <a class="courseCta backCta" [routerLink]="['/courses', course.slug]">View course</a>
        </div>
      </div>
    </article>
  `,
  styles: `
    .courseCard { perspective: 1600px; display:block; height:100%; }
    .courseCardInner {
      position: relative;
      display: flex;
      flex-direction: column;
      width: 100%;
      height: 100%;
      transition: transform .7s cubic-bezier(.4,.2,.2,1);
      transform-style: preserve-3d;
    }
    .courseCard:hover .courseCardInner,
    .courseCard:focus-within .courseCardInner { transform: rotateY(180deg); }

    .courseFace {
      display: flex;
      flex-direction: column;
      background: #fff;
      border: 1px solid #D7E2EC;
      border-radius: 12px;
      box-shadow: 0 10px 28px rgba(11,28,44,.06);
      backface-visibility: hidden;
      -webkit-backface-visibility: hidden;
    }
    /* Front face stays in normal flow so it — not a fixed box — sets the card's height; the back face overlays it absolutely. */
    .courseFaceFront { position: relative; flex: 1; min-height: 100%; transition: box-shadow .25s ease; }
    .courseCard:hover .courseFaceFront { box-shadow: 0 18px 40px rgba(11,28,44,.14); }

    .courseBanner { display:flex; justify-content:space-between; align-items:center; min-height:84px; padding:18px 20px; color:#fff; background:var(--course-accent); }
    .courseBanner strong { font-family:var(--display); font-size:24px; letter-spacing:.04em; }
    .courseBanner span { padding:6px 9px; border:1px solid rgba(255,255,255,.45); border-radius:999px; font-size:11px; }
    .courseBody { flex:1; padding:20px; }
    .courseRole { margin:0 0 7px; color:var(--o7); font-size:11px; font-weight:700; text-transform:uppercase; }
    h3 { margin:0 0 10px; color:var(--n9); font-family:var(--display); font-size:20px; }
    .courseBody p:not(.courseRole) { margin:0; color:var(--n6); font-size:13px; line-height:1.6; }
    .courseMeta { display:flex; gap:16px; margin-top:16px; color:var(--n5); font-size:12px; }
    .courseProgress { margin-top:16px; color:var(--n5); font-size:11px; }
    .courseProgress > div { display:flex; justify-content:space-between; gap:8px; margin-bottom:6px; }
    .courseProgress > div span:first-child { color:var(--gr6); font-weight:650; }
    .courseProgress > i { display:block; height:4px; width:0; background:var(--gr6); border-radius:99px; transition: width .5s ease; }
    .courseFoot { display:flex; justify-content:space-between; align-items:center; gap:12px; padding:14px 20px 18px; border-top:1px solid #E6EDF3; color:var(--n6); font-size:11px; }
    .courseCta { display:inline-flex; align-items:center; gap:6px; padding:9px 16px; border-radius:8px; background:var(--o7); color:#fff; font-size:13px; font-weight:700; text-decoration:none; white-space:nowrap; transition:background .15s ease, transform .15s ease; }
    .courseCta:hover { background:#9C4B0E; transform:translateY(-1px); }

    .courseFaceBack {
      position: absolute;
      inset: 0;
      transform: rotateY(180deg);
      padding: 22px;
      overflow-y: auto;
      color: #fff;
      background: linear-gradient(150deg, var(--course-accent) 0%, #10202F 115%);
      justify-content: flex-start;
    }
    .courseBackGlow {
      position: absolute;
      top: -40%;
      right: -30%;
      width: 70%;
      height: 70%;
      background: radial-gradient(circle, rgba(255,255,255,.22) 0%, transparent 70%);
      pointer-events: none;
    }
    .courseFaceBack .courseRole.light { color: rgba(255,255,255,.75); position: relative; }
    .courseFaceBack h3 { color: #fff; position: relative; }
    .backOutcome { margin: 0 0 14px; color: rgba(255,255,255,.85); font-size: 13px; line-height: 1.6; position: relative; }
    .backOutcomes { list-style: none; margin: 0 0 14px; padding: 0; display: grid; gap: 8px; flex: 1; position: relative; }
    .backOutcomes li { display: flex; align-items: flex-start; gap: 8px; font-size: 12.5px; line-height: 1.5; color: rgba(255,255,255,.92); }
    .backOutcomes li span { display:inline-flex; align-items:center; justify-content:center; width:16px; height:16px; flex:0 0 16px; margin-top:1px; border-radius:50%; background:rgba(255,255,255,.2); font-size:10px; }
    .backPrereq { margin: 0 0 16px; color: rgba(255,255,255,.65); font-size: 11.5px; line-height: 1.5; position: relative; }
    .backCta { align-self: flex-start; background: #fff; color: var(--n9); position: relative; }
    .backCta:hover { background: rgba(255,255,255,.85); color: var(--n9); }

    @media (prefers-reduced-motion: reduce) {
      .courseCardInner { transition: none; }
    }
  `,
})
export class CourseCardComponent {
  @Input({ required: true }) course!: CourseDefinition;
  @Input() progress = 0;
}
