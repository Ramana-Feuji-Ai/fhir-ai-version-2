import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ROLE_COURSES } from '../../core/course.catalog';
import { CourseStateService } from '../../core/course-state.service';
import { CurriculumApi } from '../../core/curriculum.api';

@Component({
  selector: 'fhi-my-learning-page',
  standalone: true,
  imports: [RouterLink],
  template: `
    <main class="wrap learningPage">
      <p class="eyebrow">Your academy</p><h1>My Learning</h1>
      <p class="intro">Pick up a role pathway where you left off.</p>
      @if (courses().length) {
        <div class="learningGrid">
          @for (course of courses(); track course.slug) {
            <article><div class="swatch" [style.background]="course.accent"></div><div><p>{{ course.role }}</p><h2>{{ course.title }}</h2><span>{{ course.duration }} · {{ course.level }}</span></div><a [routerLink]="['/courses', course.slug]">Continue <span aria-hidden="true">→</span></a></article>
          }
        </div>
      } @else {
        <section class="empty"><h2>No courses enrolled yet</h2><p>Choose a role pathway from the course catalog to start learning.</p><a routerLink="/" fragment="courses">Browse courses</a></section>
      }
    </main>
  `,
  styles: `
    .learningPage { padding-top:64px; padding-bottom:100px; }
    .eyebrow { margin:0 0 8px; color:var(--o7); font-size:11px; font-weight:750; letter-spacing:.1em; text-transform:uppercase; }
    h1 { margin:0; color:var(--n9); font-family:var(--display); font-size:44px; } .intro { color:var(--n6); }
    .learningGrid { display:grid; gap:14px; margin-top:36px; max-width:820px; }
    article { display:grid; grid-template-columns:8px 1fr auto; gap:18px; align-items:center; padding:20px; border:1px solid #D7E2EC; border-radius:10px; background:#fff; }
    .swatch { width:8px; height:62px; border-radius:5px; } article p { margin:0 0 5px; color:var(--o7); font-size:11px; text-transform:uppercase; } h2 { margin:0 0 5px; color:var(--n9); font-family:var(--display); font-size:20px; } article span { color:var(--n5); font-size:12px; } article a, .empty a { color:var(--b6); font-weight:700; text-decoration:none; }
    .empty { margin-top:36px; padding:36px; border:1px solid #D7E2EC; border-radius:10px; } .empty h2 { margin-bottom:8px; } .empty p { color:var(--n6); }
  `,
})
export class MyLearningPage implements OnInit {
  private readonly state = inject(CourseStateService);
  private readonly api = inject(CurriculumApi);
  readonly courses = signal(ROLE_COURSES.filter((course) => this.state.isEnrolled(course.slug)));

  ngOnInit(): void {
    this.api.myEnrollments().subscribe({
      next: (enrollments) => this.courses.set(ROLE_COURSES.filter((course) => enrollments.some((enrollment) => enrollment.slug === course.slug))),
    });
  }
}