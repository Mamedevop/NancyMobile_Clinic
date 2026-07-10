import { useState, useEffect } from 'react'
import { FaUser, FaSave, FaCamera, FaLock } from 'react-icons/fa'
import { useAuth } from '../../context/AuthContext'
import { useLanguage } from '../../context/LanguageContext'
import toast from 'react-hot-toast'
import api from '../../services/api'

export default function AdminProfile() {
  const { user, checkAuth } = useAuth()
  const { t } = useLanguage()
  const [profile, setProfile] = useState(null)
  const [nameForm, setNameForm] = useState({ first_name: '', last_name: '', email: '' })
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [profilePic, setProfilePic] = useState(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    api.get('/users/profile').then(r => {
      if (r.data.success) {
        const u = r.data.user
        setProfile(u)
        setNameForm({ first_name: u.first_name || '', last_name: u.last_name || '', email: u.email || '' })
      }
    }).catch(() => {})
  }, [])

  const initials = profile ? `${profile.first_name?.[0] || ''}${profile.last_name?.[0] || ''}`.toUpperCase() : 'A'

  const handleNameSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const fd = new FormData()
      fd.append('first_name', nameForm.first_name)
      fd.append('last_name', nameForm.last_name)
      if (nameForm.email) fd.append('email', nameForm.email)
      if (profilePic) fd.append('profile_picture', profilePic)
      const r = await api.put('/users/profile', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      if (r.data.success) {
        setProfile(r.data.user)
        setProfilePic(null)
        await checkAuth()
        toast.success('Profile updated!')
      }
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to update') }
    setSaving(false)
  }

  const handlePassword = async (e) => {
    e.preventDefault()
    if (pwForm.newPassword !== pwForm.confirmPassword) { toast.error('Passwords do not match'); return }
    if (pwForm.newPassword.length < 8) { toast.error('Password must be at least 8 characters'); return }
    try {
      await api.put('/users/change-password', { currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword })
      toast.success('Password changed!')
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to change password') }
  }

  return (
    <div className="page">
      <h2 style={{ marginBottom: 20 }}><FaUser style={{ marginRight: 8, color: 'var(--primary)' }} />{t('adminProfile')}</h2>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

        {/* Profile picture + name */}
        <div className="card">
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <div style={{ position: 'relative', display: 'inline-block' }}>
              {profile?.profile_picture
                ? <img src={profile.profile_picture} alt="Profile" style={{ width: 100, height: 100, borderRadius: '50%', objectFit: 'cover' }} />
                : <div className="user-avatar" style={{ width: 100, height: 100, fontSize: 36, margin: '0 auto' }}>{initials}</div>
              }
              <label style={{ position: 'absolute', bottom: 0, right: 0, background: 'var(--primary)', color: 'white', borderRadius: '50%', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                <FaCamera size={12} />
                <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => setProfilePic(e.target.files[0])} />
              </label>
            </div>
            {profilePic && <p style={{ fontSize: 12, color: 'var(--primary)', marginTop: 6 }}>{profilePic.name}</p>}
          </div>

          <h4 style={{ marginBottom: 12 }}>{t('nameAndEmail')}</h4>
          <form onSubmit={handleNameSave}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div className="form-group">
                <label>{t('firstName')}</label>
                <input className="form-control" value={nameForm.first_name}
                  onChange={e => setNameForm({ ...nameForm, first_name: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>{t('lastName')}</label>
                <input className="form-control" value={nameForm.last_name}
                  onChange={e => setNameForm({ ...nameForm, last_name: e.target.value })} required />
              </div>
            </div>
            <div className="form-group">
              <label>{t('email')}</label>
              <input className="form-control" type="email" value={nameForm.email}
                onChange={e => setNameForm({ ...nameForm, email: e.target.value })} required />
            </div>
            <div className="form-group">
              <label>{t('role')}</label>
              <input className="form-control" value={t('administrator')} disabled
                style={{ background: '#f8f9fa', color: 'var(--gray)' }} />
            </div>
            <button className="btn btn-block" type="submit" disabled={saving}>
              <FaSave style={{ marginRight: 6 }} />{saving ? t('saving') : t('updateProfile')}
            </button>
          </form>
        </div>

        {/* Change password */}
        <div className="card">
          <h4 style={{ marginBottom: 15 }}><FaLock style={{ marginRight: 6, color: 'var(--primary)' }} />{t('changePassword')}</h4>
          <form onSubmit={handlePassword}>
            <div className="form-group">
              <label>{t('currentPassword')}</label>
              <input className="form-control" type="password" value={pwForm.currentPassword}
                onChange={e => setPwForm({ ...pwForm, currentPassword: e.target.value })} required />
            </div>
            <div className="form-group">
              <label>{t('newPassword')}</label>
              <input className="form-control" type="password" value={pwForm.newPassword}
                onChange={e => setPwForm({ ...pwForm, newPassword: e.target.value })} required />
            </div>
            <div className="form-group">
              <label>{t('confirmNewPassword')}</label>
              <input className="form-control" type="password" value={pwForm.confirmPassword}
                onChange={e => setPwForm({ ...pwForm, confirmPassword: e.target.value })} required />
            </div>
            <button className="btn btn-block btn-success" type="submit">{t('changePassword')}</button>
          </form>
        </div>

      </div>
    </div>
  )
}
