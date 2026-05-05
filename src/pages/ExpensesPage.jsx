import { useState, useEffect } from 'react'
import { Plus, Search, Trash2, X, Check, DollarSign, TrendingDown } from 'lucide-react'
import { expensesAPI } from '../api'
import toast from 'react-hot-toast'

const CATS = [
  { id:'rent',      label:'Rent',      color:'#7F77DD', bg:'rgba(127,119,221,0.08)' },
  { id:'utilities', label:'Utilities', color:'var(--blue)', bg:'rgba(59,130,246,0.08)' },
  { id:'salaries',  label:'Salaries',  color:'var(--g)',    bg:'var(--g-soft)' },
  { id:'supplies',  label:'Supplies',  color:'var(--amber)',bg:'rgba(245,158,11,0.08)' },
  { id:'transport', label:'Transport', color:'#D4537E',    bg:'rgba(212,83,126,0.08)' },
  { id:'marketing', label:'Marketing', color:'#D85A30',    bg:'rgba(216,90,48,0.08)' },
  { id:'equipment', label:'Equipment', color:'var(--text2)',bg:'var(--surface2)' },
  { id:'other',     label:'Other',     color:'var(--text3)',bg:'var(--surface2)' },
]

const getCat = (id) => CATS.find(c => c.id === id) || CATS[7]
const empty = { category:'rent', amount:'', description:'', date: new Date().toISOString().split('T')[0] }

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(empty)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [filterCat, setFilterCat] = useState('all')

  useEffect(() => { load() }, [])

  const load = () => {
    setLoading(true)
    expensesAPI.list({})
      .then(({ data }) => setExpenses(data.results || data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  const handleSave = async (e) => {
    e.preventDefault(); setSaving(true)
    try {
      const { data } = await expensesAPI.create(form)
      setExpenses(prev => [data, ...prev])
      toast.success('Expense added')
      setShowForm(false); setForm(empty)
    } catch { toast.error('Failed to add expense') }
    finally { setSaving(false) }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this expense?')) return
    try {
      await expensesAPI.delete(id)
      setExpenses(prev => prev.filter(e => e.id !== id))
      toast.success('Deleted')
    } catch { toast.error('Failed') }
  }

  const filtered = expenses.filter(e => {
    const ms = (e.description||'').toLowerCase().includes(search.toLowerCase())
    const mc = filterCat === 'all' || e.category === filterCat
    return ms && mc
  })

  const total = filtered.reduce((s, e) => s + parseFloat(e.amount), 0)
  const byCat = CATS.map(c => ({ ...c, total: expenses.filter(e=>e.category===c.id).reduce((s,e)=>s+parseFloat(e.amount),0) })).filter(c=>c.total>0)

  const I = { width:'100%', padding:'9px 12px', borderRadius:8, border:'1.5px solid var(--border)', background:'var(--surface2)', color:'var(--text)', fontSize:13, outline:'none', fontFamily:'inherit' }
  const L = { display:'block', fontSize:11, fontWeight:600, color:'var(--text2)', marginBottom:5, letterSpacing:'0.04em', textTransform:'uppercase' }

  return (
    <div className="fade-in">
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20, flexWrap:'wrap', gap:10 }}>
        <div>
          <div style={{ fontSize:20, fontWeight:700, color:'var(--text)', letterSpacing:'-0.4px' }}>Expenses</div>
          <div style={{ fontSize:13, color:'var(--text2)', marginTop:2 }}>Track all business expenses</div>
        </div>
        <button onClick={() => setShowForm(s=>!s)} style={{
          display:'flex', alignItems:'center', gap:6, padding:'9px 16px', borderRadius:9, border:'none',
          background:'linear-gradient(135deg, var(--g), var(--g3))', color:'#fff',
          fontWeight:600, fontSize:13, cursor:'pointer', fontFamily:'inherit', boxShadow:'var(--shadow-glow)',
        }}>
          <Plus size={15}/> Add expense
        </button>
      </div>

      {/* Summary */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(130px,1fr))', gap:10, marginBottom:20 }}>
        <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:10, padding:'12px 14px', display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ width:36, height:36, borderRadius:8, background:'rgba(255,77,109,0.1)', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <TrendingDown size={16} style={{ color:'var(--red)' }} />
          </div>
          <div>
            <div style={{ fontSize:10, color:'var(--text3)' }}>Total expenses</div>
            <div style={{ fontSize:17, fontWeight:700, color:'var(--red)', fontFamily:'DM Mono, monospace' }}>GHS {total.toFixed(2)}</div>
          </div>
        </div>
        {byCat.slice(0,4).map(c => (
          <div key={c.id} style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:10, padding:'12px 14px' }}>
            <div style={{ fontSize:10, color:'var(--text3)', marginBottom:3 }}>{c.label}</div>
            <div style={{ fontSize:15, fontWeight:700, color:c.color, fontFamily:'DM Mono, monospace' }}>GHS {c.total.toFixed(2)}</div>
          </div>
        ))}
      </div>

      {showForm && (
        <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:12, padding:20, marginBottom:16 }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
            <div style={{ fontSize:14, fontWeight:600, color:'var(--text)' }}>Add expense</div>
            <button onClick={() => setShowForm(false)} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text2)', display:'flex' }}><X size={16}/></button>
          </div>
          <form onSubmit={handleSave}>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(180px,1fr))', gap:12, marginBottom:14 }}>
              <div>
                <label style={L}>Category</label>
                <select value={form.category} onChange={e => setForm(f=>({...f,category:e.target.value}))} style={I}>
                  {CATS.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                </select>
              </div>
              <div>
                <label style={L}>Amount (GHS)</label>
                <input type="number" step="0.01" required value={form.amount} onChange={e => setForm(f=>({...f,amount:e.target.value}))} placeholder="0.00" style={I} />
              </div>
              <div>
                <label style={L}>Date</label>
                <input type="date" required value={form.date} onChange={e => setForm(f=>({...f,date:e.target.value}))} style={I} />
              </div>
              <div style={{ gridColumn:'span 2' }}>
                <label style={L}>Description</label>
                <input type="text" value={form.description} onChange={e => setForm(f=>({...f,description:e.target.value}))} placeholder="What was this for?" style={I} />
              </div>
            </div>
            <div style={{ display:'flex', gap:8 }}>
              <button type="submit" disabled={saving} style={{ display:'flex', alignItems:'center', gap:6, padding:'9px 20px', borderRadius:8, border:'none', background:'linear-gradient(135deg, var(--g), var(--g3))', color:'#fff', fontWeight:600, fontSize:13, cursor:'pointer', fontFamily:'inherit' }}>
                <Check size={14}/>{saving ? 'Saving...' : 'Add expense'}
              </button>
              <button type="button" onClick={() => setShowForm(false)} style={{ padding:'9px 16px', borderRadius:8, border:'1px solid var(--border)', background:'none', color:'var(--text2)', fontSize:13, cursor:'pointer', fontFamily:'inherit' }}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Filters */}
      <div style={{ display:'flex', gap:10, marginBottom:12, flexWrap:'wrap', alignItems:'center' }}>
        <div style={{ position:'relative', flex:1, minWidth:200 }}>
          <Search size={14} style={{ position:'absolute', left:11, top:'50%', transform:'translateY(-50%)', color:'var(--text3)', pointerEvents:'none' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search expenses..." style={{ ...I, paddingLeft:32 }} />
        </div>
      </div>

      <div style={{ display:'flex', gap:5, marginBottom:14, flexWrap:'wrap' }}>
        <button onClick={() => setFilterCat('all')} style={{ padding:'4px 12px', borderRadius:20, border:`1px solid ${filterCat==='all'?'var(--g)':'var(--border)'}`, background:filterCat==='all'?'var(--g)':'var(--surface)', color:filterCat==='all'?'#fff':'var(--text2)', fontSize:11, fontWeight:500, cursor:'pointer', fontFamily:'inherit' }}>All</button>
        {CATS.map(c => (
          <button key={c.id} onClick={() => setFilterCat(c.id)} style={{ padding:'4px 12px', borderRadius:20, border:`1px solid ${filterCat===c.id?c.color:'var(--border)'}`, background:filterCat===c.id?c.bg:'var(--surface)', color:filterCat===c.id?c.color:'var(--text2)', fontSize:11, fontWeight:500, cursor:'pointer', fontFamily:'inherit' }}>{c.label}</button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign:'center', padding:40, color:'var(--text3)' }}>Loading...</div>
      ) : (
        <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:10, overflow:'hidden' }}>
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead>
              <tr style={{ background:'var(--surface2)', borderBottom:'1px solid var(--border)' }}>
                {['Date','Category','Description','Amount',''].map(h => (
                  <th key={h} style={{ padding:'10px 14px', textAlign:'left', fontSize:11, color:'var(--text2)', fontWeight:600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(e => {
                const cat = getCat(e.category)
                return (
                  <tr key={e.id} style={{ borderBottom:'1px solid var(--border)' }}>
                    <td style={{ padding:'10px 14px', fontSize:12, color:'var(--text2)', whiteSpace:'nowrap' }}>{new Date(e.date).toLocaleDateString('en-GB')}</td>
                    <td style={{ padding:'10px 14px' }}>
                      <span style={{ fontSize:11, padding:'3px 8px', borderRadius:20, background:cat.bg, color:cat.color, fontWeight:500 }}>{cat.label}</span>
                    </td>
                    <td style={{ padding:'10px 14px', fontSize:13, color:'var(--text)' }}>{e.description || '—'}</td>
                    <td style={{ padding:'10px 14px', fontSize:13, fontWeight:700, color:'var(--red)', fontFamily:'DM Mono, monospace' }}>GHS {parseFloat(e.amount).toFixed(2)}</td>
                    <td style={{ padding:'10px 14px' }}>
                      <button onClick={() => handleDelete(e.id)} style={{ background:'none', border:'1px solid var(--border)', borderRadius:6, width:28, height:28, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'var(--red)' }}>
                        <Trash2 size={13}/>
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {filtered.length === 0 && <div style={{ textAlign:'center', padding:40, color:'var(--text3)', fontSize:13 }}>No expenses found</div>}
        </div>
      )}
    </div>
  )
}