import app from './app.js';
import { verifyConnectivity } from './config/db.js';

const PORT = process.env.PORT || 4000;

async function start() {
  try {
    await verifyConnectivity();
    console.log('Connected to CognoDB.');
  } catch (err) {
    console.error('Could not reach CognoDB at startup:', err.message);
    console.error('Server will still start — routes will retry on each request.');
  }

  const server = app.listen(PORT, () => {
    console.log(`API listening on port ${PORT}`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`\n[Server Error] Port ${PORT} is already in use by another running instance.`);
      console.error(`Please close the other process or run on a different port: PORT=4001 npm start\n`);
    } else {
      console.error('[Server Error]', err.message);
    }
    process.exit(1);
  });
}

start();
