require('dotenv').config();
const { query } = require('./config/database');
async function run() {
    await query(`
        CREATE TABLE IF NOT EXISTS bank_settings (
            id SERIAL PRIMARY KEY,
            bank_key VARCHAR(50) UNIQUE NOT NULL,
            bank_name VARCHAR(100) NOT NULL,
            account_number VARCHAR(50) NOT NULL,
            account_name VARCHAR(100) NOT NULL,
            is_active BOOLEAN DEFAULT true,
            updated_at TIMESTAMP DEFAULT NOW()
        )
    `);
    await query(`
        INSERT INTO bank_settings (bank_key, bank_name, account_number, account_name) VALUES
        ('cbe', 'Commercial Bank of Ethiopia (CBE)', '1000123456789', 'Nancy Mobile'),
        ('abyssinia', 'Bank of Abyssinia', '0012345678', 'Nancy Mobile'),
        ('awash', 'Awash Bank', '0123456789', 'Nancy Mobile')
        ON CONFLICT (bank_key) DO NOTHING
    `);
    console.log('Bank settings table created');
    process.exit(0);
}
run().catch(e => { console.error(e); process.exit(1); });
