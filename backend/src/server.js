require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');

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

// ─── Initialize Express FIRST so Railway healthcheck passes immediately ──────
const app = express();
const PORT = process.env.PORT || 5000;

// Security middleware
app.use(helmet({ contentSecurityPolicy: false }));
app.use(compression());

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 500,
    standardHeaders: true,
    legacyHeaders: false,
    message: 'Too many requests, please try again later.'
});
app.use('/api/', limiter);

// CORS
app.use(cors({
    origin: process.env.FRONTEND_URL || true,
    credentials: true,
    optionsSuccessStatus: 200
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static uploads folder
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Serve built React frontend
const possibleDistPaths = [
    path.join(__dirname, '../../frontend/dist'),
    path.join(process.cwd(), 'frontend/dist'),
    path.join(process.cwd(), 'dist'),
];
let frontendDist = null;
for (const p of possibleDistPaths) {
    if (fs.existsSync(p)) { frontendDist = p; break; }
}
if (frontendDist) {
    console.log('✅ Serving frontend from:', frontendDist);
    app.use(express.static(frontendDist));
} else {
    console.log('⚠️  Frontend dist not found — API-only mode');
}

// ─── Health check — always responds immediately (Railway needs this) ─────────
app.get('/api/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        service: 'Nancy Mobile API',
        version: '1.0.7',
        db: global.dbReady ? 'connected' : 'initializing'
    });
});

// ─── API Routes ───────────────────────────────────────────────────────────────
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

// One-time init endpoint
app.get('/api/init', async (req, res) => {
    try {
        const bcrypt = require('bcryptjs');
        const { v4: uuidv4 } = require('uuid');
        await query(`INSERT INTO roles (name) VALUES ('admin'),('customer'),('technician'),('delivery_person') ON CONFLICT (name) DO NOTHING`);
        await query(`INSERT INTO categories (name, slug) VALUES ('Cases','cases'),('Screen Protectors','screen-protectors'),('Chargers','chargers'),('Audio','audio'),('Power Banks','power-banks'),('Smart Watches','smart-watches'),('Repair Services','repair-services') ON CONFLICT (slug) DO NOTHING`);
        await query(`INSERT INTO bank_settings (bank_key, bank_name, account_number, account_name, is_active) VALUES ('cbe','Commercial Bank of Ethiopia','1000123456789','Nancy Mobile PLC',true),('abyssinia','Bank of Abyssinia','0123456789','Nancy Mobile PLC',true),('awash','Awash Bank','0123456789012','Nancy Mobile PLC',true) ON CONFLICT (bank_key) DO NOTHING`);
        const hash = await bcrypt.hash('admin@123', 10);
        const adminRole = await query(`SELECT id FROM roles WHERE name = 'admin'`);
        const existing = await query(`SELECT id FROM users WHERE LOWER(email) = 'namcy@gmail.com'`);
        if (existing.rows.length > 0) {
            await query(`UPDATE users SET password_hash=$1, is_active=true, is_verified=true, verification_status='verified', role_id=$2 WHERE LOWER(email)='namcy@gmail.com'`, [hash, adminRole.rows[0].id]);
        } else {
            await query(`INSERT INTO users (id, email, password_hash, first_name, last_name, role_id, is_active, is_verified, verification_status, created_at) VALUES ($1,$2,$3,'Nancy','Admin',$4,true,true,'verified',NOW())`, [uuidv4(), 'Namcy@gmail.com', hash, adminRole.rows[0].id]);
        }
        const users = await query(`SELECT email FROM users`);
        res.send('<h2>Done!</h2><p>Admin: Namcy@gmail.com / admin@123</p><p>Users: ' + users.rows.map(u => u.email).join(', ') + '</p><p><a href="/">Go to App</a></p>');
    } catch (err) {
        res.status(500).send('<h2>Error: ' + err.message + '</h2>');
    }
});

// API docs
app.get('/api/docs', (req, res) => {
    res.json({ message: 'Nancy Mobile API', version: '1.0.7', health: '/api/health' });
});

// Error handler
app.use(errorHandler);

// SPA fallback — must be last
app.use('*', (req, res) => {
    if (!req.originalUrl.startsWith('/api') && frontendDist) {
        const indexPath = path.join(frontendDist, 'index.html');
        if (fs.existsSync(indexPath)) return res.sendFile(indexPath);
    }
    res.status(404).json({ success: false, message: 'Not found' });
});

// ─── START SERVER FIRST, then init DB in background ──────────────────────────
global.dbReady = false;

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server listening on 0.0.0.0:${PORT}`);
    console.log(`📊 Health: http://localhost:${PORT}/api/health`);

    // Init DB after server is already accepting connections
    initDB().catch(err => {
        console.error('❌ DB init failed:', err.message);
    });
});

// ─── Database init (runs after server starts) ─────────────────────────────────
async function initDB() {
    console.log('🔄 Connecting to database...');
    await connectDB();
    console.log('✅ DB connected, running migrations...');

    try {
        await query(`CREATE TABLE IF NOT EXISTS roles (id SERIAL PRIMARY KEY, name VARCHAR(50) UNIQUE NOT NULL, permissions TEXT[] DEFAULT '{}')`);
        await query(`CREATE TABLE IF NOT EXISTS users (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), email VARCHAR(255) UNIQUE NOT NULL, password_hash VARCHAR(255) NOT NULL, first_name VARCHAR(100), last_name VARCHAR(100), phone VARCHAR(20), address TEXT, role_id INTEGER REFERENCES roles(id), is_active BOOLEAN DEFAULT true, is_verified BOOLEAN DEFAULT false, verification_status VARCHAR(50) DEFAULT 'unverified', national_id VARCHAR(100), fan_number VARCHAR(100), profile_picture TEXT, national_id_file TEXT, is_available BOOLEAN DEFAULT false, last_login TIMESTAMP, created_at TIMESTAMP DEFAULT NOW(), updated_at TIMESTAMP DEFAULT NOW())`);
        await query(`CREATE TABLE IF NOT EXISTS categories (id SERIAL PRIMARY KEY, name VARCHAR(100) NOT NULL, slug VARCHAR(100) UNIQUE NOT NULL, description TEXT, created_at TIMESTAMP DEFAULT NOW())`);
        await query(`CREATE TABLE IF NOT EXISTS products (id SERIAL PRIMARY KEY, name VARCHAR(255) NOT NULL, description TEXT, short_description TEXT, price DECIMAL(10,2) NOT NULL, stock_quantity INTEGER DEFAULT 0, category_id INTEGER REFERENCES categories(id), image_url TEXT, image_urls JSONB DEFAULT '[]', sku VARCHAR(100), brand VARCHAR(100), specifications JSONB DEFAULT '{}', features JSONB DEFAULT '[]', is_featured BOOLEAN DEFAULT false, is_active BOOLEAN DEFAULT true, created_at TIMESTAMP DEFAULT NOW(), updated_at TIMESTAMP DEFAULT NOW())`);
        await query(`CREATE TABLE IF NOT EXISTS cart (id SERIAL PRIMARY KEY, user_id UUID REFERENCES users(id) ON DELETE CASCADE, is_active BOOLEAN DEFAULT true, created_at TIMESTAMP DEFAULT NOW())`);
        await query(`CREATE TABLE IF NOT EXISTS cart_items (id SERIAL PRIMARY KEY, cart_id INTEGER REFERENCES cart(id) ON DELETE CASCADE, product_id INTEGER REFERENCES products(id), quantity INTEGER NOT NULL DEFAULT 1, created_at TIMESTAMP DEFAULT NOW())`);
        await query(`CREATE TABLE IF NOT EXISTS orders (id SERIAL PRIMARY KEY, order_number VARCHAR(50) UNIQUE NOT NULL, user_id UUID REFERENCES users(id), total_amount DECIMAL(10,2) NOT NULL, status VARCHAR(50) DEFAULT 'pending', shipping_address TEXT, payment_method VARCHAR(50), created_at TIMESTAMP DEFAULT NOW(), updated_at TIMESTAMP DEFAULT NOW())`);
        await query(`CREATE TABLE IF NOT EXISTS order_items (id SERIAL PRIMARY KEY, order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE, product_id INTEGER REFERENCES products(id), quantity INTEGER NOT NULL, unit_price DECIMAL(10,2) NOT NULL)`);
        await query(`CREATE TABLE IF NOT EXISTS payments (id SERIAL PRIMARY KEY, order_id INTEGER REFERENCES orders(id), user_id UUID REFERENCES users(id), amount DECIMAL(10,2) NOT NULL, method VARCHAR(50), status VARCHAR(50) DEFAULT 'pending', reference VARCHAR(100), transaction_id VARCHAR(255), receipt_url TEXT, verified_at TIMESTAMP, verified_by UUID REFERENCES users(id), created_at TIMESTAMP DEFAULT NOW(), updated_at TIMESTAMP DEFAULT NOW())`);
        await query(`CREATE TABLE IF NOT EXISTS repairs (id SERIAL PRIMARY KEY, user_id UUID REFERENCES users(id), device_type VARCHAR(100), issue_description TEXT, status VARCHAR(50) DEFAULT 'pending', estimated_cost DECIMAL(10,2), assigned_to UUID REFERENCES users(id), notes TEXT, completed_at TIMESTAMP, created_at TIMESTAMP DEFAULT NOW(), updated_at TIMESTAMP DEFAULT NOW())`);
        await query(`CREATE TABLE IF NOT EXISTS bank_settings (id SERIAL PRIMARY KEY, bank_key VARCHAR(50) UNIQUE NOT NULL, bank_name VARCHAR(100) NOT NULL, account_number VARCHAR(100) NOT NULL, account_name VARCHAR(100) NOT NULL, is_active BOOLEAN DEFAULT true, created_at TIMESTAMP DEFAULT NOW(), updated_at TIMESTAMP DEFAULT NOW())`);
        await query(`CREATE TABLE IF NOT EXISTS messages (id SERIAL PRIMARY KEY, sender_id UUID REFERENCES users(id), receiver_id UUID REFERENCES users(id), content TEXT NOT NULL, is_read BOOLEAN DEFAULT false, created_at TIMESTAMP DEFAULT NOW())`);
        await query(`CREATE TABLE IF NOT EXISTS delivery_jobs (id SERIAL PRIMARY KEY, order_id INTEGER REFERENCES orders(id), assigned_to UUID REFERENCES users(id), status VARCHAR(50) DEFAULT 'pending', job_type VARCHAR(50) DEFAULT 'delivery', pickup_address TEXT, delivery_address TEXT, notes TEXT, is_cod BOOLEAN DEFAULT false, cod_amount DECIMAL(10,2), payment_collected BOOLEAN DEFAULT false, payment_amount DECIMAL(10,2), completed_at TIMESTAMP, created_at TIMESTAMP DEFAULT NOW(), updated_at TIMESTAMP DEFAULT NOW())`);
        await query(`CREATE TABLE IF NOT EXISTS spare_parts (id SERIAL PRIMARY KEY, name VARCHAR(200) NOT NULL, description TEXT, quantity INTEGER DEFAULT 0, unit_price DECIMAL(10,2), created_at TIMESTAMP DEFAULT NOW())`);
        await query(`CREATE TABLE IF NOT EXISTS parts_requests (id SERIAL PRIMARY KEY, technician_id UUID REFERENCES users(id), part_name VARCHAR(200) NOT NULL, quantity INTEGER DEFAULT 1, repair_id INTEGER REFERENCES repairs(id), notes TEXT, admin_notes TEXT, status VARCHAR(50) DEFAULT 'pending', created_at TIMESTAMP DEFAULT NOW(), updated_at TIMESTAMP DEFAULT NOW())`);
        await query(`CREATE TABLE IF NOT EXISTS parts_usage (id SERIAL PRIMARY KEY, technician_id UUID REFERENCES users(id), part_id INTEGER REFERENCES spare_parts(id), repair_id INTEGER REFERENCES repairs(id), quantity INTEGER DEFAULT 1, used_at TIMESTAMP DEFAULT NOW())`);
        await query(`CREATE TABLE IF NOT EXISTS repair_reviews (id SERIAL PRIMARY KEY, repair_id INTEGER UNIQUE REFERENCES repairs(id), technician_id UUID REFERENCES users(id), customer_id UUID REFERENCES users(id), rating INTEGER CHECK(rating BETWEEN 1 AND 5), comment TEXT, created_at TIMESTAMP DEFAULT NOW())`);

        // Safe migrations
        const safeMigrations = [
            `ALTER TABLE users ADD COLUMN IF NOT EXISTS is_available BOOLEAN DEFAULT false`,
            `ALTER TABLE users ADD COLUMN IF NOT EXISTS national_id_file TEXT`,
            `ALTER TABLE payments ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW()`,
            `ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50)`,
            `ALTER TABLE repairs ADD COLUMN IF NOT EXISTS assigned_to UUID`,
            `ALTER TABLE repairs ADD COLUMN IF NOT EXISTS notes TEXT`,
            `ALTER TABLE repairs ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP`,
        ];
        for (const sql of safeMigrations) {
            try { await query(sql); } catch (_) {}
        }
        console.log('✅ Migrations complete');
    } catch (e) {
        console.log('⚠️ Migration error:', e.message);
    }

    // Seed data
    try {
        await query(`INSERT INTO roles (name) VALUES ('admin'),('customer'),('technician'),('delivery_person') ON CONFLICT (name) DO NOTHING`);
        await query(`INSERT INTO categories (name, slug) VALUES ('Cases','cases'),('Screen Protectors','screen-protectors'),('Chargers','chargers'),('Audio','audio'),('Power Banks','power-banks'),('Smart Watches','smart-watches'),('Repair Services','repair-services') ON CONFLICT (slug) DO NOTHING`);
        await query(`INSERT INTO bank_settings (bank_key, bank_name, account_number, account_name, is_active) VALUES ('cbe','Commercial Bank of Ethiopia','1000123456789','Nancy Mobile PLC',true),('abyssinia','Bank of Abyssinia','0123456789','Nancy Mobile PLC',true),('awash','Awash Bank','0123456789012','Nancy Mobile PLC',true) ON CONFLICT (bank_key) DO NOTHING`);
        console.log('✅ Seed data applied');
    } catch (e) {
        console.log('⚠️ Seed skipped:', e.message);
    }

    // Admin account
    try {
        const bcrypt = require('bcryptjs');
        const { v4: uuidv4 } = require('uuid');
        const hash = await bcrypt.hash('admin@123', 10);
        const adminRole = await query(`SELECT id FROM roles WHERE name = 'admin'`);
        if (adminRole.rows.length > 0) {
            const existing = await query(`SELECT id FROM users WHERE LOWER(email) = 'namcy@gmail.com'`);
            if (existing.rows.length > 0) {
                await query(`UPDATE users SET password_hash=$1, is_active=true, is_verified=true, verification_status='verified' WHERE LOWER(email)='namcy@gmail.com'`, [hash]);
                console.log('✅ Admin updated: Namcy@gmail.com / admin@123');
            } else {
                await query(`INSERT INTO users (id,email,password_hash,first_name,last_name,role_id,is_active,is_verified,verification_status,created_at) VALUES ($1,$2,$3,'Nancy','Admin',$4,true,true,'verified',NOW())`, [uuidv4(), 'Namcy@gmail.com', hash, adminRole.rows[0].id]);
                console.log('✅ Admin created: Namcy@gmail.com / admin@123');
            }
        }
    } catch (e) {
        console.log('⚠️ Admin seed skipped:', e.message);
    }

    global.dbReady = true;
    console.log('✅ Database fully initialized');

    // Keep DB alive — ping every 4 minutes
    setInterval(async () => {
        try { await query('SELECT 1'); } catch (e) { console.log('DB ping failed:', e.message); }
    }, 4 * 60 * 1000);
}
