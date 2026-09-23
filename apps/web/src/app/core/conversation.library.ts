import { Injectable } from '@angular/core';
import topicNarration from '../../assets/topic-narration.json';

export interface ConversationLine {
  speaker: 'maya' | 'alex' | string;
  text: string;
  audioPath: string;
}

export interface ConversationLesson {
  slug: string;
  title: string;
  conversation: ConversationLine[];
}

interface TopicNarrationEntry {
  topicTitle: string;
  conversation: ConversationLine[];
}

const TOPIC_NARRATION = topicNarration as Record<string, TopicNarrationEntry>;

@Injectable({ providedIn: 'root' })
export class ConversationLibrary {
  /** Deterministic per-topic narration lookup, keyed by the topic's DB id. */
  forTopic(topicId: number): ConversationLesson | null {
    const entry = TOPIC_NARRATION[String(topicId)];
    if (!entry) return null;
    return { slug: `topic-${topicId}`, title: entry.topicTitle, conversation: entry.conversation };
  }

  audioSrc(path: string): string {
    const clean = path.replace(/^\/+/, '');
    return clean.startsWith('assets/') ? `/${clean}` : `/assets/${clean}`;
  }
}
