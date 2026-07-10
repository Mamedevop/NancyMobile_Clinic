import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { FaSearch, FaBox, FaTruck, FaCheckCircle, FaClock,
  FaMoneyCheckAlt, FaMapMarkerAlt, FaPhone, FaComments, FaBell } from 'react-icons/fa'
import { useAuth } from '../../context/AuthContext'
import { useLanguage } from '../../context/LanguageContext'
import api from '../../services/api'
import toast from 'react-hot-toast'

const TIMELINE = [
  { key: 'pending',    label: 'Order Placed',      icon: <FaClock />,         desc: 'Your order has been received.' },
  { key: 'processing', label: 'Payment Verified',  icon: <FaMoneyCheckAlt />, desc: 'Payment confirmed by admin.' },
  { key: 'shipped',    label: 'Out for Delivery',  icon: <FaTruck />,         desc: 'A delivery person is on the way.' },
  { key: 'delivered',  label: 'Arrived',           icon: <FaMapMarkerAlt />,  desc: 'Your order has arrived. Please confirm receipt.' },
  { key: 'completed',  label: 'Delivered',         icon: <FaCheckCircle />,   desc: 'Order successfully delivered.' },
]

// Map order status → timeline step index
const statusIndex = (status, deliveryStatus) => {
  if (status === 'completed' || status === 'delivered') return 4
  if (deliveryStatus === 'delivered' || status === 'delivered') return 3
  if (['on_the_way','picked_up','in-progress','delivered'].includes(deliveryStatus) || status === 'shipped') return 2
  if (status === 'processing') return 1
  return 0
}

export default function TrackOrder() {
  const { orderNumber: paramOrderNumber } = useParams()
  const { user } = useAuth()
  const { t } = useLanguage()
  const [orderNumber, setOrderNumber] = useState(paramOrderNumber || '')
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [error, setError] = useState('')

  // Auto-load if order number in URL
  useEffect(() => {
    if (paramOrderNumber) doTrack(paramOrderNumber)
  }, [paramOrderNumber])

  // Poll every 15s when order is active
  useEffect(() => {
    if (!order || ['completed','cancelled'].includes(order.status)) return
    const interval = setInterval(() => doTrack(order.order_number, true), 15000)
    return () => clearInterval(interval)
  }, [order?.status])

  const doTrack = async (num, silent = false) => {
    if (!silent) { setLoading(true); setError(''); setOrder(null) }
    try {
      const r = await api.get('/orders/track/' + num.trim())
      if (r.data.success) setOrder(r.data.order)
      else if (!silent) setError('Order not found.')
    } catch {
      if (!silent) setError('Order not found. Please check the order number.')
    } finally { if (!silent) setLoading(false) }
  }

  const handleTrack = async (e) => {
    e.preventDefault()
    if (!orderNumber.trim()) return
    doTrack(orderNumber)
  }

  const confirmDelivery = async () => {
    if (!window.confirm('Confirm that you have received this order?')) return
    setConfirming(true)
    try {
      const r = await api.post(`/orders/track/${order.order_number}/confirm`)
      if (r.data.success) {
        setOrder(prev => ({ ...prev, status: 'delivered' }))
        toast.success('Thank you! Order confirmed as received.')
      }
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to confirm') }
    setConfirming(false)
  }

  const step = order ? statusIndex(order.status, order.delivery_status) : -1
  const canConfirm = order && (order.delivery_status === 'delivered' || order.status === 'shipped') && order.status !== 'completed' && order.status !== 'delivered'

  return (
    <div className="page">
      <h2 style={{ marginBottom: 20 }}><FaTruck style={{ marginRight: 8, color: 'var(--primary)' }} />Track Order</h2>

      {/* Search form */}
      <div className="card" style={{ marginBottom: 24 }}>
        <form onSubmit={handleTrack} style={{ display: 'flex', gap: 10 }}>
          <input className="form-control" placeholder="Enter order number e.g. ORD-1234567890"
            value={orderNumber} onChange={e => setOrderNumber(e.target.value)} style={{ flex: 1 }} />
          <button className="btn" type="submit" disabled={loading} style={{ whiteSpace: 'nowrap' }}>
            <FaSearch style={{ marginRight: 6 }} />{loading ? 'Searching...' : 'Track'}
          </button>
        </form>
        {error && <p style={{ color: 'var(--danger)', marginTop: 12, fontSize: 14 }}>{error}</p>}
      </div>

      {order && (
        <>
          {/* Delivery arrived notification banner */}
          {canConfirm && (
            <div style={{ background: 'rgba(40,167,69,0.1)', border: '2px solid #28a745', borderRadius: 10, padding: '16px 20px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
              <FaBell style={{ color: '#28a745', fontSize: 24, flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <strong style={{ color: '#28a745', display: 'block', marginBottom: 4 }}>Your order has arrived!</strong>
                <p style={{ fontSize: 13, color: 'var(--gray)', margin: 0 }}>
                  The delivery person has marked your order as delivered. Please confirm receipt.
                </p>
              </div>
              <button className="btn btn-success" disabled={confirming} onClick={confirmDelivery} style={{ whiteSpace: 'nowrap' }}>
                <FaCheckCircle style={{ marginRight: 6 }} />{confirming ? 'Confirming...' : 'Confirm Receipt'}
              </button>
            </div>
          )}

          {/* Order summary */}
          <div className="card" style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 4 }}>{order.order_number}</div>
                <div style={{ fontSize: 13, color: 'var(--gray)' }}>Placed: {new Date(order.created_at).toLocaleString()}</div>
                {order.shipping_address && (
                  <div style={{ fontSize: 13, color: 'var(--gray)', marginTop: 4, display: 'flex', alignItems: 'flex-start', gap: 5 }}>
                    <FaMapMarkerAlt style={{ color: 'var(--danger)', marginTop: 2, flexShrink: 0 }} />
                    {order.shipping_address}
                  </div>
                )}
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 700, fontSize: 18, color: 'var(--primary)' }}>ETB {parseFloat(order.total_amount).toFixed(2)}</div>
                <div style={{ fontSize: 12, color: 'var(--gray)', marginTop: 4 }}>
                  Payment: <span style={{ color: order.payment_status === 'completed' ? '#28a745' : 'var(--warning)', fontWeight: 600 }}>
                    {order.payment_status || 'pending'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="card" style={{ marginBottom: 20 }}>
            <h3 style={{ marginBottom: 24 }}>Order Timeline</h3>
            <div style={{ position: 'relative' }}>
              {/* Vertical line */}
              <div style={{ position: 'absolute', left: 19, top: 0, bottom: 0, width: 2, background: '#eee', zIndex: 0 }} />

              {TIMELINE.map((s, i) => {
                const done = i <= step
                const active = i === step
                return (
                  <div key={s.key} style={{ display: 'flex', gap: 16, marginBottom: i < TIMELINE.length - 1 ? 28 : 0, position: 'relative', zIndex: 1 }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
                      background: done ? (active ? 'var(--primary)' : '#28a745') : '#eee',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: done ? 'white' : 'var(--gray)', fontSize: 16,
                      boxShadow: active ? '0 0 0 4px rgba(67,97,238,0.2)' : 'none',
                      transition: 'all 0.3s'
                    }}>
                      {s.icon}
                    </div>
                    <div style={{ paddingTop: 8 }}>
                      <div style={{ fontWeight: done ? 700 : 500, color: done ? 'var(--dark)' : 'var(--gray)', fontSize: 15 }}>
                        {s.label}
                        {active && <span style={{ marginLeft: 8, background: 'var(--primary)', color: 'white', borderRadius: 10, padding: '1px 8px', fontSize: 11 }}>Current</span>}
                      </div>
                      <div style={{ fontSize: 13, color: done ? 'var(--gray)' : '#ccc', marginTop: 2 }}>{s.desc}</div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Delivery person info */}
          {order.driver_first && (
            <div className="card" style={{ marginBottom: 20 }}>
              <h3 style={{ marginBottom: 14 }}><FaTruck style={{ marginRight: 8, color: 'var(--primary)' }} />Delivery Person</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: 18 }}>
                  {order.driver_first?.[0]}{order.driver_last?.[0]}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 16 }}>{order.driver_first} {order.driver_last}</div>
                  <div style={{ fontSize: 13, color: 'var(--gray)' }}>
                    Status: <strong style={{ color: 'var(--primary)' }}>{order.delivery_status?.replace(/_/g, ' ') || '—'}</strong>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  {order.driver_phone && (
                    <a href={`tel:${order.driver_phone}`} className="btn btn-outline" style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 5 }}>
                      <FaPhone /> Call
                    </a>
                  )}
                  {user && (
                    <Link to="/chat" className="btn btn-outline" style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 5 }}>
                      <FaComments /> Chat
                    </Link>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Confirmed */}
          {(order.status === 'completed' || order.status === 'delivered') && (
            <div style={{ background: 'rgba(40,167,69,0.08)', border: '1px solid #28a745', borderRadius: 10, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
              <FaCheckCircle style={{ color: '#28a745', fontSize: 24 }} />
              <div>
                <strong style={{ color: '#28a745' }}>Order Delivered Successfully</strong>
                <p style={{ fontSize: 13, color: 'var(--gray)', margin: '4px 0 0' }}>Thank you for your order!</p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
