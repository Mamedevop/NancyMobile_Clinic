-- Insert admin user (password: admin123)
INSERT INTO users (id, email, password_hash, first_name, last_name, phone, role_id, is_active, created_at)
VALUES (
  gen_random_uuid(),
  'admin@nancymobile.com',
  '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
  'Admin', 'User', '+1555123456',
  (SELECT id FROM roles WHERE name='admin'),
  true, NOW()
) ON CONFLICT (email) DO NOTHING;
