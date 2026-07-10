import { useState, useEffect } from 'react'
import { FaSearch, FaFilter, FaShoppingCart } from 'react-icons/fa'
import { useCart } from '../../context/CartContext'
import { useLanguage } from '../../context/LanguageContext'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import api from '../../services/api'
import toast from 'react-hot-toast'

const iconMap = { mobile: '📱', 'shield-alt': '🛡️', bolt: '⚡', headphones: '🎧', 'battery-full': '🔋', smartwatch: '⌚', tools: '🔧', tint: '💧' }

export default function Products() {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const { addItem } = useCart()
  const { t } = useLanguage()

  useEffect(() => {
    Promise.all([
      api.get('/products'),
      api.get('/categories')
    ]).then(([pr, cr]) => {
      if (pr.data.success) setProducts(pr.data.products || [])
      if (cr.data.success) setCategories(cr.data.categories || [])
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const filtered = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase())
    const matchCat = !selectedCategory || p.category_id == selectedCategory
    return matchSearch && matchCat
  })

  const stockLabel = (qty) => {
    if (qty === 0) return <span className="out-of-stock">{t('outOfStock')}</span>
    if (qty <= 10) return <span className="low-stock">{t('lowStock')} ({qty})</span>
    return <span className="in-stock">{t('inStock')}</span>
  }

  if (loading) return <LoadingSpinner />

  return (
    <div className="page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2>{t('products')}</h2>
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 15, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 200, position: 'relative' }}>
            <FaSearch style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--gray)' }} />
            <input className="form-control" style={{ paddingLeft: 36 }} placeholder={t('searchProducts')}
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="form-control" style={{ width: 200 }}
            value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)}>
            <option value="">{t('allCategories')}</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 40 }}>
          <p style={{ color: 'var(--gray)' }}>{t('noProductsFound')}</p>
        </div>
      ) : (
        <div className="products-grid">
          {filtered.map(p => (
            <div className="product-card" key={p.id}>
              <div className="product-image">
                {p.image_url
                  ? <img src={p.image_url} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <span style={{ fontSize: 48 }}>{iconMap[p.image_url] || '📦'}</span>
                }
              </div>
              <div className="product-info">
                <div className="product-name">{p.name}</div>
                <div className="product-description">{p.description}</div>
                <div className="product-price">ETB {parseFloat(p.price).toFixed(2)}</div>
                {stockLabel(p.stock_quantity)}
                <div style={{ display: 'flex', gap: 10, marginTop: 15 }}>
                  <button className="btn" style={{ flex: 1, padding: '10px' }}
                    disabled={p.stock_quantity === 0}
                    onClick={() => addItem(p.id, 1)}>
                    <FaShoppingCart style={{ marginRight: 6 }} /> {t('addToCart')}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
