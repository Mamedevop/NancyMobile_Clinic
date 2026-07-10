import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { FaClipboardList } from 'react-icons/fa'
import { useLanguage } from '../../context/LanguageContext'
import api from '../../services/api'

export default function Orders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const { t } = useLanguage()

  useEffect(() => {
    api.get('/orders').then(r => {
      if (r.data.success) setOrders(r.data.orders || [])
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const statusClass = (s) => {
    if (s === 'delivered' || s === 'completed') return 'status-badge status-completed'
    if (s === 'processing') return 'status-badge status-processing'
    if (s === 'cancelled') return 'status-badge status-cancelled'
    return 'status-badge status-pending'
  }

  return (
    <div className="page">
      <h2 style={{ marginBottom: 20 }}><FaClipboardList style={{ marginRight: 8, color: 'var(--primary)' }} />{t('myOrders')}</h2>
      <div className="card">
        {loading ? <p>{t('loading')}</p> : orders.length === 0 ? (
          <p style={{ color: 'var(--gray)', textAlign: 'center', padding: 20 }}>
            {t('noOrders')} <Link to="/products" style={{ color: 'var(--primary)' }}>{t('startShopping')}</Link>
          </p>
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr><th>{t('orderNumber')}</th><th>{t('date')}</th><th>{t('items')}</th><th>{t('total')}</th><th>{t('status')}</th><th>{t('action')}</th></tr>
              </thead>
              <tbody>
                {orders.map(o => (
                  <tr key={o.id}>
                    <td>{o.order_number || `#${o.id}`}</td>
                    <td>{new Date(o.created_at).toLocaleDateString()}</td>
                    <td>{o.item_count || '-'}</td>
                    <td>ETB {parseFloat(o.total_amount).toFixed(2)}</td>
                    <td><span className={statusClass(o.status)}>{o.status}</span></td>
                    <td><Link to={`/orders/${o.id}`} style={{ color: 'var(--primary)', fontSize: 14 }}>{t('view')}</Link></td>
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

