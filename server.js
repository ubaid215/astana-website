const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { initSocket } = require('./src/lib/socket');

const dev = process.env.NODE_ENV !== 'production';
const hostname = process.env.HOST || '0.0.0.0';
const port = parseInt(process.env.PORT || '3000', 10);

const app = next({ dev, hostname: dev ? hostname : undefined, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  });

  // Initialize Socket.IO
  const io = initSocket(server);
  if (!io) {
    console.error('[Server] Failed to initialize Socket.IO');
    process.exit(1);
  }

  // Store globally
  global.io = io;

  // Start the HTTP server
  server.listen(port, hostname, (err) => {
    if (err) throw err;
    console.log(`> Environment: ${process.env.NODE_ENV}`);
    console.log(`> Server ready on http://${hostname}:${port}`);
    console.log(`> Socket.IO initialized successfully`);
  });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    server.close(() => {
      console.log('Server closed');
      process.exit(0);
    });
  });

  server.on('error', (err) => {
    console.error('Server error:', err);
    process.exit(1);
  });
}).catch((err) => {
  console.error('Server preparation failed:', err);
  process.exit(1);
});