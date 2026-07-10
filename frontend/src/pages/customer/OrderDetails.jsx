import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { FaArrowLeft, FaBox } from 'react-icons/fa'
import api from '../../services/api'

export default function OrderDetails() {
  const { id } = useParams()
  const [order, setOrder] = useState(null)
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/orders/' + id).then(r => {
      if (r.data.success) setOrder(r.data.order)
    }).catch(() => {}).finally(() => setLoading(false))
    api.get('/orders/' + id + '/items').then(r => {
      if (r.data.success) setItems(r.data.items || [])
    }).catch(() => {})
  }, [id])

  const statusClass = (s) => {
    const map = { pending: 'status-pending', processing: 'status-processing', delivered: 'status-completed', cancelled: 'status-cancelled' }
    return 'status-badge ' + (map[s] || 'status-pending')
  }

  if (loading) return <div className="page"><p>Loading...</p></div>
  if (!order) return <div className="page"><p>Order not found.</p></div>

  return (
    <div className="page">
      <div style={{ marginBottom: 20 }}>
        <Link to="/orders" style={{ color: 'var(--primary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6 }}>
          <FaArrowLeft /> Back to Orders
        </Link>
      </div>
      <div className="card">
        <div className="card-header">
          <h3 className="card-title"><FaBox style={{ marginRight: 8 }} />Order #{order.order_number}</h3>
          <span className={statusClass(order.status)}>{order.status}</span>
        </div>
        <table style={{ width: '100%', marginBottom: 16 }}>
          <tbody>
            {[
              ['Date', new Date(order.created_at).toLocaleDateString()],
              ['Total', 'ETB ' + parseFloat(order.total_amount).toFixed(2)],
              ['Payment', order.payment_method || '-'],
              ['Shipping Address', order.shipping_address || '-'],
            ].map(([k, v]) => (
              <tr key={k}>
                <td style={{ padding: '8px 0', color: 'var(--gray)', width: 160 }}>{k}</td>
                <td style={{ padding: '8px 0', fontWeight: 500 }}>{v}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {items.length > 0 && (
          <>
            <h4 style={{ marginBottom: 12 }}>Items</h4>
            <div className="table-responsive">
              <table className="data-table">
                <thead><tr><th>Product</th><th>Qty</th><th>Unit Price</th><th>Subtotal</th></tr></thead>
                <tbody>
                  {items.map(item => (
                    <tr key={item.id}>
                      <td>{item.name || 'Product #' + item.product_id}</td>
                      <td>{item.quantity}</td>
                      <td>ETB {parseFloat(item.unit_price).toFixed(2)}</td>
                      <td>ETB {(item.quantity * item.unit_price).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
