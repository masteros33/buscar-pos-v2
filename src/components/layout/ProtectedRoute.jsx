import { Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

const roleLevel = { cashier: 1, manager: 2, owner: 3 }

export default function ProtectedRoute({ children, requiredRole }) {
  const { user, loading } = useAuth()

  if (loading) return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      height: '100vh', background: 'var(--bg)',
      color: 'var(--text2)', fontSize: '14px', fontFamily: 'DM Sans, sans-serif',
      gap: '10px',
    }}>
      <div style={{
        width: '20px', height: '20px', borderRadius: '50%',
        border: '2px solid var(--border)',
        borderTopColor: 'var(--g)',
        animation: 'spin 0.8s linear infinite',
      }} />
      Loading...
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )

  if (!user) return <Navigate to="/login" replace />

  if (requiredRole && roleLevel[user.role] < roleLevel[requiredRole]) {
    return <Navigate to="/pos" replace />
  }

  return children
}