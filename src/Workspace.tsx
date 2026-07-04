import { useState, useRef, useEffect, useCallback } from 'react'
import { mockProject, mockMessages } from './mock-data'
import type { ProjectModel, InterviewMessage } from './types'
import './Workspace.css'

function getStatusLabel(status: ProjectModel['status']): string {
  switch (status) {
    case 'collecting': return '자료 수집 중'
    case 'interviewing': return '인터뷰 진행 중'
    case 'ready_for_output': return '산출물 준비 완료'
  }
}

function renderMessageContent(content: string) {
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

function getPriorityBadgeClass(priority: number) {
  if (priority >= 5) return 'badge-priority--high'
  if (priority >= 4) return 'badge-priority--mid'
  return 'badge-priority--low'
}

function getPriorityLabel(priority: number) {
  if (priority >= 5) return '🔴 높음'
  if (priority >= 4) return '🟠 중간'
  return '🟡 낮음'
}

function renderStars(priority: number) {
  return '★'.repeat(priority) + '☆'.repeat(5 - priority)
}

export default function Workspace() {
  const [project, setProject] = useState<ProjectModel>(() => ({ ...mockProject }))
  const [messages, setMessages] = useState<InterviewMessage[]>(() => [...mockMessages])
  const [inputValue, setInputValue] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

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
    const userMsg: InterviewMessage = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: now,
    }
    setMessages(prev => [...prev, userMsg])
    setInputValue('')

    // Mock completion increase
    setProject(prev => {
      const next = { ...prev }
      next.completion = Math.min(100, next.completion + 12)
      if (next.completion >= 100) {
        next.status = 'ready_for_output'
      }
      
      // Remove the top missing info
      if (next.missing.length > 0) {
        next.missing = [...next.missing.slice(1)]
      }
      
      // Update detected info mock
      next.detected = {
        ...next.detected,
        "추가 확인 사항": "업데이트 됨",
      }

      return next
    })

    setTimeout(() => {
      const aiMsg: InterviewMessage = {
        id: `msg_${Date.now() + 1}`,
        role: 'ai',
        content: `감사합니다. 답변을 바탕으로 공고 내용을 업데이트했습니다.\n\n다음으로 궁금한 점이 있습니다. 디자인도 함께 진행하시나요?`,
        timestamp: new Date().toISOString(),
      }
      setMessages(prev => [...prev, aiMsg])
    }, 1000)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="workspace">
      {/* ── Project Header ── */}
      <header className="project-header">
        <div className="project-header__left">
          <h1 className="project-header__title">TM CRM 프로젝트 명세서 작성</h1>
          <span className={`project-header__status project-header__status--${project.status === 'ready_for_output' ? 'ready' : project.status}`}>
            <span className="project-header__status-dot" />
            {getStatusLabel(project.status)}
          </span>
        </div>
        <div className="project-header__right">
          <button className="btn btn-secondary" type="button">
            공고 템플릿 설정
          </button>
          <button className="btn btn-primary" type="button" disabled={project.status !== 'ready_for_output'}>
            최종 공고 생성
          </button>
        </div>
      </header>

      {/* ── Sidebar (Dashboard) ── */}
      <aside className="sidebar">
        {/* Progress Bar */}
        <div className="sidebar__section dashboard-progress">
          <div className="dashboard-progress__header">
            <h2 className="sidebar__heading">프로젝트 진행도</h2>
            <span className="dashboard-progress__value">{project.completion}%</span>
          </div>
          <div className="dashboard-progress__bar">
            <div 
              className="dashboard-progress__fill" 
              style={{ width: `${project.completion}%` }} 
            />
          </div>
          <p className="dashboard-progress__desc">공고 작성 가능 수준</p>
        </div>

        {/* Detected Info */}
        <div className="sidebar__section">
          <h2 className="sidebar__heading">AI가 파악한 프로젝트</h2>
          <div className="detected-grid">
            {Object.entries(project.detected).map(([key, val]) => (
              <div key={key} className="detected-item">
                <div className="detected-item__label">
                  {key === 'service' ? '서비스' : 
                   key === 'platform' ? '플랫폼' : 
                   key === 'projectType' ? '개발 형태' : 
                   key === 'users' ? '예상 사용자' : 
                   key === 'coreFeatures' ? '핵심 기능' : 
                   key === 'admin' ? '관리자' : 
                   key === 'currentOperation' ? '현재 운영' : key}
                </div>
                <div className="detected-item__value">
                  {Array.isArray(val) ? val.join(', ') : val}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Missing Info */}
        <div className="sidebar__section">
          <h2 className="sidebar__heading">아직 확인되지 않은 정보</h2>
          <div className="missing-list">
            {project.missing.map((item, idx) => (
              <div key={idx} className="missing-item">
                <span className={`missing-item__badge ${getPriorityBadgeClass(item.priority)}`}>
                  {getPriorityLabel(item.priority)}
                </span>
                <span className="missing-item__title">{item.title}</span>
              </div>
            ))}
            {project.missing.length === 0 && (
              <div className="missing-item missing-item--empty">
                모든 필수 정보가 수집되었습니다.
              </div>
            )}
          </div>
        </div>

        {/* Recommended Questions */}
        <div className="sidebar__section">
          <h2 className="sidebar__heading">추천 질문 (가장 중요)</h2>
          <div className="question-list">
            {project.recommendedQuestions.map((q, idx) => (
              <div key={idx} className="question-card">
                <div className="question-card__header">
                  <span className="question-card__number">{idx + 1}.</span>
                  <span className="question-card__priority">영향도 {renderStars(q.priority)}</span>
                </div>
                <div className="question-card__question">{q.question}</div>
                <div className="question-card__reason">
                  <strong>이유:</strong> {q.reason}
                </div>
              </div>
            ))}
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

      {/* ── Preview Panel ── */}
      <aside className="preview-panel">
        <div className="preview-panel__header">
          <h2 className="preview-panel__heading">공고 미리보기 (초안)</h2>
          <span className="preview-panel__status">실시간 업데이트 중</span>
        </div>
        <div className="preview-panel__content">
          <pre className="preview-panel__text">
            {project.draft || '아직 충분한 정보가 수집되지 않았습니다.'}
          </pre>
        </div>
      </aside>
    </div>
  )
}
