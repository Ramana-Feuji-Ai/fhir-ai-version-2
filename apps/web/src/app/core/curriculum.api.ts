import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  CurriculumSummary,
  PhaseCard,
  PhaseDetail,
  PhaseProgress,
  TopicDetail,
  TrackSummary,
  CourseProgressSummary,
  CourseDetail,
  Enrollment,
} from './models';

@Injectable({ providedIn: 'root' })
export class CurriculumApi {
  private readonly http = inject(HttpClient);
  private readonly base = '/api/v1';

  summary(): Observable<CurriculumSummary> {
    return this.http.get<CurriculumSummary>(`${this.base}/curriculum/summary`);
  }

  tracks(): Observable<TrackSummary[]> {
    return this.http.get<TrackSummary[]>(`${this.base}/tracks`);
  }

  courses(q?: string, level?: string): Observable<CourseProgressSummary[]> {
    let params = new HttpParams();
    if (q) params = params.set('q', q);
    if (level) params = params.set('level', level);
    return this.http.get<CourseProgressSummary[]>(`${this.base}/courses`, { params });
  }

  course(slug: string): Observable<CourseDetail> {
    return this.http.get<CourseDetail>(`${this.base}/courses/${slug}`);
  }

  enrollCourse(slug: string): Observable<Enrollment> {
    return this.http.post<Enrollment>(`${this.base}/courses/${slug}/enroll`, {});
  }

  myEnrollments(): Observable<Enrollment[]> {
    return this.http.get<Enrollment[]>(`${this.base}/courses/me/enrollments`);
  }

  issueCertificate(slug: string): Observable<Enrollment> {
    return this.http.post<Enrollment>(`${this.base}/courses/${slug}/certificate`, {});
  }

  phases(track?: string, q?: string): Observable<PhaseCard[]> {
    let params = new HttpParams();
    if (track) params = params.set('track', track);
    if (q) params = params.set('q', q);
    return this.http.get<PhaseCard[]>(`${this.base}/phases`, { params });
  }

  phase(id: number): Observable<PhaseDetail> {
    return this.http.get<PhaseDetail>(`${this.base}/phases/${id}`);
  }

  topic(id: number): Observable<TopicDetail> {
    return this.http.get<TopicDetail>(`${this.base}/topics/${id}`);
  }

  phaseProgress(phaseId: number): Observable<PhaseProgress> {
    return this.http.get<PhaseProgress>(`${this.base}/me/progress/phases/${phaseId}`);
  }

  setTopicProgress(topicId: number, completed: boolean): Observable<PhaseProgress> {
    return this.http.put<PhaseProgress>(`${this.base}/me/progress/topics/${topicId}`, {
      completed,
    });
  }
}
