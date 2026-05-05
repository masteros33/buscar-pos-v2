import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

// Attach JWT token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Auto refresh on 401
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true
      try {
        const refresh = localStorage.getItem('refresh_token')
        const { data } = await axios.post(`${BASE_URL}/auth/token/refresh/`, { refresh })
        localStorage.setItem('access_token', data.access)
        original.headers.Authorization = `Bearer ${data.access}`
        return api(original)
      } catch {
        localStorage.clear()
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export default api

// ── Auth ──────────────────────────────────────────────
export const authAPI = {
  login:          (data) => api.post('/auth/login/', data),
  logout:         (data) => api.post('/auth/logout/', data),
  me:             ()     => api.get('/auth/me/'),
  register:       (data) => api.post('/auth/register/', data),
  changePassword: (data) => api.post('/auth/change-password/', data),
  users:          ()     => api.get('/auth/users/'),
}

// ── Products ──────────────────────────────────────────
export const productsAPI = {
  list:        (params)    => api.get('/products/', { params }),
  get:         (id)        => api.get(`/products/${id}/`),
  create:      (data)      => api.post('/products/', data),
  update:      (id, data)  => api.patch(`/products/${id}/`, data),
  delete:      (id)        => api.delete(`/products/${id}/`),
  categories:  ()          => api.get('/products/categories/'),
  lowStock:    ()          => api.get('/products/low-stock/'),
  adjustStock: (id, data)  => api.post(`/products/${id}/adjust/`, data),
  barcode:     (barcode)   => api.get('/products/barcode/', { params: { barcode } }),
}

// ── Sales ─────────────────────────────────────────────
export const salesAPI = {
  create:  (data)      => api.post('/sales/', data),
  list:    (params)    => api.get('/sales/', { params }),
  get:     (id)        => api.get(`/sales/${id}/`),
  today:   ()          => api.get('/sales/today/'),
  refund:  (id, data)  => api.post(`/sales/${id}/refund/`, data),
  receipt: (id)        => api.get(`/sales/${id}/receipt/`),
}

// ── Customers ─────────────────────────────────────────
export const customersAPI = {
  list:         (params)   => api.get('/customers/', { params }),
  get:          (id)       => api.get(`/customers/${id}/`),
  create:       (data)     => api.post('/customers/', data),
  update:       (id, data) => api.patch(`/customers/${id}/`, data),
  history:      (id)       => api.get(`/customers/${id}/history/`),
  redeemPoints: (id, data) => api.post(`/customers/${id}/redeem/`, data),
}

// ── Analytics ─────────────────────────────────────────
export const analyticsAPI = {
  kpis:             (period) => api.get('/analytics/kpis/', { params: { period } }),
  salesTrend:       (period) => api.get('/analytics/sales-trend/', { params: { period } }),
  revenueCost:      ()       => api.get('/analytics/revenue-cost/'),
  topProducts:      (limit)  => api.get('/analytics/top-products/', { params: { limit } }),
  summary:          ()       => api.get('/analytics/summary/'),
  paymentBreakdown: (period) => api.get('/analytics/payment-breakdown/', { params: { period } }),
  smartReorder: (days=7) => api.get('/analytics/smart-reorder/', { params: { days } }),
  aiInsights: (data) => api.post('/analytics/ai-insights/', data),
}

// ── Expenses ──────────────────────────────────────────
export const expensesAPI = {
  list:   (params)    => api.get('/expenses/', { params }),
  create: (data)      => api.post('/expenses/', data),
  update: (id, data)  => api.patch(`/expenses/${id}/`, data),
  delete: (id)        => api.delete(`/expenses/${id}/`),
}

// ── Payments ──────────────────────────────────────────
export const paymentsAPI = {
  initiate:    (data)      => api.post('/payments/initiate/', data),
  checkStatus: (reference) => api.get(`/payments/status/${reference}/`),
  history:     ()          => api.get('/payments/history/'),
}

// ── Branches ──────────────────────────────────────────
export const branchesAPI = {
  list:           ()        => api.get('/branches/'),
  create:         (data)    => api.post('/branches/', data),
  detail:         (id)      => api.get(`/branches/${id}/`),
  staff:          (id)      => api.get(`/branches/${id}/staff/`),
  addStaff:       (id, data)=> api.post(`/branches/${id}/staff/`, data),
  transfers:      ()        => api.get('/branches/transfers/'),
  createTransfer: (data)    => api.post('/branches/transfers/', data),
}

// ── Shifts ────────────────────────────────────────────
export const shiftsAPI = {
  open:       (data)   => api.post('/shifts/open/', data),
  close:      (data)   => api.post('/shifts/close/', data),
  current:    ()       => api.get('/shifts/current/'),
  all:        (params) => api.get('/shifts/all/', { params }),
  summary:    ()       => api.get('/shifts/summary/'),
  attendance: (params) => api.get('/shifts/attendance/', { params }),
}

// ── Suppliers ─────────────────────────────────────────
export const suppliersAPI = {
  list:         ()        => api.get('/suppliers/'),
  create:       (data)    => api.post('/suppliers/', data),
  orders:       (params)  => api.get('/suppliers/orders/', { params }),
  createOrder:  (data)    => api.post('/suppliers/orders/', data),
  receiveStock: (id, data)=> api.post(`/suppliers/orders/${id}/receive/`, data),
  pay:          (id, data)=> api.post(`/suppliers/orders/${id}/pay/`, data),
}