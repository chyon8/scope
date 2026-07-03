// Project Detective — Core Types (from PRD schema)

export interface SectionData {
  label: string
  value: string
  confidence: number // 0-100
  source: 'document' | 'user' | 'ai_inferred'
  source_refs: string[]
  updated_at: string
}

export interface Hypothesis {
  id: string
  statement: string
  confidence: number
  status: 'unconfirmed' | 'confirmed' | 'rejected'
  related_section: string
}

export interface SourceDocument {
  doc_id: string
  name: string
  type: 'pdf' | 'docx' | 'pptx' | 'xlsx' | 'notion' | 'figma' | 'image'
  status: 'processed' | 'failed' | 'pending_auth'
}

export interface InterviewLogEntry {
  turn_id: string
  question: string
  answer: string
  affected_sections: string[]
  confidence_delta: number
}

export interface ProjectModel {
  project_id: string
  org_id: string
  status: 'collecting' | 'interviewing' | 'ready_for_output'
  overall_confidence: number
  sections: Record<string, SectionData>
  hypotheses: Hypothesis[]
  source_documents: SourceDocument[]
  interview_log: InterviewLogEntry[]
}

export interface InterviewMessage {
  id: string
  role: 'ai' | 'user'
  content: string
  timestamp: string
  affected_sections: string[]
}
