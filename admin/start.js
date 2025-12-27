const { spawn } = require('child_process');
const path = require('path');

// Set environment variables
process.env.PORT = '3001';
process.env.REACT_APP_BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';
process.env.REACT_APP_ADMIN_SECRET = process.env.REACT_APP_ADMIN_SECRET || 'raama-admin-2024';

console.log('🚀 Starting Raama Admin Dashboard...');
console.log('   Port: 3001');
console.log('   Backend: http://localhost:8001');

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
  if (code !== 0) {
    console.log(`Admin dashboard exited with code ${code}`);
  }
});