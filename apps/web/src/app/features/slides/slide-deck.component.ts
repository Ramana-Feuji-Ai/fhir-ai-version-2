import { Component, HostListener, Input, output, signal, ViewChild, ElementRef } from '@angular/core';
import { DomSanitizer, SafeHtml, SafeResourceUrl } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { TopicDetail, Slide } from '../../core/models';
import { QuizWidgetComponent } from '../../shared/quiz-widget.component';
import { LabWidgetComponent } from '../../shared/lab-widget.component';
import { CodeWidgetComponent } from '../../shared/code-widget.component';
import { DiagramWidgetComponent } from '../../shared/diagram-widget.component';
import { ScenarioAnimationComponent } from '../../shared/scenario-animation.component';
import { ConversationPlayerComponent } from '../../shared/conversation-player.component';

@Component({
  selector: 'fhi-slide-deck',
  standalone: true,
  imports: [CommonModule, QuizWidgetComponent, LabWidgetComponent, CodeWidgetComponent, DiagramWidgetComponent, ScenarioAnimationComponent, ConversationPlayerComponent],
  template: `
    @if (topic.slides.length) {
      <div
        class="scormDeck"
        [class.noRail]="!hasRail"
        [class.isFullscreen]="fullscreen()"
        [attr.data-slide]="index()"
        [attr.data-count]="topic.slides.length"
      >
        <div class="scormChrome">
          <div class="chromeLeft">
            <span class="chromeBadge">▣</span>
            <div>
              <b>Learning slide</b>
              <div style="margin-top:2px">
                <span class="slidePos">{{ index() + 1 }} / {{ topic.slides.length }}</span>
              </div>
            </div>
          </div>
          <div class="chromeRight">
            @if (!fullscreen()) {
              <button type="button" class="fsBtn enterFs" (click)="enterFullscreen()">Full screen</button>
            } @else {
              <button type="button" class="fsBtn exitFs" (click)="exitFullscreen()">Exit full screen</button>
            }
          </div>
        </div>

        <div class="scormProgress">
          <i [style.width.%]="((index() + 1) / topic.slides.length) * 100"></i>
        </div>

        <div class="scormLayout">
          <div class="scormStage" [class.anim]="true">
            <div class="slidePane">
              <div class="slideType" [attr.data-kind]="kind().kind">{{ kind().label }}</div>
              <div class="slideKicker">{{ topic.title }}</div>
              <h4 class="slideTitle">{{ current().title }}</h4>

              @if (current().conversation) {
                <fhi-conversation-player
                  [lesson]="current().conversation!"
                  (lastLineChange)="conversationOnLastLine.set($event)"
                />
                @if (conversationOnLastLine() && fullscreen()) {
                  <div class="convoNextCta">
                    <span class="convoNextMsg">You've reached the end of this conversation.</span>
                    <div class="convoNextBtns">
                      <button type="button" class="convoPrevBtn" (click)="shift(-1)" [disabled]="index() === 0">← Previous</button>
                      <button type="button" class="convoNextBtn" [class.doneBtn]="isLastSlide()" (click)="onNext()">
                        {{ isLastSlide() ? 'Done' : 'Next →' }}
                      </button>
                    </div>
                  </div>
                }
              }

              @if (current().videoUrl) {
                <div class="slideVideo">
                  <video
                    #videoPlayer
                    class="videoPlayer"
                    [poster]="current().videoPoster"
                    [src]="safeVideoUrl()"
                    controls
                    (ended)="onVideoEnded()"
                    (play)="onVideoPlay()"
                    (timeupdate)="onVideoTimeUpdate($event)"
                    (error)="onVideoError($event)"
                    (loadstart)="onVideoLoadStart()"
                    (loadedmetadata)="onVideoLoadedMeta()"
                    (waiting)="onVideoWaiting()"
                    (canplay)="onVideoCanPlay()"
                    crossorigin="anonymous"
                    playsinline
                    preload="metadata"
                  ></video>
                  @if (videoLoading()) {
                    <div class="videoLoading">
                      <div class="spinner"></div>
                      <p>Loading video...</p>
                    </div>
                  }
                  @if (videoError()) {
                    <div class="videoError">
                      <span class="errorIcon">⚠</span>
                      <div>
                        <strong>Video unavailable</strong>
                        <p>The video could not be loaded.</p>
                        <details class="errorDetails">
                          <summary>Technical details</summary>
                          <pre>{{ getVideoErrorDetails() }}</pre>
                        </details>
                        <button class="btn small" (click)="retryVideo()">Retry</button>
                        <button class="btn secondary small" (click)="skipVideo()">Skip Video</button>
                      </div>
                    </div>
                  }
                  @if (!videoError() && !videoLoading()) {
                    @if (current().videoTitle) {
                      <div class="videoTitle">{{ current().videoTitle }}</div>
                    }
                    @if (current().videoDuration) {
                      <div class="videoDuration">{{ current().videoDuration }}</div>
                    }
                    <div class="videoProgress" [style.width.%]="videoProgress()"></div>
                  }
                </div>
              }
              
              @if (!current().videoUrl || (current().videoUrl && showBody())) {
                <div class="slideBody" [innerHTML]="safeBody()"></div>
              }

              @if (current().interactiveType && current().interactiveData) {
                <div class="interactiveSection" [ngSwitch]="current().interactiveType">
                  @switch (current().interactiveType) {
                    @case ('quiz') {
                      <fhi-quiz-widget [data]="current().interactiveData" (completed)="onInteractiveComplete($event)" />
                    }
                    @case ('lab') {
                      <fhi-lab-widget [data]="current().interactiveData" (completed)="onInteractiveComplete($event)" />
                    }
                    @case ('code') {
                      <fhi-code-widget [data]="current().interactiveData" />
                    }
                    @case ('diagram') {
                      <fhi-diagram-widget [data]="current().interactiveData" />
                    }
                    @case ('scenario') {
                      <fhi-scenario-animation [data]="current().interactiveData" />
                    }
                  }
                </div>
              }
            </div>
          </div>

          @if (hasRail) {
            <aside class="scormRail">
              @if (topic.keyPoints.length) {
                <div class="railCard">
                  <b>Key points</b>
                  <ul>
                    @for (k of topic.keyPoints; track k) {
                      <li>{{ k }}</li>
                    }
                  </ul>
                </div>
              }
              @if (topic.examTip) {
                <div class="railCard tip">
                  <b>Exam tip</b>
                  <p>{{ topic.examTip }}</p>
                </div>
              }
              @if (current().videoUrl) {
                <div class="railCard videoInfo">
                  <b>Video Lesson</b>
                  <p class="videoMeta">{{ current().videoTitle || 'Video Lesson' }}</p>
                  <p class="videoMeta">{{ current().videoDuration || 'Duration varies' }}</p>
                  <button class="btn small" (click)="scrollToVideo()">Jump to Video</button>
                </div>
              }
              <div class="railHint">Fullscreen: Esc to exit · ← → to navigate</div>
            </aside>
          }
        </div>

        <div class="scormNav">
          <div class="dots">
            @for (s of topic.slides; track s.id; let i = $index) {
              <button
                type="button"
                class="dot"
                [class.on]="i === index()"
                [class.seen]="i < index()"
                [class.hasVideo]="!!s.videoUrl"
                (click)="go(i)"
                [attr.aria-label]="'Slide ' + (i + 1) + (s.videoUrl ? ' (Video)' : '')"
              ></button>
            }
          </div>
          <div class="navBtns">
            <button type="button" class="prevBtn" (click)="shift(-1)" [disabled]="index() === 0">← Prev</button>
            <button type="button" class="nextBtn" [class.doneBtn]="isLastSlide()" (click)="onNext()">
              @if (isLastSlide()) { <span class="doneCheck" aria-hidden="true">✓</span> }
              {{ isLastSlide() ? 'Done' : 'Next →' }}
            </button>
          </div>
        </div>
      </div>
    } @else if (topic.detailHtml) {
      <div class="topicDetail" [innerHTML]="safeDetail()"></div>
    }
  `,
  styles: `
    .convoNextCta {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      flex-wrap: wrap;
      margin: -8px 0 20px;
      padding: 14px 16px;
      border-radius: 12px;
      background: linear-gradient(160deg, rgba(11,28,44,.88), rgba(20,48,74,.72));
      border: 1px solid rgba(255,255,255,.18);
    }
    .convoNextMsg {
      color: #fff;
      font-size: 13px;
      font-weight: 550;
    }
    .convoNextBtns {
      display: flex;
      gap: 8px;
    }
    .convoPrevBtn,
    .convoNextBtn {
      min-height: 38px;
      padding: 0 18px;
      border-radius: 8px;
      font-weight: 650;
      font-size: 13px;
    }
    .convoPrevBtn {
      border: 1px solid rgba(255,255,255,.25);
      background: rgba(255,255,255,.08);
      color: #fff;
    }
    .convoPrevBtn:hover:not(:disabled) { background: rgba(255,255,255,.16); }
    .convoPrevBtn:disabled { opacity: .4; cursor: default; }
    .convoNextBtn {
      border: 1px solid var(--o7);
      background: var(--o7);
      color: #1A1206;
    }
    .convoNextBtn:hover { filter: brightness(1.08); }
    .convoNextBtn.doneBtn {
      border-color: var(--gr6);
      background: linear-gradient(135deg, var(--gr6), #4CAF7A);
      color: #fff;
    }
    .slideVideo {
      margin: 16px 0 20px;
      border-radius: 12px;
      overflow: hidden;
      background: #000;
      position: relative;
    }
    .videoPlayer {
      width: 100%;
      max-height: 500px;
      display: block;
      background: #000;
    }
    .videoTitle {
      padding: 12px 16px 4px;
      font-size: 13px;
      font-weight: 600;
      color: var(--n9);
      background: white;
    }
    .videoDuration {
      padding: 0 16px 12px;
      font-size: 12px;
      color: var(--n5);
      background: white;
    }
    .videoProgress {
      height: 3px;
      background: linear-gradient(90deg, var(--o7), #E0A06A);
      transition: width 0.1s ease;
    }
    .videoLoading {
      position: absolute;
      inset: 0;
      background: rgba(0, 0, 0, 0.7);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 12px;
      color: white;
      z-index: 10;
    }
    .spinner {
      width: 40px;
      height: 40px;
      border: 4px solid rgba(255, 255, 255, 0.3);
      border-top-color: var(--o7);
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    .videoLoading p {
      margin: 0;
      font-size: 14px;
      font-weight: 500;
    }
    .interactiveSection {
      margin-top: 20px;
      padding: 20px;
      background: linear-gradient(135deg, #F7FAFC 0%, #EEF3F7 100%);
      border: 1px solid #D7E2EC;
      border-radius: 12px;
      border-left: 4px solid var(--b6);
      min-width: 0;
      max-width: 100%;
      overflow: hidden;
    }
    .railCard.videoInfo {
      background: linear-gradient(180deg, #FFF8F0, #F8EFE6);
      border-color: #EBD9C6;
    }
    .railCard.videoInfo b {
      color: var(--o7);
    }
    .videoMeta {
      font-size: 12px;
      color: var(--n7);
      margin: 4px 0;
    }
    .railCard .btn.small {
      margin-top: 8px;
      padding: 6px 12px;
      font-size: 11px;
      min-height: 32px;
    }
    .scormNav .dot.hasVideo::after {
      content: '▶';
      position: absolute;
      top: -8px;
      right: -8px;
      width: 16px;
      height: 16px;
      border-radius: 50%;
      background: var(--o7);
      color: white;
      font-size: 8px;
      display: grid;
      place-items: center;
    }
    .scormNav .dot.hasVideo.on::after {
      background: var(--b6);
    }
    .videoError {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 24px;
      background: #fff3e0;
      border: 1px solid #ffcc80;
      border-radius: 8px;
      color: #e65100;
    }
    .errorIcon {
      flex: none;
      font-size: 24px;
      margin-top: 2px;
    }
    .videoError strong {
      display: block;
      margin-bottom: 4px;
    }
    .videoError p {
      margin: 0 0 12px;
      font-size: 14px;
      color: #bf360c;
    }
    .errorDetails {
      margin: 12px 0;
    }
    .errorDetails summary {
      cursor: pointer;
      font-size: 12px;
      color: #bf360c;
      font-weight: 500;
    }
    .errorDetails pre {
      margin: 8px 0 0;
      padding: 12px;
      background: #1a1a1a;
      color: #4fc3f7;
      font-size: 11px;
      border-radius: 6px;
      overflow-x: auto;
      white-space: pre-wrap;
    }
    .videoError .btn {
      margin-right: 8px;
    }
  `,
})
export class SlideDeckComponent {
  @Input({ required: true }) topic!: TopicDetail;

  /** Emitted when learner finishes the last slide (Done). */
  readonly completed = output<number>();

  @ViewChild('videoPlayer') videoPlayerRef!: ElementRef<HTMLVideoElement>;

  readonly index = signal(0);
  readonly fullscreen = signal(false);
  readonly conversationOnLastLine = signal(false);
  readonly videoProgress = signal(0);
  readonly videoWatched = signal(false);
  readonly showBody = signal(true);
  readonly videoError = signal(false);
  readonly videoLoading = signal(false);
  private finished = false;
  private videoLoadTimeout: ReturnType<typeof setTimeout> | null = null;

  constructor(private readonly sanitizer: DomSanitizer) {}

  private clearVideoTimeout(): void {
    if (this.videoLoadTimeout) {
      clearTimeout(this.videoLoadTimeout);
      this.videoLoadTimeout = null;
    }
  }

  private setVideoTimeout(): void {
    this.clearVideoTimeout();
    this.videoLoadTimeout = setTimeout(() => {
      const video = this.videoPlayerRef?.nativeElement;
      if (video && video.readyState < 1) { // HAVE_NOTHING
        console.warn('Video load timeout - taking too long to load');
        this.videoLoading.set(false);
        this.videoError.set(true);
      }
    }, 10000); // 10 second timeout
  }

  get hasRail(): boolean {
    return !!(this.topic.keyPoints?.length || this.topic.examTip || this.current().videoUrl || this.current().conversation);
  }

  current(): Slide {
    return this.topic.slides[this.index()] ?? this.topic.slides[0];
  }

  isLastSlide(): boolean {
    return this.index() === this.topic.slides.length - 1;
  }

  kind(): { kind: string; label: string } {
    const title = (this.current()?.title || '').toLowerCase();
    const i = this.index();
    const total = this.topic.slides.length;
    if (title.includes('tip') || title.includes('exam')) return { kind: 'exam', label: 'Exam tip' };
    if (title.includes('practice') || title.includes('lab')) return { kind: 'practice', label: 'Practice' };
    if (this.current().conversation) return { kind: 'video', label: 'Conversation lesson' };
    if (this.current().videoUrl) return { kind: 'video', label: 'Video Lesson' };
    if (this.current().interactiveType) return { kind: 'interactive', label: 'Interactive' };
    if (i === 0) return { kind: 'overview', label: 'Overview' };
    if (i === total - 1) return { kind: 'wrap', label: 'Wrap-up' };
    return { kind: 'concept', label: 'Concept' };
  }

  go(i: number): void {
    this.index.set(Math.max(0, Math.min(i, this.topic.slides.length - 1)));
    this.videoProgress.set(0);
    this.videoWatched.set(false);
    this.showBody.set(true);
    this.conversationOnLastLine.set(false);
  }

  shift(delta: number): void {
    this.go(this.index() + delta);
  }

  onNext(): void {
    if (this.index() === this.topic.slides.length - 1) {
      this.markDone();
      return;
    }
    this.shift(1);
  }

  private markDone(): void {
    if (this.fullscreen()) this.exitFullscreen();
    if (this.finished) {
      return;
    }
    this.finished = true;
    this.completed.emit(this.topic.id);
  }

  enterFullscreen(): void {
    this.fullscreen.set(true);
    document.body.classList.add('scormFsOpen');
  }

  exitFullscreen(): void {
    this.fullscreen.set(false);
    document.body.classList.remove('scormFsOpen');
  }

  @HostListener('document:keydown', ['$event'])
  onKey(e: KeyboardEvent): void {
    if (!this.fullscreen()) return;
    if (e.key === 'Escape') this.exitFullscreen();
    if (e.key === 'ArrowLeft') this.shift(-1);
    if (e.key === 'ArrowRight') this.onNext();
  }

  safeBody(): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(this.current()?.bodyHtml ?? '');
  }

  safeDetail(): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(this.topic.detailHtml ?? '');
  }

  safeVideoUrl(): SafeResourceUrl {
    return this.sanitizer.bypassSecurityTrustResourceUrl(this.current()?.videoUrl ?? '');
  }

  onVideoEnded(): void {
    this.videoWatched.set(true);
    this.showBody.set(true);
  }

  onVideoPlay(): void {
    this.videoWatched.set(true);
  }

  onVideoTimeUpdate(event: Event): void {
    const video = event.target as HTMLVideoElement;
    if (video.duration) {
      this.videoProgress.set((video.currentTime / video.duration) * 100);
    }
  }

  onVideoLoadStart(): void {
    this.videoLoading.set(true);
  }

  onVideoLoadedMeta(): void {
    this.videoLoading.set(false);
  }

  onVideoWaiting(): void {
    this.videoLoading.set(true);
  }

  onVideoCanPlay(): void {
    this.videoLoading.set(false);
  }

  onVideoError(event: Event): void {
    this.clearVideoTimeout();
    const video = this.videoPlayerRef?.nativeElement;
    const errorCode = video?.error?.code;
    const errorMsg = errorCode === 1 ? 'MEDIA_ERR_ABORTED'
      : errorCode === 2 ? 'MEDIA_ERR_NETWORK'
      : errorCode === 3 ? 'MEDIA_ERR_DECODE'
      : errorCode === 4 ? 'MEDIA_ERR_SRC_NOT_SUPPORTED'
      : 'UNKNOWN_ERROR';
    console.warn(`Video failed to load: ${errorMsg}`, event);
    this.videoError.set(true);
    this.videoLoading.set(false);
  }

  retryVideo(): void {
    this.clearVideoTimeout();
    this.videoError.set(false);
    this.videoLoading.set(true);
    const video = this.videoPlayerRef?.nativeElement;
    if (video) {
      video.load();
    }
  }

  skipVideo(): void {
    this.clearVideoTimeout();
    this.videoError.set(false);
    this.videoLoading.set(false);
    this.showBody.set(true);
  }

  getVideoErrorDetails(): string {
    const video = this.videoPlayerRef?.nativeElement;
    if (!video || !video.error) return 'No error details available';
    const code = video.error.code;
    const messages: Record<number, string> = {
      1: 'MEDIA_ERR_ABORTED: The fetching process was aborted by the user agent at the user\'s request.',
      2: 'MEDIA_ERR_NETWORK: A network error occurred while downloading the video.',
      3: 'MEDIA_ERR_DECODE: An error occurred while decoding the video.',
      4: 'MEDIA_ERR_SRC_NOT_SUPPORTED: The video format is not supported or the server doesn\'t allow cross-origin requests.'
    };
    return `Error Code: ${code} (${messages[code] || 'Unknown'})\nVideo URL: ${video.src}\nReady State: ${video.readyState}\nNetwork State: ${video.networkState}`;
  }

  onInteractiveComplete(completed: boolean): void {
    if (completed) {
      // Mark slide as interacted
    }
  }

  scrollToVideo(): void {
    const videoElement = document.querySelector('.slideVideo');
    if (videoElement) {
      videoElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }
}
