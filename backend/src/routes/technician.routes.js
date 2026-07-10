const express = require('express');
const router = express.Router();
const asyncHandler = require('express-async-handler');
const { query } = require('../config/database');
const { authenticate, authorize } = require('../middlewares/auth.middleware');

const isTech = authorize('technician', 'admin');

// Middleware: verified technicians only
const verifiedTech = asyncHandler(async (req, res, next) => {
    if (req.user.role === 'admin') return next();
    const result = await query('SELECT is_verified FROM users WHERE id = $1', [req.user.id]);
    if (!result.rows[0]?.is_verified) {
        return res.status(403).json({ success: false, message: 'Your account must be verified by an admin before you can access repair tasks.' });
    }
    next();
});

// Get technician repairs (assigned + unassigned)
router.get('/repairs', authenticate, isTech, verifiedTech, asyncHandler(async (req, res) => {
    const result = await query(`
        SELECT r.*, u.email as customer_email, u.first_name, u.last_name,
               t.first_name as tech_first, t.last_name as tech_last
        FROM repairs r
        LEFT JOIN users u ON r.user_id = u.id
        LEFT JOIN users t ON r.assigned_to = t.id
        WHERE r.assigned_to = $1 OR r.assigned_to IS NULL
        ORDER BY r.created_at DESC
    `, [req.user.id]);
    res.json({ success: true, repairs: result.rows });
}));

// Get stats for technician dashboard
router.get('/stats', authenticate, isTech, verifiedTech, asyncHandler(async (req, res) => {
    const [assigned, inProgress, completed, pending] = await Promise.all([
        query('SELECT COUNT(*) as total FROM repairs WHERE assigned_to = $1', [req.user.id]),
        query("SELECT COUNT(*) as total FROM repairs WHERE assigned_to = $1 AND status = 'in-progress'", [req.user.id]),
        query("SELECT COUNT(*) as total FROM repairs WHERE assigned_to = $1 AND status = 'completed'", [req.user.id]),
        query("SELECT COUNT(*) as total FROM repairs WHERE status = 'pending' AND assigned_to IS NULL"),
    ]);
    res.json({
        success: true,
        stats: {
            assigned: parseInt(assigned.rows[0].total),
            inProgress: parseInt(inProgress.rows[0].total),
            completed: parseInt(completed.rows[0].total),
            unassigned: parseInt(pending.rows[0].total),
        }
    });
}));

// Claim repair
router.post('/repairs/:id/claim', authenticate, isTech, verifiedTech, asyncHandler(async (req, res) => {
    const result = await query(
        `UPDATE repairs SET assigned_to = $1, status = 'diagnosed', updated_at = NOW()
         WHERE id = $2 AND (assigned_to IS NULL OR assigned_to = $1) RETURNING *`,
        [req.user.id, req.params.id]
    );
    if (result.rows.length === 0) return res.status(400).json({ success: false, message: 'Cannot claim this repair' });
    res.json({ success: true, repair: result.rows[0] });
}));

// Update repair status/notes/cost
router.put('/repairs/:id', authenticate, isTech, verifiedTech, asyncHandler(async (req, res) => {
    const { status, notes, estimated_cost } = req.body;
    const isCompleted = status === 'completed';
    const result = await query(
        `UPDATE repairs SET
         status = $1,
         notes = $2,
         estimated_cost = $3,
         completed_at = CASE WHEN $4 THEN NOW() ELSE NULL END,
         updated_at = NOW()
         WHERE id = $5 AND assigned_to = $6 RETURNING *`,
        [status, notes, estimated_cost, isCompleted, req.params.id, req.user.id]
    );
    if (result.rows.length === 0) return res.status(403).json({ success: false, message: 'Not authorized or repair not found' });
    res.json({ success: true, repair: result.rows[0] });
}));

// ── Repair History ──────────────────────────────────────────────────────────
router.get('/history', authenticate, isTech, verifiedTech, asyncHandler(async (req, res) => {
    const result = await query(`
        SELECT r.*, u.first_name, u.last_name, u.email as customer_email, u.phone as customer_phone
        FROM repairs r
        LEFT JOIN users u ON r.user_id = u.id
        WHERE r.assigned_to = $1 AND r.status = 'completed'
        ORDER BY r.completed_at DESC
    `, [req.user.id]);
    res.json({ success: true, repairs: result.rows });
}));

// ── Earnings ────────────────────────────────────────────────────────────────
router.get('/earnings', authenticate, isTech, verifiedTech, asyncHandler(async (req, res) => {
    const [total, daily, weekly, jobs] = await Promise.all([
        query(`SELECT COALESCE(SUM(estimated_cost),0) as total FROM repairs WHERE assigned_to=$1 AND status='completed'`, [req.user.id]),
        query(`SELECT COALESCE(SUM(estimated_cost),0) as total FROM repairs WHERE assigned_to=$1 AND status='completed' AND completed_at >= NOW()-INTERVAL '1 day'`, [req.user.id]),
        query(`SELECT COALESCE(SUM(estimated_cost),0) as total FROM repairs WHERE assigned_to=$1 AND status='completed' AND completed_at >= NOW()-INTERVAL '7 days'`, [req.user.id]),
        query(`SELECT TO_CHAR(completed_at,'YYYY-MM-DD') as day, COUNT(*) as jobs, COALESCE(SUM(estimated_cost),0) as revenue FROM repairs WHERE assigned_to=$1 AND status='completed' AND completed_at >= NOW()-INTERVAL '30 days' GROUP BY day ORDER BY day DESC`, [req.user.id]),
    ]);
    res.json({ success: true, earnings: {
        total: parseFloat(total.rows[0].total),
        daily: parseFloat(daily.rows[0].total),
        weekly: parseFloat(weekly.rows[0].total),
        breakdown: jobs.rows,
    }});
}));

// ── Reviews ─────────────────────────────────────────────────────────────────
router.get('/reviews', authenticate, isTech, verifiedTech, asyncHandler(async (req, res) => {
    const result = await query(`
        SELECT rv.*, u.first_name, u.last_name, r.device_type
        FROM repair_reviews rv
        JOIN users u ON rv.customer_id = u.id
        JOIN repairs r ON rv.repair_id = r.id
        WHERE rv.technician_id = $1
        ORDER BY rv.created_at DESC
    `, [req.user.id]);
    const avg = await query(`SELECT ROUND(AVG(rating),1) as avg FROM repair_reviews WHERE technician_id=$1`, [req.user.id]);
    res.json({ success: true, reviews: result.rows, average: parseFloat(avg.rows[0].avg) || 0 });
}));

// Submit review (customer) — technician_id is optional, looked up from repair if missing
router.post('/reviews', authenticate, asyncHandler(async (req, res) => {
    const { repair_id, rating, comment } = req.body;
    let { technician_id } = req.body;
    if (!repair_id || !rating) {
        return res.status(400).json({ success: false, message: 'repair_id and rating are required' });
    }
    // Verify the repair belongs to this customer and is completed
    const repairResult = await query(
        `SELECT id, assigned_to, user_id, status FROM repairs WHERE id = $1`,
        [repair_id]
    );
    if (repairResult.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Repair not found' });
    }
    const repair = repairResult.rows[0];
    if (repair.user_id !== req.user.id) {
        return res.status(403).json({ success: false, message: 'Not your repair' });
    }
    if (repair.status !== 'completed') {
        return res.status(400).json({ success: false, message: 'Can only review completed repairs' });
    }
    // Use assigned_to from repair if technician_id not provided
    if (!technician_id) technician_id = repair.assigned_to;

    const result = await query(
        `INSERT INTO repair_reviews (repair_id, technician_id, customer_id, rating, comment, created_at)
         VALUES ($1,$2,$3,$4,$5,NOW())
         ON CONFLICT (repair_id) DO UPDATE SET rating=$4, comment=$5, technician_id=$2
         RETURNING *`,
        [repair_id, technician_id || null, req.user.id, rating, comment || null]
    );
    res.status(201).json({ success: true, review: result.rows[0] });
}));

// ── Availability ─────────────────────────────────────────────────────────────
router.get('/availability', authenticate, isTech, asyncHandler(async (req, res) => {
    const result = await query(`SELECT is_available FROM users WHERE id=$1`, [req.user.id]);
    res.json({ success: true, available: result.rows[0]?.is_available ?? false });
}));

router.put('/availability', authenticate, isTech, asyncHandler(async (req, res) => {
    const { available } = req.body;
    await query(`UPDATE users SET is_available=$1, updated_at=NOW() WHERE id=$2`, [available, req.user.id]);
    res.json({ success: true, available });
}));

// ── Parts & Inventory ────────────────────────────────────────────────────────
router.get('/parts', authenticate, isTech, verifiedTech, asyncHandler(async (req, res) => {
    const result = await query(`SELECT * FROM spare_parts ORDER BY name`);
    res.json({ success: true, parts: result.rows });
}));

router.post('/parts/request', authenticate, isTech, verifiedTech, asyncHandler(async (req, res) => {
    const { part_name, quantity, repair_id, notes } = req.body;
    const result = await query(
        `INSERT INTO parts_requests (technician_id, part_name, quantity, repair_id, notes, status, created_at) VALUES ($1,$2,$3,$4,$5,'pending',NOW()) RETURNING *`,
        [req.user.id, part_name, quantity || 1, repair_id || null, notes || null]
    );
    res.status(201).json({ success: true, request: result.rows[0] });
}));

router.get('/parts/requests', authenticate, isTech, verifiedTech, asyncHandler(async (req, res) => {
    const result = await query(
        `SELECT pr.*, r.device_type FROM parts_requests pr LEFT JOIN repairs r ON pr.repair_id = r.id WHERE pr.technician_id=$1 ORDER BY pr.created_at DESC`,
        [req.user.id]
    );
    res.json({ success: true, requests: result.rows });
}));

router.get('/parts/used', authenticate, isTech, verifiedTech, asyncHandler(async (req, res) => {
    const result = await query(
        `SELECT pu.*, sp.name as part_name, r.device_type FROM parts_usage pu JOIN spare_parts sp ON pu.part_id = sp.id JOIN repairs r ON pu.repair_id = r.id WHERE pu.technician_id=$1 ORDER BY pu.used_at DESC`,
        [req.user.id]
    );
    res.json({ success: true, usage: result.rows });
}));

// ── Job Requests (unassigned repairs with full customer details) ──────────────
router.get('/job-requests', authenticate, isTech, verifiedTech, asyncHandler(async (req, res) => {
    const result = await query(`
        SELECT r.*, u.first_name, u.last_name, u.email as customer_email,
               u.phone as customer_phone, u.address as customer_address
        FROM repairs r
        JOIN users u ON r.user_id = u.id
        WHERE r.status = 'pending'
          AND (r.assigned_to IS NULL OR r.assigned_to = $1)
        ORDER BY
          CASE WHEN r.assigned_to = $1 THEN 0 ELSE 1 END,
          r.created_at DESC
    `, [req.user.id]);
    res.json({ success: true, requests: result.rows });
}));

// Accept job request
router.post('/job-requests/:id/accept', authenticate, isTech, verifiedTech, asyncHandler(async (req, res) => {
    const result = await query(
        `UPDATE repairs SET assigned_to=$1, status='diagnosed', updated_at=NOW()
         WHERE id=$2
           AND status='pending'
           AND (assigned_to IS NULL OR assigned_to = $1)
         RETURNING *`,
        [req.user.id, req.params.id]
    );
    if (result.rows.length === 0) return res.status(400).json({ success: false, message: 'Job already taken or not found' });
    res.json({ success: true, repair: result.rows[0] });
}));

// Reject job request (just ignore — no action needed, but log it)
router.post('/job-requests/:id/reject', authenticate, isTech, verifiedTech, asyncHandler(async (req, res) => {
    res.json({ success: true, message: 'Job request declined' });
}));

module.exports = router;
