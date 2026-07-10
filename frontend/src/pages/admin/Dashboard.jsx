import { useState, useEffect } from 'react'
import { FaUsers, FaShoppingBag, FaMoneyBillWave, FaTools } from 'react-icons/fa'
import { useLanguage } from '../../context/LanguageContext'
import api from '../../services/api'

export default function AdminDashboard() {
  const [stats, setStats] = useState({ users: 0, orders: 0, revenue: 0, repairs: 0 })
  const [recentOrders, setRecentOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const { t } = useLanguage()

  useEffect(() => {
    Promise.all([
      api.get('/admin/dashboard/stats').catch(() => ({ data: {} })),
      api.get('/admin/orders?limit=5').catch(() => ({ data: { orders: [] } }))
    ]).then(([statsRes, ordersRes]) => {
      if (statsRes.data.success) setStats(statsRes.data.stats || stats)
      if (ordersRes.data.success) setRecentOrders(ordersRes.data.orders || [])
    }).finally(() => setLoading(false))
  }, [])

  const statCards = [
    { label: t('totalUsers'), value: stats.users || 0, icon: <FaUsers />, color: 'primary' },
    { label: t('totalOrders'), value: stats.orders || 0, icon: <FaShoppingBag />, color: 'success' },
    { label: `${t('totalRevenue')} (ETB)`, value: `${parseFloat(stats.revenue || 0).toFixed(2)}`, icon: <FaMoneyBillWave />, color: 'warning' },
    { label: t('repairRequests'), value: stats.repairs || 0, icon: <FaTools />, color: 'danger' },
  ]

  const statusClass = (s) => {
    if (s === 'delivered' || s === 'completed') return 'status-badge status-completed'
    if (s === 'processing') return 'status-badge status-processing'
    if (s === 'cancelled') return 'status-badge status-cancelled'
    return 'status-badge status-pending'
  }

  return (
    <div className="page">
      <h2 style={{ marginBottom: 20 }}>{t('adminDashboard')}</h2>
      <div className="stats-grid">
        {statCards.map((s, i) => (
          <div className="stat-card" key={i}>
            <div className={`stat-icon ${s.color}`}>{s.icon}</div>
            <div className="stat-info"><h3>{s.value}</h3><p>{s.label}</p></div>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="card-header"><h3 className="card-title">{t('recentOrders')}</h3></div>
        {loading ? <p>{t('loading')}</p> : recentOrders.length === 0 ? (
          <p style={{ color: 'var(--gray)', textAlign: 'center', padding: 20 }}>{t('noOrdersYet')}</p>
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr><th>{t('orderNumber')}</th><th>{t('customerLabel')}</th><th>{t('total')}</th><th>{t('status')}</th><th>{t('date')}</th></tr>
              </thead>
              <tbody>
                {recentOrders.map(o => (
                  <tr key={o.id}>
                    <td>{o.order_number || `#${o.id}`}</td>
                    <td>{o.customer_name || o.user_email || '-'}</td>
                    <td>ETB {parseFloat(o.total_amount).toFixed(2)}</td>
                    <td><span className={statusClass(o.status)}>{o.status}</span></td>
                    <td>{new Date(o.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
