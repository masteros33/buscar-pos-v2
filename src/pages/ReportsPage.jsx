import { useState } from 'react'
import {
  FileText, Download, TrendingUp, ShoppingBag,
  Users, Package, DollarSign, Calendar
} from 'lucide-react'
import { salesAPI } from '../api'
import toast from 'react-hot-toast'

const reports = [
  { id:'sales',     label:'Sales report',       desc:'All transactions in date range', icon:ShoppingBag, color:'var(--g)',    bg:'var(--g-soft)'  },
  { id:'inventory', label:'Inventory report',   desc:'Stock levels and valuation',     icon:Package,     color:'#7F77DD',   bg:'rgba(127,119,221,0.08)' },
  { id:'customers', label:'Customer report',    desc:'Activity and loyalty points',    icon:Users,       color:'var(--blue)',bg:'rgba(59,130,246,0.08)' },
  { id:'profit',    label:'Profit & loss',      desc:'Revenue, cost and margin',       icon:TrendingUp,  color:'#D4537E',   bg:'rgba(212,83,126,0.08)' },
  { id:'expenses',  label:'Expenses report',    desc:'All expenses by category',       icon:DollarSign,  color:'var(--amber)',bg:'rgba(245,158,11,0.08)' },
  { id:'cashier',   label:'Cashier performance',desc:'Sales per cashier',              icon:Users,       color:'var(--g3)', bg:'var(--g-soft)'  },
]

export default function ReportsPage() {
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date(); d.setDate(d.getDate()-30)
    return d.toISOString().split('T')[0]
  })
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().split('T')[0])
  const [generating, setGenerating] = useState(null)
  const [salesData, setSalesData] = useState(null)

  const handleGenerate = async (id, format) => {
    setGenerating(`${id}-${format}`)
    try {
      if (id === 'sales') {
        const { data } = await salesAPI.list({ date_from: dateFrom, date_to: dateTo })
        const rows = data.results || data
        setSalesData(rows)
        if (format === 'csv') exportCSV(rows)
        else toast.success(`Loaded ${rows.length} sales records`)
      } else {
        await new Promise(r => setTimeout(r, 600))
        toast.success(`${id} ${format.toUpperCase()} — coming soon`)
      }
    } catch { toast.error('Failed to generate report') }
    finally { setGenerating(null) }
  }

  const exportCSV = (data) => {
    if (!data?.length) return toast.error('No data')
    const headers = ['Receipt','Date','Customer','Cashier','Payment','Items','Total','Status']
    const rows = data.map(s => [
      s.receipt_number,
      new Date(s.created_at).toLocaleDateString('en-GB'),
      s.customer_name || 'Walk-in',
      s.cashier_name,
      s.payment_method,
      s.item_count,
      s.total,
      s.status,
    ])
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type:'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `buscar-sales-${dateFrom}-to-${dateTo}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('CSV downloaded')
  }

  const totalRevenue = salesData?.reduce((s, r) => s + parseFloat(r.total), 0) || 0
  const payBreakdown = salesData?.reduce((acc, s) => {
    acc[s.payment_method] = (acc[s.payment_method] || 0) + parseFloat(s.total)
    return acc
  }, {}) || {}

  const I = { width:'100%', padding:'8px 12px', borderRadius:8, border:'1.5px solid var(--border)', background:'var(--surface2)', color:'var(--text)', fontSize:13, outline:'none', fontFamily:'inherit' }

  return (
    <div className="fade-in">
      <div style={{ marginBottom:20 }}>
        <div style={{ fontSize:20, fontWeight:700, color:'var(--text)', letterSpacing:'-0.4px' }}>Reports</div>
        <div style={{ fontSize:13, color:'var(--text2)', marginTop:2 }}>Generate and export business reports</div>
      </div>

      {/* Date range */}
      <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:10, padding:'14px 16px', marginBottom:20, display:'flex', alignItems:'center', gap:12, flexWrap:'wrap' }}>
        <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:13, color:'var(--text2)' }}>
          <Calendar size={15}/> Date range:
        </div>
        <div>
          <label style={{ display:'block', fontSize:10, color:'var(--text3)', marginBottom:3 }}>FROM</label>
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={{ ...I, width:'auto' }} />
        </div>
        <div>
          <label style={{ display:'block', fontSize:10, color:'var(--text3)', marginBottom:3 }}>TO</label>
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} style={{ ...I, width:'auto' }} />
        </div>
      </div>

      {/* Report cards */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(260px,1fr))', gap:12, marginBottom:20 }}>
        {reports.map(r => (
          <div key={r.id} style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:10, padding:'16px 18px' }}>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12 }}>
              <div style={{ width:40, height:40, borderRadius:10, background:r.bg, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <r.icon size={18} style={{ color:r.color }} />
              </div>
              <div>
                <div style={{ fontSize:13, fontWeight:600, color:'var(--text)' }}>{r.label}</div>
                <div style={{ fontSize:11, color:'var(--text3)', marginTop:1 }}>{r.desc}</div>
              </div>
            </div>
            <div style={{ display:'flex', gap:8 }}>
              <button onClick={() => handleGenerate(r.id,'preview')} disabled={!!generating} style={{
                flex:1, padding:'8px', borderRadius:7, border:'1px solid var(--border)',
                background:'var(--surface2)', color:'var(--text2)', fontSize:12,
                cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:5,
                fontFamily:'inherit', fontWeight:500,
              }}>
                <FileText size={12}/>
                {generating===`${r.id}-preview` ? 'Loading...' : 'Preview'}
              </button>
              <button onClick={() => handleGenerate(r.id,'csv')} disabled={!!generating} style={{
                flex:1, padding:'8px', borderRadius:7, border:'none',
                background:`linear-gradient(135deg, ${r.color}, ${r.color})`,
                color:'#fff', fontSize:12, cursor:'pointer',
                display:'flex', alignItems:'center', justifyContent:'center', gap:5,
                fontFamily:'inherit', fontWeight:600, opacity: generating ? 0.7 : 1,
              }}>
                <Download size={12}/>
                {generating===`${r.id}-csv` ? 'Exporting...' : 'CSV'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Sales preview */}
      {salesData && (
        <div className="fade-in">
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(140px,1fr))', gap:10, marginBottom:16 }}>
            {[
              { label:'Total revenue', value:`GHS ${totalRevenue.toFixed(2)}`, color:'var(--g)' },
              { label:'Transactions',  value:salesData.length,                 color:'var(--blue)' },
              { label:'Avg order',     value:`GHS ${salesData.length ? (totalRevenue/salesData.length).toFixed(2) : 0}`, color:'#7F77DD' },
              ...Object.entries(payBreakdown).map(([m,t]) => ({ label:m.toUpperCase(), value:`GHS ${t.toFixed(2)}`, color:'var(--amber)' })),
            ].map((s,i) => (
              <div key={i} style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:10, padding:'12px 14px' }}>
                <div style={{ fontSize:11, color:'var(--text3)' }}>{s.label}</div>
                <div style={{ fontSize:16, fontWeight:700, color:s.color, fontFamily:'DM Mono, monospace', marginTop:3 }}>{s.value}</div>
              </div>
            ))}
          </div>

          <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:10, overflow:'hidden' }}>
            <div style={{ padding:'12px 16px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <div style={{ fontSize:13, fontWeight:600, color:'var(--text)' }}>Sales · {dateFrom} to {dateTo}</div>
              <button onClick={() => exportCSV(salesData)} style={{
                display:'flex', alignItems:'center', gap:5, padding:'6px 12px', borderRadius:7, border:'none',
                background:'linear-gradient(135deg, var(--g), var(--g3))', color:'#fff',
                fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:'inherit',
              }}>
               <Download size={12}/>Export CSV
              </button>
            </div>
            <div style={{ overflowX:'auto' }}>
              <table style={{ width:'100%', borderCollapse:'collapse' }}>
                <thead>
                  <tr style={{ background:'var(--surface2)', borderBottom:'1px solid var(--border)' }}>
                    {['Receipt','Date','Customer','Cashier','Payment','Items','Total','Status'].map(h => (
                      <th key={h} style={{ padding:'9px 14px', textAlign:'left', fontSize:11, color:'var(--text2)', fontWeight:600, whiteSpace:'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {salesData.map(s => (
                    <tr key={s.id} style={{ borderBottom:'1px solid var(--border)' }}>
                      <td style={{ padding:'9px 14px', fontSize:12, fontWeight:600, color:'var(--g)', fontFamily:'DM Mono, monospace' }}>{s.receipt_number}</td>
                      <td style={{ padding:'9px 14px', fontSize:12, color:'var(--text2)', whiteSpace:'nowrap' }}>{new Date(s.created_at).toLocaleDateString('en-GB')}</td>
                      <td style={{ padding:'9px 14px', fontSize:12, color:'var(--text)' }}>{s.customer_name || 'Walk-in'}</td>
                      <td style={{ padding:'9px 14px', fontSize:12, color:'var(--text2)' }}>{s.cashier_name}</td>
                      <td style={{ padding:'9px 14px' }}>
                        <span style={{ fontSize:11, padding:'2px 8px', borderRadius:20, fontWeight:500, background:s.payment_method==='cash'?'var(--g-soft)':s.payment_method==='momo'?'rgba(245,158,11,0.1)':'rgba(59,130,246,0.1)', color:s.payment_method==='cash'?'var(--g)':s.payment_method==='momo'?'var(--amber)':'var(--blue)' }}>
                          {s.payment_method}
                        </span>
                      </td>
                      <td style={{ padding:'9px 14px', fontSize:12, color:'var(--text2)', textAlign:'center' }}>{s.item_count}</td>
                      <td style={{ padding:'9px 14px', fontSize:13, fontWeight:700, color:'var(--text)', fontFamily:'DM Mono, monospace' }}>GHS {parseFloat(s.total).toFixed(2)}</td>
                      <td style={{ padding:'9px 14px' }}>
                        <span style={{ fontSize:11, padding:'2px 8px', borderRadius:20, fontWeight:500, background:s.status==='completed'?'var(--g-soft)':'rgba(255,77,109,0.1)', color:s.status==='completed'?'var(--g)':'var(--red)' }}>
                          {s.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {salesData.length === 0 && <div style={{ textAlign:'center', padding:40, color:'var(--text3)', fontSize:13 }}>No sales in this date range</div>}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}