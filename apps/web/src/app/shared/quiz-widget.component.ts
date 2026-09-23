import { Component, Input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'fhi-quiz-widget',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="quizWidget">
      <div class="quizHeader">
        <span class="quizBadge">Quiz</span>
        <h5>{{ data.question }}</h5>
      </div>
      <div class="quizOptions">
        @for (option of data.options; track option; let i = $index) {
          <button
            type="button"
            class="quizOption"
            [class.selected]="selectedIndex() === i"
            [class.correct]="showResult() && i === data.correctIndex"
            [class.incorrect]="showResult() && selectedIndex() === i && i !== data.correctIndex"
            (click)="selectOption(i)"
            [disabled]="showResult()"
          >
            <span class="optionMarker">{{ optionMarker(i) }}</span>
            <span class="optionText">{{ option }}</span>
            @if (showResult() && i === data.correctIndex) {
              <span class="correctBadge">✓ Correct</span>
            }
            @if (showResult() && selectedIndex() === i && i !== data.correctIndex) {
              <span class="incorrectBadge">✗ Incorrect</span>
            }
          </button>
        }
      </div>
      @if (showResult()) {
        <div class="quizExplanation">
          <span class="explanationIcon">{{ data.correctIndex === selectedIndex() ? '🎉' : '💡' }}</span>
          <p>{{ data.explanation }}</p>
        </div>
        <button class="btn primary" (click)="reset()" style="margin-top: 12px;">Try Again</button>
      } @else if (selectedIndex() !== null) {
        <button class="btn primary" (click)="submit()" style="margin-top: 12px;">Submit Answer</button>
      }
    </div>
  `,
  styles: `
    .quizWidget {
      background: white;
      border: 1px solid #D7E2EC;
      border-radius: 10px;
      padding: 20px;
    }
    .quizHeader {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      margin-bottom: 16px;
    }
    .quizBadge {
      flex: none;
      padding: 4px 10px;
      background: var(--b1);
      color: var(--b6);
      border-radius: 999px;
      font-size: 11px;
      font-weight: 650;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      margin-top: 2px;
    }
    .quizHeader h5 {
      margin: 0;
      font-size: 15px;
      color: var(--n9);
      line-height: 1.4;
    }
    .quizOption {
      display: flex;
      align-items: center;
      gap: 12px;
      width: 100%;
      padding: 14px 16px;
      border: 1px solid #D7E2EC;
      border-radius: 8px;
      background: white;
      text-align: left;
      margin-bottom: 8px;
      cursor: pointer;
      transition: all 0.15s ease;
    }
    .quizOption:hover:not(:disabled) {
      border-color: var(--b6);
      background: var(--b1);
    }
    .quizOption.selected {
      border-color: var(--b6);
      background: var(--b1);
    }
    .quizOption.correct {
      border-color: var(--gr6);
      background: var(--gr1);
    }
    .quizOption.incorrect {
      border-color: #c44;
      background: #fdeeee;
    }
    .optionMarker {
      flex: none;
      width: 24px;
      height: 24px;
      border-radius: 50%;
      border: 2px solid var(--g3);
      display: grid;
      place-items: center;
      font-size: 12px;
      font-weight: 650;
      color: var(--n7);
      transition: all 0.15s ease;
    }
    .quizOption.selected .optionMarker,
    .quizOption.correct .optionMarker {
      border-color: var(--b6);
      background: var(--b6);
      color: white;
    }
    .quizOption.incorrect .optionMarker {
      border-color: #c44;
      background: #c44;
      color: white;
    }
    .optionText {
      flex: 1;
      font-size: 14px;
      color: var(--n8);
    }
    .correctBadge, .incorrectBadge {
      flex: none;
      font-size: 11px;
      font-weight: 600;
      padding: 2px 8px;
      border-radius: 999px;
    }
    .correctBadge {
      background: var(--gr1);
      color: var(--gr6);
    }
    .incorrectBadge {
      background: #fdeeee;
      color: #c44;
    }
    .quizExplanation {
      margin-top: 16px;
      padding: 14px 16px;
      background: var(--n0);
      border-radius: 8px;
      display: flex;
      align-items: flex-start;
      gap: 10px;
    }
    .explanationIcon {
      flex: none;
      font-size: 16px;
      margin-top: 2px;
    }
    .quizExplanation p {
      margin: 0;
      font-size: 13px;
      color: var(--n7);
      line-height: 1.5;
    }
  `,
})
export class QuizWidgetComponent {
  @Input({ required: true }) data!: {
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
  };
  readonly completed = output<boolean>();

  readonly selectedIndex = signal<number | null>(null);
  readonly showResult = signal(false);

  optionMarker(i: number): string {
    return String.fromCharCode(65 + i);
  }

  selectOption(i: number): void {
    this.selectedIndex.set(i);
  }

  submit(): void {
    this.showResult.set(true);
    this.completed.emit(this.selectedIndex() === this.data.correctIndex);
  }

  reset(): void {
    this.selectedIndex.set(null);
    this.showResult.set(false);
  }
}