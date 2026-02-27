const { Pool } = require('pg');
require('dotenv').config({ path: '../.env' });

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 5432,
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'interview_platform',
});

const migrate = async () => {
    try {
        console.log('--- Adding Report Column to Interviews ---');
        await pool.query(`
            ALTER TABLE interviews ADD COLUMN IF NOT EXISTS report JSONB;
        `);
        console.log('✅ Success: report column added to interviews table.');
        process.exit(0);
    } catch (err) {
        console.error('❌ Migration failed:', err.message);
        process.exit(1);
    }
};

migrate();
