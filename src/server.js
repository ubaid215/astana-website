const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { initSocket } = require('./lib/socket');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = 3000;
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    console.log(`[Server] Handling request: ${req.method} ${req.url}`);
    handle(req, res, parsedUrl);
  });

  // Initialize Socket.io
  try {
    const io = initSocket(server);
    io.on('connection', (socket) => {
      console.log('[Socket.io] Client connected:', socket.id);
    });
  } catch (error) {
    console.error('[Socket.io] Initialization failed:', error.message);
  }

  server.listen(port, (err) => {
    if (err) {
      console.error('[Server] Failed to start:', err.message);
      throw err;
    }
    console.log(`[Server] Running on http://${hostname}:${port}`);
    console.log(`[Socket.io] Expected on http://${hostname}:${port}/socket.io`);
  });
}).catch((err) => {
  console.error('[Server] Preparation failed:', err.message);
  process.exit(1);
});