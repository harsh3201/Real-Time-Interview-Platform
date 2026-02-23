const { execSync } = require('child_process');

try {
    const result = execSync('npx jest --forceExit --verbose', {
        cwd: process.cwd(),
        encoding: 'utf8',
        timeout: 120000,
        stdio: ['pipe', 'pipe', 'pipe'],
    });
    console.log(result);
} catch (e) {
    
    const output = e.stdout + '\n' + e.stderr;
    const lines = output.split('\n');

    
    const summaryLines = lines.filter(l =>
        l.includes('PASS') || l.includes('FAIL') ||
        l.includes('Tests:') || l.includes('Test Suites:') ||
        l.includes('passed') || l.includes('failed') ||
        l.match(/✓|✗|×|●|○/) ||
        l.trim().startsWith('✓') || l.trim().startsWith('✗') ||
        l.includes('should ')
    );

    console.log('\n=== TEST RESULTS ===');
    summaryLines.forEach(l => console.log(l));
    console.log('===================');
    console.log('Exit code:', e.status);
}
