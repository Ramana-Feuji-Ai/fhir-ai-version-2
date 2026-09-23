import { ConversationLesson } from './conversation.library';

export interface TrackSummary {
  track: string;
  phaseCount: number;
}

export interface CourseDefinition {
  slug: string;
  title: string;
  role: string;
  level: string;
  category: string;
  duration: string;
  studyHours: number;
  prerequisites: string;
  accent: string;
  description: string;
  practicalOutcome: string;
  outcomes: string[];
  phaseIds: number[];
}

export interface CourseProgressSummary {
  slug: string;
  percentComplete: number;
  topicDone: number;
  topicCount: number;
  completed: boolean;
}

export interface CourseSummary extends CourseDefinition, CourseProgressSummary {
  moduleCount: number;
}

export interface CourseModule {
  phaseId: number;
  title: string;
  description: string;
  duration: string;
  topicCount: number;
  topicDone: number;
  percentComplete: number;
  completed: boolean;
  topicTitles: string[];
}

export interface CourseDetail {
  course: CourseSummary;
  modules: CourseModule[];
}

export interface Enrollment {
  slug: string;
  enrolledAt: string;
  completed: boolean;
  certificateNumber: string | null;
}

export interface CurriculumSummary {
  phaseCount: number;
  topicCount: number;
  topicDone: number;
  percentComplete: number;
  phasesCompleted: number;
  tracks: TrackSummary[];
}

export interface PhaseCard {
  id: number;
  track: string;
  title: string;
  description: string;
  duration: string;
  topicCount: number;
  sectionCount: number;
  topicDone: number;
  percentComplete: number;
  completed: boolean;
  topicTitles?: string[];
}

export interface TopicSummary {
  id: number;
  title: string;
  summary: string | null;
  legacyKey: string;
  slideCount: number;
  completed: boolean;
  hasVideo?: boolean;
  hasInteractive?: boolean;
}

export interface SectionNode {
  id: number;
  title: string;
  sortOrder: number;
  topics: TopicSummary[];
}

export interface Slide {
  id: number;
  title: string;
  bodyHtml: string;
  sortOrder: number;
  videoUrl?: string;
  videoTitle?: string;
  videoDuration?: string;
  videoPoster?: string;
  interactiveType?: 'quiz' | 'lab' | 'code' | 'diagram' | 'scenario';
  interactiveData?: any;
  conversation?: ConversationLesson;
}

export interface TopicDetail {
  id: number;
  title: string;
  summary: string | null;
  detailHtml: string | null;
  examTip: string | null;
  legacyKey: string;
  keyPoints: string[];
  slides: Slide[];
  completed: boolean;
}

export interface PhaseResources {
  specs: { label: string; url: string; note: string | null }[];
  examples: { title: string; body: string }[];
  lab: { title: string; body: string } | null;
  quiz: {
    id: number;
    prompt: string;
    choices: string[];
    answerIndex: number;
    explanation: string;
  }[];
}

export interface PhaseDetail {
  id: number;
  track: string;
  title: string;
  description: string;
  duration: string;
  objectives: string[];
  outcomes: string[];
  topicTotal: number;
  topicDone: number;
  percentComplete: number;
  sections: SectionNode[];
  resources: PhaseResources;
}

export interface PhaseProgress {
  phaseId: number;
  topicTotal: number;
  topicDone: number;
  percentComplete: number;
  completedLegacyKeys: string[];
  completedTopicIds: number[];
}
