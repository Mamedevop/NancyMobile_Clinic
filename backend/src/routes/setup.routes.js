const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

// GET /api/setup/init - visit in browser to seed DB and create admin
router.get('/init', async (req, res) => {
    try {
        await query(`INSERT INTO roles (name) VALUES ('admin'),('customer'),('technician') ON CONFLICT (name) DO NOTHING`);
        await query(`INSERT INTO categories (name, slug) VALUES ('Cases','cases'),('Screen Protectors','screen-protectors'),('Chargers','chargers'),('Audio','audio'),('Power Banks','power-banks'),('Smart Watches','smart-watches'),('Repair Services','repair-services') ON CONFLICT (slug) DO NOTHING`);
        await query(`INSERT INTO bank_settings (bank_key, bank_name, account_number, account_name, is_active) VALUES ('cbe','Commercial Bank of Ethiopia','1000123456789','Nancy Mobile PLC',true),('abyssinia','Bank of Abyssinia','0123456789','Nancy Mobile PLC',true),('awash','Awash Bank','0123456789012','Nancy Mobile PLC',true) ON CONFLICT (bank_key) DO NOTHING`);

        const hash = await bcrypt.hash('admin@123', 10);
        await query(`DELETE FROM users WHERE LOWER(email) = 'namcy@gmail.com'`);
        const adminRole = await query(`SELECT id FROM roles WHERE name = 'admin'`);
        await query(
            `INSERT INTO users (id, email, password_hash, first_name, last_name, role_id, is_active, is_verified, verification_status, created_at) VALUES ($1, $2, $3, 'Nancy', 'Admin', $4, true, true, 'verified', NOW())`,
            [uuidv4(), 'Namcy@gmail.com', hash, adminRole.rows[0].id]
        );

        const users = await query(`SELECT email FROM users`);
        res.send('<h2>Done!</h2><p>Admin: Namcy@gmail.com / admin@123</p><p>Users: ' + users.rows.map(u => u.email).join(', ') + '</p><p><a href="/">Go to App</a></p>');
    } catch (err) {
        res.status(500).send('<h2>Error: ' + err.message + '</h2>');
    }
});

// POST /api/setup/setup - programmatic setup with secret header
router.post('/setup', async (req, res) => {
    const secret = req.headers['x-setup-secret'];
    if (secret !== 'nancy-setup-2024') {
        return res.status(403).json({ success: false, message: 'Forbidden' });
    }
    try {
        await query(`INSERT INTO roles (name) VALUES ('admin'),('customer'),('technician') ON CONFLICT (name) DO NOTHING`);
        await query(`INSERT INTO categories (name, slug) VALUES ('Cases','cases'),('Screen Protectors','screen-protectors'),('Chargers','chargers'),('Audio','audio'),('Power Banks','power-banks'),('Smart Watches','smart-watches'),('Repair Services','repair-services') ON CONFLICT (slug) DO NOTHING`);
        await query(`INSERT INTO bank_settings (bank_key, bank_name, account_number, account_name, is_active) VALUES ('cbe','Commercial Bank of Ethiopia','1000123456789','Nancy Mobile PLC',true),('abyssinia','Bank of Abyssinia','0123456789','Nancy Mobile PLC',true),('awash','Awash Bank','0123456789012','Nancy Mobile PLC',true) ON CONFLICT (bank_key) DO NOTHING`);
        await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(20)`);
        await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS address TEXT`);
        await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false`);
        await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_status VARCHAR(50) DEFAULT 'unverified'`);
        await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS national_id VARCHAR(100)`);
        await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS fan_number VARCHAR(100)`);
        await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_picture VARCHAR(255)`);
        await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS national_id_file VARCHAR(255)`);
        await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW()`);

        const hash = await bcrypt.hash('admin@123', 10);
        await query(`DELETE FROM users WHERE LOWER(email) = 'namcy@gmail.com'`);
        const adminRole = await query(`SELECT id FROM roles WHERE name = 'admin'`);
        await query(
            `INSERT INTO users (id, email, password_hash, first_name, last_name, role_id, is_active, is_verified, verification_status, created_at) VALUES ($1, $2, $3, 'Nancy', 'Admin', $4, true, true, 'verified', NOW())`,
            [uuidv4(), 'Namcy@gmail.com', hash, adminRole.rows[0].id]
        );

        res.json({ success: true, message: 'Done! Admin: Namcy@gmail.com / admin@123' });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

module.exports = router;
