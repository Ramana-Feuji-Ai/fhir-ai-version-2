export interface TopicSummary {
  slug: string;
  title: string;
  kicker: string;
  durationHint: string;
  phase: number;
  summary: string;
  interactiveType: string;
}

export interface TopicDetail {
  slug: string;
  title: string;
  kicker: string;
  durationHint: string;
  phase: number;
  summary: string;
  references: string[];
  interactiveType: string;
  interactive: any;
  sections: { heading: string; body: string }[];
  conversation: {
    speaker: string;
    speakerName: string;
    speakerRole: string;
    text: string;
    audioPath: string;
  }[];
  quiz: { id: number; prompt: string; options: string[] }[];
}

export interface ProgressRow {
  topicSlug: string;
  completed: boolean;
  quizScore: number;
}
