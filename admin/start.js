const { spawn } = require('child_process');
const path = require('path');

// Set environment variables
process.env.PORT = '3001';
process.env.REACT_APP_BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';
process.env.REACT_APP_ADMIN_SECRET = process.env.REACT_APP_ADMIN_SECRET || 'raama-admin-2024';

console.log('🚀 Starting Raama Admin Dashboard...');
console.log('==================================');
console.log('');
console.log('🔐 Admin Dashboard Info:');
console.log('   Port: 3001');
console.log('   URL: http://localhost:3001');
console.log('   Backend: http://localhost:8001');
console.log('');
console.log('👤 Default Admin Credentials:');
console.log('   Email: admin@raama.com');
console.log('   Password: admin123');
console.log('   Admin Secret: raama-admin-2024');
console.log('');
console.log('⚠️  Remember to create admin user first:');
console.log('   python ../scripts/create_admin.py');
console.log('');

// Start React app
const reactScripts = spawn('npx', ['react-scripts', 'start'], {
  stdio: 'inherit',
  shell: true,
  env: process.env
});

reactScripts.on('error', (error) => {
  console.error('Failed to start admin dashboard:', error);
});

reactScripts.on('close', (code) => {
  console.log(`Admin dashboard exited with code ${code}`);
});