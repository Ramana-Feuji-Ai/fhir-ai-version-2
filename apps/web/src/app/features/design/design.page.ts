import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { DesignApi } from '../../core/design.api';
import { MarkdownPipe } from '../../core/markdown.pipe';
import { extractErrorMessage } from '../../core/http-error';

type DesignTab = 'recommend' | 'payload' | 'api' | 'ig';

const PERSONAS = ['Interoperability Architect', 'API Developer', 'Business Analyst', 'QA Engineer', 'Product Owner', 'Support / Operations Analyst'];
const FHIR_VERSIONS = ['FHIR R4', 'FHIR R4B', 'FHIR R5'];
const IGS = ['Base FHIR', 'US Core', 'Da Vinci PAS', 'Da Vinci CRD', 'Da Vinci DTR', 'CARIN Blue Button'];
const RESOURCE_TYPES = ['Patient', 'Practitioner', 'Organization', 'Encounter', 'Observation', 'Condition', 'MedicationRequest', 'Coverage', 'Claim'];

// One example prompt per persona per tab, so the empty state after a role change still hints at the
// kind of question that persona would actually ask -- not just a generic placeholder.
const WORKFLOW_PLACEHOLDERS: Record<string, string> = {
  'Interoperability Architect': 'A provider requests prior authorization for an MRI. Map the request end-to-end across payer and provider systems, including status callbacks.',
  'API Developer': 'A mobile app needs to check member eligibility and coverage before scheduling an appointment.',
  'Business Analyst': 'Describe the referral workflow from primary care to a specialist, including required documentation and approvals.',
  'QA Engineer': 'A claims intake workflow accepts a professional claim, validates it, and returns an adjudication status.',
  'Product Owner': 'A member submits a prior authorization request from a self-service portal and tracks its status.',
  'Support / Operations Analyst': "A support agent needs to look up a member's active coverage and recent claims to answer a billing question.",
};

// The Artifact picker a persona would reach for by default. The Generation intent text is derived
// from *this* -- ARTIFACT_INTENT_TEMPLATES below, keyed by artifact, not by persona -- so intent
// always describes whatever artifact is actually selected, whether that selection came from a
// persona switch or the user picking a different Artifact directly. Two independent sources for the
// same text (one per persona, one per artifact) is exactly how they drifted out of sync before: the
// Artifact dropdown would change but the intent text -- still keyed to the old persona -- would not.
const ARTIFACT_DEFAULTS: Record<string, string> = {
  'Interoperability Architect': 'Transaction Bundle',
  'API Developer': 'Patient',
  'Business Analyst': 'Coverage',
  'QA Engineer': 'Claim',
  'Product Owner': 'Claim',
  'Support / Operations Analyst': 'Patient',
};

const ARTIFACT_INTENT_TEMPLATES: Record<string, string> = {
  'Patient': 'Create a synthetic Patient example with identifier, name, birth date, address, telecom, and communication language.',
  'Practitioner': 'Create a synthetic Practitioner example with an NPI identifier, name, and qualification.',
  'Organization': 'Create a synthetic Organization example with a name, identifier, and type (e.g. payer or provider).',
  'Encounter': 'Create a synthetic Encounter example with status, class, subject, and period.',
  'Observation': 'Create a synthetic Observation example with status, a LOINC code, subject, and a result value.',
  'Condition': 'Create a synthetic Condition example with a SNOMED CT code, subject, and clinical status.',
  'MedicationRequest': 'Create a synthetic MedicationRequest example with status, intent, medication code, and subject.',
  'Coverage': "Create a synthetic Coverage example with status, beneficiary, payor, and plan/class details.",
  'Claim': 'Create a synthetic Claim example with status, type, patient, provider, and at least one item.',
  'Transaction Bundle': 'Generate a transaction Bundle showing how Patient, Coverage, and Claim reference each other in a prior authorization request.',
  'Batch Bundle': 'Generate a batch Bundle with a few independent entries, e.g. one lookup for an existing Patient and one for an id that does not exist.',
  'Document Bundle': 'Generate a document Bundle with a Composition referencing a Patient and supporting clinical resources.',
  'Message Bundle': 'Generate a message Bundle with a MessageHeader and the resources it references, for an admit notification.',
};

const API_REQUIREMENT_PLACEHOLDERS: Record<string, string> = {
  'Interoperability Architect': "Design the CapabilityStatement-aligned search parameters a payer's Claim endpoint should support for status lookups.",
  'API Developer': 'Find final laboratory Observations for a patient in the last 90 days, include the encounter, return code, value, effective date, interpretation, and status.',
  'Business Analyst': 'How would a client search for all approved prior authorization requests for a given member?',
  'QA Engineer': "Show the search call to find all Claims with a 'denied' status for a given patient, for use in a test case.",
  'Product Owner': "Show what a client app would call to check a member's current coverage status.",
  'Support / Operations Analyst': 'Show the read call a support agent tool would use to look up a specific claim by id.',
};

const IG_QUESTION_PLACEHOLDERS: Record<string, string> = {
  'Interoperability Architect': 'Explain the Must Support and slicing requirements for the Da Vinci PAS Claim profile.',
  'API Developer': 'Explain Must Support, cardinality, terminology binding, and slicing for the selected profile. Provide an implementation checklist for a developer.',
  'Business Analyst': 'In plain terms, what does this implementation guide require us to collect from a member?',
  'QA Engineer': 'What fields and value sets does this profile require, so I can write conformance test cases against them?',
  'Product Owner': "What does this implementation guide require, and what's the impact on our delivery timeline?",
  'Support / Operations Analyst': "What does 'Must Support' mean in practice when I'm troubleshooting a rejected request?",
};

@Component({
  selector: 'fhi-design-page',
  standalone: true,
  imports: [CommonModule, FormsModule, MarkdownPipe],
  template: `
    <main class="wrap designPage">
      <p class="eyebrow">FHIR Design &amp; Development Assistant</p>
      <h1>Design Assistant</h1>
      <p class="intro">Map a workflow to FHIR resources, generate editable payloads and Bundles, draft REST API calls, and get implementation-guide requirements explained in plain language. Every draft is grounded and requires human review before use.</p>

      <div class="context">
        <label>Persona <select [ngModel]="persona" (ngModelChange)="onPersonaChange($event)">@for (p of personas; track p) { <option [value]="p">{{ p }}</option> }</select></label>
        <label>FHIR version <select [ngModel]="fhirVersion" (ngModelChange)="onFhirVersionChange($event)">@for (v of versions; track v) { <option [value]="v">{{ v }}</option> }</select></label>
        <label>Implementation guide <select [ngModel]="ig" (ngModelChange)="onIgChange($event)">@for (g of igs; track g) { <option [value]="g">{{ g }}</option> }</select></label>
      </div>

      <div class="tabs">
        <button type="button" [class.active]="tab() === 'recommend'" (click)="tab.set('recommend')">Workflow → Resources</button>
        <button type="button" [class.active]="tab() === 'payload'" (click)="tab.set('payload')">Payload &amp; Bundle Builder</button>
        <button type="button" [class.active]="tab() === 'api'" (click)="tab.set('api')">API &amp; Search Designer</button>
        <button type="button" [class.active]="tab() === 'ig'" (click)="tab.set('ig')">IG Explainer</button>
      </div>

      @if (errorMessage()) { <div class="errorBanner">{{ errorMessage() }}</div> }

      @if (tab() === 'recommend') {
        <section class="panel">
          <label class="stacked">Business workflow
            <textarea [(ngModel)]="workflow" rows="4" [placeholder]="workflowPlaceholder()"></textarea>
          </label>
          <button type="button" class="runBtn" [disabled]="loading() || !workflow.trim()" (click)="runRecommend()">
            {{ loading() ? 'Generating...' : 'Recommend FHIR design' }}
          </button>
          @if (recommendAnswer()) { <div class="answer markdown" [innerHTML]="recommendAnswer() | markdown"></div> }
        </section>
      }

      @if (tab() === 'payload') {
        <section class="panel">
          <div class="fieldRow">
            <label>Artifact
              <select [ngModel]="artifact" (ngModelChange)="onArtifactChange($event)">
                @for (rt of resourceTypes; track rt) { <option [value]="rt">{{ rt }}</option> }
                <option value="Transaction Bundle">Transaction Bundle</option>
                <option value="Batch Bundle">Batch Bundle</option>
                <option value="Document Bundle">Document Bundle</option>
                <option value="Message Bundle">Message Bundle</option>
              </select>
            </label>
          </div>
          <label class="stacked">Generation intent
            <textarea [(ngModel)]="payloadIntent" rows="3" [placeholder]="payloadIntentPlaceholder()"></textarea>
          </label>
          <button type="button" class="runBtn" [disabled]="loading()" (click)="runPayload()">
            {{ loading() ? 'Generating...' : 'Generate artifact' }}
          </button>
          @if (payloadJson()) {
            <pre class="code">{{ payloadJson() }}</pre>
            <div class="issues" [class.ok]="payloadAllOk()">
              <b>{{ payloadAllOk() ? 'Structural check passed' : 'Review needed' }}</b>
              <ul>@for (i of payloadIssues(); track i) { <li>{{ i }}</li> }</ul>
            </div>
          }
        </section>
      }

      @if (tab() === 'api') {
        <section class="panel">
          <div class="fieldRow">
            <label>Resource <select [(ngModel)]="apiResource">@for (rt of resourceTypes; track rt) { <option [value]="rt">{{ rt }}</option> }</select></label>
            <label>Interaction
              <select [(ngModel)]="apiInteraction">
                <option>Search</option><option>Read</option><option>Create</option><option>Update</option><option>Operation</option>
              </select>
            </label>
          </div>
          <label class="stacked">Requirement
            <textarea [(ngModel)]="apiRequirement" rows="3" [placeholder]="apiRequirementPlaceholder()"></textarea>
          </label>
          <button type="button" class="runBtn" [disabled]="loading()" (click)="runApi()">
            {{ loading() ? 'Generating...' : 'Generate API example' }}
          </button>
          @if (apiRequest()) {
            <pre class="code">{{ apiRequest() }}</pre>
            <div class="answer markdown" [innerHTML]="apiExplanation() | markdown"></div>
          }
        </section>
      }

      @if (tab() === 'ig') {
        <section class="panel">
          <div class="fieldRow">
            <label>Resource type in focus <select [(ngModel)]="igResourceType"><option value="">(none)</option>@for (rt of resourceTypes; track rt) { <option [value]="rt">{{ rt }}</option> }</select></label>
          </div>
          <label class="stacked">Question
            <textarea [(ngModel)]="igQuestion" rows="3" [placeholder]="igQuestionPlaceholder()"></textarea>
          </label>
          <button type="button" class="runBtn" [disabled]="loading() || !igQuestion.trim()" (click)="runIg()">
            {{ loading() ? 'Generating...' : 'Explain requirements' }}
          </button>
          @if (igAnswer()) {
            <div class="answer markdown" [innerHTML]="igAnswer() | markdown"></div>
            @if (igChecklist().length) {
              <h3>Implementation checklist</h3>
              <ol class="checklist">@for (c of igChecklist(); track c) { <li>{{ c }}</li> }</ol>
            }
          }
        </section>
      }
    </main>
  `,
  styles: `
    .designPage { padding-top:64px; padding-bottom:100px; }
    .eyebrow { margin:0 0 8px; color:var(--o7); font-size:11px; font-weight:750; letter-spacing:.1em; text-transform:uppercase; }
    h1 { margin:0; color:var(--n9); font-family:var(--display); font-size:40px; }
    .intro { color:var(--n6); max-width:760px; margin-top:10px; }

    .context { display:flex; gap:14px; flex-wrap:wrap; margin-top:24px; }
    .context label { display:flex; flex-direction:column; gap:6px; font-size:12px; font-weight:650; color:var(--n6); }
    .context select { border:1px solid #D7E2EC; border-radius:8px; padding:8px 10px; font-size:13px; min-height:36px; background:#fff; color:var(--n9); }

    .tabs { display:flex; gap:6px; flex-wrap:wrap; margin-top:20px; border-bottom:1px solid #D7E2EC; }
    .tabs button { border:none; background:none; padding:10px 14px; font-size:13px; font-weight:650; color:var(--n5); cursor:pointer; border-bottom:2px solid transparent; }
    .tabs button.active { color:var(--n9); border-bottom-color:var(--b6); }

    .errorBanner { margin-top:16px; background:#fdeeee; color:#c44; border-radius:8px; padding:11px 14px; font-size:12.5px; font-weight:600; }
    .panel { border:1px solid #D7E2EC; border-radius:10px; background:#fff; padding:20px; margin-top:18px; }
    .fieldRow { display:flex; gap:14px; flex-wrap:wrap; margin-bottom:12px; }
    label { display:flex; flex-direction:column; gap:6px; font-size:12px; font-weight:650; color:var(--n6); }
    label.stacked { margin-bottom:12px; }
    select, textarea { border:1px solid #D7E2EC; border-radius:8px; padding:8px 10px; font-size:13px; color:var(--n9); background:#fff; }
    select { min-height:36px; }
    textarea { resize:vertical; font-family:inherit; }

    .runBtn { border:none; background:var(--b6); color:#fff; border-radius:8px; padding:11px 18px; font-size:13px; font-weight:700; cursor:pointer; }
    .runBtn:disabled { opacity:.55; cursor:not-allowed; }
    .runBtn:not(:disabled):hover { filter:brightness(1.05); }

    .answer { margin-top:16px; }
    .code { margin-top:16px; max-height:420px; overflow:auto; background:#0D1B2A; color:#E8EEF4; border-radius:8px; padding:14px; font-family:ui-monospace, Consolas, monospace; font-size:12.5px; line-height:1.6; white-space:pre-wrap; word-break:break-word; }
    .issues { margin-top:12px; border-radius:8px; padding:10px 14px; background:#fdeeee; color:#c44; font-size:12.5px; }
    .issues.ok { background:var(--gr1); color:var(--gr6); }
    .issues ul { margin:6px 0 0; padding-left:18px; }
    h3 { font-family:var(--display); font-size:16px; color:var(--n9); margin:18px 0 8px; }
    .checklist { margin:0; padding-left:20px; color:var(--n7); font-size:13px; line-height:1.8; }
  `,
})
export class DesignPage {
  private readonly api = inject(DesignApi);

  readonly personas = PERSONAS;
  readonly versions = FHIR_VERSIONS;
  readonly igs = IGS;
  readonly resourceTypes = RESOURCE_TYPES;

  readonly tab = signal<DesignTab>('recommend');
  readonly loading = signal(false);
  readonly errorMessage = signal('');

  persona = PERSONAS[0];
  fhirVersion = FHIR_VERSIONS[0];
  ig = IGS[0];

  workflow = 'A provider requests prior authorization for an MRI. The payer needs member coverage, ordering provider, requested service, diagnosis, supporting documentation, determination, and status updates.';
  readonly recommendAnswer = signal('');

  artifact = 'Patient';
  payloadIntent = 'Create a synthetic Patient example with identifier, name, birth date, address, telecom, and communication language.';
  readonly payloadJson = signal('');
  readonly payloadIssues = signal<string[]>([]);
  readonly payloadAllOk = signal(true);

  apiResource = 'Observation';
  apiInteraction = 'Search';
  apiRequirement = 'Find final laboratory Observations for a patient in the last 90 days, include the encounter, return code, value, effective date, interpretation, and status.';
  readonly apiRequest = signal('');
  readonly apiExplanation = signal('');

  igResourceType = 'Patient';
  igQuestion = 'Explain Must Support, cardinality, terminology binding, and slicing for the selected profile. Provide an implementation checklist for a developer.';
  readonly igAnswer = signal('');
  readonly igChecklist = signal<string[]>([]);

  workflowPlaceholder(): string { return WORKFLOW_PLACEHOLDERS[this.persona] ?? WORKFLOW_PLACEHOLDERS[PERSONAS[0]]; }
  payloadIntentPlaceholder(): string { return ARTIFACT_INTENT_TEMPLATES[this.artifact] ?? ARTIFACT_INTENT_TEMPLATES['Patient']; }
  artifactDefault(): string { return ARTIFACT_DEFAULTS[this.persona] ?? ARTIFACT_DEFAULTS[PERSONAS[0]]; }
  apiRequirementPlaceholder(): string { return API_REQUIREMENT_PLACEHOLDERS[this.persona] ?? API_REQUIREMENT_PLACEHOLDERS[PERSONAS[0]]; }
  igQuestionPlaceholder(): string { return IG_QUESTION_PLACEHOLDERS[this.persona] ?? IG_QUESTION_PLACEHOLDERS[PERSONAS[0]]; }

  /** Direct Artifact change (independent of persona) -- keep the intent text and prior result in step. */
  onArtifactChange(artifact: string): void {
    this.artifact = artifact;
    this.payloadIntent = this.payloadIntentPlaceholder();
    this.payloadJson.set('');
    this.payloadIssues.set([]);
  }

  /**
   * Persona, FHIR version, and implementation guide are shared context across all four tabs. Rather
   * than tracking exactly which tab's prompt uses which field (error-prone, and still leaves the
   * other fields unhandled -- e.g. FHIR version affects Payload/API too, not just Recommend/IG), any
   * context change resets every tab's result and re-seeds its prompt with the current persona's
   * example -- as real, editable, ready-to-run text (not just a greyed-out placeholder the button
   * stays disabled against), since the old prompt was framed for the old context.
   */
  private clearAllResults(): void {
    this.workflow = this.workflowPlaceholder();
    this.recommendAnswer.set('');

    this.artifact = this.artifactDefault();
    this.payloadIntent = this.payloadIntentPlaceholder();
    this.payloadJson.set('');
    this.payloadIssues.set([]);

    this.apiRequirement = this.apiRequirementPlaceholder();
    this.apiRequest.set('');
    this.apiExplanation.set('');

    this.igQuestion = this.igQuestionPlaceholder();
    this.igAnswer.set('');
    this.igChecklist.set([]);

    this.errorMessage.set('');
  }

  onPersonaChange(persona: string): void {
    this.persona = persona;
    this.clearAllResults();
  }

  onFhirVersionChange(fhirVersion: string): void {
    this.fhirVersion = fhirVersion;
    this.clearAllResults();
  }

  onIgChange(ig: string): void {
    this.ig = ig;
    this.clearAllResults();
  }

  runRecommend(): void {
    this.loading.set(true);
    this.errorMessage.set('');
    this.api.recommendResources(this.persona, this.fhirVersion, this.ig, this.workflow).subscribe({
      next: (res) => { this.recommendAnswer.set(res.answer); this.loading.set(false); },
      error: (e: HttpErrorResponse) => { this.errorMessage.set(extractErrorMessage(e)); this.loading.set(false); },
    });
  }

  runPayload(): void {
    this.loading.set(true);
    this.errorMessage.set('');
    this.api.generatePayload(this.fhirVersion, this.ig, this.artifact, this.payloadIntent).subscribe({
      next: (res) => {
        this.payloadJson.set(res.json);
        this.payloadIssues.set(res.issues);
        this.payloadAllOk.set(res.valid);
        this.loading.set(false);
      },
      error: (e: HttpErrorResponse) => { this.errorMessage.set(extractErrorMessage(e)); this.loading.set(false); },
    });
  }

  runApi(): void {
    this.loading.set(true);
    this.errorMessage.set('');
    this.api.generateApiExample(this.apiResource, this.apiInteraction, this.apiRequirement, this.fhirVersion).subscribe({
      next: (res) => { this.apiRequest.set(res.request); this.apiExplanation.set(res.explanation); this.loading.set(false); },
      error: (e: HttpErrorResponse) => { this.errorMessage.set(extractErrorMessage(e)); this.loading.set(false); },
    });
  }

  runIg(): void {
    this.loading.set(true);
    this.errorMessage.set('');
    this.api.explainIg(this.persona, this.fhirVersion, this.ig, this.igResourceType, this.igQuestion).subscribe({
      next: (res) => { this.igAnswer.set(res.answer); this.igChecklist.set(res.checklist); this.loading.set(false); },
      error: (e: HttpErrorResponse) => { this.errorMessage.set(extractErrorMessage(e)); this.loading.set(false); },
    });
  }
}
