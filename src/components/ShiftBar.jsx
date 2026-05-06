import { useState, useEffect } from 'react'
import { Clock, Play, Square, AlertTriangle, X, Check } from 'lucide-react'
import { shiftsAPI } from '../api'
import toast from 'react-hot-toast'

export default function ShiftBar() {
  const [shift, setShift] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showOpen, setShowOpen] = useState(false)
  const [showClose, setShowClose] = useState(false)
  const [openFloat, setOpenFloat] = useState('')
  const [closeCash, setCloseCash] = useState('')
  const [elapsed, setElapsed] = useState('')

  useEffect(() => {
    loadShift()
  }, [])

  useEffect(() => {
    if (!shift) return
    const iv = setInterval(() => {
      const start = new Date(shift.opened_at)
      const now = new Date()
      const mins = Math.floor((now - start) / 60000)
      const hrs = Math.floor(mins / 60)
      const m = mins % 60
      setElapsed(hrs > 0 ? `${hrs}h ${m}m` : `${m}m`)
    }, 10000)
    return () => clearInterval(iv)
  }, [shift])

  const loadShift = async () => {
    try {
      const { data } = await shiftsAPI.current()
      setShift(data.shift)
    } catch {}
    finally { setLoading(false) }
  }

  const handleOpen = async () => {
    if (!openFloat && openFloat !== '0') return toast.error('Enter opening float')
    try {
      const { data } = await shiftsAPI.open({ opening_float: parseFloat(openFloat) || 0 })
      setShift(data.already_open ? data.shift : data)
      setShowOpen(false)
      setOpenFloat('')
      toast.success('Shift opened')
    } catch { toast.error('Failed to open shift') }
  }

  const handleClose = async () => {
    if (!closeCash && closeCash !== '0') return toast.error('Enter closing cash')
    try {
      const { data } = await shiftsAPI.close({ closing_cash: parseFloat(closeCash) || 0 })
      const disc = parseFloat(data.discrepancy)
      if (disc < 0) toast.error(`Shift closed — GHS ${Math.abs(disc).toFixed(2)} SHORT`)
      else if (disc > 0) toast.success(`Shift closed — GHS ${disc.toFixed(2)} OVER`)
      else toast.success('Shift closed — Cash balanced ✓')
      setShift(null)
      setShowClose(false)
      setCloseCash('')
    } catch { toast.error('Failed to close shift') }
  }

  if (loading) return null

  return (
    <>
      {/* Shift bar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '6px 12px',
        background: shift ? 'var(--g-soft)' : 'rgba(245,158,11,0.06)',
        border: `1px solid ${shift ? 'var(--border2)' : 'rgba(245,158,11,0.2)'}`,
        borderRadius: 8, flexShrink: 0,
      }}>
        <div style={{
          width: 6, height: 6, borderRadius: '50%',
          background: shift ? 'var(--g)' : 'var(--amber)',
          boxShadow: shift ? '0 0 6px var(--g)' : '0 0 6px var(--amber)',
          animation: 'pulseGlow 2s infinite',
        }} />

        {shift ? (
          <>
            <span style={{ fontSize: 12, color: 'var(--g)', fontWeight: 600 }}>
              Shift open
            </span>
            <span style={{ fontSize: 11, color: 'var(--text2)' }}>
              {elapsed} · GHS {shift.total_revenue?.toFixed(2) || '0.00'} · {shift.total_sales || 0} sales
            </span>
            <button
              onClick={() => setShowClose(true)}
              style={{
                display: 'flex', alignItems: 'center', gap: 4,
                padding: '3px 10px', borderRadius: 6, border: 'none',
                background: 'rgba(255,77,109,0.1)',
                color: 'var(--red)', fontSize: 11, fontWeight: 600,
                cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              <Square size={10} /> Close shift
            </button>
          </>
        ) : (
          <>
            <span style={{ fontSize: 12, color: 'var(--amber)', fontWeight: 600 }}>
              No shift open
            </span>
            <button
              onClick={() => setShowOpen(true)}
              style={{
                display: 'flex', alignItems: 'center', gap: 4,
                padding: '3px 10px', borderRadius: 6, border: 'none',
                background: 'linear-gradient(135deg, var(--g), var(--g3))',
                color: '#fff', fontSize: 11, fontWeight: 600,
                cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              <Play size={10} /> Open shift
            </button>
          </>
        )}
      </div>

      {/* Open shift modal */}
      {showOpen && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 300,
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
        }}>
          <div style={{
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 16, padding: '28px 32px', width: '100%', maxWidth: 360,
            boxShadow: 'var(--shadow-lg)', fontFamily: 'DM Sans, sans-serif',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>Open shift</div>
                <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>Enter the cash float in the till</div>
              </div>
              <button onClick={() => setShowOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text2)', display: 'flex' }}>
                <X size={16} />
              </button>
            </div>

            <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text2)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Opening float (GHS)
            </label>
            <input
              type="number"
              value={openFloat}
              onChange={e => setOpenFloat(e.target.value)}
              placeholder="e.g. 50.00"
              autoFocus
              style={{
                width: '100%', padding: '12px 14px', marginBottom: 20,
                background: 'var(--surface2)', border: '1.5px solid var(--border)',
                borderRadius: 9, color: 'var(--text)', fontSize: 15,
                fontFamily: 'DM Mono, monospace', outline: 'none',
              }}
              onFocus={e => e.target.style.borderColor = 'var(--g2)'}
              onBlur={e => e.target.style.borderColor = 'var(--border)'}
            />

            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setShowOpen(false)} style={{
                flex: 1, padding: '11px', borderRadius: 9,
                border: '1px solid var(--border)', background: 'none',
                color: 'var(--text2)', fontSize: 13, fontWeight: 600,
                cursor: 'pointer', fontFamily: 'inherit',
              }}>Cancel</button>
              <button onClick={handleOpen} style={{
                flex: 2, padding: '11px', borderRadius: 9, border: 'none',
                background: 'linear-gradient(135deg, var(--g), var(--g3))',
                color: '#fff', fontSize: 13, fontWeight: 700,
                cursor: 'pointer', fontFamily: 'inherit', boxShadow: 'var(--shadow-glow)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              }}>
                <Play size={14} /> Open shift
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Close shift modal */}
      {showClose && shift && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 300,
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
        }}>
          <div style={{
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 16, padding: '28px 32px', width: '100%', maxWidth: 380,
            boxShadow: 'var(--shadow-lg)', fontFamily: 'DM Sans, sans-serif',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>Close shift</div>
                <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>Count the cash in your till</div>
              </div>
              <button onClick={() => setShowClose(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text2)', display: 'flex' }}>
                <X size={16} />
              </button>
            </div>

            {/* Shift summary */}
            <div style={{
              background: 'var(--surface2)', border: '1px solid var(--border)',
              borderRadius: 9, padding: '12px 14px', marginBottom: 16,
            }}>
              {[
                ['Duration', elapsed],
                ['Total sales', shift.total_sales || 0],
                ['Total revenue', `GHS ${parseFloat(shift.total_revenue || 0).toFixed(2)}`],
                ['Cash sales', `GHS ${parseFloat(shift.cash_revenue || 0).toFixed(2)}`],
                ['MoMo sales', `GHS ${parseFloat(shift.momo_revenue || 0).toFixed(2)}`],
                ['Opening float', `GHS ${parseFloat(shift.opening_float).toFixed(2)}`],
                ['Expected cash', `GHS ${(parseFloat(shift.opening_float) + parseFloat(shift.cash_revenue || 0)).toFixed(2)}`],
              ].map(([l, v]) => (
                <div key={l} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                  <span style={{ color: 'var(--text2)' }}>{l}</span>
                  <span style={{ fontWeight: 500, color: 'var(--text)', fontFamily: 'DM Mono, monospace' }}>{v}</span>
                </div>
              ))}
            </div>

            <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text2)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Actual cash in till (GHS)
            </label>
            <input
              type="number"
              value={closeCash}
              onChange={e => setCloseCash(e.target.value)}
              placeholder="Count and enter cash amount"
              autoFocus
              style={{
                width: '100%', padding: '12px 14px', marginBottom: 20,
                background: 'var(--surface2)', border: '1.5px solid var(--border)',
                borderRadius: 9, color: 'var(--text)', fontSize: 15,
                fontFamily: 'DM Mono, monospace', outline: 'none',
              }}
              onFocus={e => e.target.style.borderColor = 'var(--g2)'}
              onBlur={e => e.target.style.borderColor = 'var(--border)'}
            />

            {closeCash !== '' && (
              <div style={{
                padding: '10px 14px', borderRadius: 8, marginBottom: 16,
                background: (() => {
                  const exp = parseFloat(shift.opening_float) + parseFloat(shift.cash_revenue || 0)
                  const disc = parseFloat(closeCash) - exp
                  return disc < 0 ? 'rgba(255,77,109,0.08)' : disc > 0 ? 'rgba(245,158,11,0.08)' : 'var(--g-soft)'
                })(),
                border: (() => {
                  const exp = parseFloat(shift.opening_float) + parseFloat(shift.cash_revenue || 0)
                  const disc = parseFloat(closeCash) - exp
                  return disc < 0 ? '1px solid rgba(255,77,109,0.2)' : disc > 0 ? '1px solid rgba(245,158,11,0.2)' : '1px solid var(--border2)'
                })(),
              }}>
                {(() => {
                  const exp = parseFloat(shift.opening_float) + parseFloat(shift.cash_revenue || 0)
                  const disc = parseFloat(closeCash || 0) - exp
                  const color = disc < 0 ? 'var(--red)' : disc > 0 ? 'var(--amber)' : 'var(--g)'
                  const label = disc < 0 ? `SHORT GHS ${Math.abs(disc).toFixed(2)}` : disc > 0 ? `OVER GHS ${disc.toFixed(2)}` : 'BALANCED ✓'
                  return (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 700 }}>
                      <span style={{ color: 'var(--text)' }}>Discrepancy</span>
                      <span style={{ color, fontFamily: 'DM Mono, monospace' }}>{label}</span>
                    </div>
                  )
                })()}
              </div>
            )}

            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setShowClose(false)} style={{
                flex: 1, padding: '11px', borderRadius: 9,
                border: '1px solid var(--border)', background: 'none',
                color: 'var(--text2)', fontSize: 13, fontWeight: 600,
                cursor: 'pointer', fontFamily: 'inherit',
              }}>Cancel</button>
              <button onClick={handleClose} style={{
                flex: 2, padding: '11px', borderRadius: 9, border: 'none',
                background: 'linear-gradient(135deg, var(--red), #c0392b)',
                color: '#fff', fontSize: 13, fontWeight: 700,
                cursor: 'pointer', fontFamily: 'inherit',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              }}>
                <Square size={14} /> Close shift
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}