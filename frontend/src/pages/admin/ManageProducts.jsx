import { useState, useEffect } from 'react'
import { FaBoxes, FaPlus, FaEdit, FaTrash, FaSearch, FaExclamationTriangle, FaTimes } from 'react-icons/fa'
import { useLanguage } from '../../context/LanguageContext'
import api from '../../services/api'
import toast from 'react-hot-toast'

const EMPTY = { name: '', description: '', price: '', stock_quantity: '', category_id: '', brand: '', sku: '', is_featured: false, is_active: true, image_url: '', imageFile: null }

function ProductModal({ editing, form, setForm, categories, onSave, onClose, saving }) {
  const { t } = useLanguage()
  const set = f => e => setForm(p => ({ ...p, [f]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }))
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }} onClick={onClose}>
      <div className="card" style={{ width:'100%', maxWidth:560, maxHeight:'90vh', overflow:'auto' }} onClick={e => e.stopPropagation()}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
          <h3 style={{ margin:0 }}>{editing ? t('editProduct') : t('addNewProduct')}</h3>
          <button onClick={onClose} style={{ background:'none', border:'none', fontSize:22, cursor:'pointer', color:'var(--gray)' }}><FaTimes /></button>
        </div>
        <form onSubmit={onSave}>
          <div className="form-group">
            <label>{t('productName')} *</label>
            <input className="form-control" value={form.name} onChange={set('name')} required placeholder="e.g. iPhone 14 Pro Case" />
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
            <div className="form-group">
              <label>{t('price')} (ETB) *</label>
              <input className="form-control" type="number" min="0" step="0.01" value={form.price} onChange={set('price')} required placeholder="0.00" />
            </div>
            <div className="form-group">
              <label>{t('stockQuantity')} *</label>
              <input className="form-control" type="number" min="0" value={form.stock_quantity} onChange={set('stock_quantity')} required placeholder="0" />
            </div>
          </div>
          <div className="form-group">
            <label>{t('category')}</label>
            <select className="form-control" value={form.category_id} onChange={set('category_id')}>
              <option value="">-- {t('allCategories')} --</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
            <div className="form-group">
              <label>{t('brand')}</label>
              <input className="form-control" value={form.brand} onChange={set('brand')} placeholder="e.g. Apple" />
            </div>
            <div className="form-group">
              <label>{t('sku')}</label>
              <input className="form-control" value={form.sku} onChange={set('sku')} placeholder="e.g. IPH-CASE-001" />
            </div>
          </div>
          <div className="form-group">
            <label>{t('uploadIdDocument')}</label>
            <input className="form-control" type="file" accept="image/*"
              onChange={e => setForm(p => ({ ...p, imageFile: e.target.files[0] }))} />
            {form.image_url && !form.imageFile && (
              <img src={form.image_url} alt="current" style={{ marginTop:8, height:80, borderRadius:6, objectFit:'cover' }} />
            )}
            {form.imageFile && <p style={{ fontSize:12, color:'var(--primary)', marginTop:4 }}>{form.imageFile.name}</p>}
          </div>
          <div className="form-group">
            <label>{t('description')}</label>
            <textarea className="form-control" rows={3} value={form.description} onChange={set('description')} style={{ resize:'vertical' }} />
          </div>
          <div style={{ display:'flex', gap:24, marginBottom:20 }}>
            <label style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer', fontWeight:500 }}>
              <input type="checkbox" checked={form.is_featured} onChange={set('is_featured')} /> {t('featured')}
            </label>
            <label style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer', fontWeight:500 }}>
              <input type="checkbox" checked={form.is_active} onChange={set('is_active')} /> {t('active')}
            </label>
          </div>
          <div style={{ display:'flex', gap:12 }}>
            <button className="btn btn-block" type="submit" disabled={saving} style={{ flex:1 }}>
              {saving ? t('saving') : editing ? t('updateProduct') : t('addProduct')}
            </button>
            <button type="button" className="btn btn-outline" onClick={onClose} style={{ flex:1 }}>{t('cancel')}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function ManageProducts() {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const { t } = useLanguage()

  useEffect(() => {
    fetchProducts()
    api.get('/categories').then(r => { if (r.data.success) setCategories(r.data.categories || []) }).catch(() => {})
  }, [])

  const fetchProducts = () => {
    setLoading(true)
    api.get('/products?limit=200').then(r => {
      if (r.data.success) setProducts(r.data.products || [])
    }).catch(() => toast.error('Failed to load products')).finally(() => setLoading(false))
  }

  const openCreate = () => { setEditing(null); setForm(EMPTY); setShowForm(true) }

  const openEdit = p => {
    setEditing(p.id)
    setForm({ name: p.name || '', description: p.description || '', price: p.price || '', stock_quantity: p.stock_quantity ?? '', category_id: p.category_id || '', brand: p.brand || '', sku: p.sku || '', is_featured: !!p.is_featured, is_active: p.is_active ?? true, image_url: p.image_url || '', imageFile: null })
    setShowForm(true)
  }

  const handleSave = async e => {
    e.preventDefault()
    if (!form.name.trim()) return toast.error('Name is required')
    if (!form.price || parseFloat(form.price) < 0) return toast.error('Valid price is required')
    setSaving(true)
    try {
      const fd = new FormData()
      fd.append('name', form.name)
      fd.append('description', form.description || '')
      fd.append('price', parseFloat(form.price))
      fd.append('stock_quantity', parseInt(form.stock_quantity) || 0)
      fd.append('category_id', form.category_id || '')
      fd.append('brand', form.brand || '')
      fd.append('sku', form.sku || '')
      fd.append('is_featured', form.is_featured)
      fd.append('is_active', form.is_active)
      if (form.imageFile) fd.append('product_image', form.imageFile)
      const cfg = { headers: { 'Content-Type': 'multipart/form-data' } }
      if (editing) { await api.put('/products/' + editing, fd, cfg); toast.success('Product updated') }
      else { await api.post('/products', fd, cfg); toast.success('Product added') }
      setShowForm(false); fetchProducts()
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to save') }
    finally { setSaving(false) }
  }

  const handleDelete = async id => {
    if (!window.confirm('Delete this product?')) return
    try { await api.delete('/products/' + id); setProducts(p => p.filter(x => x.id !== id)); toast.success('Deleted') }
    catch { toast.error('Failed to delete') }
  }

  const handleToggleActive = async p => {
    try {
      const fd = new FormData(); fd.append('is_active', !p.is_active)
      await api.put('/products/' + p.id, fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      setProducts(prev => prev.map(x => x.id === p.id ? { ...x, is_active: !p.is_active } : x))
      toast.success(p.is_active ? 'Deactivated' : 'Activated')
    } catch { toast.error('Failed to update') }
  }

  const filtered = products.filter(p => {
    const m = p.name.toLowerCase().includes(search.toLowerCase()) || (p.brand || '').toLowerCase().includes(search.toLowerCase())
    if (filter === 'low') return m && p.stock_quantity > 0 && p.stock_quantity <= 10
    if (filter === 'out') return m && p.stock_quantity === 0
    if (filter === 'inactive') return m && !p.is_active
    return m
  })

  const lowStockCount = products.filter(p => p.stock_quantity > 0 && p.stock_quantity <= 10).length
  const outOfStockCount = products.filter(p => p.stock_quantity === 0).length

  const stockBadge = qty => {
    if (qty === 0) return <span className="out-of-stock">Out of Stock</span>
    if (qty <= 10) return <span className="low-stock">Low ({qty})</span>
    return <span className="in-stock">{qty}</span>
  }

  return (
    <div className="page">
      {showForm && <ProductModal editing={editing} form={form} setForm={setForm} categories={categories} onSave={handleSave} onClose={() => setShowForm(false)} saving={saving} />}

      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20, flexWrap:'wrap', gap:12 }}>
        <h2 style={{ margin:0 }}><FaBoxes style={{ marginRight:8, color:'var(--primary)' }} />{t('productsManagement')}</h2>
        <button className="btn" onClick={openCreate}><FaPlus style={{ marginRight:6 }} />{t('addProduct')}</button>
      </div>

      <div className="stats-grid" style={{ marginBottom:20 }}>
        {[
          { label: t('totalProducts'), value:products.length, color:'primary' },
          { label: t('lowStockCount'), value:lowStockCount, color:'warning', f:'low' },
          { label: t('outOfStockCount'), value:outOfStockCount, color:'danger', f:'out' },
        ].map(s => (
          <div key={s.label} className="stat-card" style={{ cursor: s.f ? 'pointer' : 'default' }} onClick={() => s.f && setFilter(filter === s.f ? 'all' : s.f)}>
            <div className={'stat-icon ' + s.color}><FaBoxes /></div>
            <div className="stat-info"><h3>{s.value}</h3><p>{s.label}</p></div>
          </div>
        ))}
      </div>

      {lowStockCount > 0 && (
        <div style={{ background:'rgba(248,150,30,0.1)', border:'1px solid var(--warning)', borderRadius:8, padding:'12px 16px', marginBottom:20, display:'flex', alignItems:'center', gap:10 }}>
          <FaExclamationTriangle style={{ color:'var(--warning)' }} />
          <span style={{ color:'var(--warning)', fontWeight:500 }}>{lowStockCount} {t('needsRestocking')}</span>
        </div>
      )}

      <div className="card" style={{ marginBottom:20, display:'flex', gap:12, alignItems:'center', flexWrap:'wrap' }}>
        <div style={{ position:'relative', flex:1, minWidth:200 }}>
          <FaSearch style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'var(--gray)' }} />
          <input className="form-control" style={{ paddingLeft:36 }} placeholder={t('searchProducts')} value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
          {[['all', t('all')],['low', t('lowStockCount')],['out', t('outOfStockCount')],['inactive', t('inactive')]].map(([val, label]) => (
            <button key={val} onClick={() => setFilter(val)}
              style={{ padding:'8px 14px', borderRadius:6, border:'1px solid', fontSize:13, cursor:'pointer', background: filter === val ? 'var(--primary)' : 'white', color: filter === val ? 'white' : 'var(--dark)', borderColor: filter === val ? 'var(--primary)' : '#ddd' }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="table-container">
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr><th>Image</th><th>{t('productName')}</th><th>{t('category')}</th><th>{t('price')} (ETB)</th><th>{t('stockQuantity')}</th><th>{t('status')}</th><th>{t('actions')}</th></tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="7" style={{ textAlign:'center', padding:30 }}>{t('loading')}</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan="7" style={{ textAlign:'center', padding:30, color:'var(--gray)' }}>{t('noProductsFound2')}</td></tr>
              ) : filtered.map(p => (
                <tr key={p.id}>
                  <td>
                    {p.image_url
                      ? <img src={p.image_url} alt={p.name} style={{ width:48, height:48, objectFit:'cover', borderRadius:6 }} />
                      : <div style={{ width:48, height:48, background:'#f0f0f0', borderRadius:6, display:'flex', alignItems:'center', justifyContent:'center', fontSize:20 }}>📦</div>
                    }
                  </td>
                  <td>
                    <div style={{ fontWeight:600 }}>{p.name}</div>
                    {p.brand && <div style={{ fontSize:12, color:'var(--gray)' }}>{p.brand}</div>}
                  </td>
                  <td>{p.category_name || '-'}</td>
                  <td style={{ fontWeight:600, color:'var(--primary)' }}>ETB {parseFloat(p.price).toFixed(2)}</td>
                  <td>{stockBadge(p.stock_quantity)}</td>
                  <td>
                    <span className={'status-badge ' + (p.is_active ? 'status-completed' : 'status-cancelled')}>
                      {p.is_active ? t('active') : t('inactive')}
                    </span>
                  </td>
                  <td>
                    <div style={{ display:'flex', gap:6 }}>
                      <button className="btn" style={{ padding:'6px 10px', fontSize:12 }} title="Edit" onClick={() => openEdit(p)}><FaEdit /></button>
                      <button className={'btn ' + (p.is_active ? 'btn-outline' : 'btn-success')} style={{ padding:'6px 10px', fontSize:12 }} onClick={() => handleToggleActive(p)}>
                        {p.is_active ? 'Off' : 'On'}
                      </button>
                      <button className="btn btn-danger" style={{ padding:'6px 10px', fontSize:12 }} title="Delete" onClick={() => handleDelete(p.id)}><FaTrash /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
