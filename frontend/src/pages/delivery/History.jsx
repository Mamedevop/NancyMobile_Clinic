import { useState, useEffect } from 'react'
import { FaHistory } from 'react-icons/fa'
import { useLanguage } from '../../context/LanguageContext'
import api from '../../services/api'

export default function DeliveryHistory() {
  const { t } = useLanguage()
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/delivery/jobs').then(r => {
      if (r.data.success) setJobs(r.data.jobs.filter(j => j.status === 'completed' || j.status === 'cancelled'))
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  return (
    <div className="page">
      <h2 style={{ marginBottom: 20 }}><FaHistory style={{ marginRight: 8, color: 'var(--primary)' }} />Delivery History</h2>
      <div className="card">
        {loading ? <p style={{ padding: 20 }}>{t('loading')}</p> : jobs.length === 0 ? (
          <p style={{ color: 'var(--gray)', textAlign: 'center', padding: 30 }}>No completed deliveries yet.</p>
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr><th>Order</th><th>Customer</th><th>Address</th><th>Status</th><th>Completed</th></tr>
              </thead>
              <tbody>
                {jobs.map(j => (
                  <tr key={j.id}>
                    <td>{j.order_number || `#${j.order_id}`}</td>
                    <td>{j.customer_first} {j.customer_last}</td>
                    <td style={{ fontSize: 13 }}>{j.delivery_address || j.shipping_address || '—'}</td>
                    <td>
                      <span className={j.status === 'completed' ? 'status-badge status-completed' : 'status-badge status-cancelled'}>
                        {j.status}
                      </span>
                    </td>
                    <td style={{ fontSize: 13 }}>{j.completed_at ? new Date(j.completed_at).toLocaleDateString() : '—'}</td>
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
