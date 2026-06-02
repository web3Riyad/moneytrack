import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import {
  getEntryMonths, getEntriesByRange,
  calcTotals, getBudget, deleteEntry,
  groupBySource, groupByCategory, groupByDate
} from '../../lib/api'
import {
  monthRange, formatCurrency, formatMonthLabel,
  budgetColor, formatDateLabel, CATEGORY_ICONS
} from '../../lib/utils'
import TopBar from '../layout/TopBar'
import BottomNav from '../layout/BottomNav'
import './LibraryPage.css'

/* ══════════════════════════════════════════════════════
   LIBRARY PAGE — list of all months
══════════════════════════════════════════════════════ */
export default function LibraryPage() {
  const { user }   = useAuth()
  const navigate   = useNavigate()
  const [months,   setMonths]  = useState([])
  const [budgets,  setBudgets] = useState({})
  const [totals,   setTotals]  = useState({})
  const [loading,  setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    async function load() {
      try {
        const [monthList, bgt] = await Promise.all([
          getEntryMonths(user.id),
          getBudget(user.id),
        ])
        setMonths(monthList)

        // Load totals for each month
        const monthTotals = {}
        await Promise.all(monthList.map(async ym => {
          const { from, to } = monthRange(ym)
          const entries = await getEntriesByRange(user.id, from, to)
          monthTotals[ym] = calcTotals(entries)
        }))
        setTotals(monthTotals)
        // Same budget for all months for now
        const bgtMap = {}
        monthList.forEach(ym => { bgtMap[ym] = bgt })
        setBudgets(bgtMap)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [user])

  // Current month
  const now = new Date()
  const currentYM = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`

  return (
    <div className="lib-page">
      <TopBar />
      <div className="page-content lib-scroll">
        {loading ? (
          <>
            <div className="skeleton" style={{ height: 110, marginBottom: 10, borderRadius: 14 }} />
            <div className="skeleton" style={{ height: 110, marginBottom: 10, borderRadius: 14 }} />
            <div className="skeleton" style={{ height: 110, borderRadius: 14 }} />
          </>
        ) : months.length === 0 ? (
          <div className="empty-state">
            <div className="icon">📅</div>
            <p>No data yet — start adding entries!</p>
          </div>
        ) : (
          months.map(ym => {
            const t    = totals[ym] || { income: 0, expense: 0, net: 0 }
            const bgt  = budgets[ym] || 15000
            const pct  = bgt > 0 ? Math.round((t.expense / bgt) * 100) : 0
            const col  = budgetColor(pct)
            const isCurrent = ym === currentYM
            return (
              <div
                key={ym}
                className="month-card card"
                onClick={() => navigate(`/library/${ym}`)}
                role="button"
                tabIndex={0}
                onKeyDown={e => e.key === 'Enter' && navigate(`/library/${ym}`)}
              >
                <div className="mc-header">
                  <div className="mc-name">{formatMonthLabel(ym + '-01')}</div>
                  <div className="mc-right">
                    {isCurrent && <span className="mc-badge">Current</span>}
                    <span className="mc-arrow">›</span>
                  </div>
                </div>
                <div className="mc-stats">
                  <div className="mc-stat">
                    <div className="mc-stat-label">Spent</div>
                    <div className="mc-stat-val c-red">{formatCurrency(t.expense)}</div>
                  </div>
                  <div className="mc-stat">
                    <div className="mc-stat-label">Income</div>
                    <div className="mc-stat-val c-green">{formatCurrency(t.income)}</div>
                  </div>
                  <div className="mc-stat">
                    <div className="mc-stat-label">Saved</div>
                    <div className="mc-stat-val c-white">{formatCurrency(t.net)}</div>
                  </div>
                </div>
                <div className="mc-prog-row">
                  <span className="mc-prog-label">Budget used</span>
                  <span className="mc-prog-pct" style={{ color: col }}>{pct}%</span>
                </div>
                <div className="prog-track">
                  <div className="prog-fill" style={{ width: `${Math.min(pct, 100)}%`, background: col }} />
                </div>
              </div>
            )
          })
        )}
      </div>
      <BottomNav />
    </div>
  )
}
