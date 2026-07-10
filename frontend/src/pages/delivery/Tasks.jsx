import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FaTruck, FaLock, FaMapMarkerAlt, FaPhone, FaBoxOpen,
  FaCheckCircle, FaMoneyBillWave, FaArrowRight, FaRoute } from 'react-icons/fa'
import { useAuth } from '../../context/AuthContext'
import { useLanguage } from '../../context/LanguageContext'
import api from '../../services/api'
import toast from 'react-hot-toast'

const STATUS_FLOW = {
  pending:    { next: 'on_the_way',  label: 'Start → On the Way',  color: 'btn-success' },
  on_the_way: { next: 'picked_up',   label: 'Confirm Pickup',       color: 'btn-success' },
  picked_up:  { next: 'in-progress', label: 'Start Delivery',       color: 'btn-success' },
  'in-progress': { next: 'delivered', label: 'Mark Delivered',      color: 'btn-success' },
  delivered:  { next: 'completed',   label: 'Complete Job',         color: 'btn-success' },
}

const STATUS_LABELS = {
  pending: 'Pending',
  on_the_way: 'On the Way',
  picked_up: 'Picked Up',
  'in-progress': 'In Progress',
  delivered: 'Delivered',
  completed: 'Completed',
  cancelled: 'Cancelled',
}

const statusClass = (s) => {
  if (s === 'completed') return 'status-badge status-completed'
  if (s === 'in-progress' || s === 'on_the_way' || s === 'picked_up' || s === 'delivered') return 'status-badge status-processing'
  if (s === 'cancelled') return 'status-badge status-cancelled'
  return 'status-badge status-pending'
}

export default function DeliveryTasks() {
  const { user } = useAuth()
  const { t } = useLanguage()
  const navigate = useNavigate()
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(null)
  const [codModal, setCodModal] = useState(null) // job needing COD confirmation
  const [codAmount, setCodAmount] = useState('')
  const isVerified = user?.is_verified

  useEffect(() => {
    if (!isVerified) { setLoading(false); return }
    fetchJobs()
    const interval = setInterval(fetchJobs, 20000)
    return () => clearInterval(interval)
  }, [isVerified])

  const fetchJobs = () => {
    api.get('/delivery/jobs').then(r => {
      if (r.data.success) setJobs(r.data.jobs)
    }).catch(() => {}).finally(() => setLoading(false))
  }

  const advance = async (job) => {
    const flow = STATUS_FLOW[job.status]
    if (!flow) return
    const nextStatus = flow.next

    // If delivering and COD, show payment modal first
    if (nextStatus === 'completed' && job.is_cod && !job.payment_collected) {
      setCodModal(job); setCodAmount(job.cod_amount || '')
      return
    }
    await doUpdate(job.id, { status: nextStatus })
  }

  const confirmCod = async () => {
    await doUpdate(codModal.id, {
      status: 'completed',
      payment_collected: true,
      payment_amount: parseFloat(codAmount) || codModal.cod_amount,
    })
    setCodModal(null)
  }

  const doUpdate = async (id, body) => {
    try {
      const r = await api.put(`/delivery/jobs/${id}`, body)
      if (r.data.success) {
        setJobs(prev => prev.map(j => j.id === id ? r.data.job : j))
        toast.success(`Status: ${STATUS_LABELS[r.data.job.status] || r.data.job.status}`)
      }
    } catch { toast.error('Failed to update') }
  }

  if (!isVerified) return (
    <div className="page">
      <h2 style={{ marginBottom: 20 }}><FaTruck style={{ marginRight: 8, color: 'var(--primary)' }} />Tasks</h2>
      <div style={{ background: 'rgba(248,150,30,0.1)', border: '1px solid var(--warning)', borderRadius: 8, padding: '24px 20px', display: 'flex', alignItems: 'center', gap: 16 }}>
        <FaLock style={{ color: 'var(--warning)', fontSize: 28, flexShrink: 0 }} />
        <div>
          <strong style={{ color: 'var(--warning)', display: 'block', marginBottom: 6 }}>{t('accountNotVerified')}</strong>
          <p style={{ fontSize: 13, color: 'var(--gray)', margin: 0 }}>{user?.verification_status === 'pending' ? t('verificationPending') : t('verificationComplete')}</p>
        </div>
        <Link to="/delivery/profile" className="btn" style={{ marginLeft: 'auto' }}>{t('completeProfile')}</Link>
      </div>
    </div>
  )

  const active = jobs.filter(j => !['completed','cancelled'].includes(j.status))
  const done = jobs.filter(j => ['completed','cancelled'].includes(j.status))

  return (
    <div className="page">
      <h2 style={{ marginBottom: 20 }}><FaTruck style={{ marginRight: 8, color: 'var(--primary)' }} />Delivery Tasks</h2>

      {/* COD Payment Modal */}
      {codModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => setCodModal(null)}>
          <div className="card" style={{ width: 360 }} onClick={e => e.stopPropagation()}>
            <h3 style={{ marginBottom: 16 }}><FaMoneyBillWave style={{ marginRight: 8, color: '#28a745' }} />Collect Cash Payment</h3>
            <p style={{ fontSize: 14, color: 'var(--gray)', marginBottom: 16 }}>
              This is a Cash on Delivery order. Confirm the amount collected from the customer.
            </p>
            <div className="form-group">
              <label>Amount Collected (ETB)</label>
              <input className="form-control" type="number" step="0.01"
                value={codAmount} onChange={e => setCodAmount(e.target.value)}
                placeholder={`Expected: ETB ${codModal.cod_amount || '—'}`} />
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
              <button className="btn btn-success" style={{ flex: 1 }} onClick={confirmCod}>
                <FaCheckCircle style={{ marginRight: 6 }} />Confirm Payment & Complete
              </button>
              <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => setCodModal(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {loading ? <p>{t('loading')}</p> : active.length === 0 && done.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 50 }}>
          <FaTruck style={{ fontSize: 48, color: '#ddd', marginBottom: 16 }} />
          <h3>No tasks assigned yet</h3>
          <p style={{ color: 'var(--gray)' }}>The admin will assign delivery jobs to you.</p>
        </div>
      ) : (
        <>
          {/* Active jobs */}
          {active.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <h3 style={{ marginBottom: 12, color: 'var(--primary)' }}>Active ({active.length})</h3>
              {active.map(job => <TaskCard key={job.id} job={job} onAdvance={advance} expanded={expanded} setExpanded={setExpanded} navigate={navigate} />)}
            </div>
          )}

          {/* Completed jobs */}
          {done.length > 0 && (
            <div>
              <h3 style={{ marginBottom: 12, color: 'var(--gray)' }}>Completed ({done.length})</h3>
              {done.map(job => <TaskCard key={job.id} job={job} onAdvance={advance} expanded={expanded} setExpanded={setExpanded} navigate={navigate} />)}
            </div>
          )}
        </>
      )}
    </div>
  )
}

function TaskCard({ job, onAdvance, expanded, setExpanded, navigate }) {
  const flow = STATUS_FLOW[job.status]
  const address = job.delivery_address || job.shipping_address || ''
  const mapsUrl = address ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}&travelmode=driving` : null

  const typeIcon = job.job_type === 'pickup' ? <FaBoxOpen style={{ color: 'var(--warning)' }} /> : <FaTruck style={{ color: 'var(--primary)' }} />
  const typeLabel = job.job_type === 'pickup' ? 'Pickup' : job.job_type === 'accessory' ? 'Accessory Delivery' : 'Delivery'

  return (
    <div className="card" style={{ marginBottom: 12, border: job.status === 'on_the_way' || job.status === 'in-progress' ? '2px solid var(--primary)' : '1px solid #eee' }}>
      {/* Header */}
      <div onClick={() => setExpanded(expanded === job.id ? null : job.id)}
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', flexWrap: 'wrap', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {typeIcon}
          <div>
            <div style={{ fontWeight: 700 }}>{job.order_number || `Job #${job.id}`} · {typeLabel}</div>
            <div style={{ fontSize: 13, color: 'var(--gray)' }}>{job.customer_first} {job.customer_last}</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {job.is_cod && <span style={{ background: 'rgba(40,167,69,0.1)', color: '#28a745', borderRadius: 10, padding: '2px 8px', fontSize: 11, fontWeight: 600 }}>COD</span>}
          <span className={statusClass(job.status)}>{STATUS_LABELS[job.status] || job.status}</span>
        </div>
      </div>

      {/* Expanded details */}
      {expanded === job.id && (
        <div style={{ marginTop: 16, borderTop: '1px solid #eee', paddingTop: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12, marginBottom: 16 }}>
            {job.pickup_address && (
              <div style={{ display: 'flex', gap: 8 }}>
                <FaMapMarkerAlt style={{ color: 'var(--warning)', marginTop: 2, flexShrink: 0 }} />
                <div><div style={{ fontSize: 11, color: 'var(--gray)' }}>Pickup from</div><div style={{ fontSize: 13, fontWeight: 500 }}>{job.pickup_address}</div></div>
              </div>
            )}
            <div style={{ display: 'flex', gap: 8 }}>
              <FaMapMarkerAlt style={{ color: 'var(--danger)', marginTop: 2, flexShrink: 0 }} />
              <div><div style={{ fontSize: 11, color: 'var(--gray)' }}>Deliver to</div><div style={{ fontSize: 13, fontWeight: 500 }}>{address || '—'}</div></div>
            </div>
            {job.customer_phone && (
              <div style={{ display: 'flex', gap: 8 }}>
                <FaPhone style={{ color: 'var(--primary)', marginTop: 2, flexShrink: 0 }} />
                <div><div style={{ fontSize: 11, color: 'var(--gray)' }}>Phone</div><div style={{ fontSize: 13, fontWeight: 500 }}>{job.customer_phone}</div></div>
              </div>
            )}
            {job.is_cod && (
              <div style={{ display: 'flex', gap: 8 }}>
                <FaMoneyBillWave style={{ color: '#28a745', marginTop: 2, flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: 11, color: 'var(--gray)' }}>Cash on Delivery</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#28a745' }}>
                    ETB {job.cod_amount || '—'}
                    {job.payment_collected && <span style={{ marginLeft: 6, fontSize: 11 }}>✓ Collected</span>}
                  </div>
                </div>
              </div>
            )}
          </div>
          {job.notes && <div style={{ background: '#f8f9fa', borderRadius: 6, padding: '8px 12px', fontSize: 13, marginBottom: 12 }}><strong>Note:</strong> {job.notes}</div>}

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {mapsUrl && (
              <a href={mapsUrl} target="_blank" rel="noopener noreferrer"
                className="btn btn-outline" style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
                <FaRoute /> Navigate
              </a>
            )}
            {job.customer_phone && (
              <a href={`tel:${job.customer_phone}`} className="btn btn-outline" style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
                <FaPhone /> Call
              </a>
            )}
            {flow && (
              <button className={`btn ${flow.color}`} style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}
                onClick={() => onAdvance(job)}>
                {flow.label} <FaArrowRight />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
