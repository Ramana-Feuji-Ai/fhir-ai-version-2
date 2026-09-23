import { Component, Input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'fhi-lab-widget',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="labWidget">
      <div class="labHeader">
        <span class="labBadge">Mock Assessment</span>
        <div>
          <h5>{{ data.title }}</h5>
          <p class="labDesc">{{ data.description }}</p>
          <ol class="labHowTo">
            <li>Click <b>Start</b> on a step.</li>
            <li>Copy the command and run it in a terminal (or Postman / Insomnia).</li>
            <li>Compare the response to the expected output.</li>
            <li>Click <b>Mark complete</b>, then finish the remaining steps.</li>
          </ol>
        </div>
      </div>
      
      @if (data.steps) {
        <div class="labSteps">
          @for (step of data.steps; track step.id; let i = $index) {
            <div class="labStep" [class.completed]="completedSteps().includes(step.id)" [class.current]="currentStep() === step.id">
              <div class="stepNumber">{{ i + 1 }}</div>
              <div class="stepContent">
                <div class="stepHead">
                  <div class="stepTitle">{{ step.title }}</div>
                  <div class="stepActions">
                    @if (!completedSteps().includes(step.id) && currentStep() !== step.id) {
                      <button class="btn small" (click)="startStep(step.id)">Start this step</button>
                    }
                    @if (currentStep() === step.id && !completedSteps().includes(step.id)) {
                      <button class="btn primary small" (click)="completeStep(step.id)">I ran it — mark complete</button>
                    }
                    @if (completedSteps().includes(step.id)) {
                      <span class="stepDone">✓ Done</span>
                    }
                  </div>
                </div>
                <p class="stepDesc">{{ step.description }}</p>
                <p class="stepAction">
                  <span class="actionLabel">What you do</span>
                  {{ step.action || 'Copy the command below, run it against the test FHIR server, then mark the step complete.' }}
                </p>
                @if (step.command) {
                  <div class="commandBlock">
                    <div class="commandLabel">
                      <span>Command to run</span>
                      <button class="copyBtn" type="button" (click)="copyCommand(step.command)">
                        {{ copiedId() === step.id ? 'Copied' : 'Copy' }}
                      </button>
                    </div>
                    <div class="stepCommand">
                      <pre><code>{{ step.command }}</code></pre>
                    </div>
                  </div>
                }
                @if (step.expectedOutput) {
                  <div class="expectedOutput">
                    <span class="outputLabel">You should see something like</span>
                    <pre>{{ step.expectedOutput }}</pre>
                  </div>
                }
              </div>
            </div>
          }
        </div>
      }

      @if (data.fhirServer) {
        <div class="fhirServerInfo">
          <div class="serverBadge">FHIR Server</div>
          <div class="serverUrl">{{ data.fhirServer.baseUrl }}</div>
          @if (data.fhirServer.capabilities) {
            <div class="serverCaps">
              @for (cap of data.fhirServer.capabilities; track cap) {
                <span class="capTag">{{ cap }}</span>
              }
            </div>
          }
        </div>
      }

      @if (allStepsCompleted() && !labCompleted()) {
        <div class="labCompleteBanner">
          <span class="completeIcon">🎉</span>
          <div>
            <strong>Lab Complete!</strong>
            <p>All steps completed. Great work!</p>
          </div>
          <button class="btn primary" (click)="finishLab()">Finish Lab</button>
        </div>
      }
    </div>
  `,
  styles: `
    .labWidget {
      background: white;
      border: 1px solid #D7E2EC;
      border-radius: 10px;
      padding: 20px;
      min-width: 0;
      max-width: 100%;
      overflow: hidden;
    }
    :host {
      display: block;
      min-width: 0;
      max-width: 100%;
    }
    .labHeader {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      margin-bottom: 20px;
      padding-bottom: 16px;
      border-bottom: 1px solid var(--n1);
    }
    .labBadge {
      flex: none;
      padding: 4px 10px;
      background: var(--gr1);
      color: var(--gr6);
      border-radius: 999px;
      font-size: 11px;
      font-weight: 650;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      margin-top: 2px;
    }
    .labHeader h5 {
      margin: 0 0 4px;
      font-size: 15px;
      color: var(--n9);
    }
    .labDesc {
      margin: 0 0 10px;
      font-size: 13px;
      color: var(--n5);
    }
    .labHowTo {
      margin: 0;
      padding: 0 0 0 18px;
      font-size: 12px;
      color: var(--n6);
      line-height: 1.55;
    }
    .labHowTo b { color: var(--n8); }
    .labStep {
      display: grid;
      grid-template-columns: 32px minmax(0, 1fr);
      align-items: flex-start;
      gap: 16px;
      padding: 16px;
      background: var(--n0);
      border-radius: 8px;
      margin-bottom: 12px;
      transition: all 0.2s ease;
      border: 1px solid transparent;
      min-width: 0;
    }
    .labStep.current {
      border-color: var(--b6);
      background: var(--b1);
    }
    .labStep.completed {
      border-color: var(--gr6);
      background: var(--gr1);
    }
    .stepNumber {
      flex: none;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: var(--n1);
      color: var(--n6);
      display: grid;
      place-items: center;
      font-weight: 650;
      font-size: 13px;
    }
    .labStep.current .stepNumber {
      background: var(--b6);
      color: white;
    }
    .labStep.completed .stepNumber {
      background: var(--gr6);
      color: white;
    }
    .stepContent {
      flex: 1;
      min-width: 0;
    }
    .stepTitle {
      font-weight: 600;
      color: var(--n9);
      min-width: 0;
    }
    .stepHead {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 12px;
      margin-bottom: 4px;
    }
    .stepDesc {
      margin: 0 0 8px;
      font-size: 13px;
      color: var(--n6);
      line-height: 1.5;
    }
    .stepAction {
      margin: 0 0 10px;
      font-size: 13px;
      color: var(--n8);
      line-height: 1.5;
    }
    .actionLabel,
    .commandLabel span,
    .outputLabel {
      display: block;
      font-size: 11px;
      font-weight: 650;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: var(--n5);
      margin-bottom: 4px;
    }
    .commandBlock { min-width: 0; margin-bottom: 8px; }
    .commandLabel {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      margin-bottom: 4px;
    }
    .stepCommand {
      position: relative;
      min-width: 0;
      max-width: 100%;
      background: #0B1C2C;
      border-radius: 6px;
      padding: 10px 12px;
      overflow: hidden;
    }
    .stepCommand pre {
      margin: 0;
      max-width: 100%;
      overflow-x: auto;
      white-space: pre-wrap;
      word-break: break-word;
    }
    .stepCommand code {
      display: block;
      background: transparent;
      padding: 0;
      color: #E0A06A;
      font-size: 12px;
      line-height: 1.45;
      font-family: ui-monospace, Consolas, monospace;
      white-space: pre-wrap;
      overflow-wrap: anywhere;
      word-break: break-word;
    }
    .copyBtn {
      background: white;
      border: 1px solid var(--g3);
      cursor: pointer;
      font-size: 11px;
      font-weight: 650;
      padding: 4px 8px;
      border-radius: 6px;
      color: var(--n7);
      line-height: 1;
    }
    .copyBtn:hover {
      background: var(--n0);
    }
    .expectedOutput {
      font-size: 11px;
      color: var(--n5);
    }
    .expectedOutput pre {
      margin: 4px 0 0;
      padding: 8px;
      background: #0B1C2C;
      border-radius: 4px;
      color: #4CAF7A;
      font-size: 11px;
      max-width: 100%;
      overflow-x: auto;
      white-space: pre-wrap;
      overflow-wrap: anywhere;
      word-break: break-word;
    }
    .stepActions {
      flex: none;
      display: flex;
      flex-direction: column;
      gap: 8px;
      align-items: flex-end;
    }
    .stepDone {
      font-size: 12px;
      color: var(--gr6);
      font-weight: 600;
    }
    .btn.small {
      padding: 6px 12px;
      font-size: 11px;
      min-height: 32px;
    }
    .fhirServerInfo {
      margin-top: 20px;
      padding: 16px;
      background: linear-gradient(135deg, #F7FAFC 0%, #EEF3F7 100%);
      border: 1px solid #D7E2EC;
      border-radius: 8px;
      border-left: 4px solid var(--b6);
    }
    .serverBadge {
      font-size: 11px;
      font-weight: 650;
      color: var(--b6);
      text-transform: uppercase;
      letter-spacing: 0.06em;
      margin-bottom: 4px;
    }
    .serverUrl {
      font-family: ui-monospace, Consolas, monospace;
      font-size: 13px;
      color: var(--n9);
      margin-bottom: 8px;
    }
    .serverCaps {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }
    .capTag {
      font-size: 11px;
      padding: 3px 8px;
      background: white;
      border: 1px solid #D7E2EC;
      border-radius: 999px;
      color: var(--n7);
    }
    .labCompleteBanner {
      margin-top: 20px;
      padding: 20px;
      background: linear-gradient(135deg, var(--gr1), #E5F5EE);
      border: 1px solid var(--gr6);
      border-radius: 10px;
      display: flex;
      align-items: center;
      gap: 16px;
    }
    .completeIcon {
      font-size: 28px;
    }
    .labCompleteBanner strong {
      display: block;
      color: var(--n9);
      margin-bottom: 4px;
    }
    .labCompleteBanner p {
      margin: 0;
      font-size: 13px;
      color: var(--n6);
    }
  `,
})
export class LabWidgetComponent {
  @Input({ required: true }) data!: {
    title: string;
    description: string;
    steps?: LabStep[];
    fhirServer?: {
      baseUrl: string;
      capabilities?: string[];
    };
  };
  readonly completed = output<boolean>();

  readonly completedSteps = signal<string[]>([]);
  readonly currentStep = signal<string | null>(null);
  readonly labCompleted = signal(false);

  readonly copiedId = signal<string | null>(null);
  private copyTimer: ReturnType<typeof setTimeout> | null = null;

  startStep(stepId: string): void {
    this.currentStep.set(stepId);
  }

  completeStep(stepId: string): void {
    this.completedSteps.update(steps => [...steps, stepId]);
    this.currentStep.set(null);
  }

  allStepsCompleted(): boolean {
    if (!this.data.steps || this.data.steps.length === 0) return false;
    return this.data.steps.every(step => this.completedSteps().includes(step.id));
  }

  finishLab(): void {
    this.labCompleted.set(true);
    this.completed.emit(true);
  }

  copyCommand(command: string): void {
    const step = this.data.steps?.find((s) => s.command === command);
    void navigator.clipboard.writeText(command);
    this.copiedId.set(step?.id ?? 'copied');
    if (this.copyTimer) clearTimeout(this.copyTimer);
    this.copyTimer = setTimeout(() => this.copiedId.set(null), 1600);
  }
}

interface LabStep {
  id: string;
  title: string;
  description: string;
  action?: string;
  command?: string;
  expectedOutput?: string;
}