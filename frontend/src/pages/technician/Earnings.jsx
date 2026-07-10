import { useState, useEffect } from 'react'
import { FaMoneyBillWave, FaCalendarDay, FaCalendarWeek, FaChartBar } from 'react-icons/fa'
import { useLanguage } from '../../context/LanguageContext'
import api from '../../services/api'

export default function TechEarnings() {
  const { t } = useLanguage()
  const [earnings, setEarnings] = useState({ total: 0, daily: 0, weekly: 0, breakdown: [] })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/technician/earnings').then(r => {
      if (r.data.success) setEarnings(r.data.earnings)
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const cards = [
    { label: 'Total Earned', value: earnings.total, icon: <FaMoneyBillWave />, color: 'success' },
    { label: "Today's Income", value: earnings.daily, icon: <FaCalendarDay />, color: 'primary' },
    { label: 'This Week', value: earnings.weekly, icon: <FaCalendarWeek />, color: 'warning' },
  ]

  if (loading) return <div className="page"><p>{t('loading')}</p></div>

  return (
    <div className="page">
      <h2 style={{ marginBottom: 20 }}><FaMoneyBillWave style={{ marginRight: 8, color: 'var(--primary)' }} />Earnings & Payments</h2>

      <div className="stats-grid" style={{ marginBottom: 24 }}>
        {cards.map((c, i) => (
          <div className="stat-card" key={i}>
            <div className={`stat-icon ${c.color}`}>{c.icon}</div>
            <div className="stat-info">
              <h3>ETB {parseFloat(c.value).toFixed(2)}</h3>
              <p>{c.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <FaChartBar style={{ color: 'var(--primary)' }} />
          <h3 style={{ margin: 0 }}>Daily Income (Last 30 Days)</h3>
        </div>
        {earnings.breakdown.length === 0 ? (
          <p style={{ color: 'var(--gray)', textAlign: 'center', padding: 30 }}>No earnings recorded yet.</p>
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead><tr><th>Date</th><th>Jobs Completed</th><th>Revenue (ETB)</th></tr></thead>
              <tbody>
                {earnings.breakdown.map((row, i) => (
                  <tr key={i}>
                    <td>{row.day}</td>
                    <td>{row.jobs}</td>
                    <td style={{ fontWeight: 600, color: '#28a745' }}>ETB {parseFloat(row.revenue).toFixed(2)}</td>
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
