const express = require('express');
const router = express.Router();
const asyncHandler = require('express-async-handler');
const { query } = require('../config/database');
const { authenticate } = require('../middlewares/auth.middleware');
const multer = require('multer');

// Memory storage - store receipt as base64 in DB (survives Railway redeploys)
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

// Get user payments
router.get('/', authenticate, asyncHandler(async (req, res) => {
    const result = await query(
        'SELECT p.*, o.order_number FROM payments p LEFT JOIN orders o ON p.order_id = o.id WHERE p.user_id = $1 ORDER BY p.created_at DESC',
        [req.user.id]
    );
    res.json({ success: true, payments: result.rows });
}));

// Submit payment proof
router.post('/submit-proof', authenticate, upload.single('receipt'), asyncHandler(async (req, res) => {
    const { transaction_id, order_id, method } = req.body;
    const receipt_url = req.file
        ? 'data:' + req.file.mimetype + ';base64,' + req.file.buffer.toString('base64')
        : null;

    const existing = await query('SELECT id FROM payments WHERE order_id = $1 AND user_id = $2', [order_id, req.user.id]);
    if (existing.rows.length > 0) {
        await query(
            'UPDATE payments SET transaction_id = $1, receipt_url = $2, method = $3, status = $4 WHERE order_id = $5 AND user_id = $6',
            [transaction_id, receipt_url, method || 'bank_transfer', receipt_url ? 'pending' : 'pending', order_id, req.user.id]
        );
    } else {
        const order = await query('SELECT total_amount FROM orders WHERE id = $1', [order_id]);
        await query(
            'INSERT INTO payments (order_id, user_id, amount, method, status, transaction_id, receipt_url, created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,NOW())',
            [order_id, req.user.id, order.rows[0]?.total_amount || 0, method || 'bank_transfer', 'pending', transaction_id, receipt_url]
        );
    }
    res.json({ success: true, message: 'Payment proof submitted successfully' });
}));

module.exports = router;
