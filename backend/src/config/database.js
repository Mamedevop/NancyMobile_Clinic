const { Pool } = require('pg');

const pool = new Pool(
    process.env.DATABASE_URL
        ? {
            connectionString: process.env.DATABASE_URL,
            ssl: { rejectUnauthorized: false },
            max: 10,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 10000,
        }
        : {
            host: process.env.DB_HOST || 'localhost',
            port: parseInt(process.env.DB_PORT) || 5432,
            database: process.env.DB_NAME || 'nancymobile',
            user: process.env.DB_USER || 'postgres',
            password: process.env.DB_PASSWORD || 'password',
            max: 10,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 10000,
        }
);

pool.on('error', (err) => {
    console.error('Unexpected DB pool error:', err.message);
});

const connectDB = async () => {
    let attempts = 0;
    while (attempts < 5) {
        try {
            const client = await pool.connect();
            console.log('✅ PostgreSQL connected');
            client.release();
            return;
        } catch (error) {
            attempts++;
            console.error(`❌ DB connection attempt ${attempts}/5 failed:`, error.message);
            if (attempts >= 5) throw error;
            await new Promise(r => setTimeout(r, 3000 * attempts));
        }
    }
};

const query = async (text, params) => {
    try {
        const result = await pool.query(text, params);
        return result;
    } catch (error) {
        console.error('DB query error:', error.message);
        throw error;
    }
};

module.exports = { query, pool, connectDB };
