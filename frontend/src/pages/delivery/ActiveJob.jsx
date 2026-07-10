import { useState, useEffect } from 'react'
import { FaTruck, FaMapMarkerAlt, FaPhone, FaCheckCircle } from 'react-icons/fa'
import { useAuth } from '../../context/AuthContext'
import { useLanguage } from '../../context/LanguageContext'
import api from '../../services/api'
import toast from 'react-hot-toast'

export default function ActiveJob() {
  const { user } = useAuth()
  const { t } = useLanguage()
  const [job, setJob] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/delivery/jobs/active').then(r => {
      if (r.data.success) setJob(r.data.job)
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const complete = async () => {
    if (!window.confirm('Mark this delivery as completed?')) return
    try {
      const r = await api.put(`/delivery/jobs/${job.id}`, { status: 'completed' })
      if (r.data.success) { setJob(null); toast.success('Delivery completed!') }
    } catch { toast.error('Failed to update') }
  }

  if (loading) return <div className="page"><p>{t('loading')}</p></div>

  return (
    <div className="page">
      <h2 style={{ marginBottom: 20 }}><FaTruck style={{ marginRight: 8, color: 'var(--primary)' }} />Active Job</h2>

      {!job ? (
        <div className="card" style={{ textAlign: 'center', padding: 50 }}>
          <FaCheckCircle style={{ fontSize: 56, color: '#28a745', marginBottom: 16 }} />
          <h3>No active delivery</h3>
          <p style={{ color: 'var(--gray)' }}>You have no delivery in progress right now.</p>
        </div>
      ) : (
        <div className="card" style={{ maxWidth: 600 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <div style={{ background: 'var(--primary)', color: 'white', borderRadius: 8, padding: '8px 14px', fontWeight: 700 }}>
              {job.order_number || `#${job.order_id}`}
            </div>
            <span className="status-badge status-processing">In Progress</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <FaMapMarkerAlt style={{ color: 'var(--danger)', marginTop: 2, flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: 12, color: 'var(--gray)', marginBottom: 2 }}>Pickup</div>
                <div style={{ fontWeight: 500 }}>{job.pickup_address || 'NancyMobile Store'}</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <FaMapMarkerAlt style={{ color: '#28a745', marginTop: 2, flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: 12, color: 'var(--gray)', marginBottom: 2 }}>Deliver to</div>
                <div style={{ fontWeight: 500 }}>{job.delivery_address || job.shipping_address || '—'}</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <FaPhone style={{ color: 'var(--primary)', marginTop: 2, flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: 12, color: 'var(--gray)', marginBottom: 2 }}>Customer</div>
                <div style={{ fontWeight: 500 }}>{job.customer_first} {job.customer_last}</div>
                {job.customer_phone && <div style={{ fontSize: 13, color: 'var(--gray)' }}>{job.customer_phone}</div>}
              </div>
            </div>
            {job.notes && (
              <div style={{ background: '#f8f9fa', borderRadius: 6, padding: '10px 14px', fontSize: 13 }}>
                <strong>Note:</strong> {job.notes}
              </div>
            )}
          </div>

          <button className="btn btn-success btn-block" style={{ marginTop: 24 }} onClick={complete}>
            <FaCheckCircle style={{ marginRight: 8 }} />Mark as Delivered
          </button>
        </div>
      )}
    </div>
  )
}
