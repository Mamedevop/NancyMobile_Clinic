import { useState, useEffect } from 'react'
import { FaMoneyCheckAlt, FaCheck, FaTimes, FaDownload, FaEye, FaFileImage, FaTrash } from 'react-icons/fa'
import { useLanguage } from '../../context/LanguageContext'
import api from '../../services/api'
import toast from 'react-hot-toast'

export default function PaymentVerification() {
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [preview, setPreview] = useState(null)
  const [filter, setFilter] = useState('all')
  const { t } = useLanguage()

  useEffect(() => {
    api.get('/admin/payments').then(r => {
      if (r.data.success) setPayments(r.data.payments || [])
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const verify = async (id, status) => {
    try {
      await api.put('/admin/payments/' + id + '/verify', { status })
      setPayments(prev => prev.map(p => p.id === id ? { ...p, status } : p))
      toast.success('Payment ' + (status === 'completed' ? 'approved' : 'rejected'))
    } catch { toast.error('Failed to update payment') }
  }

  const deletePayment = async (id) => {
    if (!window.confirm('Delete this payment record? This cannot be undone.')) return
    try {
      await api.delete('/admin/payments/' + id)
      setPayments(prev => prev.filter(p => p.id !== id))
      toast.success('Payment deleted')
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to delete') }
  }

  const downloadReceipt = (receiptUrl, paymentId) => {
    const link = document.createElement('a')
    link.href = receiptUrl
    link.download = 'receipt_' + paymentId + '.jpg'
    link.click()
  }

  const bankLabel = m => ({ cbe: 'CBE', abyssinia: 'Bank of Abyssinia', awash: 'Awash Bank', bank_transfer: 'Bank Transfer' }[m] || m || '-')

  const statusClass = s => s === 'completed' ? 'status-badge status-completed' : s === 'pending' ? 'status-badge status-pending' : 'status-badge status-cancelled'

  const filtered = payments.filter(p => filter === 'all' || p.status === filter)

  return (
    <div className="page">
      <h2 style={{ marginBottom: 20 }}><FaMoneyCheckAlt style={{ marginRight: 8, color: 'var(--primary)' }} />{t('paymentsVerification')}</h2>

      {/* Receipt preview modal */}
      {preview && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
          onClick={() => setPreview(null)}>
          <div style={{ background: 'white', borderRadius: 8, padding: 20, maxWidth: 700, maxHeight: '90vh', overflow: 'auto', position: 'relative' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h3 style={{ margin: 0 }}>Payment Receipt</h3>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-success" style={{ padding: '6px 12px', fontSize: 13 }}
                  onClick={() => downloadReceipt(preview.url, preview.id)}>
                  <FaDownload style={{ marginRight: 4 }} />Download
                </button>
                <button onClick={() => setPreview(null)} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: 'var(--gray)' }}>✕</button>
              </div>
            </div>
            <img src={preview.url} alt="Receipt" style={{ maxWidth: '100%', borderRadius: 6 }} />
          </div>
        </div>
      )}

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {[['all', t('all')], ['pending', t('pending')], ['completed', t('approved')], ['rejected', t('rejected')]].map(([val, label]) => (
          <button key={val} onClick={() => setFilter(val)}
            style={{ padding: '8px 16px', borderRadius: 6, border: '1px solid', fontSize: 13, cursor: 'pointer',
              background: filter === val ? 'var(--primary)' : 'white',
              color: filter === val ? 'white' : 'var(--dark)',
              borderColor: filter === val ? 'var(--primary)' : '#ddd' }}>
            {label} {val !== 'all' && <span style={{ marginLeft: 4, background: 'rgba(255,255,255,0.3)', borderRadius: 10, padding: '1px 6px', fontSize: 11 }}>
              {payments.filter(p => p.status === val).length}
            </span>}
          </button>
        ))}
      </div>

      <div className="table-container">
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr><th>{t('order')}</th><th>{t('customerLabel')}</th><th>{t('amount')}</th><th>{t('bank')}</th><th>{t('transactionId')}</th><th>{t('receipt')}</th><th>{t('status')}</th><th>{t('date')}</th><th>{t('actions')}</th></tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="9" style={{ textAlign: 'center', padding: 30 }}>{t('loading')}</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan="9" style={{ textAlign: 'center', padding: 30, color: 'var(--gray)' }}>{t('noPaymentsFound')}</td></tr>
              ) : filtered.map(p => (
                <tr key={p.id}>
                  <td>{p.order_number || '#' + p.order_id}</td>
                  <td style={{ fontSize: 13 }}>{p.user_email || '-'}</td>
                  <td style={{ fontWeight: 600, color: 'var(--primary)' }}>ETB {parseFloat(p.amount).toFixed(2)}</td>
                  <td>{bankLabel(p.method)}</td>
                  <td>
                    {p.transaction_id
                      ? <code style={{ background: '#f0f0f0', padding: '2px 6px', borderRadius: 4, fontSize: 12 }}>{p.transaction_id}</code>
                      : <span style={{ color: 'var(--gray)', fontSize: 12 }}>—</span>}
                  </td>
                  <td>
                    {p.receipt_url ? (
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button className="btn" style={{ padding: '4px 8px', fontSize: 12 }}
                          onClick={() => setPreview({ url: p.receipt_url, id: p.id })}>
                          <FaEye style={{ marginRight: 3 }} />View
                        </button>
                        <button className="btn btn-success" style={{ padding: '4px 8px', fontSize: 12 }}
                          onClick={() => downloadReceipt(p.receipt_url, p.id)}>
                          <FaDownload />
                        </button>
                      </div>
                    ) : <span style={{ color: 'var(--gray)', fontSize: 12 }}>{t('noReceipt')}</span>}
                  </td>
                  <td><span className={statusClass(p.status)}>{p.status}</span></td>
                  <td style={{ fontSize: 12 }}>{new Date(p.created_at).toLocaleDateString()}</td>
                  <td>
                    {p.status === 'pending' && (
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button className="btn btn-success" style={{ padding: '5px 10px', fontSize: 12 }}
                          title="Approve" onClick={() => verify(p.id, 'completed')}>
                          <FaCheck />
                        </button>
                        <button className="btn btn-danger" style={{ padding: '5px 10px', fontSize: 12 }}
                          title="Reject" onClick={() => verify(p.id, 'rejected')}>
                          <FaTimes />
                        </button>
                        <button className="btn btn-danger" style={{ padding: '5px 10px', fontSize: 12 }}
                          title="Delete" onClick={() => deletePayment(p.id)}>
                          <FaTrash />
                        </button>
                      </div>
                    )}
                    {p.status !== 'pending' && (
                      <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                        <span style={{ color: 'var(--gray)', fontSize: 12 }}>—</span>
                        <button className="btn btn-danger" style={{ padding: '5px 10px', fontSize: 12 }}
                          title="Delete" onClick={() => deletePayment(p.id)}>
                          <FaTrash />
                        </button>
                      </div>
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
