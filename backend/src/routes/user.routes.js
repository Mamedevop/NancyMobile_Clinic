const express = require('express');
const router = express.Router();
const asyncHandler = require('express-async-handler');
const { query } = require('../config/database');
const { authenticate } = require('../middlewares/auth.middleware');
const bcrypt = require('bcryptjs');
const multer = require('multer');

// Memory storage - store as base64 in DB (survives Railway redeploys)
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

function toBase64(file) {
    if (!file) return null;
    return 'data:' + file.mimetype + ';base64,' + file.buffer.toString('base64');
}

router.get('/profile', authenticate, asyncHandler(async (req, res) => {
    const result = await query(
        'SELECT u.*, r.name as role FROM users u JOIN roles r ON u.role_id = r.id WHERE u.id = $1',
        [req.user.id]
    );
    const user = result.rows[0];
    delete user.password_hash;
    res.json({ success: true, user });
}));

router.put('/profile', authenticate, upload.fields([
    { name: 'profile_picture', maxCount: 1 },
    { name: 'national_id_file', maxCount: 1 }
]), asyncHandler(async (req, res) => {
    const { first_name, last_name, email, phone, address, national_id, fan_number } = req.body;

    const updates = {};
    if (first_name) updates.first_name = first_name;
    if (last_name) updates.last_name = last_name;
    if (email) updates.email = email;
    if (phone) updates.phone = phone;
    if (address) updates.address = address;
    if (national_id) updates.national_id = national_id;
    if (fan_number) updates.fan_number = fan_number;
    if (req.files && req.files.profile_picture) {
        updates.profile_picture = toBase64(req.files.profile_picture[0]);
    }
    if (req.files && req.files.national_id_file) {
        updates.national_id_file = toBase64(req.files.national_id_file[0]);
    }

    const currentUser = await query('SELECT * FROM users WHERE id = $1', [req.user.id]);
    const merged = Object.assign({}, currentUser.rows[0], updates);
    const isComplete = merged.first_name && merged.last_name && merged.phone &&
        merged.profile_picture && (merged.national_id || merged.fan_number);

    if (isComplete && merged.verification_status === 'unverified') {
        updates.verification_status = 'pending';
    }

    const keys = Object.keys(updates);
    if (keys.length === 0) return res.json({ success: true, message: 'Nothing to update' });

    const setParts = keys.map((k, i) => k + ' = $' + (i + 1));
    const values = Object.values(updates).concat([req.user.id]);
    const sql = 'UPDATE users SET ' + setParts.join(', ') + ', updated_at = NOW() WHERE id = $' + values.length + ' RETURNING *';

    const result = await query(sql, values);
    const user = result.rows[0];
    delete user.password_hash;
    res.json({ success: true, user });
}));

router.put('/change-password', authenticate, asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const result = await query('SELECT password_hash FROM users WHERE id = $1', [req.user.id]);
    const valid = await bcrypt.compare(currentPassword, result.rows[0].password_hash);
    if (!valid) return res.status(400).json({ success: false, message: 'Current password is incorrect' });
    const hash = await bcrypt.hash(newPassword, 10);
    await query('UPDATE users SET password_hash = $1 WHERE id = $2', [hash, req.user.id]);
    res.json({ success: true, message: 'Password changed successfully' });
}));

module.exports = router;

