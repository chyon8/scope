import { useState, useRef, useEffect, useCallback } from 'react'
import { mockProject, mockMessages } from './mock-data'
import type { ProjectModel, InterviewMessage } from './types'
import './Workspace.css'

// PRD 기준 섹션 가중치
const SECTION_WEIGHTS: Record<string, number> = {
  purpose: 15,
  core_problem: 15,
  features: 15,
  users: 10,
  data: 10,
  admin: 10,
  integrations: 10,
  current_operation: 5,
  success_criteria: 5,
  budget: 2.5,
  timeline: 2.5,
}

// Mock AI 응답 — 섹션별 후속 질문
const FOLLOW_UP_QUESTIONS: Record<string, string> = {
  success_criteria:
    '감사합니다. 그러면 구체적인 수치 목표를 확인하겠습니다.\n\n현재 인사팀의 월간 수작업 시간은 대략 어느 정도인가요? 그리고 시스템 도입 후 목표 감소율이 있으신가요?',
  data:
    '데이터 관련 질문입니다.\n\n기존 SAP HR에 축적된 직원 데이터는 어느 정도 규모인가요? (직원 수, 연도 수)\n그리고 신규 시스템으로 **전체 마이그레이션**이 필요한가요, 아니면 최근 N년치만 이전하면 되나요?',
  integrations:
    '외부 시스템 연동에 대해 여쭤보겠습니다.\n\n현재 급여 이체 시 은행 시스템과 직접 연동되어 있나요?\n그 외에 연동이 필요한 외부 시스템이 있나요? (예: 그룹웨어, ERP, 전자결재 등)',
  features:
    '기능 범위를 좀 더 구체화하겠습니다.\n\n모바일 앱이 필수인가요? 웹만으로도 충분한가요?\n그리고 **급여 계산** 기능은 신규 시스템에 포함되어야 하나요, 아니면 기존 SAP에서 계속 처리하나요?',
  admin:
    '관리자 권한 구조를 확인하겠습니다.\n\n각 부서 팀장의 관리 범위는 어디까지인가요?\n- 소속 직원의 출퇴근/휴가 승인만?\n- 인사평가, 급여 조회까지 가능한가요?',
}

function getConfidenceLevel(value: number): 'high' | 'mid' | 'low' {
  if (value >= 70) return 'high'
  if (value >= 40) return 'mid'
  return 'low'
}

function getStatusLabel(status: ProjectModel['status']): string {
  switch (status) {
    case 'collecting': return '자료 수집 중'
    case 'interviewing': return '인터뷰 진행 중'
    case 'ready_for_output': return '산출물 준비 완료'
  }
}

function getSourceLabel(source: string): string {
  switch (source) {
    case 'document': return '문서에서 추출'
    case 'user': return '사용자 입력'
    case 'ai_inferred': return 'AI 추정'
    default: return source
  }
}

function getDocIcon(type: string): string {
  switch (type) {
    case 'pdf': return '📄'
    case 'pptx': return '📊'
    case 'docx': return '📝'
    case 'xlsx': return '📈'
    case 'image': return '🖼️'
    default: return '📎'
  }
}

function calculateOverallConfidence(sections: ProjectModel['sections']): number {
  let total = 0
  let weightSum = 0
  for (const [key, data] of Object.entries(sections)) {
    const weight = SECTION_WEIGHTS[key] ?? 0
    total += data.confidence * weight
    weightSum += weight
  }
  return weightSum > 0 ? Math.round(total / weightSum) : 0
}

function renderMessageContent(content: string) {
  // Simple markdown-like rendering: **bold** and newlines
  const parts = content.split('\n')
  return parts.map((line, i) => {
    if (line.trim() === '') return <br key={i} />
    const rendered = line.split(/(\*\*[^*]+\*\*)/).map((segment, j) => {
      if (segment.startsWith('**') && segment.endsWith('**')) {
        return <strong key={j}>{segment.slice(2, -2)}</strong>
      }
      return segment
    })
    return <p key={i}>{rendered}</p>
  })
}

function formatTime(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
}

export default function Workspace() {
  const [project, setProject] = useState<ProjectModel>(() => ({ ...mockProject }))
  const [messages, setMessages] = useState<InterviewMessage[]>(() => [...mockMessages])
  const [inputValue, setInputValue] = useState('')
  const [selectedSection, setSelectedSection] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const overallConfidence = calculateOverallConfidence(project.sections)

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current
    if (ta) {
      ta.style.height = 'auto'
      ta.style.height = Math.min(ta.scrollHeight, 160) + 'px'
    }
  }, [inputValue])

  function handleSend() {
    const text = inputValue.trim()
    if (!text) return

    const now = new Date().toISOString()

    // Find what section the last AI question was about
    const lastAiMsg = [...messages].reverse().find(m => m.role === 'ai' && m.affected_sections.length > 0)
    const affectedSections = lastAiMsg?.affected_sections ?? []

    // Add user message
    const userMsg: InterviewMessage = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: now,
      affected_sections: affectedSections,
    }
    setMessages(prev => [...prev, userMsg])
    setInputValue('')

    // Update confidence for affected sections (mock: +15~25)
    setProject(prev => {
      const next = { ...prev, sections: { ...prev.sections } }
      for (const sectionKey of affectedSections) {
        const sec = next.sections[sectionKey]
        if (sec) {
          const boost = 15 + Math.floor(Math.random() * 10)
          next.sections[sectionKey] = {
            ...sec,
            confidence: Math.min(100, sec.confidence + boost),
            source: 'user',
            value: sec.value || text.slice(0, 100),
            updated_at: now,
          }
        }
      }
      next.overall_confidence = calculateOverallConfidence(next.sections)

      // Check if ready
      const allAbove = Object.values(next.sections).every(s => s.confidence >= 70)
      if (allAbove) {
        next.status = 'ready_for_output'
      }

      return next
    })

    // Mock AI follow-up after delay
    setTimeout(() => {
      // Find next lowest-confidence section
      const sortedSections = Object.entries(project.sections)
        .filter(([key]) => key in SECTION_WEIGHTS)
        .sort((a, b) => {
          const wA = SECTION_WEIGHTS[a[0]] ?? 0
          const wB = SECTION_WEIGHTS[b[0]] ?? 0
          // Priority = low confidence * high weight
          return (a[1].confidence - wA) - (b[1].confidence - wB)
        })

      // Pick the next section that isn't the one we just answered
      const nextSection = sortedSections.find(([key]) => !affectedSections.includes(key))
      const nextKey = nextSection?.[0] ?? 'features'
      const nextLabel = project.sections[nextKey]?.label ?? nextKey

      const followUp = FOLLOW_UP_QUESTIONS[nextKey]
        ?? `**${nextLabel}** 영역에 대해 더 알고 싶습니다.\n\n이 영역에 대해 알고 계신 정보가 있으시면 말씀해 주세요.`

      const confidenceAfter = calculateOverallConfidence(project.sections)
      const delta = confidenceAfter - overallConfidence

      const aiMsg: InterviewMessage = {
        id: `msg_${Date.now() + 1}`,
        role: 'ai',
        content: (delta > 0 ? `이해도가 **+${delta}%** 올랐습니다. 현재 전체 이해도: **${Math.min(100, overallConfidence + delta)}%**\n\n` : '') + followUp,
        timestamp: new Date().toISOString(),
        affected_sections: [nextKey],
      }
      setMessages(prev => [...prev, aiMsg])
    }, 800)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const circumference = 2 * Math.PI * 16
  const dashOffset = circumference - (overallConfidence / 100) * circumference

  // Section ordering by weight desc
  const sectionEntries = Object.entries(project.sections).sort((a, b) => {
    const wA = SECTION_WEIGHTS[a[0]] ?? 0
    const wB = SECTION_WEIGHTS[b[0]] ?? 0
    return wB - wA
  })

  return (
    <div className="workspace">
      {/* ── Project Header ── */}
      <header className="project-header">
        <div className="project-header__left">
          <h1 className="project-header__title">인사관리 시스템 클라우드 전환</h1>
          <span className={`project-header__status project-header__status--${project.status === 'ready_for_output' ? 'ready' : project.status}`}>
            <span className="project-header__status-dot" />
            {getStatusLabel(project.status)}
          </span>
        </div>
        <div className="project-header__right">
          <div className="overall-confidence">
            <div className="overall-confidence__ring">
              <svg width="40" height="40" viewBox="0 0 40 40">
                <circle className="overall-confidence__ring-bg" cx="20" cy="20" r="16" />
                <circle
                  className="overall-confidence__ring-fill"
                  cx="20" cy="20" r="16"
                  strokeDasharray={circumference}
                  strokeDashoffset={dashOffset}
                />
              </svg>
              <span className="overall-confidence__value">{overallConfidence}%</span>
            </div>
            <span className="overall-confidence__label">전체 이해도</span>
          </div>
          <button className="btn btn-primary" type="button" disabled={project.status !== 'ready_for_output'}>
            산출물 생성
          </button>
        </div>
      </header>

      {/* ── Sidebar ── */}
      <aside className="sidebar">
        <div className="sidebar__section">
          <h2 className="sidebar__heading">프로젝트 모델</h2>
          <div className="section-list">
            {sectionEntries.map(([key, data]) => {
              const level = getConfidenceLevel(data.confidence)
              return (
                <div
                  key={key}
                  className={`section-item ${selectedSection === key ? 'section-item--active' : ''}`}
                  onClick={() => setSelectedSection(selectedSection === key ? null : key)}
                >
                  <div className="section-item__info">
                    <div className="section-item__name">{data.label}</div>
                    <div className="section-item__source">{getSourceLabel(data.source)}</div>
                  </div>
                  <span className={`section-item__confidence section-item__confidence--${level}`}>
                    {data.confidence}
                  </span>
                  <div className="section-item__bar">
                    <div
                      className={`section-item__bar-fill section-item__bar-fill--${level}`}
                      style={{ width: `${data.confidence}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Selected Section Detail */}
        {selectedSection && project.sections[selectedSection] && (
          <div className="section-detail">
            <div className="section-detail__header">
              <span className="section-detail__title">{project.sections[selectedSection].label}</span>
              <span className={`section-detail__confidence section-item__confidence--${getConfidenceLevel(project.sections[selectedSection].confidence)}`}>
                {project.sections[selectedSection].confidence}%
              </span>
            </div>
            <div className={`section-detail__value ${!project.sections[selectedSection].value ? 'section-detail__value--empty' : ''}`}>
              {project.sections[selectedSection].value || '아직 정보가 없습니다'}
            </div>
            <div className="section-detail__meta">
              <span>{getSourceLabel(project.sections[selectedSection].source)}</span>
              <span>가중치 {SECTION_WEIGHTS[selectedSection] ?? 0}%</span>
            </div>
          </div>
        )}

        {/* Hypotheses */}
        {project.hypotheses.length > 0 && (
          <div className="sidebar__section">
            <h2 className="sidebar__heading">AI 가설</h2>
            <div className="hypothesis-list">
              {project.hypotheses.map(h => (
                <div key={h.id} className="hypothesis-item">
                  <span className="hypothesis-item__marker" />
                  <span className="hypothesis-item__text">{h.statement}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Documents */}
        <div className="sidebar__section">
          <h2 className="sidebar__heading">업로드 문서</h2>
          <div className="doc-list">
            {project.source_documents.map(doc => (
              <div key={doc.doc_id} className="doc-item">
                <span className="doc-item__icon">{getDocIcon(doc.type)}</span>
                <span className="doc-item__name">{doc.name}</span>
                {doc.status === 'processed' && <span className="doc-item__status" />}
              </div>
            ))}
            <button className="doc-upload-btn" type="button">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
              문서 추가
            </button>
          </div>
        </div>
      </aside>

      {/* ── Chat Panel ── */}
      <div className="chat-panel">
        <div className="chat-messages">
          {messages.map(msg => (
            <div key={msg.id} className={`message message--${msg.role}`}>
              <div className="message__avatar">
                {msg.role === 'ai' ? 'AI' : 'U'}
              </div>
              <div>
                <div className="message__bubble">
                  {renderMessageContent(msg.content)}
                </div>
                {msg.affected_sections.length > 0 && (
                  <div className="message__sections">
                    {msg.affected_sections.map(s => (
                      <span key={s} className="message__section-tag">
                        {project.sections[s]?.label ?? s}
                      </span>
                    ))}
                  </div>
                )}
                <div className="message__time">{formatTime(msg.timestamp)}</div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <div className="chat-input-area">
          <div className="chat-input-wrapper">
            <textarea
              ref={textareaRef}
              className="chat-input"
              placeholder="답변을 입력하세요... (Shift+Enter로 줄바꿈)"
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
            />
            <button
              className="chat-send-btn"
              type="button"
              onClick={handleSend}
              disabled={!inputValue.trim()}
              aria-label="전송"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
