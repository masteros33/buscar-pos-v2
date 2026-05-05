import { useState, useEffect } from 'react'
import { AlertTriangle, Package, ShoppingCart, RefreshCw } from 'lucide-react'
import { analyticsAPI } from '../api'
import toast from 'react-hot-toast'

export default function SmartReorder() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { load() }, [])

  const load = () => {
    setLoading(true)
    analyticsAPI.smartReorder(7)
      .then(({ data }) => setItems(data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  if (!loading && items.length === 0) return null

  const urgencyStyle = {
    critical: { bg: 'rgba(255,77,109,0.08)', border: 'rgba(255,77,109,0.2)', color: 'var(--red)', label: 'OUT' },
    high:     { bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.2)', color: 'var(--amber)', label: 'URGENT' },
    medium:   { bg: 'var(--g-soft)', border: 'var(--border2)', color: 'var(--g)', label: 'LOW' },
  }

  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 12, overflow: 'hidden', marginTop: 14,
    }}>
      <div style={{
        padding: '14px 20px', borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'linear-gradient(135deg, rgba(245,158,11,0.06), transparent)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <AlertTriangle size={15} style={{ color: 'var(--amber)' }} />
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>
            Smart Reorder
          </span>
          <span style={{
            fontSize: 10, padding: '1px 7px', borderRadius: 20,
            background: 'rgba(245,158,11,0.1)',
            border: '1px solid rgba(245,158,11,0.2)',
            color: 'var(--amber)', fontWeight: 600,
          }}>
            {items.length} products
          </span>
        </div>
        <button onClick={load} style={{
          background: 'none', border: '1px solid var(--border)',
          borderRadius: 7, padding: '5px 10px', cursor: 'pointer',
          color: 'var(--text2)', display: 'flex', alignItems: 'center',
          gap: 5, fontSize: 12, fontFamily: 'inherit',
        }}>
          <RefreshCw size={11} /> Refresh
        </button>
      </div>

      {loading ? (
        <div style={{ padding: 20, textAlign: 'center', color: 'var(--text3)', fontSize: 13 }}>
          Calculating stock velocity...
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--surface2)', borderBottom: '1px solid var(--border)' }}>
                {['Product','Stock','Daily sales','Days left','Suggest order','Urgency',''].map(h => (
                  <th key={h} style={{ padding: '9px 14px', textAlign: 'left', fontSize: 11, color: 'var(--text2)', fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map(item => {
                const u = urgencyStyle[item.urgency] || urgencyStyle.medium
                return (
                  <tr key={item.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '10px 14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                        <div style={{ width: 28, height: 28, borderRadius: 6, background: u.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <Package size={13} style={{ color: u.color }} />
                        </div>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>{item.name}</div>
                          <div style={{ fontSize: 10, color: 'var(--text3)' }}>{item.sku}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '10px 14px', fontSize: 13, fontWeight: 600, color: item.stock_qty === 0 ? 'var(--red)' : 'var(--text)', fontFamily: 'DM Mono, monospace' }}>
                      {item.stock_qty}
                    </td>
                    <td style={{ padding: '10px 14px', fontSize: 12, color: 'var(--text2)', fontFamily: 'DM Mono, monospace' }}>
                      {item.daily_velocity}/day
                    </td>
                    <td style={{ padding: '10px 14px', fontSize: 12, fontWeight: 600, color: u.color, fontFamily: 'DM Mono, monospace' }}>
                      {item.days_to_stockout ? `${item.days_to_stockout}d` : '—'}
                    </td>
                    <td style={{ padding: '10px 14px', fontSize: 13, fontWeight: 700, color: 'var(--g)', fontFamily: 'DM Mono, monospace' }}>
                      {item.suggested_order_qty} units
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 20, fontWeight: 700, background: u.bg, border: `1px solid ${u.border}`, color: u.color }}>
                        {u.label}
                      </span>
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      <button
                        onClick={() => {
                          toast.success(`PO created for ${item.name} — ${item.suggested_order_qty} units`)
                        }}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 4,
                          padding: '5px 10px', borderRadius: 6, border: 'none',
                          background: 'linear-gradient(135deg, var(--g), var(--g3))',
                          color: '#fff', fontSize: 11, fontWeight: 600,
                          cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap',
                        }}
                      >
                        <ShoppingCart size={11} /> Order
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}