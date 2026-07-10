const express = require('express');
const router = express.Router();
const asyncHandler = require('express-async-handler');
const { query } = require('../config/database');

// Get all users the current user can chat with
router.get('/contacts', asyncHandler(async (req, res) => {
    const result = await query(`
        SELECT u.id, u.first_name, u.last_name, u.email, r.name as role,
               u.profile_picture,
               (SELECT COUNT(*) FROM messages m WHERE m.sender_id = u.id AND m.receiver_id = $1 AND m.is_read = false) as unread
        FROM users u
        JOIN roles r ON u.role_id = r.id
        WHERE u.id != $1 AND u.is_active = true
          AND r.name IN ('customer','admin','delivery_person','technician')
        ORDER BY r.name, u.first_name
    `, [req.user.id]);
    res.json({ success: true, contacts: result.rows });
}));

// Get conversation with a specific user
router.get('/messages/:userId', asyncHandler(async (req, res) => {
    const { userId } = req.params;
    // Mark messages as read
    await query(`UPDATE messages SET is_read = true WHERE sender_id = $1 AND receiver_id = $2`, [userId, req.user.id]);
    const result = await query(`
        SELECT m.*, 
               s.first_name as sender_first, s.last_name as sender_last,
               r.first_name as receiver_first, r.last_name as receiver_last
        FROM messages m
        JOIN users s ON m.sender_id = s.id
        JOIN users r ON m.receiver_id = r.id
        WHERE (m.sender_id = $1 AND m.receiver_id = $2)
           OR (m.sender_id = $2 AND m.receiver_id = $1)
        ORDER BY m.created_at ASC
        LIMIT 100
    `, [req.user.id, userId]);
    res.json({ success: true, messages: result.rows });
}));

// Send a message
router.post('/messages', asyncHandler(async (req, res) => {
    const { receiver_id, content } = req.body;
    if (!receiver_id || !content?.trim()) {
        return res.status(400).json({ success: false, message: 'receiver_id and content are required' });
    }
    const result = await query(
        `INSERT INTO messages (sender_id, receiver_id, content, created_at) VALUES ($1,$2,$3,NOW()) RETURNING *`,
        [req.user.id, receiver_id, content.trim()]
    );
    res.status(201).json({ success: true, message: result.rows[0] });
}));

// Get unread count
router.get('/unread', asyncHandler(async (req, res) => {
    const result = await query(
        `SELECT COUNT(*) as total FROM messages WHERE receiver_id = $1 AND is_read = false`,
        [req.user.id]
    );
    res.json({ success: true, unread: parseInt(result.rows[0].total) });
}));

module.exports = router;
