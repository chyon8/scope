import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import type { ProjectModel, TimelineEvent } from './types'
import './Workspace.css'

function getStatusLabel(status: string): string {
  switch (status) {
    case 'new': return '신규 문의'
    case 'interviewing': return '정보 갱신 중'
    case 'ready': return '산출물 준비 완료'
    case 'won': return '계약 완료'
    case 'lost': return '취소'
    default: return '상태 불명'
  }
}

function formatTime(iso: string): string {
  if (!iso) return ''
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

function getEventIcon(type: string) {
  switch (type) {
    case 'document_upload': return '📄'
    case 'audio_upload': return '🎧'
    case 'quick_memo': return '📝'
    case 'ai_analysis': return '✨'
    default: return '📎'
  }
}

export default function Workspace() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [project, setProject] = useState<ProjectModel | null>(null)
  const [events, setEvents] = useState<TimelineEvent[]>([])
  const [memoValue, setMemoValue] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const [activeTab, setActiveTab] = useState<'inspection' | 'recruitment' | 'progress' | 'completion'>('inspection')
  
  const feedEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

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

  const fetchProject = async () => {
    if (!id) return
    try {
      const res = await fetch(`http://localhost:3001/api/projects/${id}`)
      if (!res.ok) {
        navigate('/')
        return
      }
      const data = await res.json()
      setProject(data)
      setEvents(data.events || [])
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    fetchProject()
  }, [id])

  const handleUpload = async (file?: File, text?: string) => {
    if (!id) return
    
    const formData = new FormData()
    if (file) formData.append('file', file)
    if (text) formData.append('text', text)

    // Add optimistic UI event
    const now = new Date().toISOString()
    const optimisticEvent: TimelineEvent = {
      id: `evt_opt_${Date.now()}`,
      type: file ? (file.type.includes('audio') ? 'audio_upload' : 'document_upload') : 'quick_memo',
      title: file ? `${file.name} 업로드 중...` : '빠른 메모 업로드 중...',
      description: text || '파일을 업로드 중입니다.',
      timestamp: now,
    }
    setEvents(prev => [...prev, optimisticEvent])

    try {
      const res = await fetch(`http://localhost:3001/api/projects/${id}/upload`, {
        method: 'POST',
        body: formData
      })
      const data = await res.json()
      setProject(data)
      setEvents(data.events || [])
      setMemoValue('')
    } catch (e) {
      console.error("Upload failed", e)
      // Remove optimistic event on failure (simplified)
      fetchProject() 
    }
  }

  async function handleStatusChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newStatus = e.target.value
    setProject(prev => prev ? { ...prev, status: newStatus as any } : null)
    
    try {
      await fetch(`http://localhost:3001/api/projects/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })
      fetchProject() // reload to get new event
    } catch (error) {
      console.error("Failed to update status", error)
    }
  }

  function handleAddMemo() {
    const text = memoValue.trim()
    if (!text) return
    handleUpload(undefined, text)
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
    const file = e.dataTransfer.files?.[0]
    if (file) handleUpload(file)
  }
  
  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) handleUpload(file)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleAddMemo()
    }
  }

  if (!project) return null

  return (
    <div className="workspace">
      {/* ── Project Header ── */}
      <header className="project-header">
        <div className="project-header__left">
          <button className="btn btn-secondary btn-icon" onClick={() => navigate('/')} title="전체 프로젝트로 돌아가기" style={{ marginRight: '16px' }}>
            ←
          </button>
          <h1 className="project-header__title">{project.title}</h1>
          <select 
            className={`project-header__status project-header__status--${project.status}`}
            value={project.status}
            onChange={handleStatusChange}
          >
            <option value="new">신규 문의</option>
            <option value="interviewing">상담 및 정보 수집</option>
            <option value="ready">모집 중 (공고 완성)</option>
            <option value="won">계약 완료</option>
            <option value="lost">취소/보류</option>
          </select>
        </div>
        <div className="project-header__right">
          <button className="btn btn-secondary" type="button">
            공고 템플릿 설정
          </button>
          <button className="btn btn-primary" type="button" disabled={project.status !== 'ready'}>
            최종 공고 생성
          </button>
        </div>
      </header>

      {/* ── Tab Navigation ── */}
      <nav className="workspace-tabs">
        <button className={`workspace-tab ${activeTab === 'inspection' ? 'workspace-tab--active' : ''}`} onClick={() => setActiveTab('inspection')}>검수 및 기획</button>
        <button className={`workspace-tab ${activeTab === 'recruitment' ? 'workspace-tab--active' : ''}`} onClick={() => setActiveTab('recruitment')}>모집 및 후보</button>
        <button className={`workspace-tab ${activeTab === 'progress' ? 'workspace-tab--active' : ''}`} onClick={() => setActiveTab('progress')}>계약 및 진행</button>
        <button className={`workspace-tab ${activeTab === 'completion' ? 'workspace-tab--active' : ''}`} onClick={() => setActiveTab('completion')}>사후 리뷰</button>
      </nav>

      {/* ── Sidebar (Left Panel) ── */}
      {activeTab === 'inspection' ? (
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
            {Object.keys(project.detected || {}).length === 0 ? (
              <div className="missing-item missing-item--empty">아직 파악된 정보가 없습니다.</div>
            ) : (
              Object.entries(project.detected).map(([key, val]) => (
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
                    {Array.isArray(val) 
                      ? val.join(', ') 
                      : (typeof val === 'object' ? JSON.stringify(val) : val as string)}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Missing Info */}
        <div className="sidebar__section">
          <h2 className="sidebar__heading">아직 확인되지 않은 정보</h2>
          <div className="missing-list">
            {(project.missing || []).map((item, idx) => (
              <div key={idx} className="missing-item">
                <span className={`missing-item__badge ${getPriorityBadgeClass(item.priority)}`}>
                  {getPriorityLabel(item.priority)}
                </span>
                <span className="missing-item__title">{item.title}</span>
              </div>
            ))}
            {(project.missing || []).length === 0 && (
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
            {(project.recommendedQuestions || []).map((q, idx) => (
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
            {(project.recommendedQuestions || []).length === 0 && (
              <div className="missing-item missing-item--empty">
                추천할 질문이 없습니다.
              </div>
            )}
          </div>
        </div>
      </aside>
      ) : activeTab === 'recruitment' ? (
        <aside className="sidebar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="empty-tab-view">
            <h2>모집 및 후보 검토</h2>
            <p>지원한 개발사 리스트와 후보 미팅 녹취 요약 기능이 들어갈 자리입니다.</p>
          </div>
        </aside>
      ) : activeTab === 'progress' ? (
        <aside className="sidebar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="empty-tab-view">
            <h2>진행 트래킹</h2>
            <p>스코프 변경, 예산 증액, 중도 취소 사유를 기록하는 기능이 들어갈 자리입니다.</p>
          </div>
        </aside>
      ) : (
        <aside className="sidebar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="empty-tab-view">
            <h2>사후 리뷰 및 자산화</h2>
            <p>최종 코멘트를 남기고 과거 데이터와 연동하여 유사 사례 DB를 구축하는 자리입니다.</p>
          </div>
        </aside>
      )}

      {/* ── Main Feed (Timeline) ── */}
      <div className="timeline-panel">
        <div className="timeline-feed">
          {events.length === 0 ? (
            <div className="missing-item missing-item--empty" style={{ textAlign: 'center', marginTop: '40px' }}>
              아직 등록된 활동이 없습니다.<br/>하단에 녹취록이나 문서를 업로드해보세요.
            </div>
          ) : (
            events.map((evt) => (
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
            ))
          )}
          <div ref={feedEndRef} />
        </div>

        <div className="input-zone">
          <div 
            className={`dropzone ${isDragging ? 'dropzone--dragging' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input 
              type="file" 
              ref={fileInputRef} 
              style={{ display: 'none' }} 
              onChange={handleFileSelect} 
            />
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

      {/* ── Preview Panel (Right Panel) ── */}
      {activeTab === 'inspection' ? (
        <aside className="preview-panel">
        <div className="preview-panel__header">
          <h2 className="preview-panel__heading">공고 미리보기 (초안)</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="preview-panel__status">실시간 업데이트 중</span>
            {project.draft && (
              <button
                className="btn btn-secondary"
                type="button"
                style={{ fontSize: '12px', padding: '4px 10px' }}
                onClick={() => {
                  navigator.clipboard.writeText(project.draft || '')
                  const btn = document.getElementById('copy-btn')
                  if (btn) {
                    btn.textContent = '✅ 복사됨!'
                    setTimeout(() => { btn.textContent = '📋 복사하기' }, 2000)
                  }
                }}
                id="copy-btn"
              >
                📋 복사하기
              </button>
            )}
          </div>
        </div>
        <div className="preview-panel__content">
          <pre className="preview-panel__text">
            {project.draft || '아직 충분한 정보가 수집되지 않았습니다.'}
          </pre>
        </div>
      </aside>
      ) : (
        <aside className="preview-panel" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-surface)' }}>
          <div className="empty-tab-view" style={{ border: 'none', margin: 0, padding: 0, background: 'transparent' }}>
            <p style={{ color: 'var(--color-muted)' }}>현재 탭에서는 공고 미리보기가 비활성화됩니다.</p>
          </div>
        </aside>
      )}
    </div>
  )
}
