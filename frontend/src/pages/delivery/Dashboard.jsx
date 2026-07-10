import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { FaTruck, FaBoxOpen, FaCheckCircle, FaClipboardList, FaLock } from 'react-icons/fa'
import { useAuth } from '../../context/AuthContext'
import { useLanguage } from '../../context/LanguageContext'
import api from '../../services/api'

export default function DeliveryDashboard() {
  const { user } = useAuth()
  const { t } = useLanguage()
  const [stats, setStats] = useState({ pending: 0, active: 0, completed: 0, total: 0 })
  const isVerified = user?.is_verified

  useEffect(() => {
    if (!isVerified) return
    api.get('/delivery/stats').then(r => {
      if (r.data.success) setStats(r.data.stats)
    }).catch(() => {})
  }, [isVerified])

  const cards = [
    { label: t('pending') || 'Pending', value: stats.pending, icon: <FaClipboardList />, color: 'warning' },
    { label: t('inProgress') || 'Active', value: stats.active, icon: <FaTruck />, color: 'primary' },
    { label: t('completed') || 'Completed', value: stats.completed, icon: <FaCheckCircle />, color: 'success' },
    { label: 'Total Jobs', value: stats.total, icon: <FaBoxOpen />, color: 'danger' },
  ]

  return (
    <div className="page">
      <h2 style={{ marginBottom: 20 }}>{t('welcome')}, {user?.firstName}!</h2>

      {!isVerified && (
        <div style={{ background: 'rgba(248,150,30,0.1)', border: '1px solid var(--warning)', borderRadius: 8, padding: '16px 20px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 14 }}>
          <FaLock style={{ color: 'var(--warning)', fontSize: 22, flexShrink: 0 }} />
          <div>
            <strong style={{ color: 'var(--warning)', display: 'block', marginBottom: 4 }}>{t('accountNotVerified')}</strong>
            <p style={{ fontSize: 13, color: 'var(--gray)', margin: 0 }}>
              {user?.verification_status === 'pending' ? t('verificationPending') : t('verificationComplete')}
            </p>
          </div>
          <Link to="/delivery/profile" className="btn" style={{ marginLeft: 'auto', whiteSpace: 'nowrap' }}>{t('completeProfile')}</Link>
        </div>
      )}

      <div className="stats-grid" style={{ opacity: isVerified ? 1 : 0.4, pointerEvents: isVerified ? 'auto' : 'none' }}>
        {cards.map((c, i) => (
          <div className="stat-card" key={i}>
            <div className={`stat-icon ${c.color}`}>{c.icon}</div>
            <div className="stat-info"><h3>{c.value}</h3><p>{c.label}</p></div>
          </div>
        ))}
      </div>

      {isVerified && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 20 }}>
          <Link to="/delivery/active" style={{ textDecoration: 'none' }}>
            <div className="card" style={{ textAlign: 'center', padding: 24, cursor: 'pointer' }}>
              <FaTruck style={{ fontSize: 40, color: 'var(--primary)', marginBottom: 10 }} />
              <h3>Active Job</h3>
              <p style={{ color: 'var(--gray)', fontSize: 13 }}>View your current delivery</p>
            </div>
          </Link>
          <Link to="/delivery/tasks" style={{ textDecoration: 'none' }}>
            <div className="card" style={{ textAlign: 'center', padding: 24, cursor: 'pointer' }}>
              <FaClipboardList style={{ fontSize: 40, color: 'var(--warning)', marginBottom: 10 }} />
              <h3>All Tasks</h3>
              <p style={{ color: 'var(--gray)', fontSize: 13 }}>View all assigned deliveries</p>
            </div>
          </Link>
        </div>
      )}
    </div>
  )
}
