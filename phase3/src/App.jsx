import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import AuthScreen      from './components/auth/AuthScreen'
import HomePage        from './components/home/HomePage'
import AddEntryPage    from './components/add/AddEntryPage'
import LibraryPage     from './components/library/LibraryPage'
import MonthDetailPage from './components/library/MonthDetailPage'
import ProfilePage     from './components/profile/ProfilePage'
import InstallPrompt   from './components/shared/InstallPrompt'

export default function App() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-logo">money<span>track</span></div>
        <div className="spinner" />
      </div>
    )
  }

  if (!user) return <AuthScreen />

  return (
    <>
      <Routes>
        <Route path="/"                    element={<HomePage />} />
        <Route path="/home"                element={<Navigate to="/" replace />} />
        <Route path="/add"                 element={<AddEntryPage />} />
        <Route path="/library"             element={<LibraryPage />} />
        <Route path="/library/:yearMonth"  element={<MonthDetailPage />} />
        <Route path="/profile"             element={<ProfilePage />} />
        <Route path="*"                    element={<Navigate to="/" replace />} />
      </Routes>

      {/* Install prompt — shows on Android/iOS when app is not installed */}
      <InstallPrompt />
    </>
  )
}
