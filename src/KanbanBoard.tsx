import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import type { ProjectModel, ProjectStatus } from './types'
import './KanbanBoard.css'

const COLUMNS: { id: ProjectStatus | 'closed', title: string }[] = [
  { id: 'new', title: '신규 문의' },
  { id: 'interviewing', title: '상담 및 정보 수집' },
  { id: 'ready', title: '모집 (공고 완성)' },
  { id: 'closed', title: '계약 / 취소' },
]

function formatDate(iso: string) {
  if (!iso) return ''
  const d = new Date(iso)
  return `${d.getMonth() + 1}/${d.getDate()}`
}

function getAssigneeColor(assignee: string) {
  switch (assignee) {
    case '장수룡': return 'var(--color-primary)'
    case '이상민': return '#4a90e2'
    case '김세민': return '#50c878'
    default: return 'var(--color-muted)'
  }
}

export default function KanbanBoard() {
  const [projects, setProjects] = useState<ProjectModel[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('list')
  const [showModal, setShowModal] = useState(false)
  const [modalStep, setModalStep] = useState<1 | 2>(1)
  const [newProjectId, setNewProjectId] = useState('')
  const [newTitle, setNewTitle] = useState('')
  const [newAssignee, setNewAssignee] = useState<'장수룡' | '이상민' | '김세민' | '미지정'>('미지정')
  const [initialText, setInitialText] = useState('')
  const [initialFiles, setInitialFiles] = useState<File[]>([])
  const [isCreating, setIsCreating] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const navigate = useNavigate()

  const fetchProjects = async () => {
    try {
      const res = await fetch('http://localhost:3001/api/projects')
      const data = await res.json()
      setProjects(data)
    } catch (e) {
      console.error("Failed to fetch projects", e)
    }
  }

  useEffect(() => {
    fetchProjects()
  }, [])

  const openModal = () => {
    setShowModal(true)
    setModalStep(1)
    setNewProjectId('')
    setNewTitle('')
    setNewAssignee('미지정')
    setInitialText('')
    setInitialFiles([])
  }

  const closeModal = () => {
    setShowModal(false)
    setModalStep(1)
  }

  const handleStep1Next = (e: React.FormEvent) => {
    e.preventDefault()
    setModalStep(2)
  }

  const handleCreateProject = async () => {
    if (!initialText.trim()) return
    setIsCreating(true)

    try {
      // 1. Create the project
      const createRes = await fetch('http://localhost:3001/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project_id: newProjectId, title: newTitle, assignee: newAssignee })
      })
      const newProj = await createRes.json()
      
      if (newProj.error) {
        alert(newProj.error)
        setIsCreating(false)
        return
      }

      // 2. Send initial requirements text (+ files) to upload endpoint
      const formData = new FormData()
      formData.append('text', initialText)
      initialFiles.forEach(f => formData.append('file', f))

      await fetch(`http://localhost:3001/api/projects/${newProj.project_id}/upload`, {
        method: 'POST',
        body: formData
      })

      closeModal()
      navigate(`/project/${newProj.project_id}`)
    } catch (e) {
      console.error("Failed to create project", e)
    } finally {
      setIsCreating(false)
    }
  }

  const handleDeleteProject = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation() // Prevent navigating to workspace
    if (!confirm('정말 이 프로젝트를 삭제하시겠습니까?')) return
    
    try {
      await fetch(`http://localhost:3001/api/projects/${id}`, { method: 'DELETE' })
      setProjects(prev => prev.filter(p => p.project_id !== id))
    } catch (e) {
      console.error("Failed to delete project", e)
    }
  }

  const handleFileAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files) {
      setInitialFiles(prev => [...prev, ...Array.from(files)])
    }
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const removeFile = (index: number) => {
    setInitialFiles(prev => prev.filter((_, i) => i !== index))
  }

  const filteredProjects = projects.filter(p => 
    p.title?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.client?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="kanban-board">
      <header className="kanban-header">
        <h1 className="kanban-header__title">CaseLab 파이프라인</h1>
        
        <div className="kanban-header__search">
          <input 
            type="text" 
            placeholder="프로젝트명 또는 고객사 검색..." 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="kanban-search-input"
          />
        </div>

        <div className="kanban-header__actions" style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div style={{ display: 'flex', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '6px', overflow: 'hidden' }}>
            <button 
              style={{ padding: '6px 12px', fontSize: '13px', background: viewMode === 'kanban' ? 'var(--color-primary)' : 'transparent', color: viewMode === 'kanban' ? 'white' : 'var(--color-ink)', border: 'none', cursor: 'pointer' }}
              onClick={() => setViewMode('kanban')}
            >
              🗂️ 칸반
            </button>
            <button 
              style={{ padding: '6px 12px', fontSize: '13px', background: viewMode === 'list' ? 'var(--color-primary)' : 'transparent', color: viewMode === 'list' ? 'white' : 'var(--color-ink)', border: 'none', cursor: 'pointer' }}
              onClick={() => setViewMode('list')}
            >
              📋 리스트
            </button>
          </div>
          <button className="btn btn-primary" onClick={openModal}>새 프로젝트 등록</button>
        </div>
      </header>
      
      {viewMode === 'kanban' ? (
        <div className="kanban-columns">
          {COLUMNS.map(col => {
            const colProjects = filteredProjects.filter(p => 
              col.id === 'closed' ? (p.status === 'won' || p.status === 'lost') : p.status === col.id
            )
            
            return (
              <div key={col.id} className="kanban-column">
                <div className="kanban-column__header">
                  <h2 className="kanban-column__title">{col.title}</h2>
                  <span className="kanban-column__count">{colProjects.length}</span>
                </div>
                
                <div className="kanban-column__list">
                  {colProjects.map(p => (
                    <div 
                      key={p.project_id} 
                      className="kanban-card"
                      onClick={() => navigate(`/project/${p.project_id}`)}
                    >
                      <div className="kanban-card__header" style={{ position: 'relative' }}>
                        <span className="kanban-card__client">{p.client}</span>
                        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                          {p.status === 'won' && <span className="kanban-card__badge kanban-card__badge--won">계약 완료</span>}
                          {p.status === 'lost' && <span className="kanban-card__badge kanban-card__badge--lost">취소</span>}
                          <button 
                            className="kanban-card__delete" 
                            onClick={(e) => handleDeleteProject(e, p.project_id)}
                            title="삭제"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                      <h3 className="kanban-card__title">{p.title}</h3>
                      <div className="kanban-card__footer">
                        <span 
                          className="kanban-card__assignee"
                          style={{ backgroundColor: getAssigneeColor(p.assignee) }}
                        >
                          {p.assignee}
                        </span>
                        <span className="kanban-card__date">{formatDate(p.updatedAt)} 업데이트</span>
                      </div>
                    </div>
                  ))}
                  {colProjects.length === 0 && (
                    <div className="kanban-column__empty">프로젝트가 없습니다.</div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="list-view-container" style={{ padding: '0 24px', flex: 1, overflowY: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: 'var(--color-surface)', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <thead style={{ backgroundColor: 'var(--color-canvas)', borderBottom: '1px solid var(--color-border)' }}>
              <tr>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', color: 'var(--color-muted)', fontWeight: 600 }}>프로젝트명</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', color: 'var(--color-muted)', fontWeight: 600 }}>고객사</th>
                <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '13px', color: 'var(--color-muted)', fontWeight: 600 }}>상태</th>
                <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '13px', color: 'var(--color-muted)', fontWeight: 600 }}>담당자</th>
                <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '13px', color: 'var(--color-muted)', fontWeight: 600 }}>업데이트</th>
              </tr>
            </thead>
            <tbody>
              {filteredProjects.map(p => {
                const statusInfo = COLUMNS.find(c => c.id === p.status) || COLUMNS.find(c => c.id === 'closed')
                return (
                  <tr 
                    key={p.project_id} 
                    style={{ borderBottom: '1px solid var(--color-hairline)', cursor: 'pointer', transition: 'background-color 0.2s' }}
                    onClick={() => navigate(`/project/${p.project_id}`)}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-canvas)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <td style={{ padding: '16px', fontSize: '14px', fontWeight: 600, color: 'var(--color-ink)' }}>{p.title}</td>
                    <td style={{ padding: '16px', fontSize: '13px', color: 'var(--color-body)' }}>{p.client}</td>
                    <td style={{ padding: '16px', textAlign: 'center' }}>
                      <span style={{ 
                        display: 'inline-block',
                        padding: '4px 8px', 
                        borderRadius: '4px', 
                        fontSize: '12px', 
                        fontWeight: 600,
                        backgroundColor: p.status === 'won' ? 'rgba(80, 200, 120, 0.1)' : p.status === 'lost' ? 'rgba(231, 76, 60, 0.1)' : 'var(--color-canvas)',
                        color: p.status === 'won' ? '#2e8b57' : p.status === 'lost' ? '#c0392b' : 'var(--color-ink)'
                      }}>
                        {p.status === 'won' ? '계약 완료' : p.status === 'lost' ? '취소' : statusInfo?.title}
                      </span>
                    </td>
                    <td style={{ padding: '16px', textAlign: 'center' }}>
                      <span style={{ 
                        display: 'inline-block',
                        padding: '4px 8px', 
                        borderRadius: '4px', 
                        fontSize: '12px',
                        color: 'white',
                        backgroundColor: getAssigneeColor(p.assignee) 
                      }}>
                        {p.assignee}
                      </span>
                    </td>
                    <td style={{ padding: '16px', textAlign: 'center', fontSize: '13px', color: 'var(--color-muted)' }}>
                      {formatDate(p.updatedAt)}
                    </td>
                  </tr>
                )
              })}
              {filteredProjects.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ padding: '32px', textAlign: 'center', color: 'var(--color-muted)' }}>프로젝트가 없습니다.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content modal-content--wide" onClick={e => e.stopPropagation()}>
            
            {/* Step indicator */}
            <div className="modal-steps">
              <div className={`modal-step ${modalStep >= 1 ? 'modal-step--active' : ''}`}>
                <span className="modal-step__number">1</span>
                <span className="modal-step__label">기본 정보</span>
              </div>
              <div className="modal-step__line" />
              <div className={`modal-step ${modalStep >= 2 ? 'modal-step--active' : ''}`}>
                <span className="modal-step__number">2</span>
                <span className="modal-step__label">초기 요구사항</span>
              </div>
            </div>

            {modalStep === 1 ? (
              <form onSubmit={handleStep1Next}>
                <h2>새 프로젝트 등록</h2>
                <div className="form-group">
                  <label>프로젝트 아이디 (6자리 숫자)</label>
                  <input 
                    required 
                    type="text"
                    pattern="[0-9]{6}"
                    title="6자리 숫자를 입력하세요"
                    value={newProjectId} 
                    onChange={e => setNewProjectId(e.target.value)} 
                    placeholder="예: 156594"
                  />
                </div>
                <div className="form-group">
                  <label>프로젝트명</label>
                  <input 
                    required 
                    value={newTitle} 
                    onChange={e => setNewTitle(e.target.value)} 
                    placeholder="예: TM CRM 앱 신규 구축"
                  />
                </div>
                <div className="form-group">
                  <label>담당자</label>
                  <select value={newAssignee} onChange={e => setNewAssignee(e.target.value as any)}>
                    <option value="미지정">미지정</option>
                    <option value="장수룡">장수룡</option>
                    <option value="이상민">이상민</option>
                    <option value="김세민">김세민</option>
                  </select>
                </div>
                <div className="modal-actions">
                  <button type="button" className="btn btn-secondary" onClick={closeModal}>취소</button>
                  <button type="submit" className="btn btn-primary">다음 →</button>
                </div>
              </form>
            ) : (
              <div>
                <h2>초기 요구사항 입력</h2>
                <p className="modal-desc">고객이 보낸 카톡, 이메일, 통화 메모 등 러프한 내용을 그대로 붙여넣으세요.<br/>AI가 분석하여 즉시 대시보드를 채워드립니다.</p>
                
                <div className="form-group">
                  <label>요구사항 텍스트 <span className="form-required">*필수</span></label>
                  <textarea
                    className="modal-textarea"
                    value={initialText}
                    onChange={e => setInitialText(e.target.value)}
                    placeholder={"예시:\n고객사: ○○기업\n모바일 앱으로 CRM 만들고 싶은데 직원 250명 쓸 수 있어야 하고,\n인터넷 전화 기능이랑 통화 녹음 기능 필요합니다.\n관리자 페이지도 있어야 하고요..."}
                    rows={8}
                  />
                </div>

                <div className="form-group">
                  <label>파일 첨부 <span className="form-optional">(선택)</span></label>
                  <div 
                    className="modal-file-area"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <input 
                      type="file" 
                      ref={fileInputRef}
                      style={{ display: 'none' }}
                      onChange={handleFileAdd}
                      multiple
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.mp3,.wav,.m4a,.jpg,.png"
                    />
                    <span className="modal-file-area__icon">📎</span>
                    <span className="modal-file-area__text">클릭하여 파일 추가 (PDF, Word, Excel, PPT, 녹취 등)</span>
                  </div>
                  {initialFiles.length > 0 && (
                    <div className="modal-file-list">
                      {initialFiles.map((f, i) => (
                        <div key={i} className="modal-file-item">
                          <span className="modal-file-item__name">{f.name}</span>
                          <button 
                            type="button" 
                            className="modal-file-item__remove" 
                            onClick={() => removeFile(i)}
                          >×</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="modal-actions">
                  <button type="button" className="btn btn-secondary" onClick={() => setModalStep(1)}>← 이전</button>
                  <button 
                    type="button" 
                    className="btn btn-primary" 
                    onClick={handleCreateProject}
                    disabled={!initialText.trim() || isCreating}
                  >
                    {isCreating ? (
                      <>
                        <span className="spinner" /> AI가 분석 중입니다...
                      </>
                    ) : '프로젝트 시작하기'}
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}
    </div>
  )
}
