import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react'
import { useAuth } from './AuthContext'
import toast from 'react-hot-toast'

const SessionContext = createContext(null)

const TIMEOUT_MS = 15 * 60 * 1000  // 15 minutes inactivity
const WARN_MS    = 2  * 60 * 1000  // warn 2 minutes before logout
const EVENTS     = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click']

export function SessionProvider({ children }) {
  const { user, logout } = useAuth()
  const [warning, setWarning] = useState(false)
  const [countdown, setCountdown] = useState(120)
  const timeoutRef  = useRef(null)
  const warnRef     = useRef(null)
  const countRef    = useRef(null)
  const lastActive  = useRef(Date.now())

  const clearAll = useCallback(() => {
    clearTimeout(timeoutRef.current)
    clearTimeout(warnRef.current)
    clearInterval(countRef.current)
  }, [])

  const doLogout = useCallback(() => {
    clearAll()
    setWarning(false)
    toast.error('Session expired — please log in again')
    logout()
  }, [clearAll, logout])

  const resetTimer = useCallback(() => {
    if (!user) return
    lastActive.current = Date.now()
    clearAll()
    setWarning(false)

    // Warn 2 min before timeout
    warnRef.current = setTimeout(() => {
      setWarning(true)
      setCountdown(120)
      countRef.current = setInterval(() => {
        setCountdown(c => {
          if (c <= 1) {
            clearInterval(countRef.current)
            return 0
          }
          return c - 1
        })
      }, 1000)
    }, TIMEOUT_MS - WARN_MS)

    // Auto logout
    timeoutRef.current = setTimeout(doLogout, TIMEOUT_MS)
  }, [user, clearAll, doLogout])

  // Attach activity listeners
  useEffect(() => {
    if (!user) return
    resetTimer()
    const handle = () => resetTimer()
    EVENTS.forEach(e => window.addEventListener(e, handle, { passive: true }))
    return () => {
      clearAll()
      EVENTS.forEach(e => window.removeEventListener(e, handle))
    }
  }, [user, resetTimer, clearAll])

  const stayLoggedIn = () => {
    setWarning(false)
    resetTimer()
    toast.success('Session extended')
  }

  return (
    <SessionContext.Provider value={{ warning, countdown, stayLoggedIn, resetTimer }}>
      {children}

      {/* Warning modal */}
      {warning && user && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 20,
        }}>
          <div style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 16,
            padding: '32px 36px',
            width: '100%', maxWidth: 380,
            boxShadow: 'var(--shadow-lg)',
            textAlign: 'center',
            position: 'relative',
            fontFamily: 'DM Sans, sans-serif',
          }}>
            {/* Top warning line */}
            <div style={{
              position: 'absolute', top: 0, left: '20%', right: '20%',
              height: 2, borderRadius: '0 0 4px 4px',
              background: 'linear-gradient(90deg, transparent, var(--amber), transparent)',
            }} />

            {/* Countdown ring */}
            <div style={{
              width: 72, height: 72, borderRadius: '50%',
              border: `4px solid var(--amber)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 20px',
              background: 'rgba(245,158,11,0.08)',
              boxShadow: '0 0 20px rgba(245,158,11,0.2)',
            }}>
              <span style={{
                fontSize: 22, fontWeight: 700,
                color: 'var(--amber)',
                fontFamily: 'DM Mono, monospace',
              }}>
                {countdown}
              </span>
            </div>

            <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>
              Session expiring soon
            </div>
            <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 24, lineHeight: 1.5 }}>
              You've been inactive for a while. You'll be logged out in{' '}
              <strong style={{ color: 'var(--amber)' }}>{countdown} seconds</strong>.
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={doLogout}
                style={{
                  flex: 1, padding: '11px',
                  borderRadius: 9, border: '1px solid var(--border)',
                  background: 'var(--surface2)',
                  color: 'var(--text2)', fontSize: 13, fontWeight: 600,
                  cursor: 'pointer', fontFamily: 'inherit',
                }}
              >
                Log out now
              </button>
              <button
                onClick={stayLoggedIn}
                style={{
                  flex: 2, padding: '11px',
                  borderRadius: 9, border: 'none',
                  background: 'linear-gradient(135deg, var(--g), var(--g3))',
                  color: '#fff', fontSize: 13, fontWeight: 700,
                  cursor: 'pointer', fontFamily: 'inherit',
                  boxShadow: 'var(--shadow-glow)',
                }}
              >
                Stay logged in
              </button>
            </div>
          </div>
        </div>
      )}
    </SessionContext.Provider>
  )
}

export const useSession = () => useContext(SessionContext)