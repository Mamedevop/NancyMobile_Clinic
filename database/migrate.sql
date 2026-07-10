-- Add missing columns to existing tables (safe to run multiple times)
ALTER TABLE roles ADD COLUMN IF NOT EXISTS permissions TEXT[] DEFAULT '{}';

ALTER TABLE users ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_status VARCHAR(50) DEFAULT 'unverified';
ALTER TABLE users ADD COLUMN IF NOT EXISTS national_id VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS fan_number VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_picture VARCHAR(255);

ALTER TABLE products ADD COLUMN IF NOT EXISTS short_description TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS image_urls JSONB DEFAULT '[]';
ALTER TABLE products ADD COLUMN IF NOT EXISTS sku VARCHAR(100);
ALTER TABLE products ADD COLUMN IF NOT EXISTS brand VARCHAR(100);
ALTER TABLE products ADD COLUMN IF NOT EXISTS specifications JSONB DEFAULT '{}';
ALTER TABLE products ADD COLUMN IF NOT EXISTS features JSONB DEFAULT '[]';
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;

ALTER TABLE cart ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

ALTER TABLE payments ADD COLUMN IF NOT EXISTS transaction_id VARCHAR(255);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS receipt_url VARCHAR(255);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS verified_by UUID;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

ALTER TABLE repairs ADD COLUMN IF NOT EXISTS assigned_to UUID;
ALTER TABLE repairs ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE repairs ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP;

ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50);

-- Create bank_settings if not exists
CREATE TABLE IF NOT EXISTS bank_settings (
    id SERIAL PRIMARY KEY,
    bank_key VARCHAR(50) UNIQUE NOT NULL,
    bank_name VARCHAR(100) NOT NULL,
    account_number VARCHAR(100) NOT NULL,
    account_name VARCHAR(100) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Seed roles (technician was missing)
INSERT INTO roles (name) VALUES ('admin'), ('manager'), ('customer'), ('technician')
ON CONFLICT (name) DO NOTHING;

-- Seed bank settings
INSERT INTO bank_settings (bank_key, bank_name, account_number, account_name, is_active) VALUES
  ('cbe', 'Commercial Bank of Ethiopia', '1000123456789', 'Nancy Mobile PLC', true),
  ('abyssinia', 'Bank of Abyssinia', '0123456789', 'Nancy Mobile PLC', true),
  ('awash', 'Awash Bank', '0123456789012', 'Nancy Mobile PLC', true)
ON CONFLICT (bank_key) DO NOTHING;
