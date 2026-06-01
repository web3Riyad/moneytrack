/**
 * app.js  (Phase 2)
 * -----------------
 * Main application controller.
 *
 * New in Phase 2 vs Phase 1:
 *   1. Auth flow  — login, register, Google sign-in, sign-out
 *   2. onAuthStateChanged — Firebase tells us when user logs in/out
 *   3. All render functions are now async (await Firestore calls)
 *   4. Loading skeletons shown while data fetches from the cloud
 *
 * The tab rendering logic is IDENTICAL to Phase 1.
 * Only the data-fetching calls changed from synchronous to async.
 */

(function () {
  'use strict';

  /* ── State ──────────────────────────────────────────────── */
  const state = {
    activeTab: 'today',
    entryType: 'expense',
    authTab:   'login',
  };

  /* ── Boot ───────────────────────────────────────────────── */

  // function init() {
  //   // Show loading screen immediately — prevents flash of wrong screen
  //   UI.showScreen('loading');

  //   // Firebase Auth listener — this is the single source of truth for auth state.
  //   // It fires once on page load (telling us if user is already logged in)
  //   // and again whenever login/logout happens.
  //   FirebaseAuth.onAuthStateChanged(onAuthStateChanged);

  //   bindAuthEvents();
  //   bindAppEvents();
  // }
  function init() {
  UI.showScreen('loading');

  // Fallback: if Firebase auth takes too long, show login screen
  const authTimeout = setTimeout(() => {
    UI.showScreen('auth');
  }, 3000);

  FirebaseAuth.onAuthStateChanged(function(user) {
    clearTimeout(authTimeout);
    onAuthStateChanged(user);
  });

  bindAuthEvents();
  bindAppEvents();
}

  /* ── Auth state handler ─────────────────────────────────── */

  /**
   * Called by Firebase whenever the user's auth state changes.
   * This is the ONLY place we decide which screen to show.
   *
   * @param {Object|null} user  — Firebase User or null
   */
  async function onAuthStateChanged(user) {
    if (user) {
      // User is logged in
      Storage.setUser(user);           // tell Storage which user's data to read
      UI.renderUserInfo(user);         // show name + avatar in header
      UI.renderHeaderDate();
      UI.showScreen('app');            // show the main app
      showTabPanel('today');
      await renderActiveTab();         // load their data from Firestore
    } else {
      // User is NOT logged in
      Storage.setUser(null);
      UI.showScreen('auth');           // show login screen
    }
  }

  /* ── Auth event binding ─────────────────────────────────── */

  function bindAuthEvents() {
    // Auth tab toggle (Sign in ↔ Create account)
    document.querySelector('.auth-tabs')
      .addEventListener('click', onAuthTabClick);

    // Email login
    document.getElementById('loginBtn')
      .addEventListener('click', onEmailLogin);

    // Email register
    document.getElementById('registerBtn')
      .addEventListener('click', onEmailRegister);

    // Google sign-in (both buttons — login and register screens)
    document.getElementById('googleLoginBtn')
      .addEventListener('click', onGoogleSignIn);
    document.getElementById('googleRegisterBtn')
      .addEventListener('click', onGoogleSignIn);

    // Allow Enter key in auth forms
    ['loginEmail','loginPassword'].forEach(id => {
      document.getElementById(id)
        .addEventListener('keydown', e => { if (e.key === 'Enter') onEmailLogin(); });
    });
    ['registerName','registerEmail','registerPassword'].forEach(id => {
      document.getElementById(id)
        .addEventListener('keydown', e => { if (e.key === 'Enter') onEmailRegister(); });
    });

    // Sign out
    document.getElementById('signOutBtn')
      .addEventListener('click', onSignOut);

    // User menu toggle
    document.getElementById('userMenuBtn')
      .addEventListener('click', toggleUserMenu);

    // Close user menu when clicking outside
    document.addEventListener('click', e => {
      const menu = document.getElementById('userMenu');
      const btn  = document.getElementById('userMenuBtn');
      if (!menu.hidden && !menu.contains(e.target) && !btn.contains(e.target)) {
        menu.hidden = true;
        btn.setAttribute('aria-expanded', 'false');
      }
    });
  }

  /* ── Auth tab toggle ────────────────────────────────────── */

  function onAuthTabClick(e) {
    const btn = e.target.closest('[data-auth-tab]');
    if (!btn) return;
    const tab = btn.dataset.authTab;
    if (tab === state.authTab) return;
    state.authTab = tab;

    document.querySelectorAll('.auth-tab').forEach(el => {
      el.classList.toggle('auth-tab--active', el.dataset.authTab === tab);
    });
    document.getElementById('auth-panel-login').hidden    = (tab !== 'login');
    document.getElementById('auth-panel-register').hidden = (tab !== 'register');

    // Clear errors when switching tabs
    UI.clearFormError('loginError');
    UI.clearFormError('registerError');
  }

  /* ── Email login ────────────────────────────────────────── */

  async function onEmailLogin() {
    UI.clearFormError('loginError');
    const email    = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;

    if (!email)    { UI.showFormError('loginError', 'Please enter your email.');    return; }
    if (!password) { UI.showFormError('loginError', 'Please enter your password.'); return; }

    UI.setButtonLoading('loginBtn', true, 'Signing in...');
    try {
      await FirebaseAuth.signInWithEmailAndPassword(email, password);
      // onAuthStateChanged fires automatically after this — no manual redirect needed
    } catch (err) {
      UI.showFormError('loginError', friendlyAuthError(err.code));
      UI.setButtonLoading('loginBtn', false, '', 'Sign in');
    }
  }

  /* ── Email register ─────────────────────────────────────── */

  async function onEmailRegister() {
    UI.clearFormError('registerError');
    const name     = document.getElementById('registerName').value.trim();
    const email    = document.getElementById('registerEmail').value.trim();
    const password = document.getElementById('registerPassword').value;

    if (!name)                   { UI.showFormError('registerError', 'Please enter your name.');                  return; }
    if (!email)                  { UI.showFormError('registerError', 'Please enter your email.');                 return; }
    if (password.length < 6)     { UI.showFormError('registerError', 'Password must be at least 6 characters.'); return; }

    UI.setButtonLoading('registerBtn', true, 'Creating account...');
    try {
      const cred = await FirebaseAuth.createUserWithEmailAndPassword(email, password);
      // Save display name to the Firebase user profile
      await cred.user.updateProfile({ displayName: name });
      // onAuthStateChanged already fired (on createUser) before displayName was set.
      // Re-render header now that displayName is available on the user object.
      UI.renderUserInfo(cred.user);
    } catch (err) {
      UI.showFormError('registerError', friendlyAuthError(err.code));
      UI.setButtonLoading('registerBtn', false, '', 'Create account');
    }
  }

  /* ── Google sign-in ─────────────────────────────────────── */

  async function onGoogleSignIn() {
    try {
      await FirebaseAuth.signInWithPopup(GoogleProvider);
      // onAuthStateChanged fires automatically
    } catch (err) {
      if (err.code !== 'auth/popup-closed-by-user') {
        UI.showToast(friendlyAuthError(err.code), 'error');
      }
    }
  }

  /* ── Sign out ───────────────────────────────────────────── */

  async function onSignOut() {
    toggleUserMenu(); // close menu first
    try {
      await FirebaseAuth.signOut();
      // onAuthStateChanged fires automatically → shows auth screen
    } catch (err) {
      UI.showToast('Sign out failed. Please try again.', 'error');
    }
  }

  /* ── User menu ──────────────────────────────────────────── */

  function toggleUserMenu() {
    const menu = document.getElementById('userMenu');
    const btn  = document.getElementById('userMenuBtn');
    const isOpen = !menu.hidden;
    menu.hidden = isOpen;
    btn.setAttribute('aria-expanded', String(!isOpen));
  }

  /* ── Friendly error messages ────────────────────────────── */

  /**
   * Convert Firebase error codes into human-readable messages.
   *
   * @param {string} code  — e.g. "auth/wrong-password"
   * @returns {string}
   */
  function friendlyAuthError(code) {
    const messages = {
      'auth/user-not-found':       'No account found with this email.',
      'auth/wrong-password':       'Incorrect password. Please try again.',
      'auth/invalid-credential':   'Incorrect email or password.',
      'auth/email-already-in-use': 'An account with this email already exists.',
      'auth/weak-password':        'Password must be at least 6 characters.',
      'auth/invalid-email':        'Please enter a valid email address.',
      'auth/too-many-requests':    'Too many failed attempts. Please try again later.',
      'auth/network-request-failed': 'Network error. Check your connection.',
    };
    return messages[code] || 'Something went wrong. Please try again.';
  }

  /* ── App event binding ──────────────────────────────────── */

  function bindAppEvents() {
    // Tab navigation
    document.querySelector('.tab-bar')
      .addEventListener('click', onTabClick);

    // Type toggle (Expense / Income)
    document.querySelector('.type-toggle')
      .addEventListener('click', onTypeToggle);

    // Add Entry button
    document.getElementById('addEntryBtn')
      .addEventListener('click', onAddEntry);

    // Enter key in form fields
    document.getElementById('entryName')
      .addEventListener('keydown', e => { if (e.key === 'Enter') onAddEntry(); });
    document.getElementById('entryAmount')
      .addEventListener('keydown', e => { if (e.key === 'Enter') onAddEntry(); });

    // Delete — event delegation
    document.addEventListener('click', onDeleteClick);
  }

  /* ── Tab handling ───────────────────────────────────────── */

  function onTabClick(e) {
    const btn = e.target.closest('[data-tab]');
    if (!btn) return;
    const tab = btn.dataset.tab;
    if (tab === state.activeTab) return;
    state.activeTab = tab;

    document.querySelectorAll('.tab').forEach(el => {
      const isActive = el.dataset.tab === tab;
      el.classList.toggle('tab--active', isActive);
      el.setAttribute('aria-selected', String(isActive));
    });

    showTabPanel(tab);
    renderActiveTab();
  }

  function showTabPanel(tab) {
    document.querySelectorAll('.tab-panel').forEach(panel => {
      const isActive = panel.id === `tab-${tab}`;
      panel.hidden = !isActive;
      panel.classList.toggle('tab-panel--active', isActive);
    });
  }

  async function renderActiveTab() {
    switch (state.activeTab) {
      case 'today': await renderToday(); break;
      case 'week':  await renderWeek();  break;
      case 'month': await renderMonth(); break;
    }
  }

  /* ── Type toggle ────────────────────────────────────────── */

  function onTypeToggle(e) {
    const btn = e.target.closest('[data-type]');
    if (!btn) return;
    const type = btn.dataset.type;
    if (type === state.entryType) return;
    state.entryType = type;
    document.querySelectorAll('.type-btn').forEach(el => {
      const isActive = el.dataset.type === type;
      el.classList.toggle('type-btn--active', isActive);
      el.setAttribute('aria-pressed', String(isActive));
    });
  }

  /* ── Add entry ──────────────────────────────────────────── */

  async function onAddEntry() {
    UI.clearFormError('formError');

    const name   = document.getElementById('entryName').value;
    const source = document.getElementById('entrySource').value;
    const amount = document.getElementById('entryAmount').value;

    if (!name.trim()) {
      UI.showFormError('formError', 'Please enter a name for this entry.');
      document.getElementById('entryName').focus();
      return;
    }
    if (!amount || isNaN(amount) || Number(amount) <= 0) {
      UI.showFormError('formError', 'Please enter a valid amount greater than 0.');
      document.getElementById('entryAmount').focus();
      return;
    }

    // Disable button while saving to Firestore
    UI.setButtonLoading('addEntryBtn', true, 'Saving...');

    const result = await Storage.addEntry({
      name, source, amount, type: state.entryType,
    });

    UI.setButtonLoading('addEntryBtn', false, '', 'Add Entry');

    if (!result.success) {
      UI.showFormError('formError', result.error);
      return;
    }

    document.getElementById('entryName').value   = '';
    document.getElementById('entryAmount').value = '';
    document.getElementById('entryName').focus();

    UI.showToast('Entry saved ✓');
    await renderToday();
  }

  /* ── Delete entry ───────────────────────────────────────── */

  async function onDeleteClick(e) {
    const btn = e.target.closest('[data-delete]');
    if (!btn) return;
    const id = btn.dataset.delete;
    if (!id) return;

    // Optimistically remove the entry card from DOM immediately
    const card = btn.closest('.entry');
    if (card) card.style.opacity = '0.3';

    const deleted = await Storage.deleteEntry(id);
    if (deleted) {
      UI.showToast('Entry deleted.', 'error');
      await renderActiveTab();
    } else {
      if (card) card.style.opacity = '1';
      UI.showToast('Could not delete. Try again.', 'error');
    }
  }

  /* ── Render functions ───────────────────────────────────── */

  async function renderToday() {
    UI.showLoadingSkeleton('todayEntries');
    const todayStr = Utils.todayString();
    const entries  = await Storage.getEntriesByDate(todayStr);
    const totals   = Storage.calcTotals(entries);
    UI.renderTodayHero(totals);
    UI.renderTodayEntries(entries);
  }

  async function renderWeek() {
    UI.showLoadingSkeleton('weekEntries');
    const weekDays = Utils.getCurrentWeekDays();
    const from     = Utils.toDateString(weekDays[0]);
    const to       = Utils.toDateString(weekDays[6]);
    const entries  = await Storage.getEntriesByRange(from, to);
    const totals   = Storage.calcTotals(entries);
    const byDate   = Storage.groupByDate(entries);
    UI.renderWeekBalance(totals);
    UI.renderWeekChart(weekDays, byDate);
    UI.renderWeekEntries(entries);
  }

  async function renderMonth() {
    UI.showLoadingSkeleton('monthSources');
    const now     = new Date();
    const year    = now.getFullYear();
    const month   = String(now.getMonth() + 1).padStart(2, '0');
    const from    = `${year}-${month}-01`;
    const lastDay = new Date(year, now.getMonth() + 1, 0);
    const to      = Utils.toDateString(lastDay);
    const entries    = await Storage.getEntriesByRange(from, to);
    const totals     = Storage.calcTotals(entries);
    const bySource   = Storage.groupBySource(entries);
    const byDate     = Storage.groupByDate(entries);
    UI.renderMonthBalance(totals);
    UI.renderMonthSources(bySource);
    UI.renderMonthDays(byDate);
  }

  /* ── Start ──────────────────────────────────────────────── */

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
