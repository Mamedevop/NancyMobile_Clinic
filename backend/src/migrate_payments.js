require('dotenv').config();
const { query } = require('./config/database');
async function run() {
    await query('ALTER TABLE payments ADD COLUMN IF NOT EXISTS transaction_id VARCHAR(100)');
    await query('ALTER TABLE payments ADD COLUMN IF NOT EXISTS receipt_url VARCHAR(255)');
    await query('ALTER TABLE payments ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP');
    await query('ALTER TABLE payments ADD COLUMN IF NOT EXISTS verified_by UUID REFERENCES users(id)');
    await query('ALTER TABLE payments ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP');
    console.log('Payment columns added');
    process.exit(0);
}
run().catch(e => { console.error(e); process.exit(1); });
