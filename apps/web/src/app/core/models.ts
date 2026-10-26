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

export interface SandboxResourceTypeMeta {
  resourceType: string;
  count: number;
  sampleIds: string[];
}

export interface SandboxMeta {
  resourceTypes: SandboxResourceTypeMeta[];
}

export type SandboxOperation = 'read' | 'search' | 'create' | 'update' | 'delete' | 'history' | 'transaction' | 'batch';

export interface SandboxRequestLogEntry {
  id: string;
  timestamp: string;
  operation: SandboxOperation;
  method: string;
  url: string;
  requestBody: string | null;
  status: number;
  ok: boolean;
  responseBody: string;
}

// ---------------------------------------------------------------- 8.3 Design and Development Assistant

export interface RecommendResourcesResponse {
  answer: string;
}

export interface GeneratePayloadResponse {
  json: string;
  valid: boolean;
  issues: string[];
}

export interface GenerateApiResponse {
  request: string;
  explanation: string;
}

export interface ExplainIgResponse {
  answer: string;
  checklist: string[];
}

// ---------------------------------------------------------------- 8.4 Test Case and Test Data Assistant

export interface TestCase {
  id: string;
  type: string;
  scenario: string;
  expectedResult: string;
}

export interface GenerateTestCasesResponse {
  cases: TestCase[];
}

export type DefectInjection = 'NONE' | 'TERMINOLOGY' | 'REFERENCE' | 'MIXED';

export interface GeneratedResource {
  resourceType: string;
  id: string;
  valid: boolean;
  issues: string[];
  writtenToSandbox: boolean;
}

export interface GenerateTestDataResponse {
  seed: number;
  fhirVersion: string;
  resourceCounts: Record<string, number>;
  defectCount: number;
  writtenToSandboxCount: number;
  resources: GeneratedResource[];
  bundleJson: string;
}

export interface ValidationIssueEntry {
  severity: string;
  code: string;
  expression: string;
  diagnostics: string;
}

export interface ExplainFailureResponse {
  issues: ValidationIssueEntry[];
  explanation: string;
}

// ---------------------------------------------------------------- 8.5 Enterprise Knowledge Assistant

export type KnowledgeStatus = 'APPROVED' | 'PENDING' | 'DISABLED';

export interface KnowledgeAsset {
  id: string;
  title: string;
  assetType: string;
  version: string;
  status: KnowledgeStatus;
  tags: string;
  summary: string;
  updatedAt: string;
}

export interface KnowledgeCitation {
  assetId: string;
  title: string;
  version: string;
  assetType: string;
}

export interface KnowledgeAskResponse {
  answer: string;
  citations: KnowledgeCitation[];
}
