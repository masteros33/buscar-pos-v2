import { createContext, useContext, useState, useEffect } from 'react'
import { authAPI } from '../api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('access_token')
    if (!token) { setLoading(false); return }
    authAPI.me()
      .then(({ data }) => setUser(data))
      .catch(() => localStorage.clear())
      .finally(() => setLoading(false))
  }, [])

  const login = async (credentials) => {
    const { data } = await authAPI.login(credentials)
    localStorage.setItem('access_token', data.access)
    localStorage.setItem('refresh_token', data.refresh)
    setUser(data.user)
    return data.user
  }

  const logout = () => {
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