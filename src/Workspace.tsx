import { useState, useRef, useEffect, useCallback } from 'react'
import { mockProject, mockTimelineEvents } from './mock-data'
import type { ProjectModel, TimelineEvent } from './types'
import './Workspace.css'

function getStatusLabel(status: ProjectModel['status']): string {
  switch (status) {
    case 'collecting': return '자료 수집 중'
    case 'interviewing': return '정보 갱신 중'
    case 'ready_for_output': return '산출물 준비 완료'
  }
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

function getEventIcon(type: TimelineEvent['type']) {
  switch (type) {
    case 'document_upload': return '📄'
    case 'audio_upload': return '🎧'
    case 'quick_memo': return '📝'
    case 'ai_analysis': return '✨'
    default: return '📎'
  }
}

export default function Workspace() {
  const [project, setProject] = useState<ProjectModel>(() => ({ ...mockProject }))
  const [events, setEvents] = useState<TimelineEvent[]>(() => [...mockTimelineEvents])
  const [memoValue, setMemoValue] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const feedEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const scrollToBottom = useCallback(() => {
    feedEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [events, scrollToBottom])

  useEffect(() => {
    const ta = textareaRef.current
    if (ta) {
      ta.style.height = 'auto'
      ta.style.height = Math.min(ta.scrollHeight, 160) + 'px'
    }
  }, [memoValue])

  function handleAddMemo() {
    const text = memoValue.trim()
    if (!text) return

    const now = new Date().toISOString()
    const memoEvent: TimelineEvent = {
      id: `evt_${Date.now()}`,
      type: 'quick_memo',
      title: '빠른 메모 추가됨',
      description: text,
      timestamp: now,
    }
    setEvents(prev => [...prev, memoEvent])
    setMemoValue('')

    // Mock completion increase
    triggerMockAnalysis()
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault()
    setIsDragging(true)
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault()
    setIsDragging(false)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setIsDragging(false)
    const files = Array.from(e.dataTransfer.files)
    if (files.length === 0) return

    const now = new Date().toISOString()
    const fileEvent: TimelineEvent = {
      id: `evt_${Date.now()}`,
      type: files[0].type.includes('audio') ? 'audio_upload' : 'document_upload',
      title: `${files[0].name} 업로드 됨`,
      description: '새로운 소스 파일이 시스템에 등록되었습니다.',
      timestamp: now,
    }
    setEvents(prev => [...prev, fileEvent])

    triggerMockAnalysis()
  }

  function triggerMockAnalysis() {
    setTimeout(() => {
      setProject(prev => {
        const next = { ...prev }
        next.completion = Math.min(100, next.completion + 15)
        if (next.completion >= 100) {
          next.status = 'ready_for_output'
        }
        if (next.missing.length > 0) {
          next.missing = [...next.missing.slice(1)]
        }
        next.detected = {
          ...next.detected,
          "추가 정보": "방금 입력된 내용 반영됨",
        }
        return next
      })

      const aiEvent: TimelineEvent = {
        id: `evt_${Date.now() + 1}`,
        type: 'ai_analysis',
        title: '신규 소스 분석 완료',
        description: '입력된 정보를 바탕으로 대시보드와 공고문을 업데이트했습니다.',
        timestamp: new Date().toISOString(),
        impact: `진행도 상승`,
      }
      setEvents(prev => [...prev, aiEvent])
    }, 1200)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleAddMemo()
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
          <h2 className="sidebar__heading">추천 질문 (통화 전 체크리스트)</h2>
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

      {/* ── Center Panel (Timeline & Dropzone) ── */}
      <div className="timeline-panel">
        <div className="timeline-feed">
          {events.map((evt) => (
            <div key={evt.id} className={`timeline-event timeline-event--${evt.type}`}>
              <div className="timeline-event__icon">
                {getEventIcon(evt.type)}
              </div>
              <div className="timeline-event__content">
                <div className="timeline-event__header">
                  <h3 className="timeline-event__title">{evt.title}</h3>
                  <span className="timeline-event__time">{formatTime(evt.timestamp)}</span>
                </div>
                <p className="timeline-event__desc">{evt.description}</p>
                {evt.impact && (
                  <div className="timeline-event__impact">{evt.impact}</div>
                )}
              </div>
            </div>
          ))}
          <div ref={feedEndRef} />
        </div>

        <div className="input-zone">
          <div 
            className={`dropzone ${isDragging ? 'dropzone--dragging' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="dropzone__icon">📥</div>
            <div className="dropzone__text">
              <strong>통화 녹취록</strong> 또는 <strong>요구사항 문서</strong>를 이곳에 끌어다 놓으세요.
            </div>
            <div className="dropzone__subtext">지원 포맷: txt, mp3, pdf, docx 등</div>
          </div>
          
          <div className="quick-memo">
            <div className="quick-memo__wrapper">
              <textarea
                ref={textareaRef}
                className="quick-memo__input"
                placeholder="또는 짧은 텍스트 메모를 직접 입력하세요..."
                value={memoValue}
                onChange={e => setMemoValue(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={1}
              />
              <button
                className="quick-memo__btn"
                type="button"
                onClick={handleAddMemo}
                disabled={!memoValue.trim()}
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
