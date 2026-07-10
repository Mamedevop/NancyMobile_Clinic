import { useState, useEffect } from 'react'
import { FaClipboardCheck, FaTrash } from 'react-icons/fa'
import { useLanguage } from '../../context/LanguageContext'
import api from '../../services/api'
import toast from 'react-hot-toast'

const STATUSES = ['pending', 'processing', 'shipped', 'delivered', 'cancelled']

export default function ManageOrders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const { t } = useLanguage()

  useEffect(() => {
    api.get('/admin/orders').then(r => {
      if (r.data.success) setOrders(r.data.orders || [])
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const updateStatus = async (id, status) => {
    try {
      await api.put(`/admin/orders/${id}/status`, { status })
      setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o))
      toast.success('Order status updated')
    } catch { toast.error('Failed to update order') }
  }

  const deleteOrder = async (id, orderNum) => {
    if (!window.confirm(`Delete order ${orderNum}? This cannot be undone.`)) return
    try {
      await api.delete(`/admin/orders/${id}`)
      setOrders(prev => prev.filter(o => o.id !== id))
      toast.success('Order deleted')
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to delete order') }
  }

  const statusClass = (s) => {
    if (s === 'delivered') return 'status-badge status-completed'
    if (s === 'processing' || s === 'shipped') return 'status-badge status-processing'
    if (s === 'cancelled') return 'status-badge status-cancelled'
    return 'status-badge status-pending'
  }

  return (
    <div className="page">
      <h2 style={{ marginBottom: 20 }}><FaClipboardCheck style={{ marginRight: 8, color: 'var(--primary)' }} />{t('ordersManagement')}</h2>
      <div className="table-container">
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr><th>{t('orderNumber')}</th><th>{t('customerLabel')}</th><th>{t('total')}</th><th>{t('status')}</th><th>{t('date')}</th><th>{t('updateStatus')}</th><th>{t('delete')}</th></tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="7" style={{ textAlign: 'center', padding: 20 }}>{t('loading')}</td></tr>
              ) : orders.length === 0 ? (
                <tr><td colSpan="7" style={{ textAlign: 'center', padding: 20, color: 'var(--gray)' }}>{t('noOrdersFound')}</td></tr>
              ) : orders.map(o => (
                <tr key={o.id}>
                  <td>{o.order_number || `#${o.id}`}</td>
                  <td>{o.customer_name || o.user_email || '-'}</td>
                  <td>ETB {parseFloat(o.total_amount).toFixed(2)}</td>
                  <td><span className={statusClass(o.status)}>{o.status}</span></td>
                  <td>{new Date(o.created_at).toLocaleDateString()}</td>
                  <td>
                    <select className="form-control" style={{ padding: '6px', fontSize: 13, width: 140 }}
                      value={o.status} onChange={e => updateStatus(o.id, e.target.value)}>
                      {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                  <td>
                    <button className="btn btn-danger" style={{ padding: '6px 10px', fontSize: 12 }}
                      title="Delete order"
                      onClick={() => deleteOrder(o.id, o.order_number || `#${o.id}`)}>
                      <FaTrash />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

