/**
 * storage.js
 * ----------
 * Handles ALL data persistence for Phase 1.
 * Wraps localStorage so the rest of the app never touches it directly.
 *
 * Why this matters:
 *   In Phase 2 we swap this file for a Firebase version.
 *   The rest of the app (app.js, ui.js) stays unchanged.
 *   This pattern is called the "Repository Pattern".
 *
 * Data model (one entry object):
 * {
 *   id:     number,   — unique identifier
 *   date:   string,   — "YYYY-MM-DD" (local date)
 *   name:   string,   — user-supplied label  e.g. "Lunch"
 *   source: string,   — payment source       e.g. "bKash"
 *   amount: number,   — positive number      e.g. 150
 *   type:   string,   — "expense" | "income"
 *   ts:     number,   — unix timestamp ms (for sorting)
 * }
 */

const Storage = (() => {
  /** Key used in localStorage */
  const STORAGE_KEY = 'moneytrack_entries_v1';

  /**
   * Load all entries from localStorage.
   * Returns an empty array if nothing is saved or data is corrupt.
   *
   * @returns {Object[]}
   */
  function loadAll() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      // Basic validation: must be an array
      return Array.isArray(parsed) ? parsed : [];
    } catch (err) {
      console.error('[Storage] Failed to load entries:', err);
      return [];
    }
  }

  /**
   * Persist the full entries array to localStorage.
   *
   * @param {Object[]} entries
   * @returns {boolean} true on success
   */
  function saveAll(entries) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
      return true;
    } catch (err) {
      // Can fail if storage is full (QuotaExceededError)
      console.error('[Storage] Failed to save entries:', err);
      return false;
    }
  }

  /**
   * Add a single new entry.
   * Validates required fields before saving.
   *
   * @param {Object} entry  — must have: name, source, amount, type
   * @returns {{ success: boolean, entry?: Object, error?: string }}
   */
  function addEntry(entry) {
    // Validate
    if (!entry.name || String(entry.name).trim() === '') {
      return { success: false, error: 'Name is required.' };
    }
    if (!entry.amount || isNaN(entry.amount) || Number(entry.amount) <= 0) {
      return { success: false, error: 'Amount must be a positive number.' };
    }
    if (!['expense', 'income'].includes(entry.type)) {
      return { success: false, error: 'Type must be expense or income.' };
    }

    const newEntry = {
      id:     Utils.generateId(),
      date:   Utils.todayString(),
      name:   Utils.sanitise(entry.name),
      source: Utils.sanitise(entry.source || 'Cash'),
      amount: Math.round(Number(entry.amount) * 100) / 100, // 2 decimal places
      type:   entry.type,
      ts:     Date.now(),
    };

    const entries = loadAll();
    entries.push(newEntry);

    const saved = saveAll(entries);
    if (!saved) {
      return { success: false, error: 'Could not save. Storage may be full.' };
    }

    return { success: true, entry: newEntry };
  }

  /**
   * Delete an entry by ID.
   *
   * @param {number} id
   * @returns {boolean} true if an entry was removed
   */
  function deleteEntry(id) {
    const entries = loadAll();
    const filtered = entries.filter((e) => e.id !== id);

    if (filtered.length === entries.length) {
      console.warn('[Storage] deleteEntry: id not found:', id);
      return false;
    }

    saveAll(filtered);
    return true;
  }

  /**
   * Get all entries for a specific date.
   *
   * @param {string} dateStr  "YYYY-MM-DD"
   * @returns {Object[]}
   */
  function getEntriesByDate(dateStr) {
    return loadAll().filter((e) => e.date === dateStr);
  }

  /**
   * Get all entries within a date range (inclusive).
   *
   * @param {string} from  "YYYY-MM-DD"
   * @param {string} to    "YYYY-MM-DD"
   * @returns {Object[]}
   */
  function getEntriesByRange(from, to) {
    return loadAll().filter((e) => e.date >= from && e.date <= to);
  }

  /**
   * Calculate totals from an array of entries.
   *
   * @param {Object[]} entries
   * @returns {{ income: number, expense: number, net: number, count: number }}
   */
  function calcTotals(entries) {
    const income  = entries
      .filter((e) => e.type === 'income')
      .reduce((sum, e) => sum + e.amount, 0);

    const expense = entries
      .filter((e) => e.type === 'expense')
      .reduce((sum, e) => sum + e.amount, 0);

    return {
      income:  Math.round(income  * 100) / 100,
      expense: Math.round(expense * 100) / 100,
      net:     Math.round((income - expense) * 100) / 100,
      count:   entries.length,
    };
  }

  /**
   * Group entries by source and sum expense amounts.
   * Returns sorted array: highest first.
   *
   * @param {Object[]} entries
   * @returns {Array<{ source: string, amount: number }>}
   */
  function groupBySource(entries) {
    const map = {};
    entries
      .filter((e) => e.type === 'expense')
      .forEach((e) => {
        map[e.source] = (map[e.source] || 0) + e.amount;
      });

    return Object.entries(map)
      .map(([source, amount]) => ({ source, amount: Math.round(amount * 100) / 100 }))
      .sort((a, b) => b.amount - a.amount);
  }

  /**
   * Group entries by date and sum expense amounts.
   * Returns an object: { "YYYY-MM-DD": totalExpense }
   *
   * @param {Object[]} entries
   * @returns {Object}
   */
  function groupByDate(entries) {
    const map = {};
    entries
      .filter((e) => e.type === 'expense')
      .forEach((e) => {
        map[e.date] = (map[e.date] || 0) + e.amount;
      });

    // Round values
    Object.keys(map).forEach((k) => {
      map[k] = Math.round(map[k] * 100) / 100;
    });

    return map;
  }

  /**
   * Clear ALL stored data.
   * Used in development / testing only.
   */
  function clearAll() {
    localStorage.removeItem(STORAGE_KEY);
  }

  // Public API
  return {
    addEntry,
    deleteEntry,
    loadAll,
    getEntriesByDate,
    getEntriesByRange,
    calcTotals,
    groupBySource,
    groupByDate,
    clearAll,
  };
})();
