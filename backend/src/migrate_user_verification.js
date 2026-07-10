require('dotenv').config();
const { query } = require('./config/database');
async function run() {
    await query('ALTER TABLE users ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false');
    await query('ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_picture VARCHAR(255)');
    await query('ALTER TABLE users ADD COLUMN IF NOT EXISTS national_id VARCHAR(100)');
    await query('ALTER TABLE users ADD COLUMN IF NOT EXISTS fan_number VARCHAR(100)');
    await query('ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_status VARCHAR(20) DEFAULT \'unverified\'');
    // Create upload dir for profile pics and national IDs
    console.log('User verification columns added');
    process.exit(0);
}
run().catch(e => { console.error(e); process.exit(1); });
