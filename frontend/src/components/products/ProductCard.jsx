import { Link } from 'react-router-dom'

export default function ProductCard({ product }) {
  return (
    <div className="product-card">
      <div className="product-image">
        {product.image_url
          ? <img src={product.image_url} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : '📦'}
      </div>
      <div className="product-info">
        <div className="product-name">{product.name}</div>
        <div className="product-price">ETB {parseFloat(product.price).toFixed(2)}</div>
        <Link to={`/products/${product.id}`} className="btn btn-block" style={{ padding: '8px', fontSize: 14, marginTop: 10 }}>
          View Details
        </Link>
      </div>
    </div>
  )
}
