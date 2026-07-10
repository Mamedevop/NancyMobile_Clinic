const { Pool } = require('pg');

// Build pool config — always try DATABASE_URL first (Railway injects it)
let poolConfig;
if (process.env.DATABASE_URL) {
    poolConfig = {
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false },
        max: 10,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 15000,
        allowExitOnIdle: false,
    };
} else {
    poolConfig = {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT) || 5432,
        database: process.env.DB_NAME || 'nancymobile',
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'password',
        max: 10,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 15000,
    };
}

const pool = new Pool(poolConfig);

pool.on('error', (err) => {
    console.error('Unexpected DB pool error:', err.message);
});

// connectDB: retries indefinitely with exponential backoff (max 30s between retries)
// This handles Railway's Postgres being slow to start
const connectDB = async () => {
    let attempt = 0;
    while (true) {
        attempt++;
        try {
            const client = await pool.connect();
            console.log(`✅ PostgreSQL connected (attempt ${attempt})`);
            client.release();
            return; // success
        } catch (error) {
            const wait = Math.min(5000 * attempt, 30000); // 5s, 10s, 15s... max 30s
            console.error(`❌ DB connect attempt ${attempt} failed: ${error.message}`);
            console.log(`   Retrying in ${wait / 1000}s...`);
            await new Promise(r => setTimeout(r, wait));
        }
    }
};

const query = async (text, params) => {
    const result = await pool.query(text, params);
    return result;
};

module.exports = { query, pool, connectDB };
