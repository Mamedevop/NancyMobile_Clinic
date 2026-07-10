import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { FaShoppingBag, FaClipboardList, FaTools, FaCreditCard } from 'react-icons/fa'
import { useAuth } from '../../context/AuthContext'
import api from '../../services/api'

export default function CustomerDashboard() {
  const { user } = useAuth()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/orders').then(r => {
      if (r.data.success) setOrders(r.data.orders || [])
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const stats = [
    { label: 'Total Orders', value: orders.length, icon: <FaClipboardList />, color: 'primary' },
    { label: 'Pending Orders', value: orders.filter(o => o.status === 'pending').length, icon: <FaShoppingBag />, color: 'warning' },
    { label: 'Completed Orders', value: orders.filter(o => o.status === 'delivered' || o.status === 'completed').length, icon: <FaShoppingBag />, color: 'success' },
    { label: 'Repair Requests', value: 0, icon: <FaTools />, color: 'danger' },
  ]

  const statusClass = (s) => {
    if (s === 'delivered' || s === 'completed') return 'status-badge status-completed'
    if (s === 'processing') return 'status-badge status-processing'
    if (s === 'cancelled') return 'status-badge status-cancelled'
    return 'status-badge status-pending'
  }

  return (
    <div className="page">
      <h2 style={{ marginBottom: 20 }}>Welcome back, {user?.firstName}!</h2>

      {!user?.is_verified && (
        <div style={{ background: 'rgba(248,150,30,0.1)', border: '1px solid var(--warning)', borderRadius: 8, padding: '15px 20px', marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <strong style={{ color: 'var(--warning)' }}>Account not verified</strong>
            <p style={{ fontSize: 13, color: 'var(--gray)', marginTop: 4 }}>
              {user?.verification_status === 'pending'
                ? 'Your profile is under review. You\'ll get full access once verified.'
                : 'Complete your profile and submit for verification to access cart, orders and repairs.'}
            </p>
          </div>
          <Link to="/profile" className="btn" style={{ whiteSpace: 'nowrap', marginLeft: 15 }}>Complete Profile</Link>
        </div>
      )}

      <div className="stats-grid">
        {stats.map((s, i) => (
          <div className="stat-card" key={i}>
            <div className={`stat-icon ${s.color}`}>{s.icon}</div>
            <div className="stat-info">
              <h3>{s.value}</h3>
              <p>{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Recent Orders</h3>
          <Link to="/orders" style={{ color: 'var(--primary)', fontSize: 14 }}>View All</Link>
        </div>
        {loading ? <p>Loading...</p> : orders.length === 0 ? (
          <p style={{ color: 'var(--gray)', textAlign: 'center', padding: 20 }}>
            No orders yet. <Link to="/products" style={{ color: 'var(--primary)' }}>Start shopping!</Link>
          </p>
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Order #</th>
                  <th>Date</th>
                  <th>Total</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {orders.slice(0, 5).map(o => (
                  <tr key={o.id}>
                    <td>{o.order_number || `#${o.id}`}</td>
                    <td>{new Date(o.created_at).toLocaleDateString()}</td>
                    <td>ETB {parseFloat(o.total_amount).toFixed(2)}</td>
                    <td><span className={statusClass(o.status)}>{o.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 15, marginTop: 10 }}>
        {[
          { to: '/products', icon: <FaShoppingBag />, label: 'Browse Products', color: 'var(--primary)' },
          { to: '/orders', icon: <FaClipboardList />, label: 'My Orders', color: '#28a745' },
          { to: '/repairs', icon: <FaTools />, label: 'Repair Services', color: 'var(--warning)' },
          { to: '/payments', icon: <FaCreditCard />, label: 'Payments', color: 'var(--danger)' },
        ].map(({ to, icon, label, color }) => (
          <Link key={to} to={to} style={{ textDecoration: 'none' }}>
            <div className="card" style={{ textAlign: 'center', cursor: 'pointer', transition: 'var(--transition)' }}>
              <div style={{ fontSize: 32, color, marginBottom: 10 }}>{icon}</div>
              <p style={{ fontWeight: 600 }}>{label}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}

