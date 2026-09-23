import { Component, Input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'fhi-code-widget',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="codeWidget">
      <div class="codeHeader">
        <span class="codeBadge">{{ data.language || 'JSON' }}</span>
        <h5>{{ data.title }}</h5>
        @if (data.description) {
          <p class="codeDesc">{{ data.description }}</p>
        }
      </div>
      <div class="codeEditor" #editor>
        <div class="codeToolbar">
          <span class="codeFilename">{{ data.filename || 'example.json' }}</span>
          <div class="codeActions">
            <button class="iconBtn" (click)="copyCode()" title="Copy code">📋</button>
            @if (data.editable) {
              <button class="iconBtn" (click)="toggleEdit()" title="{{ isEditing() ? 'View' : 'Edit' }}">{{ isEditing() ? '👁' : '✏️' }}</button>
            }
            <button class="iconBtn" (click)="formatCode()" title="Format" disabled>⟳</button>
          </div>
        </div>
        @if (isEditing()) {
          <textarea
            class="codeTextarea"
            [(ngModel)]="editableCode"
            (input)="onCodeChange()"
            [placeholder]="'Enter ' + (data.language || 'JSON') + ' code...'"
            spellcheck="false"
          ></textarea>
        } @else {
          <pre class="codeDisplay"><code [innerHTML]="highlightedCode()"></code></pre>
        }
      </div>
      @if (data.validation) {
        <div class="codeValidation" [class.valid]="validationValid()" [class.invalid]="!validationValid()">
          <span class="validationIcon">{{ validationValid() ? '✓' : '✗' }}</span>
          <span class="validationMessage">{{ validationMessage() }}</span>
        </div>
      }
      @if (data.explanation) {
        <div class="codeExplanation">
          <strong>Explanation:</strong>
          <p>{{ data.explanation }}</p>
        </div>
      }
    </div>
  `,
  styles: `
    .codeWidget {
      background: white;
      border: 1px solid #D7E2EC;
      border-radius: 10px;
      overflow: hidden;
    }
    .codeHeader {
      padding: 16px 20px;
      border-bottom: 1px solid var(--n1);
      background: var(--n0);
    }
    .codeBadge {
      display: inline-block;
      padding: 3px 8px;
      background: var(--b1);
      color: var(--b6);
      border-radius: 4px;
      font-size: 10px;
      font-weight: 650;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      margin-bottom: 8px;
    }
    .codeHeader h5 {
      margin: 0 0 4px;
      font-size: 14px;
      color: var(--n9);
    }
    .codeDesc {
      margin: 0;
      font-size: 12px;
      color: var(--n5);
    }
    .codeEditor {
      background: #0D1B2A;
      border-radius: 0 0 10px 10px;
    }
    .codeToolbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 10px 16px;
      background: rgba(255,255,255,0.05);
      border-bottom: 1px solid rgba(255,255,255,0.1);
    }
    .codeFilename {
      font-family: ui-monospace, Consolas, monospace;
      font-size: 12px;
      color: #A8B8C8;
    }
    .codeActions {
      display: flex;
      gap: 8px;
    }
    .iconBtn {
      width: 32px;
      height: 32px;
      border: none;
      background: rgba(255,255,255,0.1);
      border-radius: 6px;
      cursor: pointer;
      display: grid;
      place-items: center;
      font-size: 14px;
      transition: background 0.15s;
    }
    .iconBtn:hover {
      background: rgba(255,255,255,0.2);
    }
    .iconBtn:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }
    .codeTextarea {
      width: 100%;
      min-height: 200px;
      padding: 16px;
      border: none;
      background: transparent;
      color: #E8EEF4;
      font-family: ui-monospace, Consolas, monospace;
      font-size: 13px;
      line-height: 1.6;
      resize: vertical;
      outline: none;
      tab-size: 2;
    }
    .codeTextarea::placeholder {
      color: #5A7390;
    }
    .codeDisplay {
      margin: 0;
      padding: 16px;
      overflow-x: auto;
    }
    .codeDisplay code {
      font-family: ui-monospace, Consolas, monospace;
      font-size: 13px;
      line-height: 1.6;
      color: #E8EEF4;
    }
    .codeDisplay .json-key { color: #7EC1FF; }
    .codeDisplay .json-string { color: #E0A06A; }
    .codeDisplay .json-number { color: #4CAF7A; }
    .codeDisplay .json-boolean { color: #C792EA; }
    .codeDisplay .json-null { color: #8FA0B2; }
    .codeValidation {
      padding: 12px 16px;
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 13px;
    }
    .codeValidation.valid {
      background: var(--gr1);
      color: var(--gr6);
      border-top: 1px solid var(--gr6);
    }
    .codeValidation.invalid {
      background: #fdeeee;
      color: #c44;
      border-top: 1px solid #c44;
    }
    .validationIcon {
      font-weight: 700;
    }
    .codeExplanation {
      padding: 16px;
      background: var(--n0);
      border-top: 1px solid var(--n1);
    }
    .codeExplanation strong {
      display: block;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: var(--n6);
      margin-bottom: 8px;
    }
    .codeExplanation p {
      margin: 0;
      font-size: 13px;
      color: var(--n7);
      line-height: 1.6;
    }
  `,
})
export class CodeWidgetComponent {
  @Input({ required: true }) data!: {
    title: string;
    description?: string;
    code: string;
    language?: string;
    filename?: string;
    editable?: boolean;
    validation?: boolean;
    explanation?: string;
  };

  readonly isEditing = signal(false);
  readonly editableCode = signal('');
  readonly highlightedCode = signal('');

  ngOnInit(): void {
    this.editableCode.set(this.data.code);
    this.updateHighlight();
  }

  private updateHighlight(): void {
    const code = this.isEditing() ? this.editableCode() : this.data.code;
    this.highlightedCode.set(this.syntaxHighlight(code, this.data.language || 'json'));
  }

  onCodeChange(): void {
    this.updateHighlight();
    if (this.data.validation) {
      this.validateCode();
    }
  }

  toggleEdit(): void {
    this.isEditing.update(v => !v);
    if (!this.isEditing()) {
      this.updateHighlight();
    }
  }

  copyCode(): void {
    navigator.clipboard.writeText(this.isEditing() ? this.editableCode() : this.data.code);
  }

  formatCode(): void {
    try {
      const formatted = JSON.stringify(JSON.parse(this.editableCode()), null, 2);
      this.editableCode.set(formatted);
      this.updateHighlight();
    } catch {
      // Not valid JSON, skip formatting
    }
  }

  readonly validationValid = signal(true);
  readonly validationMessage = signal('Valid syntax');

  private validateCode(): void {
    if (this.data.language === 'json' || this.data.language === 'fhir') {
      try {
        JSON.parse(this.editableCode());
        this.validationValid.set(true);
        this.validationMessage.set('Valid JSON syntax');
      } catch (e) {
        this.validationValid.set(false);
        this.validationMessage.set('Invalid JSON: ' + (e as Error).message);
      }
    } else {
      this.validationValid.set(true);
      this.validationMessage.set('Syntax OK');
    }
  }

  private syntaxHighlight(code: string, language: string): string {
    if (language === 'json' || language === 'fhir') {
      return code
        .replace(/&/g, '&')
        .replace(/</g, '<')
        .replace(/>/g, '>')
        .replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, (match) => {
          let cls = 'json-number';
          if (/^"/.test(match)) {
            if (/:$/.test(match)) {
              cls = 'json-key';
            } else {
              cls = 'json-string';
            }
          } else if (/true|false/.test(match)) {
            cls = 'json-boolean';
          } else if (/null/.test(match)) {
            cls = 'json-null';
          }
          return '<span class="' + cls + '">' + match + '</span>';
        });
    }
    return code.replace(/&/g, '&').replace(/</g, '<').replace(/>/g, '>');
  }
}