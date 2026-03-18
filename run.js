const { execSync } = require('child_process');
try {
    execSync('npx vite build', { stdio: 'pipe' });
    console.log("Success");
} catch (e) {
    console.log("=== STDOUT ===");
    console.log(e.stdout.toString('utf8'));
    console.log("=== STDERR ===");
    console.log(e.stderr.toString('utf8'));
}
