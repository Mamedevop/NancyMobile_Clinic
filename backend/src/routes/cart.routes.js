const express = require('express');
const router = express.Router();
const asyncHandler = require('express-async-handler');
const { query } = require('../config/database');
const { authenticate } = require('../middlewares/auth.middleware');

const getOrCreateCart = async (userId) => {
    let result = await query(`SELECT * FROM cart WHERE user_id = $1 AND is_active = true`, [userId]);
    if (result.rows.length === 0) {
        result = await query(`INSERT INTO cart (user_id, is_active, created_at) VALUES ($1, true, NOW()) RETURNING *`, [userId]);
    }
    return result.rows[0];
};

const buildCartResponse = async (cartId) => {
    const items = await query(`
        SELECT ci.*, p.name, p.price, p.image_url, p.stock_quantity
        FROM cart_items ci
        JOIN products p ON ci.product_id = p.id
        WHERE ci.cart_id = $1
    `, [cartId]);
    const total = items.rows.reduce((sum, i) => sum + (i.price * i.quantity), 0);
    return { items: items.rows, total };
};

// Get cart
router.get('/', authenticate, asyncHandler(async (req, res) => {
    const cart = await getOrCreateCart(req.user.id);
    const data = await buildCartResponse(cart.id);
    res.json({ success: true, cart: data });
}));

// Add item
router.post('/items', authenticate, asyncHandler(async (req, res) => {
    const { productId, quantity = 1 } = req.body;
    const cart = await getOrCreateCart(req.user.id);
    const existing = await query(`SELECT * FROM cart_items WHERE cart_id = $1 AND product_id = $2`, [cart.id, productId]);
    if (existing.rows.length > 0) {
        await query(`UPDATE cart_items SET quantity = quantity + $1 WHERE cart_id = $2 AND product_id = $3`, [quantity, cart.id, productId]);
    } else {
        await query(`INSERT INTO cart_items (cart_id, product_id, quantity, created_at) VALUES ($1, $2, $3, NOW())`, [cart.id, productId, quantity]);
    }
    const data = await buildCartResponse(cart.id);
    res.json({ success: true, cart: data });
}));

// Update item quantity
router.put('/items/:productId', authenticate, asyncHandler(async (req, res) => {
    const { productId } = req.params;
    const { quantity } = req.body;
    const cart = await getOrCreateCart(req.user.id);
    if (quantity <= 0) {
        await query(`DELETE FROM cart_items WHERE cart_id = $1 AND product_id = $2`, [cart.id, productId]);
    } else {
        await query(`UPDATE cart_items SET quantity = $1 WHERE cart_id = $2 AND product_id = $3`, [quantity, cart.id, productId]);
    }
    const data = await buildCartResponse(cart.id);
    res.json({ success: true, cart: data });
}));

// Remove item
router.delete('/items/:productId', authenticate, asyncHandler(async (req, res) => {
    const { productId } = req.params;
    const cart = await getOrCreateCart(req.user.id);
    await query(`DELETE FROM cart_items WHERE cart_id = $1 AND product_id = $2`, [cart.id, productId]);
    const data = await buildCartResponse(cart.id);
    res.json({ success: true, cart: data });
}));

// Clear cart
router.delete('/clear', authenticate, asyncHandler(async (req, res) => {
    const cart = await getOrCreateCart(req.user.id);
    await query(`DELETE FROM cart_items WHERE cart_id = $1`, [cart.id]);
    res.json({ success: true, cart: { items: [], total: 0 } });
}));

module.exports = router;
