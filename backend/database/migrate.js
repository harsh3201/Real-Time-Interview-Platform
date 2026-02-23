const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function runMigration() {
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
    });

    try {
        const schemaPath = path.join(__dirname, 'schema.sql');
        const schema = fs.readFileSync(schemaPath, 'utf8');

        console.log('🔄 Running database migration...');
        await pool.query(schema);
        console.log('✅ Database migration completed successfully!');
        console.log('📊 Tables created: users, interviews, bookings');
        console.log('🌱 Seed data inserted');
        console.log('\n📧 Test credentials:');
        console.log('   Admin: admin@interview.com / admin123');
        console.log('   Candidate: alice@example.com / admin123');
    } catch (err) {
        console.error('❌ Migration failed:', err.message);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

runMigration();
