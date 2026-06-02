import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../../hooks/useAuth'
import {
  getEntriesByDate, getEntriesByRange,
  calcTotals, groupBySource, groupByDate,
  deleteEntry, getBudget
} from '../../lib/api'
import {
  today, toDateStr, getCurrentWeekDays,
  formatCurrency, formatDateLabel, budgetColor, CATEGORY_ICONS
} from '../../lib/utils'
import TopBar from '../layout/TopBar'
import BottomNav from '../layout/BottomNav'
import Toast from '../shared/Toast'
import { BarChart, Bar, XAxis, ResponsiveContainer, Tooltip } from 'recharts'
import './HomePage.css'

const TABS = ['Today', 'Week', 'Month']

export default function HomePage() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('Today')
  const [entries,   setEntries]   = useState([])
  const [budget,    setBudget]    = useState(15000)
  const [loading,   setLoading]   = useState(true)
  const [toast,     setToast]     = useState(null)

  // Current month "YYYY-MM"
  const now       = new Date()
  const yearMonth = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 2400)
  }

  const loadData = useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
      const [bgt, data] = await Promise.all([
        getBudget(user.id),
        (async () => {
          if (activeTab === 'Today') {
            return getEntriesByDate(user.id, today())
          } else if (activeTab === 'Week') {
            const days = getCurrentWeekDays()
            return getEntriesByRange(user.id, toDateStr(days[0]), toDateStr(days[6]))
          } else {
            const from = `${yearMonth}-01`
            const last = new Date(now.getFullYear(), now.getMonth()+1, 0)
            return getEntriesByRange(user.id, from, toDateStr(last))
          }
        })()
      ])
      setBudget(bgt)
      setEntries(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [user, activeTab])

  useEffect(() => { loadData() }, [loadData])

  async function handleDelete(id) {
    try {
      await deleteEntry(id)
      setEntries(prev => prev.filter(e => e.id !== id))
      showToast('Entry deleted', 'error')
    } catch {
      showToast('Could not delete', 'error')
    }
  }

  const totals     = calcTotals(entries)
  const bySource   = groupBySource(entries)
  const byDate     = groupByDate(entries)
  const monthPct   = budget > 0 ? Math.round((totals.expense / budget) * 100) : 0
  const bColor     = budgetColor(monthPct)

  // Week chart data
  const weekDays   = getCurrentWeekDays()
  const todayStr   = today()
  const chartData  = weekDays.map((d, i) => ({
    day:     ['M','T','W','T','F','S','S'][i],
    amount:  byDate[toDateStr(d)] || 0,
    isToday: toDateStr(d) === todayStr,
  }))

  return (
    <div className="home-page">
      <TopBar showDate />

      {/* Tab bar */}
      <div className="home-tabs">
        {TABS.map(t => (
          <button
            key={t}
            className={`home-tab ${activeTab === t ? 'on' : ''}`}
            onClick={() => setActiveTab(t)}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="page-content scroll-area">
        {loading ? <LoadingSkeleton /> : (
          <>
            {activeTab === 'Today' && (
              <TodayView
                entries={entries}
                totals={totals}
                budget={budget}
                monthPct={monthPct}
                bColor={bColor}
                bySource={bySource}
                onDelete={handleDelete}
              />
            )}
            {activeTab === 'Week' && (
              <WeekView
                entries={entries}
                totals={totals}
                chartData={chartData}
                onDelete={handleDelete}
              />
            )}
            {activeTab === 'Month' && (
              <MonthView
                entries={entries}
                totals={totals}
                budget={budget}
                monthPct={monthPct}
                bColor={bColor}
                bySource={bySource}
                byDate={byDate}
                onDelete={handleDelete}
              />
            )}
          </>
        )}
      </div>

      <BottomNav />
      {toast && <Toast message={toast.msg} type={toast.type} />}
    </div>
  )
}

/* ── TODAY VIEW ─────────────────────────────────────────── */
function TodayView({ entries, totals, budget, monthPct, bColor, bySource, onDelete }) {
  return (
    <>
      <HeroCard totals={totals} label="Total spent today" />
      <BudgetBar monthPct={monthPct} budget={budget} expense={totals.expense} bColor={bColor} />
      <div className="sec-title">Today's entries</div>
      <EntryList entries={entries} onDelete={onDelete} />
      {bySource.length > 0 && (
        <>
          <div className="sec-title" style={{ marginTop: 16 }}>Spending by source</div>
          <SourceBars sources={bySource} />
        </>
      )}
    </>
  )
}

/* ── WEEK VIEW ──────────────────────────────────────────── */
function WeekView({ entries, totals, chartData, onDelete }) {
  return (
    <>
      <BalRow totals={totals} />
      <div className="chart-card card">
        <div className="sec-title">This week</div>
        <ResponsiveContainer width="100%" height={80}>
          <BarChart data={chartData} barSize={22} margin={{ top: 16, bottom: 0, left: 0, right: 0 }}>
            <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#5a6070', fontSize: 10, fontWeight: 600 }} />
            <Tooltip
              cursor={{ fill: 'rgba(255,255,255,0.03)' }}
              contentStyle={{ background: '#1a1f2e', border: '1px solid #252d3d', borderRadius: 8, fontSize: 12 }}
              formatter={v => ['৳' + v.toLocaleString(), 'Expense']}
            />
            <Bar
              dataKey="amount"
              radius={[4,4,0,0]}
              fill="#2a3545"
              label={false}
              // Custom cell coloring for today
              shape={(props) => {
                const isToday = chartData[props.index]?.isToday
                return <rect {...props} fill={isToday ? '#1a3a26' : '#2a3545'} stroke={isToday ? '#4ade80' : 'none'} strokeWidth={isToday ? 1.5 : 0} rx={4} ry={4} />
              }}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="sec-title">All entries this week</div>
      <EntryList entries={entries} showDate onDelete={onDelete} />
    </>
  )
}

/* ── MONTH VIEW ─────────────────────────────────────────── */
function MonthView({ entries, totals, budget, monthPct, bColor, bySource, byDate, onDelete }) {
  const days = Object.entries(byDate).sort((a, b) => b[0] < a[0] ? -1 : 1)
  return (
    <>
      <BalRow totals={totals} />
      <BudgetBar monthPct={monthPct} budget={budget} expense={totals.expense} bColor={bColor} />
      {bySource.length > 0 && (
        <>
          <div className="sec-title">Spending by source</div>
          <SourceBars sources={bySource} />
        </>
      )}
      {days.length > 0 && (
        <>
          <div className="sec-title" style={{ marginTop: 16 }}>Daily breakdown</div>
          {days.map(([date, amount]) => (
            <div className="day-row card" key={date}>
              <span className="day-row-date">{formatDateLabel(date)}</span>
              <span className="day-row-amt c-red">{formatCurrency(amount)}</span>
            </div>
          ))}
        </>
      )}
    </>
  )
}

/* ── SHARED COMPONENTS ──────────────────────────────────── */

function HeroCard({ totals, label }) {
  return (
    <div className="hero-card card">
      <div className="hero-label">{label}</div>
      <div className="hero-amount">
        <span className="hero-cur">৳</span>
        {totals.expense.toLocaleString()}
      </div>
      <div className="hero-stats">
        <div className="hstat">
          <div className="hstat-label">Income</div>
          <div className="hstat-val c-green">{formatCurrency(totals.income)}</div>
        </div>
        <div className="hstat">
          <div className="hstat-label">Expense</div>
          <div className="hstat-val c-red">{formatCurrency(totals.expense)}</div>
        </div>
        <div className="hstat">
          <div className="hstat-label">Net</div>
          <div className={`hstat-val ${totals.net >= 0 ? 'c-green' : 'c-red'}`}>
            {totals.net >= 0 ? '+' : ''}{formatCurrency(totals.net)}
          </div>
        </div>
      </div>
    </div>
  )
}

function BudgetBar({ monthPct, budget, expense, bColor }) {
  return (
    <div className="budget-bar" style={{ borderColor: bColor }}>
      <div>
        <div className="label" style={{ color: bColor }}>Monthly budget</div>
        <div className="value">{formatCurrency(expense)} of {formatCurrency(budget)} used</div>
      </div>
      <div className="budget-pct" style={{ color: bColor }}>{monthPct}%</div>
    </div>
  )
}

function BalRow({ totals }) {
  return (
    <div className="bal-row">
      <div className="bal-card">
        <div className="bal-label">Income</div>
        <div className="bal-value c-green">{formatCurrency(totals.income)}</div>
      </div>
      <div className="bal-card">
        <div className="bal-label">Expense</div>
        <div className="bal-value c-red">{formatCurrency(totals.expense)}</div>
      </div>
      <div className="bal-card">
        <div className="bal-label">Net</div>
        <div className={`bal-value ${totals.net >= 0 ? 'c-green' : 'c-red'}`}>
          {totals.net >= 0 ? '+' : ''}{formatCurrency(totals.net)}
        </div>
      </div>
    </div>
  )
}

function EntryList({ entries, showDate = false, onDelete }) {
  if (!entries.length) {
    return (
      <div className="empty-state">
        <div className="icon">💸</div>
        <p>No entries yet — tap + to add one</p>
      </div>
    )
  }
  return (
    <>
      {entries.map(e => (
        <EntryRow key={e.id} entry={e} showDate={showDate} onDelete={onDelete} />
      ))}
    </>
  )
}

function EntryRow({ entry, showDate, onDelete }) {
  const isExp = entry.type === 'expense'
  const icon  = CATEGORY_ICONS[entry.category] || (isExp ? '💸' : '💰')
  return (
    <div className="entry-row">
      <div className={`entry-icon ${isExp ? 'exp' : 'inc'}`}>{icon}</div>
      <div className="entry-info">
        <div className="entry-name">{entry.name}</div>
        <div className="entry-meta">
          {showDate && <span>{formatDateLabel(entry.date)} · </span>}
          {entry.source}
          <span className="entry-tag">{entry.category}</span>
        </div>
      </div>
      <div className={`entry-amount ${isExp ? 'exp' : 'inc'}`}>
        {isExp ? '−' : '+'}{formatCurrency(entry.amount)}
      </div>
      <button className="delete-btn" onClick={() => onDelete(entry.id)} aria-label={`Delete ${entry.name}`}>✕</button>
    </div>
  )
}

function SourceBars({ sources }) {
  const max = sources[0]?.amount || 1
  return (
    <>
      {sources.map(({ source, amount }) => (
        <div className="src-bar" key={source}>
          <div className="src-head">
            <span className="src-name">{source}</span>
            <span className="src-val">{formatCurrency(amount)}</span>
          </div>
          <div className="prog-track">
            <div className="prog-fill" style={{ width: `${Math.round((amount/max)*100)}%` }} />
          </div>
        </div>
      ))}
    </>
  )
}

function LoadingSkeleton() {
  return (
    <>
      <div className="skeleton" style={{ height: 120, marginBottom: 10 }} />
      <div className="skeleton" style={{ height: 48,  marginBottom: 10 }} />
      <div className="skeleton" style={{ height: 56,  marginBottom: 6  }} />
      <div className="skeleton" style={{ height: 56,  marginBottom: 6  }} />
      <div className="skeleton" style={{ height: 56                     }} />
    </>
  )
}
