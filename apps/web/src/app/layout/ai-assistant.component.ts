import { Component, HostListener, effect, inject, signal } from '@angular/core';
import { marked } from 'marked';
import { AuthService } from '../core/auth.service';
import { AssistantContextService } from '../core/assistant-context.service';
import { AssistantApi } from '../core/assistant.api';

interface ChatMessage {
  role: 'user' | 'assistant';
  text: string;
}

const GREETING: ChatMessage = {
  role: 'assistant',
  text: "Hi — ask me anything about FHIR, the topic or phase you're currently viewing, or your own progress and enrolled courses.",
};

@Component({
  selector: 'fhi-ai-assistant',
  standalone: true,
  template: `
    @if (auth.isLoggedIn()) {
      <div class="aiDock">
        @if (open()) {
          <section
            class="aiPanel"
            role="dialog"
            aria-labelledby="aiTitle"
            aria-modal="true"
            (keydown.escape)="close()"
          >
            <div class="aiHead">
              <div class="aiBrand">
                <span class="aiMark" aria-hidden="true">AI</span>
                <div>
                  <b id="aiTitle">AI assistant</b>
                  <small>Ask anything about FHIR</small>
                </div>
              </div>
              <button type="button" class="aiIconBtn" aria-label="Close assistant" (click)="close()">
                ×
              </button>
            </div>

            <div class="aiMessages">
              @for (msg of messages(); track $index) {
                <div class="bubble" [class.user]="msg.role === 'user'" [class.bot]="msg.role === 'assistant'">
                  @if (msg.role === 'assistant') {
                    <div class="markdown" [innerHTML]="renderMarkdown(msg.text)"></div>
                  } @else {
                    {{ msg.text }}
                  }
                </div>
              }
              @if (loading()) {
                <div class="bubble bot loadingBubble">Thinking…</div>
              }
            </div>

            <form class="aiComposer" (submit)="$event.preventDefault(); send()">
              <label class="srOnly" for="aiAsk">Ask anything</label>
              <input
                id="aiAsk"
                type="text"
                name="ask"
                autocomplete="off"
                placeholder="Ask anything…"
                [value]="draft()"
                (input)="draft.set($any($event.target).value)"
                (keydown.escape)="close()"
                [disabled]="loading()"
              />
              <button type="button" class="cancelBtn" (click)="close()">Cancel</button>
              <button type="submit" class="sendBtn" [disabled]="!draft().trim() || loading()">Send</button>
            </form>
          </section>
        }

        <button
          type="button"
          class="aiFab"
          [class.hidden]="open()"
          (click)="open.set(true)"
          aria-label="Open AI assistant"
        >
          <span class="aiFabMark" aria-hidden="true">AI</span>
          <span class="aiFabLabel">Ask anything</span>
        </button>
      </div>
    }
  `,
  styles: `
    .aiDock {
      position: fixed;
      right: 20px;
      bottom: 20px;
      z-index: 80;
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 12px;
      pointer-events: none;
    }
    .aiDock > * { pointer-events: auto; }

    .aiFab {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      border: 0;
      border-radius: 999px;
      padding: 10px 16px 10px 10px;
      background: linear-gradient(160deg, var(--n9), var(--n8));
      color: #fff;
      box-shadow: 0 10px 28px rgba(11, 28, 44, .28);
      font-weight: 600;
      font-size: 13px;
      letter-spacing: .01em;
    }
    .aiFab.hidden { display: none; }
    .aiFab:hover { filter: brightness(1.08); }
    .aiFabMark {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      display: grid;
      place-items: center;
      background: var(--o7);
      font-size: 11px;
      font-weight: 800;
      letter-spacing: .04em;
    }

    .aiPanel {
      width: min(560px, calc(100vw - 32px));
      height: min(600px, calc(100vh - 110px));
      display: flex;
      flex-direction: column;
      background: rgba(255, 255, 255, .96);
      border: 1px solid var(--g3);
      border-radius: 16px;
      box-shadow: var(--shadow);
      overflow: hidden;
      animation: fadeInUp 0.28s ease;
    }
    .aiHead {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding: 12px 14px;
      background: linear-gradient(160deg, var(--n9), var(--n8));
      color: #fff;
      flex-shrink: 0;
      position: relative;
      z-index: 1;
    }
    .aiBrand {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .aiMark {
      width: 34px;
      height: 34px;
      border-radius: 10px;
      display: grid;
      place-items: center;
      background: var(--o7);
      font-size: 11px;
      font-weight: 800;
    }
    .aiBrand b {
      display: block;
      font-size: 13px;
      font-weight: 650;
    }
    .aiBrand small {
      display: block;
      font-size: 11px;
      color: #9AA8B8;
    }
    .aiIconBtn {
      flex: 0 0 auto;
      width: 32px;
      height: 32px;
      border: 1px solid rgba(255,255,255,.35);
      border-radius: 8px;
      background: rgba(255,255,255,.12);
      color: #fff;
      font-size: 22px;
      line-height: 1;
      padding: 0;
    }
    .aiIconBtn:hover { background: rgba(255,255,255,.22); }

    .aiMessages {
      flex: 1;
      overflow: auto;
      padding: 14px;
      display: flex;
      flex-direction: column;
      gap: 10px;
      background: var(--n0);
    }
    .bubble {
      max-width: 88%;
      padding: 10px 12px;
      border-radius: 12px;
      font-size: 13px;
      line-height: 1.5;
      white-space: pre-wrap;
    }
    .bubble.bot {
      align-self: flex-start;
      background: #fff;
      border: 1px solid var(--g3);
      color: var(--n9);
      border-bottom-left-radius: 4px;
    }
    .bubble.user {
      align-self: flex-end;
      background: var(--b6);
      color: #fff;
      border-bottom-right-radius: 4px;
    }
    .bubble.loadingBubble {
      color: var(--n6);
      font-style: italic;
    }

    .aiComposer {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      padding: 12px;
      border-top: 1px solid var(--g3);
      background: #fff;
    }
    .aiComposer input {
      flex: 1 1 100%;
      min-width: 0;
      border: 1px solid var(--g3);
      border-radius: 10px;
      padding: 10px 12px;
      background: var(--n0);
      color: var(--n9);
    }
    .aiComposer input:focus {
      outline: 2px solid var(--b6);
      outline-offset: 1px;
      background: #fff;
    }
    .cancelBtn,
    .sendBtn {
      min-height: 38px;
      border-radius: 10px;
      padding: 0 14px;
      font-size: 13px;
      font-weight: 650;
    }
    .cancelBtn {
      margin-left: auto;
      border: 1px solid var(--g3);
      background: #fff;
      color: var(--n7);
    }
    .cancelBtn:hover { background: var(--n0); }
    .sendBtn {
      border: 0;
      background: var(--b6);
      color: #fff;
    }
    .sendBtn:disabled {
      opacity: .45;
      cursor: not-allowed;
    }
    .srOnly {
      position: absolute;
      width: 1px;
      height: 1px;
      overflow: hidden;
      clip: rect(0 0 0 0);
    }

    @media (max-width: 520px) {
      .aiDock { right: 12px; bottom: 12px; }
      .aiFabLabel { display: none; }
      .aiFab { padding: 10px; }
    }
  `,
})
export class AiAssistantComponent {
  readonly auth = inject(AuthService);
  private readonly context = inject(AssistantContextService);
  private readonly api = inject(AssistantApi);

  readonly open = signal(false);
  readonly draft = signal('');
  readonly loading = signal(false);
  readonly messages = signal<ChatMessage[]>([GREETING]);

  constructor() {
    // The assistant is mounted once at the app root and outlives login/logout,
    // so its open/history state has to be reset explicitly when a session ends
    // -- otherwise the next login instantly shows the previous session's chat.
    effect(() => {
      if (!this.auth.isLoggedIn()) {
        this.open.set(false);
        this.messages.set([GREETING]);
      }
    });
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.open()) {
      this.close();
    }
  }

  close(): void {
    this.open.set(false);
  }

  renderMarkdown(text: string): string {
    // Angular's [innerHTML] binding sanitizes this automatically (strips scripts/unsafe attrs),
    // so we don't need to (and shouldn't) bypass security here.
    return marked.parse(text, { async: false, breaks: true }) as string;
  }

  send(): void {
    const text = this.draft().trim();
    if (!text || this.loading()) return;
    this.messages.update((msgs) => [...msgs, { role: 'user', text }]);
    this.draft.set('');
    this.loading.set(true);

    const ctx = this.context.current();
    const contextType = ctx.type;
    const contextId = ctx.type === 'topic' ? ctx.topicId : ctx.type === 'phase' ? ctx.phaseId : null;

    this.api.ask(contextType, contextId, text).subscribe({
      next: (res) => {
        this.messages.update((msgs) => [...msgs, { role: 'assistant', text: res.answer }]);
        this.loading.set(false);
      },
      error: (e) => {
        const detail = e?.error?.message ?? e?.message ?? 'please try again.';
        this.messages.update((msgs) => [
          ...msgs,
          { role: 'assistant', text: `Sorry, I couldn't get an answer — ${detail}` },
        ]);
        this.loading.set(false);
      },
    });
  }
}
