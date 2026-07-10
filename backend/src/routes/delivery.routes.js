const express = require('express');
const router = express.Router();
const asyncHandler = require('express-async-handler');
const { query } = require('../config/database');
const { authorize } = require('../middlewares/auth.middleware');

const isDelivery = authorize('delivery_person', 'admin');
const isAdmin = authorize('admin');

// Verified delivery person middleware
const verifiedDelivery = asyncHandler(async (req, res, next) => {
    if (req.user.role === 'admin') return next();
    const result = await query('SELECT is_verified FROM users WHERE id = $1', [req.user.id]);
    if (!result.rows[0]?.is_verified) {
        return res.status(403).json({ success: false, message: 'Account must be verified before accessing delivery tasks.' });
    }
    next();
});

// Get delivery person stats
router.get('/stats', isDelivery, verifiedDelivery, asyncHandler(async (req, res) => {
    const [pending, active, completed, total] = await Promise.all([
        query(`SELECT COUNT(*) as c FROM delivery_jobs WHERE assigned_to=$1 AND status='pending'`, [req.user.id]),
        query(`SELECT COUNT(*) as c FROM delivery_jobs WHERE assigned_to=$1 AND status='in-progress'`, [req.user.id]),
        query(`SELECT COUNT(*) as c FROM delivery_jobs WHERE assigned_to=$1 AND status='completed'`, [req.user.id]),
        query(`SELECT COUNT(*) as c FROM delivery_jobs WHERE assigned_to=$1`, [req.user.id]),
    ]);
    res.json({ success: true, stats: {
        pending: parseInt(pending.rows[0].c),
        active: parseInt(active.rows[0].c),
        completed: parseInt(completed.rows[0].c),
        total: parseInt(total.rows[0].c),
    }});
}));

// Get my jobs (tasks)
router.get('/jobs', isDelivery, verifiedDelivery, asyncHandler(async (req, res) => {
    const result = await query(`
        SELECT dj.*, o.order_number, o.shipping_address,
               u.first_name as customer_first, u.last_name as customer_last, u.phone as customer_phone
        FROM delivery_jobs dj
        LEFT JOIN orders o ON dj.order_id = o.id
        LEFT JOIN users u ON o.user_id = u.id
        WHERE dj.assigned_to = $1
        ORDER BY dj.created_at DESC
    `, [req.user.id]);
    res.json({ success: true, jobs: result.rows });
}));

// Get active job
router.get('/jobs/active', isDelivery, verifiedDelivery, asyncHandler(async (req, res) => {
    const result = await query(`
        SELECT dj.*, o.order_number, o.shipping_address,
               u.first_name as customer_first, u.last_name as customer_last, u.phone as customer_phone
        FROM delivery_jobs dj
        LEFT JOIN orders o ON dj.order_id = o.id
        LEFT JOIN users u ON o.user_id = u.id
        WHERE dj.assigned_to = $1 AND dj.status = 'in-progress'
        ORDER BY dj.created_at DESC LIMIT 1
    `, [req.user.id]);
    res.json({ success: true, job: result.rows[0] || null });
}));

// Update job status
router.put('/jobs/:id', isDelivery, verifiedDelivery, asyncHandler(async (req, res) => {
    const { status, notes, payment_collected, payment_amount } = req.body;
    const isCompleted = status === 'completed';

    const result = await query(`
        UPDATE delivery_jobs
        SET status=$1,
            notes=COALESCE($2, notes),
            payment_collected=COALESCE($3, payment_collected),
            payment_amount=COALESCE($4, payment_amount),
            completed_at = CASE WHEN $5 THEN NOW() ELSE completed_at END,
            updated_at=NOW()
        WHERE id=$6 AND assigned_to=$7 RETURNING *
    `, [status, notes, payment_collected, payment_amount, isCompleted, req.params.id, req.user.id]);

    if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Job not found' });

    // If completed, update order status to delivered
    if (isCompleted && result.rows[0].order_id) {
        await query(`UPDATE orders SET status='delivered', updated_at=NOW() WHERE id=$1`, [result.rows[0].order_id]);
    }

    // When status becomes 'delivered', notify the customer via chat message
    if (status === 'delivered' && result.rows[0].order_id) {
        try {
            const orderRes = await query(
                `SELECT o.user_id, o.order_number, u.first_name FROM orders o JOIN users u ON o.user_id = u.id WHERE o.id=$1`,
                [result.rows[0].order_id]
            );
            if (orderRes.rows.length > 0) {
                const { user_id, order_number, first_name } = orderRes.rows[0];
                const msg = `Hi ${first_name}! Your order ${order_number} has arrived. Please confirm receipt in the app. 📦`;
                await query(`INSERT INTO messages (sender_id, receiver_id, content, created_at) VALUES ($1,$2,$3,NOW())`,
                    [req.user.id, user_id, msg]);
            }
        } catch (e) { /* non-critical */ }
    }

    res.json({ success: true, job: result.rows[0] });
}));

// Admin: get all delivery jobs
router.get('/admin/jobs', isAdmin, asyncHandler(async (req, res) => {
    const result = await query(`
        SELECT dj.*, o.order_number, o.shipping_address,
               u.first_name as customer_first, u.last_name as customer_last,
               d.first_name as driver_first, d.last_name as driver_last
        FROM delivery_jobs dj
        LEFT JOIN orders o ON dj.order_id = o.id
        LEFT JOIN users u ON o.user_id = u.id
        LEFT JOIN users d ON dj.assigned_to = d.id
        ORDER BY dj.created_at DESC
    `);
    res.json({ success: true, jobs: result.rows });
}));

// Admin: assign delivery job
router.post('/admin/jobs', isAdmin, asyncHandler(async (req, res) => {
    const { order_id, assigned_to, pickup_address, delivery_address, notes, job_type, is_cod, cod_amount } = req.body;
    const result = await query(`
        INSERT INTO delivery_jobs (order_id, assigned_to, pickup_address, delivery_address, notes, job_type, is_cod, cod_amount, status, created_at, updated_at)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'pending',NOW(),NOW()) RETURNING *
    `, [order_id || null, assigned_to, pickup_address || null, delivery_address, notes || null,
        job_type || 'delivery', is_cod || false, cod_amount || null]);
    res.status(201).json({ success: true, job: result.rows[0] });
}));

// Admin: update delivery job
router.put('/admin/jobs/:id', isAdmin, asyncHandler(async (req, res) => {
    const { assigned_to, status, notes, pickup_address, delivery_address, job_type, is_cod, cod_amount } = req.body;
    const result = await query(`
        UPDATE delivery_jobs SET
            assigned_to=COALESCE($1, assigned_to),
            status=COALESCE($2, status),
            notes=COALESCE($3, notes),
            pickup_address=COALESCE($4, pickup_address),
            delivery_address=COALESCE($5, delivery_address),
            job_type=COALESCE($6, job_type),
            is_cod=COALESCE($7, is_cod),
            cod_amount=COALESCE($8, cod_amount),
            updated_at=NOW()
        WHERE id=$9 RETURNING *
    `, [assigned_to, status, notes, pickup_address, delivery_address, job_type, is_cod, cod_amount, req.params.id]);
    res.json({ success: true, job: result.rows[0] });
}));

// Admin: delete delivery job
router.delete('/admin/jobs/:id', isAdmin, asyncHandler(async (req, res) => {
    await query('DELETE FROM delivery_jobs WHERE id=$1', [req.params.id]);
    res.json({ success: true });
}));

// Admin: get delivery persons
router.get('/admin/drivers', isAdmin, asyncHandler(async (req, res) => {
    const result = await query(`
        SELECT u.id, u.first_name, u.last_name, u.phone, u.is_verified, u.is_available,
               COUNT(dj.id) FILTER (WHERE dj.status NOT IN ('completed','cancelled')) as active_jobs
        FROM users u
        JOIN roles r ON u.role_id = r.id
        LEFT JOIN delivery_jobs dj ON dj.assigned_to = u.id
        WHERE r.name = 'delivery_person' AND u.is_active = true
        GROUP BY u.id ORDER BY u.first_name
    `);
    res.json({ success: true, drivers: result.rows });
}));

module.exports = router;
