// Production server entry point for cPanel "Setup Node.js App".
// Set "Application startup file" to: server.js
//
// NOTE: Some hosts (Passenger / CloudLinux) spawn the app with a working
// directory that is NOT the app folder. The database path in src/lib/db.ts is
// resolved relative to process.cwd(), so we pin cwd to the app root here.
process.chdir(__dirname);
process.env.APP_ROOT = __dirname;

const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');

const port = parseInt(process.env.PORT, 10) || 3000;
const app = next({ dev: false, dir: __dirname });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Request error:', err);
      res.statusCode = 500;
      res.end('Internal Server Error');
    }
  }).listen(port, () => {
    console.log('> Ready on port ' + port);
  });
});
