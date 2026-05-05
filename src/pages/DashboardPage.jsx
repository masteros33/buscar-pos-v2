import { useState, useEffect } from 'react'
import { TrendingUp, ShoppingBag, Users, DollarSign, Package, AlertTriangle } from 'lucide-react'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { analyticsAPI } from '../api'
import AIInsights from '../components/AIInsights'
import SmartReorder from '../components/SmartReorder'

const TooltipStyle = {
  background: 'var(--surface)', border: '1px solid var(--border)',
  borderRadius: 8, fontSize: 12, color: 'var(--text)',
  fontFamily: 'DM Sans, sans-serif',
}

export default function DashboardPage() {
  const [period, setPeriod] = useState('7d')
  const [kpis, setKpis] = useState(null)
  const [trend, setTrend] = useState([])
  const [revCost, setRevCost] = useState([])
  const [topProducts, setTopProducts] = useState([])
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetch = (p) => {
    setLoading(true)
    Promise.all([
      analyticsAPI.kpis(p),
      analyticsAPI.salesTrend(p),
      analyticsAPI.revenueCost(),
      analyticsAPI.topProducts(7),
      analyticsAPI.summary(),
    ]).then(([k, t, rc, tp, s]) => {
      setKpis(k.data)
      setTrend(t.data)
      setRevCost(rc.data)
      setTopProducts(tp.data)
      setSummary(s.data)
    }).catch(() => {}).finally(() => setLoading(false))
  }

  useEffect(() => { fetch(period) }, [period])
  useEffect(() => {
    const iv = setInterval(() => fetch(period), 60000)
    return () => clearInterval(iv)
  }, [period])

  const G = 'var(--g)', PINK = '#D4537E', MUTED = 'var(--text3)'

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.4px' }}>Dashboard</div>
          <div style={{ fontSize: 13, color: 'var(--text2)', marginTop: 2 }}>Business overview · refreshes every 60s</div>
        </div>
        <div style={{ display: 'flex', gap: 5 }}>
          {['7d','30d','90d'].map(p => (
            <button key={p} onClick={() => setPeriod(p)} style={{
              padding: '6px 14px', borderRadius: 20, border: `1px solid ${period===p ? 'var(--g)' : 'var(--border)'}`,
              background: period===p ? 'var(--g-soft)' : 'var(--surface)',
              color: period===p ? 'var(--g)' : 'var(--text2)',
              fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit',
            }}>{p === '7d' ? '7 days' : p === '30d' ? '30 days' : '90 days'}</button>
          ))}
        </div>
      </div>

      {/* Summary strip */}
      {summary && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px,1fr))', gap: 10, marginBottom: 16 }}>
          {[
            { label: 'Products', value: summary.total_products, icon: Package, color: '#7F77DD' },
            { label: 'Low stock', value: summary.low_stock, icon: AlertTriangle, color: 'var(--amber)' },
            { label: 'Customers', value: summary.total_customers, icon: Users, color: 'var(--g)' },
            { label: 'Total sales', value: summary.total_sales, icon: ShoppingBag, color: 'var(--blue)' },
          ].map((s, i) => (
            <div key={i} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 34, height: 34, borderRadius: 8, background: `${s.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <s.icon size={15} style={{ color: s.color }} />
              </div>
              <div>
                <div style={{ fontSize: 10, color: 'var(--text3)' }}>{s.label}</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', fontFamily: 'DM Mono, monospace' }}>{Number(s.value).toLocaleString()}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* KPI cards */}
      {kpis && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px,1fr))', gap: 10, marginBottom: 16 }}>
          {[
            { label: 'Revenue', value: `GHS ${Number(kpis.revenue).toLocaleString()}`, delta: `+${kpis.revenue_delta}%`, icon: DollarSign },
            { label: 'Sales', value: `${Number(kpis.sales).toLocaleString()} txns`, delta: `+${kpis.sales_delta}%`, icon: ShoppingBag },
            { label: 'Profit', value: `GHS ${Number(kpis.profit).toLocaleString()}`, delta: '', icon: TrendingUp },
            { label: 'Avg order', value: `GHS ${kpis.aov}`, delta: '', icon: Users },
          ].map((k, i) => (
            <div key={i} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '14px 16px', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, transparent, var(--g-soft), transparent)` }} />
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 11, color: 'var(--text2)' }}>{k.label}</span>
                <k.icon size={14} style={{ color: 'var(--g)' }} />
              </div>
              <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)', fontFamily: 'DM Mono, monospace', letterSpacing: '-0.5px' }}>{k.value}</div>
              {k.delta && <div style={{ fontSize: 11, color: 'var(--g)', marginTop: 4 }}>{k.delta} vs prev</div>}
            </div>
          ))}
        </div>
      )}

      {/* Charts */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 20px', marginBottom: 14 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 14 }}>Sales trend</div>
        {trend.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text3)', fontSize: 13 }}>No sales data yet — make your first sale on POS</div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={trend}>
              <CartesianGrid stroke="var(--border)" vertical={false} />
              <XAxis dataKey="label" tick={{ fill: MUTED, fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: MUTED, fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `GHS ${v}`} />
              <Tooltip contentStyle={TooltipStyle} formatter={v => [`GHS ${Number(v).toLocaleString()}`, 'Revenue']} />
              <Line type="monotone" dataKey="revenue" stroke="var(--g)" strokeWidth={2.5} dot={{ fill: 'var(--g)', r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px,1fr))', gap: 14 }}>
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 20px' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 14 }}>Revenue vs cost</div>
          {revCost.length === 0 ? <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--text3)', fontSize: 13 }}>No data yet</div> : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={revCost} barGap={2}>
                <CartesianGrid stroke="var(--border)" vertical={false} />
                <XAxis dataKey="label" tick={{ fill: MUTED, fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: MUTED, fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `${v/1000}k`} />
                <Tooltip contentStyle={TooltipStyle} formatter={v => [`GHS ${Number(v).toLocaleString()}`, '']} />
                <Bar dataKey="revenue" name="Revenue" fill="var(--g)" radius={[4,4,0,0]} />
                <Bar dataKey="cost" name="Cost" fill={PINK} radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 20px' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 14 }}>Top products</div>
          {topProducts.length === 0 ? <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--text3)', fontSize: 13 }}>No sales data yet</div> : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={topProducts} layout="vertical" barSize={12}>
                <CartesianGrid stroke="var(--border)" horizontal={false} />
                <XAxis type="number" tick={{ fill: MUTED, fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fill: MUTED, fontSize: 11 }} axisLine={false} tickLine={false} width={90} />
                <Tooltip contentStyle={TooltipStyle} formatter={v => [`${v} units`, '']} />
                <Bar dataKey="units" fill="#7F77DD" radius={[0,4,4,0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
      <SmartReorder />
      <AIInsights kpis={kpis} topProducts={topProducts} salesData={trend} />
    </div>
  )
}