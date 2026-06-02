import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { addEntry } from '../../lib/api'
import { today, CATEGORIES, SOURCES, CATEGORY_ICONS } from '../../lib/utils'
import BottomNav from '../layout/BottomNav'
import './AddEntryPage.css'

export default function AddEntryPage() {
  const { user }  = useAuth()
  const navigate  = useNavigate()

  const [type,     setType]     = useState('expense')
  const [amount,   setAmount]   = useState('')
  const [name,     setName]     = useState('')
  const [source,   setSource]   = useState('Cash')
  const [date,     setDate]     = useState(today())
  const [category, setCategory] = useState('Food')
  const [notes,    setNotes]    = useState('')
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)

  async function handleSave() {
    setError('')
    if (!name.trim())                         { setError('Please enter a name.'); return }
    if (!amount || isNaN(amount) || +amount <= 0) { setError('Please enter a valid amount.'); return }

    setLoading(true)
    try {
      await addEntry(user.id, {
        date,
        name:     name.trim(),
        amount:   parseFloat(amount),
        type,
        source,
        category: type === 'income' ? 'Income' : category,
        notes,
      })
      navigate('/')
    } catch (err) {
      setError('Could not save. Please try again.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="add-page">
      {/* Header — no back button, nav bar handles navigation */}
      <div className="add-header">
        <span className="add-title">New entry</span>
        <button className="cancel-btn" onClick={() => navigate(-1)}>Cancel</button>
      </div>

      <div className="add-scroll">
        {/* Expense / Income toggle */}
        <div className="type-row">
          <button
            className={`type-btn ${type === 'expense' ? 'exp-on' : ''}`}
            onClick={() => { setType('expense'); setCategory('Food') }}
          >
            <div className="type-arrow">↑</div>
            <div className="type-name">Expense</div>
            <div className="type-sub">Money going out</div>
          </button>
          <button
            className={`type-btn ${type === 'income' ? 'inc-on' : ''}`}
            onClick={() => { setType('income'); setCategory('Income') }}
          >
            <div className="type-arrow">↓</div>
            <div className="type-name">Income</div>
            <div className="type-sub">Money coming in</div>
          </button>
        </div>

        {/* Amount display */}
        <div className="amount-box" style={{ borderColor: type === 'expense' ? 'var(--red)' : 'var(--green)' }}>
          <div className="amount-hint">Enter amount</div>
          <div className="amount-display">
            <span className="amount-cur">৳</span>
            <input
              className="amount-input"
              type="number"
              inputMode="decimal"
              placeholder="0.00"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              min="0.01"
              step="0.01"
              autoFocus
            />
          </div>
        </div>

        {/* Name */}
        <div className="add-field">
          <label className="form-label" htmlFor="entry-name">Entry name</label>
          <input
            id="entry-name"
            type="text"
            className="form-input"
            placeholder="e.g. Lunch, Rent, Salary..."
            value={name}
            onChange={e => setName(e.target.value)}
            maxLength={60}
          />
        </div>

        {/* Source + Date row */}
        <div className="add-grid">
          <div className="add-field">
            <label className="form-label" htmlFor="entry-source">Source</label>
            <select
              id="entry-source"
              className="form-input form-select"
              value={source}
              onChange={e => setSource(e.target.value)}
            >
              {SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="add-field">
            <label className="form-label" htmlFor="entry-date">Date</label>
            <input
              id="entry-date"
              type="date"
              className="form-input"
              value={date}
              onChange={e => setDate(e.target.value)}
            />
          </div>
        </div>

        {/* Category pills — only for expense */}
        {type === 'expense' && (
          <div className="add-field">
            <div className="form-label">
              Category <span className="form-label-hint">— tap to pick</span>
            </div>
            <div className="cat-pills">
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  className={`cat-pill ${category === cat ? 'on' : ''}`}
                  onClick={() => setCategory(cat)}
                  type="button"
                >
                  {CATEGORY_ICONS[cat]} {cat}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Notes */}
        <div className="add-field">
          <label className="form-label" htmlFor="entry-notes">
            Note <span className="form-label-hint">— optional</span>
          </label>
          <textarea
            id="entry-notes"
            className="form-input notes-input"
            placeholder="Add a short note..."
            value={notes}
            onChange={e => setNotes(e.target.value)}
            rows={2}
          />
        </div>

        {error && <p className="form-error" role="alert">{error}</p>}

        <button
          className="btn btn-primary btn-full save-btn"
          onClick={handleSave}
          disabled={loading}
        >
          {loading ? 'Saving...' : '✓ Save Entry'}
        </button>
      </div>

      {/* Bottom nav — always visible as requested */}
      <BottomNav />
    </div>
  )
}
