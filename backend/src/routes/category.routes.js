const express = require('express');
const router = express.Router();
const asyncHandler = require('express-async-handler');
const { query } = require('../config/database');
const { authenticate, authorize } = require('../middlewares/auth.middleware');

const isAdmin = authorize('admin');

// GET /api/categories — public, used by product pages and checkout
router.get('/', asyncHandler(async (req, res) => {
    const result = await query('SELECT * FROM categories ORDER BY name');
    res.json({ success: true, categories: result.rows });
}));

// POST /api/categories — admin only
router.post('/', authenticate, isAdmin, asyncHandler(async (req, res) => {
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'name is required' });
    const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const result = await query(
        'INSERT INTO categories (name, slug, description, created_at) VALUES ($1,$2,$3,NOW()) RETURNING *',
        [name, slug, description || null]
    );
    res.status(201).json({ success: true, category: result.rows[0] });
}));

// PUT /api/categories/:id — admin only
router.put('/:id', authenticate, isAdmin, asyncHandler(async (req, res) => {
    const { name, description } = req.body;
    const updates = {};
    if (name !== undefined) {
        updates.name = name;
        updates.slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    }
    if (description !== undefined) updates.description = description;
    if (Object.keys(updates).length === 0) return res.json({ success: true });
    const keys = Object.keys(updates);
    const setParts = keys.map((k, i) => `${k} = $${i + 1}`);
    const values = [...Object.values(updates), req.params.id];
    const result = await query(
        `UPDATE categories SET ${setParts.join(', ')} WHERE id = $${values.length} RETURNING *`,
        values
    );
    if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Category not found' });
    res.json({ success: true, category: result.rows[0] });
}));

// DELETE /api/categories/:id — admin only
router.delete('/:id', authenticate, isAdmin, asyncHandler(async (req, res) => {
    const result = await query('DELETE FROM categories WHERE id = $1 RETURNING id', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Category not found' });
    res.json({ success: true, message: 'Category deleted' });
}));

module.exports = router;
