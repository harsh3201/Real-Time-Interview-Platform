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

async function runOTPTest() {
    console.log('\n🧪 OTP API TEST\n' + '='.repeat(40));

    // 1. Request OTP
    console.log('Testing OTP Request for alice@example.com...');
    const reqRes = await post('/api/auth/otp/request', { email: 'alice@example.com' });
    console.log('Status:', reqRes.status);
    console.log('Body:', JSON.stringify(reqRes.body));

    if (reqRes.status === 200) {
        console.log('✅ OTP Request successful (Note: Check SMTP logs if actual delivery is needed)');
    } else if (reqRes.body.message.includes('SMTP')) {
        console.log('⚠️ OTP Request failed due to SMTP (expected if no credentials provided)');
    }

    // 2. We can't easily test verify without an actual email, 
    // but we can check DB to see if OTP was saved.
    // We'll skip verification test here as it requires DB access or mocking.

    console.log('\n========================================\n');
}

runOTPTest().catch(e => console.error('Test runner error:', e.message));
