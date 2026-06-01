/**
 * utils.js
 * --------
 * Pure utility / helper functions.
 * Identical to Phase 1 — no changes needed here.
 * This proves our architecture was correct: logic is isolated.
 */

const Utils = (() => {

  function toDateString(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  function todayString() {
    return toDateString(new Date());
  }

  function formatCurrency(amount, showDecimals = false) {
    const options = {
      minimumFractionDigits: showDecimals ? 2 : 0,
      maximumFractionDigits: showDecimals ? 2 : 0,
    };
    return '৳' + Number(amount).toLocaleString('en-BD', options);
  }

  function formatDateLabel(dateStr) {
    const d = new Date(dateStr + 'T12:00:00');
    return d.toLocaleDateString('en-GB', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });
  }

  function getCurrentWeekDays() {
    const today = new Date();
    const dow = today.getDay();
    const mondayOffset = (dow + 6) % 7;
    const monday = new Date(today);
    monday.setDate(today.getDate() - mondayOffset);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      return d;
    });
  }

  function generateId() {
    return Date.now() + Math.floor(Math.random() * 1000);
  }

  function sanitise(str) {
    return String(str).trim();
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  /**
   * Get initials from a display name or email.
   * "Riyad Ahmed" → "RA"   |   "riyad@gmail.com" → "R"
   *
   * @param {string} nameOrEmail
   * @returns {string}
   */
  function getInitials(nameOrEmail) {
    if (!nameOrEmail) return '?';
    const parts = nameOrEmail.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return nameOrEmail[0].toUpperCase();
  }

  return {
    toDateString,
    todayString,
    formatCurrency,
    formatDateLabel,
    getCurrentWeekDays,
    generateId,
    sanitise,
    escapeHtml,
    clamp,
    getInitials,
  };
})();
