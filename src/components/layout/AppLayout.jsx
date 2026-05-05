import { useState, useEffect } from 'react'
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom'
import {
  ShoppingCart, Package, Users, BarChart2,
  FileText, Settings, LogOut, Menu, X,
  WifiOff, DollarSign, ChevronRight
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useOffline } from '../../context/OfflineContext'

const navItems = [
  { to: '/pos',       label: 'POS',       icon: ShoppingCart },
  { to: '/inventory', label: 'Inventory', icon: Package,    minRole: 'manager' },
  { to: '/customers', label: 'Customers', icon: Users },
  { to: '/dashboard', label: 'Dashboard', icon: BarChart2,  minRole: 'manager' },
  { to: '/expenses',  label: 'Expenses',  icon: DollarSign, minRole: 'manager' },
  { to: '/reports',   label: 'Reports',   icon: FileText,   minRole: 'manager' },
  { to: '/settings',  label: 'Settings',  icon: Settings,   minRole: 'owner'   },
]

const roleLevel = { cashier: 1, manager: 2, owner: 3 }

export default function AppLayout() {
  const { user, logout } = useAuth()
  const { isOnline, queueCount } = useOffline()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    const handle = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', handle)
    return () => window.removeEventListener('resize', handle)
  }, [])

  useEffect(() => {
    if (isMobile) setDrawerOpen(false)
  }, [location.pathname])

  const allowed = navItems.filter(n =>
    !n.minRole || roleLevel[user?.role] >= roleLevel[n.minRole]
  )

  const handleLogout = () => { logout(); navigate('/login') }

  const initials = user
    ? (user.first_name?.[0] || '') + (user.last_name?.[0] || user.username?.[0] || '')
    : '?'

  const Sidebar = () => (
    <div style={{
      width: 220, height: '100%',
      background: 'var(--surface)',
      borderRight: '1px solid var(--border)',
      display: 'flex', flexDirection: 'column',
      position: 'relative', flexShrink: 0,
    }}>
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 1,
        background: 'linear-gradient(90deg, transparent, var(--g2), transparent)',
      }} />

      {/* Logo */}
      <div style={{
        padding: '18px 16px 14px',
        borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 9,
            background: 'linear-gradient(135deg, var(--g), var(--g3))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 800, fontSize: 13, color: '#fff',
            boxShadow: 'var(--shadow-glow)', flexShrink: 0,
          }}>B</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text)', letterSpacing: '-0.3px' }}>
              BUSCAR POS
            </div>
            <div style={{ fontSize: 10, color: 'var(--text3)' }}>v2.0 · Ghana</div>
          </div>
        </div>
        {isMobile && (
          <button onClick={() => setDrawerOpen(false)} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--text2)', display: 'flex', alignItems: 'center',
          }}>
            <X size={18} />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '10px 8px', overflowY: 'auto' }}>
        {allowed.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} style={({ isActive }) => ({
            display: 'flex', alignItems: 'center', gap: 9,
            padding: '9px 12px', borderRadius: 8, marginBottom: 2,
            fontSize: 13, fontWeight: isActive ? 600 : 400,
            color: isActive ? 'var(--g)' : 'var(--text2)',
            background: isActive
              ? 'linear-gradient(135deg, var(--g-soft), transparent)'
              : 'transparent',
            border: isActive ? '1px solid var(--border2)' : '1px solid transparent',
            textDecoration: 'none', transition: 'all 0.15s',
            position: 'relative',
          })}>
            {({ isActive }) => (
              <>
                {isActive && (
                  <div style={{
                    position: 'absolute', left: 0, top: '20%', bottom: '20%',
                    width: 3, borderRadius: '0 3px 3px 0',
                    background: 'var(--g)',
                    boxShadow: '0 0 8px var(--g)',
                  }} />
                )}
                <Icon size={15} style={{ flexShrink: 0 }} />
                {label}
                {isActive && <ChevronRight size={12} style={{ marginLeft: 'auto', opacity: 0.5 }} />}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div style={{ padding: '10px 12px 16px', borderTop: '1px solid var(--border)' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 5,
          fontSize: 11, marginBottom: 10, padding: '0 2px',
          color: isOnline ? 'var(--g)' : 'var(--amber)',
        }}>
          {isOnline
            ? <><div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--g)', boxShadow: '0 0 8px var(--g)' }} /> Online</>
            : <><WifiOff size={11} /> Offline{queueCount > 0 ? ` · ${queueCount} queued` : ''}</>
          }
        </div>
        <div style={{
          display: 'flex', alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 10px',
          background: 'var(--surface2)',
          border: '1px solid var(--border)',
          borderRadius: 9,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 28, height: 28, borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--g), var(--g3))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 10, fontWeight: 700, color: '#fff', flexShrink: 0,
            }}>
              {initials.toUpperCase()}
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>
                {user?.first_name || user?.username}
              </div>
              <div style={{ fontSize: 10, color: 'var(--text3)', textTransform: 'capitalize' }}>
                {user?.role}
              </div>
            </div>
          </div>
          <button onClick={handleLogout} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--text3)', padding: 4, borderRadius: 6,
            display: 'flex', alignItems: 'center', transition: 'color 0.15s',
          }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--red)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text3)'}
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <div style={{
      display: 'flex',
      height: '100vh',
      overflow: 'hidden',
      background: 'var(--bg)',
    }}>

      {/* Desktop sidebar */}
      {!isMobile && <Sidebar />}

      {/* Mobile drawer */}
      {isMobile && drawerOpen && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 200,
          background: 'rgba(0,0,0,0.5)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
        }} onClick={() => setDrawerOpen(false)}>
          <div onClick={e => e.stopPropagation()} style={{ height: '100%' }}>
            <Sidebar />
          </div>
        </div>
      )}

      {/* Main */}
      <main style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        minWidth: 0,
        minHeight: 0,
      }}>

        {/* Topbar */}
        <div style={{
          display: 'flex', alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 20px', height: 54,
          flexShrink: 0,
          background: 'var(--surface)',
          borderBottom: '1px solid var(--border)',
          position: 'relative',
        }}>
          <div style={{
            position: 'absolute', bottom: 0, left: '20%', right: '20%',
            height: 1,
            background: 'linear-gradient(90deg, transparent, var(--g-glow), transparent)',
          }} />

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {isMobile && (
              <button onClick={() => setDrawerOpen(true)} style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'var(--text2)', display: 'flex', alignItems: 'center',
              }}>
                <Menu size={20} />
              </button>
            )}
            {isMobile && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <div style={{
                  width: 24, height: 24, borderRadius: 7,
                  background: 'linear-gradient(135deg, var(--g), var(--g3))',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 800, fontSize: 10, color: '#fff',
                }}>B</div>
                <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--text)' }}>
                  BUSCAR POS
                </span>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {!isOnline && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 4,
                padding: '4px 10px', borderRadius: 20,
                background: 'rgba(245,158,11,0.1)',
                border: '1px solid rgba(245,158,11,0.2)',
                fontSize: 11, color: 'var(--amber)',
              }}>
                <WifiOff size={11} />
                {queueCount > 0 ? `${queueCount} queued` : 'Offline'}
              </div>
            )}
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--g), var(--g3))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11, fontWeight: 700, color: '#fff',
              boxShadow: '0 0 0 2px var(--border)',
            }}>
              {initials.toUpperCase()}
            </div>
          </div>
        </div>

        {/* Mobile bottom nav */}
        {isMobile && (
          <div style={{
            position: 'fixed', bottom: 0, left: 0, right: 0,
            zIndex: 100, background: 'var(--surface)',
            borderTop: '1px solid var(--border)',
            display: 'flex',
            padding: '6px 0 max(6px, env(safe-area-inset-bottom))',
          }}>
            {allowed.slice(0, 5).map(({ to, label, icon: Icon }) => (
              <NavLink key={to} to={to} style={({ isActive }) => ({
                flex: 1, display: 'flex', flexDirection: 'column',
                alignItems: 'center', gap: 3, padding: '4px 2px',
                textDecoration: 'none',
                color: isActive ? 'var(--g)' : 'var(--text3)',
                fontSize: 9, fontWeight: isActive ? 600 : 400,
              })}>
                {({ isActive }) => (
                  <>
                    <div style={{
                      width: 32, height: 32, borderRadius: 9,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: isActive ? 'var(--g-soft)' : 'transparent',
                      border: isActive ? '1px solid var(--border2)' : '1px solid transparent',
                    }}>
                      <Icon size={16} />
                    </div>
                    {label}
                  </>
                )}
              </NavLink>
            ))}
          </div>
        )}

        {/* Page content — this is the scrollable area */}
        <div style={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          padding: isMobile ? '16px 14px 80px' : '24px',
        }}>
          <Outlet />
        </div>

      </main>
    </div>
  )
}