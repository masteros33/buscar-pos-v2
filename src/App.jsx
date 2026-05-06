import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './context/AuthContext'
import { OfflineProvider } from './context/OfflineContext'
import { SessionProvider } from './context/SessionContext'
import ProtectedRoute from './components/layout/ProtectedRoute'
import AppLayout from './components/layout/AppLayout'
import LoginPage     from './pages/LoginPage'
import POSPage       from './pages/POSPage'
import DashboardPage from './pages/DashboardPage'
import InventoryPage from './pages/InventoryPage'
import CustomersPage from './pages/CustomersPage'
import ReportsPage   from './pages/ReportsPage'
import ExpensesPage  from './pages/ExpensesPage'
import SettingsPage  from './pages/SettingsPage'

export default function App() {
  return (
    <OfflineProvider>
      <AuthProvider>
        <SessionProvider>
          <BrowserRouter>
            <Toaster
              position="top-right"
              toastOptions={{
                style: {
                  background: 'var(--surface)', color: 'var(--text)',
                  border: '1px solid var(--border)', fontFamily: 'DM Sans, sans-serif',
                  fontSize: '13px', boxShadow: 'var(--shadow-lg)',
                },
              }}
            />
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
                <Route index element={<Navigate to="/pos" replace />} />
                <Route path="/pos"       element={<POSPage />} />
                <Route path="/inventory" element={<ProtectedRoute requiredRole="manager"><InventoryPage /></ProtectedRoute>} />
                <Route path="/customers" element={<CustomersPage />} />
                <Route path="/dashboard" element={<ProtectedRoute requiredRole="manager"><DashboardPage /></ProtectedRoute>} />
                <Route path="/expenses"  element={<ProtectedRoute requiredRole="manager"><ExpensesPage /></ProtectedRoute>} />
                <Route path="/reports"   element={<ProtectedRoute requiredRole="manager"><ReportsPage /></ProtectedRoute>} />
                <Route path="/settings"  element={<ProtectedRoute requiredRole="owner"><SettingsPage /></ProtectedRoute>} />
              </Route>
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </SessionProvider>
      </AuthProvider>
    </OfflineProvider>
  )
}