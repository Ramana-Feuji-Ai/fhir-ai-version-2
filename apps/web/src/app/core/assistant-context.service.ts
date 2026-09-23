import { Injectable, signal } from '@angular/core';

export type AssistantContext =
  | { type: 'topic'; phaseId: number; topicId: number }
  | { type: 'phase'; phaseId: number }
  | { type: 'none' };

/** Tracks which topic/phase is currently on screen, so the AI assistant (rendered
 *  globally in app.component.ts) knows what "this topic" / "this phase" means
 *  without needing to search for it. */
@Injectable({ providedIn: 'root' })
export class AssistantContextService {
  readonly current = signal<AssistantContext>({ type: 'none' });

  setPhase(phaseId: number): void {
    this.current.set({ type: 'phase', phaseId });
  }

  setTopic(phaseId: number, topicId: number): void {
    this.current.set({ type: 'topic', phaseId, topicId });
  }

  clear(): void {
    this.current.set({ type: 'none' });
  }
}
