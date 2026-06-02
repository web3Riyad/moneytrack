/**
 * InstallPrompt.jsx
 * -----------------
 * Shows an "Install App" prompt at the bottom of the screen.
 *
 * Android Chrome: uses the native beforeinstallprompt event
 *   → shows a native install dialog
 *
 * iOS Safari: shows manual instructions
 *   → "Tap Share → Add to Home Screen"
 *
 * Dismissed state is saved to localStorage so it
 * doesn't keep appearing after the user closes it.
 */

import { useState, useEffect } from 'react'
import './InstallPrompt.css'

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [showAndroid,    setShowAndroid]    = useState(false)
  const [showIOS,        setShowIOS]        = useState(false)

  useEffect(() => {
    // Don't show if already dismissed or already installed
    const dismissed = localStorage.getItem('pwa-install-dismissed')
    if (dismissed) return

    // Don't show if already running as installed PWA
    const isInstalled = window.matchMedia('(display-mode: standalone)').matches
      || window.navigator.standalone === true
    if (isInstalled) return

    // Android/Chrome: capture the install prompt event
    const handler = (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
      window.__installPrompt = e
      setShowAndroid(true)
    }
    window.addEventListener('beforeinstallprompt', handler)

    // iOS Safari detection
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent)
    if (isIOS && isSafari) {
      setShowIOS(true)
    }

    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  function dismiss() {
    localStorage.setItem('pwa-install-dismissed', '1')
    setShowAndroid(false)
    setShowIOS(false)
  }

  async function handleInstall() {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      console.log('[PWA] User accepted install')
    }
    setDeferredPrompt(null)
    setShowAndroid(false)
    dismiss()
  }

  if (!showAndroid && !showIOS) return null

  return (
    <div className="install-prompt" role="dialog" aria-label="Install MoneyTrack">
      <div className="install-prompt__icon">
        <img src="/icons/icon-192.png" alt="MoneyTrack icon" width="44" height="44" />
      </div>
      <div className="install-prompt__text">
        <div className="install-prompt__title">Install MoneyTrack</div>
        {showAndroid && (
          <div className="install-prompt__sub">Add to home screen</div>
        )}
        {showIOS && (
          <div className="install-prompt__sub">
            Tap <strong>Share</strong> then <strong>Add to Home Screen</strong>
          </div>
        )}
      </div>
      <div className="install-prompt__actions">
        {showAndroid && (
          <button className="install-btn" onClick={handleInstall}>
            Install
          </button>
        )}
        <button className="dismiss-btn" onClick={dismiss} aria-label="Dismiss">✕</button>
      </div>
    </div>
  )
}
