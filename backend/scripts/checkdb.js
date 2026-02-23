const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    connectionTimeoutMillis: 8000,
});

async function check() {
    console.log('\n🔍 Checking database state...\n');

    const tables = await pool.query(
        "SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename"
    );
    console.log('✅ Tables:', tables.rows.map(r => r.tablename).join(', '));

    const users = await pool.query('SELECT id, name, email, role FROM users ORDER BY id');
    console.log(`✅ Users (${users.rows.length}):`);
    users.rows.forEach(u => console.log(`   [${u.role}] ${u.name} — ${u.email}`));

    const interviews = await pool.query('SELECT id, title, status FROM interviews ORDER BY id');
    console.log(`\n✅ Interviews (${interviews.rows.length}):`);
    interviews.rows.forEach(i => console.log(`   [${i.status}] ${i.title}`));

    const bookings = await pool.query('SELECT COUNT(*) as cnt FROM bookings');
    console.log(`\n✅ Bookings: ${bookings.rows[0].cnt}`);

    console.log('\n🎯 Database is healthy and ready!\n');
    await pool.end();
}

check().catch(async e => {
    console.error('❌ Error:', e.message);
    await pool.end();
    process.exit(1);
});
