/**
 * utils.js
 * --------
 * Pure utility / helper functions.
 * - No DOM access
 * - No side effects
 * - Each function does exactly one thing
 * - All functions are exported on the global `Utils` object
 *   (no build tool needed for Phase 1)
 */

const Utils = (() => {
  /**
   * Format a Date object to "YYYY-MM-DD" string (ISO date, local time).
   * Using local time avoids UTC-offset bugs when comparing dates.
   *
   * @param {Date} date
   * @returns {string} e.g. "2026-05-31"
   */
  function toDateString(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  /**
   * Return today's date as "YYYY-MM-DD".
   *
   * @returns {string}
   */
  function todayString() {
    return toDateString(new Date());
  }

  /**
   * Format a number as Bangladeshi Taka with locale-aware thousands separator.
   * e.g. 12500 → "৳12,500"  |  150.5 → "৳150.50"
   *
   * @param {number} amount
   * @param {boolean} [showDecimals=false]
   * @returns {string}
   */
  function formatCurrency(amount, showDecimals = false) {
    const options = {
      minimumFractionDigits: showDecimals ? 2 : 0,
      maximumFractionDigits: showDecimals ? 2 : 0,
    };
    return '৳' + Number(amount).toLocaleString('en-BD', options);
  }

  /**
   * Format a date string "YYYY-MM-DD" to a human-readable label.
   * e.g. "2026-05-31" → "Sat, 31 May"
   *
   * @param {string} dateStr  "YYYY-MM-DD"
   * @returns {string}
   */
  function formatDateLabel(dateStr) {
    // Append T12:00:00 to avoid midnight UTC-offset rollback issues
    const d = new Date(dateStr + 'T12:00:00');
    return d.toLocaleDateString('en-GB', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });
  }

  /**
   * Return an array of the 7 Date objects for the current ISO week
   * (Monday → Sunday).
   *
   * @returns {Date[]}
   */
  function getCurrentWeekDays() {
    const today = new Date();
    const dow = today.getDay(); // 0 = Sun … 6 = Sat
    // Shift so Monday = 0
    const mondayOffset = (dow + 6) % 7;
    const monday = new Date(today);
    monday.setDate(today.getDate() - mondayOffset);

    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      return d;
    });
  }

  /**
   * Generate a simple unique ID based on timestamp + random suffix.
   * Good enough for client-side IDs; replace with UUID library in Phase 3.
   *
   * @returns {number}
   */
  function generateId() {
    return Date.now() + Math.floor(Math.random() * 1000);
  }

  /**
   * Sanitise a string by trimming whitespace.
   * Extend this function in later phases for XSS protection if needed.
   *
   * @param {string} str
   * @returns {string}
   */
  function sanitise(str) {
    return String(str).trim();
  }

  /**
   * Escape HTML special characters to prevent XSS when injecting
   * user-supplied text into innerHTML.
   *
   * @param {string} str
   * @returns {string}
   */
  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  /**
   * Clamp a number between min and max.
   *
   * @param {number} value
   * @param {number} min
   * @param {number} max
   * @returns {number}
   */
  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  // Public API
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
  };
})();
