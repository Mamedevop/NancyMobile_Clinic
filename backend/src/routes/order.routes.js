const express = require('express');
const router = express.Router();
const asyncHandler = require('express-async-handler');
const { query } = require('../config/database');
const { authenticate } = require('../middlewares/auth.middleware');

// Get user orders
router.get('/', authenticate, asyncHandler(async (req, res) => {
    const result = await query('SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC', [req.user.id]);
    res.json({ success: true, orders: result.rows });
}));

// Track order by order number (public + authenticated)
router.get('/track/:orderNumber', asyncHandler(async (req, res) => {
    const result = await query(`
        SELECT o.id, o.order_number, o.status, o.total_amount, o.shipping_address,
               o.payment_method, o.created_at, o.updated_at,
               p.status as payment_status,
               dj.status as delivery_status, dj.job_type,
               d.first_name as driver_first, d.last_name as driver_last, d.phone as driver_phone
        FROM orders o
        LEFT JOIN payments p ON p.order_id = o.id
        LEFT JOIN delivery_jobs dj ON dj.order_id = o.id AND dj.status NOT IN ('cancelled')
        LEFT JOIN users d ON dj.assigned_to = d.id
        WHERE o.order_number = $1
    `, [req.params.orderNumber]);
    if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Order not found' });
    res.json({ success: true, order: result.rows[0] });
}));

// Customer: confirm delivery received
router.post('/track/:orderNumber/confirm', authenticate, asyncHandler(async (req, res) => {
    const result = await query(
        `UPDATE orders SET status='delivered', updated_at=NOW() WHERE order_number=$1 AND user_id=$2 RETURNING *`,
        [req.params.orderNumber, req.user.id]
    );
    if (result.rows.length === 0) return res.status(400).json({ success: false, message: 'Cannot confirm this order' });
    // Also complete the delivery job
    await query(
        `UPDATE delivery_jobs SET status='completed', completed_at=NOW(), updated_at=NOW() WHERE order_id=$1 AND status='delivered'`,
        [result.rows[0].id]
    );
    res.json({ success: true, order: result.rows[0] });
}));

// Get order items
router.get('/:id/items', authenticate, asyncHandler(async (req, res) => {
    const order = await query('SELECT id FROM orders WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
    if (order.rows.length === 0) return res.status(404).json({ success: false, message: 'Order not found' });
    const items = await query(
        'SELECT oi.*, p.name FROM order_items oi LEFT JOIN products p ON oi.product_id = p.id WHERE oi.order_id = $1',
        [req.params.id]
    );
    res.json({ success: true, items: items.rows });
}));

// Get single order
router.get('/:id', authenticate, asyncHandler(async (req, res) => {
    const result = await query('SELECT * FROM orders WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
    if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Order not found' });
    res.json({ success: true, order: result.rows[0] });
}));

// Place order
router.post('/', authenticate, asyncHandler(async (req, res) => {
    const { shipping_address, payment_method, items } = req.body;
    if (!items || items.length === 0) return res.status(400).json({ success: false, message: 'No items provided' });
    const total = items.reduce((sum, i) => sum + (parseFloat(i.price) * parseInt(i.quantity)), 0);
    const orderNumber = 'ORD-' + Date.now();
    const orderResult = await query(
        'INSERT INTO orders (order_number, user_id, total_amount, status, shipping_address, payment_method, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW()) RETURNING *',
        [orderNumber, req.user.id, total, 'pending', shipping_address, payment_method || null]
    );
    const order = orderResult.rows[0];
    for (const item of items) {
        await query('INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES ($1, $2, $3, $4)', [order.id, item.product_id, item.quantity, item.price]);
        await query('UPDATE products SET stock_quantity = stock_quantity - $1 WHERE id = $2 AND stock_quantity >= $1', [item.quantity, item.product_id]);
    }
    if (payment_method) {
        await query('INSERT INTO payments (order_id, user_id, amount, method, status, created_at) VALUES ($1, $2, $3, $4, $5, NOW())', [order.id, req.user.id, total, payment_method, 'pending']);
    }
    // Clear cart
    const cartResult = await query('SELECT id FROM cart WHERE user_id = $1 AND is_active = true', [req.user.id]);
    if (cartResult.rows.length > 0) await query('DELETE FROM cart_items WHERE cart_id = $1', [cartResult.rows[0].id]);
    res.status(201).json({ success: true, order });
}));

// Cancel order
router.post('/:id/cancel', authenticate, asyncHandler(async (req, res) => {
    const result = await query(
        "UPDATE orders SET status = 'cancelled', updated_at = NOW() WHERE id = $1 AND user_id = $2 AND status = 'pending' RETURNING *",
        [req.params.id, req.user.id]
    );
    if (result.rows.length === 0) return res.status(400).json({ success: false, message: 'Cannot cancel this order' });
    res.json({ success: true, order: result.rows[0] });
}));

module.exports = router;
