import { useState, useEffect } from 'react'
import { FaUniversity, FaSave, FaToggleOn, FaToggleOff, FaPlus, FaTrash, FaTimes } from 'react-icons/fa'
import { useLanguage } from '../../context/LanguageContext'
import api from '../../services/api'
import toast from 'react-hot-toast'

const EMPTY = { bank_name: '', account_number: '', account_name: '' }

export default function BankSettings() {
  const [banks, setBanks] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null)
  const [editForm, setEditForm] = useState({})
  const [showAdd, setShowAdd] = useState(false)
  const [addForm, setAddForm] = useState(EMPTY)
  const [adding, setAdding] = useState(false)
  const { t } = useLanguage()

  useEffect(() => {
    api.get('/admin/bank-settings').then(r => {
      if (r.data.success) setBanks(r.data.banks)
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const startEdit = (bank) => {
    setEditing(bank.id)
    setEditForm({ bank_name: bank.bank_name, account_number: bank.account_number, account_name: bank.account_name, is_active: bank.is_active })
  }

  const saveEdit = async (id) => {
    try {
      const r = await api.put(`/admin/bank-settings/${id}`, editForm)
      if (r.data.success) {
        setBanks(prev => prev.map(b => b.id === id ? r.data.bank : b))
        setEditing(null)
        toast.success('Bank settings updated')
      }
    } catch { toast.error('Failed to update') }
  }

  const toggleActive = async (bank) => {
    try {
      const r = await api.put(`/admin/bank-settings/${bank.id}`, { ...bank, is_active: !bank.is_active })
      if (r.data.success) {
        setBanks(prev => prev.map(b => b.id === bank.id ? r.data.bank : b))
        toast.success(`Bank ${!bank.is_active ? 'enabled' : 'disabled'}`)
      }
    } catch { toast.error('Failed to update') }
  }

  const handleAdd = async (e) => {
    e.preventDefault()
    if (!addForm.bank_name || !addForm.account_number || !addForm.account_name) {
      toast.error('All fields are required')
      return
    }
    setAdding(true)
    try {
      const r = await api.post('/admin/bank-settings', addForm)
      if (r.data.success) {
        setBanks(prev => [...prev, r.data.bank])
        setAddForm(EMPTY)
        setShowAdd(false)
        toast.success('Bank account added')
      }
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to add bank') }
    setAdding(false)
  }

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete "${name}"?`)) return
    try {
      await api.delete(`/admin/bank-settings/${id}`)
      setBanks(prev => prev.filter(b => b.id !== id))
      toast.success('Bank account deleted')
    } catch { toast.error('Failed to delete') }
  }

  const set = (f) => (e) => setEditForm({ ...editForm, [f]: e.target.value })
  const setAdd = (f) => (e) => setAddForm({ ...addForm, [f]: e.target.value })

  return (
    <div className="page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <h2><FaUniversity style={{ marginRight: 8, color: 'var(--primary)' }} />{t('bankSettings')}</h2>
        <button className="btn" onClick={() => setShowAdd(!showAdd)}>
          <FaPlus style={{ marginRight: 6 }} />{t('addAccount') || 'Add Account'}
        </button>
      </div>
      <p style={{ color: 'var(--gray)', marginBottom: 20 }}>{t('bankSettingsDesc')}</p>

      {/* Add Account Form */}
      {showAdd && (
        <div className="card" style={{ marginBottom: 20, border: '2px solid var(--primary)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ margin: 0 }}>{t('addAccount') || 'Add New Bank Account'}</h3>
            <button onClick={() => { setShowAdd(false); setAddForm(EMPTY) }}
              style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: 'var(--gray)' }}>
              <FaTimes />
            </button>
          </div>
          <form onSubmit={handleAdd}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 15 }}>
              <div className="form-group">
                <label>{t('bankName')} *</label>
                <input className="form-control" placeholder="e.g. Commercial Bank of Ethiopia"
                  value={addForm.bank_name} onChange={setAdd('bank_name')} required />
              </div>
              <div className="form-group">
                <label>{t('accountName')} *</label>
                <input className="form-control" placeholder="e.g. NancyMobile Store"
                  value={addForm.account_name} onChange={setAdd('account_name')} required />
              </div>
              <div className="form-group">
                <label>{t('accountNumber')} *</label>
                <input className="form-control" placeholder="e.g. 1000123456789"
                  value={addForm.account_number} onChange={setAdd('account_number')} required />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
              <button className="btn btn-success" type="submit" disabled={adding} style={{ minWidth: 120 }}>
                <FaSave style={{ marginRight: 6 }} />{adding ? t('saving') : t('save')}
              </button>
              <button type="button" className="btn btn-outline" onClick={() => { setShowAdd(false); setAddForm(EMPTY) }}>
                {t('cancel')}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Existing Banks */}
      {loading ? <p>{t('loading')}</p> : banks.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 40, color: 'var(--gray)' }}>
          <FaUniversity style={{ fontSize: 48, marginBottom: 12, opacity: 0.3 }} />
          <p>No bank accounts yet. Add one above.</p>
        </div>
      ) : banks.map(bank => (
        <div className="card" key={bank.id} style={{ marginBottom: 15 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ flex: 1 }}>
              {editing === bank.id ? (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 15 }}>
                  <div className="form-group">
                    <label>{t('bankName')}</label>
                    <input className="form-control" value={editForm.bank_name} onChange={set('bank_name')} />
                  </div>
                  <div className="form-group">
                    <label>{t('accountName')}</label>
                    <input className="form-control" value={editForm.account_name} onChange={set('account_name')} />
                  </div>
                  <div className="form-group">
                    <label>{t('accountNumber')}</label>
                    <input className="form-control" value={editForm.account_number} onChange={set('account_number')} />
                  </div>
                </div>
              ) : (
                <div>
                  <h3 style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 10 }}>
                    <FaUniversity style={{ color: 'var(--primary)', fontSize: 16 }} />
                    {bank.bank_name}
                    <span className={`status-badge ${bank.is_active ? 'status-completed' : 'status-cancelled'}`}>
                      {bank.is_active ? t('active') : t('inactive')}
                    </span>
                  </h3>
                  <p style={{ color: 'var(--gray)', fontSize: 14 }}>{t('accountNumber')}: <strong>{bank.account_number}</strong></p>
                  <p style={{ color: 'var(--gray)', fontSize: 14 }}>{t('accountName')}: <strong>{bank.account_name}</strong></p>
                </div>
              )}
            </div>
            <div style={{ display: 'flex', gap: 8, marginLeft: 20 }}>
              {editing === bank.id ? (
                <>
                  <button className="btn btn-success" style={{ padding: '8px 16px' }} onClick={() => saveEdit(bank.id)}>
                    <FaSave style={{ marginRight: 6 }} />{t('save')}
                  </button>
                  <button className="btn btn-outline" style={{ padding: '8px 16px' }} onClick={() => setEditing(null)}>{t('cancel')}</button>
                </>
              ) : (
                <>
                  <button className="btn" style={{ padding: '8px 16px' }} onClick={() => startEdit(bank)}>{t('edit')}</button>
                  <button className="btn btn-outline" style={{ padding: '8px 16px' }} onClick={() => toggleActive(bank)}>
                    {bank.is_active ? <FaToggleOn style={{ color: '#28a745', fontSize: 18 }} /> : <FaToggleOff style={{ color: 'var(--gray)', fontSize: 18 }} />}
                  </button>
                  <button className="btn btn-danger" style={{ padding: '8px 12px' }} onClick={() => handleDelete(bank.id, bank.bank_name)}>
                    <FaTrash />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
