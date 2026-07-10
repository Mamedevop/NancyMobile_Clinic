import { Link, useNavigate } from 'react-router-dom'
import { FaTrash, FaPlus, FaMinus, FaArrowLeft, FaShoppingCart, FaBox } from 'react-icons/fa'
import { useCart } from '../../context/CartContext'
import { useLanguage } from '../../context/LanguageContext'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import toast from 'react-hot-toast'

export default function Cart() {
  const { cart, loading, updateQuantity, removeItem, clearCart } = useCart()
  const { t } = useLanguage()
  const navigate = useNavigate()
  const items = cart?.items || []
  const total = cart?.total || 0

  if (loading) return <LoadingSpinner />

  if (items.length === 0) {
    return (
      <div className="page">
        <div className="card" style={{ textAlign: 'center', padding: 60 }}>
          <FaShoppingCart style={{ fontSize: 64, color: '#ddd', marginBottom: 20 }} />
          <h2 style={{ marginBottom: 10 }}>{t('cartEmpty')}</h2>
          <p style={{ color: 'var(--gray)', marginBottom: 20 }}>{t('addProductsToStart')}</p>
          <Link to="/products" className="btn"><FaArrowLeft style={{ marginRight: 8 }} />{t('browseProducts')}</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="page">
      <h2 style={{ marginBottom: 20 }}><FaShoppingCart style={{ marginRight: 8, color: 'var(--primary)' }} />{t('cart')}</h2>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20, alignItems: 'start' }}>
        <div className="card" style={{ padding: 0 }}>
          <div style={{ padding: '20px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3>{items.length} {items.length !== 1 ? t('items') : t('item')}</h3>
            <button onClick={() => { if (window.confirm(t('clearCart') + '?')) clearCart() }}
              style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
              <FaTrash /> {t('clearCart')}
            </button>
          </div>
          {items.map(item => (
            <div className="cart-item" key={item.product_id || item.id}>
              <div className="cart-item-image">
                {item.image_url
                  ? <img src={item.image_url} alt={item.name} style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 6 }} />
                  : <div style={{ width: 60, height: 60, background: '#f0f4ff', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
                      <FaBox size={24} />
                    </div>
                }
              </div>
              <div className="cart-item-details">
                <div className="cart-item-name">{item.name}</div>
                <div className="cart-item-price">ETB {parseFloat(item.price).toFixed(2)} each
                  {item.stock_quantity <= 10 && (
                    <span style={{ marginLeft: 8, fontSize: 11, color: item.stock_quantity === 0 ? 'var(--danger)' : 'var(--warning)', fontWeight: 600 }}>
                      ({item.stock_quantity} left)
                    </span>
                  )}
                </div>
                <div className="cart-item-actions">
                  <div className="quantity-control">
                    <button className="quantity-btn" onClick={() => updateQuantity(item.product_id, item.quantity - 1)} disabled={item.quantity <= 1}>
                      <FaMinus size={10} />
                    </button>
                    <input className="quantity-input" type="number" value={item.quantity} readOnly />
                    <button className="quantity-btn"
                      disabled={item.quantity >= item.stock_quantity}
                      onClick={() => {
                        if (item.quantity >= item.stock_quantity) {
                          toast.error(`Only ${item.stock_quantity} in stock`)
                        } else {
                          updateQuantity(item.product_id, item.quantity + 1)
                        }
                      }}>
                      <FaPlus size={10} />
                    </button>
                  </div>
                  <button onClick={() => removeItem(item.product_id)}
                    style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', marginLeft: 10 }}>
                    <FaTrash />
                  </button>
                </div>
              </div>
              <div style={{ fontWeight: 700, color: 'var(--primary)', fontSize: 18, minWidth: 80, textAlign: 'right' }}>
                ETB {(item.price * item.quantity).toFixed(2)}
              </div>
            </div>
          ))}
          <div style={{ padding: 15 }}>
            <Link to="/products" style={{ color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: 6, fontSize: 14 }}>
              <FaArrowLeft /> {t('continueShopping')}
            </Link>
          </div>
        </div>

        <div className="card">
          <h3 style={{ marginBottom: 20 }}>{t('orderSummary')}</h3>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{ color: 'var(--gray)' }}>{t('subtotal')}</span>
            <span>ETB {parseFloat(total).toFixed(2)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{ color: 'var(--gray)' }}>{t('shipping')}</span>
            <span style={{ color: '#28a745' }}>{t('free')}</span>
          </div>
          <div style={{ borderTop: '1px solid #eee', paddingTop: 15, marginTop: 10, display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: 18 }}>
            <span>{t('total')}</span>
            <span style={{ color: 'var(--primary)' }}>ETB {parseFloat(total).toFixed(2)}</span>
          </div>
          <button className="btn btn-block btn-success" style={{ marginTop: 20 }} onClick={() => navigate('/checkout')}>
            {t('proceedToCheckout')}
          </button>
        </div>
      </div>
    </div>
  )
}
