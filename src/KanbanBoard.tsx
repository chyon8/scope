import React, { useState, useEffect } from 'react'
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
  const [showModal, setShowModal] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newClient, setNewClient] = useState('')
  const [newAssignee, setNewAssignee] = useState<'장수룡' | '이상민' | '김세민' | '미지정'>('미지정')
  
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

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await fetch('http://localhost:3001/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle, client: newClient, assignee: newAssignee })
      })
      const newProj = await res.json()
      setShowModal(false)
      navigate(`/project/${newProj.project_id}`)
    } catch (e) {
      console.error("Failed to create project", e)
    }
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

        <div className="kanban-header__actions">
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>새 프로젝트 등록</button>
        </div>
      </header>
      
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
                    <div className="kanban-card__header">
                      <span className="kanban-card__client">{p.client}</span>
                      {p.status === 'won' && <span className="kanban-card__badge kanban-card__badge--won">계약 완료</span>}
                      {p.status === 'lost' && <span className="kanban-card__badge kanban-card__badge--lost">취소</span>}
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

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>새 프로젝트 등록</h2>
            <form onSubmit={handleCreateProject}>
              <div className="form-group">
                <label>프로젝트명</label>
                <input required value={newTitle} onChange={e => setNewTitle(e.target.value)} />
              </div>
              <div className="form-group">
                <label>고객사</label>
                <input required value={newClient} onChange={e => setNewClient(e.target.value)} />
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
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>취소</button>
                <button type="submit" className="btn btn-primary">생성하기</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
