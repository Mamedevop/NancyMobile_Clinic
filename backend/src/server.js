require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 5000;

// ─── MIDDLEWARE ───────────────────────────────────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false }));
app.use(compression());
app.use(cors({ origin: process.env.FRONTEND_URL || true, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/api/', rateLimit({ windowMs: 15 * 60 * 1000, max: 500 }));

// ─── SERVE BUILT REACT FRONTEND ───────────────────────────────────────────────
const distCandidates = [
    path.join(__dirname, '../../frontend/dist'),
    path.join(process.cwd(), 'frontend/dist'),
    path.join(process.cwd(), 'dist'),
];
const frontendDist = distCandidates.find(p => fs.existsSync(p)) || null;
if (frontendDist) {
    console.log('✅ Serving frontend from:', frontendDist);
    app.use(express.static(frontendDist));
} else {
    console.log('⚠️  No frontend/dist — API-only mode');
}

// ─── DB STATE ─────────────────────────────────────────────────────────────────
global.dbReady = false;
global.dbError = null;

// ─── HEALTH CHECK — always responds ───────────────────────────────────────────
app.get('/api/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        service: 'NancyMobile API',
        version: '1.0.9',
        timestamp: new Date().toISOString(),
        db: global.dbReady ? 'connected' : (global.dbError ? 'error' : 'connecting'),
        env: {
            has_database_url: !!process.env.DATABASE_URL,
            has_jwt_secret: !!process.env.JWT_SECRET,
            node_env: process.env.NODE_ENV,
        }
    });
});

// ─── DEBUG — shows exact state ────────────────────────────────────────────────
app.get('/api/debug', (req, res) => {
    const dbUrl = process.env.DATABASE_URL;
    res.json({
        dbReady: global.dbReady,
        dbError: global.dbError,
        DATABASE_URL: dbUrl ? `✅ SET → ${dbUrl.replace(/:\/\/[^@]+@/, '://***@')}` : '❌ NOT SET',
        JWT_SECRET: process.env.JWT_SECRET ? '✅ set' : '⚠️ using default (not secure)',
        NODE_ENV: process.env.NODE_ENV || 'not set',
        PORT: PORT,
        fix: !dbUrl
            ? 'Add PostgreSQL in Railway: project → + New → Database → PostgreSQL'
            : !global.dbReady
            ? 'DB is connecting — wait 10-15s and refresh this page'
            : '✅ All good!',
    });
});

// ─── DB-GATE — waits up to 8s for DB then gives helpful error ─────────────────
const dbGate = async (req, res, next) => {
    if (global.dbReady) return next();

    // Wait up to 8 seconds for DB to become ready
    const deadline = Date.now() + 8000;
    while (Date.now() < deadline) {
        await new Promise(r => setTimeout(r, 500));
        if (global.dbReady) return next();
    }

    // Still not ready — return helpful error
    const hasDatabaseUrl = !!process.env.DATABASE_URL;
    res.status(503).json({
        success: false,
        message: hasDatabaseUrl
            ? 'Database is starting up. Please wait 10-15 seconds and try again.'
            : 'DATABASE_URL is not configured. Add a PostgreSQL database to your Railway project.',
        debug: `${req.method} ${req.path} — visit /api/debug for details`,
    });
};

// ─── ROUTES ───────────────────────────────────────────────────────────────────
const { authenticate } = require('./middlewares/auth.middleware');
const { errorHandler } = require('./middlewares/error.middleware');

app.use('/api/auth',       dbGate, require('./routes/auth.routes'));
app.use('/api/users',      dbGate, authenticate, require('./routes/user.routes'));
app.use('/api/products',   dbGate, require('./routes/product.routes'));
app.use('/api/categories', dbGate, require('./routes/category.routes'));
app.use('/api/orders',     dbGate, authenticate, require('./routes/order.routes'));
app.use('/api/cart',       dbGate, authenticate, require('./routes/cart.routes'));
app.use('/api/payments',   dbGate, authenticate, require('./routes/payment.routes'));
app.use('/api/admin',      dbGate, authenticate, require('./routes/admin.routes'));
app.use('/api/repairs',    dbGate, authenticate, require('./routes/repair.routes'));
app.use('/api/technician', dbGate, authenticate, require('./routes/technician.routes'));
app.use('/api/chat',       dbGate, authenticate, require('./routes/chat.routes'));
app.use('/api/delivery',   dbGate, authenticate, require('./routes/delivery.routes'));
app.use('/api/setup',      dbGate, require('./routes/setup.routes'));

// ─── INIT — seed DB and create admin ─────────────────────────────────────────
app.get('/api/init', async (req, res) => {
    if (!global.dbReady) {
        return res.status(503).send(`
            <h2>⏳ Database not ready yet</h2>
            <p>Error: ${global.dbError || 'Still connecting...'}</p>
            <p>Visit <a href="/api/debug">/api/debug</a> for details.</p>
            <p>Make sure you added a PostgreSQL plugin in Railway.</p>
        `);
    }
    try {
        const { query } = require('./config/database');
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
            await query(`INSERT INTO users (id,email,password_hash,first_name,last_name,role_id,is_active,is_verified,verification_status,created_at) VALUES ($1,$2,$3,'Nancy','Admin',$4,true,true,'verified',NOW())`, [uuidv4(), 'Namcy@gmail.com', hash, adminRole.rows[0].id]);
        }
        const users = await query(`SELECT email FROM users`);
        res.send(`<h2 style="color:green">✅ Done!</h2><p><b>Admin:</b> Namcy@gmail.com / admin@123</p><p><b>Users:</b> ${users.rows.map(u=>u.email).join(', ')}</p><p><a href="/">→ Open App</a></p>`);
    } catch (err) {
        res.status(500).send('<h2>❌ Error</h2><pre>' + err.message + '</pre>');
    }
});

app.get('/api/docs', (req, res) => res.json({ service: 'NancyMobile API', version: '1.0.9', health: '/api/health', debug: '/api/debug' }));

// ─── ERROR HANDLER ────────────────────────────────────────────────────────────
app.use(errorHandler);

// ─── SPA FALLBACK ─────────────────────────────────────────────────────────────
app.use('*', (req, res) => {
    if (!req.originalUrl.startsWith('/api') && frontendDist) {
        const idx = path.join(frontendDist, 'index.html');
        if (fs.existsSync(idx)) return res.sendFile(idx);
    }
    res.status(404).json({ success: false, message: 'Not found' });
});

// ─── START SERVER IMMEDIATELY ─────────────────────────────────────────────────
const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server on ${PORT}`);
    console.log(`   DATABASE_URL: ${process.env.DATABASE_URL ? '✅ SET' : '❌ NOT SET'}`);
    console.log(`   JWT_SECRET:   ${process.env.JWT_SECRET ? '✅ SET' : '⚠️  using default'}`);

    // Start DB init in background — will keep retrying until connected
    initDB().catch(err => console.error('Fatal DB error:', err.message));
});

server.keepAliveTimeout = 120000;
server.headersTimeout   = 120000;

// ─── DB INIT — retries forever until PostgreSQL is ready ─────────────────────
async function initDB() {
    if (!process.env.DATABASE_URL && !process.env.DB_HOST) {
        global.dbError = 'DATABASE_URL not set. Add PostgreSQL in Railway dashboard.';
        console.error('❌ ' + global.dbError);
        return;
    }

    const { connectDB, query } = require('./config/database');

    // connectDB retries indefinitely — waits for Railway Postgres to start
    await connectDB();

    console.log('🔄 Running migrations...');
    try {
        // All tables in dependency order
        await query(`CREATE TABLE IF NOT EXISTS roles (id SERIAL PRIMARY KEY, name VARCHAR(50) UNIQUE NOT NULL, permissions TEXT[] DEFAULT '{}')`);
        await query(`CREATE TABLE IF NOT EXISTS users (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            email VARCHAR(255) UNIQUE NOT NULL,
            password_hash VARCHAR(255) NOT NULL,
            first_name VARCHAR(100), last_name VARCHAR(100),
            phone VARCHAR(20), address TEXT,
            role_id INTEGER REFERENCES roles(id),
            is_active BOOLEAN DEFAULT true,
            is_verified BOOLEAN DEFAULT false,
            verification_status VARCHAR(50) DEFAULT 'unverified',
            national_id VARCHAR(100), fan_number VARCHAR(100),
            profile_picture TEXT, national_id_file TEXT,
            is_available BOOLEAN DEFAULT false,
            last_login TIMESTAMP,
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
        )`);
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
        console.log('✅ Tables ready');
    } catch (e) { console.log('⚠️ Table error (may exist):', e.message); }

    // Seed reference data
    try {
        await query(`INSERT INTO roles (name) VALUES ('admin'),('customer'),('technician'),('delivery_person') ON CONFLICT (name) DO NOTHING`);
        await query(`INSERT INTO categories (name, slug) VALUES ('Cases','cases'),('Screen Protectors','screen-protectors'),('Chargers','chargers'),('Audio','audio'),('Power Banks','power-banks'),('Smart Watches','smart-watches'),('Repair Services','repair-services') ON CONFLICT (slug) DO NOTHING`);
        await query(`INSERT INTO bank_settings (bank_key, bank_name, account_number, account_name, is_active) VALUES ('cbe','Commercial Bank of Ethiopia','1000123456789','Nancy Mobile PLC',true),('abyssinia','Bank of Abyssinia','0123456789','Nancy Mobile PLC',true),('awash','Awash Bank','0123456789012','Nancy Mobile PLC',true) ON CONFLICT (bank_key) DO NOTHING`);
        console.log('✅ Seed data done');
    } catch (e) { console.log('⚠️ Seed error:', e.message); }

    // Admin account
    try {
        const bcrypt = require('bcryptjs');
        const { v4: uuidv4 } = require('uuid');
        const hash = await bcrypt.hash('admin@123', 10);
        const roleRes = await query(`SELECT id FROM roles WHERE name='admin'`);
        if (roleRes.rows.length > 0) {
            const ex = await query(`SELECT id FROM users WHERE LOWER(email)='namcy@gmail.com'`);
            if (ex.rows.length > 0) {
                await query(`UPDATE users SET password_hash=$1, is_active=true, is_verified=true, verification_status='verified' WHERE LOWER(email)='namcy@gmail.com'`, [hash]);
            } else {
                await query(`INSERT INTO users (id,email,password_hash,first_name,last_name,role_id,is_active,is_verified,verification_status,created_at) VALUES ($1,$2,$3,'Nancy','Admin',$4,true,true,'verified',NOW())`, [uuidv4(), 'Namcy@gmail.com', hash, roleRes.rows[0].id]);
            }
            console.log('✅ Admin ready: Namcy@gmail.com / admin@123');
        }
    } catch (e) { console.log('⚠️ Admin error:', e.message); }

    // ✅ Mark DB as ready — all routes now work
    global.dbReady = true;
    global.dbError = null;
    console.log('✅ Database fully ready — all routes active');

    // Keep-alive ping every 4 minutes
    setInterval(async () => {
        try { await query('SELECT 1'); }
        catch (e) {
            console.log('⚠️ DB ping failed, reconnecting...', e.message);
            global.dbReady = false;
            // Re-run full init to reconnect
            initDB().catch(err => console.error('Reconnect failed:', err.message));
        }
    }, 4 * 60 * 1000);
}
