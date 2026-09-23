import { Component, ElementRef, OnDestroy, ViewChild, inject } from '@angular/core';
import { JsonPipe, NgTemplateOutlet } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ApiService } from './api.service';
import { TopicDetail } from './models';

@Component({
  selector: 'app-topic',
  imports: [RouterLink, FormsModule, NgTemplateOutlet, JsonPipe],
  template: `
    @if (error) {
      <section class="section"><div class="wrap"><p class="error-banner">{{ error }}</p></div></section>
    } @else if (!topic) {
      <section class="section"><div class="wrap"><p>Loading lesson…</p></div></section>
    } @else {
      <section class="video-stage" id="videos">
        <div class="wrap">
          @if (!api.apiOnline) {
            <p class="error-banner">API on port 18081 is down. Playing this lesson from the local catalog.</p>
          }
          <h2 style="color:#fff;margin-bottom:8px;">Conversation video</h2>
          <div class="player">
            <p class="kicker" style="padding:14px 18px 0;margin:0;">{{ topic.title }}</p>
            <div class="scene">
              <figure class="speaker" [class.active]="activeSpeaker === 'maya'">
                <img src="/assets/images/speaker-maya.jpg" alt="Dr. Maya Krishnan">
                <figcaption>Dr. Maya Krishnan<small>Clinical informaticist</small></figcaption>
              </figure>
              <figure class="speaker" [class.active]="activeSpeaker === 'alex'">
                <img src="/assets/images/speaker-alex.jpg" alt="Alex Duarte">
                <figcaption>Alex Duarte<small>FHIR implementer</small></figcaption>
              </figure>
            </div>
            <audio #player (ended)="nextLine(true)"></audio>
            <div class="caption-bar">
              <p class="who">{{ who }}</p>
              <p class="line">{{ lineText }}</p>
              <p class="audio-status">{{ audioStatus }}</p>
            </div>
            <div class="controls">
              <button type="button" (click)="prevLine()">Previous</button>
              <button type="button" (click)="togglePlay()">{{ playing ? 'Pause' : 'Play' }}</button>
              <button type="button" (click)="nextLine(false)">Next</button>
              <div class="progress-wrap"><div class="progress" [style.width.%]="progressPct"></div></div>
              <span class="time">{{ lineIndex + 1 }} / {{ topic.conversation.length }}</span>
            </div>
          </div>
        </div>
      </section>

      <section class="section">
        <div class="wrap">
          <p class="kicker" style="color:var(--orange)">{{ topic.kicker }}</p>
          <h2>{{ topic.title }}</h2>
          <p class="intro">{{ topic.summary }}</p>
          <p><a routerLink="/" fragment="curriculum">← All topics</a></p>
        </div>
      </section>

      <section class="section alt">
        <div class="wrap prose">
          @for (section of topic.sections; track section.heading) {
            <h3>{{ section.heading }}</h3>
            @for (para of paragraphs(section.body); track para) {
              <p>{{ para }}</p>
            }
          }
        </div>
      </section>

      <section class="section">
        <div class="wrap">
          <h2>Interactive lab</h2>
          @switch (topic.interactiveType) {
            @case ('module-map') { <ng-container *ngTemplateOutlet="matchTpl"></ng-container> }
            @case ('code-match') { <ng-container *ngTemplateOutlet="matchTpl"></ng-container> }
            @case ('compare-legacy') {
              @for (s of topic.interactive.scenarios; track s.scene; let i = $index) {
                <article class="card" style="margin-bottom:12px">
                  <h3>{{ s.scene }}</h3>
                  @for (opt of s.options; track opt; let j = $index) {
                    <button class="choice" [class.ok]="legacyPick[i]===j && j===s.answer" [class.bad]="legacyPick[i]===j && j!==s.answer" (click)="legacyPick[i]=j">{{ opt }}</button>
                  }
                </article>
              }
            }
            @case ('resource-explorer') {
              <p>{{ topic.interactive.title }}</p>
              <div class="cards">
                @for (f of topic.interactive.fields; track f.path) {
                  <button class="card" (click)="selectedField = f">
                    <strong>{{ f.path }}</strong>
                    <p>{{ f.value }}</p>
                  </button>
                }
              </div>
              @if (selectedField) {
                <aside class="callout" style="margin-top:16px">
                  <h3>{{ selectedField.path }}</h3>
                  <p>{{ selectedField.why }}</p>
                </aside>
              }
            }
            @case ('fhir-lab') {
              <p>{{ topic.interactive.title }}. Teaching server persists Patients in PostgreSQL.</p>
              <div class="lab-row">
                <select [(ngModel)]="labMethod">
                  <option>GET</option>
                  <option>POST</option>
                </select>
                <input [(ngModel)]="labPath" class="lab-input">
                <button class="btn btn-primary" type="button" (click)="runLab()">Send</button>
              </div>
              @if (labMethod === 'POST') {
                <textarea [(ngModel)]="labBody" rows="8" class="lab-body"></textarea>
              }
              <pre class="lab-out">{{ labOut }}</pre>
            }
            @case ('narrative-toggle') {
              <div class="cards">
                <article class="card"><h3>Coded</h3><pre>{{ topic.interactive.coded | json }}</pre></article>
                <article class="card"><h3>Narrative</h3><p>{{ topic.interactive.narrative }}</p></article>
              </div>
            }
            @case ('smart-flow') {
              <article class="card">
                <span class="num">Step {{ smartStep + 1 }} / {{ topic.interactive.steps.length }}</span>
                <h3>{{ topic.interactive.steps[smartStep].title }}</h3>
                <p>{{ topic.interactive.steps[smartStep].detail }}</p>
                <button type="button" (click)="smartStep = Math.max(0, smartStep-1)">Back</button>
                <button type="button" (click)="smartStep = Math.min(topic.interactive.steps.length-1, smartStep+1)">Next</button>
              </article>
            }
            @case ('ig-picker') {
              @for (c of topic.interactive.cases; track c.need) {
                <article class="card" style="margin-bottom:12px">
                  <p>{{ c.need }}</p>
                  <button class="choice" [class.ok]="igPick[c.need]===c.guide" (click)="igPick[c.need]=c.guide">{{ c.guide }}</button>
                </article>
              }
            }
            @case ('start-checklist') {
              <ul class="check-list">
                @for (item of topic.interactive.items; track item; let i = $index) {
                  <li><label><input type="checkbox" [(ngModel)]="checks[i]"> {{ item }}</label></li>
                }
              </ul>
            }
            @case ('patient-chart') {
              <p>{{ topic.interactive.patient }}</p>
              <div class="cards">
                @for (s of topic.interactive.slots; track s.label) {
                  <article class="card"><span class="num">{{ s.label }}</span><h3>{{ s.resource }}</h3></article>
                }
              </div>
            }
            @case ('med-timeline') {
              @for (s of topic.interactive.steps; track s.when) {
                <article class="step"><div class="step-num">{{ s.when }}</div><div><strong>{{ s.resource }}</strong><p>{{ s.detail }}</p></div></article>
              }
            }
            @case ('workflow-board') {
              @for (card of topic.interactive.cards; track card.text) {
                <article class="card" style="margin-bottom:12px">
                  <p>{{ card.text }}</p>
                  @for (b of topic.interactive.buckets; track b) {
                    <button class="choice" [class.ok]="wfPick[card.text]===b && b===card.bucket" [class.bad]="wfPick[card.text]===b && b!==card.bucket" (click)="wfPick[card.text]=b">{{ b }}</button>
                  }
                </article>
              }
            }
            @case ('connectathon-board') {
              @for (item of topic.interactive.items; track item.q) {
                <article class="card" style="margin-bottom:12px">
                  <p>{{ item.q }}</p>
                  <button class="choice" [class.ok]="commPick[item.q]===item.a" (click)="commPick[item.q]=item.a">{{ item.a }}</button>
                </article>
              }
            }
          }
          <ng-template #matchTpl>
            <p>{{ topic.interactive.title }}</p>
            <div class="match-grid">
              <div>
                @for (p of topic.interactive.pairs; track p[0]) {
                  <button class="choice" [class.ok]="matchLeft===p[0]" (click)="pickLeft(p[0])">{{ p[0] }}</button>
                }
              </div>
              <div>
                @for (p of topic.interactive.pairs; track p[1]) {
                  <button class="choice" [class.ok]="matched[p[0]]===p[1]" (click)="pickRight(p[1])">{{ p[1] }}</button>
                }
              </div>
            </div>
          </ng-template>
        </div>
      </section>

      <section class="section alt">
        <div class="wrap">
          <h2>Check your understanding</h2>
          @for (q of topic.quiz; track q.id; let i = $index) {
            <article class="card" style="margin-bottom:16px">
              <h3>{{ q.prompt }}</h3>
              @for (opt of q.options; track opt; let j = $index) {
                <button class="choice" [class.ok]="quizState[i]?.selected===j && quizState[i]?.correct" [class.bad]="quizState[i]?.selected===j && quizState[i]?.correct===false" (click)="answer(i, q.id, j)">{{ opt }}</button>
              }
              @if (quizState[i]?.explanation) {
                <p>{{ quizState[i].explanation }}</p>
              }
            </article>
          }
          <button class="btn btn-primary" type="button" (click)="markComplete()">Mark topic complete</button>
          <p>{{ saveMsg }}</p>
          <h3>References</h3>
          <ul>
            @for (ref of topic.references; track ref) {
              <li><a [href]="ref" target="_blank" rel="noopener">{{ ref }}</a></li>
            }
          </ul>
        </div>
      </section>
    }
  `
})
export class TopicComponent implements OnDestroy {
  api = inject(ApiService);
  private route = inject(ActivatedRoute);
  readonly Math = Math;
  @ViewChild('player') playerRef?: ElementRef<HTMLAudioElement>;

  topic: TopicDetail | null = null;
  error = '';
  lineIndex = 0;
  playing = false;
  audio?: HTMLAudioElement;
  selectedField: any;
  labMethod = 'GET';
  labPath = '/fhir/Patient/example';
  labBody = '{\n  "resourceType": "Patient",\n  "name": [{ "family": "Garcia", "given": ["Elena"] }],\n  "gender": "female",\n  "birthDate": "1988-04-12"\n}';
  labOut = '';
  smartStep = 0;
  legacyPick: Record<number, number> = {};
  igPick: Record<string, string> = {};
  checks: boolean[] = [];
  wfPick: Record<string, string> = {};
  commPick: Record<string, string> = {};
  matchLeft = '';
  matched: Record<string, string> = {};
  quizState: { selected?: number; correct?: boolean; explanation?: string }[] = [];
  saveMsg = '';

  constructor() {
    this.route.paramMap.subscribe((params) => {
      const slug = params.get('slug')!;
      this.reset();
      this.api.topic(slug).subscribe({
        next: (t) => {
          this.topic = t;
          this.quizState = t.quiz.map(() => ({}));
          this.checks = (t.interactive?.items || []).map(() => false);
          this.showLine();
          setTimeout(() => this.showLine());
        },
        error: () => (this.error = 'Topic could not be loaded from the API or the local catalog.')
      });
    });
  }

  ngOnDestroy(): void {
    this.pause();
  }

  get activeSpeaker(): string {
    return this.topic?.conversation[this.lineIndex]?.speaker || 'maya';
  }
  get who(): string {
    const l = this.topic?.conversation[this.lineIndex];
    return l ? `${l.speakerName} · ${l.speakerRole}` : '';
  }
  get lineText(): string {
    return this.topic?.conversation[this.lineIndex]?.text || 'Press Play.';
  }
  get audioStatus(): string {
    return this.playing ? 'Speaking…' : 'Press Play to hear this lesson.';
  }
  get progressPct(): number {
    if (!this.topic?.conversation.length) return 0;
    return ((this.lineIndex + 1) / this.topic.conversation.length) * 100;
  }

  paragraphs(body: string): string[] {
    return body.split(/\n\n+/);
  }

  private reset(): void {
    this.pause();
    this.lineIndex = 0;
    this.topic = null;
    this.matched = {};
    this.matchLeft = '';
    this.smartStep = 0;
    this.labOut = '';
    this.saveMsg = '';
  }

  private audioEl(): HTMLAudioElement | null {
    return this.playerRef?.nativeElement ?? document.querySelector('audio');
  }

  showLine(): void {
    const el = this.audioEl();
    const line = this.topic?.conversation[this.lineIndex];
    if (el && line) {
      el.src = line.audioPath;
    }
  }

  togglePlay(): void {
    const el = this.audioEl();
    if (!el || !this.topic) return;
    if (this.playing) {
      this.pause();
      return;
    }
    this.playing = true;
    this.showLine();
    el.play().catch(() => (this.playing = false));
  }

  pause(): void {
    this.playing = false;
    this.audioEl()?.pause();
  }

  nextLine(fromEnded: boolean): void {
    if (!this.topic) return;
    if (this.lineIndex < this.topic.conversation.length - 1) {
      this.lineIndex += 1;
      this.showLine();
      if (this.playing || fromEnded) {
        this.playing = true;
        this.audioEl()?.play();
      }
    } else {
      this.pause();
    }
  }

  prevLine(): void {
    if (this.lineIndex === 0) return;
    this.lineIndex -= 1;
    this.showLine();
    if (this.playing) this.audioEl()?.play();
  }

  pickLeft(left: string): void {
    this.matchLeft = left;
  }

  pickRight(right: string): void {
    if (!this.matchLeft || !this.topic) return;
    const pair = this.topic.interactive.pairs.find((p: string[]) => p[0] === this.matchLeft);
    if (pair && pair[1] === right) {
      this.matched[this.matchLeft] = right;
    }
    this.matchLeft = '';
  }

  runLab(): void {
    if (this.labMethod === 'GET') {
      this.api.fhirGet(this.labPath).subscribe({
        next: (t) => (this.labOut = this.pretty(t)),
        error: (e) => (this.labOut = e.error || String(e))
      });
    } else {
      let body: unknown = {};
      try {
        body = JSON.parse(this.labBody);
      } catch {
        this.labOut = 'Body is not valid JSON.';
        return;
      }
      this.api.fhirPost(this.labPath, body).subscribe({
        next: (t) => (this.labOut = this.pretty(t)),
        error: (e) => (this.labOut = e.error || String(e))
      });
    }
  }

  pretty(text: string): string {
    try {
      return JSON.stringify(JSON.parse(text), null, 2);
    } catch {
      return text;
    }
  }

  answer(index: number, id: number, selected: number): void {
    this.api.checkQuiz(id, selected, this.topic?.slug, index).subscribe((res) => {
      this.quizState[index] = { selected, correct: res.correct, explanation: res.explanation };
    });
  }

  markComplete(): void {
    if (!this.topic) return;
    const score = this.quizState.filter((s) => s.correct).length;
    this.api.saveProgress(this.topic.slug, true, score).subscribe({
      next: () =>
        (this.saveMsg = this.api.apiOnline
          ? `Saved to PostgreSQL. Quiz score ${score}/${this.topic!.quiz.length}.`
          : `Saved in this browser (API offline). Quiz score ${score}/${this.topic!.quiz.length}.`),
      error: () => (this.saveMsg = 'Could not save progress.')
    });
  }
}
