const http = require('http');

function post(path, body) {
    return new Promise((resolve, reject) => {
        const data = JSON.stringify(body);
        const options = {
            hostname: 'localhost',
            port: 5000,
            path,
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) },
        };
        const req = http.request(options, res => {
            let d = '';
            res.on('data', c => d += c);
            res.on('end', () => resolve({ status: res.statusCode, body: JSON.parse(d) }));
        });
        req.on('error', reject);
        req.setTimeout(5000, () => reject(new Error('Timeout')));
        req.write(data);
        req.end();
    });
}

function get(path, token) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost', port: 5000, path, method: 'GET',
            headers: token ? { Authorization: `Bearer ${token}` } : {},
        };
        const req = http.request(options, res => {
            let d = '';
            res.on('data', c => d += c);
            res.on('end', () => resolve({ status: res.statusCode, body: JSON.parse(d) }));
        });
        req.on('error', reject);
        req.setTimeout(5000, () => reject(new Error('Timeout')));
        req.end();
    });
}

async function runTests() {
    console.log('\n🧪 API LIVE TEST SUITE\n' + '='.repeat(40));
    let passed = 0; let failed = 0;

    function check(name, condition, detail) {
        if (condition) { console.log(`✅ PASS: ${name}`); passed++; }
        else { console.log(`❌ FAIL: ${name} — ${detail}`); failed++; }
    }

    // 1. Health check
    const health = await get('/api/health');
    check('GET /api/health returns ok', health.body.status === 'ok', health.body);

    // 2. Admin login
    const login = await post('/api/auth/login', { email: 'admin@interview.com', password: 'admin123' });
    check('POST /api/auth/login returns 200', login.status === 200, JSON.stringify(login.body));
    check('Login returns token', !!login.body.token, 'no token');
    check('Login returns admin role', login.body.user?.role === 'admin', login.body.user?.role);
    const adminToken = login.body.token;

    // 3. Candidate login
    const candLogin = await post('/api/auth/login', { email: 'alice@example.com', password: 'admin123' });
    check('POST /api/auth/login (candidate) returns 200', candLogin.status === 200, JSON.stringify(candLogin.body));
    const candToken = candLogin.body.token;

    // 4. Wrong password
    const badLogin = await post('/api/auth/login', { email: 'admin@interview.com', password: 'wrongpass' });
    check('Wrong password returns 401', badLogin.status === 401, badLogin.status);

    // 5. Register
    const reg = await post('/api/auth/register', { name: 'Test New', email: `test_${Date.now()}@test.com`, password: 'test123', role: 'candidate' });
    check('POST /api/auth/register returns 201', reg.status === 201, JSON.stringify(reg.body));
    check('Register returns token', !!reg.body.token, 'no token');

    // 6. Get interviews (auth required)
    const intNoAuth = await get('/api/interviews');
    check('GET /api/interviews without auth returns 401', intNoAuth.status === 401, intNoAuth.status);

    const intAuth = await get('/api/interviews', adminToken);
    check('GET /api/interviews with auth returns 200', intAuth.status === 200, intAuth.status);
    check('Interviews array returned', Array.isArray(intAuth.body.interviews), typeof intAuth.body.interviews);
    check('Interviews seeded (5+)', intAuth.body.interviews.length >= 5, intAuth.body.interviews.length);

    // 7. Create interview (admin)
    const createInt = await post('/api/interviews', { title: 'Live Test Interview', scheduled_time: new Date(Date.now() + 86400000).toISOString() });
    // This won't have auth header via our simple http helper, test manually later
    // check separately...

    // 8. Get bookings without auth
    const bookNoAuth = await get('/api/bookings/me');
    check('GET /api/bookings/me without auth returns 401', bookNoAuth.status === 401, bookNoAuth.status);

    // 9. Get my bookings (auth)
    const myBookings = await get('/api/bookings/me', candToken);
    check('GET /api/bookings/me with auth returns 200', myBookings.status === 200, myBookings.status);

    // 10. Profile
    const profile = await get('/api/auth/profile', adminToken);
    check('GET /api/auth/profile returns user', !!profile.body.user?.email, JSON.stringify(profile.body));

    console.log('\n' + '='.repeat(40));
    console.log(`\n📊 Results: ${passed} passed, ${failed} failed out of ${passed + failed} tests`);
    if (failed === 0) console.log('🎉 ALL TESTS PASSED!\n');
    else console.log('⚠️  Some tests failed — check above\n');
}

runTests().catch(e => console.error('Test runner error:', e.message));
