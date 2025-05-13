const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { initSocket } = require('./src/lib/socket');

const dev = process.env.NODE_ENV !== 'production';
const hostname = process.env.HOST || 'localhost';
const port = parseInt(process.env.PORT || '3000', 10);

// Create Next.js app
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  // Create HTTP server
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      const { pathname } = parsedUrl;

      // Handle API routes and static files
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error handling request:', err);
      res.statusCode = 500;
      res.end('Internal server error');
    }
  });

  // Initialize Socket.IO
  const io = initSocket(server);
  
  if (!io) {
    console.error('[Server] Failed to initialize Socket.IO');
    process.exit(1);
  }

  // Store io instance globally for server-side usage
  global.io = io;

  // Handle WebSocket upgrades
  server.on('upgrade', (req, socket, head) => {
    io.engine.handleUpgrade(req, socket, head);
  });

  // Start server
  server.listen(port, hostname, (err) => {
    if (err) throw err;
    console.log(`> Server ready on http://${hostname}:${port}`);
    console.log(`> Socket.IO available at ws://${hostname}:${port}/socket.io`);
  });

  // Error handling
  server.on('error', (err) => {
    console.error('Server error:', err);
    process.exit(1);
  });
}).catch((err) => {
  console.error('Server preparation failed:', err);
  process.exit(1);
});