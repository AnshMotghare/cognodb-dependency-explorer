// Central place for the CognoDB (Bolt) driver connection.
// Configured with keep-alive, liveness checks, and connection lifetime management
// to prevent cloud load-balancer idle drops (ECONNRESET).

import neo4j from 'neo4j-driver';
import 'dotenv/config';

const { COGNODB_URI, COGNODB_USER, COGNODB_PASSWORD } = process.env;

let driver = null;
const isConfigured = Boolean(
  COGNODB_URI &&
  COGNODB_USER &&
  COGNODB_PASSWORD &&
  !COGNODB_URI.includes('<instance-id>')
);

if (isConfigured) {
  try {
    driver = neo4j.driver(
      COGNODB_URI,
      neo4j.auth.basic(COGNODB_USER, COGNODB_PASSWORD),
      {
        maxConnectionPoolSize: 50,
        // Proactively cycle connections every 30s to prevent cloud NAT idle drops
        maxConnectionLifetime: 30 * 1000,
        // Validate connection health before acquiring from pool
        connectionLivenessCheckTimeout: 1000,
        connectionAcquisitionTimeout: 15000,
        connectionTimeout: 15000,
        disableLosslessIntegers: true,
      }
    );
    console.log(`[CognoDB] Initialized driver with keep-alive for ${COGNODB_URI}`);
  } catch (err) {
    console.warn(`[CognoDB] Driver init warning: ${err.message}`);
  }
} else {
  console.warn(
    '[CognoDB] Connection details not found in .env. Using local graph engine fallback.'
  );
}

// Resilient retry wrapper with exponential backoff
export async function withRetry(fn, retries = 3, delayMs = 400) {
  let lastErr;
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      const isTransient =
        err.message?.includes('ECONNRESET') ||
        err.message?.includes('Socket closed') ||
        err.message?.includes('Connection lost') ||
        err.code === 'ServiceUnavailable' ||
        err.code === 'SessionExpired';

      if (attempt < retries && isTransient) {
        console.warn(`[CognoDB] Transient connection issue (attempt ${attempt}/${retries}): ${err.message}. Retrying...`);
        await new Promise((res) => setTimeout(res, delayMs * attempt));
      } else if (attempt < retries) {
        await new Promise((res) => setTimeout(res, delayMs));
      }
    }
  }
  throw lastErr;
}

// Safe session generator
export function getSession() {
  if (driver) {
    return driver.session();
  }
  return null;
}

export function isDbConfigured() {
  return isConfigured && driver !== null;
}

export async function verifyConnectivity() {
  if (!driver) {
    return { status: 'mock_mode', message: 'Running with local graph engine fallback' };
  }
  return withRetry(() => driver.getServerInfo());
}

export async function closeDriver() {
  if (driver) {
    await driver.close();
  }
}

export default driver;
