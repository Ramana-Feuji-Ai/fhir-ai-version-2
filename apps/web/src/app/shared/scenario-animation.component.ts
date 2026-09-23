import { Component, Input, signal, effect, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface ScenarioCharacter {
  id: string;
  name: string;
  role: 'boss' | 'facilitator' | 'employee' | 'student' | 'mentor' | 'learner';
  position: 'left' | 'right' | 'center-left' | 'center-right';
  avatar?: string; // emoji or image URL
  color: string;
}

export interface ScenarioLine {
  characterId: string;
  text: string;
  delay?: number; // ms before showing
  duration?: number; // ms to display
  animation?: 'typewriter' | 'fade' | 'pop';
}

export interface ScenarioData {
  title: string;
  characters: ScenarioCharacter[];
  lines: ScenarioLine[];
  background?: string;
  loop?: boolean;
  autoPlay?: boolean;
}

@Component({
  selector: 'fhi-scenario-animation',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="scenarioContainer" [class.playing]="isPlaying()" [style.background]="data?.background">
      <!-- Title -->
      @if (data?.title) {
        <div class="scenarioTitle">{{ data.title }}</div>
      }

      <!-- Scene -->
      <div class="scenarioScene" #scene>
        <!-- Characters -->
        @for (char of data?.characters; track char.id) {
          <div 
            class="scenarioCharacter"
            [class.speaking]="currentSpeaker() === char.id"
            [class.position]="char.position"
            [style.--char-color]="char.color"
          >
            <div class="characterAvatar" [attr.data-role]="char.role">
              {{ char.avatar || getDefaultAvatar(char.role) }}
            </div>
            <div class="characterName">{{ char.name }}</div>
            <div class="characterRole">{{ char.role }}</div>
            
            <!-- Speech Bubble -->
            @if (currentSpeaker() === char.id && currentLine()) {
              <div 
                class="speechBubble"
                [class.position]="char.position"
                [class.anim]="currentLine()?.animation || 'pop'"
              >
                <div class="bubbleTail"></div>
                <div class="bubbleContent" [innerHTML]="formattedText()"></div>
              </div>
            }
          </div>
        }

        <!-- Interaction Arrows (between characters) -->
        @if (showInteractionArrow()) {
          <div class="interactionArrow" [style.--from]="arrowFrom()" [style.--to]="arrowTo()">
            <div class="arrowLine"></div>
            <div class="arrowHead"></div>
            <div class="arrowPulse"></div>
          </div>
        }
      </div>

      <!-- Controls -->
      @if (!data?.autoPlay || showControls()) {
        <div class="scenarioControls">
          <button 
            class="controlBtn" 
            (click)="togglePlay()"
            [attr.aria-label]="isPlaying() ? 'Pause' : 'Play'"
            [disabled]="!data?.lines?.length"
          >
            {{ isPlaying() ? '⏸' : '▶' }}
          </button>
          <button 
            class="controlBtn" 
            (click)="restart()"
            [attr.aria-label]="'Restart'"
            [disabled]="!data?.lines?.length"
          >
            ⟲
          </button>
          <button 
            class="controlBtn" 
            (click)="stepBack()"
            [attr.aria-label]="'Previous'"
            [disabled]="currentLineIndex() === 0 || isPlaying()"
          >
            ←
          </button>
          <span class="progressText">{{ currentLineIndex() + 1 }} / {{ data?.lines?.length }}</span>
          <button 
            class="controlBtn" 
            (click)="stepForward()"
            [attr.aria-label]="'Next'"
            [disabled]="currentLineIndex() >= (data?.lines?.length || 1) - 1 || isPlaying()"
          >
            →
          </button>
          <div class="progressBar">
            <div class="progressFill" [style.width.%]="progressPercent()"></div>
          </div>
        </div>
      }

      <!-- Transcript (accessibility) -->
      <details class="scenarioTranscript">
        <summary>View Transcript</summary>
        <div class="transcriptContent">
          @for (line of data?.lines; track $index) {
            <div class="transcriptLine">
              <strong>{{ getCharacter(line.characterId)?.name }}:</strong>
              <span>{{ line.text }}</span>
            </div>
          }
        </div>
      </details>
    </div>
  `,
  styles: [`
    .scenarioContainer {
      font-family: var(--font);
      border-radius: 16px;
      overflow: hidden;
      background: linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%);
      border: 1px solid #e2e8f0;
      min-height: 300px;
      max-height: 500px;
      display: flex;
      flex-direction: column;
    }

    .scenarioTitle {
      padding: 16px 20px;
      font-size: 14px;
      font-weight: 600;
      color: var(--n9);
      border-bottom: 1px solid #e2e8f0;
      background: white;
    }

    .scenarioScene {
      flex: 1;
      position: relative;
      display: flex;
      align-items: center;
      justify-content: space-around;
      padding: 40px 20px;
      min-height: 280px;
      overflow: hidden;
    }

    .scenarioCharacter {
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      flex: 0 0 auto;
      max-width: 180px;
      z-index: 10;
      transition: transform 0.3s ease;
    }

    .scenarioCharacter.speaking {
      transform: scale(1.05);
      z-index: 20;
    }

    .scenarioCharacter.position-left { margin-right: auto; }
    .scenarioCharacter.position-right { margin-left: auto; }
    .scenarioCharacter.position-center-left { margin-right: 20px; }
    .scenarioCharacter.position-center-right { margin-left: 20px; }

    .characterAvatar {
      width: 72px;
      height: 72px;
      border-radius: 50%;
      background: var(--char-color);
      display: grid;
      place-items: center;
      font-size: 28px;
      box-shadow: 
        0 4px 12px rgba(0,0,0,0.15),
        0 0 0 4px white,
        0 0 0 6px var(--char-color);
      transition: all 0.3s ease;
      position: relative;
    }

    .characterAvatar::before {
      content: '';
      position: absolute;
      inset: -8px;
      border-radius: 50%;
      background: var(--char-color);
      opacity: 0.2;
      animation: pulse 2s ease-in-out infinite;
      z-index: -1;
    }

    .scenarioCharacter.speaking .characterAvatar {
      transform: scale(1.1);
      box-shadow: 
        0 6px 20px rgba(0,0,0,0.2),
        0 0 0 4px white,
        0 0 0 8px var(--char-color);
    }

    @keyframes pulse {
      0%, 100% { transform: scale(1); opacity: 0.2; }
      50% { transform: scale(1.3); opacity: 0.1; }
    }

    .characterName {
      font-weight: 600;
      font-size: 13px;
      color: var(--n9);
      text-align: center;
    }

    .characterRole {
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--n5);
      background: var(--n1);
      padding: 2px 8px;
      border-radius: 999px;
    }

    /* Speech Bubbles */
    .speechBubble {
      position: absolute;
      max-width: 220px;
      min-width: 140px;
      padding: 12px 16px;
      background: white;
      border: 2px solid var(--char-color);
      border-radius: 16px;
      box-shadow: 0 4px 16px rgba(0,0,0,0.1);
      z-index: 30;
      animation: bubbleIn 0.3s ease;
    }

    @keyframes bubbleIn {
      from { opacity: 0; transform: scale(0.8) translateY(10px); }
      to { opacity: 1; transform: scale(1) translateY(0); }
    }

    .speechBubble.anim-typewriter .bubbleContent {
      overflow: hidden;
      white-space: pre-wrap;
      border-right: 2px solid var(--char-color);
      animation: typing 1.5s steps(30, end), blink 0.75s step-end infinite;
    }

    @keyframes typing {
      from { width: 0; }
      to { width: 100%; }
    }

    @keyframes blink {
      50% { border-color: transparent; }
    }

    .speechBubble.anim-fade .bubbleContent {
      animation: fadeIn 0.5s ease;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    .speechBubble.anim-pop {
      animation: bubbleIn 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
    }

    /* Bubble positioning */
    .speechBubble.position-left {
      bottom: 100%;
      left: 50%;
      transform: translateX(-50%);
      margin-bottom: 12px;
    }

    .speechBubble.position-right {
      bottom: 100%;
      right: 50%;
      transform: translateX(50%);
      margin-bottom: 12px;
    }

    .speechBubble.position-center-left {
      bottom: 100%;
      left: 50%;
      transform: translateX(-50%);
      margin-bottom: 12px;
    }

    .speechBubble.position-center-right {
      bottom: 100%;
      right: 50%;
      transform: translateX(50%);
      margin-bottom: 12px;
    }

    .bubbleTail {
      position: absolute;
      width: 0;
      height: 0;
      border: 12px solid transparent;
    }

    .speechBubble.position-left .bubbleTail,
    .speechBubble.position-center-left .bubbleTail {
      bottom: -24px;
      left: 50%;
      margin-left: -12px;
      border-top-color: var(--char-color);
      border-bottom: none;
    }

    .speechBubble.position-right .bubbleTail,
    .speechBubble.position-center-right .bubbleTail {
      bottom: -24px;
      right: 50%;
      margin-right: -12px;
      border-top-color: var(--char-color);
      border-bottom: none;
    }

    .bubbleContent {
      font-size: 13px;
      line-height: 1.5;
      color: var(--n8);
      word-wrap: break-word;
    }

    /* Interaction Arrow */
    .interactionArrow {
      position: absolute;
      top: 50%;
      left: var(--from, 25%);
      right: var(--to, 25%);
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      pointer-events: none;
      z-index: 5;
    }

    .arrowLine {
      position: absolute;
      top: 50%;
      left: 0;
      right: 0;
      height: 3px;
      background: linear-gradient(90deg, var(--from-color), var(--to-color));
      transform: translateY(-50%);
      border-radius: 2px;
    }

    .arrowHead {
      position: absolute;
      right: 0;
      top: 50%;
      width: 0;
      height: 0;
      border: 10px solid transparent;
      border-left-color: var(--to-color);
      transform: translateY(-50%);
      animation: arrowMove 1.5s ease-in-out infinite;
    }

    @keyframes arrowMove {
      0%, 100% { transform: translateY(-50%) translateX(0); }
      50% { transform: translateY(-50%) translateX(-10px); }
    }

    .arrowPulse {
      position: absolute;
      top: 50%;
      left: 20%;
      width: 12px;
      height: 12px;
      border-radius: 50%;
      background: var(--from-color);
      opacity: 0.6;
      animation: pulseMove 2s ease-in-out infinite;
    }

    @keyframes pulseMove {
      0%, 100% { left: 20%; opacity: 0.6; transform: scale(1) translateY(-50%); }
      50% { left: 80%; opacity: 1; transform: scale(1.5) translateY(-50%); }
    }

    /* Controls */
    .scenarioControls {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 16px 20px;
      background: white;
      border-top: 1px solid #e2e8f0;
      flex-wrap: wrap;
    }

    .controlBtn {
      width: 40px;
      height: 40px;
      border: none;
      background: var(--n1);
      border-radius: 10px;
      font-size: 16px;
      cursor: pointer;
      display: grid;
      place-items: center;
      transition: all 0.15s ease;
      color: var(--n7);
    }

    .controlBtn:hover:not(:disabled) {
      background: var(--b1);
      color: var(--b6);
      transform: translateY(-2px);
    }

    .controlBtn:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }

    .progressText {
      font-size: 12px;
      color: var(--n5);
      font-weight: 500;
      min-width: 60px;
      text-align: center;
    }

    .progressBar {
      flex: 1;
      min-width: 120px;
      max-width: 200px;
      height: 6px;
      background: var(--n1);
      border-radius: 999px;
      overflow: hidden;
    }

    .progressFill {
      height: 100%;
      background: linear-gradient(90deg, var(--o7), var(--b6));
      border-radius: 999px;
      transition: width 0.3s ease;
    }

    /* Transcript */
    .scenarioTranscript {
      margin: 0 20px 20px;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      background: white;
    }

    .scenarioTranscript summary {
      padding: 12px 16px;
      font-weight: 600;
      color: var(--n7);
      cursor: pointer;
      list-style: none;
    }

    .scenarioTranscript summary::-webkit-details-marker { display: none; }
    .scenarioTranscript summary::after {
      content: '▼';
      float: right;
      font-size: 10px;
      transition: transform 0.2s;
    }

    .scenarioTranscript[open] summary::after {
      transform: rotate(180deg);
    }

    .transcriptContent {
      padding: 0 16px 16px;
      font-size: 13px;
      color: var(--n7);
    }

    .transcriptLine {
      padding: 8px 0;
      border-bottom: 1px solid #f1f5f9;
      display: flex;
      gap: 8px;
    }

    .transcriptLine:last-child { border-bottom: none; }

    .transcriptLine strong {
      color: var(--n9);
      min-width: 100px;
    }

    /* Responsive */
    @media (max-width: 600px) {
      .scenarioScene { padding: 20px 10px; }
      .scenarioCharacter { max-width: 140px; }
      .characterAvatar { width: 60px; height: 60px; font-size: 24px; }
      .speechBubble { max-width: 180px; font-size: 12px; }
      .controlBtn { width: 36px; height: 36px; font-size: 14px; }
    }

    @media (prefers-reduced-motion: reduce) {
      * { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
    }
  `],
})
export class ScenarioAnimationComponent implements OnDestroy {
  @Input({ required: true }) data!: ScenarioData;

  readonly isPlaying = signal(false);
  readonly currentLineIndex = signal(0);
  readonly currentSpeaker = signal<string | null>(null);
  readonly currentLine = signal<ScenarioLine | null>(null);
  readonly showControls = signal(false);
  readonly arrowFrom = signal<string>('25%');
  readonly arrowTo = signal<string>('75%');

  private timers: number[] = [];
  private typewriterInterval: number | null = null;

  ngOnDestroy(): void {
    this.clearAllTimers();
  }

  ngOnChanges(): void {
    this.reset();
    if (this.data?.autoPlay) {
      this.play();
    }
  }

  getDefaultAvatar(role: string): string {
    const avatars: Record<string, string> = {
      boss: '👔',
      facilitator: '🎓',
      employee: '👨‍💼',
      student: '🎒',
      mentor: '🧙‍♂️',
      learner: '📚'
    };
    return avatars[role] || '👤';
  }

  getCharacter(id: string): ScenarioCharacter | undefined {
    return this.data?.characters.find(c => c.id === id);
  }

  formattedText(): string {
    const line = this.currentLine();
    if (!line) return '';
    // Escape HTML and preserve line breaks
    return line.text.replace(/&/g, '&').replace(/</g, '<').replace(/>/g, '>').replace(/\n/g, '<br>');
  }

  progressPercent(): number {
    const total = this.data?.lines?.length || 1;
    return ((this.currentLineIndex() + 1) / total) * 100;
  }

  showInteractionArrow(): boolean {
    const line = this.currentLine();
    if (!line || !this.data?.characters.length) return false;
    const char = this.getCharacter(line.characterId);
    return char?.position === 'left' || char?.position === 'center-left';
  }

  togglePlay(): void {
    if (this.isPlaying()) {
      this.pause();
    } else {
      this.play();
    }
  }

  play(): void {
    if (this.isPlaying() || !this.data?.lines?.length) return;
    this.isPlaying.set(true);
    this.showControls.set(true);
    this.runSequence();
  }

  pause(): void {
    this.isPlaying.set(false);
    this.clearAllTimers();
  }

  restart(): void {
    this.pause();
    this.reset();
    this.play();
  }

  stepBack(): void {
    if (this.currentLineIndex() > 0) {
      this.currentLineIndex.update(i => i - 1);
      this.updateCurrentLine();
    }
  }

  stepForward(): void {
    if (this.currentLineIndex() < (this.data?.lines?.length || 1) - 1) {
      this.currentLineIndex.update(i => i + 1);
      this.updateCurrentLine();
    }
  }

  private reset(): void {
    this.currentLineIndex.set(0);
    this.currentSpeaker.set(null);
    this.currentLine.set(null);
    this.arrowFrom.set('25%');
    this.arrowTo.set('75%');
  }

  private updateCurrentLine(): void {
    const line = this.data?.lines[this.currentLineIndex()];
    this.currentLine.set(line ?? null);
    if (line) {
      this.currentSpeaker.set(line.characterId);
      const char = this.getCharacter(line.characterId);
      if (char?.position === 'left' || char?.position === 'center-left') {
        this.arrowFrom.set('25%');
        this.arrowTo.set('75%');
      } else {
        this.arrowFrom.set('75%');
        this.arrowTo.set('25%');
      }
    }
  }

  private runSequence(): void {
    const lines = this.data?.lines || [];
    let index = this.currentLineIndex();

    const playNext = (i: number) => {
      if (!this.isPlaying() || i >= lines.length) {
        if (this.data?.loop && this.isPlaying()) {
          this.currentLineIndex.set(0);
          setTimeout(() => playNext(0), 500);
        } else {
          this.isPlaying.set(false);
        }
        return;
      }

      this.currentLineIndex.set(i);
      this.updateCurrentLine();

      const line = lines[i];
      const delay = line.delay || 500;
      const duration = line.duration || Math.max(3000, line.text.length * 40);

      const timer = setTimeout(() => {
        if (this.isPlaying()) {
          playNext(i + 1);
        }
      }, delay + duration);

      this.timers.push(timer);

      // Typewriter effect
      if (line.animation === 'typewriter') {
        this.animateTypewriter(line.text, duration);
      }
    };

    playNext(index);
  }

  private animateTypewriter(text: string, duration: number): void {
    // Handled by CSS animation on .bubbleContent
    // Could add JS-based typewriter here if needed
  }

  private clearAllTimers(): void {
    this.timers.forEach(t => clearTimeout(t));
    this.timers = [];
    if (this.typewriterInterval) {
      clearInterval(this.typewriterInterval);
      this.typewriterInterval = null;
    }
  }
}