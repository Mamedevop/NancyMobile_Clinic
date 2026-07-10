require('dotenv').config();
const bcrypt = require('bcryptjs');
const { query } = require('./config/database');

async function fix() {
    const hash = await bcrypt.hash('admin123', 10);
    await query(`UPDATE users SET password_hash = $1 WHERE email = 'admin@nancymobile.com'`, [hash]);
    console.log('Admin password updated successfully');

    // Also create a test customer if none exists
    const existing = await query(`SELECT id FROM users WHERE email = 'customer@test.com'`);
    if (existing.rows.length === 0) {
        const customerHash = await bcrypt.hash('customer123', 10);
        const roleResult = await query(`SELECT id FROM roles WHERE name = 'customer'`);
        const { v4: uuidv4 } = require('uuid');
        await query(
            `INSERT INTO users (id, email, password_hash, first_name, last_name, role_id, is_active, created_at)
             VALUES ($1, $2, $3, $4, $5, $6, true, NOW())`,
            [uuidv4(), 'customer@test.com', customerHash, 'Test', 'Customer', roleResult.rows[0].id]
        );
        console.log('Test customer created: customer@test.com / customer123');
    }

    process.exit(0);
}

fix().catch(e => { console.error(e); process.exit(1); });
