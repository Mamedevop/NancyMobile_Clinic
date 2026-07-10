import { createContext, useContext, useState, useEffect } from 'react'
import api from '../services/api'
import toast from 'react-hot-toast'
import { useAuth } from './AuthContext'

const CartContext = createContext({})
export const useCart = () => useContext(CartContext)

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState({ items: [], total: 0 })
  const [loading, setLoading] = useState(false)
  const { user } = useAuth()

  const fetchCart = async () => {
    if (!user) return
    try {
      setLoading(true)
      const res = await api.get('/cart')
      if (res.data.success) setCart(res.data.cart || { items: [], total: 0 })
    } catch (e) {
      console.error('Cart fetch error:', e)
    } finally {
      setLoading(false)
    }
  }

  const addItem = async (productId, quantity = 1) => {
    try {
      const res = await api.post('/cart/items', { productId, quantity })
      if (res.data.success) { setCart(res.data.cart); toast.success('Added to cart') }
    } catch (e) { toast.error('Failed to add item') }
  }

  const updateQuantity = async (productId, quantity) => {
    try {
      const res = await api.put(`/cart/items/${productId}`, { quantity })
      if (res.data.success) setCart(res.data.cart)
    } catch (e) { toast.error('Failed to update quantity') }
  }

  const removeItem = async (productId) => {
    try {
      const res = await api.delete(`/cart/items/${productId}`)
      if (res.data.success) setCart(res.data.cart)
    } catch (e) { toast.error('Failed to remove item') }
  }

  const clearCart = async () => {
    try {
      await api.delete('/cart/clear')
      setCart({ items: [], total: 0 })
    } catch (e) { toast.error('Failed to clear cart') }
  }

  useEffect(() => { fetchCart() }, [user])

  return (
    <CartContext.Provider value={{ cart, loading, addItem, updateQuantity, removeItem, clearCart, fetchCart }}>
      {children}
    </CartContext.Provider>
  )
}
