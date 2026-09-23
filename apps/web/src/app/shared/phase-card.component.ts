import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PhaseCard } from '../core/models';

@Component({
  selector: 'fhi-phase-card',
  standalone: true,
  imports: [RouterLink],
  template: `
    <article class="card" [class.isComplete]="phase.completed">
      <div class="cardTop">
        <div class="row">
          <span class="phaseNum">Phase {{ phase.id }}</span>
          <span class="badgeRow">
            @if (phase.completed) {
              <span class="badge statusDone">Completed</span>
            } @else if (phase.topicDone > 0) {
              <span class="badge statusProgress">{{ phase.percentComplete }}%</span>
            }
            <span class="badge" [class]="trackClass">{{ phase.track }}</span>
          </span>
        </div>
      </div>
      <div class="cardBody">
        <h3>{{ phase.title }}</h3>
        <p>{{ phase.description }}</p>
        <div class="cardMeta">
          <span>◷ {{ durationLabel }}</span>
          <span>{{ phase.topicDone }}/{{ phase.topicCount }} topics</span>
        </div>
        <div class="cardProgress" aria-hidden="true">
          <i [style.width.%]="phase.percentComplete"></i>
        </div>
      </div>
      <div class="cardfoot">
        <span class="footStatus" [class.done]="phase.completed">
          {{ phase.completed ? 'Phase completed' : 'Interactive slide decks' }}
        </span>
        <a class="link openPhase" [routerLink]="['/phase', phase.id]">
          {{ phase.completed ? 'Review →' : 'Open phase →' }}
        </a>
      </div>
    </article>
  `,
  styles: `
    .badgeRow {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      flex-wrap: wrap;
      justify-content: flex-end;
    }
    .badge.statusDone {
      background: var(--gr1);
      color: var(--gr6);
    }
    .badge.statusProgress {
      background: var(--gr1);
      color: var(--gr6);
    }
    .cardProgress {
      margin-top: 12px;
      height: 4px;
      border-radius: 99px;
      background: var(--n1);
      overflow: hidden;
    }
    .cardProgress > i {
      display: block;
      height: 100%;
      background: linear-gradient(90deg, var(--gr6), #4CAF7A);
      border-radius: 99px;
    }
    a.openPhase {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      text-decoration: none;
      line-height: 1;
      white-space: nowrap;
      background: var(--n8);
      color: #fff;
      border-radius: 8px;
      padding: 0 14px;
      min-height: 36px;
      font-weight: 600;
      font-size: 13px;
    }
    a.openPhase:hover {
      background: var(--n9);
      color: #fff;
      text-decoration: none;
    }
    .card.isComplete a.openPhase {
      background: var(--gr6);
    }
    .card.isComplete a.openPhase:hover {
      background: #156343;
    }
    .footStatus {
      font-size: 12px;
      color: var(--n5);
      font-weight: 500;
    }
    .footStatus.done {
      color: var(--gr6);
      font-weight: 650;
    }
  `,
})
export class PhaseCardComponent {
  @Input({ required: true }) phase!: PhaseCard;

  get trackClass(): string {
    return 'track-' + String(this.phase.track || '').replace(/\s+/g, '');
  }

  get durationLabel(): string {
    return String(this.phase.duration || '')
      .replace(/\u00e2\u20ac\u201c/g, '-')
      .replace(/â€“|â€”|–|—/g, '-')
      .trim();
  }
}
