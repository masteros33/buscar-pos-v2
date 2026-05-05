import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { User, Lock, Eye, EyeOff, Zap } from 'lucide-react'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ username: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)
  const [focused, setFocused] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const user = await login(form)
      toast.success(`Welcome back, ${user.first_name || user.username}!`)
      navigate('/pos')
    } catch {
      toast.error('Invalid username or password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      fontFamily: "'DM Sans', sans-serif",
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Glow top */}
      <div style={{
        position: 'absolute', width: '500px', height: '500px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, var(--g-glow) 0%, transparent 70%)',
        top: '-150px', left: '50%', transform: 'translateX(-50%)',
        pointerEvents: 'none',
      }} />

      <div style={{ width: '100%', maxWidth: '420px', position: 'relative', zIndex: 1 }}>

        {/* Card */}
        <div style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: '20px',
          overflow: 'hidden',
          boxShadow: 'var(--shadow-lg)',
          position: 'relative',
        }}>
          {/* Top accent line */}
          <div style={{
            position: 'absolute', top: 0, left: '20%', right: '20%',
            height: '1px',
            background: 'linear-gradient(90deg, transparent, var(--g2), transparent)',
          }} />

          {/* Header */}
          <div style={{
            padding: '40px 36px 28px',
            textAlign: 'center',
            background: 'linear-gradient(180deg, var(--g-soft), transparent)',
            borderBottom: '1px solid var(--border)',
          }}>
            <div style={{
              width: '60px', height: '60px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, var(--g), var(--g3))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 16px',
              fontSize: '26px', fontWeight: '800', color: '#fff',
              boxShadow: 'var(--shadow-glow)',
            }}>B</div>
            <div style={{
              fontSize: '24px', fontWeight: '700',
              color: 'var(--text)', letterSpacing: '-0.5px', marginBottom: '6px',
            }}>
              BUSCAR POS
            </div>
            <div style={{ fontSize: '13px', color: 'var(--text2)' }}>
              Point of Sale · Built for Ghana
            </div>
          </div>

          {/* Form */}
          <div style={{ padding: '30px 36px 36px' }}>
            <div style={{
              fontSize: '15px', fontWeight: '600',
              color: 'var(--text)', marginBottom: '24px',
            }}>
              Sign in to your account
            </div>

            <form onSubmit={handleSubmit}>

              {/* Username */}
              <div style={{ marginBottom: '18px' }}>
                <label style={{
                  display: 'block', fontSize: '11px', fontWeight: '600',
                  color: 'var(--text2)', marginBottom: '7px',
                  letterSpacing: '0.06em', textTransform: 'uppercase',
                }}>Username</label>
                <div style={{ position: 'relative' }}>
                  <User size={14} style={{
                    position: 'absolute', left: '12px', top: '50%',
                    transform: 'translateY(-50%)',
                    color: focused === 'u' ? 'var(--g)' : 'var(--text3)',
                    pointerEvents: 'none', transition: 'color 0.2s',
                  }} />
                  <input
                    type="text"
                    value={form.username}
                    onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                    onFocus={() => setFocused('u')}
                    onBlur={() => setFocused(null)}
                    placeholder="Enter username"
                    required
                    autoComplete="username"
                    style={{
                      width: '100%',
                      padding: '12px 14px 12px 38px',
                      background: focused === 'u' ? 'var(--g-soft)' : 'var(--surface2)',
                      border: `1.5px solid ${focused === 'u' ? 'var(--g2)' : 'var(--border)'}`,
                      borderRadius: '10px',
                      color: 'var(--text)',
                      fontSize: '14px',
                      fontFamily: 'inherit',
                      outline: 'none',
                      transition: 'all 0.2s',
                      boxShadow: focused === 'u' ? '0 0 0 3px var(--g-glow)' : 'none',
                    }}
                  />
                </div>
              </div>

              {/* Password */}
              <div style={{ marginBottom: '28px' }}>
                <label style={{
                  display: 'block', fontSize: '11px', fontWeight: '600',
                  color: 'var(--text2)', marginBottom: '7px',
                  letterSpacing: '0.06em', textTransform: 'uppercase',
                }}>Password</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={14} style={{
                    position: 'absolute', left: '12px', top: '50%',
                    transform: 'translateY(-50%)',
                    color: focused === 'p' ? 'var(--g)' : 'var(--text3)',
                    pointerEvents: 'none', transition: 'color 0.2s',
                  }} />
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={form.password}
                    onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                    onFocus={() => setFocused('p')}
                    onBlur={() => setFocused(null)}
                    placeholder="Enter password"
                    required
                    autoComplete="current-password"
                    style={{
                      width: '100%',
                      padding: '12px 40px 12px 38px',
                      background: focused === 'p' ? 'var(--g-soft)' : 'var(--surface2)',
                      border: `1.5px solid ${focused === 'p' ? 'var(--g2)' : 'var(--border)'}`,
                      borderRadius: '10px',
                      color: 'var(--text)',
                      fontSize: '14px',
                      fontFamily: 'inherit',
                      outline: 'none',
                      transition: 'all 0.2s',
                      boxShadow: focused === 'p' ? '0 0 0 3px var(--g-glow)' : 'none',
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(s => !s)}
                    style={{
                      position: 'absolute', right: '12px', top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none', border: 'none',
                      cursor: 'pointer', color: 'var(--text3)',
                      display: 'flex', alignItems: 'center', padding: 0,
                    }}
                  >
                    {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {/* Button */}
              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%', padding: '13px',
                  borderRadius: '10px', border: 'none',
                  background: 'linear-gradient(135deg, var(--g), var(--g3))',
                  color: '#fff', fontWeight: '700', fontSize: '15px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontFamily: 'inherit',
                  boxShadow: loading ? 'none' : 'var(--shadow-glow)',
                  opacity: loading ? 0.8 : 1,
                  display: 'flex', alignItems: 'center',
                  justifyContent: 'center', gap: '8px',
                  transition: 'all 0.2s',
                }}
              >
                {loading ? 'Signing in...' : <><Zap size={16} />Sign in</>}
              </button>
            </form>

            {/* Demo hint */}
            {import.meta.env.DEV && (
              <div style={{
                marginTop: '20px', padding: '11px 14px',
                background: 'var(--g-soft)',
                border: '1px solid var(--border2)',
                borderRadius: '8px', fontSize: '12px',
                color: 'var(--g)', textAlign: 'center',
              }}>
                Demo: <strong>demo</strong> / <strong>demo123</strong>
              </div>
            )}

            <div style={{
              display: 'flex', alignItems: 'center',
              justifyContent: 'center', gap: '6px',
              marginTop: '18px', fontSize: '11px', color: 'var(--text3)',
            }}>
              <div style={{
                width: '5px', height: '5px', borderRadius: '50%',
                background: 'var(--g)', boxShadow: '0 0 6px var(--g)',
              }} />
              JWT secured · AXES brute-force protection
            </div>
          </div>
        </div>

        <div style={{
          textAlign: 'center', marginTop: '20px',
          fontSize: '12px', color: 'var(--text3)',
        }}>
          BUSCAR POS · v2.0 · Ghana
        </div>
      </div>
    </div>
  )
}