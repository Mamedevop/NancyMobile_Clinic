import { useState, useEffect } from 'react'
import { FaHistory, FaChevronDown, FaChevronUp } from 'react-icons/fa'
import { useLanguage } from '../../context/LanguageContext'
import api from '../../services/api'

export default function RepairHistory() {
  const { t } = useLanguage()
  const [repairs, setRepairs] = useState([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(null)

  useEffect(() => {
    api.get('/technician/history').then(r => {
      if (r.data.success) setRepairs(r.data.repairs)
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  return (
    <div className="page">
      <h2 style={{ marginBottom: 20 }}><FaHistory style={{ marginRight: 8, color: 'var(--primary)' }} />Repair History</h2>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ margin: 0 }}>Completed Jobs ({repairs.length})</h3>
        </div>
        {loading ? <p style={{ padding: 20 }}>{t('loading')}</p> : repairs.length === 0 ? (
          <p style={{ color: 'var(--gray)', textAlign: 'center', padding: 30 }}>No completed repairs yet.</p>
        ) : repairs.map(r => (
          <div key={r.id} style={{ borderBottom: '1px solid #eee' }}>
            <div onClick={() => setExpanded(expanded === r.id ? null : r.id)}
              style={{ padding: '14px 16px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
                <span style={{ fontWeight: 700, color: 'var(--primary)' }}>#{r.id}</span>
                <span style={{ fontWeight: 600 }}>{r.device_type}</span>
                <span className="status-badge status-completed">Completed</span>
                {r.estimated_cost && <span style={{ color: '#28a745', fontWeight: 600 }}>ETB {parseFloat(r.estimated_cost).toFixed(2)}</span>}
                <span style={{ fontSize: 12, color: 'var(--gray)' }}>{r.completed_at ? new Date(r.completed_at).toLocaleDateString() : '—'}</span>
              </div>
              {expanded === r.id ? <FaChevronUp style={{ color: 'var(--gray)' }} /> : <FaChevronDown style={{ color: 'var(--gray)' }} />}
            </div>
            {expanded === r.id && (
              <div style={{ padding: '0 16px 16px', background: '#f8f9fa', borderTop: '1px solid #eee' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
                  {[
                    ['Customer', `${r.first_name} ${r.last_name}`],
                    ['Email', r.customer_email],
                    ['Phone', r.customer_phone || '—'],
                    ['Issue', r.issue_description],
                    ['Notes', r.notes || '—'],
                    ['Cost', r.estimated_cost ? `ETB ${parseFloat(r.estimated_cost).toFixed(2)}` : '—'],
                  ].map(([label, value]) => (
                    <div key={label}>
                      <div style={{ fontSize: 11, color: 'var(--gray)', marginBottom: 2 }}>{label}</div>
                      <div style={{ fontSize: 14, fontWeight: 500 }}>{value}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
