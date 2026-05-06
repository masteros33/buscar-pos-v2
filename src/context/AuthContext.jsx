import { createContext, useContext, useState, useEffect, useRef } from 'react'
import { authAPI } from '../api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const refreshRef = useRef(null)

  // Auto refresh token every 45 minutes
  const scheduleRefresh = () => {
    clearTimeout(refreshRef.current)
    refreshRef.current = setTimeout(async () => {
      try {
        const refresh = localStorage.getItem('refresh_token')
        if (!refresh) return
        const { default: axios } = await import('axios')
        const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'
        const { data } = await axios.post(`${BASE_URL}/auth/token/refresh/`, { refresh })
        localStorage.setItem('access_token', data.access)
        scheduleRefresh()
      } catch {
        logout()
      }
    }, 45 * 60 * 1000)
  }

  useEffect(() => {
    const token = localStorage.getItem('access_token')
    if (!token) { setLoading(false); return }
    authAPI.me()
      .then(({ data }) => { setUser(data); scheduleRefresh() })
      .catch(() => localStorage.clear())
      .finally(() => setLoading(false))
    return () => clearTimeout(refreshRef.current)
  }, [])

  const login = async (credentials) => {
    const { data } = await authAPI.login(credentials)
    localStorage.setItem('access_token', data.access)
    localStorage.setItem('refresh_token', data.refresh)
    setUser(data.user)
    scheduleRefresh()
    return data.user
  }

  const logout = () => {
    clearTimeout(refreshRef.current)
    const refresh = localStorage.getItem('refresh_token')
    if (refresh) authAPI.logout({ refresh }).catch(() => {})
    localStorage.clear()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{
      user, loading, login, logout,
      isOwner:   user?.role === 'owner',
      isManager: user?.role === 'manager' || user?.role === 'owner',
      isCashier: !!user,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)