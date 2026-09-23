import { Component, Input, Output, EventEmitter, signal, computed, OnInit, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'fhi-sequence-diagram',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="sequenceDiagram">
      <!-- Actors -->
      <div class="actorsRow">
        @for (actor of actors(); track actor; let i = $index) {
          <div class="actor" [style.left.%]="actorPositions()[i]">
            <div class="actorIcon">
              @if (actor === 'Client') { 📱 }
              @else if (actor === 'Server') { 🖥️ }
              @else if (actor === 'Auth') { 🔐 }
              @else { 👤 }
            </div>
            <div class="actorLabel">{{ actor }}</div>
            <div class="actorLine" [style.height.px]="totalHeight()"></div>
          </div>
        }
      </div>

      <!-- Steps -->
      <div class="stepsContainer">
        @for (step of stepsWithIndex(); track step.index; let i = $index) {
          <div class="stepRow" [class.current]="currentStepSig() === step.index" (click)="onStepClick(step.index)">
            <div class="stepNumber">{{ step.index + 1 }}</div>
            <div class="stepArrow" [style.left.%]="step.fromPos" [style.right.%]="100 - step.toPos">
              <div class="arrowLine" [class.async]="step.async"></div>
              <div class="arrowHead" [class.async]="step.async"></div>
            </div>
            <div class="stepLabel" [style.left.%]="minPos(step.fromPos, step.toPos)" [style.width.%]="absDiff(step.fromPos, step.toPos)">
              <span class="stepText">{{ step.step.title }}</span>
              @if (step.step.actor) {
                <span class="stepActor">{{ step.step.actor }}</span>
              }
            </div>
            <div class="stepDetails" [class.open]="currentStepSig() === step.index">
              <p>{{ step.step.description }}</p>
              @if (step.step.code) {
                <pre><code>{{ step.step.code }}</code></pre>
              }
            </div>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .sequenceDiagram {
      width: 100%;
      min-height: 300px;
      position: relative;
      font-family: var(--font);
    }
    .actorsRow {
      display: flex;
      justify-content: space-between;
      padding: 0 20px;
      position: relative;
      z-index: 10;
    }
    .actor {
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    .actorIcon {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: var(--b1);
      color: var(--b6);
      display: grid;
      place-items: center;
      font-size: 18px;
      border: 2px solid var(--b6);
      margin-bottom: 4px;
      z-index: 5;
    }
    .actorLabel {
      font-size: 11px;
      font-weight: 600;
      color: var(--n7);
      text-align: center;
      white-space: nowrap;
    }
    .actorLine {
      position: absolute;
      top: 48px;
      width: 2px;
      background: repeating-linear-gradient(
        to bottom,
        #D7E2EC,
        #D7E2EC 8px,
        transparent 8px,
        transparent 16px
      );
      z-index: 1;
    }
    .stepsContainer {
      margin-top: 60px;
      position: relative;
    }
    .stepRow {
      position: relative;
      margin-bottom: 40px;
      cursor: pointer;
    }
    .stepNumber {
      position: absolute;
      left: -40px;
      top: 0;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: var(--n1);
      color: var(--n6);
      display: grid;
      place-items: center;
      font-size: 11px;
      font-weight: 650;
      border: 2px solid var(--g3);
    }
    .stepRow.current .stepNumber {
      background: var(--b6);
      color: white;
      border-color: var(--b6);
    }
    .stepArrow {
      position: absolute;
      top: 4px;
      height: 24px;
      display: flex;
      align-items: center;
      pointer-events: none;
    }
    .arrowLine {
      flex: 1;
      height: 2px;
      background: var(--n5);
      position: relative;
    }
    .arrowLine.async {
      background: repeating-linear-gradient(
        to right,
        var(--n5),
        var(--n5) 6px,
        transparent 6px,
        transparent 12px
      );
    }
    .arrowHead {
      width: 0;
      height: 0;
      border-left: 8px solid var(--n5);
      border-top: 5px solid transparent;
      border-bottom: 5px solid transparent;
      margin-left: -8px;
    }
    .arrowHead.async {
      border-left-color: var(--o7);
    }
    .stepLabel {
      position: absolute;
      top: -8px;
      min-height: 36px;
      padding: 4px 8px;
      background: white;
      border: 1px solid #D7E2EC;
      border-radius: 6px;
      box-shadow: 0 2px 8px rgba(11, 28, 44, 0.08);
      display: flex;
      flex-direction: column;
      align-items: center;
      white-space: nowrap;
      z-index: 2;
    }
    .stepRow.current .stepLabel {
      border-color: var(--b6);
      box-shadow: 0 4px 16px rgba(26, 107, 184, 0.2);
    }
    .stepText {
      font-size: 12px;
      font-weight: 600;
      color: var(--n9);
    }
    .stepActor {
      font-size: 10px;
      color: var(--b6);
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    .stepDetails {
      position: absolute;
      top: 40px;
      left: -40px;
      right: -40px;
      padding: 12px 16px;
      background: var(--n0);
      border: 1px solid #D7E2EC;
      border-radius: 8px;
      opacity: 0;
      visibility: hidden;
      transform: translateY(-10px);
      transition: all 0.2s ease;
      pointer-events: none;
      z-index: 5;
    }
    .stepDetails.open {
      opacity: 1;
      visibility: visible;
      transform: translateY(0);
      pointer-events: auto;
    }
    .stepDetails p {
      margin: 0 0 8px;
      font-size: 12px;
      color: var(--n7);
      line-height: 1.5;
    }
    .stepDetails pre {
      margin: 0;
      padding: 10px;
      background: #0D1B2A;
      border-radius: 6px;
      overflow-x: auto;
    }
    .stepDetails code {
      font-family: ui-monospace, Consolas, monospace;
      font-size: 11px;
      color: #E0A06A;
      line-height: 1.5;
    }
  `],
})
export class SequenceDiagramComponent implements OnInit, OnChanges {
  @Input() steps: SequenceStep[] = [];
  @Input() currentStep = 0;
  @Output() stepClick = new EventEmitter<number>();

  readonly currentStepSig = signal(0);
  readonly actors = signal<string[]>([]);
  readonly actorPositions = signal<number[]>([]);
  readonly stepsWithIndex = signal<Array<{index: number; step: SequenceStep; fromPos: number; toPos: number; async: boolean}>>([]);
  readonly totalHeight = signal(400);

  ngOnInit(): void {
    this.currentStepSig.set(this.currentStep);
    this.computeLayout();
  }

  ngOnChanges(): void {
    this.currentStepSig.set(this.currentStep);
    this.computeLayout();
  }

  private computeLayout(): void {
    const actors = new Set<string>();
    this.steps.forEach(s => {
      actors.add(s.actor || 'Client');
      if (s.target) actors.add(s.target);
    });
    const actorList = Array.from(actors);
    this.actors.set(actorList);
    
    const positions = actorList.map((_, i) => (i + 1) / (actorList.length + 1) * 100);
    this.actorPositions.set(positions);

    const stepsWithIndex = this.steps.map((step, index) => {
      const fromActor = step.actor || 'Client';
      const toActor = step.target || 'Server';
      const fromIdx = actorList.indexOf(fromActor);
      const toIdx = actorList.indexOf(toActor);
      
      return {
        index,
        step,
        fromPos: positions[Math.max(0, fromIdx)],
        toPos: positions[Math.max(0, toIdx)],
        async: step.async || false,
      };
    });
    this.stepsWithIndex.set(stepsWithIndex);

    this.totalHeight.set(Math.max(300, this.steps.length * 80 + 100));
  }

  onStepClick(index: number): void {
    this.currentStepSig.set(index);
    this.stepClick.emit(index);
  }

  minPos(a: number, b: number): number {
    return Math.min(a, b);
  }

  absDiff(a: number, b: number): number {
    return Math.abs(a - b);
  }
}

export interface SequenceStep {
  title: string;
  description: string;
  actor?: string;
  target?: string;
  code?: string;
  async?: boolean;
}