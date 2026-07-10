import { useState, useEffect } from 'react'
import { FaTools, FaHandPointer, FaSave } from 'react-icons/fa'
import { useLanguage } from '../../context/LanguageContext'
import api from '../../services/api'
import toast from 'react-hot-toast'

const STATUSES = ['diagnosed', 'in-progress', 'completed', 'cancelled']

export default function TechRepairs() {
  const [repairs, setRepairs] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null)
  const [editForm, setEditForm] = useState({ status: '', notes: '', estimated_cost: '' })
  const { t } = useLanguage()

  useEffect(() => {
    fetchRepairs()
  }, [])

  const fetchRepairs = () => {
    api.get('/technician/repairs').then(r => {
      if (r.data.success) setRepairs(r.data.repairs || [])
    }).catch(() => {}).finally(() => setLoading(false))
  }

  const claim = async (id) => {
    try {
      const r = await api.post(`/technician/repairs/${id}/claim`)
      if (r.data.success) {
        toast.success('Repair claimed!')
        fetchRepairs()
      }
    } catch { toast.error('Failed to claim repair') }
  }

  const startEdit = (repair) => {
    setEditing(repair.id)
    setEditForm({ status: repair.status, notes: repair.notes || '', estimated_cost: repair.estimated_cost || '' })
  }

  const saveEdit = async (id) => {
    try {
      const r = await api.put(`/technician/repairs/${id}`, editForm)
      if (r.data.success) {
        toast.success('Repair updated!')
        setEditing(null)
        fetchRepairs()
      }
    } catch { toast.error('Failed to update repair') }
  }

  const statusClass = (s) => {
    if (s === 'completed') return 'status-badge status-completed'
    if (s === 'in-progress' || s === 'diagnosed') return 'status-badge status-processing'
    if (s === 'cancelled') return 'status-badge status-cancelled'
    return 'status-badge status-pending'
  }

  const myRepairs = repairs.filter(r => r.assigned_to)
  const unassigned = repairs.filter(r => !r.assigned_to)

  return (
    <div className="page">
      <h2 style={{ marginBottom: 20 }}><FaTools style={{ marginRight: 8, color: 'var(--primary)' }} />{t('repairAssignments')}</h2>

      {unassigned.length > 0 && (
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-header">
            <h3 className="card-title">{t('availableRepairs')} ({unassigned.length})</h3>
          </div>
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr><th>ID</th><th>{t('customerLabel')}</th><th>{t('deviceType')}</th><th>{t('issueDescription')}</th><th>{t('date')}</th><th>{t('action')}</th></tr>
              </thead>
              <tbody>
                {unassigned.map(r => (
                  <tr key={r.id}>
                    <td>#{r.id}</td>
                    <td>{r.first_name} {r.last_name}</td>
                    <td>{r.device_type}</td>
                    <td>{r.issue_description}</td>
                    <td>{new Date(r.created_at).toLocaleDateString()}</td>
                    <td>
                      <button className="btn btn-success" style={{ padding: '6px 12px', fontSize: 13 }} onClick={() => claim(r.id)}>
                        <FaHandPointer style={{ marginRight: 4 }} /> {t('claim')}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">{t('myRepairs')} ({myRepairs.length})</h3>
        </div>
        {loading ? <p>{t('loading')}</p> : myRepairs.length === 0 ? (
          <p style={{ color: 'var(--gray)', textAlign: 'center', padding: 20 }}>{t('noRepairsAssigned')}</p>
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr><th>ID</th><th>{t('customerLabel')}</th><th>{t('deviceType')}</th><th>{t('issueDescription')}</th><th>{t('status')}</th><th>{t('estimatedCost')}</th><th>{t('notes')}</th><th>{t('action')}</th></tr>
              </thead>
              <tbody>
                {myRepairs.map(r => (
                  <tr key={r.id}>
                    <td>#{r.id}</td>
                    <td>{r.first_name} {r.last_name}<br /><small style={{ color: 'var(--gray)' }}>{r.customer_email}</small></td>
                    <td>{r.device_type}</td>
                    <td>{r.issue_description}</td>
                    <td>
                      {editing === r.id ? (
                        <select className="form-control" style={{ padding: '5px', fontSize: 13 }}
                          value={editForm.status} onChange={e => setEditForm({ ...editForm, status: e.target.value })}>
                          {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      ) : <span className={statusClass(r.status)}>{r.status}</span>}
                    </td>
                    <td>
                      {editing === r.id ? (
                        <input type="number" className="form-control" style={{ padding: '5px', fontSize: 13, width: 90 }}
                          value={editForm.estimated_cost} onChange={e => setEditForm({ ...editForm, estimated_cost: e.target.value })}
                          placeholder="ETB" />
                      ) : r.estimated_cost ? `ETB ${r.estimated_cost}` : 'TBD'}
                    </td>
                    <td>
                      {editing === r.id ? (
                        <textarea className="form-control" style={{ fontSize: 12, width: 150 }} rows="2"
                          value={editForm.notes} onChange={e => setEditForm({ ...editForm, notes: e.target.value })}
                          placeholder="Add notes..." />
                      ) : <span style={{ fontSize: 12, color: 'var(--gray)' }}>{r.notes || '-'}</span>}
                    </td>
                    <td>
                      {editing === r.id ? (
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button className="btn btn-success" style={{ padding: '5px 10px', fontSize: 12 }} onClick={() => saveEdit(r.id)}>
                            <FaSave />
                          </button>
                          <button className="btn btn-outline" style={{ padding: '5px 10px', fontSize: 12 }} onClick={() => setEditing(null)}>✕</button>
                        </div>
                      ) : (
                        <button className="btn" style={{ padding: '5px 10px', fontSize: 12 }} onClick={() => startEdit(r)}>Edit</button>
                      )}
                    </td>
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

