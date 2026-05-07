import { useState, useEffect, useRef } from 'react'
import { Search, ScanLine, Trash2, CreditCard, Banknote, Smartphone, X, User } from 'lucide-react'
import { productsAPI, salesAPI, customersAPI } from '../api'
import { useOffline } from '../context/OfflineContext'
import Receipt from '../components/Receipt'
import ShiftBar from '../components/ShiftBar'
import Fuse from 'fuse.js'
import toast from 'react-hot-toast'

export default function POSPage() {
  const [products, setProducts] = useState([])
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All')
  const [categories, setCategories] = useState(['All'])
  const [cart, setCart] = useState([])
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [submitting, setSubmitting] = useState(false)
  const [customer, setCustomer] = useState(null)
  const [customerSearch, setCustomerSearch] = useState('')
  const [customerResults, setCustomerResults] = useState([])
  const [showCustomerDrop, setShowCustomerDrop] = useState(false)
  const [showReceipt, setShowReceipt] = useState(false)
  const [currentSale, setCurrentSale] = useState(null)
  const [scanning, setScanning] = useState(false)
  const [showCart, setShowCart] = useState(false)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
  const scannerRef = useRef(null)
  const scannerInstanceRef = useRef(null)
  const { isOnline, queueRequest } = useOffline()

  useEffect(() => {
    const handle = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', handle)
    return () => window.removeEventListener('resize', handle)
  }, [])

  useEffect(() => {
    productsAPI.list({})
      .then(({ data }) => {
        const prods = data.results || data
        setProducts(prods)
        const cats = ['All', ...new Set(prods.map(p => p.category_name).filter(Boolean))]
        setCategories(cats)
      })
      .catch(() => toast.error('Failed to load products'))
  }, [])

  useEffect(() => {
    if (!customerSearch.trim()) { setCustomerResults([]); return }
    const t = setTimeout(() => {
      customersAPI.list({ search: customerSearch })
        .then(({ data }) => setCustomerResults(data.results || data))
        .catch(() => {})
    }, 300)
    return () => clearTimeout(t)
  }, [customerSearch])

  const startScanner = async () => {
    setScanning(true)
    try {
      const { Html5Qrcode } = await import('html5-qrcode')
      await new Promise(r => setTimeout(r, 300))
      const scanner = new Html5Qrcode('qr-reader')
      scannerInstanceRef.current = scanner
      await scanner.start(
        { facingMode: 'environment' },
        { fps: 12, qrbox: { width: 260, height: 100 } },
        (decoded) => handleBarcodeScan(decoded),
        () => {}
      )
    } catch {
      toast.error('Camera not available')
      setScanning(false)
    }
  }

  const stopScanner = async () => {
    try {
      if (scannerInstanceRef.current) {
        await scannerInstanceRef.current.stop()
        scannerInstanceRef.current = null
      }
    } catch {}
    setScanning(false)
  }

  const handleBarcodeScan = (barcode) => {
    const found = products.find(p =>
      p.sku === barcode || p.barcode === barcode || String(p.id) === barcode
    )
    if (found) {
      addToCart(found)
      toast.success(`Added: ${found.name}`)
      stopScanner()
    } else {
      toast.error(`No product found: ${barcode}`)
    }
  }

  const addToCart = (product) => {
    if (product.stock_qty === 0) { toast.error('Out of stock'); return }
    setCart(prev => {
      const existing = prev.find(i => i.id === product.id)
      if (existing) return prev.map(i => i.id === product.id ? { ...i, qty: i.qty + 1 } : i)
      return [...prev, { ...product, qty: 1 }]
    })
    if (isMobile) setShowCart(true)
  }

  const updateQty = (id, delta) => {
    setCart(prev => prev
      .map(i => i.id === id ? { ...i, qty: i.qty + delta } : i)
      .filter(i => i.qty > 0)
    )
  }

  const removeItem = (id) => setCart(prev => prev.filter(i => i.id !== id))
  const clearCart = () => { setCart([]); setCustomer(null); setCurrentSale(null) }

  const subtotal = cart.reduce((s, i) => s + parseFloat(i.price) * i.qty, 0)
  const tax = subtotal * 0.025
  const total = subtotal + tax

  const handleCheckout = async () => {
    if (!cart.length) return toast.error('Cart is empty')
    setSubmitting(true)
    const payload = {
      items: cart.map(i => ({
        product: i.id,
        qty: i.qty,
        unit_price: parseFloat(i.price).toFixed(2),
      })),
      payment_method: paymentMethod,
      customer_id: customer?.id || null,
      subtotal: subtotal.toFixed(2),
      tax: tax.toFixed(2),
      discount: '0.00',
      total: total.toFixed(2),
      amount_paid: total.toFixed(2),
    }
    try {
      if (isOnline) {
        const { data } = await salesAPI.create(payload)
        setCurrentSale(data)
        setShowReceipt(true)
        setShowCart(false)
        setCart([])
        setCustomer(null)
      } else {
        await queueRequest('/api/sales/', 'POST', payload, {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
        })
        toast.success('Saved offline — syncs when back online')
        setCart([])
        setCustomer(null)
        setShowCart(false)
      }
    } catch (err) {
      const msg = err?.response?.data
      toast.error(typeof msg === 'object' ? JSON.stringify(msg) : 'Failed to process sale')
    } finally {
      setSubmitting(false)
    }
  }

  const filtered = (() => {
    let base = category === 'All'
      ? products
      : products.filter(p => p.category_name === category)
    if (!search.trim()) return base
    return new Fuse(base, {
      keys: ['name', 'sku', 'barcode'],
      threshold: 0.35,
    }).search(search).map(r => r.item)
  })()

  const payMethods = [
    { id: 'cash', label: 'Cash',  icon: Banknote   },
    { id: 'momo', label: 'MoMo',  icon: Smartphone },
    { id: 'card', label: 'Card',  icon: CreditCard  },
  ]

  const CartPanel = () => (
    <div style={{
      width: isMobile ? '100%' : 290,
      flexShrink: 0,
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: isMobile ? '16px 16px 0 0' : 12,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      height: isMobile ? '85vh' : '100%',
    }}>
      <div style={{ padding: '12px 14px 10px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>
            Order · {cart.length} item{cart.length !== 1 ? 's' : ''}
          </span>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {cart.length > 0 && (
              <button onClick={clearCart} style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: 11, color: 'var(--red)', fontFamily: 'inherit',
              }}>Clear</button>
            )}
            {isMobile && (
              <button onClick={() => setShowCart(false)} style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'var(--text2)', display: 'flex', alignItems: 'center',
              }}>
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        <div style={{ marginTop: 8, position: 'relative' }}>
          {customer ? (
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              background: 'var(--g-soft)', border: '1px solid var(--border2)',
              borderRadius: 7, padding: '6px 10px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <User size={12} style={{ color: 'var(--g)' }} />
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--g)' }}>{customer.name}</span>
                <span style={{ fontSize: 11, color: 'var(--g2)' }}>· {customer.points_balance} pts</span>
              </div>
              <button onClick={() => setCustomer(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--g)', display: 'flex' }}>
                <X size={12} />
              </button>
            </div>
          ) : (
            <div style={{ position: 'relative' }}>
              <User size={13} style={{
                position: 'absolute', left: 9, top: '50%',
                transform: 'translateY(-50%)', color: 'var(--text3)', pointerEvents: 'none',
              }} />
              <input
                value={customerSearch}
                onChange={e => { setCustomerSearch(e.target.value); setShowCustomerDrop(true) }}
                onFocus={() => setShowCustomerDrop(true)}
                onBlur={() => setTimeout(() => setShowCustomerDrop(false), 150)}
                placeholder="Add customer (optional)"
                style={{
                  width: '100%', padding: '7px 10px 7px 28px',
                  borderRadius: 7, border: '1px solid var(--border)',
                  background: 'var(--surface2)', fontSize: 12,
                  color: 'var(--text)', outline: 'none', fontFamily: 'inherit',
                }}
              />
              {showCustomerDrop && customerResults.length > 0 && (
                <div style={{
                  position: 'absolute', top: '100%', left: 0, right: 0,
                  zIndex: 30, background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 8, marginTop: 3, overflow: 'hidden',
                  boxShadow: 'var(--shadow-lg)',
                }}>
                  {customerResults.slice(0, 5).map(c => (
                    <button key={c.id} onMouseDown={() => {
                      setCustomer(c); setCustomerSearch(''); setShowCustomerDrop(false)
                    }} style={{
                      width: '100%', padding: '8px 12px',
                      border: 'none', borderBottom: '1px solid var(--border)',
                      background: 'none', textAlign: 'left', cursor: 'pointer',
                      fontFamily: 'inherit',
                    }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>{c.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text3)' }}>{c.phone} · {c.points_balance} pts</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 10px' }}>
        {cart.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text3)', fontSize: 13 }}>
            Tap a product to add it
          </div>
        )}
        {cart.map(item => (
          <div key={item.id} style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '8px 4px', borderBottom: '1px solid var(--border)',
          }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {item.name}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 1 }}>
                GHS {parseFloat(item.price).toFixed(2)} each
              </div>
              <div style={{ fontSize: 12, color: 'var(--g)', fontWeight: 600, fontFamily: 'DM Mono, monospace' }}>
                GHS {(parseFloat(item.price) * item.qty).toFixed(2)}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <button onClick={() => updateQty(item.id, -1)} style={qtyBtn}>−</button>
              <span style={{ fontSize: 12, fontWeight: 600, minWidth: 20, textAlign: 'center', color: 'var(--text)', fontFamily: 'DM Mono, monospace' }}>
                {item.qty}
              </span>
              <button onClick={() => updateQty(item.id, 1)} style={qtyBtn}>+</button>
              <button onClick={() => removeItem(item.id)} style={{ ...qtyBtn, color: 'var(--red)', marginLeft: 2 }}>
                <Trash2 size={11} />
              </button>
            </div>
          </div>
        ))}
      </div>

      <div style={{ padding: '10px 14px', borderTop: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text2)', marginBottom: 3 }}>
          <span>Subtotal</span><span style={{ fontFamily: 'DM Mono, monospace' }}>GHS {subtotal.toFixed(2)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text2)', marginBottom: 10 }}>
          <span>Tax (2.5%)</span><span style={{ fontFamily: 'DM Mono, monospace' }}>GHS {tax.toFixed(2)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 16, fontWeight: 700, color: 'var(--text)', marginBottom: 12 }}>
          <span>Total</span>
          <span style={{ color: 'var(--g)', fontFamily: 'DM Mono, monospace' }}>GHS {total.toFixed(2)}</span>
        </div>

        <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
          {payMethods.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setPaymentMethod(id)} style={{
              flex: 1, padding: '7px 4px', borderRadius: 8,
              border: `1px solid ${paymentMethod === id ? 'var(--g)' : 'var(--border)'}`,
              background: paymentMethod === id ? 'var(--g-soft)' : 'var(--surface2)',
              color: paymentMethod === id ? 'var(--g)' : 'var(--text2)',
              cursor: 'pointer', fontSize: 11, fontWeight: 500,
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
              fontFamily: 'inherit',
            }}>
              <Icon size={14} />{label}
            </button>
          ))}
        </div>

        <button
          onClick={handleCheckout}
          disabled={submitting || !cart.length}
          style={{
            width: '100%', padding: '13px', borderRadius: 9, border: 'none',
            background: !cart.length ? 'var(--surface2)' : 'linear-gradient(135deg, var(--g), var(--g3))',
            color: !cart.length ? 'var(--text3)' : '#fff',
            fontWeight: 700, fontSize: 15,
            cursor: !cart.length ? 'not-allowed' : 'pointer',
            fontFamily: 'inherit',
            boxShadow: cart.length ? 'var(--shadow-glow)' : 'none',
            transition: 'all 0.2s',
          }}
        >
          {submitting ? 'Processing...' : isOnline ? `Charge GHS ${total.toFixed(2)}` : `Save Offline · GHS ${total.toFixed(2)}`}
        </button>
      </div>
    </div>
  )

  return (
    <div style={{
      display: 'flex',
      flexDirection: isMobile ? 'column' : 'row',
      gap: 14,
      height: isMobile ? 'auto' : 'calc(100vh - 102px)',
      minHeight: 0,
    }}>
      {/* LEFT — Products */}
      <div style={{
        flex: 1, display: 'flex',
        flexDirection: 'column', gap: 10, minWidth: 0,
      }}>
        <ShiftBar />

        {/* Search + Scan */}
        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <Search size={15} style={{
              position: 'absolute', left: 11, top: '50%',
              transform: 'translateY(-50%)', color: 'var(--text3)',
              pointerEvents: 'none',
            }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search products — typos ok..."
              style={{
                width: '100%', padding: '10px 14px 10px 36px',
                background: 'var(--surface)',
                border: '1.5px solid var(--border)',
                borderRadius: 10, color: 'var(--text)',
                fontSize: 13, fontFamily: 'inherit', outline: 'none',
              }}
              onFocus={e => e.target.style.borderColor = 'var(--g2)'}
              onBlur={e => e.target.style.borderColor = 'var(--border)'}
            />
          </div>
          <button onClick={scanning ? stopScanner : startScanner} style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '10px 16px', borderRadius: 10, border: 'none',
            background: scanning ? 'rgba(255,77,109,0.1)' : 'linear-gradient(135deg, var(--g), var(--g3))',
            color: scanning ? 'var(--red)' : '#fff',
            fontSize: 13, fontWeight: 600, cursor: 'pointer',
            flexShrink: 0, fontFamily: 'inherit',
          }}>
            <ScanLine size={16} />
            {scanning ? 'Stop' : 'Scan'}
          </button>
        </div>

        {/* Scanner */}
        {scanning && (
          <div style={{ background: '#000', borderRadius: 12, overflow: 'hidden', position: 'relative', flexShrink: 0 }}>
            <div id="qr-reader" ref={scannerRef} style={{ width: '100%' }} />
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
              <div style={{ width: 260, height: 100, border: '2px solid var(--g)', borderRadius: 8, boxShadow: '0 0 0 9999px rgba(0,0,0,0.5)' }} />
            </div>
            <div style={{ position: 'absolute', bottom: 10, left: 0, right: 0, textAlign: 'center', fontSize: 12, color: '#fff', opacity: 0.8 }}>
              Point camera at barcode
            </div>
          </div>
        )}

        {/* Categories */}
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', flexShrink: 0, paddingBottom: 2 }}>
          {categories.map(cat => (
            <button key={cat} onClick={() => setCategory(cat)} style={{
              padding: '5px 13px', borderRadius: 20,
              border: `1px solid ${category === cat ? 'var(--g)' : 'var(--border)'}`,
              background: category === cat ? 'var(--g)' : 'var(--surface)',
              color: category === cat ? '#fff' : 'var(--text2)',
              fontSize: 12, fontWeight: 500, cursor: 'pointer',
              whiteSpace: 'nowrap', flexShrink: 0, fontFamily: 'inherit',
            }}>
              {cat}
            </button>
          ))}
        </div>

        {/* Products grid */}
        <div style={{
          flex: isMobile ? 'none' : 1,
          height: isMobile ? 420 : 'auto',
          overflowY: 'auto',
          display: 'grid',
          gridTemplateColumns: `repeat(auto-fill, minmax(${isMobile ? '100px' : '130px'}, 1fr))`,
          gap: 8, alignContent: 'start',
        }}>
          {filtered.map(p => (
            <button
              key={p.id}
              onClick={() => addToCart(p)}
              disabled={p.stock_qty === 0}
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 10, padding: '12px 10px',
                cursor: p.stock_qty === 0 ? 'not-allowed' : 'pointer',
                textAlign: 'left', transition: 'all 0.15s',
                opacity: p.stock_qty === 0 ? 0.5 : 1,
                fontFamily: 'inherit',
              }}
              onMouseEnter={e => { if (p.stock_qty > 0) e.currentTarget.style.borderColor = 'var(--g)' }}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
            >
              <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--text)', marginBottom: 3, lineHeight: 1.3 }}>
                {p.name}
              </div>
              <div style={{ fontSize: 9, color: 'var(--text3)', marginBottom: 6 }}>
                {p.category_name}
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--g)', fontFamily: 'DM Mono, monospace' }}>
                GHS {parseFloat(p.price).toFixed(2)}
              </div>
              <div style={{
                fontSize: 9, marginTop: 2,
                color: p.stock_qty === 0 ? 'var(--red)' : p.stock_qty < 10 ? 'var(--amber)' : 'var(--text3)',
              }}>
                {p.stock_qty === 0 ? 'Out of stock' : p.stock_qty < 10 ? `Only ${p.stock_qty} left` : `${p.stock_qty} in stock`}
              </div>
            </button>
          ))}
          {filtered.length === 0 && (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', color: 'var(--text3)', fontSize: 13, padding: 40 }}>
              No products found
            </div>
          )}
        </div>

        {/* Mobile cart button */}
        {isMobile && (
          <button
            onClick={() => setShowCart(true)}
            style={{
              position: 'fixed', bottom: 80, right: 16,
              zIndex: 50,
              background: 'linear-gradient(135deg, var(--g), var(--g3))',
              color: '#fff', border: 'none', borderRadius: 50,
              width: 60, height: 60,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexDirection: 'column', gap: 2,
              boxShadow: 'var(--shadow-glow)',
              cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            <Banknote size={22} />
            {cart.length > 0 && (
              <span style={{
                position: 'absolute', top: -4, right: -4,
                background: 'var(--red)', color: '#fff',
                borderRadius: '50%', width: 20, height: 20,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 700,
              }}>
                {cart.length}
              </span>
            )}
          </button>
        )}
      </div>

      {/* Desktop cart */}
      {!isMobile && <CartPanel />}

      {/* Mobile cart drawer */}
      {isMobile && showCart && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 150,
          background: 'rgba(0,0,0,0.5)',
          backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'flex-end',
        }} onClick={() => setShowCart(false)}>
          <div onClick={e => e.stopPropagation()} style={{ width: '100%' }}>
            <CartPanel />
          </div>
        </div>
      )}

      {/* Receipt modal */}
      {showReceipt && currentSale && (
        <Receipt
          sale={currentSale}
          store={{
            name: 'BUSCAR POS',
            address: 'Accra, Ghana',
            receipt_footer: 'Thank you for shopping with us!',
          }}
          onClose={() => { setShowReceipt(false); setCurrentSale(null) }}
        />
      )}
    </div>
  )
}

const qtyBtn = {
  width: 22, height: 22, borderRadius: 5,
  border: '1px solid var(--border)',
  background: 'var(--surface2)', color: 'var(--text2)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  cursor: 'pointer', fontSize: 13, padding: 0,
}