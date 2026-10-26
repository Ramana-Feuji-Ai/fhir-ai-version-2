import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { KnowledgeApi } from '../../core/knowledge.api';
import { KnowledgeAsset, KnowledgeCitation, KnowledgeStatus } from '../../core/models';
import { MarkdownPipe } from '../../core/markdown.pipe';
import { extractErrorMessage } from '../../core/http-error';

const PERSONAS = ['Interoperability Architect', 'API Developer', 'Business Analyst', 'QA Engineer', 'Product Owner', 'Support / Operations Analyst'];

// One example question per persona -- shown as the placeholder once the field is emptied on a role
// change, so the blank state still hints at the kind of question that persona would actually ask.
const QUESTION_PLACEHOLDERS: Record<string, string> = {
  'Interoperability Architect': "What's our approved pattern for referencing resources inside a transaction Bundle?",
  'API Developer': 'How should a payer represent a prior authorization request using FHIR R4?',
  'Business Analyst': 'What information does a prior authorization request need to include, per our enterprise standards?',
  'QA Engineer': 'What are the required fields and status codes for a Patient in the sandbox?',
  'Product Owner': "What's our enterprise-approved approach to prior authorization, and what's still pending review?",
  'Support / Operations Analyst': 'What should I check first when a Patient create request comes back rejected?',
};

@Component({
  selector: 'fhi-knowledge-page',
  standalone: true,
  imports: [CommonModule, FormsModule, MarkdownPipe],
  template: `
    <main class="wrap knowledgePage">
      <p class="eyebrow">Enterprise Knowledge Assistant</p>
      <h1>Knowledge Assistant</h1>
      <p class="intro">Ask questions grounded only in approved enterprise FHIR standards, patterns, ADRs, and FAQs -- every answer cites the asset(s) it came from. Administrators govern which assets are searchable.</p>

      <section class="panel">
        <div class="fieldRow">
          <label>Persona <select [ngModel]="persona" (ngModelChange)="onPersonaChange($event)">@for (p of personas; track p) { <option [value]="p">{{ p }}</option> }</select></label>
        </div>
        <label class="stacked">Question
          <textarea [(ngModel)]="question" rows="2" [placeholder]="questionPlaceholder()"></textarea>
        </label>
        <button type="button" class="runBtn" [disabled]="loading() || !question.trim()" (click)="ask()">
          {{ loading() ? 'Searching...' : 'Search knowledge' }}
        </button>

        @if (errorMessage()) { <div class="errorBanner">{{ errorMessage() }}</div> }

        @if (answer()) {
          <div class="answer markdown" [innerHTML]="answer() | markdown"></div>
          @if (citations().length) {
            <div class="citations">
              <b>Sources</b>
              @for (c of citations(); track c.assetId) {
                <div class="citation">{{ c.title }} <span class="muted">({{ c.assetType }}, v{{ c.version }})</span></div>
              }
            </div>
          }
        }
      </section>

      <section class="assetsSection">
        <h2>Approved &amp; governed knowledge assets</h2>
        <p class="muted">Only assets marked Approved are searched or cited above. Disabling an asset removes it from search immediately (FR-026); Pending assets are awaiting approval.</p>
        <table>
          <tr><th>Title</th><th>Type</th><th>Version</th><th>Status</th><th>Updated</th><th></th></tr>
          @for (a of assets(); track a.id) {
            <tr>
              <td><b>{{ a.title }}</b><br><span class="muted small">{{ a.summary }}</span></td>
              <td>{{ a.assetType }}</td>
              <td>{{ a.version }}</td>
              <td><span class="status" [class]="a.status.toLowerCase()">{{ a.status }}</span></td>
              <td>{{ a.updatedAt | date: 'mediumDate' }}</td>
              <td class="actions">
                @if (a.status !== 'APPROVED') { <button type="button" class="linkBtn" (click)="setStatus(a, 'APPROVED')">Approve</button> }
                @if (a.status !== 'DISABLED') { <button type="button" class="linkBtn" (click)="setStatus(a, 'DISABLED')">Disable</button> }
                @if (a.status !== 'PENDING') { <button type="button" class="linkBtn" (click)="setStatus(a, 'PENDING')">Mark pending</button> }
              </td>
            </tr>
          }
        </table>
      </section>
    </main>
  `,
  styles: `
    .knowledgePage { padding-top:64px; padding-bottom:100px; }
    .eyebrow { margin:0 0 8px; color:var(--o7); font-size:11px; font-weight:750; letter-spacing:.1em; text-transform:uppercase; }
    h1 { margin:0; color:var(--n9); font-family:var(--display); font-size:40px; }
    .intro { color:var(--n6); max-width:760px; margin-top:10px; }

    .panel { border:1px solid #D7E2EC; border-radius:10px; background:#fff; padding:20px; margin-top:24px; }
    .fieldRow { display:flex; gap:14px; flex-wrap:wrap; margin-bottom:12px; }
    label { display:flex; flex-direction:column; gap:6px; font-size:12px; font-weight:650; color:var(--n6); }
    label.stacked { margin-bottom:12px; }
    select, textarea { border:1px solid #D7E2EC; border-radius:8px; padding:8px 10px; font-size:13px; color:var(--n9); background:#fff; width:100%; box-sizing:border-box; }
    select { min-height:36px; width:auto; }
    textarea { resize:vertical; font-family:inherit; }

    .runBtn { border:none; background:var(--b6); color:#fff; border-radius:8px; padding:11px 18px; font-size:13px; font-weight:700; cursor:pointer; }
    .runBtn:disabled { opacity:.55; cursor:not-allowed; }
    .runBtn:not(:disabled):hover { filter:brightness(1.05); }

    .errorBanner { margin-top:16px; background:#fdeeee; color:#c44; border-radius:8px; padding:11px 14px; font-size:12.5px; font-weight:600; }
    .answer { margin-top:16px; }
    .citations { margin-top:14px; border-top:1px solid var(--n1); padding-top:12px; font-size:12px; color:var(--n6); }
    .citation { border-left:3px solid var(--b6); padding:6px 10px; background:var(--n0); margin-top:6px; border-radius:0 6px 6px 0; }
    .citation .muted { color:var(--n5); }

    .assetsSection { margin-top:36px; }
    .assetsSection h2 { font-family:var(--display); font-size:20px; color:var(--n9); margin:0; }
    .muted { color:var(--n5); font-size:12px; }
    .muted.small { font-size:11px; }

    table { width:100%; border-collapse:collapse; font-size:12px; margin-top:16px; }
    th, td { text-align:left; padding:10px; border-bottom:1px solid var(--n1); vertical-align:top; }
    th { background:var(--n0); color:var(--n7); }
    .status { border-radius:99px; padding:3px 9px; font-size:10px; font-weight:700; }
    .status.approved { background:var(--gr1); color:var(--gr6); }
    .status.pending { background:var(--o1); color:var(--o7); }
    .status.disabled { background:var(--n1); color:var(--n5); }
    .actions { display:flex; gap:6px; flex-wrap:wrap; }
    .linkBtn { border:1px solid #D7E2EC; background:#fff; color:var(--n7); border-radius:7px; padding:5px 10px; font-size:11px; font-weight:650; cursor:pointer; }
    .linkBtn:hover { background:var(--n0); }
  `,
})
export class KnowledgePage implements OnInit {
  private readonly api = inject(KnowledgeApi);

  readonly personas = PERSONAS;
  readonly loading = signal(false);
  readonly errorMessage = signal('');
  readonly assets = signal<KnowledgeAsset[]>([]);
  readonly answer = signal('');
  readonly citations = signal<KnowledgeCitation[]>([]);

  persona = PERSONAS[0];
  question = 'How should a payer represent a prior authorization request using FHIR R4?';

  questionPlaceholder(): string { return QUESTION_PLACEHOLDERS[this.persona] ?? QUESTION_PLACEHOLDERS[PERSONAS[0]]; }

  ngOnInit(): void {
    this.loadAssets();
  }

  private loadAssets(): void {
    this.api.listAssets().subscribe({
      next: (assets) => this.assets.set(assets),
      error: (e: HttpErrorResponse) => this.errorMessage.set(extractErrorMessage(e)),
    });
  }

  onPersonaChange(persona: string): void {
    this.persona = persona;
    // A previously generated answer/citations was grounded for the old persona's depth and tone;
    // keeping it (or the question that produced it) on screen after switching would misleadingly
    // imply it still matches the new one. Re-seed with the new persona's example question as real,
    // editable, ready-to-run text rather than leaving the field empty against a disabled button.
    this.question = this.questionPlaceholder();
    this.answer.set('');
    this.citations.set([]);
    this.errorMessage.set('');
  }

  ask(): void {
    this.loading.set(true);
    this.errorMessage.set('');
    this.api.ask(this.persona, this.question).subscribe({
      next: (res) => {
        this.answer.set(res.answer);
        this.citations.set(res.citations);
        this.loading.set(false);
      },
      error: (e: HttpErrorResponse) => { this.errorMessage.set(extractErrorMessage(e)); this.loading.set(false); },
    });
  }

  setStatus(asset: KnowledgeAsset, status: KnowledgeStatus): void {
    this.api.updateStatus(asset.id, status).subscribe({
      next: () => this.loadAssets(),
      error: (e: HttpErrorResponse) => this.errorMessage.set(extractErrorMessage(e)),
    });
  }
}
