/**
 * api.js
 * ------
 * All database operations — Repository Pattern.
 * Components never call supabase directly — they call these functions.
 * Makes testing and future backend swaps easy.
 */

import { supabase } from './supabase'

/* ── ENTRIES ──────────────────────────────────────────────── */

/** Add a new entry for the current user */
export async function addEntry(userId, entry) {
  const { data, error } = await supabase
    .from('entries')
    .insert({
      user_id:  userId,
      date:     entry.date,
      name:     entry.name.trim(),
      amount:   Number(entry.amount),
      type:     entry.type,
      source:   entry.source,
      category: entry.category,
      notes:    entry.notes || '',
    })
    .select()
    .single()

  if (error) throw error
  return data
}

/** Delete an entry by ID */
export async function deleteEntry(id) {
  const { error } = await supabase
    .from('entries')
    .delete()
    .eq('id', id)
  if (error) throw error
}

/** Update an existing entry */
export async function updateEntry(id, updates) {
  const { data, error } = await supabase
    .from('entries')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

/** Get entries for a specific date */
export async function getEntriesByDate(userId, dateStr) {
  const { data, error } = await supabase
    .from('entries')
    .select('*')
    .eq('user_id', userId)
    .eq('date', dateStr)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

/** Get entries in a date range */
export async function getEntriesByRange(userId, from, to) {
  const { data, error } = await supabase
    .from('entries')
    .select('*')
    .eq('user_id', userId)
    .gte('date', from)
    .lte('date', to)
    .order('date', { ascending: false })
    .order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

/** Get distinct months that have entries (for Library) */
export async function getEntryMonths(userId) {
  const { data, error } = await supabase
    .from('entries')
    .select('date')
    .eq('user_id', userId)
    .order('date', { ascending: false })
  if (error) throw error

  // Extract unique "YYYY-MM" strings
  const months = [...new Set((data || []).map(e => e.date.slice(0, 7)))]
  return months
}

/* ── CALCULATIONS (pure, no DB calls) ────────────────────── */

export function calcTotals(entries) {
  const income  = entries.filter(e => e.type === 'income').reduce((s, e) => s + Number(e.amount), 0)
  const expense = entries.filter(e => e.type === 'expense').reduce((s, e) => s + Number(e.amount), 0)
  return {
    income:  Math.round(income  * 100) / 100,
    expense: Math.round(expense * 100) / 100,
    net:     Math.round((income - expense) * 100) / 100,
    count:   entries.length,
  }
}

export function groupBySource(entries) {
  const map = {}
  entries.filter(e => e.type === 'expense').forEach(e => {
    map[e.source] = (map[e.source] || 0) + Number(e.amount)
  })
  return Object.entries(map)
    .map(([source, amount]) => ({ source, amount: Math.round(amount * 100) / 100 }))
    .sort((a, b) => b.amount - a.amount)
}

export function groupByCategory(entries) {
  const map = {}
  entries.filter(e => e.type === 'expense').forEach(e => {
    map[e.category] = (map[e.category] || 0) + Number(e.amount)
  })
  return Object.entries(map)
    .map(([category, amount]) => ({ category, amount: Math.round(amount * 100) / 100 }))
    .sort((a, b) => b.amount - a.amount)
}

export function groupByDate(entries) {
  const map = {}
  entries.filter(e => e.type === 'expense').forEach(e => {
    map[e.date] = (map[e.date] || 0) + Number(e.amount)
  })
  return map
}

/* ── BUDGET ───────────────────────────────────────────────── */

export async function getBudget(userId) {
  const { data, error } = await supabase
    .from('budgets')
    .select('amount')
    .eq('user_id', userId)
    .maybeSingle()
  if (error) throw error
  return data?.amount || 15000
}

export async function setBudget(userId, amount) {
  const { error } = await supabase
    .from('budgets')
    .upsert({ user_id: userId, amount, updated_at: new Date().toISOString() })
  if (error) throw error
}

/* ── CSV EXPORT ───────────────────────────────────────────── */

export function exportToCSV(entries, filename = 'moneytrack-export.csv') {
  const header = 'Date,Name,Type,Category,Source,Amount,Notes'
  const rows = entries.map(e =>
    `${e.date},"${e.name}",${e.type},${e.category},${e.source},${e.amount},"${e.notes || ''}"`
  )
  const csv = [header, ...rows].join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
