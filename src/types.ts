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

export interface ProjectModel {
  project_id: string
  org_id: string
  status: 'collecting' | 'interviewing' | 'ready_for_output'
  completion: number // 0-100
  detected: DetectedInfo
  missing: MissingInfo[]
  recommendedQuestions: RecommendedQuestion[]
  source_documents: SourceDocument[]
  draft?: string
}

export interface InterviewMessage {
  id: string
  role: 'ai' | 'user'
  content: string
  timestamp: string
}
