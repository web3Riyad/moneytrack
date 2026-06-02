import { useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import './AuthScreen.css'

export default function AuthScreen() {
  const { signInWithEmail, signUpWithEmail } = useAuth()
  const [tab,      setTab]      = useState('login')   // 'login' | 'register'
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')

  // Login fields
  const [loginEmail, setLoginEmail]       = useState('')
  const [loginPass,  setLoginPass]        = useState('')

  // Register fields
  const [regName,  setRegName]   = useState('')
  const [regEmail, setRegEmail]  = useState('')
  const [regPass,  setRegPass]   = useState('')

  function friendlyError(code) {
    const map = {
      'invalid_credentials':          'Incorrect email or password.',
      'user_already_exists':          'An account with this email already exists.',
      'weak_password':                'Password must be at least 6 characters.',
      'invalid_email':                'Please enter a valid email address.',
      'email_not_confirmed':          'Please verify your email before signing in.',
      'too_many_requests':            'Too many attempts. Please wait a moment.',
      'network_failure':              'Network error. Check your connection.',
      'User already registered':      'This email is already registered. Please sign in.',
    }
    for (const [key, msg] of Object.entries(map)) {
      if (code?.includes(key)) return msg
    }
    return code || 'Something went wrong. Please try again.'
  }

  async function handleLogin(e) {
    e?.preventDefault()
    setError('')
    if (!loginEmail.trim()) { setError('Please enter your email.'); return }
    if (!loginPass)          { setError('Please enter your password.'); return }
    setLoading(true)
    try {
      await signInWithEmail(loginEmail.trim(), loginPass)
    } catch (err) {
      setError(friendlyError(err.message))
      setLoading(false)
    }
  }

  async function handleRegister(e) {
    e?.preventDefault()
    setError('')
    if (!regName.trim())        { setError('Please enter your name.'); return }
    if (!regEmail.trim())       { setError('Please enter your email.'); return }
    if (regPass.length < 6)     { setError('Password must be at least 6 characters.'); return }
    setLoading(true)
    try {
      await signUpWithEmail(regEmail.trim(), regPass, regName.trim())
    } catch (err) {
      setError(friendlyError(err.message))
      setLoading(false)
    }
  }

  function switchTab(t) {
    setTab(t)
    setError('')
  }

  return (
    <div className="auth-screen">
      <div className="auth-card">
        <div className="auth-logo">money<span>track</span></div>
        <p className="auth-tagline">Track every taka. Know your money.</p>

        <div className="auth-tabs">
          <button className={`auth-tab ${tab === 'login' ? 'on' : ''}`} onClick={() => switchTab('login')}>Sign in</button>
          <button className={`auth-tab ${tab === 'register' ? 'on' : ''}`} onClick={() => switchTab('register')}>Create account</button>
        </div>

        {tab === 'login' ? (
          <form onSubmit={handleLogin}>
            <div className="auth-field">
              <label className="form-label" htmlFor="login-email">Email</label>
              <input
                id="login-email"
                type="email"
                className="form-input"
                placeholder="you@example.com"
                value={loginEmail}
                onChange={e => setLoginEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </div>
            <div className="auth-field">
              <label className="form-label" htmlFor="login-pass">Password</label>
              <input
                id="login-pass"
                type="password"
                className="form-input"
                placeholder="••••••••"
                value={loginPass}
                onChange={e => setLoginPass(e.target.value)}
                autoComplete="current-password"
                required
              />
            </div>
            {error && <p className="form-error" role="alert">{error}</p>}
            <button
              type="submit"
              className="btn btn-primary btn-full auth-submit"
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegister}>
            <div className="auth-field">
              <label className="form-label" htmlFor="reg-name">Full name</label>
              <input
                id="reg-name"
                type="text"
                className="form-input"
                placeholder="Your name"
                value={regName}
                onChange={e => setRegName(e.target.value)}
                autoComplete="name"
                required
              />
            </div>
            <div className="auth-field">
              <label className="form-label" htmlFor="reg-email">Email</label>
              <input
                id="reg-email"
                type="email"
                className="form-input"
                placeholder="you@example.com"
                value={regEmail}
                onChange={e => setRegEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </div>
            <div className="auth-field">
              <label className="form-label" htmlFor="reg-pass">Password</label>
              <input
                id="reg-pass"
                type="password"
                className="form-input"
                placeholder="Min. 6 characters"
                value={regPass}
                onChange={e => setRegPass(e.target.value)}
                autoComplete="new-password"
                required
              />
            </div>
            {error && <p className="form-error" role="alert">{error}</p>}
            <button
              type="submit"
              className="btn btn-primary btn-full auth-submit"
              disabled={loading}
            >
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
