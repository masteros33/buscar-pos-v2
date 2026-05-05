import { useState } from 'react'
import { Sparkles, Loader, RefreshCw } from 'lucide-react'
import { analyticsAPI } from '../api'

export default function AIInsights({ kpis, topProducts, period }) {
  const [insights, setInsights] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const generateInsights = async () => {
    setLoading(true)
    setError(null)
    try {
      const { data } = await analyticsAPI.mlInsights({ kpis, top_products: topProducts, period })
      setInsights(data)
    } catch {
      setError('Failed to generate insights')
    } finally {
      setLoading(false)
    }
  }

  const typeColors = {
    positive: { bg: 'var(--g-soft)',          border: 'var(--border2)',         color: 'var(--g)',    icon: '📈' },
    warning:  { bg: 'rgba(245,158,11,0.08)',   border: 'rgba(245,158,11,0.2)',   color: 'var(--amber)',icon: '⚠️' },
    tip:      { bg: 'rgba(127,119,221,0.08)',  border: 'rgba(127,119,221,0.2)',  color: '#7F77DD',    icon: '💡' },
  }

  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: 12, overflow: 'hidden', marginTop: 14,
    }}>
      <div style={{
        padding: '14px 20px', borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'linear-gradient(135deg, var(--g-soft), transparent)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Sparkles size={16} style={{ color: 'var(--g)' }} />
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>
            ML Business Insights
          </span>
          <span style={{
            fontSize: 10, padding: '1px 6px', borderRadius: 20,
            background: 'var(--g)', color: '#fff', fontWeight: 600,
          }}>Python ML</span>
        </div>
        <button onClick={generateInsights} disabled={loading} style={{
          display: 'flex', alignItems: 'center', gap: 5,
          padding: '7px 14px', borderRadius: 8, border: 'none',
          background: loading ? 'var(--surface2)' : 'linear-gradient(135deg, var(--g), var(--g3))',
          color: loading ? 'var(--text3)' : '#fff',
          fontSize: 12, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer',
          fontFamily: 'inherit',
        }}>
          {loading
            ? <><Loader size={12} className="spin" /> Analyzing...</>
            : insights
              ? <><RefreshCw size={12} /> Refresh</>
              : <><Sparkles size={12} /> Analyze my business</>
          }
        </button>
      </div>

      <div style={{ padding: 16 }}>
        {!insights && !loading && !error && (
          <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text3)', fontSize: 13 }}>
            Click "Analyze my business" — powered by Python ML on your real data. No external API.
          </div>
        )}
        {error && (
          <div style={{ textAlign: 'center', padding: '16px 0', color: 'var(--red)', fontSize: 13 }}>{error}</div>
        )}
        {loading && (
          <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text2)', fontSize: 13 }}>
            <div style={{
              width: 24, height: 24, borderRadius: '50%',
              border: '2px solid var(--border)', borderTopColor: 'var(--g)',
              animation: 'spin 0.8s linear infinite', margin: '0 auto 10px',
            }} />
            Running ML analysis on your sales data...
          </div>
        )}
        {insights && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px,1fr))', gap: 10 }}>
            {insights.map((ins, i) => {
              const s = typeColors[ins.type] || typeColors.tip
              return (
                <div key={i} style={{ background: s.bg, border: `1px solid ${s.border}`, borderRadius: 10, padding: '12px 14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                    <span style={{ fontSize: 14 }}>{s.icon}</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: s.color }}>{ins.title}</span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text)', lineHeight: 1.5, marginBottom: 8 }}>
                    {ins.insight}
                  </div>
                  <div style={{
                    fontSize: 11, color: s.color, padding: '4px 8px', borderRadius: 6,
                    background: 'rgba(255,255,255,0.4)', border: `1px solid ${s.border}`, lineHeight: 1.4,
                  }}>
                    → {ins.action}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}