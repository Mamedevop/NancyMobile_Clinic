import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Layout from './components/layout/Layout'
import LoadingSpinner from './components/common/LoadingSpinner'

// Auth Pages
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import ForgotPassword from './pages/auth/ForgotPassword'
import Landing from './pages/Landing'

// Customer Pages
import CustomerDashboard from './pages/customer/Dashboard'
import Products from './pages/customer/Products'
import ProductDetails from './pages/customer/ProductDetails'
import Cart from './pages/customer/Cart'
import Checkout from './pages/customer/Checkout'
import Orders from './pages/customer/Orders'
import OrderDetails from './pages/customer/OrderDetails'
import TrackOrder from './pages/customer/TrackOrder'
import Profile from './pages/customer/Profile'
import Repairs from './pages/customer/Repairs'
import Payments from './pages/customer/Payments'
import CustomerReviews from './pages/customer/Reviews'

// Admin Pages
import AdminDashboard from './pages/admin/Dashboard'
import ManageUsers from './pages/admin/ManageUsers'
import ManageProducts from './pages/admin/ManageProducts'
import ManageOrders from './pages/admin/ManageOrders'
import PaymentVerification from './pages/admin/PaymentVerification'
import Inventory from './pages/admin/Inventory'
import Reports from './pages/admin/Reports'
import ManageRepairs from './pages/admin/ManageRepairs'
import BankSettings from './pages/admin/BankSettings'
import AdminProfile from './pages/admin/Profile'
import PartsRequests from './pages/admin/PartsRequests'
import DeliveryManagement from './pages/admin/DeliveryManagement'
import TechDashboard from './pages/technician/Dashboard'
import TechRepairs from './pages/technician/Repairs'
import TechProfile from './pages/technician/Profile'
import TechParts from './pages/technician/Parts'
import RepairHistory from './pages/technician/RepairHistory'
import TechEarnings from './pages/technician/Earnings'
import TechReviews from './pages/technician/Reviews'
import JobRequests from './pages/technician/JobRequests'
import Chat from './pages/chat/Chat'
import DeliveryDashboard from './pages/delivery/Dashboard'
import DeliveryTasks from './pages/delivery/Tasks'
import ActiveJob from './pages/delivery/ActiveJob'
import DeliveryHistory from './pages/delivery/History'
import DeliveryProfile from './pages/delivery/Profile'
import DeliveryMap from './pages/delivery/Map'

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, loading } = useAuth()
  if (loading) return <LoadingSpinner />
  if (!user) return <Navigate to="/login" replace />
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    if (user.role === 'admin') return <Navigate to="/admin/dashboard" replace />
    if (user.role === 'technician') return <Navigate to="/technician/dashboard" replace />
    if (user.role === 'delivery_person') return <Navigate to="/delivery/dashboard" replace />
    return <Navigate to="/dashboard" replace />
  }
  return children
}

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth()
  if (loading) return <LoadingSpinner />
  if (user) {
    if (user.role === 'admin') return <Navigate to="/admin/dashboard" replace />
    if (user.role === 'technician') return <Navigate to="/technician/dashboard" replace />
    if (user.role === 'delivery_person') return <Navigate to="/delivery/dashboard" replace />
    return <Navigate to="/dashboard" replace />
  }
  return children
}

const CustomerRoute = ({ children }) => (
  <ProtectedRoute allowedRoles={['customer']}>
    <Layout>{children}</Layout>
  </ProtectedRoute>
)

// Verified-only route — unverified customers get redirected to profile
const VerifiedRoute = ({ children }) => {
  const { user, loading } = useAuth()
  if (loading) return <LoadingSpinner />
  if (!user) return <Navigate to="/login" replace />
  if (user.role !== 'customer') return <Navigate to="/dashboard" replace />
  if (!user.is_verified) return <Navigate to="/profile?verify=1" replace />
  return <Layout>{children}</Layout>
}

const AdminRoute = ({ children, roles = ['admin'] }) => (
  <ProtectedRoute allowedRoles={roles}>
    <Layout>{children}</Layout>
  </ProtectedRoute>
)

const TechRoute = ({ children }) => (
  <ProtectedRoute allowedRoles={['technician', 'admin']}>
    <Layout>{children}</Layout>
  </ProtectedRoute>
)

const DeliveryRoute = ({ children }) => (
  <ProtectedRoute allowedRoles={['delivery_person', 'admin']}>
    <Layout>{children}</Layout>
  </ProtectedRoute>
)

const ChatRoute = ({ children }) => (
  <ProtectedRoute allowedRoles={['customer', 'technician', 'admin', 'delivery_person']}>
    <Layout>{children}</Layout>
  </ProtectedRoute>
)

function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<PublicRoute><Landing /></PublicRoute>} />
      <Route path="/landing" element={<Landing />} />
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
      <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />
      <Route path="/track-order/:orderNumber?" element={<TrackOrder />} />
      <Route path="/track" element={<VerifiedRoute><TrackOrder /></VerifiedRoute>} />
      <Route path="/track/:orderNumber" element={<VerifiedRoute><TrackOrder /></VerifiedRoute>} />

      {/* Customer */}
      <Route path="/dashboard" element={<CustomerRoute><CustomerDashboard /></CustomerRoute>} />
      <Route path="/products" element={<CustomerRoute><Products /></CustomerRoute>} />
      <Route path="/products/:id" element={<CustomerRoute><ProductDetails /></CustomerRoute>} />
      <Route path="/cart" element={<VerifiedRoute><Cart /></VerifiedRoute>} />
      <Route path="/checkout" element={<VerifiedRoute><Checkout /></VerifiedRoute>} />
      <Route path="/orders" element={<VerifiedRoute><Orders /></VerifiedRoute>} />
      <Route path="/orders/:id" element={<VerifiedRoute><OrderDetails /></VerifiedRoute>} />
      <Route path="/profile" element={<CustomerRoute><Profile /></CustomerRoute>} />
      <Route path="/repairs" element={<CustomerRoute><Repairs /></CustomerRoute>} />
      <Route path="/reviews" element={<VerifiedRoute><CustomerReviews /></VerifiedRoute>} />
      <Route path="/payments" element={<VerifiedRoute><Payments /></VerifiedRoute>} />

      {/* Admin */}
      <Route path="/admin/dashboard" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
      <Route path="/admin/users" element={<AdminRoute roles={['admin']}><ManageUsers /></AdminRoute>} />
      <Route path="/admin/products" element={<AdminRoute><ManageProducts /></AdminRoute>} />
      <Route path="/admin/orders" element={<AdminRoute><ManageOrders /></AdminRoute>} />
      <Route path="/admin/payments" element={<AdminRoute><PaymentVerification /></AdminRoute>} />
      <Route path="/admin/inventory" element={<AdminRoute><Inventory /></AdminRoute>} />
      <Route path="/admin/reports" element={<AdminRoute><Reports /></AdminRoute>} />
      <Route path="/admin/repairs" element={<AdminRoute><ManageRepairs /></AdminRoute>} />
      <Route path="/admin/bank-settings" element={<AdminRoute><BankSettings /></AdminRoute>} />
      <Route path="/admin/parts-requests" element={<AdminRoute><PartsRequests /></AdminRoute>} />
      <Route path="/admin/delivery" element={<AdminRoute><DeliveryManagement /></AdminRoute>} />
      <Route path="/admin/profile" element={<AdminRoute><AdminProfile /></AdminRoute>} />

      {/* Technician */}
      <Route path="/technician/dashboard" element={<TechRoute><TechDashboard /></TechRoute>} />
      <Route path="/technician/repairs" element={<TechRoute><TechRepairs /></TechRoute>} />
      <Route path="/technician/job-requests" element={<TechRoute><JobRequests /></TechRoute>} />
      <Route path="/technician/parts" element={<TechRoute><TechParts /></TechRoute>} />
      <Route path="/technician/history" element={<TechRoute><RepairHistory /></TechRoute>} />
      <Route path="/technician/earnings" element={<TechRoute><TechEarnings /></TechRoute>} />
      <Route path="/technician/reviews" element={<TechRoute><TechReviews /></TechRoute>} />
      <Route path="/technician/profile" element={<TechRoute><TechProfile /></TechRoute>} />

      {/* Chat */}
      <Route path="/chat" element={<ChatRoute><Chat /></ChatRoute>} />

      {/* Delivery Person */}
      <Route path="/delivery/dashboard" element={<DeliveryRoute><DeliveryDashboard /></DeliveryRoute>} />
      <Route path="/delivery/tasks" element={<DeliveryRoute><DeliveryTasks /></DeliveryRoute>} />
      <Route path="/delivery/active" element={<DeliveryRoute><ActiveJob /></DeliveryRoute>} />
      <Route path="/delivery/map" element={<DeliveryRoute><DeliveryMap /></DeliveryRoute>} />
      <Route path="/delivery/history" element={<DeliveryRoute><DeliveryHistory /></DeliveryRoute>} />
      <Route path="/delivery/profile" element={<DeliveryRoute><DeliveryProfile /></DeliveryRoute>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
