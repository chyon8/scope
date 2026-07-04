import React from 'react'
import type { ProjectModel, ProjectStatus } from './types'
import './KanbanBoard.css'

interface KanbanBoardProps {
  projects: ProjectModel[]
  onProjectClick: (projectId: string) => void
}

const COLUMNS: { id: ProjectStatus | 'closed', title: string }[] = [
  { id: 'new', title: '신규 문의' },
  { id: 'interviewing', title: '상담 및 정보 수집' },
  { id: 'ready', title: '모집 (공고 완성)' },
  { id: 'closed', title: '계약 / 취소' },
]

function formatDate(iso: string) {
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

export default function KanbanBoard({ projects, onProjectClick }: KanbanBoardProps) {
  return (
    <div className="kanban-board">
      <header className="kanban-header">
        <h1 className="kanban-header__title">CaseLab 파이프라인</h1>
        <div className="kanban-header__actions">
          <button className="btn btn-secondary">담당자 필터</button>
          <button className="btn btn-primary">새 프로젝트 등록</button>
        </div>
      </header>
      
      <div className="kanban-columns">
        {COLUMNS.map(col => {
          const colProjects = projects.filter(p => 
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
                    onClick={() => onProjectClick(p.project_id)}
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
    </div>
  )
}
