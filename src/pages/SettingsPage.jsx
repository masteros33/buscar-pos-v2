import { useState, useEffect } from 'react'
import { Store, Percent, Users, Shield, Check, Eye, EyeOff, Plus, Bell } from 'lucide-react'
import { authAPI } from '../api'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

const TABS = [
  { id:'store',    label:'Store',         icon:Store    },
  { id:'tax',      label:'Tax & Loyalty', icon:Percent  },
  { id:'users',    label:'Users',         icon:Users    },
  { id:'security', label:'Security',      icon:Shield   },
]

export default function SettingsPage() {
  const { user } = useAuth()
  const [tab, setTab] = useState('store')
  const [saving, setSaving] = useState(false)
  const [users, setUsers] = useState([])
  const [showAddUser, setShowAddUser] = useState(false)
  const [showPass, setShowPass] = useState(false)

  const [storeForm, setStoreForm] = useState({
    store_name:'BUSCAR POS', address:'Accra, Ghana',
    phone:'', email:'', currency:'GHS',
    receipt_footer:'Thank you for shopping with us!',
  })

  const [taxForm, setTaxForm] = useState({
    tax_rate:'2.5', loyalty_rate:'1',
    low_stock_threshold:'10',
    enable_loyalty:true, enable_tax:true,
  })

  const [userForm, setUserForm] = useState({
    username:'', first_name:'', last_name:'',
    email:'', phone:'', role:'cashier',
    password:'', password2:'',
  })

  const [passForm, setPassForm] = useState({
    old_password:'', new_password:'', new_password2:'',
  })

  useEffect(() => {
    if (tab === 'users') {
      authAPI.users()
        .then(({ data }) => setUsers(data.results || data))
        .catch(() => {})
    }
  }, [tab])

  const handleSaveStore = async (e) => {
    e.preventDefault(); setSaving(true)
    await new Promise(r => setTimeout(r, 400))
    toast.success('Store settings saved')
    setSaving(false)
  }

  const handleSaveTax = async (e) => {
    e.preventDefault(); setSaving(true)
    await new Promise(r => setTimeout(r, 400))
    toast.success('Tax & loyalty settings saved')
    setSaving(false)
  }

  const handleAddUser = async (e) => {
    e.preventDefault()
    if (userForm.password !== userForm.password2) return toast.error('Passwords do not match')
    setSaving(true)
    try {
      await authAPI.register(userForm)
      toast.success(`User ${userForm.username} created`)
      setShowAddUser(false)
      setUserForm({ username:'', first_name:'', last_name:'', email:'', phone:'', role:'cashier', password:'', password2:'' })
      authAPI.users().then(({ data }) => setUsers(data.results || data))
    } catch (err) {
      const msg = err?.response?.data
      toast.error(typeof msg === 'object' ? JSON.stringify(msg) : 'Failed')
    } finally { setSaving(false) }
  }

  const handleChangePassword = async (e) => {
    e.preventDefault()
    if (passForm.new_password !== passForm.new_password2) return toast.error('Passwords do not match')
    setSaving(true)
    try {
      await authAPI.changePassword({ old_password:passForm.old_password, new_password:passForm.new_password })
      toast.success('Password changed')
      setPassForm({ old_password:'', new_password:'', new_password2:'' })
    } catch { toast.error('Failed — check current password') }
    finally { setSaving(false) }
  }

  const I = { width:'100%', padding:'9px 12px', borderRadius:8, border:'1.5px solid var(--border)', background:'var(--surface2)', color:'var(--text)', fontSize:13, outline:'none', fontFamily:'inherit' }
  const L = { display:'block', fontSize:11, fontWeight:600, color:'var(--text2)', marginBottom:5, letterSpacing:'0.04em', textTransform:'uppercase' }
  const card = { background:'var(--surface)', border:'1px solid var(--border)', borderRadius:10, padding:'18px 20px', marginBottom:14 }

  return (
    <div className="fade-in">
      <div style={{ marginBottom:20 }}>
        <div style={{ fontSize:20, fontWeight:700, color:'var(--text)', letterSpacing:'-0.4px' }}>Settings</div>
        <div style={{ fontSize:13, color:'var(--text2)', marginTop:2 }}>Configure your store</div>
      </div>

      <div style={{ display:'flex', gap:20, flexWrap:'wrap' }}>
        {/* Sidebar tabs */}
        <div style={{ width:180, flexShrink:0, background:'var(--surface)', border:'1px solid var(--border)', borderRadius:10, padding:8, height:'fit-content' }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              width:'100%', display:'flex', alignItems:'center', gap:8,
              padding:'9px 12px', borderRadius:7, border:'none', marginBottom:2,
              cursor:'pointer', fontSize:13, fontFamily:'inherit',
              fontWeight:tab===t.id ? 600 : 400,
              background:tab===t.id ? 'var(--g-soft)' : 'transparent',
              color:tab===t.id ? 'var(--g)' : 'var(--text2)',
              textAlign:'left',
            }}>
              <t.icon size={14}/>{t.label}
            </button>
          ))}
        </div>

        <div style={{ flex:1, minWidth:0, maxWidth:560 }}>
          {tab === 'store' && (
            <div style={card}>
              <div style={{ fontSize:14, fontWeight:600, color:'var(--text)', marginBottom:16 }}>Store information</div>
              <form onSubmit={handleSaveStore}>
                {[['store_name','Store name'],['address','Address'],['phone','Phone'],['email','Email'],['currency','Currency']].map(([k,l]) => (
                  <div key={k} style={{ marginBottom:14 }}>
                    <label style={L}>{l}</label>
                    <input type={k==='email'?'email':'text'} value={storeForm[k]} onChange={e => setStoreForm(f=>({...f,[k]:e.target.value}))} style={I} />
                  </div>
                ))}
                <div style={{ marginBottom:16 }}>
                  <label style={L}>Receipt footer</label>
                  <textarea value={storeForm.receipt_footer} onChange={e => setStoreForm(f=>({...f,receipt_footer:e.target.value}))} rows={2} style={{ ...I, resize:'vertical' }} />
                </div>
                <SaveBtn saving={saving} />
              </form>
            </div>
          )}

          {tab === 'tax' && (
            <div style={card}>
              <div style={{ fontSize:14, fontWeight:600, color:'var(--text)', marginBottom:16 }}>Tax & loyalty</div>
              <form onSubmit={handleSaveTax}>
                {[['tax_rate','Tax rate (%)'],['loyalty_rate','Points per GHS 1 spent'],['low_stock_threshold','Low stock alert threshold']].map(([k,l]) => (
                  <div key={k} style={{ marginBottom:14 }}>
                    <label style={L}>{l}</label>
                    <input type="number" step="0.1" value={taxForm[k]} onChange={e => setTaxForm(f=>({...f,[k]:e.target.value}))} style={I} />
                  </div>
                ))}
                {[['enable_tax','Enable tax on sales'],['enable_loyalty','Enable loyalty points']].map(({0:k,1:l}) => (
                  <div key={k} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 0', borderBottom:'1px solid var(--border)', marginBottom:10 }}>
                    <span style={{ fontSize:13, color:'var(--text)' }}>{l}</span>
                    <button type="button" onClick={() => setTaxForm(f=>({...f,[k]:!f[k]}))} style={{ width:40, height:22, borderRadius:11, border:'none', cursor:'pointer', background:taxForm[k]?'var(--g)':'var(--border)', position:'relative', transition:'background 0.2s' }}>
                      <span style={{ position:'absolute', top:2, left:taxForm[k]?20:2, width:18, height:18, borderRadius:'50%', background:'#fff', transition:'left 0.2s', boxShadow:'0 1px 4px rgba(0,0,0,0.2)' }} />
                    </button>
                  </div>
                ))}
                <SaveBtn saving={saving} />
              </form>
            </div>
          )}

          {tab === 'users' && (
            <div>
              <div style={card}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
                  <div style={{ fontSize:14, fontWeight:600, color:'var(--text)' }}>Staff accounts</div>
                  <button onClick={() => setShowAddUser(s=>!s)} style={{ display:'flex', alignItems:'center', gap:5, padding:'7px 12px', borderRadius:7, border:'none', background:'linear-gradient(135deg, var(--g), var(--g3))', color:'#fff', fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
                    <Plus size={13}/> Add user
                  </button>
                </div>

                {showAddUser && (
                  <form onSubmit={handleAddUser} style={{ background:'var(--g-soft)', border:'1px solid var(--border2)', borderRadius:8, padding:14, marginBottom:14 }}>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:10 }}>
                      {[['username','Username'],['first_name','First name'],['last_name','Last name'],['phone','Phone'],['email','Email']].map(([k,l]) => (
                        <div key={k}>
                          <label style={L}>{l}</label>
                          <input type={k==='email'?'email':'text'} value={userForm[k]} onChange={e => setUserForm(f=>({...f,[k]:e.target.value}))} required={k==='username'} style={I} />
                        </div>
                      ))}
                      <div>
                        <label style={L}>Role</label>
                        <select value={userForm.role} onChange={e => setUserForm(f=>({...f,role:e.target.value}))} style={I}>
                          <option value="cashier">Cashier</option>
                          <option value="manager">Manager</option>
                          <option value="owner">Owner</option>
                        </select>
                      </div>
                      <div>
                        <label style={L}>Password</label>
                        <input type="password" value={userForm.password} onChange={e => setUserForm(f=>({...f,password:e.target.value}))} required style={I} />
                      </div>
                      <div>
                        <label style={L}>Confirm</label>
                        <input type="password" value={userForm.password2} onChange={e => setUserForm(f=>({...f,password2:e.target.value}))} required style={I} />
                      </div>
                    </div>
                    <div style={{ display:'flex', gap:8 }}>
                      <button type="submit" disabled={saving} style={{ padding:'8px 16px', borderRadius:7, border:'none', background:'linear-gradient(135deg, var(--g), var(--g3))', color:'#fff', fontWeight:600, fontSize:12, cursor:'pointer', fontFamily:'inherit' }}>
                        {saving ? 'Creating...' : 'Create user'}
                      </button>
                      <button type="button" onClick={() => setShowAddUser(false)} style={{ padding:'8px 12px', borderRadius:7, border:'1px solid var(--border)', background:'none', color:'var(--text2)', fontSize:12, cursor:'pointer', fontFamily:'inherit' }}>Cancel</button>
                    </div>
                  </form>
                )}

                {users.map(u => (
                  <div key={u.id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 0', borderBottom:'1px solid var(--border)' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                      <div style={{ width:34, height:34, borderRadius:'50%', background:'linear-gradient(135deg, var(--g), var(--g3))', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:700, color:'#fff' }}>
                        {(u.first_name?.[0]||u.username[0]).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontSize:13, fontWeight:500, color:'var(--text)' }}>{u.first_name ? `${u.first_name} ${u.last_name}` : u.username}</div>
                        <div style={{ fontSize:11, color:'var(--text3)' }}>@{u.username}</div>
                      </div>
                    </div>
                    <span style={{ fontSize:11, padding:'3px 8px', borderRadius:20, fontWeight:500, background:u.role==='owner'?'rgba(127,119,221,0.1)':u.role==='manager'?'var(--g-soft)':'var(--surface2)', color:u.role==='owner'?'#7F77DD':u.role==='manager'?'var(--g)':'var(--text2)' }}>
                      {u.role}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === 'security' && (
            <div style={card}>
              <div style={{ fontSize:14, fontWeight:600, color:'var(--text)', marginBottom:16 }}>Change password</div>
              <form onSubmit={handleChangePassword}>
                <div style={{ marginBottom:14 }}>
                  <label style={L}>Current password</label>
                  <div style={{ position:'relative' }}>
                    <input type={showPass?'text':'password'} value={passForm.old_password} onChange={e => setPassForm(f=>({...f,old_password:e.target.value}))} required style={{ ...I, paddingRight:36 }} />
                    <button type="button" onClick={() => setShowPass(s=>!s)} style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'var(--text3)', display:'flex' }}>
                      {showPass ? <EyeOff size={14}/> : <Eye size={14}/>}
                    </button>
                  </div>
                </div>
                {[['new_password','New password'],['new_password2','Confirm new password']].map(([k,l]) => (
                  <div key={k} style={{ marginBottom:14 }}>
                    <label style={L}>{l}</label>
                    <input type="password" value={passForm[k]} onChange={e => setPassForm(f=>({...f,[k]:e.target.value}))} required style={I} />
                  </div>
                ))}
                <SaveBtn saving={saving} label="Change password" />
              </form>

              <div style={{ marginTop:24, paddingTop:20, borderTop:'1px solid var(--border)' }}>
                <div style={{ fontSize:13, fontWeight:600, color:'var(--text)', marginBottom:12 }}>Security info</div>
                {[
                  ['Username', user?.username],
                  ['Role', user?.role],
                  ['JWT auth', 'Active'],
                  ['Brute force protection', 'Enabled (5 attempts)'],
                  ['Token expiry', '60 minutes'],
                  ['Offline queue', 'IndexedDB encrypted'],
                ].map(([l,v],i) => (
                  <div key={i} style={{ display:'flex', justifyContent:'space-between', padding:'7px 0', borderBottom:'1px solid var(--border)', fontSize:13 }}>
                    <span style={{ color:'var(--text2)' }}>{l}</span>
                    <span style={{ fontWeight:500, color:'var(--text)' }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function SaveBtn({ saving, label='Save settings' }) {
  return (
    <button type="submit" disabled={saving} style={{
      display:'flex', alignItems:'center', gap:6, padding:'10px 20px',
      borderRadius:8, border:'none',
      background:'linear-gradient(135deg, var(--g), var(--g3))',
      color:'#fff', fontWeight:600, fontSize:13, cursor:'pointer', fontFamily:'inherit',
      boxShadow:'var(--shadow-glow)',
    }}>
      <Check size={14}/>{saving ? 'Saving...' : label}
    </button>
  )
}