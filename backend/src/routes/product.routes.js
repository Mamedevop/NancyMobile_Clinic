const express = require('express');
const router = express.Router();
const asyncHandler = require('express-async-handler');
const { query } = require('../config/database');
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const multer = require('multer');

// Use memory storage - convert to base64 and store in DB (survives Railway redeploys)
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

function getImageUrl(file, fallback) {
    if (file) return 'data:' + file.mimetype + ';base64,' + file.buffer.toString('base64');
    return fallback || null;
}

router.get('/', asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, category, search, minPrice, maxPrice, sortBy = 'created_at', sortOrder = 'DESC' } = req.query;
    const conditions = ['p.is_active = true'];
    const params = [];
    if (category) { params.push(category); conditions.push('c.slug = $' + params.length); }
    if (search) { params.push('%' + search + '%'); conditions.push('(p.name ILIKE $' + params.length + ' OR p.description ILIKE $' + params.length + ')'); }
    if (minPrice) { params.push(minPrice); conditions.push('p.price >= $' + params.length); }
    if (maxPrice) { params.push(maxPrice); conditions.push('p.price <= $' + params.length); }
    const where = 'WHERE ' + conditions.join(' AND ');
    const base = 'SELECT p.*, c.name as category_name FROM products p LEFT JOIN categories c ON p.category_id = c.id ' + where;
    const total = parseInt((await query('SELECT COUNT(*) FROM (' + base + ') as t', params)).rows[0].count);
    const sortCol = ['name','price','created_at'].includes(sortBy) ? sortBy : 'created_at';
    const sortDir = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    params.push(parseInt(limit)); params.push((parseInt(page)-1)*parseInt(limit));
    const result = await query(base + ' ORDER BY p.' + sortCol + ' ' + sortDir + ' LIMIT $' + (params.length-1) + ' OFFSET $' + params.length, params);
    res.json({ success: true, products: result.rows, pagination: { page: parseInt(page), limit: parseInt(limit), total, totalPages: Math.ceil(total/parseInt(limit)) } });
}));

router.get('/featured/products', asyncHandler(async (req, res) => {
    const result = await query('SELECT id, name, price, image_url, stock_quantity, short_description FROM products WHERE is_featured = true AND is_active = true ORDER BY created_at DESC LIMIT 8');
    res.json({ success: true, products: result.rows });
}));

router.get('/category/:slug', asyncHandler(async (req, res) => {
    const { slug } = req.params; const { page = 1, limit = 12 } = req.query;
    const result = await query('SELECT p.*, c.name as category_name FROM products p JOIN categories c ON p.category_id = c.id WHERE c.slug = $1 AND p.is_active = true ORDER BY p.created_at DESC LIMIT $2 OFFSET $3', [slug, parseInt(limit), (parseInt(page)-1)*parseInt(limit)]);
    const cnt = await query('SELECT COUNT(*) FROM products p JOIN categories c ON p.category_id = c.id WHERE c.slug = $1 AND p.is_active = true', [slug]);
    res.json({ success: true, products: result.rows, total: parseInt(cnt.rows[0].count) });
}));

router.get('/:id', asyncHandler(async (req, res) => {
    const result = await query('SELECT p.*, c.name as category_name, c.slug as category_slug FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE p.id = $1 AND p.is_active = true', [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ success: false, message: 'Product not found' });
    const related = await query('SELECT id, name, price, image_url, stock_quantity FROM products WHERE category_id = $1 AND id != $2 AND is_active = true LIMIT 4', [result.rows[0].category_id, req.params.id]);
    res.json({ success: true, product: result.rows[0], relatedProducts: related.rows });
}));

router.post('/', authenticate, authorize('admin'), upload.single('product_image'), asyncHandler(async (req, res) => {
    const { name, description, short_description, price, stock_quantity, category_id, sku, brand, is_featured, image_url } = req.body;
    const imgUrl = getImageUrl(req.file, image_url);
    const result = await query(
        'INSERT INTO products (name, description, short_description, price, stock_quantity, category_id, sku, brand, is_featured, image_url, created_at, updated_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,NOW(),NOW()) RETURNING *',
        [name, description, short_description, parseFloat(price), parseInt(stock_quantity)||0, category_id||null, sku, brand, is_featured==='true'||is_featured===true, imgUrl]
    );
    res.status(201).json({ success: true, message: 'Product created', product: result.rows[0] });
}));

router.put('/:id', authenticate, authorize('admin'), upload.single('product_image'), asyncHandler(async (req, res) => {
    const allowed = ['name','description','short_description','price','stock_quantity','category_id','sku','brand','is_featured','is_active','image_url'];
    const updates = {};
    for (const key of allowed) { if (req.body[key] !== undefined) updates[key] = req.body[key]; }
    if (req.file) updates.image_url = getImageUrl(req.file, null);
    if (!Object.keys(updates).length) return res.status(400).json({ success: false, message: 'No updates' });
    const keys = Object.keys(updates);
    const setParts = keys.map((k, i) => k + ' = $' + (i+1));
    const values = Object.values(updates).concat([req.params.id]);
    const result = await query('UPDATE products SET ' + setParts.join(', ') + ', updated_at = NOW() WHERE id = $' + values.length + ' RETURNING *', values);
    if (!result.rows.length) return res.status(404).json({ success: false, message: 'Product not found' });
    res.json({ success: true, message: 'Product updated', product: result.rows[0] });
}));

router.delete('/:id', authenticate, authorize('admin'), asyncHandler(async (req, res) => {
    const result = await query('DELETE FROM products WHERE id = $1 RETURNING id', [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ success: false, message: 'Product not found' });
    res.json({ success: true, message: 'Product deleted' });
}));

module.exports = router;
