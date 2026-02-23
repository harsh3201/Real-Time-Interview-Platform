const request = require('supertest');
const { app } = require('../src/index');
const pool = require('../src/config/database');
const bcrypt = require('bcryptjs');

describe('🧪 Auth API Tests', () => {
    const testUser = {
        name: 'Test User',
        email: `testuser_${Date.now()}@example.com`,
        password: 'password123',
        role: 'candidate',
    };

    let authToken;

    afterAll(async () => {
        // Cleanup test user
        await pool.query('DELETE FROM users WHERE email = $1', [testUser.email]);
        await pool.end();
    });

    describe('POST /api/auth/register', () => {
        it('should register a new user and return a token', async () => {
            const res = await request(app)
                .post('/api/auth/register')
                .send(testUser);

            expect(res.statusCode).toBe(201);
            expect(res.body).toHaveProperty('token');
            expect(res.body).toHaveProperty('user');
            expect(res.body.user.email).toBe(testUser.email);
            expect(res.body.user.role).toBe('candidate');
            expect(res.body.user).not.toHaveProperty('password_hash');
        });

        it('should return 409 when registering with existing email', async () => {
            const res = await request(app)
                .post('/api/auth/register')
                .send(testUser);

            expect(res.statusCode).toBe(409);
            expect(res.body).toHaveProperty('message');
        });

        it('should return 400 when required fields are missing', async () => {
            const res = await request(app)
                .post('/api/auth/register')
                .send({ email: 'incomplete@example.com' });

            expect(res.statusCode).toBe(400);
        });

        it('should return 400 when password is too short', async () => {
            const res = await request(app)
                .post('/api/auth/register')
                .send({ name: 'Test', email: 'short@example.com', password: '12345' });

            expect(res.statusCode).toBe(400);
        });
    });

    describe('POST /api/auth/login', () => {
        it('should login and return a JWT token', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({ email: testUser.email, password: testUser.password });

            expect(res.statusCode).toBe(200);
            expect(res.body).toHaveProperty('token');
            expect(res.body).toHaveProperty('user');
            expect(res.body.user.email).toBe(testUser.email);

            authToken = res.body.token;
        });

        it('should return 401 with wrong password', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({ email: testUser.email, password: 'wrongpassword' });

            expect(res.statusCode).toBe(401);
        });

        it('should return 401 with non-existent email', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({ email: 'nonexistent@example.com', password: 'password123' });

            expect(res.statusCode).toBe(401);
        });

        it('should return 400 when fields are missing', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({ email: testUser.email });

            expect(res.statusCode).toBe(400);
        });
    });

    describe('GET /api/auth/profile', () => {
        it('should return user profile with valid token', async () => {
            if (!authToken) {
                const loginRes = await request(app)
                    .post('/api/auth/login')
                    .send({ email: testUser.email, password: testUser.password });
                authToken = loginRes.body.token;
            }

            const res = await request(app)
                .get('/api/auth/profile')
                .set('Authorization', `Bearer ${authToken}`);

            expect(res.statusCode).toBe(200);
            expect(res.body).toHaveProperty('user');
            expect(res.body.user.email).toBe(testUser.email);
        });

        it('should return 401 without token', async () => {
            const res = await request(app).get('/api/auth/profile');
            expect(res.statusCode).toBe(401);
        });
    });
});
