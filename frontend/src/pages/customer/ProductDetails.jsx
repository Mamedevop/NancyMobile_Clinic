import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { FaArrowLeft, FaShoppingCart, FaMobileAlt } from 'react-icons/fa'
import api from '../../services/api'
import { useCart } from '../../context/CartContext'
import toast from 'react-hot-toast'

export default function ProductDetails() {
  const { id } = useParams()
  const { addItem } = useCart()
  const [product, setProduct] = useState(null)
  const [related, setRelated] = useState([])
  const [loading, setLoading] = useState(true)
  const [qty, setQty] = useState(1)

  useEffect(() => {
    api.get('/products/' + id).then(r => {
      if (r.data.success) { setProduct(r.data.product); setRelated(r.data.relatedProducts || []) }
    }).catch(() => {}).finally(() => setLoading(false))
  }, [id])

  const handleAdd = async () => {
    await addItem(product.id, qty)
  }

  if (loading) return <div className="page"><p>Loading...</p></div>
  if (!product) return <div className="page"><p>Product not found.</p></div>

  const inStock = product.stock_quantity > 0

  return (
    <div className="page">
      <div style={{ marginBottom: 20 }}>
        <Link to="/products" style={{ color: 'var(--primary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6 }}>
          <FaArrowLeft /> Back to Products
        </Link>
      </div>

      <div className="card">
        <div style={{ display: 'flex', gap: 30, flexWrap: 'wrap' }}>
          <div style={{ width: 280, height: 280, background: '#f8f9fa', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 80, color: 'var(--primary)', flexShrink: 0 }}>
            <FaMobileAlt />
          </div>
          <div style={{ flex: 1, minWidth: 240 }}>
            <h2 style={{ marginBottom: 8 }}>{product.name}</h2>
            {product.brand && <p style={{ color: 'var(--gray)', marginBottom: 8 }}>Brand: {product.brand}</p>}
            <p style={{ color: 'var(--gray)', marginBottom: 4 }}>{product.category_name}</p>
            <div className="product-price" style={{ margin: '16px 0' }}>ETB {parseFloat(product.price).toFixed(2)}</div>
            <span className={inStock ? 'in-stock' : 'out-of-stock'} style={{ marginBottom: 16, display: 'inline-block' }}>
              {inStock ? 'In Stock (' + product.stock_quantity + ')' : 'Out of Stock'}
            </span>
            <p style={{ color: 'var(--gray)', lineHeight: 1.6, marginBottom: 20 }}>{product.description}</p>
            {inStock && (
              <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                <div className="quantity-control">
                  <button className="quantity-btn" onClick={() => setQty(q => Math.max(1, q - 1))}>-</button>
                  <input className="quantity-input" value={qty} readOnly />
                  <button className="quantity-btn" onClick={() => setQty(q => Math.min(product.stock_quantity, q + 1))}>+</button>
                </div>
                <button className="btn" onClick={handleAdd}>
                  <FaShoppingCart style={{ marginRight: 8 }} />Add to Cart
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <div>
          <h3 style={{ marginBottom: 16 }}>Related Products</h3>
          <div className="products-grid">
            {related.map(p => (
              <Link key={p.id} to={'/products/' + p.id} style={{ textDecoration: 'none', color: 'inherit' }}>
                <div className="product-card">
                  <div className="product-image"><FaMobileAlt /></div>
                  <div className="product-info">
                    <div className="product-name">{p.name}</div>
                    <div className="product-price">ETB {parseFloat(p.price).toFixed(2)}</div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
