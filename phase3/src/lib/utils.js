/**
 * utils.js
 * --------
 * Pure helper functions — no side effects, no imports.
 */

/** Format a Date to "YYYY-MM-DD" local string */
export function toDateStr(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/** Today as "YYYY-MM-DD" */
export function today() {
  return toDateStr(new Date())
}

/** Format number as ৳ currency */
export function formatCurrency(amount, decimals = false) {
  return '৳' + Number(amount).toLocaleString('en-BD', {
    minimumFractionDigits: decimals ? 2 : 0,
    maximumFractionDigits: decimals ? 2 : 0,
  })
}

/** "YYYY-MM-DD" → "Mon, 2 Jun" */
export function formatDateLabel(dateStr) {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-GB', {
    weekday: 'short', day: 'numeric', month: 'short',
  })
}

/** "YYYY-MM-DD" → "June 2026" */
export function formatMonthLabel(dateStr) {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-GB', {
    month: 'long', year: 'numeric',
  })
}

/** Get Mon–Sun Date[] for current ISO week */
export function getCurrentWeekDays() {
  const now = new Date()
  const dow = now.getDay()
  const monday = new Date(now)
  monday.setDate(now.getDate() - ((dow + 6) % 7))
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return d
  })
}

/** First and last day of a month: "YYYY-MM" → { from, to } */
export function monthRange(yearMonth) {
  const [y, m] = yearMonth.split('-').map(Number)
  const from = `${yearMonth}-01`
  const last = new Date(y, m, 0).getDate()
  const to   = `${yearMonth}-${String(last).padStart(2, '0')}`
  return { from, to }
}

/** Get initials from name or email */
export function getInitials(nameOrEmail) {
  if (!nameOrEmail) return '?'
  const parts = nameOrEmail.trim().split(/\s+/)
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return nameOrEmail[0].toUpperCase()
}

/** Escape HTML to prevent XSS */
export function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

/** Category emoji map */
export const CATEGORY_ICONS = {
  Food:        '🍔',
  Transport:   '🚌',
  Bills:       '🏠',
  Shopping:    '🛍',
  Health:      '❤️',
  Fun:         '🎮',
  Education:   '📚',
  Income:      '💰',
  Other:       '➕',
}

export const CATEGORIES = Object.keys(CATEGORY_ICONS).filter(c => c !== 'Income')

export const SOURCES = ['Cash', 'bKash', 'Nagad', 'Bank', 'Card', 'Other']

/** Budget warning color based on percentage */
export function budgetColor(pct) {
  if (pct >= 90) return '#ef4444'
  if (pct >= 75) return '#f59e0b'
  return '#4ade80'
}
