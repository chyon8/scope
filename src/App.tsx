import { Routes, Route, useNavigate } from 'react-router-dom'
import Workspace from './Workspace'
import KanbanBoard from './KanbanBoard'
import './App.css'

function App() {
  const navigate = useNavigate()

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
      <Routes>
        <Route path="/" element={<KanbanBoard />} />
        <Route path="/project/:id" element={<Workspace />} />
      </Routes>
    </div>
  )
}

export default App
