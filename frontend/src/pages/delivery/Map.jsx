import { useState, useEffect } from 'react'
import { FaMapMarkerAlt, FaRoute, FaExternalLinkAlt, FaTruck, FaPhone, FaDirections } from 'react-icons/fa'
import { useLanguage } from '../../context/LanguageContext'
import api from '../../services/api'

export default function DeliveryMap() {
  const { t } = useLanguage()
  const [jobs, setJobs] = useState([])
  const [selected, setSelected] = useState(null)
  const [loading, setLoading] = useState(true)
  const [myLocation, setMyLocation] = useState(null)
  const [locating, setLocating] = useState(false)

  useEffect(() => {
    api.get('/delivery/jobs').then(r => {
      if (r.data.success) {
        const active = r.data.jobs.filter(j => j.status === 'pending' || j.status === 'in-progress')
        setJobs(active)
        if (active.length > 0) setSelected(active[0])
      }
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const getMyLocation = () => {
    setLocating(true)
    navigator.geolocation?.getCurrentPosition(
      pos => { setMyLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }); setLocating(false) },
      () => { setLocating(false) }
    )
  }

  // Build the delivery address for the selected job
  const deliveryAddress = selected
    ? encodeURIComponent(selected.delivery_address || selected.shipping_address || '')
    : ''

  // OpenStreetMap embed URL
  const osmUrl = deliveryAddress
    ? `https://www.openstreetmap.org/export/embed.html?bbox=-180,-90,180,90&layer=mapnik&marker=0,0&query=${deliveryAddress}`
    : null

  // Google Maps directions URL
  const googleMapsUrl = deliveryAddress
    ? `https://www.google.com/maps/dir/?api=1${myLocation ? `&origin=${myLocation.lat},${myLocation.lng}` : ''}&destination=${deliveryAddress}&travelmode=driving`
    : null

  // Waze URL
  const wazeUrl = deliveryAddress
    ? `https://waze.com/ul?q=${deliveryAddress}&navigate=yes`
    : null

  // Google Maps search (just show location)
  const googleMapsSearch = deliveryAddress
    ? `https://www.google.com/maps/search/?api=1&query=${deliveryAddress}`
    : null

  return (
    <div className="page" style={{ padding: 0 }}>
      <div style={{ padding: '20px 24px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2><FaMapMarkerAlt style={{ marginRight: 8, color: 'var(--primary)' }} />Map & Navigation</h2>
        <button className="btn btn-outline" style={{ fontSize: 13 }} onClick={getMyLocation} disabled={locating}>
          {locating ? 'Locating...' : '📍 Get My Location'}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', height: 'calc(100vh - 140px)', gap: 0 }}>

        {/* Left panel — job list */}
        <div style={{ borderRight: '1px solid #eee', overflowY: 'auto', background: 'white' }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid #eee', fontSize: 13, fontWeight: 600, color: 'var(--gray)' }}>
            ACTIVE DELIVERIES ({jobs.length})
          </div>

          {loading ? (
            <p style={{ padding: 20, color: 'var(--gray)', fontSize: 13 }}>{t('loading')}</p>
          ) : jobs.length === 0 ? (
            <div style={{ padding: 24, textAlign: 'center' }}>
              <FaTruck style={{ fontSize: 36, color: '#ddd', marginBottom: 10 }} />
              <p style={{ color: 'var(--gray)', fontSize: 13 }}>No active deliveries.</p>
            </div>
          ) : jobs.map(job => (
            <div key={job.id} onClick={() => setSelected(job)}
              style={{
                padding: '14px 16px', cursor: 'pointer', borderBottom: '1px solid #f0f0f0',
                background: selected?.id === job.id ? 'rgba(67,97,238,0.06)' : 'white',
                borderLeft: selected?.id === job.id ? '3px solid var(--primary)' : '3px solid transparent',
                transition: 'all 0.15s'
              }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                <span style={{ fontWeight: 700, color: 'var(--primary)', fontSize: 13 }}>
                  {job.order_number || `#${job.order_id}`}
                </span>
                <span className={job.status === 'in-progress' ? 'status-badge status-processing' : 'status-badge status-pending'} style={{ fontSize: 10 }}>
                  {job.status}
                </span>
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
                {job.customer_first} {job.customer_last}
              </div>
              {job.customer_phone && (
                <div style={{ fontSize: 12, color: 'var(--gray)', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
                  <FaPhone style={{ fontSize: 10 }} /> {job.customer_phone}
                </div>
              )}
              <div style={{ fontSize: 12, color: 'var(--gray)', display: 'flex', alignItems: 'flex-start', gap: 4 }}>
                <FaMapMarkerAlt style={{ color: 'var(--danger)', fontSize: 11, marginTop: 2, flexShrink: 0 }} />
                <span style={{ lineHeight: 1.4 }}>{job.delivery_address || job.shipping_address || 'No address'}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Right panel — map + navigation */}
        <div style={{ display: 'flex', flexDirection: 'column', background: '#f8f9fa' }}>
          {!selected ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--gray)' }}>
              <FaMapMarkerAlt style={{ fontSize: 56, marginBottom: 16, opacity: 0.3 }} />
              <p>Select a delivery to view the map</p>
            </div>
          ) : (
            <>
              {/* Customer info bar */}
              <div style={{ padding: '12px 20px', background: 'white', borderBottom: '1px solid #eee', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>{selected.customer_first} {selected.customer_last}</div>
                  <div style={{ fontSize: 13, color: 'var(--gray)', display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                    <FaMapMarkerAlt style={{ color: 'var(--danger)', fontSize: 12 }} />
                    {selected.delivery_address || selected.shipping_address || 'No address provided'}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {selected.customer_phone && (
                    <a href={`tel:${selected.customer_phone}`} className="btn btn-outline" style={{ fontSize: 12, padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 5 }}>
                      <FaPhone /> Call
                    </a>
                  )}
                  {googleMapsUrl && (
                    <a href={googleMapsUrl} target="_blank" rel="noopener noreferrer"
                      className="btn" style={{ fontSize: 12, padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 5 }}>
                      <FaDirections /> Google Maps
                    </a>
                  )}
                  {wazeUrl && (
                    <a href={wazeUrl} target="_blank" rel="noopener noreferrer"
                      className="btn btn-outline" style={{ fontSize: 12, padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 5 }}>
                      <FaRoute /> Waze
                    </a>
                  )}
                </div>
              </div>

              {/* Map iframe */}
              <div style={{ flex: 1, position: 'relative' }}>
                {deliveryAddress ? (
                  <iframe
                    title="Delivery Map"
                    width="100%"
                    height="100%"
                    style={{ border: 'none', display: 'block' }}
                    src={`https://maps.google.com/maps?q=${deliveryAddress}&output=embed&z=15`}
                    allowFullScreen
                  />
                ) : (
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gray)', height: '100%' }}>
                    <div style={{ textAlign: 'center' }}>
                      <FaMapMarkerAlt style={{ fontSize: 48, marginBottom: 12, opacity: 0.3 }} />
                      <p>No address available for this delivery.</p>
                    </div>
                  </div>
                )}

                {/* Open in full map button */}
                {googleMapsSearch && (
                  <a href={googleMapsSearch} target="_blank" rel="noopener noreferrer"
                    style={{ position: 'absolute', bottom: 16, right: 16, background: 'white', borderRadius: 8, padding: '8px 14px', boxShadow: '0 2px 8px rgba(0,0,0,0.15)', fontSize: 13, fontWeight: 600, color: 'var(--primary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <FaExternalLinkAlt style={{ fontSize: 11 }} /> Open in Google Maps
                  </a>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
