import { useState, useEffect } from 'react'
import { Search, Plus, AlertTriangle, Package, Edit2, ArrowUpDown, X, Check } from 'lucide-react'
import { productsAPI } from '../api'
import toast from 'react-hot-toast'

const CATS = ['Groceries','Beverages','Canned Foods','Dairy','Snacks','General','Household']
const UNITS = ['piece','kg','g','litre','ml','pack','box','tin','bag','dozen']
const empty = { name:'', category_name:'', price:'', cost:'', stock_qty:'', reorder_level:'10', barcode:'', unit:'piece' }

export default function InventoryPage() {
  const [products, setProducts] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editProduct, setEditProduct] = useState(null)
  const [form, setForm] = useState(empty)
  const [adjustProduct, setAdjustProduct] = useState(null)
  const [adjustQty, setAdjustQty] = useState('')
  const [adjustReason, setAdjustReason] = useState('receive')
  const [filterLow, setFilterLow] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => { load() }, [])

  const load = () => {
    setLoading(true)
    productsAPI.list({})
      .then(({ data }) => setProducts(data.results || data))
      .catch(() => toast.error('Failed to load'))
      .finally(() => setLoading(false))
  }

  const filtered = products.filter(p => {
    const ms = p.name.toLowerCase().includes(search.toLowerCase()) || (p.sku||'').toLowerCase().includes(search.toLowerCase())
    const ml = !filterLow || p.stock_qty <= (p.reorder_level || 10)
    return ms && ml
  })

  const lowCount = products.filter(p => p.stock_qty <= (p.reorder_level || 10)).length

  const handleSave = async (e) => {
    e.preventDefault(); setSaving(true)
    try {
      if (editProduct) {
        const { data } = await productsAPI.update(editProduct.id, form)
        setProducts(prev => prev.map(p => p.id === editProduct.id ? { ...p, ...data } : p))
        toast.success('Product updated')
      } else {
        const { data } = await productsAPI.create(form)
        setProducts(prev => [data, ...prev])
        toast.success('Product added')
      }
      setShowForm(false); setForm(empty); setEditProduct(null)
    } catch { toast.error('Failed to save') } finally { setSaving(false) }
  }

  const handleAdjust = async () => {
    if (!adjustQty || adjustQty === '0') return toast.error('Enter qty')
    try {
      await productsAPI.adjustStock(adjustProduct.id, { reason: adjustReason, qty_change: parseInt(adjustQty), note: '' })
      toast.success('Stock adjusted'); setAdjustProduct(null); setAdjustQty(''); load()
    } catch { toast.error('Failed') }
  }

  const F = { width:'100%', padding:'9px 12px', borderRadius:8, border:'1.5px solid var(--border)', background:'var(--surface2)', color:'var(--text)', fontSize:13, outline:'none', fontFamily:'inherit' }
  const L = { display:'block', fontSize:11, fontWeight:600, color:'var(--text2)', marginBottom:5, letterSpacing:'0.04em', textTransform:'uppercase' }

  return (
    <div className="fade-in">
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20, flexWrap:'wrap', gap:10 }}>
        <div>
          <div style={{ fontSize:20, fontWeight:700, color:'var(--text)', letterSpacing:'-0.4px' }}>Inventory</div>
          <div style={{ fontSize:13, color:'var(--text2)', marginTop:2 }}>{products.length} products · {lowCount} low stock</div>
        </div>
        <button onClick={() => { setEditProduct(null); setForm(empty); setShowForm(s=>!s) }} style={{
          display:'flex', alignItems:'center', gap:6, padding:'9px 16px', borderRadius:9, border:'none',
          background:'linear-gradient(135deg, var(--g), var(--g3))', color:'#fff',
          fontWeight:600, fontSize:13, cursor:'pointer', fontFamily:'inherit', boxShadow:'var(--shadow-glow)',
        }}>
          <Plus size={15} /> Add product
        </button>
      </div>

      {lowCount > 0 && (
        <div onClick={() => setFilterLow(f=>!f)} style={{
          display:'flex', alignItems:'center', gap:8, padding:'10px 14px', marginBottom:14,
          background:'rgba(245,158,11,0.08)', border:'1px solid rgba(245,158,11,0.2)',
          borderRadius:8, cursor:'pointer', fontSize:13, color:'var(--amber)',
        }}>
          <AlertTriangle size={14} />
          {lowCount} product{lowCount>1?'s':''} low on stock —
          <strong style={{ marginLeft:4 }}>{filterLow ? 'Show all' : 'View only'}</strong>
        </div>
      )}

      {showForm && (
        <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:12, padding:20, marginBottom:16 }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
            <div style={{ fontSize:14, fontWeight:600, color:'var(--text)' }}>{editProduct ? 'Edit product' : 'Add product'}</div>
            <button onClick={() => setShowForm(false)} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text2)', display:'flex' }}><X size={16}/></button>
          </div>
          <form onSubmit={handleSave}>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(180px,1fr))', gap:12, marginBottom:14 }}>
              {[['name','Product name','text',true],['barcode','Barcode','text',false],['price','Selling price (GHS)','number',true],['cost','Cost price (GHS)','number',false],['stock_qty','Stock qty','number',true],['reorder_level','Reorder level','number',false]].map(([key,label,type,req]) => (
                <div key={key}>
                  <label style={L}>{label}</label>
                  <input type={type} value={form[key]} onChange={e => setForm(f=>({...f,[key]:e.target.value}))} required={req} step={type==='number'?'0.01':undefined} style={F} />
                </div>
              ))}
              <div>
                <label style={L}>Category</label>
                <select value={form.category_name} onChange={e => setForm(f=>({...f,category_name:e.target.value}))} style={F}>
                  <option value="">Select</option>
                  {CATS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label style={L}>Unit</label>
                <select value={form.unit} onChange={e => setForm(f=>({...f,unit:e.target.value}))} style={F}>
                  {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
            </div>
            <div style={{ display:'flex', gap:8 }}>
              <button type="submit" disabled={saving} style={{ display:'flex', alignItems:'center', gap:6, padding:'9px 20px', borderRadius:8, border:'none', background:'linear-gradient(135deg, var(--g), var(--g3))', color:'#fff', fontWeight:600, fontSize:13, cursor:'pointer', fontFamily:'inherit' }}>
                <Check size={14}/>{saving ? 'Saving...' : editProduct ? 'Update' : 'Add'}
              </button>
              <button type="button" onClick={() => setShowForm(false)} style={{ padding:'9px 16px', borderRadius:8, border:'1px solid var(--border)', background:'none', color:'var(--text2)', fontSize:13, cursor:'pointer', fontFamily:'inherit' }}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {adjustProduct && (
        <div style={{ position:'fixed', inset:0, zIndex:100, background:'rgba(0,0,0,0.5)', backdropFilter:'blur(4px)', display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
          <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:14, padding:24, width:'100%', maxWidth:380, boxShadow:'var(--shadow-lg)' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
              <div style={{ fontSize:14, fontWeight:600, color:'var(--text)' }}>Adjust — {adjustProduct.name}</div>
              <button onClick={() => setAdjustProduct(null)} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text2)', display:'flex' }}><X size={16}/></button>
            </div>
            <div style={{ fontSize:12, color:'var(--text2)', marginBottom:14 }}>Current stock: <strong style={{ color:'var(--g)' }}>{adjustProduct.stock_qty}</strong></div>
            <div style={{ marginBottom:12 }}>
              <label style={L}>Reason</label>
              <select value={adjustReason} onChange={e => setAdjustReason(e.target.value)} style={F}>
                <option value="receive">Stock received</option>
                <option value="damage">Damaged / Expired</option>
                <option value="return">Customer return</option>
                <option value="count">Stock count</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div style={{ marginBottom:16 }}>
              <label style={L}>Qty change (+ add / - remove)</label>
              <input type="number" value={adjustQty} onChange={e => setAdjustQty(e.target.value)} placeholder="e.g. 10 or -5" style={F} />
            </div>
            <div style={{ display:'flex', gap:8 }}>
              <button onClick={handleAdjust} style={{ flex:1, padding:'10px', borderRadius:8, border:'none', background:'linear-gradient(135deg, var(--g), var(--g3))', color:'#fff', fontWeight:600, fontSize:13, cursor:'pointer', fontFamily:'inherit' }}>Apply</button>
              <button onClick={() => setAdjustProduct(null)} style={{ padding:'10px 16px', borderRadius:8, border:'1px solid var(--border)', background:'none', color:'var(--text2)', fontSize:13, cursor:'pointer', fontFamily:'inherit' }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      <div style={{ position:'relative', marginBottom:14 }}>
        <Search size={14} style={{ position:'absolute', left:11, top:'50%', transform:'translateY(-50%)', color:'var(--text3)', pointerEvents:'none' }} />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or SKU..." style={{ ...F, paddingLeft:34 }} />
      </div>

      {loading ? (
        <div style={{ textAlign:'center', padding:40, color:'var(--text3)' }}>Loading...</div>
      ) : (
        <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:10, overflow:'hidden' }}>
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead>
                <tr style={{ background:'var(--surface2)', borderBottom:'1px solid var(--border)' }}>
                  {['Product','Category','Price','Cost','Stock','Margin',''].map(h => (
                    <th key={h} style={{ padding:'10px 14px', textAlign:'left', fontSize:11, color:'var(--text2)', fontWeight:600, whiteSpace:'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => {
                  const margin = p.cost && p.price ? (((parseFloat(p.price)-parseFloat(p.cost))/parseFloat(p.price))*100).toFixed(0) : 0
                  const isLow = p.stock_qty <= (p.reorder_level||10)
                  return (
                    <tr key={p.id} style={{ borderBottom:'1px solid var(--border)' }}>
                      <td style={{ padding:'10px 14px' }}>
                        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                          <div style={{ width:28, height:28, borderRadius:6, background:'var(--g-soft)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                            <Package size={13} style={{ color:'var(--g)' }} />
                          </div>
                          <span style={{ fontSize:13, fontWeight:500, color:'var(--text)' }}>{p.name}</span>
                        </div>
                      </td>
                      <td style={{ padding:'10px 14px' }}>
                        <span style={{ fontSize:11, padding:'3px 8px', borderRadius:20, background:'var(--g-soft)', color:'var(--g)', fontWeight:500 }}>{p.category_name}</span>
                      </td>
                      <td style={{ padding:'10px 14px', fontSize:13, fontWeight:600, color:'var(--g)', fontFamily:'DM Mono, monospace' }}>GHS {parseFloat(p.price).toFixed(2)}</td>
                      <td style={{ padding:'10px 14px', fontSize:13, color:'var(--text2)', fontFamily:'DM Mono, monospace' }}>GHS {parseFloat(p.cost||0).toFixed(2)}</td>
                      <td style={{ padding:'10px 14px' }}>
                        <span style={{ fontSize:12, fontWeight:600, padding:'3px 8px', borderRadius:20, background:isLow?'rgba(255,77,109,0.1)':'rgba(0,196,122,0.1)', color:isLow?'var(--red)':'var(--g)' }}>
                          {p.stock_qty} {p.unit||'pcs'}
                        </span>
                      </td>
                      <td style={{ padding:'10px 14px', fontSize:12, color:'var(--g)', fontWeight:500 }}>{margin}%</td>
                      <td style={{ padding:'10px 14px' }}>
                        <div style={{ display:'flex', gap:5 }}>
                          <button onClick={() => setAdjustProduct(p)} style={iconBtn} title="Adjust stock"><ArrowUpDown size={13}/></button>
                          <button onClick={() => { setEditProduct(p); setForm({ name:p.name, category_name:p.category_name||'', price:p.price, cost:p.cost||'', stock_qty:p.stock_qty, reorder_level:p.reorder_level||10, barcode:p.barcode||'', unit:p.unit||'piece' }); setShowForm(true) }} style={iconBtn} title="Edit"><Edit2 size={13}/></button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            {filtered.length === 0 && <div style={{ textAlign:'center', padding:40, color:'var(--text3)', fontSize:13 }}>No products found</div>}
          </div>
        </div>
      )}
    </div>
  )
}

const iconBtn = {
  background:'none', border:'1px solid var(--border)', borderRadius:6,
  width:28, height:28, display:'flex', alignItems:'center', justifyContent:'center',
  cursor:'pointer', color:'var(--text2)',
}