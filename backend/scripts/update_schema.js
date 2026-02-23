const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
});

async function updateSchema() {
    try {
        console.log('Running schema updates...');
        await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS otp_code VARCHAR(6)');
        await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS otp_expiry TIMESTAMP');
        await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id VARCHAR(255)');
        console.log('✅ Schema updated successfully');
    } catch (err) {
        console.error('❌ Schema update failed:', err);
    } finally {
        await pool.end();
    }
}

updateSchema();
