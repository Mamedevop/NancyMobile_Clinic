const express = require('express');
const router = express.Router();
const asyncHandler = require('express-async-handler');
const { query } = require('../config/database');
const { authenticate } = require('../middlewares/auth.middleware');

// Get customer's own repairs (with technician info)
router.get('/', authenticate, asyncHandler(async (req, res) => {
    const result = await query(
        `SELECT r.*, t.first_name as tech_first, t.last_name as tech_last
         FROM repairs r
         LEFT JOIN users t ON r.assigned_to = t.id
         WHERE r.user_id = $1 ORDER BY r.created_at DESC`,
        [req.user.id]
    );
    res.json({ success: true, repairs: result.rows });
}));

// Get available (online + verified) technicians for customer to choose
router.get('/available-technicians', authenticate, asyncHandler(async (req, res) => {
    const result = await query(`
        SELECT u.id, u.first_name, u.last_name, u.profile_picture,
               COUNT(r.id) FILTER (WHERE r.status = 'completed') as completed_jobs,
               ROUND(AVG(rv.rating), 1) as avg_rating
        FROM users u
        JOIN roles ro ON u.role_id = ro.id
        LEFT JOIN repairs r ON r.assigned_to = u.id
        LEFT JOIN repair_reviews rv ON rv.technician_id = u.id
        WHERE ro.name = 'technician'
          AND u.is_verified = true
          AND u.is_active = true
          AND u.is_available = true
        GROUP BY u.id, u.first_name, u.last_name, u.profile_picture
        ORDER BY avg_rating DESC NULLS LAST
    `);
    res.json({ success: true, technicians: result.rows });
}));

// Submit repair request
router.post('/', authenticate, asyncHandler(async (req, res) => {
    const userResult = await query('SELECT is_verified FROM users WHERE id = $1', [req.user.id]);
    if (!userResult.rows[0]?.is_verified) {
        return res.status(403).json({ success: false, message: 'Your account must be verified before submitting a repair request.' });
    }
    const { device_type, issue_description, preferred_technician_id } = req.body;

    // If customer picked a specific technician, assign directly
    const assignedTo = preferred_technician_id || null;
    const status = assignedTo ? 'pending' : 'pending'; // stays pending until tech accepts

    const result = await query(
        `INSERT INTO repairs (user_id, device_type, issue_description, status, assigned_to, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, NOW(), NOW()) RETURNING *`,
        [req.user.id, device_type, issue_description, status, assignedTo]
    );
    res.status(201).json({ success: true, repair: result.rows[0] });
}));

// Customer: get their completed repairs eligible for review
router.get('/my-reviews', authenticate, asyncHandler(async (req, res) => {
    const result = await query(`
        SELECT r.id as repair_id, r.device_type, r.issue_description, r.completed_at,
               r.estimated_cost, r.assigned_to,
               t.first_name as tech_first, t.last_name as tech_last, t.profile_picture as tech_pic,
               rv.id as review_id, rv.rating, rv.comment, rv.created_at as reviewed_at
        FROM repairs r
        LEFT JOIN users t ON r.assigned_to = t.id
        LEFT JOIN repair_reviews rv ON rv.repair_id = r.id AND rv.customer_id = $1
        WHERE r.user_id = $1 AND r.status = 'completed'
        ORDER BY r.completed_at DESC
    `, [req.user.id]);
    res.json({ success: true, repairs: result.rows });
}));

module.exports = router;
