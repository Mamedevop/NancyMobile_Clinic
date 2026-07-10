import { useState, useEffect } from 'react'
import { FaTools } from 'react-icons/fa'
import { useLanguage } from '../../context/LanguageContext'
import api from '../../services/api'
import toast from 'react-hot-toast'

const STATUSES = ['pending', 'diagnosed', 'in-progress', 'completed', 'cancelled']

export default function ManageRepairs() {
  const [repairs, setRepairs] = useState([])
  const [technicians, setTechnicians] = useState([])
  const [loading, setLoading] = useState(true)
  const { t } = useLanguage()

  useEffect(() => {
    Promise.all([
      api.get('/admin/repairs'),
      api.get('/admin/users').then(r => r.data.users?.filter(u => u.role === 'technician') || [])
    ]).then(([repairsRes, techs]) => {
      if (repairsRes.data.success) setRepairs(repairsRes.data.repairs || [])
      setTechnicians(techs)
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const updateStatus = async (id, status, cost) => {
    try {
      await api.put(`/admin/repairs/${id}`, { status, estimated_cost: cost })
      setRepairs(prev => prev.map(r => r.id === id ? { ...r, status, estimated_cost: cost } : r))
      toast.success('Repair updated')
    } catch { toast.error('Failed to update repair') }
  }

  const assignTech = async (id, techId) => {
    try {
      await api.put(`/admin/repairs/${id}`, { assigned_to: techId || null })
      setRepairs(prev => prev.map(r => r.id === id ? { ...r, assigned_to: techId } : r))
      toast.success('Technician assigned')
    } catch { toast.error('Failed to assign technician') }
  }

  const statusClass = (s) => {
    if (s === 'completed') return 'status-badge status-completed'
    if (s === 'in-progress' || s === 'diagnosed') return 'status-badge status-processing'
    if (s === 'cancelled') return 'status-badge status-cancelled'
    return 'status-badge status-pending'
  }

  return (
    <div className="page">
      <h2 style={{ marginBottom: 20 }}><FaTools style={{ marginRight: 8, color: 'var(--primary)' }} />{t('repairRequestsTitle')}</h2>
      <div className="table-container">
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr><th>ID</th><th>{t('customerLabel')}</th><th>{t('deviceType')}</th><th>{t('issue')}</th><th>{t('technicianLabel')}</th><th>{t('status')}</th><th>{t('estimatedCost')}</th><th>{t('date')}</th><th>{t('actions')}</th></tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="8" style={{ textAlign: 'center', padding: 20 }}>{t('loading')}</td></tr>
              ) : repairs.length === 0 ? (
                <tr><td colSpan="8" style={{ textAlign: 'center', padding: 20, color: 'var(--gray)' }}>{t('noRepairRequests')}</td></tr>
              ) : repairs.map(r => (
                <tr key={r.id}>
                  <td>#{r.id}</td>
                  <td>{r.user_email || '-'}</td>
                  <td>{r.device_type}</td>
                  <td>{r.issue_description}</td>
                  <td>
                    <select className="form-control" style={{ padding: '5px', fontSize: 12, width: 130 }}
                      value={r.assigned_to || ''}
                      onChange={e => assignTech(r.id, e.target.value)}>
                      <option value="">{t('unassigned')}</option>
                      {technicians.map(tech => <option key={tech.id} value={tech.id}>{tech.first_name} {tech.last_name}</option>)}
                    </select>
                  </td>
                  <td><span className={statusClass(r.status)}>{r.status}</span></td>
                  <td>{r.estimated_cost ? `ETB ${r.estimated_cost}` : 'TBD'}</td>
                  <td>{new Date(r.created_at).toLocaleDateString()}</td>
                  <td style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <select className="form-control" style={{ padding: '5px', fontSize: 12, width: 120 }}
                      value={r.status}
                      onChange={e => updateStatus(r.id, e.target.value, r.estimated_cost)}>
                      {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <input type="number" placeholder={t('estimatedCost')} style={{ width: 80, padding: '5px', border: '1px solid #ddd', borderRadius: 4, fontSize: 12 }}
                      defaultValue={r.estimated_cost || ''}
                      onBlur={e => updateStatus(r.id, r.status, e.target.value || null)} />
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

