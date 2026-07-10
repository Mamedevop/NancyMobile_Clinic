require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const path = require('path');

// Import routes
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const productRoutes = require('./routes/product.routes');
const categoryRoutes = require('./routes/category.routes');
const orderRoutes = require('./routes/order.routes');
const cartRoutes = require('./routes/cart.routes');
const paymentRoutes = require('./routes/payment.routes');
const adminRoutes = require('./routes/admin.routes');
const repairRoutes = require('./routes/repair.routes');
const technicianRoutes = require('./routes/technician.routes');
const setupRoutes = require('./routes/setup.routes');
const chatRoutes = require('./routes/chat.routes');
const deliveryRoutes = require('./routes/delivery.routes');

// Import middleware
const { errorHandler } = require('./middlewares/error.middleware');
const { authenticate } = require('./middlewares/auth.middleware');

// Database connection
const { connectDB, query } = require('./config/database');

const initDB = async () => {
    await connectDB();

    // Run all migrations (safe - uses IF NOT EXISTS / IF NOT EXISTS)
    try {
        // Core schema tables
        await query(`CREATE TABLE IF NOT EXISTS roles (id SERIAL PRIMARY KEY, name VARCHAR(50) UNIQUE NOT NULL, permissions TEXT[] DEFAULT '{}')`);
        await query(`CREATE TABLE IF NOT EXISTS users (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), email VARCHAR(255) UNIQUE NOT NULL, password_hash VARCHAR(255) NOT NULL, first_name VARCHAR(100), last_name VARCHAR(100), phone VARCHAR(20), address TEXT, role_id INTEGER REFERENCES roles(id), is_active BOOLEAN DEFAULT true, is_verified BOOLEAN DEFAULT false, verification_status VARCHAR(50) DEFAULT 'unverified', national_id VARCHAR(100), fan_number VARCHAR(100), profile_picture VARCHAR(255), national_id_file VARCHAR(255), last_login TIMESTAMP, created_at TIMESTAMP DEFAULT NOW(), updated_at TIMESTAMP DEFAULT NOW())`);
        await query(`CREATE TABLE IF NOT EXISTS categories (id SERIAL PRIMARY KEY, name VARCHAR(100) NOT NULL, slug VARCHAR(100) UNIQUE NOT NULL, description TEXT, created_at TIMESTAMP DEFAULT NOW())`);
        await query(`CREATE TABLE IF NOT EXISTS products (id SERIAL PRIMARY KEY, name VARCHAR(255) NOT NULL, description TEXT, short_description TEXT, price DECIMAL(10,2) NOT NULL, stock_quantity INTEGER DEFAULT 0, category_id INTEGER REFERENCES categories(id), image_url VARCHAR(255), image_urls JSONB DEFAULT '[]', sku VARCHAR(100), brand VARCHAR(100), specifications JSONB DEFAULT '{}', features JSONB DEFAULT '[]', is_featured BOOLEAN DEFAULT false, is_active BOOLEAN DEFAULT true, created_at TIMESTAMP DEFAULT NOW(), updated_at TIMESTAMP DEFAULT NOW())`);
        await query(`CREATE TABLE IF NOT EXISTS cart (id SERIAL PRIMARY KEY, user_id UUID REFERENCES users(id) ON DELETE CASCADE, is_active BOOLEAN DEFAULT true, created_at TIMESTAMP DEFAULT NOW())`);
        await query(`CREATE TABLE IF NOT EXISTS cart_items (id SERIAL PRIMARY KEY, cart_id INTEGER REFERENCES cart(id) ON DELETE CASCADE, product_id INTEGER REFERENCES products(id), quantity INTEGER NOT NULL DEFAULT 1, created_at TIMESTAMP DEFAULT NOW())`);
        await query(`CREATE TABLE IF NOT EXISTS orders (id SERIAL PRIMARY KEY, order_number VARCHAR(50) UNIQUE NOT NULL, user_id UUID REFERENCES users(id), total_amount DECIMAL(10,2) NOT NULL, status VARCHAR(50) DEFAULT 'pending', shipping_address TEXT, payment_method VARCHAR(50), created_at TIMESTAMP DEFAULT NOW(), updated_at TIMESTAMP DEFAULT NOW())`);
        await query(`CREATE TABLE IF NOT EXISTS order_items (id SERIAL PRIMARY KEY, order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE, product_id INTEGER REFERENCES products(id), quantity INTEGER NOT NULL, unit_price DECIMAL(10,2) NOT NULL)`);
        await query(`CREATE TABLE IF NOT EXISTS payments (id SERIAL PRIMARY KEY, order_id INTEGER REFERENCES orders(id), user_id UUID REFERENCES users(id), amount DECIMAL(10,2) NOT NULL, method VARCHAR(50), status VARCHAR(50) DEFAULT 'pending', reference VARCHAR(100), transaction_id VARCHAR(255), receipt_url VARCHAR(255), verified_at TIMESTAMP, verified_by UUID REFERENCES users(id), created_at TIMESTAMP DEFAULT NOW(), updated_at TIMESTAMP DEFAULT NOW())`);
        await query(`CREATE TABLE IF NOT EXISTS repairs (id SERIAL PRIMARY KEY, user_id UUID REFERENCES users(id), device_type VARCHAR(100), issue_description TEXT, status VARCHAR(50) DEFAULT 'pending', estimated_cost DECIMAL(10,2), assigned_to UUID REFERENCES users(id), notes TEXT, completed_at TIMESTAMP, created_at TIMESTAMP DEFAULT NOW(), updated_at TIMESTAMP DEFAULT NOW())`);
        await query(`CREATE TABLE IF NOT EXISTS bank_settings (id SERIAL PRIMARY KEY, bank_key VARCHAR(50) UNIQUE NOT NULL, bank_name VARCHAR(100) NOT NULL, account_number VARCHAR(100) NOT NULL, account_name VARCHAR(100) NOT NULL, is_active BOOLEAN DEFAULT true, created_at TIMESTAMP DEFAULT NOW(), updated_at TIMESTAMP DEFAULT NOW())`);

        // Safe column additions (migrations)
        await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false`);
        await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_status VARCHAR(50) DEFAULT 'unverified'`);
        await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS national_id VARCHAR(100)`);
        await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS fan_number VARCHAR(100)`);
        await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_picture VARCHAR(255)`);
        await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS national_id_file VARCHAR(255)`);
        await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(20)`);
        await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS address TEXT`);
        await query(`ALTER TABLE payments ADD COLUMN IF NOT EXISTS transaction_id VARCHAR(255)`);
        await query(`ALTER TABLE payments ADD COLUMN IF NOT EXISTS receipt_url VARCHAR(255)`);
        await query(`ALTER TABLE payments ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP`);
        await query(`ALTER TABLE payments ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW()`);
        await query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50)`);
        await query(`ALTER TABLE repairs ADD COLUMN IF NOT EXISTS assigned_to UUID`);
        await query(`ALTER TABLE repairs ADD COLUMN IF NOT EXISTS notes TEXT`);
        await query(`ALTER TABLE repairs ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP`);
        // Allow large base64 images in products
        await query(`ALTER TABLE products ALTER COLUMN image_url TYPE TEXT`);
        // Allow large base64 receipts in payments
        await query(`ALTER TABLE payments ALTER COLUMN receipt_url TYPE TEXT`);
        // Allow large base64 profile pictures
        await query(`ALTER TABLE users ALTER COLUMN profile_picture TYPE TEXT`);
        await query(`ALTER TABLE users ALTER COLUMN national_id_file TYPE TEXT`);

        console.log('✅ Migrations applied');    } catch (e) {
        console.log('⚠️ Migration error:', e.message);
    }

    // Seed default data
    try {
        await query(`INSERT INTO roles (name) VALUES ('admin'),('customer'),('technician'),('delivery_person') ON CONFLICT (name) DO NOTHING`);
        await query(`CREATE TABLE IF NOT EXISTS messages (id SERIAL PRIMARY KEY, sender_id UUID REFERENCES users(id), receiver_id UUID REFERENCES users(id), content TEXT NOT NULL, is_read BOOLEAN DEFAULT false, created_at TIMESTAMP DEFAULT NOW())`);
        await query(`CREATE TABLE IF NOT EXISTS delivery_jobs (id SERIAL PRIMARY KEY, order_id INTEGER REFERENCES orders(id), assigned_to UUID REFERENCES users(id), status VARCHAR(50) DEFAULT 'pending', job_type VARCHAR(50) DEFAULT 'delivery', pickup_address TEXT, delivery_address TEXT, notes TEXT, is_cod BOOLEAN DEFAULT false, cod_amount DECIMAL(10,2), payment_collected BOOLEAN DEFAULT false, payment_amount DECIMAL(10,2), completed_at TIMESTAMP, created_at TIMESTAMP DEFAULT NOW(), updated_at TIMESTAMP DEFAULT NOW())`);
        await query(`ALTER TABLE delivery_jobs ADD COLUMN IF NOT EXISTS job_type VARCHAR(50) DEFAULT 'delivery'`);
        await query(`ALTER TABLE delivery_jobs ADD COLUMN IF NOT EXISTS is_cod BOOLEAN DEFAULT false`);
        await query(`ALTER TABLE delivery_jobs ADD COLUMN IF NOT EXISTS cod_amount DECIMAL(10,2)`);
        await query(`ALTER TABLE delivery_jobs ADD COLUMN IF NOT EXISTS payment_collected BOOLEAN DEFAULT false`);
        await query(`ALTER TABLE delivery_jobs ADD COLUMN IF NOT EXISTS payment_amount DECIMAL(10,2)`);
        await query(`CREATE TABLE IF NOT EXISTS spare_parts (id SERIAL PRIMARY KEY, name VARCHAR(200) NOT NULL, description TEXT, quantity INTEGER DEFAULT 0, unit_price DECIMAL(10,2), created_at TIMESTAMP DEFAULT NOW())`);
        await query(`CREATE TABLE IF NOT EXISTS parts_requests (id SERIAL PRIMARY KEY, technician_id UUID REFERENCES users(id), part_name VARCHAR(200) NOT NULL, quantity INTEGER DEFAULT 1, repair_id INTEGER REFERENCES repairs(id), notes TEXT, admin_notes TEXT, status VARCHAR(50) DEFAULT 'pending', created_at TIMESTAMP DEFAULT NOW(), updated_at TIMESTAMP DEFAULT NOW())`);
        await query(`ALTER TABLE parts_requests ADD COLUMN IF NOT EXISTS admin_notes TEXT`);
        await query(`ALTER TABLE parts_requests ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW()`);
        await query(`CREATE TABLE IF NOT EXISTS parts_usage (id SERIAL PRIMARY KEY, technician_id UUID REFERENCES users(id), part_id INTEGER REFERENCES spare_parts(id), repair_id INTEGER REFERENCES repairs(id), quantity INTEGER DEFAULT 1, used_at TIMESTAMP DEFAULT NOW())`);
        await query(`CREATE TABLE IF NOT EXISTS repair_reviews (id SERIAL PRIMARY KEY, repair_id INTEGER UNIQUE REFERENCES repairs(id), technician_id UUID REFERENCES users(id), customer_id UUID REFERENCES users(id), rating INTEGER CHECK(rating BETWEEN 1 AND 5), comment TEXT, created_at TIMESTAMP DEFAULT NOW())`);
        await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS is_available BOOLEAN DEFAULT false`);
        await query(`INSERT INTO categories (name, slug) VALUES ('Cases','cases'),('Screen Protectors','screen-protectors'),('Chargers','chargers'),('Audio','audio'),('Power Banks','power-banks'),('Smart Watches','smart-watches'),('Repair Services','repair-services') ON CONFLICT (slug) DO NOTHING`);
        await query(`INSERT INTO bank_settings (bank_key, bank_name, account_number, account_name, is_active) VALUES ('cbe','Commercial Bank of Ethiopia','1000123456789','Nancy Mobile PLC',true),('abyssinia','Bank of Abyssinia','0123456789','Nancy Mobile PLC',true),('awash','Awash Bank','0123456789012','Nancy Mobile PLC',true) ON CONFLICT (bank_key) DO NOTHING`);
        console.log('✅ Database seeded successfully');
    } catch (e) {
        console.log('⚠️ Seed skipped:', e.message);
    }

    // Seed admin account
    try {
        const bcrypt = require('bcryptjs');
        const { v4: uuidv4 } = require('uuid');
        const hash = await bcrypt.hash('admin@123', 10);
        const adminRole = await query(`SELECT id FROM roles WHERE name = 'admin'`);
        if (adminRole.rows.length > 0) {
            const existing = await query(`SELECT id FROM users WHERE LOWER(email) = 'namcy@gmail.com'`);
            if (existing.rows.length > 0) {
                // Update password only - don't delete (foreign key constraints)
                await query(`UPDATE users SET password_hash = $1, is_active = true, is_verified = true, verification_status = 'verified' WHERE LOWER(email) = 'namcy@gmail.com'`, [hash]);
                console.log('✅ Admin password updated: Namcy@gmail.com');
            } else {
                await query(
                    `INSERT INTO users (id, email, password_hash, first_name, last_name, role_id, is_active, is_verified, verification_status, created_at) VALUES ($1, $2, $3, 'Nancy', 'Admin', $4, true, true, 'verified', NOW())`,
                    [uuidv4(), 'Namcy@gmail.com', hash, adminRole.rows[0].id]
                );
                console.log('✅ Admin account created: Namcy@gmail.com');
            }
        }
    } catch (e) {
        console.log('⚠️ Admin seed skipped:', e.message);
    }};
initDB();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Security middleware
app.use(helmet({
    contentSecurityPolicy: false,
}));
app.use(compression());

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// CORS configuration
const corsOptions = {
    origin: process.env.FRONTEND_URL || true,
    credentials: true,
    optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Serve built frontend
const frontendDist = path.join(__dirname, '../../frontend/dist');
if (require('fs').existsSync(frontendDist)) {
    app.use(express.static(frontendDist));
}

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        service: 'Nancy Mobile API',
        version: '1.0.7'
    });
});

// One-time init endpoint - visit in browser to seed DB and create admin
app.get('/api/init', async (req, res) => {
    try {
        const bcrypt = require('bcryptjs');
        const { v4: uuidv4 } = require('uuid');
        await query(`INSERT INTO roles (name) VALUES ('admin'),('customer'),('technician'),('delivery_person') ON CONFLICT (name) DO NOTHING`);
        await query(`INSERT INTO categories (name, slug) VALUES ('Cases','cases'),('Screen Protectors','screen-protectors'),('Chargers','chargers'),('Audio','audio'),('Power Banks','power-banks'),('Smart Watches','smart-watches'),('Repair Services','repair-services') ON CONFLICT (slug) DO NOTHING`);
        await query(`INSERT INTO bank_settings (bank_key, bank_name, account_number, account_name, is_active) VALUES ('cbe','Commercial Bank of Ethiopia','1000123456789','Nancy Mobile PLC',true),('abyssinia','Bank of Abyssinia','0123456789','Nancy Mobile PLC',true),('awash','Awash Bank','0123456789012','Nancy Mobile PLC',true) ON CONFLICT (bank_key) DO NOTHING`);
        const hash = await bcrypt.hash('admin@123', 10);
        const adminRole = await query(`SELECT id FROM roles WHERE name = 'admin'`);
        // Use UPDATE instead of DELETE+INSERT to avoid FK constraint failures
        const existing = await query(`SELECT id FROM users WHERE LOWER(email) = 'namcy@gmail.com'`);
        if (existing.rows.length > 0) {
            await query(
                `UPDATE users SET password_hash=$1, is_active=true, is_verified=true, verification_status='verified', role_id=$2 WHERE LOWER(email)='namcy@gmail.com'`,
                [hash, adminRole.rows[0].id]
            );
        } else {
            await query(
                `INSERT INTO users (id, email, password_hash, first_name, last_name, role_id, is_active, is_verified, verification_status, created_at) VALUES ($1, $2, $3, 'Nancy', 'Admin', $4, true, true, 'verified', NOW())`,
                [uuidv4(), 'Namcy@gmail.com', hash, adminRole.rows[0].id]
            );
        }
        const users = await query(`SELECT email FROM users`);
        res.send('<h2>Done!</h2><p>Admin: Namcy@gmail.com / admin@123</p><p>Users: ' + users.rows.map(u => u.email).join(', ') + '</p><p><a href="/">Go to App</a></p>');
    } catch (err) {
        res.status(500).send('<h2>Error: ' + err.message + '</h2>');
    }
});

// API Documentation
app.get('/api/docs', (req, res) => {
    res.json({
        message: 'Nancy Mobile API Documentation',
        endpoints: {
            auth: '/api/auth',
            users: '/api/users',
            products: '/api/products',
            categories: '/api/categories',
            orders: '/api/orders',
            cart: '/api/cart',
            payments: '/api/payments',
            admin: '/api/admin',
            repairs: '/api/repairs'
        }
    });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', authenticate, userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/orders', authenticate, orderRoutes);
app.use('/api/cart', authenticate, cartRoutes);
app.use('/api/payments', authenticate, paymentRoutes);
app.use('/api/admin', authenticate, adminRoutes);
app.use('/api/repairs', authenticate, repairRoutes);
app.use('/api/technician', authenticate, technicianRoutes);
app.use('/api/chat', authenticate, chatRoutes);
app.use('/api/delivery', authenticate, deliveryRoutes);
app.use('/api/setup', setupRoutes);

// Error handling middleware
app.use(errorHandler);

// 404 handler - serve frontend for non-API routes (SPA)
app.use('*', (req, res) => {
    if (!req.originalUrl.startsWith('/api')) {
        const indexPath = path.join(__dirname, '../../frontend/dist/index.html');
        if (require('fs').existsSync(indexPath)) {
            return res.sendFile(indexPath);
        }
    }
    res.status(404).json({ success: false, message: 'Endpoint not found' });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📚 API: http://localhost:${PORT}/api`);
    console.log(`📊 Health: http://localhost:${PORT}/api/health`);

    // Keep DB alive — ping every 4 minutes to prevent Railway sleep
    setInterval(async () => {
        try { await query('SELECT 1'); } catch (e) { console.log('DB ping failed:', e.message); }
    }, 4 * 60 * 1000);
});