import { useState } from 'react'
import Workspace from './Workspace'
import KanbanBoard from './KanbanBoard'
import { mockProjects } from './mock-data'
import type { ProjectModel } from './types'
import './App.css'

type Page = 'kanban' | 'workspace' | 'landing'

function App() {
  const [page, setPage] = useState<Page>('kanban')
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null)

  const activeProject = activeProjectId 
    ? mockProjects.find(p => p.project_id === activeProjectId) 
    : undefined

  return (
    <div className="app">
      {/* ── Top Navigation ── */}
      <nav className="top-nav">
        <div className="top-nav__inner">
          <a
            href="/"
            className="top-nav__brand"
            onClick={e => { e.preventDefault(); setPage('workspace') }}
          >
            <svg className="top-nav__logo" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 2v20M2 12h20" />
            </svg>
            <span className="top-nav__name">Project Detective</span>
          </a>
          <div className="top-nav__actions">
            <button className="btn btn-primary" type="button">
              새 프로젝트
            </button>
          </div>
        </div>
      </nav>

      {/* ── Page Content ── */}
      {page === 'kanban' ? (
        <KanbanBoard 
          projects={mockProjects} 
          onProjectClick={(id) => {
            setActiveProjectId(id)
            setPage('workspace')
          }} 
        />
      ) : page === 'workspace' ? (
        <Workspace 
          project={activeProject || mockProjects[0]} 
          onBack={() => setPage('kanban')} 
        />
      ) : (
        <main className="main-content">
          {/* Landing page content preserved but not default */}
          <section className="hero-band">
            <div className="container">
              <div className="hero-band__inner">
                <div className="hero-band__content">
                  <h1 className="hero-band__headline">
                    프로젝트를 이해하는
                    <br />
                    가장 빠른 방법
                  </h1>
                  <p className="hero-band__subtitle">
                    문서를 업로드하면 AI가 구조화된 Project Model로 변환하고,
                    부족한 정보만 골라 질문합니다. 당신은 검토와 승인만 하세요.
                  </p>
                  <div className="hero-band__cta-row">
                    <button
                      className="btn btn-primary"
                      type="button"
                      onClick={() => setPage('workspace')}
                    >
                      시작하기
                    </button>
                    <button className="btn btn-secondary" type="button">
                      더 알아보기
                    </button>
                  </div>
                </div>

                <div className="hero-band__visual">
                  <div className="hero-illustration-card">
                    <div className="hero-illustration-card__header">
                      <span className="hero-illustration-card__dot hero-illustration-card__dot--red" />
                      <span className="hero-illustration-card__dot hero-illustration-card__dot--amber" />
                      <span className="hero-illustration-card__dot hero-illustration-card__dot--green" />
                    </div>
                    <code className="hero-illustration-card__code">
{`{
  `}<span className="keyword">"status"</span>{`: `}<span className="string">"interviewing"</span>{`,
  `}<span className="keyword">"overall_confidence"</span>{`: `}<span className="coral">72</span>{`,
  `}<span className="keyword">"sections"</span>{`: {
    `}<span className="keyword">"purpose"</span>{`:     { `}<span className="keyword">"confidence"</span>{`: `}<span className="coral">95</span>{` },
    `}<span className="keyword">"features"</span>{`:    { `}<span className="keyword">"confidence"</span>{`: `}<span className="coral">68</span>{` },
    `}<span className="keyword">"budget"</span>{`:      { `}<span className="keyword">"confidence"</span>{`: `}<span className="coral">40</span>{` },
    `}<span className="keyword">"timeline"</span>{`:    { `}<span className="keyword">"confidence"</span>{`: `}<span className="coral">55</span>{` }
  },
  `}<span className="comment">// AI가 부족한 정보를 찾아냅니다</span>{`
}`}
                    </code>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="features-section">
            <div className="container">
              <header className="features-section__header">
                <h2 className="features-section__title">
                  어떻게 작동하나요?
                </h2>
                <p className="features-section__subtitle">
                  세 단계로 프로젝트의 전체 그림을 완성합니다
                </p>
              </header>

              <div className="features-grid">
                <article className="feature-card">
                  <div className="feature-card__icon">📄</div>
                  <h3 className="feature-card__title">문서 업로드</h3>
                  <p className="feature-card__description">
                    PDF, DOCX, PPTX, 이미지 등 프로젝트 관련 자료를 업로드하면
                    AI가 자동으로 분석하여 구조화된 모델로 변환합니다.
                  </p>
                </article>

                <article className="feature-card">
                  <div className="feature-card__icon">🔍</div>
                  <h3 className="feature-card__title">스마트 인터뷰</h3>
                  <p className="feature-card__description">
                    AI가 부족한 정보를 자동으로 파악하고,
                    우선순위에 따라 정확한 질문을 생성합니다.
                    답변할수록 이해도가 올라갑니다.
                  </p>
                </article>

                <article className="feature-card">
                  <div className="feature-card__icon">📊</div>
                  <h3 className="feature-card__title">산출물 생성</h3>
                  <p className="feature-card__description">
                    충분한 이해도에 도달하면 견적서, 공고문,
                    리스크 보고서 등의 산출물을 자동으로 생성합니다.
                  </p>
                </article>
              </div>
            </div>
          </section>

          <footer className="footer">
            <div className="container">
              <div className="footer__inner">
                <span className="footer__brand">Project Detective</span>
                <span className="footer__copyright">
                  © 2026 Project Detective. All rights reserved.
                </span>
              </div>
            </div>
          </footer>
        </main>
      )}
    </div>
  )
}

export default App
