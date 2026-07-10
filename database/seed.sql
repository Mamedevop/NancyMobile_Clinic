-- Seed roles
INSERT INTO roles (name) VALUES ('admin'), ('manager'), ('customer'), ('technician')
ON CONFLICT (name) DO NOTHING;

-- Seed categories
INSERT INTO categories (name, slug) VALUES
  ('Cases', 'cases'),
  ('Screen Protectors', 'screen-protectors'),
  ('Chargers', 'chargers'),
  ('Audio', 'audio'),
  ('Power Banks', 'power-banks'),
  ('Smart Watches', 'smart-watches'),
  ('Repair Services', 'repair-services')
ON CONFLICT (slug) DO NOTHING;

-- Seed products
INSERT INTO products (name, description, price, stock_quantity, category_id, image_url, is_active) VALUES
  ('iPhone 14 Pro Case', 'Premium protective case for iPhone 14 Pro with shock absorption', 29.99, 45, (SELECT id FROM categories WHERE slug='cases'), 'mobile', true),
  ('Samsung Galaxy S23 Ultra Screen Protector', 'Tempered glass screen protector with high clarity and touch sensitivity', 19.99, 78, (SELECT id FROM categories WHERE slug='screen-protectors'), 'shield-alt', true),
  ('Fast Wireless Charger', '15W fast wireless charger with cooling technology', 39.99, 32, (SELECT id FROM categories WHERE slug='chargers'), 'bolt', true),
  ('Noise Cancelling Earbuds', 'Wireless earbuds with active noise cancellation and 30-hour battery', 89.99, 56, (SELECT id FROM categories WHERE slug='audio'), 'headphones', true),
  ('Power Bank 20000mAh', 'High capacity power bank with PD fast charging', 49.99, 12, (SELECT id FROM categories WHERE slug='power-banks'), 'battery-full', true),
  ('Apple Watch Series 8', 'Advanced smartwatch with health monitoring features', 399.99, 8, (SELECT id FROM categories WHERE slug='smart-watches'), 'smartwatch', true),
  ('Screen Repair Service', 'Professional screen replacement service for all smartphone models', 99.99, 999, (SELECT id FROM categories WHERE slug='repair-services'), 'tools', true),
  ('Water Damage Repair', 'Expert water damage assessment and repair service', 79.99, 999, (SELECT id FROM categories WHERE slug='repair-services'), 'tint', true)
ON CONFLICT DO NOTHING;

-- Seed bank settings
INSERT INTO bank_settings (bank_key, bank_name, account_number, account_name, is_active) VALUES
  ('cbe', 'Commercial Bank of Ethiopia', '1000123456789', 'Nancy Mobile PLC', true),
  ('abyssinia', 'Bank of Abyssinia', '0123456789', 'Nancy Mobile PLC', true),
  ('awash', 'Awash Bank', '0123456789012', 'Nancy Mobile PLC', true)
ON CONFLICT (bank_key) DO NOTHING;
