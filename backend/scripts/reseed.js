const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const pool = new Pool({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    connectionTimeoutMillis: 8000,
});

async function reseed() {
    console.log('\n🌱 Re-seeding users with correct password hashes...\n');

    const password = 'admin123';
    const hash = await bcrypt.hash(password, 12);
    console.log('Generated hash for admin123:', hash);

    // Delete existing users (cascade deletes bookings too)
    await pool.query('DELETE FROM bookings');
    await pool.query('DELETE FROM interviews');
    await pool.query('DELETE FROM users');

    // Insert correct users
    await pool.query(
        'INSERT INTO users (name, email, password_hash, role) VALUES ($1,$2,$3,$4),($5,$6,$7,$8),($9,$10,$11,$12)',
        [
            'Admin User', 'admin@interview.com', hash, 'admin',
            'Alice Johnson', 'alice@example.com', hash, 'candidate',
            'Bob Smith', 'bob@example.com', hash, 'candidate',
        ]
    );
    console.log('✅ Users inserted');

    // Insert interviews
    const adminRes = await pool.query("SELECT id FROM users WHERE email='admin@interview.com'");
    const adminId = adminRes.rows[0].id;

    await pool.query(`
    INSERT INTO interviews (title, scheduled_time, created_by, status) VALUES
    ('Frontend Developer Interview - React',    NOW() + INTERVAL '1 day',   $1, 'scheduled'),
    ('Backend Engineer Interview - Node.js',    NOW() + INTERVAL '2 days',  $1, 'scheduled'),
    ('Full Stack Developer Interview',          NOW() + INTERVAL '3 days',  $1, 'scheduled'),
    ('DevOps Engineer Interview',               NOW() + INTERVAL '5 days',  $1, 'active'),
    ('System Design Round - Senior Engineer',  NOW() + INTERVAL '7 days',  $1, 'scheduled')
  `, [adminId]);
    console.log('✅ Interviews inserted\n');

    // Verify
    const users = await pool.query('SELECT name, email, role FROM users ORDER BY id');
    console.log('Users:');
    users.rows.forEach(u => console.log(`  [${u.role}] ${u.name} — ${u.email}`));

    const interviews = await pool.query('SELECT title, status FROM interviews ORDER BY id');
    console.log('\nInterviews:');
    interviews.rows.forEach(i => console.log(`  [${i.status}] ${i.title}`));

    console.log('\n✅ Seed complete!');
    console.log('📧 Login: admin@interview.com / admin123');
    console.log('📧 Login: alice@example.com   / admin123\n');

    await pool.end();
}

reseed().catch(async e => {
    console.error('❌', e.message);
    await pool.end();
    process.exit(1);
});
