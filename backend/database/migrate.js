const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function runMigration() {
    // First connect to postgres DB to create interview_platform DB if needed
    const adminPool = new Pool({
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT) || 5432,
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD,
        database: 'postgres',
        connectionTimeoutMillis: 10000,
    });

    try {
        // Create database if it doesn't exist
        const dbName = process.env.DB_NAME || 'interview_platform';
        const check = await adminPool.query(
            `SELECT 1 FROM pg_database WHERE datname = $1`, [dbName]
        );

        if (check.rows.length === 0) {
            await adminPool.query(`CREATE DATABASE ${dbName}`);
            console.log(`✅ Database '${dbName}' created`);
        } else {
            console.log(`ℹ️  Database '${dbName}' already exists`);
        }
    } catch (err) {
        console.error('❌ Failed to create database:', err.message);
    } finally {
        await adminPool.end();
    }

    // Now connect to the actual DB and run schema
    const pool = new Pool({
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT) || 5432,
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME || 'interview_platform',
        connectionTimeoutMillis: 10000,
    });

    try {
        const schemaPath = path.join(__dirname, 'schema.sql');
        const schema = fs.readFileSync(schemaPath, 'utf8');

        console.log('\n🔄 Running database migration...');
        await pool.query(schema);
        console.log('✅ Database migration completed successfully!');
        console.log('📊 Tables created: users, interviews, bookings');
        console.log('🌱 Seed data inserted\n');
        console.log('📧 Test credentials (password for all: admin123):');
        console.log('   👑 Admin:     admin@interview.com  / admin123');
        console.log('   👤 Candidate: alice@example.com   / admin123');
        console.log('   👤 Candidate: bob@example.com     / admin123\n');
    } catch (err) {
        console.error('❌ Migration failed:', err.message);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

runMigration();
