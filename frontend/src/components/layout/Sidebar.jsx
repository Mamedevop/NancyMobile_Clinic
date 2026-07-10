import { NavLink, useNavigate } from 'react-router-dom'
import { FaMobileAlt, FaHome, FaBox, FaShoppingCart, FaClipboardList,
  FaTools, FaCreditCard, FaUser, FaSignOutAlt, FaTachometerAlt,
  FaUsers, FaBoxes, FaClipboardCheck, FaMoneyCheckAlt, FaWarehouse,
  FaChartBar, FaUniversity, FaComments, FaTruck, FaHistory,
  FaBell, FaMoneyBillWave, FaStar, FaBoxOpen, FaToggleOn, FaMapMarkerAlt } from 'react-icons/fa'
import { useAuth } from '../../context/AuthContext'
import { useCart } from '../../context/CartContext'
import { useLanguage } from '../../context/LanguageContext'
import NancyLogo from '../NancyLogo'

const Sidebar = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth()
  const { cart } = useCart()
  const { t } = useLanguage()
  const cartCount = cart?.items?.reduce((total, i) => total + i.quantity, 0) || 0
  const isAdmin = user?.role === 'admin'
  const isTech = user?.role === 'technician'
  const isDelivery = user?.role === 'delivery_person'

  const isVerified = user?.is_verified

  const customerLinks = [
    { to: '/dashboard', icon: <FaHome />, label: t('dashboard') },
    { to: '/products', icon: <FaBox />, label: t('products') },
    ...(isVerified ? [
      { to: '/cart', icon: <FaShoppingCart />, label: t('shoppingCart'), badge: cartCount },
      { to: '/orders', icon: <FaClipboardList />, label: t('myOrders') },
      { to: '/track', icon: <FaTruck />, label: 'Track Order' },
    ] : []),
    { to: '/repairs', icon: <FaTools />, label: t('repairServices2') },
    ...(isVerified ? [
      { to: '/reviews', icon: <FaStar />, label: 'My Reviews' },
      { to: '/chat', icon: <FaComments />, label: t('messages') || 'Messages' },
      { to: '/payments', icon: <FaCreditCard />, label: t('payments') },
    ] : []),
    { to: '/profile', icon: <FaUser />, label: t('profile') },
  ]

  const adminLinks = [
    { to: '/admin/dashboard', icon: <FaTachometerAlt />, label: t('adminDashboard') },
    { to: '/admin/users', icon: <FaUsers />, label: t('usersManagementSidebar') },
    { to: '/admin/products', icon: <FaBoxes />, label: t('productsManagementSidebar') },
    { to: '/admin/orders', icon: <FaClipboardCheck />, label: t('ordersManagementSidebar') },
    { to: '/admin/payments', icon: <FaMoneyCheckAlt />, label: t('paymentsVerificationSidebar') },
    { to: '/admin/inventory', icon: <FaWarehouse />, label: t('inventory') },
    { to: '/admin/reports', icon: <FaChartBar />, label: t('reports') },
    { to: '/admin/repairs', icon: <FaTools />, label: t('repairRequestsSidebar') },
    { to: '/admin/parts-requests', icon: <FaBoxOpen />, label: 'Parts Requests' },
    { to: '/admin/bank-settings', icon: <FaUniversity />, label: t('bankSettingsSidebar') },
    { to: '/admin/delivery', icon: <FaTruck />, label: 'Delivery' },
    { to: '/chat', icon: <FaComments />, label: t('messages') || 'Messages' },
    { to: '/admin/profile', icon: <FaUser />, label: t('profile') },
  ]

  const techLinks = [
    { to: '/technician/dashboard', icon: <FaTachometerAlt />, label: t('dashboard') },
    { to: '/technician/job-requests', icon: <FaBell />, label: 'Job Requests' },
    { to: '/technician/repairs', icon: <FaTools />, label: t('repairAssignmentsSidebar') },
    { to: '/technician/parts', icon: <FaBoxOpen />, label: 'Parts & Inventory' },
    { to: '/technician/history', icon: <FaHistory />, label: 'Repair History' },
    { to: '/technician/earnings', icon: <FaMoneyBillWave />, label: 'Earnings' },
    { to: '/technician/reviews', icon: <FaStar />, label: 'Reviews' },
    { to: '/chat', icon: <FaComments />, label: t('messages') || 'Messages' },
    { to: '/technician/profile', icon: <FaUser />, label: t('profile') },
  ]

  const deliveryLinks = [
    { to: '/delivery/dashboard', icon: <FaTachometerAlt />, label: t('dashboard') },
    { to: '/delivery/tasks', icon: <FaClipboardList />, label: 'Tasks' },
    { to: '/delivery/active', icon: <FaTruck />, label: 'Active Job' },
    { to: '/delivery/map', icon: <FaMapMarkerAlt />, label: 'Map & Navigation' },
    { to: '/delivery/history', icon: <FaHistory />, label: 'History' },
    { to: '/chat', icon: <FaComments />, label: t('messages') || 'Messages' },
    { to: '/delivery/profile', icon: <FaUser />, label: t('profile') },
  ]

  const links = isAdmin ? adminLinks : isTech ? techLinks : isDelivery ? deliveryLinks : customerLinks

  return (
    <div className={`sidebar ${isOpen ? 'open' : ''}`}>
      <div className="sidebar-header">
        <div className="logo">
          <NancyLogo size={32} /> NancyMobile
        </div>
      </div>
      <ul className="sidebar-menu">
        {links.map(({ to, icon, label, badge }) => (
          <li key={to}>
            <NavLink to={to} onClick={onClose} className={({ isActive }) => isActive ? 'active' : ''}>
              {icon} {label}
              {badge > 0 && <span className="menu-badge">{badge}</span>}
            </NavLink>
          </li>
        ))}
      </ul>
      <div style={{ padding: '20px', marginTop: 'auto', borderTop: '1px solid #eee' }}>
        <button className="btn btn-outline" style={{ width: '100%' }} onClick={logout}>
          <FaSignOutAlt style={{ marginRight: 8 }} /> {t('logout')}
        </button>
      </div>
    </div>
  )
}

export default Sidebar
