import { useState, useEffect } from 'react'
import { FaBell, FaCheck, FaTimes, FaPhone, FaMapMarkerAlt, FaMobileAlt, FaLock } from 'react-icons/fa'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useLanguage } from '../../context/LanguageContext'
import api from '../../services/api'
import toast from 'react-hot-toast'

export default function JobRequests() {
  const { user } = useAuth()
  const { t } = useLanguage()
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(null)
  const isVerified = user?.is_verified

  useEffect(() => {
    if (!isVerified) { setLoading(false); return }
    fetchRequests()
    const interval = setInterval(fetchRequests, 15000) // poll every 15s
    return () => clearInterval(interval)
  }, [isVerified])

  const fetchRequests = () => {
    api.get('/technician/job-requests').then(r => {
      if (r.data.success) setRequests(r.data.requests)
    }).catch(() => {}).finally(() => setLoading(false))
  }

  const accept = async (id) => {
    try {
      const r = await api.post(`/technician/job-requests/${id}/accept`)
      if (r.data.success) {
        setRequests(prev => prev.filter(req => req.id !== id))
        toast.success('Job accepted! Check your Repairs page.')
      }
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to accept') }
  }

  const reject = async (id) => {
    await api.post(`/technician/job-requests/${id}/reject`).catch(() => {})
    setRequests(prev => prev.filter(req => req.id !== id))
    toast('Job declined.')
  }

  if (!isVerified) return (
    <div className="page">
      <h2 style={{ marginBottom: 20 }}><FaBell style={{ marginRight: 8, color: 'var(--primary)' }} />Job Requests</h2>
      <div style={{ background: 'rgba(248,150,30,0.1)', border: '1px solid var(--warning)', borderRadius: 8, padding: '24px 20px', display: 'flex', alignItems: 'center', gap: 16 }}>
        <FaLock style={{ color: 'var(--warning)', fontSize: 28, flexShrink: 0 }} />
        <div>
          <strong style={{ color: 'var(--warning)', display: 'block', marginBottom: 6 }}>{t('accountNotVerified')}</strong>
          <p style={{ fontSize: 13, color: 'var(--gray)', margin: 0 }}>{user?.verification_status === 'pending' ? t('verificationPending') : t('verificationComplete')}</p>
        </div>
        <Link to="/technician/profile" className="btn" style={{ marginLeft: 'auto' }}>{t('completeProfile')}</Link>
      </div>
    </div>
  )

  return (
    <div className="page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2><FaBell style={{ marginRight: 8, color: 'var(--primary)' }} />Job Requests</h2>
        {requests.length > 0 && (
          <span style={{ background: 'var(--danger)', color: 'white', borderRadius: 12, padding: '3px 10px', fontSize: 13, fontWeight: 700 }}>
            {requests.length} new
          </span>
        )}
      </div>

      {loading ? <p>{t('loading')}</p> : requests.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 50 }}>
          <FaBell style={{ fontSize: 48, color: '#ddd', marginBottom: 16 }} />
          <h3>No new job requests</h3>
          <p style={{ color: 'var(--gray)' }}>New repair requests from customers will appear here.</p>
        </div>
      ) : requests.map(req => (
        <div className="card" key={req.id} style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <span style={{ fontWeight: 700, color: 'var(--primary)', fontSize: 16 }}>#{req.id}</span>
                {req.assigned_to
                  ? <span style={{ background: 'rgba(67,97,238,0.15)', color: 'var(--primary)', borderRadius: 10, padding: '2px 10px', fontSize: 12, fontWeight: 600 }}>⭐ Direct Request</span>
                  : <span className="status-badge status-pending">Open Request</span>
                }
                <span style={{ fontSize: 12, color: 'var(--gray)' }}>{new Date(req.created_at).toLocaleString()}</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                  <FaMobileAlt style={{ color: 'var(--primary)', marginTop: 2, flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--gray)' }}>Device</div>
                    <div style={{ fontWeight: 600 }}>{req.device_type}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                  <FaPhone style={{ color: 'var(--primary)', marginTop: 2, flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--gray)' }}>Customer</div>
                    <div style={{ fontWeight: 600 }}>{req.first_name} {req.last_name}</div>
                    <div style={{ fontSize: 13, color: 'var(--gray)' }}>{req.customer_phone || req.customer_email}</div>
                  </div>
                </div>
                {req.customer_address && (
                  <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                    <FaMapMarkerAlt style={{ color: 'var(--danger)', marginTop: 2, flexShrink: 0 }} />
                    <div>
                      <div style={{ fontSize: 11, color: 'var(--gray)' }}>Location</div>
                      <div style={{ fontSize: 13 }}>{req.customer_address}</div>
                    </div>
                  </div>
                )}
              </div>

              <div style={{ marginTop: 12, background: '#f8f9fa', borderRadius: 6, padding: '10px 14px', fontSize: 14 }}>
                <strong>Issue: </strong>{req.issue_description}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 120 }}>
              <button className="btn btn-success" style={{ display: 'flex', alignItems: 'center', gap: 6 }} onClick={() => accept(req.id)}>
                <FaCheck /> Accept
              </button>
              <button className="btn btn-danger" style={{ display: 'flex', alignItems: 'center', gap: 6 }} onClick={() => reject(req.id)}>
                <FaTimes /> Decline
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
