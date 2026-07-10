require('dotenv').config();
const { query } = require('./config/database');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

async function run() {
    await query("INSERT INTO roles (name) VALUES ('technician') ON CONFLICT (name) DO NOTHING");
    const hash = await bcrypt.hash('tech123', 10);
    const role = await query("SELECT id FROM roles WHERE name='technician'");
    await query(
        'INSERT INTO users (id, email, password_hash, first_name, last_name, role_id, is_active, created_at) VALUES ($1,$2,$3,$4,$5,$6,true,NOW()) ON CONFLICT (email) DO NOTHING',
        [uuidv4(), 'tech@nancymobile.com', hash, 'Tech', 'User', role.rows[0].id]
    );
    // Add assigned_to column to repairs if not exists
    await query("ALTER TABLE repairs ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES users(id)");
    await query("ALTER TABLE repairs ADD COLUMN IF NOT EXISTS notes TEXT");
    await query("ALTER TABLE repairs ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP");
    console.log('Done: tech@nancymobile.com / tech123');
    process.exit(0);
}
run().catch(e => { console.error(e); process.exit(1); });
