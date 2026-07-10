import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useLanguage } from '../../context/LanguageContext'
import { Link } from 'react-router-dom'
import { FaMobileAlt, FaGlobe, FaEye, FaEyeSlash, FaDice, FaCheckCircle, FaTimesCircle } from 'react-icons/fa'

// Phone validation: 09/07 + 8 digits OR +2519/+2517 + 8 digits
const isValidPhone = (ph) =>
  /^(09|07)\d{8}$/.test(ph) || /^\+251(9|7)\d{8}$/.test(ph)
const checkPassword = (pw) => ({
  length:  pw.length >= 12,
  upper:   /[A-Z]/.test(pw),
  lower:   /[a-z]/.test(pw),
  number:  /[0-9]/.test(pw),
  symbol:  /[^A-Za-z0-9]/.test(pw),
})

const isStrong = (pw) => Object.values(checkPassword(pw)).every(Boolean)

// Generate a strong random password
const generatePassword = () => {
  const upper  = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const lower  = 'abcdefghijklmnopqrstuvwxyz'
  const nums   = '0123456789'
  const syms   = '!@#$%^&*()-_=+[]{}|;:,.<>?'
  const all    = upper + lower + nums + syms
  const rand   = (s) => s[Math.floor(Math.random() * s.length)]
  // Guarantee at least one of each
  let pw = rand(upper) + rand(lower) + rand(nums) + rand(syms)
  for (let i = 0; i < 10; i++) pw += rand(all)
  // Shuffle
  return pw.split('').sort(() => Math.random() - 0.5).join('')
}

export default function Register() {
  const { register } = useAuth()
  const { lang, switchLang, t } = useLanguage()
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '', phone: '', address: '', role: 'customer' })
  const [showPw, setShowPw] = useState(false)
  const [agreed, setAgreed] = useState(false)
  const [showTerms, setShowTerms] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const checks = checkPassword(form.password)
  const strong = isStrong(form.password)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!strong) { setError('Password does not meet the requirements.'); return }
    if (form.firstName.replace(/\s/g,'').length < 3) { setError('First name must be at least 3 characters.'); return }
    if (form.lastName.replace(/\s/g,'').length < 3) { setError('Last name must be at least 3 characters.'); return }
    if (!/^[a-zA-Z0-9]+@gmail\.com$/.test(form.email)) { setError('Email must be letters/numbers only before @gmail.com'); return }
    if (form.phone && !isValidPhone(form.phone)) { setError('Phone must be 09xxxxxxxx, 07xxxxxxxx, +2519xxxxxxxx or +2517xxxxxxxx.'); return }
    if (!agreed) { setError('You must agree to the Terms & Conditions.'); return }
    setError(''); setLoading(true)
    const result = await register(form)
    if (result && !result.success) setError(result.message)
    setLoading(false)
  }

  const set = (f) => (e) => setForm({ ...form, [f]: e.target.value })

  const handleGenerate = () => {
    const pw = generatePassword()
    setForm(prev => ({ ...prev, password: pw }))
    setShowPw(true)
  }

  const strengthScore = Object.values(checks).filter(Boolean).length
  const strengthColor = strengthScore <= 2 ? '#ef4444' : strengthScore <= 3 ? '#f97316' : strengthScore === 4 ? '#eab308' : '#22c55e'
  const strengthLabel = ['', 'Weak', 'Weak', 'Fair', 'Good', 'Strong'][strengthScore]

  return (
    <div className="auth-container">
      <div className="auth-card" style={{ maxWidth: 520 }}>
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
        <h2 style={{ textAlign: 'center', marginBottom: 20 }}>{t('createAccount')}</h2>
        {error && <p style={{ color: 'var(--danger)', marginBottom: 15, fontSize: 14 }}>{error}</p>}

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group">
              <label>{t('firstName')}</label>
              <input className="form-control" placeholder={t('firstName')} value={form.firstName}
                onChange={e => { const v = e.target.value.replace(/[^a-zA-Z\s]/g, ''); setForm({ ...form, firstName: v }) }}
                required minLength={3} />
              {form.firstName && form.firstName.replace(/\s/g,'').length < 3 && (
                <small style={{ color: 'var(--danger)', fontSize: 12 }}>At least 3 characters</small>
              )}
            </div>
            <div className="form-group">
              <label>{t('lastName')}</label>
              <input className="form-control" placeholder={t('lastName')} value={form.lastName}
                onChange={e => { const v = e.target.value.replace(/[^a-zA-Z\s]/g, ''); setForm({ ...form, lastName: v }) }}
                required minLength={3} />
              {form.lastName && form.lastName.replace(/\s/g,'').length < 3 && (
                <small style={{ color: 'var(--danger)', fontSize: 12 }}>At least 3 characters</small>
              )}
            </div>
          </div>

          <div className="form-group">
            <label>{t('emailAddress')}</label>
            <input className="form-control" type="email" placeholder="yourname@gmail.com"
              value={form.email}
              onChange={e => {
                // Only allow letters before @gmail.com — strip anything else as they type
                let v = e.target.value.toLowerCase()
                setForm({ ...form, email: v })
              }}
              required />
            {form.email && !/^[a-zA-Z0-9]+@gmail\.com$/.test(form.email) && (
              <small style={{ color: 'var(--danger)', fontSize: 12 }}>
                Only letters and numbers before @gmail.com (e.g. john123@gmail.com)
              </small>
            )}
          </div>

          {/* Password field */}
          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <label style={{ margin: 0 }}>{t('password')}</label>
              <button type="button" onClick={handleGenerate}
                style={{ background: 'none', border: '1px solid var(--primary)', color: 'var(--primary)', borderRadius: 6, padding: '3px 10px', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                <FaDice /> Generate
              </button>
            </div>
            <div style={{ position: 'relative' }}>
              <input className="form-control" type={showPw ? 'text' : 'password'}
                placeholder="Min 12 chars, mixed case, number & symbol"
                value={form.password} onChange={set('password')} required
                style={{ paddingRight: 40, fontFamily: showPw ? 'inherit' : 'monospace' }} />
              <button type="button" onClick={() => setShowPw(!showPw)}
                style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--gray)' }}>
                {showPw ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>

            {/* Strength bar */}
            {form.password && (
              <div style={{ marginTop: 8 }}>
                <div style={{ display: 'flex', gap: 4, marginBottom: 6 }}>
                  {[1,2,3,4,5].map(i => (
                    <div key={i} style={{ flex: 1, height: 4, borderRadius: 2, background: i <= strengthScore ? strengthColor : '#e5e7eb', transition: 'background 0.3s' }} />
                  ))}
                </div>
                <div style={{ fontSize: 12, color: strengthColor, fontWeight: 600, marginBottom: 8 }}>{strengthLabel}</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
                  {[
                    { key: 'length', label: '≥ 12 characters' },
                    { key: 'upper',  label: 'Uppercase letter' },
                    { key: 'lower',  label: 'Lowercase letter' },
                    { key: 'number', label: 'Number' },
                    { key: 'symbol', label: 'Symbol (!@#...)' },
                  ].map(r => (
                    <div key={r.key} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12 }}>
                      {checks[r.key]
                        ? <FaCheckCircle style={{ color: '#22c55e', fontSize: 11 }} />
                        : <FaTimesCircle style={{ color: '#ef4444', fontSize: 11 }} />}
                      <span style={{ color: checks[r.key] ? '#22c55e' : '#888' }}>{r.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="form-group">
            <label>{t('phoneNumber')}</label>
            <input className="form-control"
              placeholder="09xxxxxxxx / 07xxxxxxxx / +2519xxxxxxxx"
              value={form.phone}
              maxLength={13}
              onChange={e => {
                let v = e.target.value
                // Allow + only at the start
                v = v.replace(/(?!^\+)[^0-9]/g, '')
                // If starts with +, allow up to 13 chars (+251 + 9 digits), else digits only max 10
                if (v.startsWith('+')) {
                  v = '+' + v.slice(1).replace(/[^0-9]/g, '').slice(0, 12)
                } else {
                  v = v.replace(/[^0-9]/g, '').slice(0, 10)
                }
                setForm({ ...form, phone: v })
              }}
            />
            {form.phone && !isValidPhone(form.phone) && (
              <small style={{ color: 'var(--danger)', fontSize: 12 }}>
                Use 09xxxxxxxx, 07xxxxxxxx, +2519xxxxxxxx or +2517xxxxxxxx
              </small>
            )}
          </div>
          <div className="form-group">
            <label>{t('address')}</label>
            <textarea className="form-control" placeholder={t('address')} rows="2" value={form.address} onChange={set('address')} />
          </div>
          <div className="form-group">
            <label>{t('registerAs')}</label>
            <select className="form-control" value={form.role} onChange={set('role')}>
              <option value="customer">{t('customer')}</option>
              <option value="technician">{t('technician')}</option>
            </select>
          </div>

          {/* Terms & Conditions */}
          <div style={{ background: '#f8f9fa', borderRadius: 8, padding: '12px 14px', marginBottom: 16, border: '1px solid #e5e7eb' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <input type="checkbox" id="agree" checked={agreed} onChange={e => setAgreed(e.target.checked)}
                style={{ marginTop: 3, cursor: 'pointer', width: 16, height: 16, accentColor: 'var(--primary)' }} />
              <label htmlFor="agree" style={{ fontSize: 13, color: 'var(--dark)', cursor: 'pointer', lineHeight: 1.5 }}>
                I have read and agree to the{' '}
                <button type="button" onClick={() => setShowTerms(true)}
                  style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontWeight: 600, padding: 0, fontSize: 13, textDecoration: 'underline' }}>
                  Terms & Conditions
                </button>
                {' '}and{' '}
                <button type="button" onClick={() => setShowTerms(true)}
                  style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontWeight: 600, padding: 0, fontSize: 13, textDecoration: 'underline' }}>
                  Privacy Policy
                </button>
              </label>
            </div>
          </div>

          <button className="btn btn-block" type="submit" disabled={loading || !agreed || !strong}>
            {loading ? t('creatingAccount') : t('createAccount')}
          </button>

          <div style={{ textAlign: 'center', marginTop: 15 }}>
            <p style={{ color: 'var(--gray)', fontSize: 14 }}>
              {t('alreadyHaveAccount')} <Link to="/login" style={{ color: 'var(--primary)' }}>{t('loginHere')}</Link>
            </p>
          </div>
        </form>
      </div>

      {/* Terms Modal */}
      {showTerms && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
          onClick={() => setShowTerms(false)}>
          <div style={{ background: 'white', borderRadius: 16, padding: 32, maxWidth: 560, width: '100%', maxHeight: '80vh', overflow: 'auto' }}
            onClick={e => e.stopPropagation()}>
            <h2 style={{ marginBottom: 16, color: 'var(--primary)' }}>Terms & Conditions</h2>
            <div style={{ fontSize: 14, color: '#444', lineHeight: 1.8 }}>
              <p><strong>1. Acceptance of Terms</strong><br />By registering on NancyMobile, you agree to these terms and conditions in full.</p>
              <p><strong>2. Account Responsibility</strong><br />You are responsible for maintaining the confidentiality of your account credentials. You must notify us immediately of any unauthorized use.</p>
              <p><strong>3. Verification</strong><br />Your account must be verified by an admin before accessing all features. You agree to provide accurate identity information.</p>
              <p><strong>4. Use of Services</strong><br />You agree to use NancyMobile services only for lawful purposes. Misuse, fraud, or abuse will result in account termination.</p>
              <p><strong>5. Repair Services</strong><br />Repair estimates are provided in good faith. Final costs may vary based on diagnosis. NancyMobile is not liable for pre-existing damage.</p>
              <p><strong>6. Payments</strong><br />All payments are processed securely. Cash on delivery is available for eligible orders. Refunds are subject to our return policy.</p>
              <p><strong>7. Privacy</strong><br />We collect and process your personal data in accordance with our Privacy Policy. We do not sell your data to third parties.</p>
              <p><strong>8. Changes</strong><br />NancyMobile reserves the right to modify these terms at any time. Continued use constitutes acceptance of updated terms.</p>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button className="btn btn-block" onClick={() => { setAgreed(true); setShowTerms(false) }}>
                I Agree
              </button>
              <button className="btn btn-outline btn-block" onClick={() => setShowTerms(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
