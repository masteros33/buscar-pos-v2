import { useRef } from 'react'
import { X, Printer, MessageCircle, Download } from 'lucide-react'

export default function Receipt({ sale, store, onClose }) {
  const printRef = useRef(null)

  if (!sale) return null

  const handlePrint = () => {
    const content = printRef.current.innerHTML
    const win = window.open('', '_blank', 'width=400,height=600')
    win.document.write(`
      <html>
        <head>
          <title>Receipt ${sale.receipt_number}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Courier New', monospace; font-size: 12px; padding: 10px; max-width: 300px; }
            .header { text-align: center; margin-bottom: 10px; }
            .store-name { font-size: 16px; font-weight: bold; }
            .divider { border-top: 1px dashed #000; margin: 6px 0; }
            .row { display: flex; justify-content: space-between; margin: 3px 0; }
            .bold { font-weight: bold; }
            .center { text-align: center; }
            .item-name { flex: 1; }
            .item-price { text-align: right; min-width: 60px; }
            .total-section { margin-top: 6px; }
            .grand-total { font-size: 14px; font-weight: bold; }
            .footer { text-align: center; margin-top: 10px; font-size: 11px; }
            .qr-placeholder { text-align: center; margin: 8px 0; font-size: 10px; }
          </style>
        </head>
        <body>${content}</body>
      </html>
    `)
    win.document.close()
    win.focus()
    setTimeout(() => { win.print(); win.close() }, 500)
  }

  const handleWhatsApp = () => {
    const items = sale.items?.map(i =>
      `  ${i.product_name} x${i.qty} — GHS ${parseFloat(i.unit_price * i.qty).toFixed(2)}`
    ).join('\n') || ''

    const msg = `
*BUSCAR POS Receipt*
${store?.name || 'BUSCAR POS'}
${store?.address || 'Accra, Ghana'}

Receipt: *${sale.receipt_number}*
Date: ${new Date(sale.created_at).toLocaleString('en-GB')}
Cashier: ${sale.cashier_name || 'Cashier'}
${sale.customer_name ? `Customer: ${sale.customer_name}` : ''}

─────────────────
${items}
─────────────────
Subtotal:  GHS ${parseFloat(sale.subtotal).toFixed(2)}
Tax (2.5%): GHS ${parseFloat(sale.tax).toFixed(2)}
*TOTAL:    GHS ${parseFloat(sale.total).toFixed(2)}*

Payment: ${sale.payment_method?.toUpperCase()}
─────────────────
${store?.receipt_footer || 'Thank you for shopping with us!'}
    `.trim()

    const phone = sale.customer_phone?.replace(/\D/g, '') || ''
    const url = phone
      ? `https://wa.me/233${phone.slice(-9)}?text=${encodeURIComponent(msg)}`
      : `https://wa.me/?text=${encodeURIComponent(msg)}`
    window.open(url, '_blank')
  }

  const date = new Date(sale.created_at)

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      background: 'rgba(0,0,0,0.6)',
      backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20, fontFamily: 'DM Sans, sans-serif',
    }}>
      <div style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 16,
        width: '100%', maxWidth: 380,
        boxShadow: 'var(--shadow-lg)',
        overflow: 'hidden',
        maxHeight: '90vh',
        display: 'flex', flexDirection: 'column',
      }}>
        {/* Header */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'linear-gradient(135deg, var(--g-soft), transparent)',
          flexShrink: 0,
        }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>
            Receipt
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{
              fontSize: 12, fontWeight: 600, color: 'var(--g)',
              fontFamily: 'DM Mono, monospace',
            }}>
              {sale.receipt_number}
            </span>
            <button onClick={onClose} style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--text2)', display: 'flex', alignItems: 'center',
            }}>
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Receipt content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 20px' }}>
          <div ref={printRef}>
            {/* Store header */}
            <div className="header" style={{ textAlign: 'center', padding: '16px 0 12px', borderBottom: '1px dashed var(--border)' }}>
              <div className="store-name" style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>
                {store?.name || 'BUSCAR POS'}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 3 }}>
                {store?.address || 'Accra, Ghana'}
              </div>
              {store?.phone && (
                <div style={{ fontSize: 12, color: 'var(--text2)' }}>{store.phone}</div>
              )}
            </div>

            {/* Meta */}
            <div style={{ padding: '10px 0', borderBottom: '1px dashed var(--border)' }}>
              {[
                ['Receipt', sale.receipt_number],
                ['Date', date.toLocaleDateString('en-GB')],
                ['Time', date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })],
                ['Cashier', sale.cashier_name || 'Cashier'],
                ...(sale.customer_name ? [['Customer', sale.customer_name]] : []),
              ].map(([l, v]) => (
                <div key={l} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 3 }}>
                  <span style={{ color: 'var(--text2)' }}>{l}</span>
                  <span style={{ fontWeight: 500, color: 'var(--text)' }}>{v}</span>
                </div>
              ))}
            </div>

            {/* Items */}
            <div style={{ padding: '10px 0', borderBottom: '1px dashed var(--border)' }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text2)', marginBottom: 6, letterSpacing: '0.05em' }}>
                ITEMS
              </div>
              {sale.items?.map((item, i) => (
                <div key={i} style={{ marginBottom: 6 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                    <span style={{ fontWeight: 500, color: 'var(--text)', flex: 1 }}>
                      {item.product_name}
                    </span>
                    <span style={{ fontWeight: 600, color: 'var(--text)', fontFamily: 'DM Mono, monospace' }}>
                      GHS {(parseFloat(item.unit_price) * item.qty).toFixed(2)}
                    </span>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text3)' }}>
                    {item.qty} × GHS {parseFloat(item.unit_price).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div style={{ padding: '10px 0', borderBottom: '1px dashed var(--border)' }}>
              {[
                ['Subtotal', `GHS ${parseFloat(sale.subtotal || 0).toFixed(2)}`],
                ['Tax (2.5%)', `GHS ${parseFloat(sale.tax || 0).toFixed(2)}`],
                ...(parseFloat(sale.discount) > 0 ? [['Discount', `-GHS ${parseFloat(sale.discount).toFixed(2)}`]] : []),
              ].map(([l, v]) => (
                <div key={l} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 3 }}>
                  <span style={{ color: 'var(--text2)' }}>{l}</span>
                  <span style={{ color: 'var(--text)', fontFamily: 'DM Mono, monospace' }}>{v}</span>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 16, fontWeight: 700, marginTop: 8 }}>
                <span style={{ color: 'var(--text)' }}>TOTAL</span>
                <span style={{ color: 'var(--g)', fontFamily: 'DM Mono, monospace' }}>
                  GHS {parseFloat(sale.total).toFixed(2)}
                </span>
              </div>
            </div>

            {/* Payment */}
            <div style={{ padding: '10px 0', borderBottom: '1px dashed var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                <span style={{ color: 'var(--text2)' }}>Payment method</span>
                <span style={{
                  fontWeight: 600, padding: '2px 8px', borderRadius: 20,
                  background: 'var(--g-soft)', color: 'var(--g)', fontSize: 11,
                }}>
                  {sale.payment_method?.toUpperCase()}
                </span>
              </div>
              {sale.customer_name && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginTop: 4 }}>
                  <span style={{ color: 'var(--text2)' }}>Loyalty points earned</span>
                  <span style={{ fontWeight: 600, color: 'var(--amber)' }}>
                    +{Math.floor(parseFloat(sale.total))} pts
                  </span>
                </div>
              )}
            </div>

            {/* Footer */}
            <div style={{ padding: '12px 0', textAlign: 'center' }}>
              <div style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.5 }}>
                {store?.receipt_footer || 'Thank you for shopping with us!'}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 6 }}>
                Powered by BUSCAR POS · Ghana
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div style={{
          padding: '14px 20px',
          borderTop: '1px solid var(--border)',
          display: 'flex', gap: 8,
          flexShrink: 0,
          background: 'var(--surface2)',
        }}>
          <button onClick={handlePrint} style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: 6, padding: '10px', borderRadius: 9,
            border: '1px solid var(--border)', background: 'var(--surface)',
            color: 'var(--text2)', fontSize: 13, fontWeight: 600,
            cursor: 'pointer', fontFamily: 'inherit',
          }}>
            <Printer size={15} /> Print
          </button>
          <button onClick={handleWhatsApp} style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: 6, padding: '10px', borderRadius: 9,
            border: 'none',
            background: 'linear-gradient(135deg, #25D366, #128C7E)',
            color: '#fff', fontSize: 13, fontWeight: 600,
            cursor: 'pointer', fontFamily: 'inherit',
          }}>
            <MessageCircle size={15} /> WhatsApp
          </button>
          <button onClick={onClose} style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: 6, padding: '10px', borderRadius: 9,
            border: 'none',
            background: 'linear-gradient(135deg, var(--g), var(--g3))',
            color: '#fff', fontSize: 13, fontWeight: 600,
            cursor: 'pointer', fontFamily: 'inherit',
          }}>
            New sale
          </button>
        </div>
      </div>
    </div>
  )
}