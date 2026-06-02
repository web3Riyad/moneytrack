import { useEffect, useState } from 'react'

export default function Toast({ message, type = 'success' }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const t1 = setTimeout(() => setVisible(true),  10)
    const t2 = setTimeout(() => setVisible(false), 2000)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [message])

  return (
    <div className={`toast ${visible ? 'show' : ''} ${type === 'error' ? 'error' : ''}`}
      role="status" aria-live="polite">
      {message}
    </div>
  )
}
