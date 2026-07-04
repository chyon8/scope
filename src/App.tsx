import { Routes, Route, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import Workspace from './Workspace'
import KanbanBoard from './KanbanBoard'
import './App.css'

function App() {
  const navigate = useNavigate()
  const [isDarkMode, setIsDarkMode] = useState(false)

  useEffect(() => {
    if (isDarkMode) {
      document.body.classList.add('dark-theme')
    } else {
      document.body.classList.remove('dark-theme')
    }
  }, [isDarkMode])

  return (
    <div className="app">
      {/* ── Top Navigation ── */}
      <nav className="top-nav">
        <div className="top-nav__inner" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <a
            href="/"
            className="top-nav__brand"
            onClick={e => { e.preventDefault(); navigate('/') }}
          >
            <svg className="top-nav__logo" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 2v20M2 12h20" />
            </svg>
            <span className="top-nav__name">CaseLab</span>
          </a>

          <button 
            onClick={() => setIsDarkMode(!isDarkMode)}
            style={{ 
              background: 'var(--color-surface)', 
              border: '1px solid var(--color-border)', 
              borderRadius: '20px', 
              padding: '6px 12px', 
              cursor: 'pointer',
              color: 'var(--color-ink)',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontWeight: 500
            }}
          >
            {isDarkMode ? '☀️ 라이트 모드' : '🌙 다크 모드'}
          </button>
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
