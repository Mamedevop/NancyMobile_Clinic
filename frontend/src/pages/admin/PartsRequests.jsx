import { useState, useEffect } from 'react'
import { FaBoxOpen, FaCheck, FaTimes, FaPlus, FaEdit, FaTrash } from 'react-icons/fa'
import { useLanguage } from '../../context/LanguageContext'
import api from '../../services/api'
import toast from 'react-hot-toast'

export default function PartsRequests() {
  const { t } = useLanguage()
  const [tab, setTab] = useState('requests')
  const [requests, setRequests] = useState([])
  const [parts, setParts] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [rejectId, setRejectId] = useState(null)
  const [rejectNote, setRejectNote] = useState('')
  const [showAddPart, setShowAddPart] = useState(false)
  const [partForm, setPartForm] = useState({ name: '', description: '', quantity: 0, unit_price: '' })
  const [editingPart, setEditingPart] = useState(null)

  useEffect(() => {
    fetchAll()
  }, [])

  const fetchAll = () => {
    Promise.all([
      api.get('/admin/parts-requests'),
      api.get('/admin/spare-parts'),
    ]).then(([r, p]) => {
      if (r.data.success) setRequests(r.data.requests)
      if (p.data.success) setParts(p.data.parts)
    }).catch(() => {}).finally(() => setLoading(false))
  }

  const approve = async (id) => {
    try {
      const r = await api.put(`/admin/parts-requests/${id}`, { status: 'approved' })
      if (r.data.success) {
        setRequests(prev => prev.map(req => req.id === id ? r.data.request : req))
        toast.success('Request approved')
      }
    } catch { toast.error('Failed to approve') }
  }

  const reject = async (id) => {
    try {
      const r = await api.put(`/admin/parts-requests/${id}`, { status: 'rejected', admin_notes: rejectNote })
      if (r.data.success) {
        setRequests(prev => prev.map(req => req.id === id ? r.data.request : req))
        setRejectId(null); setRejectNote('')
        toast.success('Request rejected')
      }
    } catch { toast.error('Failed to reject') }
  }

  const savePart = async (e) => {
    e.preventDefault()
    try {
      if (editingPart) {
        const r = await api.put(`/admin/spare-parts/${editingPart}`, partForm)
        if (r.data.success) { setParts(prev => prev.map(p => p.id === editingPart ? r.data.part : p)); toast.success('Part updated') }
      } else {
        const r = await api.post('/admin/spare-parts', partForm)
        if (r.data.success) { setParts(prev => [...prev, r.data.part]); toast.success('Part added') }
      }
      setShowAddPart(false); setEditingPart(null); setPartForm({ name: '', description: '', quantity: 0, unit_price: '' })
    } catch { toast.error('Failed to save part') }
  }

  const deletePart = async (id, name) => {
    if (!window.confirm(`Delete "${name}"?`)) return
    try {
      await api.delete(`/admin/spare-parts/${id}`)
      setParts(prev => prev.filter(p => p.id !== id))
      toast.success('Part deleted')
    } catch { toast.error('Failed to delete') }
  }

  const startEditPart = (p) => {
    setEditingPart(p.id)
    setPartForm({ name: p.name, description: p.description || '', quantity: p.quantity, unit_price: p.unit_price || '' })
    setShowAddPart(true)
  }

  const statusBadge = (s) => {
    if (s === 'approved') return 'status-badge status-completed'
    if (s === 'rejected') return 'status-badge status-cancelled'
    return 'status-badge status-pending'
  }

  const filtered = filter === 'all' ? requests : requests.filter(r => r.status === filter)
  const pendingCount = requests.filter(r => r.status === 'pending').length

  return (
    <div className="page">
      <h2 style={{ marginBottom: 20 }}>
        <FaBoxOpen style={{ marginRight: 8, color: 'var(--primary)' }} />Parts & Inventory
        {pendingCount > 0 && (
          <span style={{ marginLeft: 10, background: 'var(--danger)', color: 'white', borderRadius: 12, padding: '2px 10px', fontSize: 13, fontWeight: 700 }}>
            {pendingCount} pending
          </span>
        )}
      </h2>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, borderBottom: '2px solid #eee', paddingBottom: 0 }}>
        {[
          { id: 'requests', label: 'Part Requests' },
          { id: 'inventory', label: 'Spare Parts Inventory' },
        ].map(tab_ => (
          <button key={tab_.id} onClick={() => setTab(tab_.id)}
            style={{ padding: '10px 20px', border: 'none', background: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 14,
              color: tab === tab_.id ? 'var(--primary)' : 'var(--gray)',
              borderBottom: tab === tab_.id ? '2px solid var(--primary)' : '2px solid transparent',
              marginBottom: -2 }}>
            {tab_.label}
          </button>
        ))}
      </div>

      {/* ── REQUESTS TAB ── */}
      {tab === 'requests' && (
        <>
          {/* Filter */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            {[['all','All'], ['pending','Pending'], ['approved','Approved'], ['rejected','Rejected']].map(([val, label]) => (
              <button key={val} onClick={() => setFilter(val)}
                style={{ padding: '7px 14px', borderRadius: 6, border: '1px solid', fontSize: 13, cursor: 'pointer',
                  background: filter === val ? 'var(--primary)' : 'white',
                  color: filter === val ? 'white' : 'var(--dark)',
                  borderColor: filter === val ? 'var(--primary)' : '#ddd' }}>
                {label}
                {val === 'pending' && pendingCount > 0 && (
                  <span style={{ marginLeft: 6, background: 'rgba(255,255,255,0.3)', borderRadius: 8, padding: '1px 6px', fontSize: 11 }}>
                    {pendingCount}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="card">
            {loading ? <p style={{ padding: 20 }}>{t('loading')}</p> : filtered.length === 0 ? (
              <p style={{ color: 'var(--gray)', textAlign: 'center', padding: 30 }}>No requests found.</p>
            ) : filtered.map(req => (
              <div key={req.id} style={{ padding: '16px 20px', borderBottom: '1px solid #eee' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 700, fontSize: 15 }}>{req.part_name}</span>
                      <span className={statusBadge(req.status)}>{req.status}</span>
                      <span style={{ fontSize: 12, color: 'var(--gray)' }}>Qty: {req.quantity}</span>
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--gray)', marginBottom: 4 }}>
                      Technician: <strong>{req.first_name} {req.last_name}</strong> · {req.tech_email}
                    </div>
                    {req.device_type && (
                      <div style={{ fontSize: 13, color: 'var(--gray)', marginBottom: 4 }}>
                        For repair: {req.device_type}
                      </div>
                    )}
                    {req.notes && (
                      <div style={{ fontSize: 13, background: '#f8f9fa', borderRadius: 6, padding: '6px 10px', marginTop: 6 }}>
                        Note: {req.notes}
                      </div>
                    )}
                    {req.admin_notes && (
                      <div style={{ fontSize: 13, background: 'rgba(247,37,133,0.05)', borderRadius: 6, padding: '6px 10px', marginTop: 6, color: 'var(--danger)' }}>
                        Admin note: {req.admin_notes}
                      </div>
                    )}
                    <div style={{ fontSize: 12, color: 'var(--gray)', marginTop: 6 }}>
                      {new Date(req.created_at).toLocaleString()}
                    </div>
                  </div>

                  {req.status === 'pending' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 120 }}>
                      <button className="btn btn-success" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}
                        onClick={() => approve(req.id)}>
                        <FaCheck /> Approve
                      </button>
                      {rejectId === req.id ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          <input className="form-control" style={{ fontSize: 12, padding: '5px 8px' }}
                            placeholder="Reason (optional)" value={rejectNote}
                            onChange={e => setRejectNote(e.target.value)} />
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button className="btn btn-danger" style={{ flex: 1, fontSize: 12, padding: '5px' }} onClick={() => reject(req.id)}>Confirm</button>
                            <button className="btn btn-outline" style={{ flex: 1, fontSize: 12, padding: '5px' }} onClick={() => { setRejectId(null); setRejectNote('') }}>Cancel</button>
                          </div>
                        </div>
                      ) : (
                        <button className="btn btn-danger" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}
                          onClick={() => setRejectId(req.id)}>
                          <FaTimes /> Reject
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ── INVENTORY TAB ── */}
      {tab === 'inventory' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
            <button className="btn" onClick={() => { setShowAddPart(true); setEditingPart(null); setPartForm({ name: '', description: '', quantity: 0, unit_price: '' }) }}>
              <FaPlus style={{ marginRight: 6 }} />Add Part
            </button>
          </div>

          {showAddPart && (
            <div className="card" style={{ marginBottom: 20, border: '2px solid var(--primary)' }}>
              <h3 style={{ marginBottom: 16 }}>{editingPart ? 'Edit Part' : 'Add New Part'}</h3>
              <form onSubmit={savePart}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 15 }}>
                  <div className="form-group">
                    <label>Part Name *</label>
                    <input className="form-control" value={partForm.name} onChange={e => setPartForm({ ...partForm, name: e.target.value })} required />
                  </div>
                  <div className="form-group">
                    <label>Quantity</label>
                    <input className="form-control" type="number" min="0" value={partForm.quantity} onChange={e => setPartForm({ ...partForm, quantity: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>Unit Price (ETB)</label>
                    <input className="form-control" type="number" min="0" step="0.01" value={partForm.unit_price} onChange={e => setPartForm({ ...partForm, unit_price: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>Description</label>
                    <input className="form-control" value={partForm.description} onChange={e => setPartForm({ ...partForm, description: e.target.value })} />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button className="btn btn-success" type="submit">{editingPart ? 'Update' : 'Add Part'}</button>
                  <button type="button" className="btn btn-outline" onClick={() => { setShowAddPart(false); setEditingPart(null) }}>{t('cancel')}</button>
                </div>
              </form>
            </div>
          )}

          <div className="card">
            {parts.length === 0 ? (
              <p style={{ color: 'var(--gray)', textAlign: 'center', padding: 30 }}>No spare parts yet. Add some above.</p>
            ) : (
              <div className="table-responsive">
                <table className="data-table">
                  <thead>
                    <tr><th>Part Name</th><th>Description</th><th>In Stock</th><th>Unit Price</th><th>{t('actions')}</th></tr>
                  </thead>
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
                        <td>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button className="btn" style={{ padding: '5px 10px', fontSize: 12 }} onClick={() => startEditPart(p)}><FaEdit /></button>
                            <button className="btn btn-danger" style={{ padding: '5px 10px', fontSize: 12 }} onClick={() => deletePart(p.id, p.name)}><FaTrash /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
