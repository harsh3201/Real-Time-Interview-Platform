const pool = require('./src/config/database');
async function checkUser() {
    try {
        const res = await pool.query("SELECT name, email, role FROM users WHERE name ILIKE '%harsh%'");
        console.log(JSON.stringify(res.rows, null, 2));
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
checkUser();
