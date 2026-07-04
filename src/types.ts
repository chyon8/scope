// Project Detective — Core Types (from PRD schema)

export interface SourceDocument {
  doc_id: string
  name: string
  type: 'pdf' | 'docx' | 'pptx' | 'xlsx' | 'notion' | 'figma' | 'image'
  status: 'processed' | 'failed' | 'pending_auth'
}

export interface DetectedInfo {
  service: string
  platform: string
  projectType: string
  users: string
  coreFeatures: string[]
  [key: string]: any
}

export interface MissingInfo {
  title: string
  priority: number
}

export interface RecommendedQuestion {
  question: string
  reason: string
  priority: number
}

export type ProjectStatus = 'new' | 'interviewing' | 'ready' | 'won' | 'lost'

export interface ProjectModel {
  project_id: string
  org_id: string
  title: string
  client: string
  assignee: '장수룡' | '이상민' | '김세민' | '미지정'
  updatedAt: string
  status: ProjectStatus
  completion: number // 0-100
  detected: DetectedInfo
  missing: MissingInfo[]
  recommendedQuestions: RecommendedQuestion[]
  source_documents: SourceDocument[]
  draft?: string
}

export interface TimelineEvent {
  id: string
  type: 'document_upload' | 'audio_upload' | 'quick_memo' | 'ai_analysis'
  title: string
  description: string
  timestamp: string
  impact?: string // e.g. "진행도 +40% 상승"
}
