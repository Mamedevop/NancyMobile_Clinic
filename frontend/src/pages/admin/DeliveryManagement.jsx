import { useState, useEffect } from 'react'
import { FaTruck, FaPlus, FaTimes, FaMapMarkerAlt, FaPhone,
  FaCheckCircle, FaMoneyBillWave, FaEdit, FaTrash, FaEye } from 'react-icons/fa'
import { useLanguage } from '../../context/LanguageContext'
import api from '../../services/api'
import toast from 'react-hot-toast'

const STATUS_LABELS = {
  pending: 'Pending', on_the_way: 'On the Way', picked_up: 'Picked Up',
  'in-progress': 'In Progress', delivered: 'Delivered',
  completed: 'Completed', cancelled: 'Cancelled',
}

const statusClass = (s) => {
  if (s === 'completed') return 'status-badge status-completed'
  if (['in-progress','on_the_way','picked_up','delivered'].includes(s)) return 'status-badge status-processing'
  if (s === 'cancelled') return 'status-badge status-cancelled'
  return 'status-badge status-pending'
}

const EMPTY = { order_id: '', assigned_to: '', pickup_address: '', delivery_address: '', notes: '', job_type: 'delivery', is_cod: false, cod_amount: '' }

export default function DeliveryManagement() {
  const { t } = useLanguage()
  const [jobs, setJobs] = useState([])
  const [drivers, setDrivers] = useState([])
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [viewing, setViewing] = useState(null)

  useEffect(() => {
    fetchAll()
  }, [])

  const fetchAll = () => {
    Promise.all([
      api.get('/delivery/admin/jobs'),
      api.get('/delivery/admin/drivers'),
      api.get('/admin/orders'),
    ]).then(([j, d, o]) => {
      if (j.data.success) setJobs(j.data.jobs)
      if (d.data.success) setDrivers(d.data.drivers)
      if (o.data.success) setOrders(o.data.orders || [])
    }).catch(() => {}).finally(() => setLoading(false))
  }

  const openCreate = () => { setEditingId(null); setForm(EMPTY); setShowForm(true) }
  const openEdit = (job) => {
    setEditingId(job.id)
    setForm({
      order_id: job.order_id || '', assigned_to: job.assigned_to || '',
      pickup_address: job.pickup_address || '', delivery_address: job.delivery_address || '',
      notes: job.notes || '', job_type: job.job_type || 'delivery',
      is_cod: job.is_cod || false, cod_amount: job.cod_amount || '',
    })
    setShowForm(true)
  }

  const save = async (e) => {
    e.preventDefault()
    if (!form.assigned_to || !form.delivery_address) {
      toast.error('Driver and delivery address are required'); return
    }
    setSaving(true)
    try {
      const payload = { ...form, order_id: form.order_id || null, cod_amount: form.cod_amount || null }
      if (editingId) {
        const r = await api.put(`/delivery/admin/jobs/${editingId}`, payload)
        if (r.data.success) { setJobs(prev => prev.map(j => j.id === editingId ? r.data.job : j)); toast.success('Job updated') }
      } else {
        const r = await api.post('/delivery/admin/jobs', payload)
        if (r.data.success) { setJobs(prev => [r.data.job, ...prev]); toast.success('Job assigned') }
      }
      setShowForm(false)
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to save') }
    setSaving(false)
  }

  const deleteJob = async (id) => {
    if (!window.confirm('Delete this delivery job?')) return
    try {
      await api.delete(`/delivery/admin/jobs/${id}`)
      setJobs(prev => prev.filter(j => j.id !== id))
      toast.success('Deleted')
    } catch { toast.error('Failed to delete') }
  }

  const updateStatus = async (id, status) => {
    try {
      const r = await api.put(`/delivery/admin/jobs/${id}`, { status })
      if (r.data.success) setJobs(prev => prev.map(j => j.id === id ? r.data.job : j))
      toast.success('Status updated')
    } catch { toast.error('Failed') }
  }

  const set = f => e => setForm(p => ({ ...p, [f]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }))

  const filtered = filter === 'all' ? jobs : jobs.filter(j => j.status === filter)
  const pendingCount = jobs.filter(j => j.status === 'pending').length
  const activeCount = jobs.filter(j => ['on_the_way','picked_up','in-progress','delivered'].includes(j.status)).length

  return (
    <div className="page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2>
          <FaTruck style={{ marginRight: 8, color: 'var(--primary)' }} />Delivery Management
          {activeCount > 0 && <span style={{ marginLeft: 10, background: 'var(--primary)', color: 'white', borderRadius: 12, padding: '2px 10px', fontSize: 13 }}>{activeCount} active</span>}
        </h2>
        <button className="btn" onClick={openCreate}><FaPlus style={{ marginRight: 6 }} />Assign Job</button>
      </div>

      {/* Stats */}
      <div className="stats-grid" style={{ marginBottom: 20 }}>
        {[
          { label: 'Total Jobs', value: jobs.length, color: 'primary' },
          { label: 'Pending', value: pendingCount, color: 'warning' },
          { label: 'Active', value: activeCount, color: 'primary' },
          { label: 'Completed', value: jobs.filter(j => j.status === 'completed').length, color: 'success' },
        ].map((s, i) => (
          <div className="stat-card" key={i}>
            <div className={`stat-icon ${s.color}`}><FaTruck /></div>
            <div className="stat-info"><h3>{s.value}</h3><p>{s.label}</p></div>
          </div>
        ))}
      </div>

      {/* Assign / Edit Form */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
          onClick={() => setShowForm(false)}>
          <div className="card" style={{ width: '100%', maxWidth: 560, maxHeight: '90vh', overflow: 'auto' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ margin: 0 }}>{editingId ? 'Edit Delivery Job' : 'Assign New Delivery Job'}</h3>
              <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: 'var(--gray)' }}><FaTimes /></button>
            </div>
            <form onSubmit={save}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div className="form-group">
                  <label>Job Type</label>
                  <select className="form-control" value={form.job_type} onChange={set('job_type')}>
                    <option value="delivery">Delivery (accessories/order)</option>
                    <option value="pickup">Pickup (damaged phone)</option>
                    <option value="return">Return (repaired phone)</option>
                    <option value="accessory">Accessory Delivery</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Assign Driver *</label>
                  <select className="form-control" value={form.assigned_to} onChange={set('assigned_to')} required>
                    <option value="">Select driver...</option>
                    {drivers.map(d => (
                      <option key={d.id} value={d.id}>
                        {d.first_name} {d.last_name} {!d.is_verified ? '(unverified)' : d.active_jobs > 0 ? `(${d.active_jobs} active)` : '(free)'}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>Link to Order (optional)</label>
                <select className="form-control" value={form.order_id} onChange={set('order_id')}>
                  <option value="">No linked order</option>
                  {orders.slice(0, 50).map(o => (
                    <option key={o.id} value={o.id}>{o.order_number || `#${o.id}`} — {o.customer_name || o.user_email}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Pickup Address</label>
                <input className="form-control" placeholder="e.g. NancyMobile Store, Addis Ababa" value={form.pickup_address} onChange={set('pickup_address')} />
              </div>
              <div className="form-group">
                <label>Delivery Address *</label>
                <input className="form-control" placeholder="Customer address" value={form.delivery_address} onChange={set('delivery_address')} required />
              </div>
              <div className="form-group">
                <label>Notes</label>
                <textarea className="form-control" rows="2" placeholder="Special instructions..." value={form.notes} onChange={set('notes')} />
              </div>
              <div style={{ display: 'flex', gap: 20, marginBottom: 16 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontWeight: 500 }}>
                  <input type="checkbox" checked={form.is_cod} onChange={set('is_cod')} />
                  Cash on Delivery (COD)
                </label>
              </div>
              {form.is_cod && (
                <div className="form-group">
                  <label>COD Amount (ETB)</label>
                  <input className="form-control" type="number" step="0.01" value={form.cod_amount} onChange={set('cod_amount')} placeholder="0.00" />
                </div>
              )}
              <div style={{ display: 'flex', gap: 10 }}>
                <button className="btn btn-success" type="submit" disabled={saving} style={{ flex: 1 }}>
                  {saving ? t('saving') : editingId ? 'Update Job' : 'Assign Job'}
                </button>
                <button type="button" className="btn btn-outline" onClick={() => setShowForm(false)} style={{ flex: 1 }}>{t('cancel')}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Job detail modal */}
      {viewing && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
          onClick={() => setViewing(null)}>
          <div className="card" style={{ width: '100%', maxWidth: 500 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
              <h3 style={{ margin: 0 }}>Job #{viewing.id} Details</h3>
              <button onClick={() => setViewing(null)} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer' }}>×</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                ['Order', viewing.order_number || '—'],
                ['Type', viewing.job_type],
                ['Driver', `${viewing.driver_first || '—'} ${viewing.driver_last || ''}`],
                ['Customer', `${viewing.customer_first || '—'} ${viewing.customer_last || ''}`],
                ['Pickup', viewing.pickup_address || '—'],
                ['Deliver to', viewing.delivery_address || viewing.shipping_address || '—'],
                ['Status', STATUS_LABELS[viewing.status] || viewing.status],
                ['COD', viewing.is_cod ? `ETB ${viewing.cod_amount || '—'}` : 'No'],
                ['Payment Collected', viewing.payment_collected ? `ETB ${viewing.payment_amount || '—'}` : 'No'],
                ['Notes', viewing.notes || '—'],
                ['Completed', viewing.completed_at ? new Date(viewing.completed_at).toLocaleString() : '—'],
              ].map(([label, value]) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f0f0f0' }}>
                  <span style={{ color: 'var(--gray)', fontSize: 13 }}>{label}</span>
                  <span style={{ fontWeight: 500, fontSize: 13 }}>{value}</span>
                </div>
              ))}
            </div>
            {viewing.delivery_address && (
              <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(viewing.delivery_address)}`}
                target="_blank" rel="noopener noreferrer" className="btn btn-outline" style={{ marginTop: 16, width: '100%', textAlign: 'center', display: 'block' }}>
                <FaMapMarkerAlt style={{ marginRight: 6 }} />View on Map
              </a>
            )}
          </div>
        </div>
      )}

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {[['all','All'], ['pending','Pending'], ['on_the_way','On the Way'], ['in-progress','In Progress'], ['completed','Completed'], ['cancelled','Cancelled']].map(([val, label]) => (
          <button key={val} onClick={() => setFilter(val)}
            style={{ padding: '7px 14px', borderRadius: 6, border: '1px solid', fontSize: 13, cursor: 'pointer',
              background: filter === val ? 'var(--primary)' : 'white',
              color: filter === val ? 'white' : 'var(--dark)',
              borderColor: filter === val ? 'var(--primary)' : '#ddd' }}>
            {label}
          </button>
        ))}
      </div>

      {/* Jobs table */}
      <div className="table-container">
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr><th>Job</th><th>Type</th><th>Driver</th><th>Customer</th><th>Address</th><th>Status</th><th>COD</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="8" style={{ textAlign: 'center', padding: 30 }}>{t('loading')}</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan="8" style={{ textAlign: 'center', padding: 30, color: 'var(--gray)' }}>No jobs found.</td></tr>
              ) : filtered.map(job => (
                <tr key={job.id}>
                  <td style={{ fontWeight: 600 }}>{job.order_number || `#${job.id}`}</td>
                  <td style={{ fontSize: 12, textTransform: 'capitalize' }}>{job.job_type || 'delivery'}</td>
                  <td style={{ fontSize: 13 }}>{job.driver_first ? `${job.driver_first} ${job.driver_last}` : <span style={{ color: 'var(--gray)' }}>Unassigned</span>}</td>
                  <td style={{ fontSize: 13 }}>{job.customer_first ? `${job.customer_first} ${job.customer_last}` : '—'}</td>
                  <td style={{ fontSize: 12, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {job.delivery_address || job.shipping_address || '—'}
                  </td>
                  <td><span className={statusClass(job.status)}>{STATUS_LABELS[job.status] || job.status}</span></td>
                  <td>
                    {job.is_cod
                      ? <span style={{ color: job.payment_collected ? '#28a745' : 'var(--warning)', fontSize: 12, fontWeight: 600 }}>
                          {job.payment_collected ? `✓ ETB ${job.payment_amount || job.cod_amount}` : `ETB ${job.cod_amount || '—'}`}
                        </span>
                      : <span style={{ color: 'var(--gray)', fontSize: 12 }}>—</span>}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 5 }}>
                      <button className="btn" style={{ padding: '5px 8px', fontSize: 12 }} title="View" onClick={() => setViewing(job)}><FaEye /></button>
                      <button className="btn" style={{ padding: '5px 8px', fontSize: 12 }} title="Edit" onClick={() => openEdit(job)}><FaEdit /></button>
                      {job.status === 'pending' && (
                        <button className="btn btn-success" style={{ padding: '5px 8px', fontSize: 12 }} title="Mark Active" onClick={() => updateStatus(job.id, 'in-progress')}>▶</button>
                      )}
                      <button className="btn btn-danger" style={{ padding: '5px 8px', fontSize: 12 }} title="Delete" onClick={() => deleteJob(job.id)}><FaTrash /></button>
                    </div>
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
