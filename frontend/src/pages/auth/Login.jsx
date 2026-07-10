import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useLanguage } from '../../context/LanguageContext'
import { Link } from 'react-router-dom'
import { FaMobileAlt, FaGlobe, FaEye, FaEyeSlash } from 'react-icons/fa'

export default function Login() {
  const { login } = useAuth()
  const { lang, switchLang, t } = useLanguage()
  const [form, setForm] = useState({ email: '', password: '' })
  const [showPw, setShowPw] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Load remembered email on mount
  useEffect(() => {
    const saved = localStorage.getItem('rememberedEmail')
    if (saved) { setForm(prev => ({ ...prev, email: saved })); setRememberMe(true) }
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(''); setLoading(true)
    if (rememberMe) {
      localStorage.setItem('rememberedEmail', form.email)
    } else {
      localStorage.removeItem('rememberedEmail')
    }
    const result = await login(form.email, form.password)
    if (result && !result.success) setError(result.message)
    setLoading(false)
  }

  const set = (f) => (e) => setForm({ ...form, [f]: e.target.value })

  return (
    <div className="auth-container">
      <div className="auth-card">
        {/* Language switcher */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#f5f5f5', borderRadius: 8, padding: '4px 8px' }}>
            <FaGlobe style={{ color: 'var(--primary)', fontSize: 13 }} />
            {[{ code: 'en', label: 'EN' }, { code: 'om', label: 'OM' }, { code: 'am', label: 'አማ' }].map(({ code, label }) => (
              <button key={code} onClick={() => switchLang(code)}
                style={{ background: lang === code ? 'var(--primary)' : 'transparent', color: lang === code ? 'white' : 'var(--dark)', border: 'none', borderRadius: 5, padding: '3px 8px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="auth-header">
          <h1><FaMobileAlt style={{ marginRight: 8 }} />NancyMobile</h1>
          <p>Mobile Accessories & Repair Services</p>
        </div>
        <h2 style={{ textAlign: 'center', marginBottom: 20 }}>{t('loginTitle')}</h2>
        {error && <p style={{ color: 'var(--danger)', marginBottom: 15, fontSize: 14 }}>{error}</p>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>{t('emailAddress')}</label>
            <input className="form-control" type="email" placeholder={t('emailAddress')}
              value={form.email} onChange={set('email')} required />
          </div>

          <div className="form-group">
            <label>{t('password')}</label>
            <div style={{ position: 'relative' }}>
              <input className="form-control" type={showPw ? 'text' : 'password'}
                placeholder={t('password')} value={form.password} onChange={set('password')} required
                style={{ paddingRight: 40 }} />
              <button type="button" onClick={() => setShowPw(!showPw)}
                style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--gray)' }}>
                {showPw ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>

          {/* Remember me + Forgot password */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14, color: 'var(--dark)' }}>
              <input type="checkbox" checked={rememberMe} onChange={e => setRememberMe(e.target.checked)}
                style={{ width: 15, height: 15, cursor: 'pointer', accentColor: 'var(--primary)' }} />
              Remember me
            </label>
            <Link to="/forgot-password" style={{ color: 'var(--primary)', fontSize: 14, textDecoration: 'none' }}>
              Forgot password?
            </Link>
          </div>

          <button className="btn btn-block" type="submit" disabled={loading}>
            {loading ? t('signingIn') : t('signIn')}
          </button>

          <div style={{ textAlign: 'center', marginTop: 15 }}>
            <p style={{ color: 'var(--gray)', fontSize: 14 }}>
              {t('noAccount')} <Link to="/register" style={{ color: 'var(--primary)' }}>{t('registerHere')}</Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}
