import { FaBars, FaMobileAlt, FaSignOutAlt, FaGlobe } from 'react-icons/fa'
import { useAuth } from '../../context/AuthContext'
import { useLanguage } from '../../context/LanguageContext'
import { useTheme, THEMES } from '../../context/ThemeContext'
import { useNavigate } from 'react-router-dom'
import NancyLogo from '../NancyLogo'

const Topbar = ({ onMenuClick }) => {
  const { user, logout } = useAuth()
  const { lang, switchLang, t } = useLanguage()
  const { theme, switchTheme } = useTheme()
  const navigate = useNavigate()
  const initials = user ? `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase() : 'U'

  const profilePath = user?.role === 'admin'
    ? '/admin/profile'
    : user?.role === 'technician'
    ? '/technician/profile'
    : user?.role === 'delivery_person'
    ? '/delivery/profile'
    : '/profile'

  return (
    <div className="topbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
        <button onClick={onMenuClick}
          style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: 'var(--dark)' }}
          className="menu-toggle">
          <FaBars />
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <NancyLogo size={38} />
          <h2 style={{ fontSize: 20, fontWeight: 600, color: 'var(--dark)' }}>
            NancyMobile
          </h2>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {/* Language switcher */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#f5f5f5', borderRadius: 8, padding: '4px 8px' }}>
          <FaGlobe style={{ color: 'var(--primary)', fontSize: 13 }} />
          {[
            { code: 'en', label: 'EN' },
            { code: 'om', label: 'OM' },
            { code: 'am', label: 'አማ' },
          ].map(({ code, label }) => (
            <button key={code} onClick={() => switchLang(code)}
              style={{
                background: lang === code ? 'var(--primary)' : 'transparent',
                color: lang === code ? 'white' : 'var(--dark)',
                border: 'none', borderRadius: 5, padding: '3px 8px',
                fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s'
              }}>
              {label}
            </button>
          ))}
        </div>

        {/* Theme switcher */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#f5f5f5', borderRadius: 8, padding: '4px 6px' }}>
          {Object.entries(THEMES).map(([key, val]) => (
            <button key={key} onClick={() => switchTheme(key)} title={val.label}
              style={{
                background: theme === key ? 'var(--primary)' : 'transparent',
                border: theme === key ? 'none' : '1px solid #ddd',
                borderRadius: 6, width: 28, height: 28, cursor: 'pointer',
                fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.2s'
              }}>
              {val.icon}
            </button>
          ))}
        </div>

        <div onClick={() => navigate(profilePath)}
          style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
          {user?.profileImage
            ? <img src={user.profileImage} alt="avatar" style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover' }} />
            : <div className="user-avatar">{initials}</div>
          }
          <div className="topbar-user-name">
            <div style={{ fontWeight: 600, fontSize: 14 }}>{user?.firstName} {user?.lastName}</div>
            <div style={{ fontSize: 12, color: 'var(--gray)' }}>
              {user?.role === 'admin' ? t('administrator') : user?.role === 'technician' ? t('technician') : user?.role === 'delivery_person' ? (t('deliveryPerson') || 'Delivery') : t('customer')}
            </div>
          </div>
        </div>
        <button onClick={logout}
          title={t('logout')}
          style={{ background: 'none', border: '1px solid #ddd', borderRadius: 6, padding: '6px 10px', cursor: 'pointer', color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: 5, fontSize: 13 }}>
          <FaSignOutAlt />
          <span className="topbar-user-name">{t('logout')}</span>
        </button>
      </div>
    </div>
  )
}

export default Topbar
