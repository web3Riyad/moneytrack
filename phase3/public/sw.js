/**
 * sw.js — MoneyTrack Service Worker
 * ----------------------------------
 * Handles:
 *   1. INSTALL  — caches all app shell files on first visit
 *   2. ACTIVATE — cleans up old caches when app updates
 *   3. FETCH    — serves cached files when offline
 *
 * Strategy: Cache First for static assets, Network First for API calls.
 *
 * Cache First:
 *   Check cache → if found, return it (fast, works offline)
 *   If not found → fetch from network → save to cache → return
 *
 * Network First (for Supabase API):
 *   Try network → if success, return response
 *   If offline → return cached version if available
 */

const CACHE_NAME    = 'moneytrack-v3.0.0'
const OFFLINE_URL   = '/offline.html'

// Files to cache on install — the "app shell"
// These files make the app work without internet
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/apple-touch-icon.png',
]

/* ── INSTALL ────────────────────────────────────────────────
   Fires once when the service worker is first installed.
   We pre-cache all static files so the app shell
   is available immediately on next visit.
─────────────────────────────────────────────────────────── */
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[SW] Pre-caching app shell')
        return cache.addAll(PRECACHE_URLS)
      })
      .then(() => {
        // Skip waiting — activate immediately without waiting for old tabs to close
        return self.skipWaiting()
      })
      .catch(err => {
        console.warn('[SW] Pre-cache failed (some files may not exist yet):', err)
        return self.skipWaiting()
      })
  )
})

/* ── ACTIVATE ───────────────────────────────────────────────
   Fires when a new service worker takes control.
   Clean up old caches from previous versions.
─────────────────────────────────────────────────────────── */
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames
            .filter(name => name !== CACHE_NAME)
            .map(name => {
              console.log('[SW] Deleting old cache:', name)
              return caches.delete(name)
            })
        )
      })
      .then(() => {
        // Take control of all open tabs immediately
        return self.clients.claim()
      })
  )
})

/* ── FETCH ──────────────────────────────────────────────────
   Intercepts every network request from the app.
   Decides whether to use cache or network.
─────────────────────────────────────────────────────────── */
self.addEventListener('fetch', event => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-GET requests (POST, PUT, DELETE — Supabase writes)
  if (request.method !== 'GET') return

  // Skip Chrome extension requests
  if (!url.protocol.startsWith('http')) return

  // Supabase API calls → Network First
  // Always try to get fresh data; fall back to cache if offline
  if (url.hostname.includes('supabase.co')) {
    event.respondWith(networkFirst(request))
    return
  }

  // Google Fonts → Cache First (fonts don't change)
  if (url.hostname.includes('fonts.googleapis.com') ||
      url.hostname.includes('fonts.gstatic.com')) {
    event.respondWith(cacheFirst(request))
    return
  }

  // App shell (HTML, JS, CSS, images) → Cache First
  event.respondWith(cacheFirst(request))
})

/* ── Strategies ─────────────────────────────────────────── */

/**
 * Cache First — fast, works offline.
 * Returns cached version if available, otherwise fetches and caches.
 */
async function cacheFirst(request) {
  const cached = await caches.match(request)
  if (cached) return cached

  try {
    const response = await fetch(request)
    // Only cache successful responses
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME)
      cache.put(request, response.clone())
    }
    return response
  } catch {
    // Offline and not cached — return offline page for navigation requests
    if (request.mode === 'navigate') {
      const offlinePage = await caches.match('/index.html')
      return offlinePage || new Response('Offline', { status: 503 })
    }
    return new Response('Offline', { status: 503 })
  }
}

/**
 * Network First — always tries fresh data.
 * Falls back to cache if network fails.
 */
async function networkFirst(request) {
  try {
    const response = await fetch(request)
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME)
      cache.put(request, response.clone())
    }
    return response
  } catch {
    const cached = await caches.match(request)
    return cached || new Response(
      JSON.stringify({ error: 'offline' }),
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    )
  }
}

/* ── Background Sync (Phase 5 ready) ───────────────────────
   When offline entries are added, they can be queued here
   and synced when connection is restored.
   We leave this as a placeholder for Phase 5.
─────────────────────────────────────────────────────────── */
self.addEventListener('sync', event => {
  if (event.tag === 'sync-entries') {
    console.log('[SW] Background sync: syncing offline entries')
    // Phase 5: implement offline queue sync here
  }
})

/* ── Push Notifications (Phase 5 ready) ────────────────────
   Budget alerts and spending summaries will use this.
─────────────────────────────────────────────────────────── */
self.addEventListener('push', event => {
  if (!event.data) return
  const data = event.data.json()
  event.waitUntil(
    self.registration.showNotification(data.title || 'MoneyTrack', {
      body:  data.body  || '',
      icon:  '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      data:  { url: data.url || '/' },
    })
  )
})

self.addEventListener('notificationclick', event => {
  event.notification.close()
  event.waitUntil(
    clients.openWindow(event.notification.data?.url || '/')
  )
})
