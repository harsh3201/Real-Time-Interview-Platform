const pool = require('./src/config/database');

async function migrate() {
    try {
        console.log('Running migration...');
        await pool.query('ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS hiring_stage VARCHAR(50) DEFAULT \'screening\'');
        console.log('✅ Migration successful: hiring_stage added.');
    } catch (err) {
        console.error('❌ Migration failed:', err.message);
    } finally {
        process.exit();
    }
}

migrate();
