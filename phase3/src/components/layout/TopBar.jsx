import { useAuth } from '../../hooks/useAuth'
import { getInitials } from '../../lib/utils'
import { useNavigate } from 'react-router-dom'
import './TopBar.css'

export default function TopBar({ title, showDate = false, backTo = null }) {
  const { displayName } = useAuth()
  const navigate = useNavigate()

  const now = new Date()
  const dateStr = now.toLocaleDateString('en-GB', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric'
  })

  return (
    <header className="topbar">
      <div className="topbar-left">
        {backTo ? (
          <button className="back-btn" onClick={() => navigate(backTo)} aria-label="Go back">
            <svg viewBox="0 0 24 24" fill="none" strokeWidth="2">
              <path d="M19 12H5M12 5l-7 7 7 7"/>
            </svg>
          </button>
        ) : null}
        <div className="topbar-logo">
          {title || <><span className="logo-base">money</span><span className="logo-accent">track</span></>}
        </div>
      </div>
      <div className="topbar-right">
        {showDate && <time className="topbar-date">{dateStr}</time>}
        <button
          className="topbar-avatar"
          onClick={() => navigate('/profile')}
          aria-label="Go to profile"
        >
          {getInitials(displayName)}
        </button>
      </div>
    </header>
  )
}
