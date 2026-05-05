import { useState } from 'react'
import { Sparkles, Loader, RefreshCw } from 'lucide-react'

export default function AIInsights({ salesData, kpis, topProducts }) {
  const [insights, setInsights] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const generateInsights = () => {
    setLoading(true)
    setError(null)

    setTimeout(() => {
      const results = []

      if (kpis) {
        if (kpis.revenue_delta > 10) {
          results.push({
            type: 'positive',
            title: 'Revenue growing',
            insight: `Revenue is up ${kpis.revenue_delta}% vs the previous period — GHS ${kpis.revenue} total.`,
            action: 'Keep current stock levels and staffing to sustain this growth.',
          })
        } else if (kpis.revenue_delta < 0) {
          results.push({
            type: 'warning',
            title: 'Revenue declining',
            insight: `Revenue dropped ${Math.abs(kpis.revenue_delta)}% vs last period.`,
            action: 'Check if any top products are out of stock or if foot traffic has dropped.',
          })
        } else {
          results.push({
            type: 'positive',
            title: 'Steady revenue',
            insight: `Revenue is stable at GHS ${kpis.revenue} this period.`,
            action: 'Focus on increasing average order value to push growth higher.',
          })
        }

        if (kpis.aov < 20) {
          results.push({
            type: 'tip',
            title: 'Low average order value',
            insight: `Average order is GHS ${kpis.aov} — customers are buying single items.`,
            action: 'Try bundle deals: "Buy Rice + Cooking Oil and save GHS 2."',
          })
        } else {
          results.push({
            type: 'positive',
            title: 'Strong basket size',
            insight: `Avg order value is GHS ${kpis.aov} — customers are buying multiple items.`,
            action: `Introduce a loyalty bonus for orders over GHS ${Math.round(kpis.aov * 1.5)}.`,
          })
        }

        const margin = kpis.revenue > 0
          ? ((kpis.profit / kpis.revenue) * 100).toFixed(1)
          : 0
        if (margin < 30) {
          results.push({
            type: 'warning',
            title: 'Margin below target',
            insight: `Gross margin is ${margin}% — below the 30% retail benchmark.`,
            action: 'Review cost prices on your top 5 products and negotiate with suppliers.',
          })
        } else {
          results.push({
            type: 'positive',
            title: 'Healthy profit margin',
            insight: `Gross margin is ${margin}% — above the 30% retail benchmark.`,
            action: 'Consider reinvesting profit into expanding your top product range.',
          })
        }
      }

      if (topProducts?.length > 0) {
        results.push({
          type: 'tip',
          title: `Top seller: ${topProducts[0]?.name}`,
          insight: `${topProducts[0]?.name} sold ${topProducts[0]?.units} units this period — your best performer.`,
          action: `Always keep at least 30 units of ${topProducts[0]?.name} in stock.`,
        })
      }

      if (results.length === 0) {
        results.push({
          type: 'tip',
          title: 'Start making sales',
          insight: 'No sales data yet to analyze.',
          action: 'Process your first sale on the POS to start seeing insights.',
        })
      }

      setInsights(results)
      setLoading(false)
    }, 800)
  }

  const typeColors = {
    positive: { bg: 'var(--g-soft)',               border: 'var(--border2)',              color: 'var(--g)',    icon: '📈' },
    warning:  { bg: 'rgba(245,158,11,0.08)',        border: 'rgba(245,158,11,0.2)',        color: 'var(--amber)',icon: '⚠️' },
    tip:      { bg: 'rgba(127,119,221,0.08)',       border: 'rgba(127,119,221,0.2)',       color: '#7F77DD',    icon: '💡' },
  }

  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 12,
      overflow: 'hidden',
      marginTop: 14,
    }}>
      <div style={{
        padding: '14px 20px',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'linear-gradient(135deg, var(--g-soft), transparent)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Sparkles size={16} style={{ color: 'var(--g)' }} />
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>
            AI Business Insights
          </span>
          <span style={{
            fontSize: 10, padding: '1px 6px', borderRadius: 20,
            background: 'var(--g)', color: '#fff', fontWeight: 600,
          }}>BETA</span>
        </div>
        <button
          onClick={generateInsights}
          disabled={loading}
          style={{
            display: 'flex', alignItems: 'center', gap: 5,
            padding: '7px 14px', borderRadius: 8, border: 'none',
            background: loading ? 'var(--surface2)' : 'linear-gradient(135deg, var(--g), var(--g3))',
            color: loading ? 'var(--text3)' : '#fff',
            fontSize: 12, fontWeight: 600,
            cursor: loading ? 'not-allowed' : 'pointer',
            fontFamily: 'inherit',
          }}
        >
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
          <div style={{
            textAlign: 'center', padding: '24px 0',
            color: 'var(--text3)', fontSize: 13,
          }}>
            Click "Analyze my business" to get insights based on your real sales data
          </div>
        )}

        {error && (
          <div style={{ textAlign: 'center', padding: '16px 0', color: 'var(--red)', fontSize: 13 }}>
            {error}
          </div>
        )}

        {loading && (
          <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text2)', fontSize: 13 }}>
            <div style={{
              width: 24, height: 24, borderRadius: '50%',
              border: '2px solid var(--border)',
              borderTopColor: 'var(--g)',
              animation: 'spin 0.8s linear infinite',
              margin: '0 auto 10px',
            }} />
            Analyzing your sales data...
          </div>
        )}

        {insights && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px,1fr))',
            gap: 10,
          }}>
            {insights.map((ins, i) => {
              const s = typeColors[ins.type] || typeColors.tip
              return (
                <div key={i} style={{
                  background: s.bg,
                  border: `1px solid ${s.border}`,
                  borderRadius: 10, padding: '12px 14px',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                    <span style={{ fontSize: 14 }}>{s.icon}</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: s.color }}>
                      {ins.title}
                    </span>
                  </div>
                  <div style={{
                    fontSize: 12, color: 'var(--text)',
                    lineHeight: 1.5, marginBottom: 8,
                  }}>
                    {ins.insight}
                  </div>
                  <div style={{
                    fontSize: 11, color: s.color,
                    padding: '4px 8px', borderRadius: 6,
                    background: 'rgba(255,255,255,0.4)',
                    border: `1px solid ${s.border}`,
                    lineHeight: 1.4,
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