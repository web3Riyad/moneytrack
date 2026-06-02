import { useState, useEffect } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { setBudget, getBudget, exportToCSV, getEntriesByRange } from '../../lib/api'
import { getInitials, formatCurrency } from '../../lib/utils'
import TopBar from '../layout/TopBar'
import BottomNav from '../layout/BottomNav'
import Toast from '../shared/Toast'
import './ProfilePage.css'

export default function ProfilePage() {
  const { user, displayName, email, signOut, updateProfile } = useAuth()
  const [toast,        setToast]       = useState(null)
  const [currentBudget,setCurrentBudget] = useState(15000)
  const [darkMode,     setDarkMode]    = useState(true)
  const [notifications,setNotifications] = useState(true)

  // Modals
  const [budgetModal,  setBudgetModal]  = useState(false)
  const [budgetVal,    setBudgetVal]    = useState('')
  const [nameModal,    setNameModal]    = useState(false)
  const [newName,      setNewName]      = useState(displayName)
  const [passModal,    setPassModal]    = useState(false)
  const [currentPass,  setCurrentPass]  = useState('')
  const [newPass,      setNewPass]      = useState('')
  const [deleteModal,  setDeleteModal]  = useState(false)
  const [saving,       setSaving]       = useState(false)

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 2400)
  }

  // Load current budget on mount
  useEffect(() => {
    if (!user) return
    getBudget(user.id).then(b => {
      setCurrentBudget(b)
      setBudgetVal(String(b))
    }).catch(() => {})
  }, [user])

  async function handleSignOut() {
    try { await signOut() } catch { showToast('Sign out failed', 'error') }
  }

  async function saveBudget() {
    if (!budgetVal || isNaN(budgetVal) || +budgetVal <= 0) {
      showToast('Enter a valid amount', 'error'); return
    }
    setSaving(true)
    try {
      await setBudget(user.id, parseFloat(budgetVal))
      setCurrentBudget(parseFloat(budgetVal))
      setBudgetModal(false)
      showToast('Budget updated ✓')
    } catch { showToast('Could not save budget', 'error') }
    finally { setSaving(false) }
  }

  async function saveName() {
    if (!newName.trim()) { showToast('Name cannot be empty', 'error'); return }
    setSaving(true)
    try {
      await updateProfile({ full_name: newName.trim() })
      setNameModal(false)
      showToast('Name updated ✓')
    } catch { showToast('Could not update name', 'error') }
    finally { setSaving(false) }
  }

  async function savePassword() {
    if (newPass.length < 6) {
      showToast('Password must be at least 6 characters', 'error'); return
    }
    setSaving(true)
    try {
      await updateProfile({ password: newPass })
      setPassModal(false)
      setNewPass('')
      setCurrentPass('')
      showToast('Password updated ✓')
    } catch { showToast('Could not update password', 'error') }
    finally { setSaving(false) }
  }

  async function handleExport() {
    try {
      const now  = new Date()
      const from = `${now.getFullYear() - 1}-01-01`
      const to   = `${now.getFullYear()}-12-31`
      const data = await getEntriesByRange(user.id, from, to)
      if (!data.length) { showToast('No entries to export', 'error'); return }
      exportToCSV(data, `moneytrack-export-${now.getFullYear()}.csv`)
      showToast('CSV downloaded ✓')
    } catch { showToast('Export failed', 'error') }
  }

  async function handleDeleteAll() {
    // For safety we just sign out — actual delete needs admin privileges
    // In Phase 5 we can add a proper delete account flow
    showToast('Contact support to delete your account', 'error')
    setDeleteModal(false)
  }

  const joinDate = user?.created_at
    ? new Date(user.created_at).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
    : ''

  return (
    <div className="profile-page">
      <TopBar />
      <div className="page-content profile-scroll">

        {/* Profile hero */}
        <div className="profile-hero card">
          <div className="profile-avatar">{getInitials(displayName || email)}</div>
          <div className="profile-info">
            <div className="profile-name">{displayName || 'User'}</div>
            <div className="profile-email">{email}</div>
            {joinDate && <div className="profile-since">Member since {joinDate}</div>}
          </div>
        </div>

        {/* Account */}
        <div className="sec-title">Account</div>

        <SettingRow
          icon="💰" iconClass="g"
          label="Monthly budget"
          right={<span className="setting-value c-green">{formatCurrency(currentBudget)}</span>}
          onClick={() => setBudgetModal(true)}
        />
        <SettingRow
          icon="👤" iconClass="b"
          label="Edit profile"
          onClick={() => { setNewName(displayName); setNameModal(true) }}
        />
        <SettingRow
          icon="🔒" iconClass="b"
          label="Change password"
          onClick={() => setPassModal(true)}
        />

        {/* Preferences */}
        <div className="sec-title" style={{ marginTop: 16 }}>Preferences</div>

        <SettingRow
          icon="🌙" iconClass="b"
          label="Dark mode"
          right={
            <div className={`toggle ${darkMode ? 'on' : ''}`} onClick={e => { e.stopPropagation(); setDarkMode(!darkMode) }}>
              <div className="toggle-dot" />
            </div>
          }
          onClick={() => setDarkMode(!darkMode)}
        />
        <SettingRow
          icon="🔔" iconClass="b"
          label="Notifications"
          right={
            <div className={`toggle ${notifications ? 'on' : ''}`} onClick={e => { e.stopPropagation(); setNotifications(!notifications) }}>
              <div className="toggle-dot" />
            </div>
          }
          onClick={() => setNotifications(!notifications)}
        />

        {/* Data */}
        <div className="sec-title" style={{ marginTop: 16 }}>Data</div>

        <SettingRow
          icon="📊" iconClass="a"
          label="Export to CSV"
          onClick={handleExport}
        />
        <SettingRow
          icon="🗑" iconClass="r"
          label="Delete all data"
          right={<span className="chev" style={{ color: 'var(--red)' }}>›</span>}
          onClick={() => setDeleteModal(true)}
        />

        
        {/* Install App */}
        <div className="sec-title" style={{ marginTop: 16 }}>App</div>
        <SettingRow
          icon="📲" iconClass="g"
          label="Install MoneyTrack"
          right={<span className="install-tag">PWA</span>}
          onClick={() => {
            if (window.__installPrompt) {
              window.__installPrompt.prompt()
            } else {
              alert('To install on iOS: tap Share then Add to Home Screen')
            }
          }}
        />

        <button className="signout-btn" onClick={handleSignOut}>Sign out</button>

      </div>

      {/* Budget modal */}
      {budgetModal && (
        <Modal title="Set monthly budget" onClose={() => setBudgetModal(false)}>
          <p className="modal-hint">Set your spending limit for each month.</p>
          <label className="form-label" htmlFor="budget-input">Amount (৳)</label>
          <input
            id="budget-input" type="number" className="form-input"
            placeholder="e.g. 15000" value={budgetVal}
            onChange={e => setBudgetVal(e.target.value)}
            autoFocus min="1"
          />
          <button className="btn btn-primary btn-full modal-save" onClick={saveBudget} disabled={saving}>
            {saving ? 'Saving...' : 'Save budget'}
          </button>
        </Modal>
      )}

      {/* Name modal */}
      {nameModal && (
        <Modal title="Edit profile" onClose={() => setNameModal(false)}>
          <label className="form-label" htmlFor="name-input">Display name</label>
          <input
            id="name-input" type="text" className="form-input"
            value={newName} onChange={e => setNewName(e.target.value)}
            autoFocus maxLength={40}
          />
          <button className="btn btn-primary btn-full modal-save" onClick={saveName} disabled={saving}>
            {saving ? 'Saving...' : 'Save name'}
          </button>
        </Modal>
      )}

      {/* Password modal */}
      {passModal && (
        <Modal title="Change password" onClose={() => { setPassModal(false); setNewPass('') }}>
          <p className="modal-hint">Enter a new password (min. 6 characters).</p>
          <label className="form-label" htmlFor="pass-input">New password</label>
          <input
            id="pass-input" type="password" className="form-input"
            placeholder="New password" value={newPass}
            onChange={e => setNewPass(e.target.value)}
            autoFocus
          />
          <button className="btn btn-primary btn-full modal-save" onClick={savePassword} disabled={saving}>
            {saving ? 'Saving...' : 'Update password'}
          </button>
        </Modal>
      )}

      {/* Delete confirmation modal */}
      {deleteModal && (
        <Modal title="Delete all data" onClose={() => setDeleteModal(false)}>
          <p className="modal-hint modal-danger">
            This will permanently delete all your entries and budget settings. This cannot be undone.
          </p>
          <button className="btn btn-danger btn-full modal-save" onClick={handleDeleteAll}>
            Yes, delete everything
          </button>
        </Modal>
      )}

      <BottomNav />
      {toast && <Toast message={toast.msg} type={toast.type} />}
    </div>
  )
}

function SettingRow({ icon, iconClass, label, right, onClick }) {
  return (
    <button className="setting-row" onClick={onClick}>
      <div className="setting-left">
        <div className={`setting-icon ${iconClass}`}>{icon}</div>
        <span className="setting-label-text">{label}</span>
      </div>
      <div className="setting-right">
        {right || <span className="chev">›</span>}
      </div>
    </button>
  )
}

function Modal({ title, onClose, children }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">{title}</span>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        {children}
      </div>
    </div>
  )
}
