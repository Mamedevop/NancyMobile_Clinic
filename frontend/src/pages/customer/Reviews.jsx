import { useState, useEffect } from 'react'
import { FaStar, FaRegStar, FaEdit, FaCheckCircle, FaTools, FaUser } from 'react-icons/fa'
import { useLanguage } from '../../context/LanguageContext'
import api from '../../services/api'
import toast from 'react-hot-toast'

const StarPicker = ({ value, onChange }) => (
  <div style={{ display: 'flex', gap: 4 }}>
    {[1,2,3,4,5].map(i => (
      <button key={i} type="button" onClick={() => onChange(i)}
        style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 28, color: i <= value ? '#f8961e' : '#ddd', padding: 2, transition: 'color 0.1s' }}>
        {i <= value ? <FaStar /> : <FaRegStar />}
      </button>
    ))}
  </div>
)

const StarDisplay = ({ rating }) => (
  <span style={{ color: '#f8961e' }}>
    {[1,2,3,4,5].map(i => i <= Math.round(rating) ? <FaStar key={i} /> : <FaRegStar key={i} />)}
  </span>
)

export default function CustomerReviews() {
  const { t } = useLanguage()
  const [repairs, setRepairs] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null) // repair_id being reviewed
  const [form, setForm] = useState({ rating: 5, comment: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    api.get('/repairs/my-reviews').then(r => {
      if (r.data.success) setRepairs(r.data.repairs)
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const startReview = (repair) => {
    setEditing(repair.repair_id)
    setForm({ rating: repair.rating || 5, comment: repair.comment || '' })
  }

  const submitReview = async (repair) => {
    if (!form.rating) { toast.error('Please select a rating'); return }
    setSaving(true)
    try {
      const r = await api.post('/technician/reviews', {
        repair_id: repair.repair_id,
        technician_id: repair.assigned_to,
        rating: form.rating,
        comment: form.comment,
      })
      if (r.data.success) {
        setRepairs(prev => prev.map(rep =>
          rep.repair_id === repair.repair_id
            ? { ...rep, review_id: r.data.review.id, rating: form.rating, comment: form.comment, reviewed_at: new Date().toISOString() }
            : rep
        ))
        setEditing(null)
        toast.success(repair.review_id ? 'Review updated!' : 'Review submitted!')
      }
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to submit review') }
    setSaving(false)
  }

  if (loading) return <div className="page"><p>{t('loading')}</p></div>

  return (
    <div className="page">
      <h2 style={{ marginBottom: 8 }}><FaStar style={{ marginRight: 8, color: '#f8961e' }} />My Reviews</h2>
      <p style={{ color: 'var(--gray)', marginBottom: 24, fontSize: 14 }}>
        Rate the technicians and repair services you received. Your feedback helps improve service quality.
      </p>

      {repairs.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 50 }}>
          <FaTools style={{ fontSize: 48, color: '#ddd', marginBottom: 16 }} />
          <h3>No completed repairs yet</h3>
          <p style={{ color: 'var(--gray)' }}>Once a repair is completed, you can leave a review here.</p>
        </div>
      ) : repairs.map(repair => (
        <div className="card" key={repair.repair_id} style={{ marginBottom: 16 }}>
          {/* Repair info header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <FaTools style={{ color: 'var(--primary)' }} />
                <span style={{ fontWeight: 700, fontSize: 16 }}>{repair.device_type}</span>
                <span className="status-badge status-completed">Completed</span>
              </div>
              <div style={{ fontSize: 13, color: 'var(--gray)', marginBottom: 4 }}>{repair.issue_description}</div>
              <div style={{ fontSize: 12, color: 'var(--gray)' }}>
                {repair.completed_at ? `Completed: ${new Date(repair.completed_at).toLocaleDateString()}` : ''}
                {repair.estimated_cost ? ` · ETB ${parseFloat(repair.estimated_cost).toFixed(2)}` : ''}
              </div>
            </div>

            {/* Technician info */}
            {repair.tech_first && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#f8f9fa', borderRadius: 8, padding: '8px 14px' }}>
                {repair.tech_pic
                  ? <img src={repair.tech_pic} alt="" style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover' }} />
                  : <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: 13 }}>
                      {repair.tech_first?.[0]}{repair.tech_last?.[0]}
                    </div>
                }
                <div>
                  <div style={{ fontSize: 12, color: 'var(--gray)' }}>Technician</div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{repair.tech_first} {repair.tech_last}</div>
                </div>
              </div>
            )}
          </div>

          {/* Review section */}
          {editing === repair.repair_id ? (
            /* Edit / submit form */
            <div style={{ borderTop: '1px solid #eee', paddingTop: 16 }}>
              <h4 style={{ marginBottom: 12 }}>
                {repair.review_id ? 'Update Your Review' : 'Leave a Review'}
              </h4>
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 13, color: 'var(--gray)', marginBottom: 6 }}>Rating *</div>
                <StarPicker value={form.rating} onChange={v => setForm({ ...form, rating: v })} />
                <div style={{ fontSize: 12, color: 'var(--gray)', marginTop: 4 }}>
                  {['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][form.rating]}
                </div>
              </div>
              <div className="form-group">
                <label style={{ fontSize: 13 }}>Comment (optional)</label>
                <textarea className="form-control" rows="3"
                  placeholder="Describe your experience with the technician and the repair service..."
                  value={form.comment} onChange={e => setForm({ ...form, comment: e.target.value })} />
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button className="btn btn-success" disabled={saving} onClick={() => submitReview(repair)}>
                  {saving ? t('saving') : repair.review_id ? 'Update Review' : 'Submit Review'}
                </button>
                <button className="btn btn-outline" onClick={() => setEditing(null)}>{t('cancel')}</button>
              </div>
            </div>
          ) : repair.review_id ? (
            /* Already reviewed — show it */
            <div style={{ borderTop: '1px solid #eee', paddingTop: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <FaCheckCircle style={{ color: '#28a745', fontSize: 14 }} />
                    <span style={{ fontSize: 13, color: '#28a745', fontWeight: 600 }}>You reviewed this</span>
                    <StarDisplay rating={repair.rating} />
                    <span style={{ fontWeight: 700, color: '#f8961e' }}>{repair.rating}/5</span>
                  </div>
                  {repair.comment && (
                    <p style={{ fontSize: 14, color: 'var(--dark)', margin: 0, fontStyle: 'italic' }}>
                      "{repair.comment}"
                    </p>
                  )}
                  <div style={{ fontSize: 11, color: 'var(--gray)', marginTop: 6 }}>
                    {repair.reviewed_at ? new Date(repair.reviewed_at).toLocaleDateString() : ''}
                  </div>
                </div>
                <button className="btn btn-outline" style={{ fontSize: 12, padding: '5px 12px' }}
                  onClick={() => startReview(repair)}>
                  <FaEdit style={{ marginRight: 4 }} />Edit
                </button>
              </div>
            </div>
          ) : (
            /* Not reviewed yet */
            <div style={{ borderTop: '1px solid #eee', paddingTop: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <p style={{ color: 'var(--gray)', fontSize: 13, margin: 0 }}>You haven't reviewed this repair yet.</p>
              <button className="btn" style={{ fontSize: 13 }} onClick={() => startReview(repair)}>
                <FaStar style={{ marginRight: 6, color: '#f8961e' }} />Write a Review
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
