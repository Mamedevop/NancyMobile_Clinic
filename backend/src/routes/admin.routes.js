const express = require('express');
const router = express.Router();
const asyncHandler = require('express-async-handler');
const { query } = require('../config/database');
const { authenticate, authorize } = require('../middlewares/auth.middleware');

const isAdmin = authorize('admin');
const adminOnly = authorize('admin');

// Dashboard stats
router.get('/dashboard/stats', authenticate, isAdmin, asyncHandler(async (req, res) => {
    const [revenue, orders, users, repairs] = await Promise.all([
        query("SELECT COALESCE(SUM(total_amount), 0) as total FROM orders WHERE status != 'cancelled'"),
        query('SELECT COUNT(*) as total FROM orders'),
        query('SELECT COUNT(*) as total FROM users'),
        query('SELECT COUNT(*) as total FROM repairs'),
    ]);
    res.json({
        success: true,
        stats: {
            revenue: parseFloat(revenue.rows[0].total),
            orders: parseInt(orders.rows[0].total),
            users: parseInt(users.rows[0].total),
            repairs: parseInt(repairs.rows[0].total),
        }
    });
}));

// Analytics endpoint for charts
router.get('/analytics', authenticate, isAdmin, asyncHandler(async (req, res) => {
    const [
        revenueByMonth,
        ordersByStatus,
        ordersByMonth,
        topProducts,
        usersByRole,
        repairsByStatus,
        paymentsByMethod,
        recentRevenue
    ] = await Promise.all([
        // Revenue by month (last 6 months)
        query(`SELECT TO_CHAR(created_at, 'Mon YYYY') as month, TO_CHAR(created_at, 'YYYY-MM') as month_key, COALESCE(SUM(total_amount), 0) as revenue FROM orders WHERE status != 'cancelled' AND created_at >= NOW() - INTERVAL '6 months' GROUP BY month, month_key ORDER BY month_key`),
        // Orders by status
        query(`SELECT status, COUNT(*) as count FROM orders GROUP BY status ORDER BY count DESC`),
        // Orders by month (last 6 months)
        query(`SELECT TO_CHAR(created_at, 'Mon YYYY') as month, TO_CHAR(created_at, 'YYYY-MM') as month_key, COUNT(*) as count FROM orders WHERE created_at >= NOW() - INTERVAL '6 months' GROUP BY month, month_key ORDER BY month_key`),
        // Top 5 products by order quantity
        query(`SELECT p.name, COALESCE(SUM(oi.quantity), 0) as total_sold FROM products p LEFT JOIN order_items oi ON p.id = oi.product_id GROUP BY p.id, p.name ORDER BY total_sold DESC LIMIT 5`),
        // Users by role
        query(`SELECT r.name as role, COUNT(u.id) as count FROM roles r LEFT JOIN users u ON u.role_id = r.id GROUP BY r.name ORDER BY count DESC`),
        // Repairs by status
        query(`SELECT status, COUNT(*) as count FROM repairs GROUP BY status ORDER BY count DESC`),
        // Payments by method
        query(`SELECT method, COUNT(*) as count, COALESCE(SUM(amount), 0) as total FROM payments WHERE status = 'completed' GROUP BY method`),
        // Daily revenue last 7 days
        query(`SELECT TO_CHAR(created_at, 'DD Mon') as day, TO_CHAR(created_at, 'YYYY-MM-DD') as day_key, COALESCE(SUM(total_amount), 0) as revenue FROM orders WHERE status != 'cancelled' AND created_at >= NOW() - INTERVAL '7 days' GROUP BY day, day_key ORDER BY day_key`)
    ]);

    res.json({
        success: true,
        analytics: {
            revenueByMonth: revenueByMonth.rows,
            ordersByStatus: ordersByStatus.rows,
            ordersByMonth: ordersByMonth.rows,
            topProducts: topProducts.rows,
            usersByRole: usersByRole.rows,
            repairsByStatus: repairsByStatus.rows,
            paymentsByMethod: paymentsByMethod.rows,
            recentRevenue: recentRevenue.rows
        }
    });
}));

// Get all users
router.get('/users', authenticate, adminOnly, asyncHandler(async (req, res) => {
    const result = await query(`
        SELECT u.id, u.email, u.first_name, u.last_name, u.phone, u.address,
               u.is_active, u.is_verified, u.verification_status,
               u.national_id, u.fan_number, u.profile_picture, u.national_id_file,
               u.created_at, u.updated_at, u.role_id,
               COALESCE(r.name, 'unknown') as role
        FROM users u
        LEFT JOIN roles r ON u.role_id = r.id
        ORDER BY u.created_at DESC
    `);
    res.json({ success: true, users: result.rows });
}));

// Admin create user
router.post('/users', authenticate, adminOnly, asyncHandler(async (req, res) => {
    const bcrypt = require('bcryptjs');
    const { v4: uuidv4 } = require('uuid');
    const { first_name, last_name, email, password, role } = req.body;
    if (!email || !password || !first_name || !last_name || !role) {
        return res.status(400).json({ success: false, message: 'All fields required' });
    }
    const existing = await query('SELECT id FROM users WHERE LOWER(email) = LOWER($1)', [email]);
    if (existing.rows.length > 0) return res.status(400).json({ success: false, message: 'Email already registered' });
    const roleResult = await query('SELECT id FROM roles WHERE name = $1', [role]);
    if (roleResult.rows.length === 0) return res.status(400).json({ success: false, message: 'Invalid role' });
    const hash = await bcrypt.hash(password, 10);
    const result = await query(
        'INSERT INTO users (id, email, password_hash, first_name, last_name, role_id, is_active, created_at) VALUES ($1,$2,$3,$4,$5,$6,true,NOW()) RETURNING *',
        [uuidv4(), email, hash, first_name, last_name, roleResult.rows[0].id]
    );
    delete result.rows[0].password_hash;
    res.status(201).json({ success: true, user: result.rows[0] });
}));

// Update user (including role change)
router.put('/users/:id', authenticate, adminOnly, asyncHandler(async (req, res) => {
    const { id } = req.params;
    const allowed = ['first_name', 'last_name', 'phone', 'address', 'is_active', 'is_verified', 'verification_status'];
    const updates = {};
    for (const key of allowed) {
        if (req.body[key] !== undefined) updates[key] = req.body[key];
    }
    // Handle role change separately
    if (req.body.role) {
        const roleResult = await query('SELECT id FROM roles WHERE name = $1', [req.body.role]);
        if (roleResult.rows.length > 0) updates.role_id = roleResult.rows[0].id;
    }
    if (Object.keys(updates).length === 0) return res.json({ success: true });
    const keys = Object.keys(updates);
    const setClause = keys.map((k, i) => k + ' = $' + (i + 1)).join(', ');
    const values = [...Object.values(updates), id];
    const result = await query(
        'UPDATE users SET ' + setClause + ', updated_at = NOW() WHERE id = $' + values.length + ' RETURNING *',
        values
    );
    res.json({ success: true, user: result.rows[0] });
}));

// Get all orders
router.get('/orders', authenticate, isAdmin, asyncHandler(async (req, res) => {
    const { limit = 50 } = req.query;
    const result = await query(
        'SELECT o.*, u.first_name, u.last_name, u.email as user_email, CONCAT(u.first_name, \' \', u.last_name) as customer_name FROM orders o JOIN users u ON o.user_id = u.id ORDER BY o.created_at DESC LIMIT $1',
        [parseInt(limit)]
    );
    res.json({ success: true, orders: result.rows });
}));

// Update order status
router.put('/orders/:id/status', authenticate, isAdmin, asyncHandler(async (req, res) => {
    const { status } = req.body;
    const result = await query(
        'UPDATE orders SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
        [status, req.params.id]
    );
    res.json({ success: true, order: result.rows[0] });
}));

// Delete order (admin only)
router.delete('/orders/:id', authenticate, adminOnly, asyncHandler(async (req, res) => {
    await query('DELETE FROM order_items WHERE order_id = $1', [req.params.id]);
    await query('DELETE FROM payments WHERE order_id = $1', [req.params.id]);
    const result = await query('DELETE FROM orders WHERE id = $1 RETURNING id', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Order not found' });
    res.json({ success: true, message: 'Order deleted' });
}));

// Get all payments
router.get('/payments', authenticate, isAdmin, asyncHandler(async (req, res) => {
    const result = await query(
        'SELECT p.*, u.email as user_email, o.order_number FROM payments p LEFT JOIN users u ON p.user_id = u.id LEFT JOIN orders o ON p.order_id = o.id ORDER BY p.created_at DESC'
    );
    res.json({ success: true, payments: result.rows });
}));

// Verify payment
router.put('/payments/:id/verify', authenticate, isAdmin, asyncHandler(async (req, res) => {
    const { status } = req.body;
    const result = await query(
        'UPDATE payments SET status = $1, verified_at = NOW(), verified_by = $2 WHERE id = $3 RETURNING *',
        [status, req.user.id, req.params.id]
    );
    if (status === 'completed' && result.rows[0]) {
        await query("UPDATE orders SET status = 'processing', updated_at = NOW() WHERE id = $1", [result.rows[0].order_id]);
    }
    res.json({ success: true, payment: result.rows[0] });
}));

// Get all repairs
router.get('/repairs', authenticate, isAdmin, asyncHandler(async (req, res) => {
    const result = await query(
        'SELECT r.*, u.email as user_email, u.first_name, u.last_name FROM repairs r LEFT JOIN users u ON r.user_id = u.id ORDER BY r.created_at DESC'
    );
    res.json({ success: true, repairs: result.rows });
}));

// Update repair
router.put('/repairs/:id', authenticate, isAdmin, asyncHandler(async (req, res) => {
    const { status, estimated_cost, assigned_to } = req.body;
    const result = await query(
        'UPDATE repairs SET status = COALESCE($1, status), estimated_cost = COALESCE($2, estimated_cost), assigned_to = $3, updated_at = NOW() WHERE id = $4 RETURNING *',
        [status, estimated_cost, assigned_to || null, req.params.id]
    );
    res.json({ success: true, repair: result.rows[0] });
}));

// Get bank settings (admin)
router.get('/bank-settings', authenticate, isAdmin, asyncHandler(async (req, res) => {
    const result = await query('SELECT * FROM bank_settings ORDER BY id');
    res.json({ success: true, banks: result.rows });
}));

// Add new bank setting
router.post('/bank-settings', authenticate, isAdmin, asyncHandler(async (req, res) => {
    const { bank_name, account_number, account_name, bank_key } = req.body;
    if (!bank_name || !account_number || !account_name) {
        return res.status(400).json({ success: false, message: 'bank_name, account_number and account_name are required' });
    }
    const key = bank_key || bank_name.toLowerCase().replace(/\s+/g, '_');
    const result = await query(
        'INSERT INTO bank_settings (bank_name, bank_key, account_number, account_name, is_active, created_at, updated_at) VALUES ($1,$2,$3,$4,true,NOW(),NOW()) RETURNING *',
        [bank_name, key, account_number, account_name]
    );
    res.status(201).json({ success: true, bank: result.rows[0] });
}));

// Delete bank setting
router.delete('/bank-settings/:id', authenticate, isAdmin, asyncHandler(async (req, res) => {
    const result = await query('DELETE FROM bank_settings WHERE id = $1 RETURNING id', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Bank not found' });
    res.json({ success: true, message: 'Bank deleted' });
}));

// Update bank setting
router.put('/bank-settings/:id', authenticate, isAdmin, asyncHandler(async (req, res) => {
    const { bank_name, account_number, account_name, is_active } = req.body;
    const result = await query(
        'UPDATE bank_settings SET bank_name=$1, account_number=$2, account_name=$3, is_active=$4, updated_at=NOW() WHERE id=$5 RETURNING *',
        [bank_name, account_number, account_name, is_active, req.params.id]
    );
    res.json({ success: true, bank: result.rows[0] });
}));

// Public bank settings (for checkout)
router.get('/public/bank-settings', asyncHandler(async (req, res) => {
    const result = await query('SELECT * FROM bank_settings WHERE is_active=true ORDER BY id');
    res.json({ success: true, banks: result.rows });
}));

// Delete payment (admin only)
router.delete('/payments/:id', authenticate, adminOnly, asyncHandler(async (req, res) => {
    const result = await query('DELETE FROM payments WHERE id = $1 RETURNING id', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Payment not found' });
    res.json({ success: true, message: 'Payment deleted' });
}));

// Delete user (admin only)
router.delete('/users/:id', authenticate, adminOnly, asyncHandler(async (req, res) => {
    const { id } = req.params;
    if (id === req.user.id) {
        return res.status(400).json({ success: false, message: 'Cannot delete your own account' });
    }
    await query('DELETE FROM users WHERE id = $1', [id]);
    res.json({ success: true, message: 'User deleted' });
}));

// ── Parts Requests (admin) ───────────────────────────────────────────────────
// Get all parts requests
router.get('/parts-requests', authenticate, isAdmin, asyncHandler(async (req, res) => {
    const result = await query(`
        SELECT pr.*, u.first_name, u.last_name, u.email as tech_email,
               r.device_type
        FROM parts_requests pr
        JOIN users u ON pr.technician_id = u.id
        LEFT JOIN repairs r ON pr.repair_id = r.id
        ORDER BY pr.created_at DESC
    `);
    res.json({ success: true, requests: result.rows });
}));

// Approve or reject a parts request
router.put('/parts-requests/:id', authenticate, isAdmin, asyncHandler(async (req, res) => {
    const { status, admin_notes } = req.body; // status: 'approved' | 'rejected'
    if (!['approved', 'rejected'].includes(status)) {
        return res.status(400).json({ success: false, message: 'status must be approved or rejected' });
    }
    const result = await query(
        `UPDATE parts_requests SET status=$1, admin_notes=$2, updated_at=NOW() WHERE id=$3 RETURNING *`,
        [status, admin_notes || null, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Request not found' });
    res.json({ success: true, request: result.rows[0] });
}));

// ── Spare Parts CRUD (admin) ─────────────────────────────────────────────────
router.get('/spare-parts', authenticate, isAdmin, asyncHandler(async (req, res) => {
    const result = await query('SELECT * FROM spare_parts ORDER BY name');
    res.json({ success: true, parts: result.rows });
}));

router.post('/spare-parts', authenticate, isAdmin, asyncHandler(async (req, res) => {
    const { name, description, quantity, unit_price } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'name is required' });
    const result = await query(
        `INSERT INTO spare_parts (name, description, quantity, unit_price, created_at) VALUES ($1,$2,$3,$4,NOW()) RETURNING *`,
        [name, description || null, quantity || 0, unit_price || null]
    );
    res.status(201).json({ success: true, part: result.rows[0] });
}));

router.put('/spare-parts/:id', authenticate, isAdmin, asyncHandler(async (req, res) => {
    const { name, description, quantity, unit_price } = req.body;
    const result = await query(
        `UPDATE spare_parts SET name=$1, description=$2, quantity=$3, unit_price=$4 WHERE id=$5 RETURNING *`,
        [name, description, quantity, unit_price, req.params.id]
    );
    res.json({ success: true, part: result.rows[0] });
}));

router.delete('/spare-parts/:id', authenticate, isAdmin, asyncHandler(async (req, res) => {
    await query('DELETE FROM spare_parts WHERE id=$1', [req.params.id]);
    res.json({ success: true });
}));

module.exports = router;
