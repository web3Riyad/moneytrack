/**
 * BottomNav.jsx
 * -------------
 * Fixed bottom navigation — always visible on every screen.
 * The + button in the center opens the Add Entry screen.
 */

import { useNavigate, useLocation } from 'react-router-dom'
import './BottomNav.css'

const HomeIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8">
    <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
    <polyline points="9,22 9,12 15,12 15,22"/>
  </svg>
)

const LibraryIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8">
    <rect x="3" y="3" width="7" height="7" rx="1"/>
    <rect x="14" y="3" width="7" height="7" rx="1"/>
    <rect x="3" y="14" width="7" height="7" rx="1"/>
    <rect x="14" y="14" width="7" height="7" rx="1"/>
  </svg>
)

const ProfileIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8">
    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
)

export default function BottomNav() {
  const navigate  = useNavigate()
  const location  = useLocation()
  const path      = location.pathname

  const isHome    = path === '/' || path === '/home'
  const isLibrary = path.startsWith('/library')
  const isProfile = path === '/profile'

  return (
    <nav className="bottom-nav" role="navigation" aria-label="Main navigation">
      <button
        className={`nav-item ${isHome ? 'active' : ''}`}
        onClick={() => navigate('/')}
        aria-label="Home"
        aria-current={isHome ? 'page' : undefined}
      >
        <HomeIcon />
        <span className="nav-label">Home</span>
      </button>

      <button
        className={`nav-item ${isLibrary ? 'active' : ''}`}
        onClick={() => navigate('/library')}
        aria-label="Library"
        aria-current={isLibrary ? 'page' : undefined}
      >
        <LibraryIcon />
        <span className="nav-label">Library</span>
      </button>

      {/* Centre add button — always visible */}
      <button
        className="nav-add"
        onClick={() => navigate('/add')}
        aria-label="Add new entry"
      >
        <svg viewBox="0 0 24 24" fill="none" strokeWidth="2.5">
          <line x1="12" y1="5" x2="12" y2="19"/>
          <line x1="5"  y1="12" x2="19" y2="12"/>
        </svg>
      </button>

      <button
        className={`nav-item ${isProfile ? 'active' : ''}`}
        onClick={() => navigate('/profile')}
        aria-label="Profile"
        aria-current={isProfile ? 'page' : undefined}
      >
        <ProfileIcon />
        <span className="nav-label">Profile</span>
      </button>
    </nav>
  )
}
