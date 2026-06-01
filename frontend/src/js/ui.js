/**
 * ui.js  (Phase 2)
 * ----------------
 * All DOM rendering — identical to Phase 1 for the app views.
 * New additions:
 *   - renderUserInfo()     → shows name + avatar in header
 *   - showScreen()         → switches between loading/auth/app screens
 *   - Auth helper methods  → error display, button loading states
 */

const UI = (() => {

  /* ── Toast ──────────────────────────────────────────────── */
  let toastTimer = null;

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

  function showFormError(id, message) {
    const el = document.getElementById(id);
    if (el) el.textContent = message;
  }

  function clearFormError(id) {
    const el = document.getElementById(id);
    if (el) el.textContent = '';
  }

  /* ── Screen management ──────────────────────────────────── */

  /**
   * Show one of three screens: 'loading' | 'auth' | 'app'
   * Hides the others.
   *
   * @param {'loading'|'auth'|'app'} screen
   */
  function showScreen(screen) {
    document.getElementById('loading-screen').hidden = (screen !== 'loading');
    document.getElementById('auth-screen').hidden    = (screen !== 'auth');
    document.getElementById('app-screen').hidden     = (screen !== 'app');
  }

  /* ── Auth UI helpers ────────────────────────────────────── */

  /**
   * Set a button into a loading/disabled state while async work runs.
   *
   * @param {string}  btnId
   * @param {boolean} loading
   * @param {string}  [loadingText='...']
   * @param {string}  [originalText]
   */
  function setButtonLoading(btnId, loading, loadingText = 'Please wait...', originalText = '') {
    const btn = document.getElementById(btnId);
    if (!btn) return;
    btn.disabled = loading;
    if (loading) {
      btn.dataset.originalText = btn.textContent;
      btn.textContent = loadingText;
    } else {
      btn.textContent = originalText || btn.dataset.originalText || btn.textContent;
    }
  }

  /* ── User info ──────────────────────────────────────────── */

  /**
   * Update the header avatar + user menu with the logged-in user's info.
   *
   * @param {{ displayName: string|null, email: string }} user  Firebase user
   */
  function renderUserInfo(user) {
    const name = user.displayName || user.email.split('@')[0];
    const initials = Utils.getInitials(user.displayName || user.email);

    setText('userAvatar',      initials);
    setText('userDisplayName', name);
    setText('userEmail',       user.email);
  }

  /* ── Header date ────────────────────────────────────────── */
  function renderHeaderDate() {
    const el = document.getElementById('headerDate');
    if (!el) return;
    const now = new Date();
    el.textContent = now.toLocaleDateString('en-GB', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    });
    el.setAttribute('datetime', Utils.toDateString(now));
  }

  /* ── Today tab ──────────────────────────────────────────── */
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

  function renderTodayEntries(entries) {
    const container = document.getElementById('todayEntries');
    if (!container) return;
    if (!entries.length) {
      container.innerHTML = emptyState('No entries yet — add your first one above.');
      return;
    }
    container.innerHTML = entries.map(entryHTML).join('');
  }

  /* ── Week tab ───────────────────────────────────────────── */
  function renderWeekBalance(totals) {
    renderBalanceRow('weekBalance', totals);
  }

  function renderWeekChart(weekDays, byDate) {
    const container = document.getElementById('weekGrid');
    if (!container) return;
    const todayStr = Utils.todayString();
    const DAY_LABELS = ['M','T','W','T','F','S','S'];
    const amounts = weekDays.map(d => byDate[Utils.toDateString(d)] || 0);
    const max = Math.max(...amounts, 1);
    const MAX_BAR = 44;
    container.innerHTML = weekDays.map((d, i) => {
      const ds = Utils.toDateString(d);
      const isToday = ds === todayStr;
      const barH = Math.max(4, Math.round((amounts[i] / max) * MAX_BAR));
      const amtLabel = amounts[i] > 0 ? Utils.formatCurrency(amounts[i]) : '–';
      return `
        <div class="week-col ${isToday ? 'week-col--today' : ''}">
          <div class="week-col__day">${DAY_LABELS[i]}</div>
          <div class="week-col__bar-wrap">
            <div class="week-col__bar" style="height:${barH}px;"></div>
          </div>
          <div class="week-col__amount">${amtLabel}</div>
        </div>`;
    }).join('');
  }

  function renderWeekEntries(entries) {
    const container = document.getElementById('weekEntries');
    if (!container) return;
    if (!entries.length) { container.innerHTML = emptyState('No entries this week yet.'); return; }
    container.innerHTML = entries.map(entryHTML).join('');
  }

  /* ── Month tab ──────────────────────────────────────────── */
  function renderMonthBalance(totals) {
    renderBalanceRow('monthBalance', totals);
  }

  function renderMonthSources(sourceTotals) {
    const container = document.getElementById('monthSources');
    if (!container) return;
    if (!sourceTotals.length) { container.innerHTML = emptyState('No expenses this month.'); return; }
    const max = sourceTotals[0].amount;
    container.innerHTML = sourceTotals.map(({ source, amount }) => {
      const pct = Math.round((amount / max) * 100);
      return `
        <div class="source-bar">
          <div class="source-bar__header">
            <span class="source-bar__name">${Utils.escapeHtml(source)}</span>
            <span class="source-bar__value">${Utils.formatCurrency(amount)}</span>
          </div>
          <div class="progress-track" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100">
            <div class="progress-fill" style="width:${pct}%;"></div>
          </div>
        </div>`;
    }).join('');
  }

  function renderMonthDays(byDate) {
    const container = document.getElementById('monthDays');
    if (!container) return;
    const entries = Object.entries(byDate).sort((a, b) => a[0] < b[0] ? 1 : -1);
    if (!entries.length) { container.innerHTML = emptyState('No daily data yet.'); return; }
    container.innerHTML = entries.map(([date, amount]) => `
      <div class="day-row">
        <span class="day-row__date">${Utils.formatDateLabel(date)}</span>
        <span class="day-row__amount">${Utils.formatCurrency(amount)}</span>
      </div>`).join('');
  }

  /* ── Loading states for tabs ────────────────────────────── */

  /**
   * Show a skeleton loader inside a container while data loads from Firestore.
   *
   * @param {string} containerId
   */
  function showLoadingSkeleton(containerId) {
    const el = document.getElementById(containerId);
    if (!el) return;
    el.innerHTML = `
      <div class="skeleton-item"></div>
      <div class="skeleton-item skeleton-item--short"></div>
      <div class="skeleton-item"></div>`;
  }

  /* ── Shared helpers ─────────────────────────────────────── */

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
        <div class="entry__amount ${amtClass}">${sign}${Utils.formatCurrency(entry.amount)}</div>
        <button class="btn btn--icon" data-delete="${entry.id}" aria-label="Delete ${Utils.escapeHtml(entry.name)}">✕</button>
      </article>`;
  }

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
      </div>`;
  }

  function emptyState(message) {
    return `<div class="empty-state"><div class="empty-state__icon">💸</div><p>${Utils.escapeHtml(message)}</p></div>`;
  }

  function setText(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  }

  // Public API
  return {
    showToast,
    showFormError,
    clearFormError,
    showScreen,
    setButtonLoading,
    renderUserInfo,
    renderHeaderDate,
    renderTodayHero,
    renderTodayEntries,
    renderWeekBalance,
    renderWeekChart,
    renderWeekEntries,
    renderMonthBalance,
    renderMonthSources,
    renderMonthDays,
    showLoadingSkeleton,
  };
})();
