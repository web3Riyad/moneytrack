import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import {
  getEntriesByRange, calcTotals, getBudget,
  deleteEntry, groupBySource, groupByCategory, groupByDate
} from '../../lib/api'
import {
  monthRange, formatCurrency, formatMonthLabel,
  budgetColor, formatDateLabel, CATEGORY_ICONS
} from '../../lib/utils'
import BottomNav from '../layout/BottomNav'
import Toast from '../shared/Toast'
import './LibraryPage.css'

const DETAIL_TABS = ['Overview', 'Entries', 'Categories']

export default function MonthDetailPage() {
  const { yearMonth } = useParams()  // e.g. "2026-06"
  const { user }      = useAuth()
  const navigate      = useNavigate()

  const [activeTab, setActiveTab] = useState('Overview')
  const [entries,   setEntries]   = useState([])
  const [budget,    setBudget]    = useState(15000)
  const [loading,   setLoading]   = useState(true)
  const [toast,     setToast]     = useState(null)

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 2400)
  }

  useEffect(() => {
    if (!user || !yearMonth) return
    async function load() {
      const { from, to } = monthRange(yearMonth)
      const [data, bgt]  = await Promise.all([
        getEntriesByRange(user.id, from, to),
        getBudget(user.id),
      ])
      setEntries(data)
      setBudget(bgt)
      setLoading(false)
    }
    load()
  }, [user, yearMonth])

  async function handleDelete(id) {
    try {
      await deleteEntry(id)
      setEntries(prev => prev.filter(e => e.id !== id))
      showToast('Entry deleted', 'error')
    } catch {
      showToast('Could not delete', 'error')
    }
  }

  const totals   = calcTotals(entries)
  const bySource = groupBySource(entries)
  const byCat    = groupByCategory(entries)
  const byDate   = groupByDate(entries)
  const pct      = budget > 0 ? Math.round((totals.expense / budget) * 100) : 0
  const bColor   = budgetColor(pct)

  return (
    <div className="detail-page">
      {/* Header with back button */}
      <div className="detail-header">
        <button className="back-btn" onClick={() => navigate('/library')} aria-label="Back to Library">
          <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" style={{width:16,height:16,stroke:'var(--text-primary)'}}>
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
        </button>
        <h1 className="detail-title">{yearMonth ? formatMonthLabel(yearMonth + '-01') : ''}</h1>
      </div>

      {/* Detail tabs */}
      <div className="detail-tabs">
        {DETAIL_TABS.map(t => (
          <button
            key={t}
            className={`detail-tab ${activeTab === t ? 'on' : ''}`}
            onClick={() => setActiveTab(t)}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="page-content detail-scroll">
        {loading ? (
          <>
            <div className="skeleton" style={{ height: 80,  marginBottom: 10, borderRadius: 12 }} />
            <div className="skeleton" style={{ height: 48,  marginBottom: 10, borderRadius: 12 }} />
            <div className="skeleton" style={{ height: 56,  marginBottom: 6,  borderRadius: 12 }} />
            <div className="skeleton" style={{ height: 56,  borderRadius: 12 }} />
          </>
        ) : (
          <>
            {activeTab === 'Overview' && (
              <OverviewTab
                totals={totals}
                budget={budget}
                pct={pct}
                bColor={bColor}
                bySource={bySource}
                byDate={byDate}
              />
            )}
            {activeTab === 'Entries' && (
              <EntriesTab entries={entries} onDelete={handleDelete} />
            )}
            {activeTab === 'Categories' && (
              <CategoriesTab byCat={byCat} />
            )}
          </>
        )}
      </div>

      <BottomNav />
      {toast && <Toast message={toast.msg} type={toast.type} />}
    </div>
  )
}

function OverviewTab({ totals, budget, pct, bColor, bySource, byDate }) {
  const days = Object.entries(byDate).sort((a, b) => b[0] > a[0] ? 1 : -1)
  return (
    <>
      <div className="bal-row">
        <div className="bal-card"><div className="bal-label">Income</div><div className="bal-value c-green">{formatCurrency(totals.income)}</div></div>
        <div className="bal-card"><div className="bal-label">Expense</div><div className="bal-value c-red">{formatCurrency(totals.expense)}</div></div>
        <div className="bal-card"><div className="bal-label">Net</div><div className={`bal-value ${totals.net >= 0 ? 'c-green' : 'c-red'}`}>{totals.net >= 0 ? '+' : ''}{formatCurrency(totals.net)}</div></div>
      </div>
      <div className="budget-bar" style={{ borderColor: bColor }}>
        <div><div className="label" style={{ color: bColor }}>Budget limit</div><div className="value">{formatCurrency(totals.expense)} / {formatCurrency(budget)}</div></div>
        <div className="budget-pct" style={{ color: bColor }}>{pct}%</div>
      </div>
      {bySource.length > 0 && (
        <>
          <div className="sec-title">By source</div>
          {bySource.map(({ source, amount }) => (
            <div className="src-bar" key={source}>
              <div className="src-head"><span className="src-name">{source}</span><span className="src-val">{formatCurrency(amount)}</span></div>
              <div className="prog-track"><div className="prog-fill" style={{ width: `${Math.round((amount / bySource[0].amount) * 100)}%` }} /></div>
            </div>
          ))}
        </>
      )}
      {days.length > 0 && (
        <>
          <div className="sec-title" style={{ marginTop: 16 }}>Day by day</div>
          {days.map(([date, amount]) => (
            <div className="day-row-simple card" key={date}>
              <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{formatDateLabel(date)}</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 14, fontWeight: 600, color: 'var(--red)' }}>{formatCurrency(amount)}</span>
            </div>
          ))}
        </>
      )}
    </>
  )
}

function EntriesTab({ entries, onDelete }) {
  if (!entries.length) return <div className="empty-state"><div className="icon">💸</div><p>No entries this month.</p></div>
  return (
    <>
      <div className="sec-title">{entries.length} entries</div>
      {entries.map(e => {
        const isExp = e.type === 'expense'
        const icon  = CATEGORY_ICONS[e.category] || (isExp ? '💸' : '💰')
        return (
          <div className="entry-row" key={e.id}>
            <div className={`entry-icon ${isExp ? 'exp' : 'inc'}`}>{icon}</div>
            <div className="entry-info">
              <div className="entry-name">{e.name}</div>
              <div className="entry-meta">{formatDateLabel(e.date)} · {e.source} <span className="entry-tag">{e.category}</span></div>
            </div>
            <div className={`entry-amount ${isExp ? 'exp' : 'inc'}`}>{isExp ? '−' : '+'}{formatCurrency(e.amount)}</div>
            <button className="delete-btn" onClick={() => onDelete(e.id)}>✕</button>
          </div>
        )
      })}
    </>
  )
}

function CategoriesTab({ byCat }) {
  if (!byCat.length) return <div className="empty-state"><div className="icon">📊</div><p>No expense data this month.</p></div>
  const max = byCat[0].amount
  return (
    <>
      <div className="sec-title">Spending by category</div>
      {byCat.map(({ category, amount }) => (
        <div className="src-bar" key={category}>
          <div className="src-head">
            <span className="src-name">{CATEGORY_ICONS[category]} {category}</span>
            <span className="src-val">{formatCurrency(amount)}</span>
          </div>
          <div className="prog-track">
            <div className="prog-fill" style={{ width: `${Math.round((amount / max) * 100)}%` }} />
          </div>
        </div>
      ))}
    </>
  )
}
