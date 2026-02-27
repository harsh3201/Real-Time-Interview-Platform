const pool = require('./src/config/database');

async function run() {
    try {
        await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(20);');
        await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url VARCHAR(255);');
        console.log('✅ User table updated successfully');
    } catch (err) {
        console.error('❌ Error updating user table:', err);
    } finally {
        process.exit();
    }
}

run();
