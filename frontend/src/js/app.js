/**
 * app.js
 * ------
 * Main application controller.
 * - Boots the app on DOMContentLoaded
 * - Wires up all event listeners
 * - Coordinates between Storage (data) and UI (rendering)
 * - Contains NO rendering logic and NO storage logic
 *
 * Think of this as the "director": it tells Storage and UI what to do,
 * but doesn't do the work itself.
 */

(function () {
  'use strict';

  /* ── State ────────────────────────────────────────────────
     Keep mutable app state in one place.
     In Phase 3 this becomes a React state or a Redux store.
  ──────────────────────────────────────────────────────── */
  const state = {
    activeTab:   'today',   // 'today' | 'week' | 'month'
    entryType:   'expense', // 'expense' | 'income'
  };


  /* ── Boot ─────────────────────────────────────────────── */

  /**
   * Entry point — called once the DOM is ready.
   */
  function init() {
    UI.renderHeaderDate();
    renderActiveTab();
    bindEvents();
  }


  /* ── Event binding ────────────────────────────────────── */

  function bindEvents() {
    // Tab navigation — delegate from the tab-bar
    document.querySelector('.tab-bar')
      .addEventListener('click', onTabClick);

    // Type toggle buttons (Expense / Income)
    document.querySelector('.type-toggle')
      .addEventListener('click', onTypeToggle);

    // Add Entry button
    document.getElementById('addEntryBtn')
      .addEventListener('click', onAddEntry);

    // Allow pressing Enter in any form field to submit
    document.getElementById('entryName')
      .addEventListener('keydown', onFormKeydown);
    document.getElementById('entryAmount')
      .addEventListener('keydown', onFormKeydown);

    // Delete entries — event delegation on the whole document
    // (entries are dynamically rendered so we can't bind directly)
    document.addEventListener('click', onDeleteClick);
  }


  /* ── Tab handling ─────────────────────────────────────── */

  /**
   * Handle click on a tab button.
   *
   * @param {MouseEvent} e
   */
  function onTabClick(e) {
    const btn = e.target.closest('[data-tab]');
    if (!btn) return;

    const tab = btn.dataset.tab;
    if (tab === state.activeTab) return; // already active

    // Update state
    state.activeTab = tab;

    // Update tab button styles
    document.querySelectorAll('.tab').forEach((el) => {
      const isActive = el.dataset.tab === tab;
      el.classList.toggle('tab--active', isActive);
      el.setAttribute('aria-selected', isActive ? 'true' : 'false');
    });

    // Show/hide panels
    document.querySelectorAll('.tab-panel').forEach((panel) => {
      const isActive = panel.id === `tab-${tab}`;
      panel.hidden = !isActive;
      panel.classList.toggle('tab-panel--active', isActive);
    });

    // Render the newly active tab
    renderActiveTab();
  }

  /**
   * Render whichever tab is currently active.
   */
  function renderActiveTab() {
    switch (state.activeTab) {
      case 'today':  renderToday();  break;
      case 'week':   renderWeek();   break;
      case 'month':  renderMonth();  break;
    }
  }


  /* ── Type toggle ──────────────────────────────────────── */

  /**
   * Handle Expense / Income toggle click.
   *
   * @param {MouseEvent} e
   */
  function onTypeToggle(e) {
    const btn = e.target.closest('[data-type]');
    if (!btn) return;

    const type = btn.dataset.type;
    if (type === state.entryType) return;

    state.entryType = type;

    // Update button styles
    document.querySelectorAll('.type-btn').forEach((el) => {
      const isActive = el.dataset.type === type;
      el.classList.toggle('type-btn--active', isActive);
      el.setAttribute('aria-pressed', isActive ? 'true' : 'false');
    });
  }


  /* ── Add entry ────────────────────────────────────────── */

  /**
   * Handle "Add Entry" button click.
   */
  function onAddEntry() {
    UI.clearFormError();

    const name   = document.getElementById('entryName').value;
    const source = document.getElementById('entrySource').value;
    const amount = document.getElementById('entryAmount').value;

    // Basic client-side validation (Storage also validates — defence in depth)
    if (!name.trim()) {
      UI.showFormError('Please enter a name for this entry.');
      document.getElementById('entryName').focus();
      return;
    }

    if (!amount || isNaN(amount) || Number(amount) <= 0) {
      UI.showFormError('Please enter a valid amount greater than 0.');
      document.getElementById('entryAmount').focus();
      return;
    }

    // Attempt to save
    const result = Storage.addEntry({
      name,
      source,
      amount,
      type: state.entryType,
    });

    if (!result.success) {
      UI.showFormError(result.error);
      return;
    }

    // Clear form on success
    document.getElementById('entryName').value   = '';
    document.getElementById('entryAmount').value = '';
    document.getElementById('entryName').focus();

    UI.showToast('Entry added ✓');
    renderToday(); // refresh today's list
  }

  /**
   * Submit form on Enter key.
   *
   * @param {KeyboardEvent} e
   */
  function onFormKeydown(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      onAddEntry();
    }
  }


  /* ── Delete entry ─────────────────────────────────────── */

  /**
   * Handle delete button clicks (delegated from document).
   *
   * @param {MouseEvent} e
   */
  function onDeleteClick(e) {
    const btn = e.target.closest('[data-delete]');
    if (!btn) return;

    const id = Number(btn.dataset.delete);
    if (!id) return;

    const deleted = Storage.deleteEntry(id);

    if (deleted) {
      UI.showToast('Entry deleted.', 'error');
      renderActiveTab(); // refresh current view
    }
  }


  /* ── Render functions ─────────────────────────────────── */

  /** Render the Today tab. */
  function renderToday() {
    const todayStr = Utils.todayString();
    const entries  = Storage.getEntriesByDate(todayStr);
    const totals   = Storage.calcTotals(entries);

    UI.renderTodayHero(totals);
    UI.renderTodayEntries(entries);
  }

  /** Render the Week tab. */
  function renderWeek() {
    const weekDays = Utils.getCurrentWeekDays();
    const from     = Utils.toDateString(weekDays[0]);
    const to       = Utils.toDateString(weekDays[6]);
    const entries  = Storage.getEntriesByRange(from, to);
    const totals   = Storage.calcTotals(entries);
    const byDate   = Storage.groupByDate(entries);

    UI.renderWeekBalance(totals);
    UI.renderWeekChart(weekDays, byDate);
    UI.renderWeekEntries(entries);
  }

  /** Render the Month tab. */
  function renderMonth() {
    const now   = new Date();
    const year  = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const from  = `${year}-${month}-01`;
    // Last day: go to first of next month, subtract one day
    const lastDay = new Date(year, now.getMonth() + 1, 0);
    const to      = Utils.toDateString(lastDay);

    const entries     = Storage.getEntriesByRange(from, to);
    const totals      = Storage.calcTotals(entries);
    const bySource    = Storage.groupBySource(entries);
    const byDate      = Storage.groupByDate(entries);

    UI.renderMonthBalance(totals);
    UI.renderMonthSources(bySource);
    UI.renderMonthDays(byDate);
  }


  /* ── Start ────────────────────────────────────────────── */

  // Wait for DOM to be fully parsed before initialising
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    // DOM already ready (e.g. script loaded async)
    init();
  }

})(); // IIFE — keeps all variables out of global scope
