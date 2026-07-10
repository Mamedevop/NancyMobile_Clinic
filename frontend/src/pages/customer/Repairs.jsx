import { useState, useEffect } from 'react'
import { FaTools, FaPlus, FaLock, FaStar, FaRegStar, FaCheckCircle, FaUser } from 'react-icons/fa'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useLanguage } from '../../context/LanguageContext'
import api from '../../services/api'
import toast from 'react-hot-toast'

const Stars = ({ rating }) => (
  <span style={{ color: '#f8961e', fontSize: 12 }}>
    {[1,2,3,4,5].map(i => i <= Math.round(rating) ? <FaStar key={i} /> : <FaRegStar key={i} />)}
  </span>
)

export default function Repairs() {
  const [repairs, setRepairs] = useState([])
  const [technicians, setTechnicians] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ device_type: '', issue_description: '', preferred_technician_id: '' })
  const [submitting, setSubmitting] = useState(false)
  const { user } = useAuth()
  const { t } = useLanguage()
  const isVerified = user?.is_verified

  useEffect(() => {
    api.get('/repairs').then(r => {
      if (r.data.success) setRepairs(r.data.repairs || [])
    }).catch(() => {}).finally(() => setLoading(false))

    if (isVerified) {
      api.get('/repairs/available-technicians').then(r => {
        if (r.data.success) setTechnicians(r.data.technicians || [])
      }).catch(() => {})
    }
  }, [isVerified])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const r = await api.post('/repairs', form)
      if (r.data.success) {
        setRepairs(prev => [r.data.repair, ...prev])
        setForm({ device_type: '', issue_description: '', preferred_technician_id: '' })
        setShowForm(false)
        const msg = form.preferred_technician_id
          ? 'Request sent directly to the technician!'
          : t('repairSubmitted')
        toast.success(msg)
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit repair request')
    }
    setSubmitting(false)
  }

  const statusClass = (s) => {
    if (s === 'completed') return 'status-badge status-completed'
    if (s === 'in-progress' || s === 'diagnosed') return 'status-badge status-processing'
    if (s === 'cancelled') return 'status-badge status-cancelled'
    return 'status-badge status-pending'
  }

  return (
    <div className="page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2><FaTools style={{ marginRight: 8, color: 'var(--primary)' }} />{t('repairServices')}</h2>
        {isVerified && (
          <button className="btn" onClick={() => setShowForm(!showForm)}>
            <FaPlus style={{ marginRight: 6 }} /> {t('newRequest')}
          </button>
        )}
      </div>

      {/* Verification gate */}
      {!isVerified && (
        <div style={{ background: 'rgba(248,150,30,0.1)', border: '1px solid var(--warning)', borderRadius: 8, padding: '16px 20px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 14 }}>
          <FaLock style={{ color: 'var(--warning)', fontSize: 22, flexShrink: 0 }} />
          <div>
            <strong style={{ color: 'var(--warning)', display: 'block', marginBottom: 4 }}>{t('accountNotVerified')}</strong>
            <p style={{ fontSize: 13, color: 'var(--gray)', margin: 0 }}>
              {user?.verification_status === 'pending' ? t('verificationPending') : t('verificationComplete')}
            </p>
          </div>
          <Link to="/profile" className="btn" style={{ marginLeft: 'auto', whiteSpace: 'nowrap' }}>{t('completeProfile')}</Link>
        </div>
      )}

      {/* New request form */}
      {isVerified && showForm && (
        <div className="card" style={{ marginBottom: 20 }}>
          <h3 style={{ marginBottom: 15 }}>{t('submitRepairRequest')}</h3>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 15 }}>
              <div className="form-group">
                <label>{t('deviceType')} *</label>
                <input className="form-control" placeholder="e.g. iPhone 13 Pro, Samsung Galaxy S22"
                  value={form.device_type} onChange={e => setForm({ ...form, device_type: e.target.value })} required />
              </div>
            </div>
            <div className="form-group">
              <label>{t('issueDescription')} *</label>
              <textarea className="form-control" rows="3" placeholder="Describe the problem in detail..."
                value={form.issue_description} onChange={e => setForm({ ...form, issue_description: e.target.value })} required />
            </div>

            {/* Technician picker */}
            <div className="form-group">
              <label style={{ marginBottom: 10, display: 'block' }}>
                Choose a Technician <span style={{ color: 'var(--gray)', fontWeight: 400, fontSize: 13 }}>(optional — leave blank to let any available technician accept)</span>
              </label>

              {technicians.length === 0 ? (
                <div style={{ background: '#f8f9fa', borderRadius: 8, padding: '14px 16px', fontSize: 13, color: 'var(--gray)' }}>
                  No technicians are online right now. Your request will be visible to all technicians.
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
                  {/* "Any technician" option */}
                  <div onClick={() => setForm({ ...form, preferred_technician_id: '' })}
                    style={{
                      border: `2px solid ${!form.preferred_technician_id ? 'var(--primary)' : '#ddd'}`,
                      borderRadius: 10, padding: '14px 16px', cursor: 'pointer',
                      background: !form.preferred_technician_id ? 'rgba(67,97,238,0.05)' : 'white',
                      transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: 10
                    }}>
                    <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <FaTools style={{ color: 'var(--gray)' }} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>Any Technician</div>
                      <div style={{ fontSize: 12, color: 'var(--gray)' }}>First available</div>
                    </div>
                    {!form.preferred_technician_id && <FaCheckCircle style={{ color: 'var(--primary)', marginLeft: 'auto' }} />}
                  </div>

                  {technicians.map(tech => (
                    <div key={tech.id} onClick={() => setForm({ ...form, preferred_technician_id: tech.id })}
                      style={{
                        border: `2px solid ${form.preferred_technician_id === tech.id ? 'var(--primary)' : '#ddd'}`,
                        borderRadius: 10, padding: '14px 16px', cursor: 'pointer',
                        background: form.preferred_technician_id === tech.id ? 'rgba(67,97,238,0.05)' : 'white',
                        transition: 'all 0.15s'
                      }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                        {tech.profile_picture
                          ? <img src={tech.profile_picture} alt="" style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }} />
                          : <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: 14 }}>
                              {tech.first_name?.[0]}{tech.last_name?.[0]}
                            </div>
                        }
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600, fontSize: 14 }}>{tech.first_name} {tech.last_name}</div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Stars rating={tech.avg_rating || 0} />
                            <span style={{ fontSize: 11, color: 'var(--gray)' }}>
                              {tech.avg_rating ? `${parseFloat(tech.avg_rating).toFixed(1)}` : 'New'}
                            </span>
                          </div>
                        </div>
                        {form.preferred_technician_id === tech.id && <FaCheckCircle style={{ color: 'var(--primary)' }} />}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--gray)' }}>
                        {tech.completed_jobs || 0} job{tech.completed_jobs !== 1 ? 's' : ''} completed
                      </div>
                      <div style={{ marginTop: 4 }}>
                        <span style={{ background: 'rgba(40,167,69,0.1)', color: '#28a745', borderRadius: 10, padding: '2px 8px', fontSize: 11, fontWeight: 600 }}>
                          ● Online
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
              <button className="btn btn-success" type="submit" disabled={submitting}>
                {submitting ? t('submitting') : form.preferred_technician_id ? 'Send to Technician' : t('submitRequest')}
              </button>
              <button className="btn btn-outline" type="button" onClick={() => setShowForm(false)}>{t('cancel')}</button>
            </div>
          </form>
        </div>
      )}

      {/* My repair requests */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">{t('myRepairRequests')}</h3>
        </div>
        {loading ? <p>{t('loading')}</p> : repairs.length === 0 ? (
          <p style={{ color: 'var(--gray)', textAlign: 'center', padding: 20 }}>{t('noRepairsYet')}</p>
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th><th>{t('deviceType')}</th><th>{t('issueDescription')}</th>
                  <th>Technician</th><th>{t('status')}</th><th>{t('estimatedCost')}</th><th>{t('date')}</th>
                </tr>
              </thead>
              <tbody>
                {repairs.map(r => (
                  <tr key={r.id}>
                    <td>#{r.id}</td>
                    <td>{r.device_type}</td>
                    <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.issue_description}</td>
                    <td style={{ fontSize: 13 }}>
                      {r.tech_first
                        ? <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                            <FaUser style={{ color: 'var(--primary)', fontSize: 11 }} />
                            {r.tech_first} {r.tech_last}
                          </span>
                        : <span style={{ color: 'var(--gray)', fontSize: 12 }}>Awaiting</span>}
                    </td>
                    <td><span className={statusClass(r.status)}>{r.status}</span></td>
                    <td>{r.estimated_cost ? `ETB ${r.estimated_cost}` : 'TBD'}</td>
                    <td>{new Date(r.created_at).toLocaleDateString()}</td>
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
