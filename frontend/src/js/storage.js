/**
 * storage.js  (Phase 2 — Firebase Firestore)
 * -------------------------------------------
 * This file REPLACES the Phase 1 localStorage version.
 * The PUBLIC API (function names + return shapes) is identical.
 * That means app.js and ui.js required ZERO changes.
 * This is the Repository Pattern in action.
 *
 * Firestore data structure:
 *
 *   users/                          ← collection
 *     {userId}/                     ← document (one per user)
 *       entries/                    ← sub-collection
 *         {entryId}/                ← document (one per entry)
 *           id, date, name, source, amount, type, ts
 *
 * Each user's data is completely isolated.
 * Security Rules ensure users can only access their own sub-collection.
 *
 * Key difference from Phase 1:
 *   Phase 1: synchronous  (localStorage is instant, in-browser)
 *   Phase 2: asynchronous (Firestore is a network call → returns Promises)
 *
 *   All functions now return Promises.
 *   Callers use await or .then() to get the result.
 */

const Storage = (() => {

  /** Currently authenticated user — set by app.js on login */
  let _currentUser = null;

  /**
   * Called by app.js whenever auth state changes.
   * Storage needs the user to know which Firestore path to read/write.
   *
   * @param {Object|null} user  — Firebase User object or null
   */
  function setUser(user) {
    _currentUser = user;
  }

  /**
   * Get the Firestore reference to the current user's entries sub-collection.
   * Throws if no user is set (should never happen if app.js is correct).
   *
   * Path: users/{userId}/entries
   *
   * @returns {firebase.firestore.CollectionReference}
   */
  function _entriesRef() {
    if (!_currentUser) {
      throw new Error('[Storage] No authenticated user. Cannot access Firestore.');
    }
    return FirebaseDB
      .collection('users')
      .doc(_currentUser.uid)
      .collection('entries');
  }

  /**
   * Add a single new entry to Firestore.
   *
   * @param {Object} entry  — { name, source, amount, type }
   * @returns {Promise<{ success: boolean, entry?: Object, error?: string }>}
   */
  async function addEntry(entry) {
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
      date:   Utils.todayString(),
      name:   Utils.sanitise(entry.name),
      source: Utils.sanitise(entry.source || 'Cash'),
      amount: Math.round(Number(entry.amount) * 100) / 100,
      type:   entry.type,
      ts:     Date.now(),
    };

    try {
      // Firestore auto-generates the document ID
      const docRef = await _entriesRef().add(newEntry);
      // Add the Firestore doc ID as the entry's id
      newEntry.id = docRef.id;
      return { success: true, entry: newEntry };
    } catch (err) {
      console.error('[Storage] addEntry failed:', err);
      return { success: false, error: 'Could not save. Check your connection.' };
    }
  }

  /**
   * Delete an entry by its Firestore document ID.
   *
   * @param {string} id  — Firestore document ID
   * @returns {Promise<boolean>}
   */
  async function deleteEntry(id) {
    try {
      await _entriesRef().doc(id).delete();
      return true;
    } catch (err) {
      console.error('[Storage] deleteEntry failed:', err);
      return false;
    }
  }

  /**
   * Get all entries for a specific date.
   *
   * @param {string} dateStr  "YYYY-MM-DD"
   * @returns {Promise<Object[]>}
   */
  async function getEntriesByDate(dateStr) {
    try {
      const snapshot = await _entriesRef()
        .where('date', '==', dateStr)
        .get();

      return snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .sort((a, b) => b.ts - a.ts);
    } catch (err) {
      console.error('[Storage] getEntriesByDate failed:', err);
      return [];
    }
  }

  /**
   * Get all entries within a date range (inclusive).
   *
   * @param {string} from  "YYYY-MM-DD"
   * @param {string} to    "YYYY-MM-DD"
   * @returns {Promise<Object[]>}
   */
  async function getEntriesByRange(from, to) {
    try {
      const snapshot = await _entriesRef()
        .where('date', '>=', from)
        .where('date', '<=', to)
        .get();

      return snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .sort((a, b) => {
          if (a.date !== b.date) return b.date.localeCompare(a.date);
          return b.ts - a.ts;
        });
    } catch (err) {
      console.error('[Storage] getEntriesByRange failed:', err);
      return [];
    }
  }

  /**
   * Calculate income, expense, net totals from an array of entries.
   * Pure function — same as Phase 1, no Firestore call.
   *
   * @param {Object[]} entries
   * @returns {{ income: number, expense: number, net: number, count: number }}
   */
  function calcTotals(entries) {
    const income  = entries
      .filter(e => e.type === 'income')
      .reduce((sum, e) => sum + e.amount, 0);
    const expense = entries
      .filter(e => e.type === 'expense')
      .reduce((sum, e) => sum + e.amount, 0);
    return {
      income:  Math.round(income  * 100) / 100,
      expense: Math.round(expense * 100) / 100,
      net:     Math.round((income - expense) * 100) / 100,
      count:   entries.length,
    };
  }

  /**
   * Group entries by source and sum expenses.
   * Pure function — no Firestore call.
   *
   * @param {Object[]} entries
   * @returns {Array<{ source: string, amount: number }>}
   */
  function groupBySource(entries) {
    const map = {};
    entries
      .filter(e => e.type === 'expense')
      .forEach(e => { map[e.source] = (map[e.source] || 0) + e.amount; });
    return Object.entries(map)
      .map(([source, amount]) => ({ source, amount: Math.round(amount * 100) / 100 }))
      .sort((a, b) => b.amount - a.amount);
  }

  /**
   * Group entries by date and sum expenses.
   * Pure function — no Firestore call.
   *
   * @param {Object[]} entries
   * @returns {Object}  { "YYYY-MM-DD": totalExpense }
   */
  function groupByDate(entries) {
    const map = {};
    entries
      .filter(e => e.type === 'expense')
      .forEach(e => { map[e.date] = (map[e.date] || 0) + e.amount; });
    Object.keys(map).forEach(k => { map[k] = Math.round(map[k] * 100) / 100; });
    return map;
  }

  // Public API — same names as Phase 1
  return {
    setUser,
    addEntry,
    deleteEntry,
    getEntriesByDate,
    getEntriesByRange,
    calcTotals,
    groupBySource,
    groupByDate,
  };
})();
