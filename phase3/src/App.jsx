import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import AuthScreen      from './components/auth/AuthScreen'
import HomePage        from './components/home/HomePage'
import AddEntryPage    from './components/add/AddEntryPage'
import LibraryPage     from './components/library/LibraryPage'
import MonthDetailPage from './components/library/MonthDetailPage'
import ProfilePage     from './components/profile/ProfilePage'

export default function App() {
  const { user, loading } = useAuth()

  // Show spinner while Firebase checks session
  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-logo">money<span>track</span></div>
        <div className="spinner" />
      </div>
    )
  }

  // Not logged in — show auth screen
  if (!user) return <AuthScreen />

  // Logged in — show app with routes
  return (
    <Routes>
      <Route path="/"                    element={<HomePage />} />
      <Route path="/home"                element={<Navigate to="/" replace />} />
      <Route path="/add"                 element={<AddEntryPage />} />
      <Route path="/library"             element={<LibraryPage />} />
      <Route path="/library/:yearMonth"  element={<MonthDetailPage />} />
      <Route path="/profile"             element={<ProfilePage />} />
      <Route path="*"                    element={<Navigate to="/" replace />} />
    </Routes>
  )
}
