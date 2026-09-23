import { Component, Input, OnChanges, OnDestroy, Output, EventEmitter, SimpleChanges, ViewChild, ElementRef } from '@angular/core';
import { ConversationLesson, ConversationLibrary } from '../core/conversation.library';

@Component({
  selector: 'fhi-conversation-player',
  standalone: true,
  template: `
    <div class="convoGlass">
      <p class="convoKicker">Maya &amp; Alex · conversation lesson</p>
      <div class="scene">
        <figure class="speaker" [class.active]="activeSpeaker === 'maya'">
          <img src="/assets/images/speaker-maya.jpg" alt="Dr. Maya Krishnan" />
          <figcaption>Dr. Maya Krishnan<small>Clinical informaticist</small></figcaption>
        </figure>
        <figure class="speaker" [class.active]="activeSpeaker === 'alex'">
          <img src="/assets/images/speaker-alex.jpg" alt="Alex Duarte" />
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
        <div class="control-btns">
          <button type="button" (click)="prevLine()">Previous</button>
          <button type="button" (click)="togglePlay()">{{ playing ? 'Pause' : 'Play' }}</button>
          <button type="button" (click)="nextLine(false)">Next</button>
          <span class="time">{{ lineIndex + 1 }} / {{ lesson.conversation.length }}</span>
        </div>
        <div class="convo-track" role="progressbar" [attr.aria-valuenow]="progressPct" aria-valuemin="0" aria-valuemax="100">
          <div class="convo-fill" [style.width.%]="progressPct"></div>
        </div>
      </div>
    </div>
  `,
  styles: `
    .convoGlass {
      margin: 16px 0 20px;
      border-radius: 18px;
      overflow: visible;
      background: linear-gradient(160deg, rgba(11,28,44,.88), rgba(20,48,74,.72));
      border: 1px solid rgba(255,255,255,.18);
      box-shadow: 0 18px 50px rgba(11,28,44,.28);
      backdrop-filter: blur(18px);
      color: #fff;
    }
    .convoKicker {
      margin: 0;
      padding: 12px 16px 0;
      font-size: 11px;
      letter-spacing: .08em;
      text-transform: uppercase;
      color: rgba(255,255,255,.65);
    }
    .scene {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      padding: 16px 16px 12px;
      justify-items: center;
      align-items: start;
    }
    .speaker {
      margin: 0;
      width: 100%;
      max-width: 280px;
      text-align: center;
      opacity: .55;
      transition: opacity .25s ease, transform .25s ease;
    }
    .speaker.active {
      opacity: 1;
      transform: scale(1.02);
    }
    .speaker img {
      display: block;
      width: auto;
      max-width: 100%;
      height: auto;
      max-height: 240px;
      margin-inline: auto;
      object-fit: contain;
      object-position: center top;
      border-radius: 14px;
      border: 0;
      outline: 2px solid transparent;
      outline-offset: 3px;
      background: rgba(0, 0, 0, .18);
    }
    .speaker.active img {
      outline-color: #E0A06A;
    }
    :host-context(.isFullscreen) .scene {
      gap: 28px;
      padding: 20px 16px 12px;
      max-width: 960px;
    }
    :host-context(.isFullscreen) .speaker {
      max-width: 420px;
    }
    :host-context(.isFullscreen) .speaker img {
      max-height: min(52vh, 560px);
    }
    .speaker figcaption {
      display: grid;
      margin-top: 8px;
      font-size: 13px;
      font-weight: 600;
    }
    .speaker small {
      font-weight: 400;
      color: rgba(255,255,255,.65);
    }
    .caption-bar {
      padding: 4px 16px 12px;
    }
    .who { margin: 0; font-size: 12px; color: #E0A06A; font-weight: 650; }
    .line { margin: 6px 0; font-size: 15px; line-height: 1.55; }
    .audio-status { margin: 0; font-size: 11px; color: rgba(255,255,255,.55); }
    .controls {
      display: grid;
      gap: 10px;
      padding: 0 16px 16px;
    }
    .control-btns {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 8px;
    }
    .controls button {
      border: 1px solid rgba(255,255,255,.2);
      background: rgba(255,255,255,.08);
      color: #fff;
      border-radius: 8px;
      min-height: 34px;
      padding: 0 12px;
      font-size: 12px;
      font-weight: 600;
    }
    .convo-track {
      width: 100%;
      height: 6px;
      background: rgba(255,255,255,.22);
      border-radius: 99px;
      overflow: hidden;
    }
    .convo-fill {
      height: 100%;
      width: 0;
      background: #E0A06A;
      border-radius: 99px;
      transition: width .2s ease;
    }
    .time {
      font-size: 12px;
      color: rgba(255,255,255,.7);
      margin-left: auto;
    }
    @media (max-width: 640px) {
      .scene { grid-template-columns: 1fr; }
      .speaker { max-width: 320px; }
      .speaker img { max-height: 220px; }
    }
  `,
})
export class ConversationPlayerComponent implements OnChanges, OnDestroy {
  @Input({ required: true }) lesson!: ConversationLesson;
  /** Emits true once the last line is showing (played through or navigated to), false otherwise. */
  @Output() lastLineChange = new EventEmitter<boolean>();
  @ViewChild('player') playerRef?: ElementRef<HTMLAudioElement>;

  lineIndex = 0;
  playing = false;
  lineText = '';
  who = '';
  activeSpeaker: string = 'maya';
  audioStatus = 'Ready';
  progressPct = 0;

  constructor(private readonly library: ConversationLibrary) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['lesson'] && this.lesson) {
      this.lineIndex = 0;
      this.playing = false;
      this.showLine();
    }
  }

  ngOnDestroy(): void {
    this.audio()?.pause();
  }

  private audio(): HTMLAudioElement | undefined {
    return this.playerRef?.nativeElement;
  }

  private showLine(): void {
    const line = this.lesson.conversation[this.lineIndex];
    if (!line) return;
    this.activeSpeaker = line.speaker;
    this.who = line.speaker === 'maya' ? 'Dr. Maya Krishnan' : 'Alex Duarte';
    this.lineText = line.text;
    this.progressPct = ((this.lineIndex + 1) / this.lesson.conversation.length) * 100;
    this.lastLineChange.emit(this.lineIndex === this.lesson.conversation.length - 1);
    const el = this.audio();
    if (el) {
      el.src = this.library.audioSrc(line.audioPath);
      this.audioStatus = 'Audio loaded';
      if (this.playing) {
        void el.play().catch(() => {
          this.audioStatus = 'Tap Play if the browser blocked autoplay';
          this.playing = false;
        });
      }
    }
  }

  togglePlay(): void {
    const el = this.audio();
    if (!el) return;
    if (this.playing) {
      el.pause();
      this.playing = false;
      this.audioStatus = 'Paused';
      return;
    }
    if (!el.src) this.showLine();
    void el.play().then(() => {
      this.playing = true;
      this.audioStatus = 'Playing';
    }).catch(() => {
      this.audioStatus = 'Tap Play if the browser blocked autoplay';
    });
  }

  nextLine(fromEnded: boolean): void {
    if (this.lineIndex >= this.lesson.conversation.length - 1) {
      this.playing = false;
      this.audioStatus = fromEnded ? 'Lesson complete' : 'Last line';
      return;
    }
    this.lineIndex += 1;
    this.showLine();
  }

  prevLine(): void {
    if (this.lineIndex === 0) return;
    this.lineIndex -= 1;
    this.showLine();
  }
}
