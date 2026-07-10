import { useState, useEffect } from 'react'
import { FaUser, FaSave, FaCamera, FaIdCard, FaCheckCircle, FaClock, FaTimesCircle, FaLock, FaEnvelope } from 'react-icons/fa'
import { useAuth } from '../../context/AuthContext'
import { useLanguage } from '../../context/LanguageContext'
import toast from 'react-hot-toast'
import api from '../../services/api'

export default function Profile() {
  const { user, checkAuth } = useAuth()
  const { t } = useLanguage()
  const [profile, setProfile] = useState(null)
  const [nameForm, setNameForm] = useState({ first_name: '', last_name: '' })
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [verifyForm, setVerifyForm] = useState({ phone: '', address: '', national_id: '', fan_number: '' })
  const [profilePic, setProfilePic] = useState(null)
  const [nationalIdFile, setNationalIdFile] = useState(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    api.get('/users/profile').then(r => {
      if (r.data.success) {
        const u = r.data.user
        setProfile(u)
        setNameForm({ first_name: u.first_name || '', last_name: u.last_name || '' })
        setVerifyForm({ phone: u.phone || '', address: u.address || '', national_id: u.national_id || '', fan_number: u.fan_number || '' })
      }
    }).catch(() => {})
  }, [])

  const isVerified = profile?.is_verified
  const isPending = profile?.verification_status === 'pending'
  const isRejected = profile?.verification_status === 'rejected'

  const handleNameSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const fd = new FormData()
      fd.append('first_name', nameForm.first_name)
      fd.append('last_name', nameForm.last_name)
      const r = await api.put('/users/profile', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      if (r.data.success) { await checkAuth(); toast.success('Name updated!') }
    } catch (err) { toast.error(err.response?.data?.message || err.message || 'Failed to update') }
    setSaving(false)
  }

  const handleVerifySubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const fd = new FormData()
      Object.entries(verifyForm).forEach(([k, v]) => v && fd.append(k, v))
      if (profilePic) fd.append('profile_picture', profilePic)
      if (nationalIdFile) fd.append('national_id_file', nationalIdFile)
      const r = await api.put('/users/profile', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      if (r.data.success) {
        setProfile(r.data.user)
        await checkAuth()
        toast.success(r.data.user.verification_status === 'pending' ? 'Profile submitted for verification!' : 'Profile updated!')
      }
    } catch (err) { toast.error(err.response?.data?.message || err.message || 'Failed to update') }
    setSaving(false)
  }

  const handlePassword = async (e) => {
    e.preventDefault()
    if (pwForm.newPassword !== pwForm.confirmPassword) { toast.error('Passwords do not match'); return }
    try {
      await api.put('/users/change-password', { currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword })
      toast.success('Password changed!')
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to change password') }
  }

  const initials = `${profile?.first_name?.[0] || ''}${profile?.last_name?.[0] || ''}`.toUpperCase()

  const StatusBanner = () => {
    if (isVerified) return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#28a745', background: 'rgba(40,167,69,0.1)', padding: '12px 16px', borderRadius: 8, marginBottom: 20 }}>
        <FaCheckCircle /> <strong>{t('accountVerified')}</strong> — {t('fullAccessVerified')}
      </div>
    )
    if (isPending) return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--warning)', background: 'rgba(248,150,30,0.1)', padding: '12px 16px', borderRadius: 8, marginBottom: 20 }}>
        <FaClock /> <strong>{t('verificationPendingStatus')}</strong> — {t('verificationPending')}
      </div>
    )
    if (isRejected) return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--danger)', background: 'rgba(247,37,133,0.1)', padding: '12px 16px', borderRadius: 8, marginBottom: 20 }}>
        <FaTimesCircle /> <strong>{t('verificationRejected')}</strong>
      </div>
    )
    return (
      <div style={{ background: 'rgba(67,97,238,0.05)', border: '1px solid rgba(67,97,238,0.2)', padding: '12px 16px', borderRadius: 8, marginBottom: 20, fontSize: 14 }}>
        <strong>{t('completeProfileToVerify')}</strong>
        <ul style={{ marginTop: 8, paddingLeft: 20, color: 'var(--gray)' }}>
          {!profile?.profile_picture && <li>{t('uploadProfilePicture')}</li>}
          {!profile?.national_id && !profile?.fan_number && <li>{t('enterNationalId')}</li>}
          {!profile?.phone && <li>{t('addPhoneNumber')}</li>}
        </ul>
      </div>
    )
  }

  return (
    <div className="page">
      <h2 style={{ marginBottom: 20 }}><FaUser style={{ marginRight: 8, color: 'var(--primary)' }} />{t('myProfile')}</h2>
      <StatusBanner />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          <div className="card">
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div style={{ position: 'relative', display: 'inline-block' }}>
                {profile?.profile_picture
                  ? <img src={profile.profile_picture} alt="Profile" style={{ width: 100, height: 100, borderRadius: '50%', objectFit: 'cover' }} />
                  : <div className="user-avatar" style={{ width: 100, height: 100, fontSize: 36, margin: '0 auto' }}>{initials}</div>
                }
                {!isVerified && (
                  <label style={{ position: 'absolute', bottom: 0, right: 0, background: 'var(--primary)', color: 'white', borderRadius: '50%', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                    <FaCamera size={12} />
                    <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => setProfilePic(e.target.files[0])} />
                  </label>
                )}
              </div>
              {profilePic && <p style={{ fontSize: 12, color: 'var(--primary)', marginTop: 6 }}>{profilePic.name}</p>}
            </div>

            <h4 style={{ marginBottom: 12 }}>{t('nameAndEmail')}</h4>
            <form onSubmit={handleNameSave}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div className="form-group">
                  <label>{t('firstName')}</label>
                  <input className="form-control" value={nameForm.first_name} onChange={e => setNameForm({ ...nameForm, first_name: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>{t('lastName')}</label>
                  <input className="form-control" value={nameForm.last_name} onChange={e => setNameForm({ ...nameForm, last_name: e.target.value })} />
                </div>
              </div>
              <div className="form-group">
                <label>{t('email')}</label>
                <input className="form-control" value={profile?.email || ''} disabled style={{ background: '#f8f9fa', color: 'var(--gray)' }} />
                <small style={{ color: 'var(--gray)' }}>{t('contactAdminEmail')}</small>
              </div>
              <button className="btn btn-block" type="submit" disabled={saving}>
                <FaSave style={{ marginRight: 6 }} />{t('updateName')}
              </button>
            </form>
          </div>

          <div className="card">
            <h4 style={{ marginBottom: 15 }}><FaLock style={{ marginRight: 6, color: 'var(--primary)' }} />{t('changePassword')}</h4>
            <form onSubmit={handlePassword}>
              <div className="form-group">
                <label>{t('currentPassword')}</label>
                <input className="form-control" type="password" value={pwForm.currentPassword} onChange={e => setPwForm({ ...pwForm, currentPassword: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>{t('newPassword')}</label>
                <input className="form-control" type="password" value={pwForm.newPassword} onChange={e => setPwForm({ ...pwForm, newPassword: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>{t('confirmNewPassword')}</label>
                <input className="form-control" type="password" value={pwForm.confirmPassword} onChange={e => setPwForm({ ...pwForm, confirmPassword: e.target.value })} required />
              </div>
              <button className="btn btn-block btn-success" type="submit">{t('changePassword')}</button>
            </form>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {isVerified ? (
            <div className="card">
              <h4 style={{ marginBottom: 15 }}><FaIdCard style={{ marginRight: 6, color: 'var(--primary)' }} />{t('verifiedInfo')}</h4>
              <div style={{ background: 'rgba(40,167,69,0.05)', border: '1px solid rgba(40,167,69,0.2)', borderRadius: 8, padding: 15, marginBottom: 15 }}>
                <p style={{ fontSize: 13, color: '#28a745' }}>
                  <FaCheckCircle style={{ marginRight: 6 }} />{t('fullAccessVerified')}
                </p>
              </div>
              {[
                [t('phone'), profile?.phone],
                [t('address'), profile?.address],
                [t('nationalIdNumber'), profile?.national_id],
                [t('fanNumber'), profile?.fan_number],
              ].map(([label, value]) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #eee' }}>
                  <span style={{ color: 'var(--gray)', fontSize: 14 }}>{label}</span>
                  <span style={{ fontWeight: 500 }}>{value || <em style={{ color: 'var(--gray)' }}>—</em>}</span>
                </div>
              ))}
              <div style={{ marginTop: 15, textAlign: 'center' }}>
                <a href="mailto:admin@nancymobile.com" className="btn btn-outline" style={{ fontSize: 13 }}>
                  <FaEnvelope style={{ marginRight: 6 }} />{t('contactAdmin')}
                </a>
              </div>
            </div>
          ) : (
            <div className="card">
              <h4 style={{ marginBottom: 15 }}><FaIdCard style={{ marginRight: 6, color: 'var(--primary)' }} />{t('identityVerification')}</h4>
              <form onSubmit={handleVerifySubmit}>
                <div className="form-group">
                  <label>{t('phoneNumber')}</label>
                  <input className="form-control" placeholder="+251..." value={verifyForm.phone} onChange={e => setVerifyForm({ ...verifyForm, phone: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>{t('address')}</label>
                  <textarea className="form-control" rows="2" value={verifyForm.address} onChange={e => setVerifyForm({ ...verifyForm, address: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>{t('nationalIdNumber')}</label>
                  <input className="form-control" value={verifyForm.national_id} onChange={e => setVerifyForm({ ...verifyForm, national_id: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>{t('fanNumber')}</label>
                  <input className="form-control" value={verifyForm.fan_number} onChange={e => setVerifyForm({ ...verifyForm, fan_number: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>{t('uploadIdDocument')}</label>
                  <input className="form-control" type="file" accept="image/*,.pdf" onChange={e => setNationalIdFile(e.target.files[0])} />
                </div>
                {!isPending && (
                  <button className="btn btn-block btn-success" type="submit" disabled={saving}>
                    <FaSave style={{ marginRight: 6 }} />{saving ? t('submitting') : t('saveAndSubmit')}
                  </button>
                )}
                {isPending && (
                  <div style={{ textAlign: 'center', color: 'var(--warning)', padding: 10 }}>
                    <FaClock style={{ marginRight: 6 }} />{t('awaitingReview')}
                  </div>
                )}
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
