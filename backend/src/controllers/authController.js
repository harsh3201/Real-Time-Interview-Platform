const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/database');
const { sendOTP } = require('../utils/mailer');
require('dotenv').config();

const register = async (req, res) => {
    try {
        const { name, email, password, role = 'candidate' } = req.body;


        if (!name || !email || !password) {
            return res.status(400).json({ message: 'Name, email, and password are required.' });
        }

        if (password.length < 6) {
            return res.status(400).json({ message: 'Password must be at least 6 characters long.' });
        }

        const validRoles = ['candidate', 'admin'];
        if (!validRoles.includes(role)) {
            return res.status(400).json({ message: 'Invalid role. Must be candidate or admin.' });
        }


        const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
        if (existingUser.rows.length > 0) {
            return res.status(409).json({ message: 'User with this email already exists.' });
        }


        const saltRounds = 12;
        const password_hash = await bcrypt.hash(password, saltRounds);


        const result = await pool.query(
            'INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role, created_at',
            [name, email, password_hash, role]
        );

        const user = result.rows[0];


        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role, name: user.name },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
        );

        res.status(201).json({
            message: 'User registered successfully.',
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                created_at: user.created_at,
            },
        });
    } catch (err) {
        console.error('Register error:', err);
        res.status(500).json({ message: 'Internal server error.', error: err.message });
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required.' });
        }


        const result = await pool.query(
            'SELECT id, name, email, password_hash, role, created_at FROM users WHERE email = $1',
            [email]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({ message: 'Invalid email or password.' });
        }

        const user = result.rows[0];


        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid email or password.' });
        }


        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role, name: user.name },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
        );

        res.status(200).json({
            message: 'Login successful.',
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                created_at: user.created_at,
            },
        });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ message: 'Internal server error.', error: err.message });
    }
};

const getProfile = async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT id, name, email, role, created_at FROM users WHERE id = $1',
            [req.user.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'User not found.' });
        }

        res.status(200).json({ user: result.rows[0] });
    } catch (err) {
        console.error('Profile error:', err);
        res.status(500).json({ message: 'Internal server error.', error: err.message });
    }
};

const requestLoginOTP = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ message: 'Email is required' });

        const userResult = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
        if (userResult.rows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expiry = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

        await pool.query(
            'UPDATE users SET otp_code = $1, otp_expiry = $2 WHERE email = $3',
            [otp, expiry, email]
        );

        try {
            await sendOTP(email, otp);
            res.json({ message: 'OTP sent to your email' });
        } catch (mailErr) {
            console.error('Mail send failed:', mailErr);
            res.status(500).json({ message: 'Failed to send email. Check SMTP config.' });
        }
    } catch (err) {
        res.status(500).json({ message: 'Internal server error' });
    }
};

const verifyLoginOTP = async (req, res) => {
    try {
        const { email, otp } = req.body;
        if (!email || !otp) return res.status(400).json({ message: 'Email and OTP are required' });

        const result = await pool.query(
            'SELECT id, name, email, role, otp_code, otp_expiry FROM users WHERE email = $1',
            [email]
        );

        if (result.rows.length === 0) return res.status(404).json({ message: 'User not found' });

        const user = result.rows[0];

        if (user.otp_code !== otp || new Date() > new Date(user.otp_expiry)) {
            return res.status(401).json({ message: 'Invalid or expired OTP' });
        }

        // Clear OTP
        await pool.query('UPDATE users SET otp_code = NULL, otp_expiry = NULL WHERE id = $1', [user.id]);

        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role, name: user.name },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
        );

        res.json({
            message: 'Login successful',
            token,
            user: { id: user.id, name: user.name, email: user.email, role: user.role }
        });
    } catch (err) {
        res.status(500).json({ message: 'Internal server error' });
    }
};

module.exports = { register, login, getProfile, requestLoginOTP, verifyLoginOTP };
