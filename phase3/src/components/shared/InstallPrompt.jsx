import { useState, useEffect } from 'react'
import './InstallPrompt.css'

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [showAndroid,    setShowAndroid]    = useState(false)
  const [showIOS,        setShowIOS]        = useState(false)

  useEffect(() => {
    const dismissed  = localStorage.getItem('pwa-install-dismissed')
    if (dismissed) return

    const isInstalled = window.matchMedia('(display-mode: standalone)').matches
      || window.navigator.standalone === true
    if (isInstalled) return

    const handler = (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
      window.__installPrompt = e
      setShowAndroid(true)
    }
    window.addEventListener('beforeinstallprompt', handler)

    const isIOS    = /iPad|iPhone|iPod/.test(navigator.userAgent)
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent)
    if (isIOS && isSafari) setShowIOS(true)

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
    if (outcome === 'accepted') console.log('[PWA] Installed')
    setDeferredPrompt(null)
    setShowAndroid(false)
    dismiss()
  }

  if (!showAndroid && !showIOS) return null

  return (
    <div className="ip-wrap">
      <div className="ip-icon">
        <img src="/icons/icon-192.png" alt="" />
      </div>
      <div className="ip-text">
        <div className="ip-title">Install MoneyTrack</div>
        {showAndroid && <div className="ip-sub">Install app</div>}
        {showIOS     && <div className="ip-sub">Tap <b>Share</b> → <b>Add to Home Screen</b></div>}
      </div>
      <div className="ip-actions">
        {showAndroid && (
          <button className="ip-btn" onClick={handleInstall}>Install</button>
        )}
        <button className="ip-close" onClick={dismiss}>✕</button>
      </div>
    </div>
  )
}
