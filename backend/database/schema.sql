-- Real-Time Interview Platform Database Schema

-- Drop tables if they exist (for fresh setup)
DROP TABLE IF EXISTS bookings CASCADE;
DROP TABLE IF EXISTS interviews CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Users table
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'candidate' CHECK (role IN ('candidate', 'admin')),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Interviews table
CREATE TABLE interviews (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  scheduled_time TIMESTAMP NOT NULL,
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  status VARCHAR(50) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'active', 'completed', 'cancelled')),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Bookings table
CREATE TABLE bookings (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  interview_id INTEGER NOT NULL REFERENCES interviews(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, interview_id)
);

-- Indexes for performance
CREATE INDEX idx_interviews_status ON interviews(status);
CREATE INDEX idx_interviews_scheduled_time ON interviews(scheduled_time);
CREATE INDEX idx_bookings_user_id ON bookings(user_id);
CREATE INDEX idx_bookings_interview_id ON bookings(interview_id);

-- Seed data
-- Admin user (password: admin123)
INSERT INTO users (name, email, password_hash, role) VALUES
  ('Admin User', 'admin@interview.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBAV4GnJPKDUty', 'admin'),
  ('Alice Johnson', 'alice@example.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBAV4GnJPKDUty', 'candidate'),
  ('Bob Smith', 'bob@example.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBAV4GnJPKDUty', 'candidate');

-- Sample interviews (all passwords are: admin123)
INSERT INTO interviews (title, scheduled_time, created_by, status) VALUES
  ('Frontend Developer Interview - React', NOW() + INTERVAL '1 day', 1, 'scheduled'),
  ('Backend Engineer Interview - Node.js', NOW() + INTERVAL '2 days', 1, 'scheduled'),
  ('Full Stack Developer Interview', NOW() + INTERVAL '3 days', 1, 'scheduled'),
  ('DevOps Engineer Interview', NOW() + INTERVAL '5 days', 1, 'scheduled'),
  ('System Design Round - Senior', NOW() + INTERVAL '7 days', 1, 'scheduled');
