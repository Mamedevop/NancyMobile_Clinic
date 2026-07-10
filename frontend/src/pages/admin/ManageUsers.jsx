import { useState, useEffect } from 'react'
import { FaUsers, FaSearch, FaEdit, FaCheckCircle, FaTimesCircle, FaEye, FaTrash, FaPlus, FaTimes } from 'react-icons/fa'
import { useLanguage } from '../../context/LanguageContext'
import api from '../../services/api'
import toast from 'react-hot-toast'

const ROLES = ['customer', 'technician', 'delivery_person', 'admin']
const EMPTY_USER = { first_name: '', last_name: '', email: '', password: '', role: 'customer' }

export default function ManageUsers() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState('')
  const [search, setSearch] = useState('')
  const [viewing, setViewing] = useState(null)
  const [editing, setEditing] = useState(null)
  const [editForm, setEditForm] = useState({})
  const [showAdd, setShowAdd] = useState(false)
  const [addForm, setAddForm] = useState(EMPTY_USER)
  const [adding, setAdding] = useState(false)
  const { t } = useLanguage()

  useEffect(() => { fetchUsers() }, [])

  const fetchUsers = () => {
    setFetchError('')
    api.get('/admin/users').then(r => {
      if (r.data.success) setUsers(r.data.users || [])
      else setFetchError(r.data.message || 'Failed to load users')
    }).catch(err => {
      const msg = err.response?.data?.message || err.message || 'Failed to load users'
      setFetchError(msg)
      console.error('ManageUsers fetch error:', msg)
    }).finally(() => setLoading(false))
  }

  const toggleStatus = async (id, isActive) => {
    try {
      await api.put(`/admin/users/${id}`, { is_active: !isActive })
      setUsers(prev => prev.map(u => u.id === id ? { ...u, is_active: !isActive } : u))
      toast.success('User status updated')
    } catch { toast.error('Failed to update user') }
  }

  const verifyUser = async (id, status) => {
    try {
      await api.put(`/admin/users/${id}`, { is_verified: status === 'verified', verification_status: status })
      setUsers(prev => prev.map(u => u.id === id ? { ...u, is_verified: status === 'verified', verification_status: status } : u))
      toast.success(`User ${status}`)
      setViewing(null)
    } catch { toast.error('Failed to verify user') }
  }

  const deleteUser = async (id, name) => {
    if (!window.confirm(`Delete user "${name}"?`)) return
    try {
      await api.delete(`/admin/users/${id}`)
      setUsers(prev => prev.filter(u => u.id !== id))
      toast.success('User deleted')
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to delete user') }
  }

  const addUser = async (e) => {
    e.preventDefault()
    setAdding(true)
    try {
      const r = await api.post('/admin/users', addForm)
      if (r.data.success) { toast.success('User created'); setShowAdd(false); setAddForm(EMPTY_USER); fetchUsers() }
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to create user') }
    setAdding(false)
  }

  const startEdit = (user) => {
    setEditing(user.id)
    setEditForm({ first_name: user.first_name, last_name: user.last_name, phone: user.phone, address: user.address, role: user.role })
  }

  const saveEdit = async (id) => {
    try {
      await api.put(`/admin/users/${id}`, editForm)
      setUsers(prev => prev.map(u => u.id === id ? { ...u, ...editForm } : u))
      setEditing(null)
      toast.success('User updated')
    } catch { toast.error('Failed to update user') }
  }

  const filtered = users.filter(u =>
    `${u.first_name} ${u.last_name} ${u.email}`.toLowerCase().includes(search.toLowerCase())
  )

  const verifyBadge = (u) => {
    if (u.is_verified) return <span className="status-badge status-completed">{t('verified')}</span>
    if (u.verification_status === 'pending') return <span className="status-badge status-warning">{t('pending')}</span>
    return <span className="status-badge status-pending">{t('unverified')}</span>
  }

  return (
    <div className="page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2><FaUsers style={{ marginRight: 8, color: 'var(--primary)' }} />{t('usersManagement')}</h2>
        <button className="btn" onClick={() => setShowAdd(true)}>
          <FaPlus style={{ marginRight: 6 }} />{t('addUser')}
        </button>
      </div>

      {showAdd && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => setShowAdd(false)}>
          <div className="card" style={{ width: 480, maxHeight: '90vh', overflow: 'auto' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ margin: 0 }}>{t('addNewUser')}</h3>
              <button onClick={() => setShowAdd(false)} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: 'var(--gray)' }}><FaTimes /></button>
            </div>
            <form onSubmit={addUser}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label>{t('firstName')} *</label>
                  <input className="form-control" value={addForm.first_name} onChange={e => setAddForm({ ...addForm, first_name: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label>{t('lastName')} *</label>
                  <input className="form-control" value={addForm.last_name} onChange={e => setAddForm({ ...addForm, last_name: e.target.value })} required />
                </div>
              </div>
              <div className="form-group">
                <label>{t('email')} *</label>
                <input className="form-control" type="email" value={addForm.email} onChange={e => setAddForm({ ...addForm, email: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>{t('password')} *</label>
                <input className="form-control" type="password" value={addForm.password} onChange={e => setAddForm({ ...addForm, password: e.target.value })} required minLength={8} placeholder="Min 8 characters" />
              </div>
              <div className="form-group">
                <label>{t('role')} *</label>
                <select className="form-control" value={addForm.role} onChange={e => setAddForm({ ...addForm, role: e.target.value })}>
                  {ROLES.map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
                </select>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button className="btn btn-block" type="submit" disabled={adding} style={{ flex: 1 }}>
                  {adding ? t('creating') : t('createUser')}
                </button>
                <button type="button" className="btn btn-outline" onClick={() => setShowAdd(false)} style={{ flex: 1 }}>{t('cancel')}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {viewing && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => setViewing(null)}>
          <div className="card" style={{ width: 600, maxHeight: '80vh', overflow: 'auto' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3>{t('userVerification')}</h3>
              <button onClick={() => setViewing(null)} style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer' }}>×</button>
            </div>
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              {viewing.profile_picture
                ? <img src={viewing.profile_picture} alt="Profile" style={{ width: 120, height: 120, borderRadius: '50%', objectFit: 'cover', marginBottom: 10 }} />
                : <div className="user-avatar" style={{ width: 120, height: 120, fontSize: 40, margin: '0 auto 10px' }}>{viewing.first_name?.[0]}{viewing.last_name?.[0]}</div>
              }
              <h3>{viewing.first_name} {viewing.last_name}</h3>
              <p style={{ color: 'var(--gray)' }}>{viewing.email}</p>
              {verifyBadge(viewing)}
            </div>
            <table style={{ width: '100%', marginBottom: 20 }}>
              <tbody>
                {[
                  [t('phone'), viewing.phone || '-'],
                  [t('address'), viewing.address || '-'],
                  [t('nationalIdNumber'), viewing.national_id || '-'],
                  [t('fanNumber'), viewing.fan_number || '-'],
                  [t('role'), viewing.role],
                  [t('date'), new Date(viewing.created_at).toLocaleDateString()],
                ].map(([k, v]) => (
                  <tr key={k}>
                    <td style={{ padding: '8px 0', color: 'var(--gray)', width: 120 }}>{k}</td>
                    <td style={{ padding: '8px 0', fontWeight: 500 }}>{v}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {viewing.national_id_file && (
              <div style={{ marginBottom: 15 }}>
                <p style={{ fontWeight: 500, marginBottom: 6 }}>{t('uploadIdDocument')}:</p>
                <img src={viewing.national_id_file} alt="ID Document" style={{ maxWidth: '100%', borderRadius: 6, border: '1px solid #eee' }} />
              </div>
            )}
            {viewing.verification_status === 'pending' && (
              <div style={{ display: 'flex', gap: 10 }}>
                <button className="btn btn-success" style={{ flex: 1 }} onClick={() => verifyUser(viewing.id, 'verified')}>
                  <FaCheckCircle style={{ marginRight: 6 }} />{t('verifyUser')}
                </button>
                <button className="btn btn-danger" style={{ flex: 1 }} onClick={() => verifyUser(viewing.id, 'rejected')}>
                  <FaTimesCircle style={{ marginRight: 6 }} />{t('reject')}
                </button>
              </div>
            )}
            {viewing.is_verified && (
              <button className="btn btn-danger btn-block" onClick={() => verifyUser(viewing.id, 'unverified')}>
                {t('revokeVerification')}
              </button>
            )}
          </div>
        </div>
      )}

      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ position: 'relative' }}>
          <FaSearch style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--gray)' }} />
          <input className="form-control" style={{ paddingLeft: 36 }} placeholder={t('searchUsers')}
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      <div className="table-container">
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr><th>{t('name')}</th><th>{t('email')}</th><th>{t('phone')}</th><th>{t('role')}</th><th>{t('verification')}</th><th>{t('status')}</th><th>{t('actions')}</th></tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="7" style={{ textAlign: 'center', padding: 20 }}>{t('loading')}</td></tr>
              ) : fetchError ? (
                <tr><td colSpan="7" style={{ textAlign: 'center', padding: 20, color: 'var(--danger)' }}>
                  Error: {fetchError} — <button className="btn btn-outline" style={{ fontSize: 12, padding: '4px 10px', marginLeft: 8 }} onClick={fetchUsers}>Retry</button>
                </td></tr>
              ) : filtered.map(u => (
                <tr key={u.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {u.profile_picture
                        ? <img src={u.profile_picture} alt="" style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }} />
                        : <div className="user-avatar" style={{ width: 32, height: 32, fontSize: 12 }}>{u.first_name?.[0]}{u.last_name?.[0]}</div>
                      }
                      {editing === u.id ? (
                        <div style={{ display: 'flex', gap: 6 }}>
                          <input className="form-control" style={{ padding: '4px 8px', fontSize: 13, width: 90 }}
                            value={editForm.first_name} onChange={e => setEditForm({ ...editForm, first_name: e.target.value })} />
                          <input className="form-control" style={{ padding: '4px 8px', fontSize: 13, width: 90 }}
                            value={editForm.last_name} onChange={e => setEditForm({ ...editForm, last_name: e.target.value })} />
                        </div>
                      ) : `${u.first_name} ${u.last_name}`}
                    </div>
                  </td>
                  <td>{u.email}</td>
                  <td>
                    {editing === u.id
                      ? <input className="form-control" style={{ padding: '4px 8px', fontSize: 13, width: 120 }} value={editForm.phone} onChange={e => setEditForm({ ...editForm, phone: e.target.value })} />
                      : u.phone || '-'}
                  </td>
                  <td>
                    {editing === u.id
                      ? <select className="form-control" style={{ padding: '4px 8px', fontSize: 13, width: 120 }} value={editForm.role} onChange={e => setEditForm({ ...editForm, role: e.target.value })}>
                          {ROLES.map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
                        </select>
                      : <span className="status-badge status-processing" style={{ textTransform: 'capitalize' }}>{u.role}</span>}
                  </td>
                  <td>{verifyBadge(u)}</td>
                  <td>
                    <span className={`status-badge ${u.is_active ? 'status-completed' : 'status-cancelled'}`}>
                      {u.is_active ? t('active') : t('inactive')}
                    </span>
                  </td>
                  <td style={{ display: 'flex', gap: 6 }}>
                    {editing === u.id ? (
                      <>
                        <button className="btn btn-success" style={{ padding: '6px 10px', fontSize: 12 }} onClick={() => saveEdit(u.id)}>{t('save')}</button>
                        <button className="btn btn-outline" style={{ padding: '6px 10px', fontSize: 12 }} onClick={() => setEditing(null)}>✕</button>
                      </>
                    ) : (
                      <>
                        <button className="btn" style={{ padding: '6px 10px', fontSize: 12 }} onClick={() => setViewing(u)}><FaEye /></button>
                        <button className="btn" style={{ padding: '6px 10px', fontSize: 12 }} onClick={() => startEdit(u)}><FaEdit /></button>
                        <button className={`btn ${u.is_active ? 'btn-danger' : 'btn-success'}`} style={{ padding: '6px 10px', fontSize: 12 }} onClick={() => toggleStatus(u.id, u.is_active)}>
                          {u.is_active ? t('disable') : t('enable')}
                        </button>
                        <button className="btn btn-danger" style={{ padding: '6px 10px', fontSize: 12 }} onClick={() => deleteUser(u.id, `${u.first_name} ${u.last_name}`)}>
                          <FaTrash />
                        </button>
                      </>
                    )}
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
