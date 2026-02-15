#!/usr/bin/env node

const http = require('http');
const https = require('https');
const { URL } = require('url');
const fs = require('fs');
const path = require('path');

// Load .env file if it exists
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const trimmedLine = line.trim();
    if (trimmedLine && !trimmedLine.startsWith('#')) {
      const [key, ...valueParts] = trimmedLine.split('=');
      if (key && valueParts.length > 0) {
        const value = valueParts.join('=').trim();
        // Only set if not already set by environment
        if (!process.env[key]) {
          process.env[key] = value;
        }
      }
    }
  });
}

// Configuration with defaults
const PROXY_PORT = parseInt(process.env.PROXY_PORT) || 4534;
const LISTEN_HOST = process.env.LISTEN_HOST || '0.0.0.0';
const TARGET_HOST = process.env.NAVIDROME_HOST || '192.168.0.163';
const TARGET_PORT = parseInt(process.env.NAVIDROME_PORT) || 4533;
const TARGET_PROTOCOL = process.env.NAVIDROME_PROTOCOL || 'http';

const TARGET_URL = `${TARGET_PROTOCOL}://${TARGET_HOST}:${TARGET_PORT}`;

console.log(`
🎵 Navidrome CORS Proxy Server
`);
console.log(`Proxy:  http://${LISTEN_HOST}:${PROXY_PORT}`);
console.log(`Target: ${TARGET_URL}`);
console.log(`Config: ${fs.existsSync(envPath) ? '.env file' : 'environment variables'}\n`);

const server = http.createServer((req, res) => {
  // Handle preflight OPTIONS requests
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Range, Authorization',
      'Access-Control-Max-Age': '86400',
    });
    res.end();
    return;
  }

  // Parse target URL
  const targetUrl = new URL(req.url, TARGET_URL);
  
  const options = {
    hostname: TARGET_HOST,
    port: TARGET_PORT,
    path: targetUrl.pathname + targetUrl.search,
    method: req.method,
    headers: {
      ...req.headers,
      host: `${TARGET_HOST}:${TARGET_PORT}`,
    },
  };

  const client = TARGET_PROTOCOL === 'https' ? https : http;

  const proxyReq = client.request(options, (proxyRes) => {
    // Copy headers from Navidrome but OVERRIDE CORS headers
    const headers = { ...proxyRes.headers };
    
    // Remove any existing CORS headers from Navidrome
    delete headers['access-control-allow-origin'];
    delete headers['access-control-allow-methods'];
    delete headers['access-control-allow-headers'];
    delete headers['access-control-expose-headers'];
    
    // Add our CORS headers
    headers['Access-Control-Allow-Origin'] = '*';
    headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS';
    headers['Access-Control-Allow-Headers'] = 'Content-Type, Range, Authorization';
    headers['Access-Control-Expose-Headers'] = 'Content-Length, Content-Range, Content-Type';

    res.writeHead(proxyRes.statusCode, headers);
    proxyRes.pipe(res, { end: true });
  });

  proxyReq.on('error', (err) => {
    console.error('❌ Proxy error:', err.message);
    res.writeHead(502, { 'Content-Type': 'text/plain' });
    res.end('Bad Gateway: Could not connect to Navidrome');
  });

  // Pipe request body
  req.pipe(proxyReq, { end: true });
});

server.listen(PROXY_PORT, LISTEN_HOST, () => {
  console.log(`✅ CORS Proxy running on http://${LISTEN_HOST}:${PROXY_PORT}`);
  console.log(`\n💡 Update your app to use: http://localhost:${PROXY_PORT}`);
  console.log(`   (or http://<your-server-ip>:${PROXY_PORT} if running remotely)`);
  console.log(`\nPress Ctrl+C to stop\n`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n❌ Error: Port ${PROXY_PORT} is already in use`);
    console.error('   Stop the other process or choose a different port in .env\n');
  } else {
    console.error('\n❌ Server error:', err.message, '\n');
  }
  process.exit(1);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Shutting down CORS proxy...\n');
  server.close(() => {
    process.exit(0);
  });
});
