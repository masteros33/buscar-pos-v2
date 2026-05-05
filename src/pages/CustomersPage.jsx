import { useState, useEffect } from 'react'
import { Search, Plus, Phone, Mail, Star, X, Check, User, TrendingUp } from 'lucide-react'
import { customersAPI } from '../api'
import toast from 'react-hot-toast'

const empty = { name:'', phone:'', email:'', address:'' }

export default function CustomersPage() {
  const [customers, setCustomers] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editCustomer, setEditCustomer] = useState(null)
  const [form, setForm] = useState(empty)
  const [selected, setSelected] = useState(null)
  const [history, setHistory] = useState([])
  const [saving, setSaving] = useState(false)

  useEffect(() => { load() }, [])

  const load = () => {
    setLoading(true)
    customersAPI.list({})
      .then(({ data }) => setCustomers(data.results || data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    if (!search.trim()) { load(); return }
    const t = setTimeout(() => {
      customersAPI.list({ search })
        .then(({ data }) => setCustomers(data.results || data))
        .catch(() => {})
    }, 300)
    return () => clearTimeout(t)
  }, [search])

  const openProfile = (c) => {
    setSelected(c)
    customersAPI.history(c.id)
      .then(({ data }) => setHistory(data.results || data))
      .catch(() => setHistory([]))
  }

  const handleSave = async (e) => {
    e.preventDefault(); setSaving(true)
    try {
      if (editCustomer) {
        const { data } = await customersAPI.update(editCustomer.id, form)
        setCustomers(prev => prev.map(c => c.id === editCustomer.id ? { ...c, ...data } : c))
        toast.success('Customer updated')
      } else {
        const { data } = await customersAPI.create(form)
        setCustomers(prev => [data, ...prev])
        toast.success('Customer added')
      }
      setShowForm(false); setForm(empty); setEditCustomer(null)
    } catch (err) {
      const msg = err?.response?.data
      toast.error(typeof msg === 'object' ? JSON.stringify(msg) : 'Failed')
    } finally { setSaving(false) }
  }

  const totalPoints = customers.reduce((s, c) => s + (c.points_balance || 0), 0)
  const totalCredit = customers.reduce((s, c) => s + parseFloat(c.credit_balance || 0), 0)

  const F = { width:'100%', padding:'9px 12px', borderRadius:8, border:'1.5px solid var(--border)', background:'var(--surface2)', color:'var(--text)', fontSize:13, outline:'none', fontFamily:'inherit' }
  const L = { display:'block', fontSize:11, fontWeight:600, color:'var(--text2)', marginBottom:5, letterSpacing:'0.04em', textTransform:'uppercase' }

  return (
    <div style={{ display:'flex', gap:16 }} className="fade-in">
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16, flexWrap:'wrap', gap:10 }}>
          <div>
            <div style={{ fontSize:20, fontWeight:700, color:'var(--text)', letterSpacing:'-0.4px' }}>Customers</div>
            <div style={{ fontSize:13, color:'var(--text2)', marginTop:2 }}>{customers.length} registered</div>
          </div>
          <button onClick={() => { setEditCustomer(null); setForm(empty); setShowForm(s=>!s) }} style={{
            display:'flex', alignItems:'center', gap:6, padding:'9px 16px', borderRadius:9, border:'none',
            background:'linear-gradient(135deg, var(--g), var(--g3))', color:'#fff',
            fontWeight:600, fontSize:13, cursor:'pointer', fontFamily:'inherit', boxShadow:'var(--shadow-glow)',
          }}>
            <Plus size={15}/> Add customer
          </button>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(140px,1fr))', gap:10, marginBottom:16 }}>
          {[
            { label:'Total customers', value:customers.length, icon:User, color:'var(--g)' },
            { label:'Total points', value:totalPoints.toLocaleString(), icon:Star, color:'var(--amber)' },
            { label:'Credit outstanding', value:`GHS ${totalCredit.toFixed(2)}`, icon:TrendingUp, color:'var(--red)' },
          ].map((s,i) => (
            <div key={i} style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:10, padding:'12px 14px', display:'flex', alignItems:'center', gap:10 }}>
              <div style={{ width:34, height:34, borderRadius:8, background:`${s.color}18`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <s.icon size={15} style={{ color:s.color }} />
              </div>
              <div>
                <div style={{ fontSize:10, color:'var(--text3)' }}>{s.label}</div>
                <div style={{ fontSize:16, fontWeight:700, color:'var(--text)', fontFamily:'DM Mono, monospace' }}>{s.value}</div>
              </div>
            </div>
          ))}
        </div>

        {showForm && (
          <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:12, padding:20, marginBottom:16 }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
              <div style={{ fontSize:14, fontWeight:600, color:'var(--text)' }}>{editCustomer ? 'Edit customer' : 'Add customer'}</div>
              <button onClick={() => setShowForm(false)} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text2)', display:'flex' }}><X size={16}/></button>
            </div>
            <form onSubmit={handleSave}>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(180px,1fr))', gap:12, marginBottom:14 }}>
                {[['name','Full name',true],['phone','Phone (024XXXXXXX)',true],['email','Email',false],['address','Address',false]].map(([key,ph,req]) => (
                  <div key={key}>
                    <label style={L}>{key}</label>
                    <input type={key==='email'?'email':'text'} value={form[key]} onChange={e => setForm(f=>({...f,[key]:e.target.value}))} placeholder={ph} required={req} style={F} />
                  </div>
                ))}
              </div>
              <div style={{ display:'flex', gap:8 }}>
                <button type="submit" disabled={saving} style={{ display:'flex', alignItems:'center', gap:6, padding:'9px 20px', borderRadius:8, border:'none', background:'linear-gradient(135deg, var(--g), var(--g3))', color:'#fff', fontWeight:600, fontSize:13, cursor:'pointer', fontFamily:'inherit' }}>
                  <Check size={14}/>{saving ? 'Saving...' : editCustomer ? 'Update' : 'Add'}
                </button>
                <button type="button" onClick={() => setShowForm(false)} style={{ padding:'9px 16px', borderRadius:8, border:'1px solid var(--border)', background:'none', color:'var(--text2)', fontSize:13, cursor:'pointer', fontFamily:'inherit' }}>Cancel</button>
              </div>
            </form>
          </div>
        )}

        <div style={{ position:'relative', marginBottom:14 }}>
          <Search size={14} style={{ position:'absolute', left:11, top:'50%', transform:'translateY(-50%)', color:'var(--text3)', pointerEvents:'none' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or phone..." style={{ ...F, paddingLeft:34 }} />
        </div>

        {loading ? (
          <div style={{ textAlign:'center', padding:40, color:'var(--text3)' }}>Loading...</div>
        ) : (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(250px,1fr))', gap:12 }}>
            {customers.filter(c => c.name.toLowerCase().includes(search.toLowerCase()) || c.phone.includes(search)).map(c => (
              <div key={c.id} onClick={() => openProfile(c)} style={{
                background:'var(--surface)',
                border:`1px solid ${selected?.id===c.id ? 'var(--g)' : 'var(--border)'}`,
                borderRadius:10, padding:'14px 16px', cursor:'pointer', transition:'all 0.15s',
              }}>
                <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
                  <div style={{ width:38, height:38, borderRadius:'50%', background:'linear-gradient(135deg, var(--g-soft), var(--g-soft))', border:'1px solid var(--border2)', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:13, color:'var(--g)', flexShrink:0 }}>
                    {c.name.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase()}
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:13, fontWeight:600, color:'var(--text)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{c.name}</div>
                    <div style={{ fontSize:11, color:'var(--text3)', marginTop:1 }}>{c.total_purchases||0} purchases</div>
                  </div>
                </div>
                <div style={{ display:'flex', flexDirection:'column', gap:4, marginBottom:10 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:12, color:'var(--text2)' }}><Phone size={11}/>{c.phone}</div>
                  {c.email && <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:12, color:'var(--text2)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}><Mail size={11}/>{c.email}</div>}
                </div>
                <div style={{ display:'flex', gap:8 }}>
                  <div style={{ flex:1, background:'rgba(245,158,11,0.08)', border:'1px solid rgba(245,158,11,0.15)', borderRadius:6, padding:'6px 8px', textAlign:'center' }}>
                    <div style={{ fontSize:9, color:'var(--amber)', marginBottom:1, display:'flex', alignItems:'center', justifyContent:'center', gap:2 }}><Star size={9}/>Points</div>
                    <div style={{ fontSize:14, fontWeight:700, color:'var(--amber)', fontFamily:'DM Mono, monospace' }}>{c.points_balance}</div>
                  </div>
                  <div style={{ flex:1, background:'var(--g-soft)', border:'1px solid var(--border2)', borderRadius:6, padding:'6px 8px', textAlign:'center' }}>
                    <div style={{ fontSize:9, color:'var(--g)', marginBottom:1 }}>Spent</div>
                    <div style={{ fontSize:14, fontWeight:700, color:'var(--g)', fontFamily:'DM Mono, monospace' }}>GHS {parseFloat(c.total_spent||0).toFixed(0)}</div>
                  </div>
                </div>
              </div>
            ))}
            {customers.length === 0 && <div style={{ gridColumn:'1/-1', textAlign:'center', padding:40, color:'var(--text3)', fontSize:13 }}>No customers yet</div>}
          </div>
        )}
      </div>

      {selected && (
        <div style={{ width:280, flexShrink:0, background:'var(--surface)', border:'1px solid var(--border)', borderRadius:12, overflow:'hidden', display:'flex', flexDirection:'column', maxHeight:'calc(100vh - 120px)' }}>
          <div style={{ padding:16, background:'var(--g-soft)', borderBottom:'1px solid var(--border)' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
              <div style={{ fontSize:13, fontWeight:600, color:'var(--g)' }}>Profile</div>
              <button onClick={() => setSelected(null)} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text2)', display:'flex' }}><X size={14}/></button>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <div style={{ width:44, height:44, borderRadius:'50%', background:'linear-gradient(135deg, var(--g), var(--g3))', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:16, color:'#fff', flexShrink:0 }}>
                {selected.name.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase()}
              </div>
              <div>
                <div style={{ fontSize:14, fontWeight:700, color:'var(--text)' }}>{selected.name}</div>
                <div style={{ fontSize:11, color:'var(--text2)', marginTop:1 }}>{selected.phone}</div>
              </div>
            </div>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:1, background:'var(--border)' }}>
            {[['Purchases',selected.total_purchases||0],['Spent',`GHS ${parseFloat(selected.total_spent||0).toFixed(0)}`],['Points',selected.points_balance],['Credit',`GHS ${parseFloat(selected.credit_balance||0).toFixed(2)}`]].map(([l,v],i) => (
              <div key={i} style={{ background:'var(--surface)', padding:'10px 12px' }}>
                <div style={{ fontSize:10, color:'var(--text3)' }}>{l}</div>
                <div style={{ fontSize:15, fontWeight:700, color:'var(--text)', fontFamily:'DM Mono, monospace', marginTop:2 }}>{v}</div>
              </div>
            ))}
          </div>
          <div style={{ padding:'10px 14px', borderBottom:'1px solid var(--border)', fontSize:12, fontWeight:600, color:'var(--text)' }}>Loyalty history</div>
          <div style={{ flex:1, overflowY:'auto' }}>
            {history.length === 0 ? (
              <div style={{ textAlign:'center', padding:20, color:'var(--text3)', fontSize:12 }}>No transactions yet</div>
            ) : history.map(h => (
              <div key={h.id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'8px 14px', borderBottom:'1px solid var(--border)' }}>
                <div>
                  <div style={{ fontSize:12, fontWeight:500, color:h.type==='earn'?'var(--g)':'var(--red)' }}>{h.type==='earn'?'Earned':'Redeemed'}</div>
                  <div style={{ fontSize:10, color:'var(--text3)', marginTop:1 }}>{new Date(h.created_at).toLocaleDateString('en-GB')}</div>
                </div>
                <div style={{ fontSize:13, fontWeight:700, color:h.type==='earn'?'var(--g)':'var(--red)', fontFamily:'DM Mono, monospace' }}>
                  {h.type==='earn'?'+':''}{h.points} pts
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}