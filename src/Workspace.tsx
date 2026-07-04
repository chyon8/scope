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
  
  const [meetings, setMeetings] = useState<any[]>([])
  const [selectedMeetingId, setSelectedMeetingId] = useState<number | null>(null)
  const [meetingDetail, setMeetingDetail] = useState<any | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  
  const MOCK_RECRUITMENT_DASHBOARD = {
    managerComment: "현재 예산(5,000만 원)으로 지원하는 개발사가 적어, 클라이언트에게 예산 1천만 원 증액 혹은 기능 다이어트를 설득 중입니다.",
    funnel: { views: 124, applications: 5, meetings: 2, shortlisted: 1 },
    issues: [
      { type: 'risk', title: '리스크/이슈', content: '개발사 후보 중 무인 결제 및 POS 연동 경험 부족 우려', source: 'AI 추출 (모집)' },
      { type: 'scope', title: '스코프 변경', content: '클라이언트 측에서 관리자 대시보드 내 매출 통계 차트 고도화 추가 요청됨', source: '매니저 기록 (계약 대기)' },
      { type: 'budget', title: '예산 문제', content: '레거시 DB 데이터 이관 비용 미포함으로 예산 초과 예상됨', source: '매니저 기록 (모집)' },
      { type: 'reaction', title: '클라이언트 반응', content: '일정(3개월) 단축에 민감함. UI 커스텀보다 빠른 오픈 선호.', source: 'AI 추출 (모집)' }
    ],
    qna: [
      { question: '기존 사내 POS 시스템의 DB 구조가 어떻게 되나요?', partner: '개발사 A', phase: '모집 단계' },
      { question: 'AWS 인프라 비용은 예산 5천만원과 별도로 클라이언트가 부담하나요?', partner: '개발사 B', phase: '모집 단계' }
    ],
    ranking: [
      { name: 'dxplayground', score: 92, reason: '예산 부합, 무인 키오스크 유사 포트폴리오 다수 보유' },
      { name: 'izensoft', score: 75, reason: '개발 역량 우수하나 레거시 이관 경험 부족 및 예산 초과(6천만원 제시)' }
    ]
  }

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

  // Fetch meeting list when switching to recruitment tab
  useEffect(() => {
    if (activeTab === 'recruitment' && id) {
      fetch(`http://localhost:3001/api/projects/${id}/meetings`)
        .then(res => res.json())
        .then(data => setMeetings(data.results || []))
        .catch(console.error)
    }
  }, [activeTab, id])

  const handleMeetingClick = async (meetingId: number) => {
    setSelectedMeetingId(meetingId)
    setMeetingDetail(null)
    try {
      const res = await fetch(`http://localhost:3001/api/meetings/${meetingId}`)
      const data = await res.json()
      setMeetingDetail(data)
    } catch (e) {
      console.error(e)
    }
  }

  const handleAnalyzeMeeting = async () => {
    if (!meetingDetail) return
    setIsAnalyzing(true)
    try {
      const res = await fetch(`http://localhost:3001/api/meetings/${meetingDetail.id}/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript: meetingDetail.transcript })
      })
      const data = await res.json()
      setMeetingDetail(prev => ({ ...prev, aiSummary: data }))
    } catch (e) {
      console.error(e)
    } finally {
      setIsAnalyzing(false)
    }
  }

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
        <aside className="sidebar">
          <div className="sidebar__section">
            <h2 className="sidebar__heading">모집 단계 요약</h2>
            <div 
              onClick={() => { setSelectedMeetingId(null); setMeetingDetail(null); }}
              style={{ padding: '12px', border: selectedMeetingId === null ? '1px solid var(--color-primary)' : '1px solid var(--color-border)', borderRadius: '8px', marginBottom: '24px', cursor: 'pointer', background: selectedMeetingId === null ? 'var(--color-surface-hover)' : 'var(--color-surface)' }}
            >
              <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--color-ink)' }}>📊 모집 현황 요약 (대시보드)</div>
            </div>

            <h2 className="sidebar__heading">개발사 사전 미팅 기록</h2>
            {meetings.length === 0 ? (
              <div className="missing-item missing-item--empty">등록된 미팅이 없습니다.</div>
            ) : (
              <div className="meeting-list">
                {meetings.map(m => (
                  <div 
                    key={m.id} 
                    className={`meeting-card ${selectedMeetingId === m.id ? 'meeting-card--active' : ''}`}
                    onClick={() => handleMeetingClick(m.id)}
                    style={{ padding: '12px', border: selectedMeetingId === m.id ? '1px solid var(--color-primary)' : '1px solid var(--color-border)', borderRadius: '8px', marginBottom: '8px', cursor: 'pointer', background: selectedMeetingId === m.id ? 'var(--color-surface-hover)' : 'var(--color-surface)' }}
                  >
                    <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: '4px' }}>{m.partner_slug} 미팅</div>
                    <div style={{ fontSize: '12px', color: 'var(--color-muted)', marginBottom: '8px' }}>일시: {m.created_at}</div>
                    <div style={{ fontSize: '12px', color: 'var(--color-ink)' }}>{m.summary}</div>
                  </div>
                ))}
              </div>
            )}
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

      {/* ── Main Feed (Timeline) OR Dashboard (Middle Panel) ── */}
      <div className="timeline-panel" style={{ backgroundColor: 'var(--color-surface)', overflowY: 'auto' }}>
        {activeTab === 'recruitment' ? (
          <div className="recruitment-dashboard" style={{ padding: 'var(--space-xl)' }}>
            <h2 className="preview-panel__heading" style={{ marginBottom: '24px' }}>📊 모집 단계 통합 대시보드</h2>
            <div style={{ padding: '16px', backgroundColor: 'rgba(204, 120, 92, 0.1)', borderRadius: '8px', color: 'var(--color-primary)', fontWeight: 600, fontSize: '14px', marginBottom: '20px' }}>
              🗣️ 담당 매니저 한줄 요약: {MOCK_RECRUITMENT_DASHBOARD.managerComment}
            </div>
            
            <h3 style={{ fontSize: '15px', marginBottom: '12px', fontWeight: 600 }}>주요 이슈</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
              {MOCK_RECRUITMENT_DASHBOARD.issues.map((issue, idx) => (
                <div key={idx} style={{ padding: '16px', backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-hairline)', borderRadius: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-ink)' }}>{issue.title}</span>
                    <span style={{ fontSize: '11px', background: 'var(--color-canvas)', color: 'var(--color-primary)', padding: '2px 8px', borderRadius: '4px', fontWeight: 500 }}>{issue.source}</span>
                  </div>
                  <div style={{ fontSize: '13px', lineHeight: 1.5, color: 'var(--color-body)' }}>{issue.content}</div>
                </div>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
              <div>
                <h3 style={{ fontSize: '15px', marginBottom: '12px', fontWeight: 600 }}>개발사 적합도 랭킹 (AI)</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {MOCK_RECRUITMENT_DASHBOARD.ranking.map((rank, idx) => (
                    <div key={idx} style={{ padding: '16px', backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-hairline)', borderRadius: '8px', display: 'flex', gap: '16px', alignItems: 'center' }}>
                      <div style={{ fontSize: '24px', fontWeight: 'bold', color: idx === 0 ? 'var(--color-primary)' : 'var(--color-muted)' }}>{idx + 1}</div>
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-ink)' }}>{rank.name} <span style={{ color: 'var(--color-primary)', fontSize: '13px', marginLeft: '4px' }}>({rank.score}%)</span></div>
                        <div style={{ fontSize: '12px', color: 'var(--color-muted)', marginTop: '4px', lineHeight: 1.4 }}>{rank.reason}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h3 style={{ fontSize: '15px', marginBottom: '12px', fontWeight: 600 }}>모집 퍼널</h3>
                <div style={{ padding: '24px 16px', backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-hairline)', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--color-ink)' }}>{MOCK_RECRUITMENT_DASHBOARD.funnel.views}</div>
                    <div style={{ fontSize: '12px', color: 'var(--color-muted)', marginTop: '4px' }}>조회수</div>
                  </div>
                  <div style={{ color: 'var(--color-hairline)' }}>→</div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--color-ink)' }}>{MOCK_RECRUITMENT_DASHBOARD.funnel.applications}</div>
                    <div style={{ fontSize: '12px', color: 'var(--color-muted)', marginTop: '4px' }}>지원</div>
                  </div>
                  <div style={{ color: 'var(--color-hairline)' }}>→</div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--color-ink)' }}>{MOCK_RECRUITMENT_DASHBOARD.funnel.meetings}</div>
                    <div style={{ fontSize: '12px', color: 'var(--color-muted)', marginTop: '4px' }}>미팅</div>
                  </div>
                  <div style={{ color: 'var(--color-hairline)' }}>→</div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--color-primary)' }}>{MOCK_RECRUITMENT_DASHBOARD.funnel.shortlisted}</div>
                    <div style={{ fontSize: '12px', color: 'var(--color-primary)', marginTop: '4px', fontWeight: 500 }}>선정</div>
                  </div>
                </div>
              </div>
            </div>

            <h3 style={{ fontSize: '15px', marginBottom: '12px', fontWeight: 600 }}>개발사 Q&A</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {MOCK_RECRUITMENT_DASHBOARD.qna.map((q, idx) => (
                <div key={idx} style={{ padding: '16px', backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-hairline)', borderRadius: '8px' }}>
                  <div style={{ fontWeight: 600, fontSize: '14px', color: '#b5651d', marginBottom: '8px' }}>Q. {q.question}</div>
                  <div style={{ fontSize: '12px', color: 'var(--color-muted)' }}>{q.partner} · {q.phase}</div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <>
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
          </>
        )}
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
      ) : activeTab === 'recruitment' ? (
        <aside className="preview-panel" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="preview-panel__header">
            <h2 className="preview-panel__heading">
              미팅 상세 및 AI 분석
            </h2>
          </div>
          <div className="preview-panel__content" style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1, overflowY: 'auto', padding: 'var(--space-md)' }}>
            {!meetingDetail ? (
              <div className="empty-tab-view" style={{ border: 'none', margin: 0, padding: 0, background: 'transparent' }}>
                <p style={{ color: 'var(--color-muted)' }}>좌측에서 미팅을 선택해주세요.</p>
              </div>
            ) : (
              <>
                <div className="ai-summary-card" style={{ background: 'var(--color-surface-card)', padding: '16px', borderRadius: '12px', border: '1px solid var(--color-border)' }}>
                  <h3 style={{ fontSize: '14px', marginBottom: '12px', color: 'var(--color-primary)' }}>✨ AI 미팅 분석</h3>
                  {meetingDetail.aiSummary ? (
                    <div>
                      <div style={{ marginBottom: '12px' }}>
                        <strong style={{ fontSize: '13px' }}>🚨 개발사 리스크</strong>
                        <ul style={{ fontSize: '13px', paddingLeft: '20px', margin: '4px 0', lineHeight: 1.5 }}>
                          {meetingDetail.aiSummary.risks.map((r: string, idx: number) => <li key={idx}>{r}</li>)}
                        </ul>
                      </div>
                      <div>
                        <strong style={{ fontSize: '13px' }}>💬 주요 Q&A</strong>
                        {meetingDetail.aiSummary.qna.map((q: any, idx: number) => (
                          <div key={idx} style={{ fontSize: '13px', background: 'var(--color-canvas)', padding: '10px', borderRadius: '6px', marginTop: '6px' }}>
                            <div style={{ marginBottom: '4px', fontWeight: 600 }}>Q. {q.question}</div>
                            <div style={{ color: 'var(--color-muted)' }}>A. {q.answer}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '20px 0' }}>
                      <p style={{ fontSize: '13px', color: 'var(--color-muted)', marginBottom: '12px' }}>아직 분석된 데이터가 없습니다.</p>
                      <button 
                        className="btn btn-primary" 
                        onClick={handleAnalyzeMeeting} 
                        disabled={isAnalyzing}
                        style={{ fontSize: '12px', padding: '8px 16px', borderRadius: 'var(--rounded-md)' }}
                      >
                        {isAnalyzing ? '분석 중...' : 'AI 리스크 추출하기'}
                      </button>
                    </div>
                  )}
                </div>

                <div className="transcript-viewer">
                  <h3 style={{ fontSize: '14px', marginBottom: '8px', color: 'var(--color-ink)' }}>대화 원본 (Transcript)</h3>
                  <pre className="preview-panel__text" style={{ minHeight: '300px', fontSize: '13px', lineHeight: 1.6 }}>
                    {meetingDetail.transcript}
                  </pre>
                </div>
              </>
            )}
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
