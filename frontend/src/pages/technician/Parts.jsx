import { useState, useEffect } from 'react'
import { FaBoxes, FaPlus, FaList, FaHistory } from 'react-icons/fa'
import { useLanguage } from '../../context/LanguageContext'
import api from '../../services/api'
import toast from 'react-hot-toast'

export default function TechParts() {
  const { t } = useLanguage()
  const [tab, setTab] = useState('available')
  const [parts, setParts] = useState([])
  const [requests, setRequests] = useState([])
  const [usage, setUsage] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ part_name: '', quantity: 1, notes: '' })
  const [showForm, setShowForm] = useState(false)

  useEffect(() => {
    Promise.all([
      api.get('/technician/parts'),
      api.get('/technician/parts/requests'),
      api.get('/technician/parts/used'),
    ]).then(([p, r, u]) => {
      if (p.data.success) setParts(p.data.parts)
      if (r.data.success) setRequests(r.data.requests)
      if (u.data.success) setUsage(u.data.usage)
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const submitRequest = async (e) => {
    e.preventDefault()
    try {
      const r = await api.post('/technician/parts/request', form)
      if (r.data.success) {
        setRequests(prev => [r.data.request, ...prev])
        setForm({ part_name: '', quantity: 1, notes: '' })
        setShowForm(false)
        toast.success('Part request submitted!')
      }
    } catch { toast.error('Failed to submit request') }
  }

  const statusBadge = (s) => {
    if (s === 'approved') return 'status-badge status-completed'
    if (s === 'rejected') return 'status-badge status-cancelled'
    return 'status-badge status-pending'
  }

  const tabs = [
    { id: 'available', label: 'Available Parts', icon: <FaBoxes /> },
    { id: 'request', label: 'Request Parts', icon: <FaPlus /> },
    { id: 'used', label: 'Used Components', icon: <FaHistory /> },
  ]

  return (
    <div className="page">
      <h2 style={{ marginBottom: 20 }}><FaBoxes style={{ marginRight: 8, color: 'var(--primary)' }} />Parts & Inventory</h2>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20, borderBottom: '2px solid #eee', paddingBottom: 0 }}>
        {tabs.map(tab_ => (
          <button key={tab_.id} onClick={() => setTab(tab_.id)}
            style={{ padding: '10px 18px', border: 'none', background: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 14,
              color: tab === tab_.id ? 'var(--primary)' : 'var(--gray)',
              borderBottom: tab === tab_.id ? '2px solid var(--primary)' : '2px solid transparent',
              marginBottom: -2, display: 'flex', alignItems: 'center', gap: 6 }}>
            {tab_.icon} {tab_.label}
          </button>
        ))}
      </div>

      {/* Available Parts */}
      {tab === 'available' && (
        <div className="card">
          {loading ? <p style={{ padding: 20 }}>{t('loading')}</p> : parts.length === 0 ? (
            <p style={{ color: 'var(--gray)', textAlign: 'center', padding: 30 }}>No spare parts in inventory yet.</p>
          ) : (
            <div className="table-responsive">
              <table className="data-table">
                <thead><tr><th>Part Name</th><th>Description</th><th>In Stock</th><th>Unit Price</th></tr></thead>
                <tbody>
                  {parts.map(p => (
                    <tr key={p.id}>
                      <td style={{ fontWeight: 600 }}>{p.name}</td>
                      <td style={{ fontSize: 13, color: 'var(--gray)' }}>{p.description || '—'}</td>
                      <td>
                        <span className={p.quantity === 0 ? 'out-of-stock' : p.quantity <= 5 ? 'low-stock' : 'in-stock'}>
                          {p.quantity === 0 ? 'Out of Stock' : p.quantity}
                        </span>
                      </td>
                      <td>{p.unit_price ? `ETB ${parseFloat(p.unit_price).toFixed(2)}` : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Request Parts */}
      {tab === 'request' && (
        <>
          <div className="card" style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: showForm ? 16 : 0 }}>
              <h3 style={{ margin: 0 }}>Request New Part</h3>
              <button className="btn" onClick={() => setShowForm(!showForm)}>
                <FaPlus style={{ marginRight: 6 }} />{showForm ? 'Cancel' : 'New Request'}
              </button>
            </div>
            {showForm && (
              <form onSubmit={submitRequest} style={{ marginTop: 16 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 15 }}>
                  <div className="form-group">
                    <label>Part Name *</label>
                    <input className="form-control" placeholder="e.g. iPhone 13 Screen" value={form.part_name} onChange={e => setForm({ ...form, part_name: e.target.value })} required />
                  </div>
                  <div className="form-group">
                    <label>Quantity</label>
                    <input className="form-control" type="number" min="1" value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} />
                  </div>
                </div>
                <div className="form-group">
                  <label>Notes</label>
                  <textarea className="form-control" rows="2" placeholder="Additional details..." value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
                </div>
                <button className="btn btn-success" type="submit">Submit Request</button>
              </form>
            )}
          </div>

          <div className="card">
            <h3 style={{ marginBottom: 15 }}>My Requests</h3>
            {requests.length === 0 ? (
              <p style={{ color: 'var(--gray)', textAlign: 'center', padding: 20 }}>No requests yet.</p>
            ) : (
              <div className="table-responsive">
                <table className="data-table">
                  <thead><tr><th>Part</th><th>Qty</th><th>Notes</th><th>Status</th><th>Date</th></tr></thead>
                  <tbody>
                    {requests.map(r => (
                      <tr key={r.id}>
                        <td style={{ fontWeight: 600 }}>{r.part_name}</td>
                        <td>{r.quantity}</td>
                        <td style={{ fontSize: 13, color: 'var(--gray)' }}>{r.notes || '—'}</td>
                        <td><span className={statusBadge(r.status)}>{r.status}</span></td>
                        <td style={{ fontSize: 13 }}>{new Date(r.created_at).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* Used Components */}
      {tab === 'used' && (
        <div className="card">
          {usage.length === 0 ? (
            <p style={{ color: 'var(--gray)', textAlign: 'center', padding: 30 }}>No component usage recorded yet.</p>
          ) : (
            <div className="table-responsive">
              <table className="data-table">
                <thead><tr><th>Part</th><th>Repair</th><th>Qty Used</th><th>Date</th></tr></thead>
                <tbody>
                  {usage.map(u => (
                    <tr key={u.id}>
                      <td style={{ fontWeight: 600 }}>{u.part_name}</td>
                      <td style={{ fontSize: 13 }}>{u.device_type}</td>
                      <td>{u.quantity}</td>
                      <td style={{ fontSize: 13 }}>{new Date(u.used_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
