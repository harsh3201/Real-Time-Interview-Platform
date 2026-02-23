const request = require('supertest');
const { app } = require('../src/index');
const pool = require('../src/config/database');

describe('🧪 Interview API Tests', () => {
    let adminToken;
    let candidateToken;
    let createdInterviewId;

    const adminCredentials = { email: 'admin@interview.com', password: 'admin123' };
    const candidateCredentials = { email: 'alice@example.com', password: 'admin123' };

    beforeAll(async () => {
        // Get admin token
        const adminRes = await request(app).post('/api/auth/login').send(adminCredentials);
        adminToken = adminRes.body.token;

        // Get candidate token
        const candRes = await request(app).post('/api/auth/login').send(candidateCredentials);
        candidateToken = candRes.body.token;
    });

    afterAll(async () => {
        // Cleanup created test interview
        if (createdInterviewId) {
            await pool.query('DELETE FROM bookings WHERE interview_id = $1', [createdInterviewId]);
            await pool.query('DELETE FROM interviews WHERE id = $1', [createdInterviewId]);
        }
        await pool.end();
    });

    describe('GET /api/interviews', () => {
        it('should return all interviews for authenticated user', async () => {
            const res = await request(app)
                .get('/api/interviews')
                .set('Authorization', `Bearer ${candidateToken}`);

            expect(res.statusCode).toBe(200);
            expect(res.body).toHaveProperty('interviews');
            expect(Array.isArray(res.body.interviews)).toBe(true);
        });

        it('should return 401 for unauthenticated request', async () => {
            const res = await request(app).get('/api/interviews');
            expect(res.statusCode).toBe(401);
        });
    });

    describe('POST /api/interviews', () => {
        it('should allow admin to create an interview', async () => {
            const res = await request(app)
                .post('/api/interviews')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    title: 'Test Interview - Jest',
                    scheduled_time: new Date(Date.now() + 86400000).toISOString(),
                });

            expect(res.statusCode).toBe(201);
            expect(res.body).toHaveProperty('interview');
            expect(res.body.interview.title).toBe('Test Interview - Jest');
            expect(res.body.interview.status).toBe('scheduled');

            createdInterviewId = res.body.interview.id;
        });

        it('should return 403 when candidate tries to create interview', async () => {
            const res = await request(app)
                .post('/api/interviews')
                .set('Authorization', `Bearer ${candidateToken}`)
                .send({
                    title: 'Unauthorized Interview',
                    scheduled_time: new Date(Date.now() + 86400000).toISOString(),
                });

            expect(res.statusCode).toBe(403);
        });

        it('should return 400 when required fields are missing', async () => {
            const res = await request(app)
                .post('/api/interviews')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ title: 'Missing scheduled_time' });

            expect(res.statusCode).toBe(400);
        });

        it('should return 401 without auth token', async () => {
            const res = await request(app)
                .post('/api/interviews')
                .send({ title: 'No token', scheduled_time: new Date().toISOString() });

            expect(res.statusCode).toBe(401);
        });
    });

    describe('PUT /api/interviews/:id', () => {
        it('should allow admin to update an interview', async () => {
            if (!createdInterviewId) return;

            const res = await request(app)
                .put(`/api/interviews/${createdInterviewId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ status: 'active' });

            expect(res.statusCode).toBe(200);
            expect(res.body.interview.status).toBe('active');
        });
    });
});
