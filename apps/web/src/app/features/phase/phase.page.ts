import { Component, OnDestroy, OnInit, inject, signal, computed } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { switchMap } from 'rxjs';
import { CurriculumApi } from '../../core/curriculum.api';
import { MockDataEnhancer } from '../../core/mock-data-enhancer';
import { AssistantContextService } from '../../core/assistant-context.service';
import { PhaseDetail, TopicDetail, PhaseResources } from '../../core/models';
import { SlideDeckComponent } from '../slides/slide-deck.component';

@Component({
  selector: 'fhi-phase-page',
  standalone: true,
  imports: [RouterLink, SlideDeckComponent],
  template: `
    @if (phase(); as p) {
      <section class="phaseHero">
        <div class="wrap">
          @if (openTopicId()) {
            <button type="button" class="back" (click)="closeTopic()">← Back to topics</button>
          } @else if (courseSlug(); as slug) {
            <a class="back" [routerLink]="['/courses', slug]">← Back to course</a>
          } @else {
            <a class="back" routerLink="/" fragment="courses">← Back to courses</a>
          }
          <div class="phaseGrid">
            <div>
              <div class="chips">
                <span class="chip">Phase {{ p.id }}</span>
                <span class="chip blue">{{ p.track }}</span>
                <span class="muted" style="font-size:11px">◷ {{ p.duration }}</span>
                @if (p.resources.specs.length) {
                  <span class="chip green">{{ p.resources.specs.length }} Specs</span>
                }
                @if (p.resources.examples.length) {
                  <span class="chip purple">{{ p.resources.examples.length }} Examples</span>
                }
                @if (p.resources.lab) {
                  <span class="chip orange">Mock Assessment Available</span>
                }
                @if (p.resources.quiz.length) {
                  <span class="chip red">{{ p.resources.quiz.length }} Quizzes</span>
                }
              </div>
              <h1>{{ p.title }}</h1>
              <p class="lead">{{ p.description }}</p>
              
              @if (p.objectives.length || p.outcomes.length) {
                <div class="objectives">
                  <div class="objBox">
                    <b>Learning objectives</b>
                    <ul>@for (o of p.objectives; track o) { <li>{{ o }}</li> }</ul>
                  </div>
                  <div class="objBox">
                    <b>Expected outcomes</b>
                    <ul>@for (o of p.outcomes; track o) { <li>{{ o }}</li> }</ul>
                  </div>
                </div>
              }

              @if (showResources()) {
                <div class="phaseResources" [class.collapsed]="!resourcesExpanded()">
                  <button class="resourceToggle" (click)="toggleResources()" type="button">
                    <span>{{ resourcesExpanded() ? 'Hide' : 'Show' }} Resources & References</span>
                    <span class="toggleIcon">{{ resourcesExpanded() ? '⌄' : '›' }}</span>
                  </button>
                  @if (resourcesExpanded()) {
                    <div class="resourceContent">
                      @if (p.resources.specs.length) {
                        <div class="resourceSection">
                          <h4>📋 FHIR Specifications</h4>
                          <ul>
                            @for (spec of p.resources.specs; track spec.url) {
                              <li>
                                <a [href]="spec.url" target="_blank" rel="noopener">{{ spec.label }}</a>
                                @if (spec.note) { <span class="specNote">{{ spec.note }}</span> }
                              </li>
                            }
                          </ul>
                        </div>
                      }
                      @if (p.resources.examples.length) {
                        <div class="resourceSection">
                          <h4>💡 Interactive Examples</h4>
                          <div class="exampleGrid">
                            @for (ex of p.resources.examples; track ex.title) {
                              <div class="exampleCard" (click)="openExample(ex)">
                                <h5>{{ ex.title }}</h5>
                                <p>{{ ex.body }}</p>
                                <span class="exampleAction">View Example →</span>
                              </div>
                            }
                          </div>
                        </div>
                      }
                      @if (p.resources.lab) {
                        <div class="resourceSection labSection">
                          <h4>🧪 Mock Assessment</h4>
                          <div class="labCard">
                            <h5>{{ p.resources.lab.title }}</h5>
                            <p>{{ p.resources.lab.body }}</p>
                            <button class="btn primary" (click)="openLab()">Launch Mock Assessment</button>
                          </div>
                        </div>
                      }
                      @if (p.resources.quiz.length) {
                        <div class="resourceSection">
                          <h4>❓ Practice Quizzes</h4>
                          <p class="muted">{{ p.resources.quiz.length }} quiz questions available in topic slides</p>
                        </div>
                      }
                    </div>
                  }
                </div>
              }
            </div>
            <aside class="progress">
              <div class="row">
                <b style="font-size:12px">Phase progress</b>
                <span class="muted" style="font-size:11px">{{ p.topicDone }} of {{ p.topicTotal }}</span>
              </div>
              <div class="progressRingWrap">
                <div class="progressRing" [style.--p]="p.percentComplete + '%'">
                  <span>{{ p.percentComplete }}%</span>
                </div>
              </div>
              <div class="bar"><i [style.width.%]="p.percentComplete"></i></div>
              <p class="muted" style="font-size:11px">Open a topic, finish the slides (Done), or use ○ to mark complete.</p>
              @if (p.percentComplete === 100) {
                <div class="completionBadge">
                  <span class="badgeIcon">🎉</span>
                  <span>Phase Complete! Ready for next phase.</span>
                </div>
              }
            </aside>
          </div>
        </div>
      </section>

      <div class="wrap phaseMain">
        <div class="tree">
          @for (sec of p.sections; track sec.id; let si = $index) {
            <div class="branch">
              <button class="branchHead" type="button" (click)="toggleBranch(si)" [attr.aria-expanded]="!collapsed()[si]">
                <span class="arrow">{{ collapsed()[si] ? '›' : '⌄' }}</span>
                <span class="num">{{ si + 1 }}</span>
                <span class="branchTitle">{{ sec.title }}</span>
                <span class="branchMeta">
                  <span class="branchPct">{{ sectionPct(sec) }}%</span>
                  <span class="topicCount">{{ sec.topics.length }} topics</span>
                  <span class="topicDoneCount">{{ sec.topics.filter(t => t.completed).length }} done</span>
                </span>
              </button>
              @if (!collapsed()[si]) {
                <ul class="topics">
                  @for (t of sec.topics; track t.id) {
                    <li class="topicRow" [class.open]="openTopicId() === t.id" [class.completed]="t.completed" [attr.data-topic-id]="t.id">
                      <div class="topicHead">
                        <button
                          type="button"
                          class="check"
                          [class.done]="t.completed"
                          title="Mark complete"
                          (click)="toggleComplete(t.id, !t.completed)"
                        >{{ t.completed ? '✓' : '○' }}</button>
                        <button type="button" class="topic" [class.done]="t.completed" (click)="openTopic(t.id)">
                          <span class="topicCopy">
                            <span>{{ t.title }}</span>
                            @if (t.summary) { <span class="topicSum">{{ t.summary }}</span> }
                            <span class="topicBadges">
                              @if (t.slideCount) {
                                <span class="tBadge slides">{{ t.slideCount }} slides</span>
                              }
                              @if (t.hasVideo) {
                                <span class="tBadge video">Video</span>
                              }
                              @if (t.hasInteractive) {
                                <span class="tBadge interactive">Interactive</span>
                              }
                              <span class="tBadge" [class.done]="t.completed">
                                {{ t.completed ? 'Completed' : 'Not started' }}
                              </span>
                            </span>
                          </span>
                        </button>
                      </div>
                      @if (openTopicId() === t.id && topicDetail()?.id === t.id && topicDetail(); as detail) {
                        <div class="topicDetail">
                          <fhi-slide-deck [topic]="detail" (completed)="onSlideDeckCompleted($event)" />
                        </div>
                      }
                    </li>
                  }
                </ul>
              }
            </div>
          }
        </div>

        <aside class="sidebar">
          @if (openTopicId() && topicDetail(); as detail) {
            <div class="resource sticky">
              <h3>Topic Resources</h3>
              @if (detail.keyPoints.length) {
                <div class="resourceCard">
                  <b>Key Points</b>
                  <ul>
                    @for (k of detail.keyPoints; track k) {
                      <li>{{ k }}</li>
                    }
                  </ul>
                </div>
              }
              @if (detail.examTip) {
                <div class="resourceCard examTip">
                  <b>💡 Exam Tip</b>
                  <p>{{ detail.examTip }}</p>
                </div>
              }
              @if (detail.slides.some(s => s.videoUrl)) {
                <div class="resourceCard videoList">
                  <b>🎬 Video Lessons</b>
                  @for (slide of detail.slides; track slide.id) {
                    @if (slide.videoUrl) {
                      <button class="videoLink" (click)="jumpToSlide(slide.id)">
                        <span class="videoLinkIcon">▶</span>
                        <span>{{ slide.videoTitle || slide.title }}</span>
                        <span class="videoLinkDuration">{{ slide.videoDuration }}</span>
                      </button>
                    }
                  }
                </div>
              }
              @if (detail.slides.some(s => s.interactiveType)) {
                <div class="resourceCard interactiveList">
                  <b>⚡ Interactive Elements</b>
                  @for (slide of detail.slides; track slide.id) {
                    @if (slide.interactiveType) {
                      <span class="interactiveTag" [attr.data-type]="slide.interactiveType">
                        {{ getInteractiveLabel(slide.interactiveType) }}
                      </span>
                    }
                  }
                </div>
              }
            </div>
          } @else {
            <div class="resource sticky">
              <h3>Phase Resources</h3>
              @if (phase(); as p) {
                @if (p.resources.specs.length) {
                  <div class="resourceCard">
                    <b>Specifications</b>
                    @for (spec of p.resources.specs; track spec.url) {
                      <a [href]="spec.url" target="_blank" rel="noopener">{{ spec.label }}</a>
                    }
                  </div>
                }
                @if (p.resources.examples.length) {
                  <div class="resourceCard">
                    <b>Examples</b>
                    @for (ex of p.resources.examples; track ex.title) {
                      <button (click)="openExample(ex)">{{ ex.title }}</button>
                    }
                  </div>
                }
                @if (p.resources.lab) {
                  <div class="resourceCard">
                    <b>Mock Assessment</b>
                    <button class="btn primary" style="width:100%" (click)="openLab()">{{ p.resources.lab.title }}</button>
                  </div>
                }
              }
              <div class="alignment">
                <b>Blueprint Alignment</b>
                <p>This phase covers FHIR R4 certification domains: RESTful API, Profiles, Terminology, Security, and Conformance.</p>
              </div>
            </div>
          }
        </aside>
      </div>
    } @else if (error()) {
      <div class="wrap" style="padding:48px 28px"><p>{{ error() }}</p></div>
    } @else {
      <div class="wrap" style="padding:48px 28px"><p class="muted">Loading phase…</p></div>
    }
  `,
  styles: `
    .back { text-decoration: none; font: inherit; cursor: pointer; }
    .chips {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
      margin-bottom: 12px;
    }
    .chip.green { background: var(--gr1); color: var(--gr6); }
    .chip.purple { background: #F3E8FD; color: #8B5CF6; }
    .chip.orange { background: var(--o1); color: var(--o7); }
    .chip.red { background: #FDEEEE; color: #c44; }
    .phaseResources {
      margin-top: 20px;
      border: 1px solid var(--g3);
      border-radius: 10px;
      overflow: hidden;
      background: white;
    }
    .resourceToggle {
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 14px 18px;
      background: var(--n0);
      border: none;
      border-bottom: 1px solid var(--g3);
      font-size: 13px;
      font-weight: 600;
      color: var(--n7);
      cursor: pointer;
      text-align: left;
    }
    .resourceToggle:hover {
      background: var(--n1);
    }
    .toggleIcon {
      transition: transform 0.2s ease;
      font-size: 10px;
    }
    .phaseResources.collapsed .toggleIcon {
      transform: rotate(-90deg);
    }
    .resourceContent {
      padding: 20px;
      animation: slideDown 0.25s ease;
    }
    @keyframes slideDown {
      from { opacity: 0; transform: translateY(-10px); }
      to { opacity: 1; transform: none; }
    }
    .resourceSection {
      margin-bottom: 24px;
      padding-bottom: 24px;
      border-bottom: 1px solid var(--n1);
    }
    .resourceSection:last-child {
      border-bottom: none;
      margin-bottom: 0;
      padding-bottom: 0;
    }
    .resourceSection h4 {
      font-size: 13px;
      font-weight: 650;
      color: var(--n6);
      text-transform: uppercase;
      letter-spacing: 0.06em;
      margin: 0 0 12px;
    }
    .resourceSection ul {
      margin: 0;
      padding-left: 20px;
    }
    .resourceSection li {
      margin: 8px 0;
      font-size: 13px;
      color: var(--n7);
    }
    .resourceSection a {
      color: var(--b6);
      text-decoration: none;
      font-weight: 500;
    }
    .resourceSection a:hover {
      text-decoration: underline;
    }
    .specNote {
      display: block;
      font-size: 11px;
      color: var(--n5);
      margin-top: 2px;
      font-weight: 400;
    }
    .exampleGrid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 12px;
    }
    .exampleCard {
      padding: 16px;
      background: var(--n0);
      border: 1px solid var(--g3);
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .exampleCard:hover {
      border-color: var(--b6);
      box-shadow: 0 4px 12px rgba(26, 107, 184, 0.1);
      transform: translateY(-2px);
    }
    .exampleCard h5 {
      margin: 0 0 6px;
      font-size: 13px;
      color: var(--n9);
    }
    .exampleCard p {
      margin: 0 0 10px;
      font-size: 12px;
      color: var(--n5);
      line-height: 1.5;
    }
    .exampleAction {
      font-size: 11px;
      color: var(--b6);
      font-weight: 600;
    }
    .labSection {
      background: linear-gradient(135deg, #FFF8F0, #F8EFE6);
      border: 1px solid #EBD9C6;
      border-radius: 10px;
      padding: 20px;
      margin: 0 -20px -20px;
    }
    .labCard h5 {
      margin: 0 0 8px;
      color: var(--n9);
    }
    .labCard p {
      margin: 0 0 16px;
      color: var(--n7);
      font-size: 13px;
    }
    .completionBadge {
      margin-top: 16px;
      padding: 12px 16px;
      background: linear-gradient(135deg, var(--gr1), #E5F5EE);
      border: 1px solid var(--gr6);
      border-radius: 8px;
      display: flex;
      align-items: center;
      gap: 10px;
      color: var(--gr6);
      font-weight: 600;
      font-size: 13px;
    }
    .badgeIcon {
      font-size: 18px;
    }
    .topicDoneCount {
      font-size: 11px;
      color: var(--gr6);
      background: var(--gr1);
      padding: 2px 8px;
      border-radius: 999px;
      font-weight: 600;
    }
    .tBadge.video {
      background: var(--o1);
      border-color: #EBD9C6;
      color: var(--o7);
    }
    .tBadge.interactive {
      background: #F3E8FD;
      border-color: #D8B4FE;
      color: #8B5CF6;
    }
    .sidebar {
      position: sticky;
      top: 100px;
    }
    .resource.sticky {
      position: sticky;
      top: 100px;
    }
    .resourceCard {
      margin-bottom: 16px;
      padding: 16px;
      background: white;
      border: 1px solid var(--g3);
      border-radius: 10px;
    }
    .resourceCard b {
      display: block;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: var(--n6);
      margin-bottom: 10px;
    }
    .resourceCard ul {
      margin: 0;
      padding-left: 16px;
    }
    .resourceCard li {
      margin: 4px 0;
      font-size: 12px;
      color: var(--n7);
    }
    .resourceCard a {
      display: block;
      color: var(--b6);
      text-decoration: none;
      font-weight: 500;
      padding: 4px 0;
    }
    .resourceCard button {
      display: block;
      width: 100%;
      text-align: left;
      background: none;
      border: none;
      color: var(--b6);
      font-weight: 500;
      padding: 4px 0;
      cursor: pointer;
    }
    .resourceCard button:hover {
      text-decoration: underline;
    }
    .resourceCard.examTip {
      background: var(--o1);
      border-color: #EBD9C6;
    }
    .resourceCard.examTip b {
      color: var(--o7);
    }
    .resourceCard.examTip p {
      margin: 0;
      font-size: 12px;
      color: var(--n8);
      line-height: 1.5;
    }
    .videoList button {
      display: flex;
      align-items: center;
      gap: 10px;
      width: 100%;
      padding: 10px 12px;
      background: var(--n0);
      border: 1px solid transparent;
      border-radius: 8px;
      text-align: left;
      margin-bottom: 8px;
      color: var(--n7);
      font-weight: 500;
      transition: all 0.15s;
    }
    .videoList button:hover {
      background: var(--b1);
      border-color: #C5DBEF;
      color: var(--b6);
    }
    .videoLinkIcon {
      flex: none;
      width: 24px;
      height: 24px;
      border-radius: 50%;
      background: var(--o1);
      color: var(--o7);
      display: grid;
      place-items: center;
      font-size: 10px;
    }
    .videoLinkDuration {
      margin-left: auto;
      font-size: 11px;
      color: var(--n5);
    }
    .interactiveList {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }
    .interactiveTag {
      font-size: 10px;
      font-weight: 650;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      padding: 4px 10px;
      border-radius: 999px;
    }
    .interactiveTag[data-type="quiz"] {
      background: var(--b1);
      color: var(--b6);
      border: 1px solid #C5DBEF;
    }
    .interactiveTag[data-type="lab"] {
      background: var(--gr1);
      color: var(--gr6);
      border: 1px solid #B7E0CC;
    }
    .interactiveTag[data-type="code"] {
      background: #F3E8FD;
      color: #8B5CF6;
      border: 1px solid #D8B4FE;
    }
    .interactiveTag[data-type="diagram"] {
      background: var(--o1);
      color: var(--o7);
      border: 1px solid #EBD9C6;
    }
    .alignment {
      background: linear-gradient(160deg, var(--n9), var(--n8));
      color: white;
      border-color: var(--n9);
      border-radius: 12px;
      padding: 20px;
    }
    .alignment p {
      color: #C4D1DF;
      font-size: 13px;
      line-height: 1.55;
      margin: 8px 0 0;
    }
  `,
})
export class PhasePage implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly api = inject(CurriculumApi);
  private readonly enhancer = inject(MockDataEnhancer);
  private readonly assistantContext = inject(AssistantContextService);

  readonly phase = signal<PhaseDetail | null>(null);
  readonly openTopicId = signal<number | null>(null);
  readonly topicDetail = signal<TopicDetail | null>(null);
  readonly collapsed = signal<Record<number, boolean>>({});
  readonly error = signal<string | null>(null);
  readonly resourcesExpanded = signal(false);
  readonly courseSlug = signal<string | null>(null);

  readonly showResources = computed(() => {
    const p = this.phase();
    return !!(p?.resources?.specs?.length || p?.resources?.examples?.length || p?.resources?.lab || p?.resources?.quiz?.length);
  });

  ngOnInit(): void {
    this.route.paramMap
      .pipe(switchMap((pm) => this.enhancer.enhancePhase(Number(pm.get('id')))))
      .subscribe({
        next: (p) => {
          this.phase.set(p);
          this.openTopicId.set(null);
          this.topicDetail.set(null);
          this.collapsed.set({});
          this.courseSlug.set(this.route.snapshot.queryParamMap.get('course'));
          this.assistantContext.setPhase(p.id);
        },
        error: (e) => this.error.set(String(e?.message ?? e)),
      });
  }

  ngOnDestroy(): void {
    this.assistantContext.clear();
  }

  sectionPct(sec: PhaseDetail['sections'][number]): number {
    if (!sec.topics.length) return 0;
    const done = sec.topics.filter((t) => t.completed).length;
    return Math.round((done / sec.topics.length) * 100);
  }

  toggleBranch(si: number): void {
    this.collapsed.update((m) => ({ ...m, [si]: !m[si] }));
  }

  toggleResources(): void {
    this.resourcesExpanded.update(v => !v);
  }

  openTopic(topicId: number): void {
    if (this.openTopicId() === topicId) {
      this.closeTopic();
      return;
    }
    const phaseId = this.phase()?.id;
    this.openTopicId.set(topicId);
    if (phaseId != null) this.assistantContext.setTopic(phaseId, topicId);
    this.enhancer.enhanceTopic(topicId).subscribe({
      next: (d) => this.topicDetail.set(d),
      error: (e) => this.error.set(String(e?.message ?? e)),
    });
  }

  /** Closes the open topic and returns to the phase's list of topics. */
  closeTopic(): void {
    this.openTopicId.set(null);
    this.topicDetail.set(null);
    const phaseId = this.phase()?.id;
    if (phaseId != null) this.assistantContext.setPhase(phaseId);
  }

  toggleComplete(topicId: number, completed: boolean): void {
    this.api.setTopicProgress(topicId, completed).subscribe({
      next: () => this.refreshPhase(topicId, completed),
      error: (e) => this.error.set(String(e?.message ?? e)),
    });
  }

  /** SCORM "Done" on last slide → mark topic completed and open the next topic. */
  onSlideDeckCompleted(topicId: number): void {
    this.api.setTopicProgress(topicId, true).subscribe({
      next: () => {
        this.refreshPhase(topicId, true);
        this.openNextTopic(topicId);
      },
      error: (e) => this.error.set(String(e?.message ?? e)),
    });
  }

  private openNextTopic(topicId: number): void {
    const phase = this.phase();
    if (!phase) return;
    const topics = phase.sections.flatMap((sec) => sec.topics);
    const idx = topics.findIndex((t) => t.id === topicId);
    const next = idx >= 0 ? topics[idx + 1] : undefined;
    if (next) this.openTopic(next.id);
  }

  openExample(example: { title: string; body: string }): void {
    alert(`Example: ${example.title}\n\n${example.body}\n\nIn a real implementation, this would open an interactive FHIR resource viewer.`);
  }

  /** Opens the phase's mock-assessment topic (falling back to the last topic) and scrolls to it. */
  openLab(): void {
    const phase = this.phase();
    if (!phase) return;
    const topics = phase.sections.flatMap((sec) => sec.topics);
    const target = topics.find((t) => /lab|hands-on|exercise/i.test(t.title)) ?? topics[topics.length - 1];
    if (!target) return;
    const si = phase.sections.findIndex((sec) => sec.topics.some((t) => t.id === target.id));
    if (si >= 0 && this.collapsed()[si]) this.toggleBranch(si);
    if (this.openTopicId() !== target.id) this.openTopic(target.id);
    setTimeout(() => {
      document.querySelector(`[data-topic-id="${target.id}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  jumpToSlide(slideId: number): void {
    const detail = this.topicDetail();
    if (detail) {
      const index = detail.slides.findIndex(s => s.id === slideId);
      if (index >= 0) {
        // The slide deck will handle navigation internally
        // This is a placeholder for the interaction
      }
    }
  }

  getInteractiveLabel(type: string): string {
    const labels: Record<string, string> = {
      quiz: 'Quiz',
      lab: 'Mock Assessment',
      code: 'Code',
      diagram: 'Diagram',
    };
    return labels[type] || type;
  }

  private refreshPhase(topicId: number, completed: boolean): void {
    const detail = this.topicDetail();
    if (detail && detail.id === topicId) {
      this.topicDetail.set({ ...detail, completed });
    }
    const id = this.phase()?.id;
    if (id == null) return;
    this.enhancer.enhancePhase(id).subscribe({
      next: (p) => this.phase.set(p),
      error: (e) => this.error.set(String(e?.message ?? e)),
    });
  }
}
