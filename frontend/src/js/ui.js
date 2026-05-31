/**
 * ui.js
 * -----
 * Handles ALL DOM rendering and UI updates.
 * - Never reads/writes localStorage directly
 * - Never contains business logic
 * - Receives data as arguments, returns nothing (side-effect: updates DOM)
 *
 * Rule: if it touches document.getElementById or innerHTML, it lives here.
 */

const UI = (() => {

  /* ── Toast ──────────────────────────────────────────────── */

  let toastTimer = null;

  /**
   * Show a temporary toast notification.
   *
   * @param {string}  message
   * @param {'success'|'error'} [type='success']
   * @param {number}  [duration=2200]
   */
  function showToast(message, type = 'success', duration = 2200) {
    const el = document.getElementById('toast');
    if (!el) return;

    el.textContent = message;
    el.className = 'toast toast--visible';
    if (type === 'error') el.classList.add('toast--error');

    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      el.classList.remove('toast--visible', 'toast--error');
    }, duration);
  }

  /**
   * Show an inline form validation error.
   *
   * @param {string} message
   */
  function showFormError(message) {
    const el = document.getElementById('formError');
    if (el) el.textContent = message;
  }

  /** Clear the inline form error. */
  function clearFormError() {
    const el = document.getElementById('formError');
    if (el) el.textContent = '';
  }


  /* ── Header ─────────────────────────────────────────────── */

  /**
   * Render today's date in the header.
   * e.g. "Sunday, 31 May 2026"
   */
  function renderHeaderDate() {
    const el = document.getElementById('headerDate');
    if (!el) return;
    const now = new Date();
    el.textContent = now.toLocaleDateString('en-GB', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    el.setAttribute('datetime', Utils.toDateString(now));
  }


  /* ── Today tab ──────────────────────────────────────────── */

  /**
   * Update the hero card numbers at the top of the Today tab.
   *
   * @param {{ income: number, expense: number, net: number, count: number }} totals
   */
  function renderTodayHero(totals) {
    setText('todayTotal',  Utils.formatCurrency(totals.expense).replace('৳', ''));
    setText('todayCount',  totals.count);
    setText('todayIncome', Utils.formatCurrency(totals.income));

    const netEl = document.getElementById('todayNet');
    if (!netEl) return;
    const sign = totals.net >= 0 ? '+' : '';
    netEl.textContent = sign + Utils.formatCurrency(totals.net);
    netEl.className = totals.net >= 0 ? 'text--income' : 'text--expense';
  }

  /**
   * Render the list of entry items in the Today tab.
   *
   * @param {Object[]} entries
   */
  function renderTodayEntries(entries) {
    const container = document.getElementById('todayEntries');
    if (!container) return;

    if (!entries.length) {
      container.innerHTML = emptyState('No entries yet — add your first one above.');
      return;
    }

    // Show newest first
    const sorted = [...entries].sort((a, b) => b.ts - a.ts);
    container.innerHTML = sorted.map(entryHTML).join('');
  }


  /* ── Week tab ───────────────────────────────────────────── */

  /**
   * Render the balance summary row for the week tab.
   *
   * @param {{ income: number, expense: number, net: number }} totals
   */
  function renderWeekBalance(totals) {
    renderBalanceRow('weekBalance', totals);
  }

  /**
   * Render the 7-column bar chart for the current week.
   *
   * @param {Date[]}  weekDays   — array of 7 Date objects (Mon–Sun)
   * @param {Object}  byDate     — { "YYYY-MM-DD": expenseTotal }
   */
  function renderWeekChart(weekDays, byDate) {
    const container = document.getElementById('weekGrid');
    if (!container) return;

    const todayStr = Utils.todayString();
    const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
    const amounts = weekDays.map((d) => byDate[Utils.toDateString(d)] || 0);
    const max = Math.max(...amounts, 1); // avoid divide-by-zero
    const MAX_BAR_HEIGHT = 44; // px

    container.innerHTML = weekDays.map((d, i) => {
      const ds = Utils.toDateString(d);
      const isToday = ds === todayStr;
      const barHeight = Math.max(4, Math.round((amounts[i] / max) * MAX_BAR_HEIGHT));
      const amtLabel = amounts[i] > 0 ? Utils.formatCurrency(amounts[i]) : '–';

      return `
        <div class="week-col ${isToday ? 'week-col--today' : ''}" aria-label="${DAY_LABELS[i]}: ${amtLabel}">
          <div class="week-col__day">${DAY_LABELS[i]}</div>
          <div class="week-col__bar-wrap">
            <div class="week-col__bar" style="height: ${barHeight}px;" role="img"></div>
          </div>
          <div class="week-col__amount">${amtLabel}</div>
        </div>
      `;
    }).join('');
  }

  /**
   * Render the entry list in the Week tab.
   *
   * @param {Object[]} entries
   */
  function renderWeekEntries(entries) {
    const container = document.getElementById('weekEntries');
    if (!container) return;

    if (!entries.length) {
      container.innerHTML = emptyState('No entries this week yet.');
      return;
    }

    const sorted = [...entries].sort((a, b) => b.ts - a.ts);
    container.innerHTML = sorted.map(entryHTML).join('');
  }


  /* ── Month tab ──────────────────────────────────────────── */

  /**
   * Render the balance row for the month.
   *
   * @param {{ income: number, expense: number, net: number }} totals
   */
  function renderMonthBalance(totals) {
    renderBalanceRow('monthBalance', totals);
  }

  /**
   * Render the "spending by source" bars.
   *
   * @param {Array<{ source: string, amount: number }>} sourceTotals
   */
  function renderMonthSources(sourceTotals) {
    const container = document.getElementById('monthSources');
    if (!container) return;

    if (!sourceTotals.length) {
      container.innerHTML = emptyState('No expenses this month.');
      return;
    }

    const max = sourceTotals[0].amount; // already sorted desc

    container.innerHTML = sourceTotals.map(({ source, amount }) => {
      const pct = Math.round((amount / max) * 100);
      return `
        <div class="source-bar">
          <div class="source-bar__header">
            <span class="source-bar__name">${Utils.escapeHtml(source)}</span>
            <span class="source-bar__value">${Utils.formatCurrency(amount)}</span>
          </div>
          <div class="progress-track" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100">
            <div class="progress-fill" style="width: ${pct}%;"></div>
          </div>
        </div>
      `;
    }).join('');
  }

  /**
   * Render the "daily breakdown" list in month view.
   *
   * @param {Object} byDate  — { "YYYY-MM-DD": expenseTotal } sorted desc by date
   */
  function renderMonthDays(byDate) {
    const container = document.getElementById('monthDays');
    if (!container) return;

    const entries = Object.entries(byDate).sort((a, b) => (a[0] < b[0] ? 1 : -1));

    if (!entries.length) {
      container.innerHTML = emptyState('No daily data yet.');
      return;
    }

    container.innerHTML = entries.map(([date, amount]) => `
      <div class="day-row">
        <span class="day-row__date">${Utils.formatDateLabel(date)}</span>
        <span class="day-row__amount">${Utils.formatCurrency(amount)}</span>
      </div>
    `).join('');
  }


  /* ── Shared helpers ─────────────────────────────────────── */

  /**
   * Build HTML string for one entry item.
   * All user content is escaped to prevent XSS.
   *
   * @param {Object} entry
   * @returns {string}
   */
  function entryHTML(entry) {
    const isExpense = entry.type === 'expense';
    const icon      = isExpense ? '↑' : '↓';
    const sign      = isExpense ? '−' : '+';
    const amtClass  = isExpense ? 'entry__amount--expense' : 'entry__amount--income';
    const iconClass = isExpense ? 'entry__icon--expense'   : 'entry__icon--income';

    return `
      <article class="entry" data-id="${entry.id}">
        <div class="entry__icon ${iconClass}" aria-hidden="true">${icon}</div>
        <div class="entry__info">
          <div class="entry__name">${Utils.escapeHtml(entry.name)}</div>
          <div class="entry__meta">
            ${Utils.formatDateLabel(entry.date)}
            <span class="entry__source-tag">${Utils.escapeHtml(entry.source)}</span>
          </div>
        </div>
        <div class="entry__amount ${amtClass}" aria-label="${sign}${Utils.formatCurrency(entry.amount)}">
          ${sign}${Utils.formatCurrency(entry.amount)}
        </div>
        <button
          class="btn btn--icon"
          data-delete="${entry.id}"
          aria-label="Delete entry: ${Utils.escapeHtml(entry.name)}"
          title="Delete"
        >✕</button>
      </article>
    `;
  }

  /**
   * Build a 3-column balance row and inject it into a container.
   *
   * @param {string} containerId
   * @param {{ income: number, expense: number, net: number }} totals
   */
  function renderBalanceRow(containerId, totals) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const netClass = totals.net >= 0 ? 'balance-card__value--pos' : 'balance-card__value--neg';
    const netSign  = totals.net >= 0 ? '+' : '';

    container.innerHTML = `
      <div class="balance-card">
        <div class="balance-card__label">Income</div>
        <div class="balance-card__value balance-card__value--income">${Utils.formatCurrency(totals.income)}</div>
      </div>
      <div class="balance-card">
        <div class="balance-card__label">Expense</div>
        <div class="balance-card__value balance-card__value--expense">${Utils.formatCurrency(totals.expense)}</div>
      </div>
      <div class="balance-card">
        <div class="balance-card__label">Balance</div>
        <div class="balance-card__value ${netClass}">${netSign}${Utils.formatCurrency(totals.net)}</div>
      </div>
    `;
  }

  /**
   * Render an empty-state message inside a container.
   *
   * @param {string} message
   * @returns {string} HTML string
   */
  function emptyState(message) {
    return `
      <div class="empty-state">
        <div class="empty-state__icon">💸</div>
        <p>${Utils.escapeHtml(message)}</p>
      </div>
    `;
  }

  /**
   * Shorthand: set textContent of an element by ID.
   *
   * @param {string} id
   * @param {string|number} text
   */
  function setText(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  }

  // Public API
  return {
    showToast,
    showFormError,
    clearFormError,
    renderHeaderDate,
    renderTodayHero,
    renderTodayEntries,
    renderWeekBalance,
    renderWeekChart,
    renderWeekEntries,
    renderMonthBalance,
    renderMonthSources,
    renderMonthDays,
  };
})();
