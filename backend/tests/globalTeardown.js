// Jest global teardown — close DB pool after all test suites finish
const path = require('path');

module.exports = async () => {
    try {
        // Resolve the pool module from the backend src
        const poolPath = path.resolve(__dirname, '../src/config/database');
        const pool = require(poolPath);
        await pool.end();
        console.log('\n✅ DB pool closed cleanly after tests\n');
    } catch (e) {
        // Pool may already be closed or not initialized
    }
};
