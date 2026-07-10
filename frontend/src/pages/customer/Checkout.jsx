import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { FaLock, FaUniversity } from 'react-icons/fa'
import { useCart } from '../../context/CartContext'
import { useLanguage } from '../../context/LanguageContext'
import api from '../../services/api'
import toast from 'react-hot-toast'

export default function Checkout() {
  const { cart, clearCart } = useCart()
  const { t } = useLanguage()
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [banks, setBanks] = useState([])
  const [form, setForm] = useState({ shipping_address: '', payment_method: '' })
  const [paymentForm, setPaymentForm] = useState({ transaction_id: '', receipt: null })
  const [orderId, setOrderId] = useState(null)
  const [orderTotal, setOrderTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const items = cart?.items || []
  const total = cart?.total || 0

  useEffect(() => {
    api.get('/admin/public/bank-settings').then(r => {
      if (r.data.success) setBanks(r.data.banks)
    }).catch(() => {})
  }, [])

  const set = (f) => (e) => setForm({ ...form, [f]: e.target.value })
  const selectedBank = banks.find(b => b.bank_key === form.payment_method)

  const handlePlaceOrder = async (e) => {
    e.preventDefault()
    if (items.length === 0) { toast.error('Cart is empty'); return }
    setLoading(true)
    try {
      const r = await api.post('/orders', {
        shipping_address: form.shipping_address,
        payment_method: form.payment_method,
        items: items.map(i => ({ product_id: i.product_id, quantity: i.quantity, price: parseFloat(i.price) }))
      })
      if (r.data.success) {
        setOrderId(r.data.order.id)
        setOrderTotal(total)
        await clearCart()
        setStep(2)
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to place order')
    }
    setLoading(false)
  }

  const handlePaymentProof = async (e) => {
    e.preventDefault()
    if (!paymentForm.transaction_id) { toast.error('Please enter transaction ID'); return }
    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('transaction_id', paymentForm.transaction_id)
      formData.append('order_id', orderId)
      if (paymentForm.receipt) formData.append('receipt', paymentForm.receipt)
      const r = await api.post('/payments/submit-proof', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      if (r.data.success) {
        toast.success('Payment proof submitted! Awaiting admin verification.')
        navigate('/orders')
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit proof')
    }
    setLoading(false)
  }

  if (step === 2) {
    return (
      <div className="page">
        <h2 style={{ marginBottom: 20 }}>{t('submitPaymentProof')}</h2>
        <div style={{ maxWidth: 600, margin: '0 auto' }}>
          {selectedBank && (
            <div className="card" style={{ marginBottom: 20, background: 'rgba(67,97,238,0.05)', border: '1px solid rgba(67,97,238,0.2)' }}>
              <h3 style={{ marginBottom: 15, color: 'var(--primary)' }}>
                <FaUniversity style={{ marginRight: 8 }} />{t('bankTransferDetails')}
              </h3>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <tbody>
                  {[
                    [t('bank'), selectedBank.bank_name],
                    [t('accountNumber'), selectedBank.account_number],
                    [t('accountName'), selectedBank.account_name],
                    [t('amount'), `ETB ${parseFloat(orderTotal).toFixed(2)}`],
                  ].map(([label, value]) => (
                    <tr key={label}>
                      <td style={{ padding: '8px 0', color: 'var(--gray)', width: 140 }}>{label}</td>
                      <td style={{ padding: '8px 0', fontWeight: 600 }}>{value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p style={{ marginTop: 12, color: 'var(--gray)', fontSize: 13 }}>{t('transferExactAmount')}</p>
            </div>
          )}
          <div className="card">
            <h3 style={{ marginBottom: 20 }}>{t('paymentConfirmation')}</h3>
            <form onSubmit={handlePaymentProof}>
              <div className="form-group">
                <label>{t('transactionRef')}</label>
                <input className="form-control" placeholder="e.g. TXN123456789"
                  value={paymentForm.transaction_id}
                  onChange={e => setPaymentForm({ ...paymentForm, transaction_id: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>{t('uploadReceipt')}</label>
                <input className="form-control" type="file" accept="image/*,.pdf"
                  onChange={e => setPaymentForm({ ...paymentForm, receipt: e.target.files[0] })} />
                <small style={{ color: 'var(--gray)' }}>Accepted: JPG, PNG, PDF (max 5MB)</small>
              </div>
              <button className="btn btn-block btn-success" type="submit" disabled={loading}>
                <FaLock style={{ marginRight: 8 }} />{loading ? t('submittingPayment') : t('submitProof')}
              </button>
            </form>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="page">
      <h2 style={{ marginBottom: 20 }}>{t('completeYourOrder')}</h2>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20, alignItems: 'start' }}>
        <div className="card">
          <h3 style={{ marginBottom: 20 }}>{t('orderSummary')}</h3>
          {items.map(item => (
            <div key={item.product_id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #eee' }}>
              <span>{item.name} x{item.quantity}</span>
              <span style={{ fontWeight: 600 }}>ETB {(parseFloat(item.price) * item.quantity).toFixed(2)}</span>
            </div>
          ))}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 15, fontWeight: 700, fontSize: 18 }}>
            <span>{t('total')}</span>
            <span style={{ color: 'var(--primary)' }}>ETB {parseFloat(total).toFixed(2)}</span>
          </div>
        </div>

        <div className="card">
          <h3 style={{ marginBottom: 20 }}>{t('shippingAndPayment')}</h3>
          <form onSubmit={handlePlaceOrder}>
            <div className="form-group">
              <label>{t('shippingAddress')}</label>
              <textarea className="form-control" rows="3" value={form.shipping_address} onChange={set('shipping_address')} required />
            </div>
            <div className="form-group">
              <label>{t('paymentMethod')}</label>
              <select className="form-control" value={form.payment_method} onChange={set('payment_method')} required>
                <option value="">{t('selectBank')}</option>
                {banks.map(b => <option key={b.bank_key} value={b.bank_key}>{b.bank_name}</option>)}
              </select>
            </div>
            {selectedBank && (
              <div style={{ background: '#f8f9fa', padding: 12, borderRadius: 6, marginBottom: 15, fontSize: 13 }}>
                <p><strong>Account:</strong> {selectedBank.account_number}</p>
                <p><strong>Name:</strong> {selectedBank.account_name}</p>
                <p><strong>Amount:</strong> ETB {parseFloat(total).toFixed(2)}</p>
              </div>
            )}
            <button className="btn btn-block btn-success" type="submit" disabled={loading}>
              <FaLock style={{ marginRight: 8 }} />{loading ? t('placingOrder') : t('placeOrder')}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
