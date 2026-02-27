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

        if (password.length < 8) {
            return res.status(400).json({ message: 'Password must be at least 8 characters long.' });
        }

        const passRegex = /^(?=.*[0-9])(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/;
        if (!passRegex.test(password)) {
            return res.status(400).json({ message: 'Password must contain at least 1 special character and 1 number.' });
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

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expiry = new Date(Date.now() + 10 * 60 * 1000);

        await pool.query(
            'INSERT INTO users (name, email, password_hash, role, otp_code, otp_expiry) VALUES ($1, $2, $3, $4, $5, $6)',
            [name, email, password_hash, role, otp, expiry]
        );

        try {
            await sendOTP(email, otp);
            res.status(201).json({
                message: 'Account created. Please verify your email with the OTP sent.',
                requiresOTP: true,
                email
            });
        } catch (mailErr) {
            console.error('Mail send failed:', mailErr);

            res.status(201).json({
                message: 'Account created, but failed to send OTP. Please try logging in with OTP.',
                requiresOTP: true,
                email
            });
        }
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

        if (!user.password_hash) {
            return res.status(401).json({ message: 'This account was created with Google. Please use Google Login.' });
        }

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
        const expiry = new Date(Date.now() + 10 * 60 * 1000);

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

const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ message: 'Email is required' });

        const user = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
        if (user.rows.length === 0) {
            return res.status(404).json({ message: 'User with this email does not exist.' });
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expiry = new Date(Date.now() + 10 * 60 * 1000);

        await pool.query(
            'UPDATE users SET otp_code = $1, otp_expiry = $2 WHERE email = $3',
            [otp, expiry, email]
        );

        try {
            await sendOTP(email, otp);
            res.json({ message: 'OTP sent to your email for password reset.' });
        } catch (mailErr) {
            console.error('Mail send failed:', mailErr);
            res.status(500).json({ message: 'Failed to send reset email.' });
        }
    } catch (err) {
        console.error('Forgot password error:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
};

const resetPassword = async (req, res) => {
    try {
        const { email, otp, newPassword } = req.body;
        if (!email || !otp || !newPassword) {
            return res.status(400).json({ message: 'Email, OTP and new password are required' });
        }

        const result = await pool.query(
            'SELECT id, otp_code, otp_expiry FROM users WHERE email = $1',
            [email]
        );

        if (result.rows.length === 0) return res.status(404).json({ message: 'User not found' });

        const user = result.rows[0];

        if (user.otp_code !== otp || new Date() > new Date(user.otp_expiry)) {
            return res.status(401).json({ message: 'Invalid or expired OTP' });
        }

        const saltRounds = 12;
        const password_hash = await bcrypt.hash(newPassword, saltRounds);

        await pool.query(
            'UPDATE users SET password_hash = $1, otp_code = NULL, otp_expiry = NULL WHERE id = $2',
            [password_hash, user.id]
        );

        res.json({ message: 'Password reset successful. You can now login.' });
    } catch (err) {
        console.error('Reset password error:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
};

const updateProfile = async (req, res) => {
    try {
        const { name, phone } = req.body;
        const userId = req.user.id;

        const result = await pool.query(
            'UPDATE users SET name = COALESCE($1, name), phone = COALESCE($2, phone) WHERE id = $3 RETURNING id, name, email, role, phone, created_at',
            [name, phone, userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'User not found.' });
        }

        res.status(200).json({
            message: 'Profile updated successfully.',
            user: result.rows[0]
        });
    } catch (err) {
        console.error('Update profile error:', err);
        res.status(500).json({ message: 'Internal server error.', error: err.message });
    }
};

const getFullProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const result = await pool.query(
            `SELECT u.id, u.name, u.email, u.role, u.phone, u.avatar_url, u.created_at,
             p.*
             FROM users u
             LEFT JOIN user_profiles p ON u.id = p.user_id
             WHERE u.id = $1`,
            [userId]
        );

        if (result.rows.length === 0) return res.status(404).json({ message: 'User not found' });

        res.json({ user: result.rows[0] });
    } catch (err) {
        console.error('Get full profile error:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
};

const saveFullProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const data = req.body;

        const cleanData = {
            ...data,
            dob: data.dob === '' ? null : data.dob,
            graduation_year: (data.graduation_year === '' || data.graduation_year === null || isNaN(parseInt(data.graduation_year))) ? null : parseInt(data.graduation_year),
            backlogs_count: (data.backlogs_count === '' || data.backlogs_count === null || isNaN(parseInt(data.backlogs_count))) ? 0 : parseInt(data.backlogs_count),
            willing_to_relocate: data.willing_to_relocate === true || data.willing_to_relocate === 'true'
        };

        const query = `
            INSERT INTO user_profiles (
                user_id, dob, gender, location, permanent_address, nationality,
                degree, specialization, university, graduation_year, cgpa,
                twelfth_details, tenth_details, backlogs_count,
                resume_url, linkedin_url, github_url, portfolio_url,
                skills, projects, work_experience,
                preferred_role, preferred_location, willing_to_relocate,
                work_mode, expected_salary, notice_period,
                screening_answers, declaration, updated_at
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, NOW()
            )
            ON CONFLICT (user_id) DO UPDATE SET
                dob = EXCLUDED.dob,
                gender = EXCLUDED.gender,
                location = EXCLUDED.location,
                permanent_address = EXCLUDED.permanent_address,
                nationality = EXCLUDED.nationality,
                degree = EXCLUDED.degree,
                specialization = EXCLUDED.specialization,
                university = EXCLUDED.university,
                graduation_year = EXCLUDED.graduation_year,
                cgpa = EXCLUDED.cgpa,
                twelfth_details = EXCLUDED.twelfth_details,
                tenth_details = EXCLUDED.tenth_details,
                backlogs_count = EXCLUDED.backlogs_count,
                resume_url = EXCLUDED.resume_url,
                linkedin_url = EXCLUDED.linkedin_url,
                github_url = EXCLUDED.github_url,
                portfolio_url = EXCLUDED.portfolio_url,
                skills = EXCLUDED.skills,
                projects = EXCLUDED.projects,
                work_experience = EXCLUDED.work_experience,
                preferred_role = EXCLUDED.preferred_role,
                preferred_location = EXCLUDED.preferred_location,
                willing_to_relocate = EXCLUDED.willing_to_relocate,
                work_mode = EXCLUDED.work_mode,
                expected_salary = EXCLUDED.expected_salary,
                notice_period = EXCLUDED.notice_period,
                screening_answers = EXCLUDED.screening_answers,
                declaration = EXCLUDED.declaration,
                updated_at = NOW()
            RETURNING *;
        `;

        const values = [
            userId, cleanData.dob, cleanData.gender, cleanData.location, cleanData.permanent_address, cleanData.nationality,
            cleanData.degree, cleanData.specialization, cleanData.university, cleanData.graduation_year, cleanData.cgpa,
            JSON.stringify(cleanData.twelfth_details || {}), JSON.stringify(cleanData.tenth_details || {}), cleanData.backlogs_count,
            cleanData.resume_url, cleanData.linkedin_url, cleanData.github_url, cleanData.portfolio_url,
            JSON.stringify(cleanData.skills || {}), JSON.stringify(cleanData.projects || []), JSON.stringify(cleanData.work_experience || []),
            cleanData.preferred_role, cleanData.preferred_location, cleanData.willing_to_relocate,
            cleanData.work_mode, cleanData.expected_salary, cleanData.notice_period,
            JSON.stringify(cleanData.screening_answers || {}), JSON.stringify(cleanData.declaration || {})
        ];

        const result = await pool.query(query, values);

        res.json({ message: 'Profile saved successfully', profile: result.rows[0] });
    } catch (err) {
        console.error('Save full profile error:', err);
        res.status(500).json({ message: 'Internal server error', error: err.message });
    }
};

const getAllUsers = async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT u.id, u.name, u.email, u.role, u.created_at, p.hiring_stage
             FROM users u
             LEFT JOIN user_profiles p ON u.id = p.user_id
             WHERE u.role = 'candidate'
             ORDER BY u.created_at DESC`
        );
        res.json({ users: result.rows });
    } catch (err) {
        console.error('Get all users error:', err);
        res.status(500).json({ message: 'Internal server error', error: err.message });
    }
};

const getCandidateDetail = async (req, res) => {
    try {
        const { id } = req.params;

        const userRes = await pool.query(
            'SELECT id, name, email, role, phone, created_at FROM users WHERE id = $1 AND role = \'candidate\'',
            [id]
        );
        if (userRes.rows.length === 0) {
            return res.status(404).json({ message: 'Candidate not found' });
        }
        const user = userRes.rows[0];

        const profileRes = await pool.query(
            `SELECT dob, gender, location, permanent_address, nationality,
                    degree, specialization, university, graduation_year, cgpa,
                    twelfth_details, tenth_details, backlogs_count,
                    resume_url, linkedin_url, github_url, portfolio_url,
                    skills, projects, work_experience,
                    preferred_role, preferred_location, willing_to_relocate,
                    work_mode, expected_salary, notice_period,
                    screening_answers, updated_at, hiring_stage
             FROM user_profiles WHERE user_id = $1`,
            [id]
        );
        const profile = profileRes.rows[0] || null;

        const bookingsRes = await pool.query(
            `SELECT b.id AS booking_id, b.created_at AS booked_at,
                    i.title AS interview_title, i.scheduled_time, i.status AS interview_status, i.report AS interview_report
             FROM bookings b
             JOIN interviews i ON b.interview_id = i.id
             WHERE b.user_id = $1
             ORDER BY i.scheduled_time DESC`,
            [id]
        );
        const bookings = bookingsRes.rows;

        let hasSkills = false;
        let hasExperience = false;
        if (profile) {
            const skills = profile.skills;
            hasSkills = skills && typeof skills === 'object' && Object.keys(skills).length > 0;
            const exp = profile.work_experience;
            hasExperience = Array.isArray(exp) && exp.length > 0;
        }

        const stats = {
            totalBookings: bookings.length,
            completedInterviews: bookings.filter(b => b.interview_status === 'completed').length,
            upcomingInterviews: bookings.filter(b => b.interview_status === 'scheduled' || b.interview_status === 'active').length,
            profileComplete: profile !== null,
            hasSkills,
            hasExperience,
        };

        res.json({ user, profile, bookings, stats });
    } catch (err) {
        console.error('Get candidate detail error:', err);
        res.status(500).json({ message: 'Internal server error', error: err.message });
    }
};

const updateHiringStage = async (req, res) => {
    try {
        const { id } = req.params;
        const { hiring_stage } = req.body;
        const validStages = ['screening', 'technical', 'hr', 'offered', 'rejected'];

        if (!validStages.includes(hiring_stage)) {
            return res.status(400).json({ message: 'Invalid hiring stage' });
        }


        await pool.query(
            `INSERT INTO user_profiles (user_id, hiring_stage, updated_at)
             VALUES ($1, $2, NOW())
             ON CONFLICT (user_id) DO UPDATE SET 
             hiring_stage = EXCLUDED.hiring_stage, updated_at = NOW()`,
            [id, hiring_stage]
        );

        res.json({ message: 'Hiring stage updated successfully', hiring_stage });
    } catch (err) {
        console.error('Update hiring stage error:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
};

module.exports = {
    register,
    login,
    getProfile,
    getFullProfile,
    requestLoginOTP,
    verifyLoginOTP,
    updateProfile,
    saveFullProfile,
    getAllUsers,
    getCandidateDetail,
    updateHiringStage,
    forgotPassword,
    resetPassword
};

