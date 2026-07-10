import { useState, useEffect } from 'react'
import { FaStar, FaRegStar } from 'react-icons/fa'
import { useLanguage } from '../../context/LanguageContext'
import api from '../../services/api'

const Stars = ({ rating }) => (
  <span style={{ color: '#f8961e' }}>
    {[1,2,3,4,5].map(i => i <= rating ? <FaStar key={i} /> : <FaRegStar key={i} />)}
  </span>
)

export default function TechReviews() {
  const { t } = useLanguage()
  const [reviews, setReviews] = useState([])
  const [average, setAverage] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/technician/reviews').then(r => {
      if (r.data.success) { setReviews(r.data.reviews); setAverage(r.data.average) }
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="page"><p>{t('loading')}</p></div>

  return (
    <div className="page">
      <h2 style={{ marginBottom: 20 }}><FaStar style={{ marginRight: 8, color: '#f8961e' }} />Reviews & Ratings</h2>

      {/* Average rating card */}
      <div className="card" style={{ marginBottom: 20, textAlign: 'center', padding: 30 }}>
        <div style={{ fontSize: 56, fontWeight: 800, color: 'var(--primary)', lineHeight: 1 }}>{average.toFixed(1)}</div>
        <div style={{ marginTop: 8 }}><Stars rating={Math.round(average)} /></div>
        <p style={{ color: 'var(--gray)', marginTop: 8 }}>{reviews.length} review{reviews.length !== 1 ? 's' : ''}</p>
      </div>

      {reviews.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 40 }}>
          <FaStar style={{ fontSize: 48, color: '#ddd', marginBottom: 12 }} />
          <p style={{ color: 'var(--gray)' }}>No reviews yet. Complete repairs to receive customer feedback.</p>
        </div>
      ) : reviews.map(r => (
        <div className="card" key={r.id} style={{ marginBottom: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>{r.first_name} {r.last_name}</div>
              <div style={{ fontSize: 12, color: 'var(--gray)', marginBottom: 8 }}>{r.device_type} · {new Date(r.created_at).toLocaleDateString()}</div>
              <Stars rating={r.rating} />
              {r.comment && <p style={{ marginTop: 8, fontSize: 14, color: 'var(--dark)' }}>{r.comment}</p>}
            </div>
            <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--primary)' }}>{r.rating}/5</div>
          </div>
        </div>
      ))}
    </div>
  )
}
