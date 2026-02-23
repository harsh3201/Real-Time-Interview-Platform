
const path = require('path');

module.exports = async () => {
    try {
        
        const poolPath = path.resolve(__dirname, '../src/config/database');
        const pool = require(poolPath);
        await pool.end();
        console.log('\n✅ DB pool closed cleanly after tests\n');
    } catch (e) {
        
    }
};
