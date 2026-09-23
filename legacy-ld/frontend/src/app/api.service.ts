import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, of, shareReplay, throwError } from 'rxjs';
import { ProgressRow, TopicDetail, TopicSummary } from './models';

const LEARNER_KEY = 'fhirld-learner';
const LOCAL_PROGRESS = 'fhirld-progress';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);
  private catalog$ = this.http.get<{ topics: any[] }>('/catalog.json').pipe(shareReplay(1));
  apiOnline = false;

  learnerKey(): string {
    let key = localStorage.getItem(LEARNER_KEY);
    if (!key) {
      key = crypto.randomUUID();
      localStorage.setItem(LEARNER_KEY, key);
    }
    return key;
  }

  topics(): Observable<TopicSummary[]> {
    return this.http.get<TopicSummary[]>('/api/topics').pipe(
      map((rows) => {
        this.apiOnline = true;
        return rows;
      }),
      catchError(() => {
        this.apiOnline = false;
        return this.catalog$.pipe(map((c) => c.topics.map((t) => this.toSummary(t))));
      })
    );
  }

  topic(slug: string): Observable<TopicDetail> {
    return this.http.get<TopicDetail>(`/api/topics/${slug}`).pipe(
      map((t) => {
        this.apiOnline = true;
        return this.withAbsoluteAudio(t);
      }),
      catchError(() => {
        this.apiOnline = false;
        return this.catalog$.pipe(
          map((c) => {
            const raw = c.topics.find((t) => t.slug === slug);
            if (!raw) {
              throw new Error('missing topic');
            }
            return this.fromCatalog(raw);
          }),
          catchError((err) => throwError(() => err))
        );
      })
    );
  }

  checkQuiz(id: number, selectedIndex: number, slug?: string, quizIndex?: number) {
    return this.http
      .post<{ correct: boolean; explanation: string; answerIndex: number }>(`/api/quiz/${id}/check`, {
        selectedIndex
      })
      .pipe(
        catchError(() =>
          this.catalog$.pipe(
            map((c) => {
              const topic = c.topics.find((t) => t.slug === slug);
              const item = topic?.quiz?.[quizIndex ?? 0];
              const answer = item?.answer ?? 0;
              return {
                correct: selectedIndex === answer,
                explanation: item?.explanation || '',
                answerIndex: answer
              };
            })
          )
        )
      );
  }

  progress() {
    return this.http.get<ProgressRow[]>(`/api/progress/${this.learnerKey()}`).pipe(
      catchError(() => of(this.localProgress()))
    );
  }

  saveProgress(topicSlug: string, completed: boolean, quizScore: number) {
    return this.http
      .post('/api/progress', {
        learnerKey: this.learnerKey(),
        topicSlug,
        completed,
        quizScore
      })
      .pipe(
        catchError(() => {
          const rows = this.localProgress().filter((r) => r.topicSlug !== topicSlug);
          rows.push({ topicSlug, completed, quizScore });
          localStorage.setItem(LOCAL_PROGRESS, JSON.stringify(rows));
          return of({ local: true });
        })
      );
  }

  fhirGet(path: string) {
    return this.http.get(path, { responseType: 'text' });
  }

  fhirPost(path: string, body: unknown) {
    return this.http.post(path, body, { responseType: 'text' });
  }

  private localProgress(): ProgressRow[] {
    try {
      return JSON.parse(localStorage.getItem(LOCAL_PROGRESS) || '[]');
    } catch {
      return [];
    }
  }

  private toSummary(t: any): TopicSummary {
    return {
      slug: t.slug,
      title: t.title,
      kicker: t.kicker,
      durationHint: t.durationHint,
      phase: t.phase,
      summary: t.summary,
      interactiveType: t.interactiveType
    };
  }

  private fromCatalog(t: any): TopicDetail {
    return this.withAbsoluteAudio({
      slug: t.slug,
      title: t.title,
      kicker: t.kicker,
      durationHint: t.durationHint,
      phase: t.phase,
      summary: t.summary,
      references: t.references || [],
      interactiveType: t.interactiveType,
      interactive: t.interactive,
      sections: t.sections || [],
      conversation: (t.conversation || []).map((line: any) => ({
        speaker: line.speaker,
        speakerName: line.speaker === 'maya' ? 'Dr. Maya Krishnan' : 'Alex Duarte',
        speakerRole: line.speaker === 'maya' ? 'Clinical informaticist' : 'FHIR implementer',
        text: line.text,
        audioPath: line.audioPath
      })),
      quiz: (t.quiz || []).map((q: any, i: number) => ({
        id: -(i + 1),
        prompt: q.prompt,
        options: q.options
      }))
    });
  }

  private withAbsoluteAudio(t: TopicDetail): TopicDetail {
    t.conversation = (t.conversation || []).map((line) => ({
      ...line,
      audioPath: this.abs(line.audioPath)
    }));
    return t;
  }

  private abs(path: string): string {
    if (!path) {
      return path;
    }
    if (path.startsWith('http') || path.startsWith('/')) {
      return path;
    }
    return '/' + path;
  }
}
