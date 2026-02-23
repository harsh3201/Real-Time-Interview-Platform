const request = require('supertest');
const { app } = require('../src/index');
const pool = require('../src/config/database');

describe('🧪 Booking API Tests', () => {
    let candidateToken;
    let adminToken;
    let availableInterviewId;
    let createdBookingId;

    beforeAll(async () => {
        // Login candidate
        const candRes = await request(app)
            .post('/api/auth/login')
            .send({ email: 'alice@example.com', password: 'admin123' });
        candidateToken = candRes.body.token;

        // Login admin
        const adminRes = await request(app)
            .post('/api/auth/login')
            .send({ email: 'admin@interview.com', password: 'admin123' });
        adminToken = adminRes.body.token;

        // Get an available interview
        const interviewsRes = await request(app)
            .get('/api/interviews')
            .set('Authorization', `Bearer ${candidateToken}`);

        const available = interviewsRes.body.interviews.find(i => i.status === 'scheduled');
        if (available) availableInterviewId = available.id;
    });

    afterAll(async () => {
        // Cleanup
        if (createdBookingId) {
            await pool.query('DELETE FROM bookings WHERE id = $1', [createdBookingId]);
        }
        await pool.end();
    });

    describe('POST /api/bookings - Booking requires auth', () => {
        it('should return 401 when booking without authentication', async () => {
            const res = await request(app)
                .post('/api/bookings')
                .send({ interview_id: 1 });

            expect(res.statusCode).toBe(401);
        });

        it('should successfully book an interview when authenticated', async () => {
            if (!availableInterviewId) {
                console.warn('No available interview to book, skipping test');
                return;
            }

            // First, make sure there's no existing booking
            await pool.query(
                'DELETE FROM bookings WHERE interview_id = $1 AND user_id = (SELECT id FROM users WHERE email = $2)',
                [availableInterviewId, 'alice@example.com']
            );

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
    });

    describe('GET /api/bookings/me', () => {
        it('should return current user bookings', async () => {
            const res = await request(app)
                .get('/api/bookings/me')
                .set('Authorization', `Bearer ${candidateToken}`);

            expect(res.statusCode).toBe(200);
            expect(res.body).toHaveProperty('bookings');
            expect(Array.isArray(res.body.bookings)).toBe(true);
        });

        it('should return 401 without token', async () => {
            const res = await request(app).get('/api/bookings/me');
            expect(res.statusCode).toBe(401);
        });
    });

    describe('GET /api/bookings/all (admin only)', () => {
        it('should return all bookings for admin', async () => {
            const res = await request(app)
                .get('/api/bookings/all')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.statusCode).toBe(200);
            expect(res.body).toHaveProperty('bookings');
        });

        it('should return 403 for candidate trying to get all bookings', async () => {
            const res = await request(app)
                .get('/api/bookings/all')
                .set('Authorization', `Bearer ${candidateToken}`);

            expect(res.statusCode).toBe(403);
        });
    });
});
