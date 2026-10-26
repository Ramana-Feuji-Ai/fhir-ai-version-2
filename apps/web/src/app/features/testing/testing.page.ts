import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { TestingApi } from '../../core/testing.api';
import { DefectInjection, GeneratedResource, GenerateTestDataResponse, TestCase, ValidationIssueEntry } from '../../core/models';
import { MarkdownPipe } from '../../core/markdown.pipe';
import { extractErrorMessage } from '../../core/http-error';

type TestingTab = 'cases' | 'data' | 'failure';

const RESOURCE_TYPES = ['Patient', 'Practitioner', 'Organization', 'Encounter', 'Observation', 'Condition', 'MedicationRequest', 'Coverage', 'Claim'];

@Component({
  selector: 'fhi-testing-page',
  standalone: true,
  imports: [CommonModule, FormsModule, MarkdownPipe],
  template: `
    <main class="wrap testingPage">
      <p class="eyebrow">Test Case &amp; Test Data Assistant</p>
      <h1>Testing Assistant</h1>
      <p class="intro">Generate traceable positive/negative/boundary/regression/interoperability/conformance test cases, produce synthetic non-PHI test data (optionally seeded straight into the sandbox), and get validation failures explained with corrective actions.</p>

      <div class="tabs">
        <button type="button" [class.active]="tab() === 'cases'" (click)="tab.set('cases')">Test Case Generator</button>
        <button type="button" [class.active]="tab() === 'data'" (click)="tab.set('data')">Synthetic Test Data</button>
        <button type="button" [class.active]="tab() === 'failure'" (click)="tab.set('failure')">Explain a Failure</button>
      </div>

      @if (errorMessage()) { <div class="errorBanner">{{ errorMessage() }}</div> }

      @if (tab() === 'cases') {
        <section class="panel">
          <div class="fieldRow">
            <label>API / Resource <select [(ngModel)]="caseResource">@for (rt of resourceTypes; track rt) { <option [value]="rt">{{ rt }}</option> }</select></label>
            <label>Test taxonomy
              <select [(ngModel)]="caseTaxonomy">
                <option>Complete suite</option><option>Positive</option><option>Negative</option>
                <option>Boundary</option><option>Regression</option><option>Interoperability</option>
                <option>Conformance</option><option>Security</option>
              </select>
            </label>
          </div>
          <label class="stacked">Acceptance criteria
            <textarea [(ngModel)]="caseCriteria" rows="3" placeholder="Create a valid Patient with a business identifier, name, birth date, and valid gender code."></textarea>
          </label>
          <button type="button" class="runBtn" [disabled]="loading()" (click)="runTestCases()">
            {{ loading() ? 'Generating...' : 'Generate test suite' }}
          </button>

          @if (cases().length) {
            <div class="exportRow">
              <span>{{ cases().length }} test case(s)</span>
              <button type="button" class="linkBtn" (click)="exportCsv()">Export CSV</button>
              <button type="button" class="linkBtn" (click)="exportJson()">Export JSON</button>
            </div>
            <table>
              <tr><th>ID</th><th>Type</th><th>Scenario</th><th>Expected result</th></tr>
              @for (c of cases(); track c.id) {
                <tr><td>{{ c.id }}</td><td>{{ c.type }}</td><td>{{ c.scenario }}</td><td>{{ c.expectedResult }}</td></tr>
              }
            </table>
          }
        </section>
      }

      @if (tab() === 'data') {
        <section class="panel">
          <div class="fieldRow">
            <label>Scenario
              <select [(ngModel)]="dataScenario">
                <option>Provider clinical encounter</option><option>Payer coverage and claim</option>
                <option>Prior authorization</option><option>Care coordination</option>
              </select>
            </label>
            <label>Dataset size
              <select [(ngModel)]="patientCountLabel" (ngModelChange)="onSizeChange($event)">
                <option value="10">Small · 10 patients</option>
                <option value="100">Medium · 100 patients</option>
                <option value="1000">Large · 1,000 patients</option>
              </select>
            </label>
            <label>Defect injection
              <select [(ngModel)]="defectInjection">
                <option value="NONE">None</option>
                <option value="TERMINOLOGY">Terminology defects</option>
                <option value="REFERENCE">Reference defects</option>
                <option value="MIXED">Mixed negative dataset</option>
              </select>
            </label>
            <label>Seed <input type="number" [(ngModel)]="seed" /></label>
          </div>
          <label class="checkboxRow">
            <input type="checkbox" [(ngModel)]="writeToSandbox" />
            Write valid resources into the developer sandbox (PRD 8.2) so I can practice against them immediately
          </label>
          <button type="button" class="runBtn" [disabled]="loading()" (click)="runTestData()">
            {{ loading() ? 'Generating...' : 'Generate dataset' }}
          </button>

          @if (dataResult(); as result) {
            <div class="metricrow">
              @for (entry of resourceCountEntries(); track entry[0]) {
                <div class="metric"><b>{{ entry[1] }}</b><span>{{ entry[0] }}</span></div>
              }
            </div>
            <div class="notice" [class.warn]="result.defectCount > 0">
              Seed {{ result.seed }} · {{ result.fhirVersion }} · {{ result.defectCount }} intentional defect(s)
              @if (writeToSandbox) { · {{ result.writtenToSandboxCount }} resource(s) written to sandbox }
              · no PHI used
            </div>
            <div class="exportRow">
              <button type="button" class="linkBtn" (click)="downloadBundle(result.bundleJson)">Download Bundle JSON</button>
            </div>
            @if (invalidResources().length) {
              <h3>Flagged as invalid (kept in the dataset for negative testing)</h3>
              <table>
                <tr><th>Type</th><th>Id</th><th>Written</th><th>Issues</th></tr>
                @for (r of invalidResources(); track r.id) {
                  <tr><td>{{ r.resourceType }}</td><td>{{ r.id }}</td><td>{{ r.writtenToSandbox ? 'Yes' : 'No' }}</td><td>{{ r.issues.join('; ') }}</td></tr>
                }
              </table>
            }
          }
        </section>
      }

      @if (tab() === 'failure') {
        <section class="panel">
          <div class="fieldRow">
            <label>Resource type <select [(ngModel)]="failureResourceType"><option value="">(unspecified)</option>@for (rt of resourceTypes; track rt) { <option [value]="rt">{{ rt }}</option> }</select></label>
          </div>
          <label class="stacked">Payload (FHIR JSON, optional)
            <textarea class="bodyEditor" [(ngModel)]="failurePayload" rows="8" spellcheck="false" placeholder='{"resourceType":"Patient","gender":"unknown"}'></textarea>
          </label>
          <label class="stacked">Observed error / OperationOutcome text
            <textarea [(ngModel)]="failureError" rows="3" placeholder="400 Bad Request: Patient.identifier is required"></textarea>
          </label>
          <button type="button" class="runBtn" [disabled]="loading()" (click)="runExplainFailure()">
            {{ loading() ? 'Explaining...' : 'Explain failure' }}
          </button>

          @if (failureIssues().length) {
            <table>
              <tr><th>Severity</th><th>Path</th><th>Diagnostics</th></tr>
              @for (i of failureIssues(); track i.expression) {
                <tr><td>{{ i.severity }}</td><td>{{ i.expression }}</td><td>{{ i.diagnostics }}</td></tr>
              }
            </table>
          }
          @if (failureExplanation()) { <div class="answer markdown" [innerHTML]="failureExplanation() | markdown"></div> }
        </section>
      }
    </main>
  `,
  styles: `
    .testingPage { padding-top:64px; padding-bottom:100px; }
    .eyebrow { margin:0 0 8px; color:var(--o7); font-size:11px; font-weight:750; letter-spacing:.1em; text-transform:uppercase; }
    h1 { margin:0; color:var(--n9); font-family:var(--display); font-size:40px; }
    .intro { color:var(--n6); max-width:760px; margin-top:10px; }

    .tabs { display:flex; gap:6px; flex-wrap:wrap; margin-top:24px; border-bottom:1px solid #D7E2EC; }
    .tabs button { border:none; background:none; padding:10px 14px; font-size:13px; font-weight:650; color:var(--n5); cursor:pointer; border-bottom:2px solid transparent; }
    .tabs button.active { color:var(--n9); border-bottom-color:var(--b6); }

    .errorBanner { margin-top:16px; background:#fdeeee; color:#c44; border-radius:8px; padding:11px 14px; font-size:12.5px; font-weight:600; }
    .panel { border:1px solid #D7E2EC; border-radius:10px; background:#fff; padding:20px; margin-top:18px; }
    .fieldRow { display:flex; gap:14px; flex-wrap:wrap; margin-bottom:12px; }
    label { display:flex; flex-direction:column; gap:6px; font-size:12px; font-weight:650; color:var(--n6); }
    label.stacked { margin-bottom:12px; }
    label.checkboxRow { flex-direction:row; align-items:center; gap:8px; font-weight:600; margin-bottom:14px; }
    select, textarea, input[type=number] { border:1px solid #D7E2EC; border-radius:8px; padding:8px 10px; font-size:13px; color:var(--n9); background:#fff; }
    select, input[type=number] { min-height:36px; }
    textarea { resize:vertical; font-family:inherit; width:100%; box-sizing:border-box; }
    .bodyEditor { font-family:ui-monospace, Consolas, monospace; font-size:12.5px; }

    .runBtn { border:none; background:var(--b6); color:#fff; border-radius:8px; padding:11px 18px; font-size:13px; font-weight:700; cursor:pointer; }
    .runBtn:disabled { opacity:.55; cursor:not-allowed; }
    .runBtn:not(:disabled):hover { filter:brightness(1.05); }
    .linkBtn { border:1px solid #D7E2EC; background:#fff; color:var(--n7); border-radius:7px; padding:6px 12px; font-size:12px; font-weight:650; cursor:pointer; }
    .linkBtn:hover { background:var(--n0); }

    .exportRow { display:flex; align-items:center; gap:10px; margin-top:18px; font-size:12px; color:var(--n5); }
    table { width:100%; border-collapse:collapse; font-size:12px; margin-top:14px; }
    th, td { text-align:left; padding:8px 10px; border-bottom:1px solid var(--n1); vertical-align:top; }
    th { background:var(--n0); color:var(--n7); }

    .metricrow { display:grid; grid-template-columns:repeat(auto-fit, minmax(110px, 1fr)); gap:12px; margin-top:18px; }
    .metric { border:1px solid #D7E2EC; border-radius:10px; padding:12px; text-align:center; }
    .metric b { display:block; font-size:20px; color:var(--n9); }
    .metric span { font-size:10px; color:var(--n5); }
    .notice { margin-top:14px; background:var(--gr1); color:var(--gr6); border-radius:8px; padding:10px 13px; font-size:12px; }
    .notice.warn { background:var(--o1); color:#75400C; }
    .answer { margin-top:16px; }
    h3 { font-family:var(--display); font-size:15px; color:var(--n9); margin:18px 0 8px; }
  `,
})
export class TestingPage {
  private readonly api = inject(TestingApi);

  readonly resourceTypes = RESOURCE_TYPES;
  readonly tab = signal<TestingTab>('cases');
  readonly loading = signal(false);
  readonly errorMessage = signal('');

  caseResource = 'Patient';
  caseTaxonomy = 'Complete suite';
  caseCriteria = 'Create a valid Patient with a business identifier, name, birth date, and valid gender code; reject requests missing any of those.';
  readonly cases = signal<TestCase[]>([]);

  dataScenario = 'Provider clinical encounter';
  patientCountLabel = '10';
  patientCount = 10;
  defectInjection: DefectInjection = 'NONE';
  seed: number | null = 36001;
  writeToSandbox = false;
  readonly dataResult = signal<GenerateTestDataResponse | null>(null);
  readonly resourceCountEntries = signal<[string, number][]>([]);
  readonly invalidResources = signal<GeneratedResource[]>([]);

  failureResourceType = 'Patient';
  failurePayload = '{"resourceType":"Patient","gender":"unknown","birthDate":"2085-01-01"}';
  failureError = '';
  readonly failureIssues = signal<ValidationIssueEntry[]>([]);
  readonly failureExplanation = signal('');

  onSizeChange(value: string): void {
    this.patientCount = Number(value);
  }

  runTestCases(): void {
    this.loading.set(true);
    this.errorMessage.set('');
    this.api.generateTestCases(this.caseResource, this.caseTaxonomy, this.caseCriteria).subscribe({
      next: (res) => { this.cases.set(res.cases); this.loading.set(false); },
      error: (e: HttpErrorResponse) => { this.errorMessage.set(extractErrorMessage(e)); this.loading.set(false); },
    });
  }

  runTestData(): void {
    this.loading.set(true);
    this.errorMessage.set('');
    this.api.generateTestData(this.dataScenario, this.patientCount, 'FHIR R4', this.defectInjection, this.seed, this.writeToSandbox).subscribe({
      next: (res) => {
        this.dataResult.set(res);
        this.resourceCountEntries.set(Object.entries(res.resourceCounts) as [string, number][]);
        this.invalidResources.set(res.resources.filter((r) => !r.valid));
        this.loading.set(false);
      },
      error: (e: HttpErrorResponse) => { this.errorMessage.set(extractErrorMessage(e)); this.loading.set(false); },
    });
  }

  runExplainFailure(): void {
    this.loading.set(true);
    this.errorMessage.set('');
    this.api.explainFailure(this.failureResourceType, this.failurePayload, this.failureError).subscribe({
      next: (res) => { this.failureIssues.set(res.issues); this.failureExplanation.set(res.explanation); this.loading.set(false); },
      error: (e: HttpErrorResponse) => { this.errorMessage.set(extractErrorMessage(e)); this.loading.set(false); },
    });
  }

  exportCsv(): void {
    const header = 'ID,Type,Scenario,Expected Result';
    const rows = this.cases().map((c) => [c.id, c.type, c.scenario, c.expectedResult].map(csvCell).join(','));
    this.download([header, ...rows].join('\n'), 'text/csv', `test-cases-${this.caseResource}.csv`);
  }

  exportJson(): void {
    this.download(JSON.stringify(this.cases(), null, 2), 'application/json', `test-cases-${this.caseResource}.json`);
  }

  downloadBundle(bundleJson: string): void {
    this.download(bundleJson, 'application/json', `synthetic-dataset-${this.seed ?? 'seed'}.json`);
  }

  private download(content: string, type: string, filename: string): void {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }
}

function csvCell(value: string): string {
  return `"${(value ?? '').replace(/"/g, '""')}"`;
}
