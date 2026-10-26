import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { SandboxApi } from '../../core/sandbox.api';
import { SandboxMeta, SandboxOperation, SandboxRequestLogEntry } from '../../core/models';

type UiOperation = 'read' | 'search' | 'create' | 'update' | 'delete' | 'history' | 'bundle';

const RESOURCE_TYPES = [
  'Patient', 'Practitioner', 'Organization', 'Encounter', 'Observation',
  'Condition', 'MedicationRequest', 'Coverage', 'Claim',
];

const CREATE_TEMPLATES: Record<string, unknown> = {
  Patient: { resourceType: 'Patient', identifier: [{ system: 'http://hospital.example.org/mrn', value: 'MRN-000000' }], name: [{ family: 'Doe', given: ['Jane'] }], gender: 'unknown' },
  Practitioner: { resourceType: 'Practitioner', identifier: [{ system: 'http://hl7.org/fhir/sid/us-npi', value: '1000000000' }], name: [{ family: 'Practitioner', given: ['New'] }] },
  Organization: { resourceType: 'Organization', name: 'New Organization' },
  Encounter: { resourceType: 'Encounter', status: 'in-progress', class: { system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode', code: 'AMB', display: 'ambulatory' }, subject: { reference: 'Patient/patient-001' } },
  Observation: { resourceType: 'Observation', status: 'final', code: { coding: [{ system: 'http://loinc.org', code: '8867-4', display: 'Heart rate' }] }, subject: { reference: 'Patient/patient-001' }, valueQuantity: { value: 72, unit: '/min' } },
  Condition: { resourceType: 'Condition', subject: { reference: 'Patient/patient-001' }, code: { coding: [{ system: 'http://snomed.info/sct', code: '38341003', display: 'Hypertension' }] } },
  MedicationRequest: { resourceType: 'MedicationRequest', status: 'active', intent: 'order', medicationCodeableConcept: { coding: [{ system: 'http://www.nlm.nih.gov/research/umls/rxnorm', code: '197361', display: 'Amoxicillin 250 MG' }] }, subject: { reference: 'Patient/patient-001' } },
  Coverage: { resourceType: 'Coverage', status: 'active', beneficiary: { reference: 'Patient/patient-001' }, payor: [{ reference: 'Organization/org-payer-01' }] },
  Claim: { resourceType: 'Claim', status: 'active', type: { coding: [{ system: 'http://terminology.hl7.org/CodeSystem/claim-type', code: 'professional' }] }, patient: { reference: 'Patient/patient-001' }, provider: { reference: 'Organization/org-provider-01' } },
};

const TRANSACTION_TEMPLATE = {
  resourceType: 'Bundle',
  type: 'transaction',
  entry: [
    { request: { method: 'GET', url: 'Patient/patient-001' } },
    {
      request: { method: 'POST', url: 'Observation' },
      resource: {
        resourceType: 'Observation', status: 'final',
        code: { coding: [{ system: 'http://loinc.org', code: '8867-4', display: 'Heart rate' }] },
        subject: { reference: 'Patient/patient-001' },
        valueQuantity: { value: 72, unit: '/min' },
      },
    },
  ],
};

const BATCH_TEMPLATE = {
  resourceType: 'Bundle',
  type: 'batch',
  entry: [
    { request: { method: 'GET', url: 'Patient/does-not-exist' } },
    { request: { method: 'GET', url: 'Patient/patient-002' } },
  ],
};

@Component({
  selector: 'fhi-sandbox-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <main class="wrap sandboxPage">
      <p class="eyebrow">Developer Workbench</p>
      <h1>FHIR Sandbox</h1>
      <p class="intro">Practice FHIR REST calls -- read, search, create, update, delete, history, and transaction/batch bundles -- against a simulated server with sample payer and provider data. Nothing here touches a production system.</p>

      <section class="datasetBar">
        <div class="chips">
          @for (rt of resourceTypeSummaries(); track rt.resourceType) {
            <span class="chip">{{ rt.resourceType }} <b>{{ rt.count }}</b></span>
          }
        </div>
        <button type="button" class="resetBtn" [disabled]="resetting()" (click)="resetDataset()">
          {{ resetting() ? 'Resetting...' : 'Reset dataset' }}
        </button>
      </section>

      <section class="workbench">
        <div class="requestPanel">
          <div class="fieldRow">
            <label>
              Operation
              <select [ngModel]="operation()" (ngModelChange)="setOperation($event)">
                <option value="read">Read</option>
                <option value="search">Search</option>
                <option value="create">Create</option>
                <option value="update">Update</option>
                <option value="delete">Delete</option>
                <option value="history">History</option>
                <option value="bundle">Transaction / Batch</option>
              </select>
            </label>
            @if (operation() !== 'bundle') {
              <label>
                Resource type
                <select [ngModel]="resourceType()" (ngModelChange)="resourceType.set($event)">
                  @for (rt of resourceTypeOptions; track rt) {
                    <option [value]="rt">{{ rt }}</option>
                  }
                </select>
              </label>
            }
          </div>

          @if (operation() === 'read' || operation() === 'update' || operation() === 'delete' || operation() === 'history') {
            <label class="stacked">
              Resource id
              <input type="text" [(ngModel)]="resourceIdInput" placeholder="e.g. patient-001" />
            </label>
            @if (sampleIdsForType().length) {
              <div class="sampleIds">
                <span>Sample ids:</span>
                @for (sid of sampleIdsForType(); track sid) {
                  <button type="button" class="idChip" (click)="resourceIdInput = sid">{{ sid }}</button>
                }
              </div>
            }
            @if (operation() === 'update') {
              <button type="button" class="linkBtn" (click)="loadCurrentForEdit()">Load current version into editor</button>
            }
          }

          @if (operation() === 'search') {
            <div class="paramRows">
              @for (row of searchParams(); track $index) {
                <div class="paramRow">
                  <input type="text" [(ngModel)]="row.key" placeholder="param (e.g. name, status, gender)" />
                  <input type="text" [(ngModel)]="row.value" placeholder="value" />
                  <button type="button" class="iconBtn" (click)="removeParamRow($index)" title="Remove">✕</button>
                </div>
              }
            </div>
            <button type="button" class="linkBtn" (click)="addParamRow()">+ Add param</button>
          }

          @if (operation() === 'create' || operation() === 'update' || operation() === 'bundle') {
            <div class="bodyHeader">
              <span>Request body (JSON)</span>
              @if (operation() === 'create' || operation() === 'update') {
                <button type="button" class="linkBtn" (click)="insertTemplate()">Insert template</button>
              }
              @if (operation() === 'bundle') {
                <button type="button" class="linkBtn" (click)="requestBodyInput = stringify(transactionTemplate)">Transaction template</button>
                <button type="button" class="linkBtn" (click)="requestBodyInput = stringify(batchTemplate)">Batch template</button>
              }
            </div>
            <textarea class="bodyEditor" [(ngModel)]="requestBodyInput" spellcheck="false" rows="14"></textarea>
          }

          <button type="button" class="sendBtn" [disabled]="loading() || !canSend()" (click)="send()">
            {{ loading() ? 'Sending...' : 'Send request' }}
          </button>
        </div>

        <div class="responsePanel">
          <div class="responseHeader">
            <span>Response</span>
            @if (response()) {
              <span class="statusBadge" [class.ok]="response()!.ok" [class.err]="!response()!.ok">{{ response()!.status }}</span>
            }
          </div>
          @if (response()) {
            <pre class="responseBody">{{ response()!.body || '(no content)' }}</pre>
          } @else {
            <p class="emptyState">Send a request to see the FHIR response here, including OperationOutcome details for invalid requests.</p>
          }
        </div>
      </section>

      @if (log().length) {
        <section class="historySection">
          <h2>Recent requests</h2>
          <div class="historyList">
            @for (entry of log(); track entry.id) {
              <button type="button" class="historyEntry" [class.err]="!entry.ok" (click)="replay(entry)">
                <span class="histMethod">{{ entry.method }}</span>
                <span class="histUrl">{{ entry.url }}</span>
                <span class="histStatus" [class.ok]="entry.ok" [class.err]="!entry.ok">{{ entry.status }}</span>
              </button>
            }
          </div>
        </section>
      }
    </main>
  `,
  styles: `
    .sandboxPage { padding-top:64px; padding-bottom:100px; }
    .eyebrow { margin:0 0 8px; color:var(--o7); font-size:11px; font-weight:750; letter-spacing:.1em; text-transform:uppercase; }
    h1 { margin:0; color:var(--n9); font-family:var(--display); font-size:40px; }
    .intro { color:var(--n6); max-width:760px; margin-top:10px; }

    .datasetBar { display:flex; align-items:center; justify-content:space-between; gap:16px; margin-top:28px; flex-wrap:wrap; }
    .chips { display:flex; flex-wrap:wrap; gap:8px; }
    .chip { display:inline-flex; align-items:center; gap:6px; padding:5px 10px; border-radius:20px; background:var(--n0); border:1px solid #D7E2EC; font-size:12px; color:var(--n7); }
    .chip b { color:var(--b6); }
    .resetBtn { border:1px solid #D7E2EC; background:#fff; color:var(--n7); border-radius:8px; padding:8px 14px; font-size:12px; font-weight:650; cursor:pointer; }
    .resetBtn:hover { background:var(--n0); }
    .resetBtn:disabled { opacity:.6; cursor:not-allowed; }

    .workbench { display:grid; grid-template-columns:1fr 1fr; gap:20px; margin-top:24px; align-items:start; }
    @media (max-width: 900px) { .workbench { grid-template-columns:1fr; } }

    .requestPanel, .responsePanel { border:1px solid #D7E2EC; border-radius:10px; background:#fff; padding:18px; }
    .fieldRow { display:flex; gap:14px; flex-wrap:wrap; margin-bottom:12px; }
    label { display:flex; flex-direction:column; gap:6px; font-size:12px; font-weight:650; color:var(--n6); }
    label.stacked { margin-bottom:8px; }
    select, input[type=text] { border:1px solid #D7E2EC; border-radius:8px; padding:8px 10px; font-size:13px; color:var(--n9); background:#fff; min-height:36px; }

    .sampleIds { display:flex; align-items:center; flex-wrap:wrap; gap:6px; margin-bottom:10px; font-size:11px; color:var(--n5); }
    .idChip { border:1px solid #D7E2EC; background:var(--n0); border-radius:14px; padding:3px 9px; font-size:11px; color:var(--n7); cursor:pointer; }
    .idChip:hover { background:#fff; border-color:var(--b6); color:var(--b6); }

    .linkBtn { border:none; background:none; color:var(--b6); font-size:12px; font-weight:650; cursor:pointer; padding:0; text-align:left; margin-bottom:8px; }
    .linkBtn:hover { text-decoration:underline; }

    .paramRows { display:flex; flex-direction:column; gap:8px; margin-bottom:6px; }
    .paramRow { display:grid; grid-template-columns:1fr 1fr auto; gap:8px; align-items:center; }
    .iconBtn { border:1px solid #D7E2EC; background:#fff; border-radius:6px; width:32px; height:32px; cursor:pointer; color:var(--n5); }
    .iconBtn:hover { background:var(--n0); }

    .bodyHeader { display:flex; align-items:center; gap:14px; font-size:12px; font-weight:650; color:var(--n6); margin:10px 0 6px; }
    .bodyEditor { width:100%; box-sizing:border-box; background:#0D1B2A; color:#E8EEF4; border:none; border-radius:8px; padding:14px; font-family:ui-monospace, Consolas, monospace; font-size:12.5px; line-height:1.6; resize:vertical; }

    .sendBtn { margin-top:16px; border:none; background:var(--b6); color:#fff; border-radius:8px; padding:11px 18px; font-size:13px; font-weight:700; cursor:pointer; }
    .sendBtn:disabled { opacity:.55; cursor:not-allowed; }
    .sendBtn:not(:disabled):hover { filter:brightness(1.05); }

    .responseHeader { display:flex; align-items:center; justify-content:space-between; font-size:12px; font-weight:650; color:var(--n6); margin-bottom:10px; }
    .statusBadge { border-radius:6px; padding:2px 8px; font-size:11px; font-weight:750; }
    .statusBadge.ok { background:var(--gr1); color:var(--gr6); }
    .statusBadge.err { background:#fdeeee; color:#c44; }
    .responseBody { margin:0; max-height:520px; overflow:auto; background:#0D1B2A; color:#E8EEF4; border-radius:8px; padding:14px; font-family:ui-monospace, Consolas, monospace; font-size:12.5px; line-height:1.6; white-space:pre-wrap; word-break:break-word; }
    .emptyState { color:var(--n5); font-size:13px; }

    .historySection { margin-top:32px; }
    .historySection h2 { font-family:var(--display); font-size:18px; color:var(--n9); margin:0 0 12px; }
    .historyList { display:flex; flex-direction:column; gap:6px; }
    .historyEntry { display:grid; grid-template-columns:64px 1fr auto; gap:12px; align-items:center; text-align:left; border:1px solid #D7E2EC; background:#fff; border-radius:8px; padding:9px 12px; cursor:pointer; font-family:ui-monospace, Consolas, monospace; font-size:12px; }
    .historyEntry:hover { background:var(--n0); }
    .histMethod { font-weight:750; color:var(--n7); }
    .histUrl { color:var(--n6); overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
    .histStatus { font-weight:750; }
    .histStatus.ok { color:var(--gr6); }
    .histStatus.err { color:#c44; }
  `,
})
export class SandboxPage implements OnInit {
  private readonly api = inject(SandboxApi);

  readonly resourceTypeOptions = RESOURCE_TYPES;
  readonly transactionTemplate = TRANSACTION_TEMPLATE;
  readonly batchTemplate = BATCH_TEMPLATE;

  readonly meta = signal<SandboxMeta | null>(null);
  readonly operation = signal<UiOperation>('read');
  readonly resourceType = signal<string>('Patient');
  readonly searchParams = signal<{ key: string; value: string }[]>([{ key: 'name', value: '' }]);
  readonly loading = signal(false);
  readonly resetting = signal(false);
  readonly response = signal<{ status: number; ok: boolean; body: string } | null>(null);
  readonly log = signal<SandboxRequestLogEntry[]>([]);

  resourceIdInput = '';
  requestBodyInput = '';

  readonly resourceTypeSummaries = computed(() => this.meta()?.resourceTypes ?? []);
  readonly sampleIdsForType = computed(() => {
    const type = this.resourceType();
    return this.meta()?.resourceTypes.find((rt) => rt.resourceType === type)?.sampleIds ?? [];
  });

  ngOnInit(): void {
    this.loadMeta();
  }

  private loadMeta(): void {
    this.api.meta().subscribe({ next: (meta) => this.meta.set(meta) });
  }

  setOperation(op: UiOperation): void {
    this.operation.set(op);
    if ((op === 'create' || op === 'update') && !this.requestBodyInput.trim()) {
      this.insertTemplate();
    }
    if (op === 'bundle' && !this.requestBodyInput.trim()) {
      this.requestBodyInput = this.stringify(TRANSACTION_TEMPLATE);
    }
  }

  insertTemplate(): void {
    const template = CREATE_TEMPLATES[this.resourceType()];
    if (!template) return;
    if (this.operation() === 'update') {
      this.requestBodyInput = this.stringify({ ...(template as object), id: this.resourceIdInput || undefined });
    } else {
      this.requestBodyInput = this.stringify(template);
    }
  }

  loadCurrentForEdit(): void {
    if (!this.resourceIdInput) return;
    this.api.read(this.resourceType(), this.resourceIdInput).subscribe({
      next: (res) => {
        const body = { ...(res.body as Record<string, unknown>) };
        delete body['meta'];
        this.requestBodyInput = this.stringify(body);
      },
    });
  }

  addParamRow(): void {
    this.searchParams.update((rows) => [...rows, { key: '', value: '' }]);
  }

  removeParamRow(index: number): void {
    this.searchParams.update((rows) => rows.filter((_, i) => i !== index));
  }

  canSend(): boolean {
    switch (this.operation()) {
      case 'read':
      case 'delete':
      case 'history':
        return !!this.resourceIdInput.trim();
      case 'update':
        return !!this.resourceIdInput.trim() && !!this.requestBodyInput.trim();
      case 'create':
      case 'bundle':
        return !!this.requestBodyInput.trim();
      default:
        return true;
    }
  }

  stringify(value: unknown): string {
    return JSON.stringify(value, null, 2);
  }

  send(): void {
    this.loading.set(true);
    const type = this.resourceType();
    const id = this.resourceIdInput.trim();

    switch (this.operation()) {
      case 'read':
        this.dispatch('read', 'GET', `${type}/${id}`, null, this.api.read(type, id));
        break;
      case 'search': {
        const params: Record<string, string> = {};
        for (const row of this.searchParams()) {
          if (row.key.trim() && row.value.trim()) params[row.key.trim()] = row.value.trim();
        }
        const qs = Object.entries(params).map(([k, v]) => `${k}=${v}`).join('&');
        this.dispatch('search', 'GET', qs ? `${type}?${qs}` : type, null, this.api.search(type, params));
        break;
      }
      case 'create':
        this.dispatch('create', 'POST', type, this.requestBodyInput, this.api.create(type, this.requestBodyInput));
        break;
      case 'update':
        this.dispatch('update', 'PUT', `${type}/${id}`, this.requestBodyInput, this.api.update(type, id, this.requestBodyInput));
        break;
      case 'delete':
        this.dispatch('delete', 'DELETE', `${type}/${id}`, null, this.api.delete(type, id));
        break;
      case 'history':
        this.dispatch('history', 'GET', `${type}/${id}/_history`, null, this.api.history(type, id));
        break;
      case 'bundle': {
        const bundleType = this.parseBundleType(this.requestBodyInput);
        this.dispatch(bundleType, 'POST', '(Bundle)', this.requestBodyInput, this.api.processBundle(this.requestBodyInput));
        break;
      }
    }
  }

  private dispatch(
    operation: SandboxOperation,
    method: string,
    url: string,
    requestBody: string | null,
    obs: Observable<HttpResponse<any>>
  ): void {
    obs.subscribe({
      next: (res) => this.finish(operation, method, url, requestBody, res.status, true, res.body),
      error: (err: HttpErrorResponse) => this.finish(operation, method, url, requestBody, err.status, false, err.error),
    });
  }

  private finish(operation: SandboxOperation, method: string, url: string, requestBody: string | null, status: number, ok: boolean, body: unknown): void {
    this.loading.set(false);
    const bodyText = this.formatBody(body);
    this.response.set({ status, ok, body: bodyText });
    const entry: SandboxRequestLogEntry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      timestamp: new Date().toISOString(),
      operation, method, url, requestBody, status, ok,
      responseBody: bodyText,
    };
    this.log.update((entries) => [entry, ...entries].slice(0, 25));
    if (['create', 'update', 'delete'].includes(operation)) this.loadMeta();
  }

  replay(entry: SandboxRequestLogEntry): void {
    this.response.set({ status: entry.status, ok: entry.ok, body: entry.responseBody });
  }

  resetDataset(): void {
    if (!confirm('Reset the sandbox dataset to its seeded baseline? Any resources you created, updated, or deleted in this session will be discarded.')) return;
    this.resetting.set(true);
    this.api.reset().subscribe({
      next: () => {
        this.resetting.set(false);
        this.loadMeta();
        this.log.set([]);
        this.response.set(null);
      },
      error: () => this.resetting.set(false),
    });
  }

  private parseBundleType(body: string): SandboxOperation {
    try {
      const parsed = JSON.parse(body);
      return parsed?.type === 'batch' ? 'batch' : 'transaction';
    } catch {
      return 'transaction';
    }
  }

  private formatBody(body: unknown): string {
    if (body == null) return '';
    if (typeof body === 'string') {
      try { return JSON.stringify(JSON.parse(body), null, 2); } catch { return body; }
    }
    try { return JSON.stringify(body, null, 2); } catch { return String(body); }
  }
}
