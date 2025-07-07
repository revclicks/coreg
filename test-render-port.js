#!/usr/bin/env node
// Test script to simulate Render's port detection behavior

import { spawn } from 'child_process';
import { setTimeout } from 'timers/promises';

console.log('🔍 Testing port detection for Render deployment...');

// Simulate starting the server with production environment
const serverProcess = spawn('npm', ['run', 'start'], {
  env: {
    ...process.env,
    NODE_ENV: 'production',
    PORT: '10000'
  },
  stdio: 'inherit'
});

// Wait for server startup
await setTimeout(3000);

// Test port accessibility
console.log('\n📡 Testing port accessibility...');

try {
  const response = await fetch('http://localhost:10000/health');
  const data = await response.json();
  console.log('✅ Health check successful:', data);
} catch (error) {
  console.error('❌ Health check failed:', error.message);
}

try {
  const response = await fetch('http://localhost:10000/status');
  const data = await response.json();
  console.log('✅ Status check successful:', data);
} catch (error) {
  console.error('❌ Status check failed:', error.message);
}

// Cleanup
serverProcess.kill();
console.log('\n🏁 Test completed');