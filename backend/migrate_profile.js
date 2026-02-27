const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 5432,
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'interview_platform',
});

const migrate = async () => {
    try {
        console.log('--- Starting Profile Migration ---');

        // Verify connection
        await pool.query('SELECT NOW()');
        console.log('✅ DB Connection Verified');

        // Create user_profiles table
        await pool.query(`
      CREATE TABLE IF NOT EXISTS user_profiles (
        id SERIAL PRIMARY KEY,
        user_id INTEGER UNIQUE REFERENCES users(id) ON DELETE CASCADE,
        dob DATE,
        gender VARCHAR(50),
        location VARCHAR(255),
        permanent_address TEXT,
        nationality VARCHAR(100),
        degree VARCHAR(255),
        specialization VARCHAR(255),
        university VARCHAR(255),
        graduation_year INTEGER,
        cgpa VARCHAR(20),
        twelfth_details JSONB,
        tenth_details JSONB,
        backlogs_count INTEGER DEFAULT 0,
        resume_url TEXT,
        linkedin_url TEXT,
        github_url TEXT,
        portfolio_url TEXT,
        skills JSONB,
        projects JSONB,
        work_experience JSONB,
        preferred_role VARCHAR(255),
        preferred_location VARCHAR(255),
        willing_to_relocate BOOLEAN DEFAULT false,
        work_mode VARCHAR(100),
        expected_salary VARCHAR(100),
        notice_period VARCHAR(100),
        screening_answers JSONB,
        declaration JSONB,
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

        console.log('✅ Success: user_profiles table is ready.');

        // Update existing users table just in case
        await pool.query(`
            ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(20);
            ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;
        `);
        console.log('✅ Success: users table updated.');

        process.exit(0);
    } catch (err) {
        console.error('❌ Migration failed:', err.message);
        process.exit(1);
    }
};

migrate();
