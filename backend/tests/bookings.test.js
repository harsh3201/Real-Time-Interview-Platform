const request = require('supertest');
const { app } = require('../src/index');
const pool = require('../src/config/database');

describe('🧪 Booking API Tests', () => {
    let candidateToken;
    let adminToken;
    let availableInterviewId;
    let createdBookingId;

    beforeAll(async () => {
        const candRes = await request(app).post('/api/auth/login')
            .send({ email: 'alice@example.com', password: 'admin123' });
        candidateToken = candRes.body.token;

        const adminRes = await request(app).post('/api/auth/login')
            .send({ email: 'admin@interview.com', password: 'admin123' });
        adminToken = adminRes.body.token;

        
        const intRes = await request(app)
            .get('/api/interviews')
            .set('Authorization', `Bearer ${candidateToken}`);
        const available = (intRes.body.interviews || []).find(i => i.status === 'scheduled');
        if (available) availableInterviewId = available.id;

        
        if (availableInterviewId) {
            const aliceRes = await pool.query("SELECT id FROM users WHERE email='alice@example.com'");
            if (aliceRes.rows.length) {
                await pool.query(
                    'DELETE FROM bookings WHERE interview_id = $1 AND user_id = $2',
                    [availableInterviewId, aliceRes.rows[0].id]
                );
            }
        }
    });

    afterAll(async () => {
        if (createdBookingId) {
            await pool.query('DELETE FROM bookings WHERE id = $1', [createdBookingId]).catch(() => { });
        }
    });

    describe('POST /api/bookings — booking requires auth', () => {
        it('should return 401 when booking without authentication', async () => {
            const res = await request(app)
                .post('/api/bookings')
                .send({ interview_id: 1 });

            expect(res.statusCode).toBe(401);
        });

        it('should return 400 when interview_id is missing', async () => {
            const res = await request(app)
                .post('/api/bookings')
                .set('Authorization', `Bearer ${candidateToken}`)
                .send({});

            expect(res.statusCode).toBe(400);
        });

        it('should return 404 when interview does not exist', async () => {
            const res = await request(app)
                .post('/api/bookings')
                .set('Authorization', `Bearer ${candidateToken}`)
                .send({ interview_id: 99999 });

            expect(res.statusCode).toBe(404);
        });

        it('should successfully book an interview when authenticated', async () => {
            if (!availableInterviewId) return;

            const res = await request(app)
                .post('/api/bookings')
                .set('Authorization', `Bearer ${candidateToken}`)
                .send({ interview_id: availableInterviewId });

            expect(res.statusCode).toBe(201);
            expect(res.body).toHaveProperty('booking');
            expect(res.body).toHaveProperty('interview');
            createdBookingId = res.body.booking.id;
        });

        it('should return 409 when booking the same interview twice', async () => {
            if (!availableInterviewId || !createdBookingId) return;

            const res = await request(app)
                .post('/api/bookings')
                .set('Authorization', `Bearer ${candidateToken}`)
                .send({ interview_id: availableInterviewId });

            expect(res.statusCode).toBe(409);
        });
    });

    describe('GET /api/bookings/me', () => {
        it('should return 401 without token', async () => {
            const res = await request(app).get('/api/bookings/me');
            expect(res.statusCode).toBe(401);
        });

        it('should return current user bookings when authenticated', async () => {
            const res = await request(app)
                .get('/api/bookings/me')
                .set('Authorization', `Bearer ${candidateToken}`);

            expect(res.statusCode).toBe(200);
            expect(res.body).toHaveProperty('bookings');
            expect(Array.isArray(res.body.bookings)).toBe(true);
        });
    });

    describe('GET /api/bookings/all — admin only', () => {
        it('should return 403 for candidate trying to get all bookings', async () => {
            const res = await request(app)
                .get('/api/bookings/all')
                .set('Authorization', `Bearer ${candidateToken}`);

            expect(res.statusCode).toBe(403);
        });

        it('should return all bookings for admin', async () => {
            const res = await request(app)
                .get('/api/bookings/all')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.statusCode).toBe(200);
            expect(res.body).toHaveProperty('bookings');
        });
    });
});
