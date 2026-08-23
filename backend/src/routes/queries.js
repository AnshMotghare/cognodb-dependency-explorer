import { Router } from 'express';
import { getSession, withRetry, isDbConfigured } from '../config/db.js';
import { QUERIES } from '../services/cypherQueries.js';
import { LocalGraphEngine } from '../services/localGraphEngine.js';

const router = Router();

// GET /api/queries/status — connectivity status
router.get('/status', (req, res) => {
  res.json({
    database: isDbConfigured() ? 'CognoDB (Bolt Connected)' : 'Local Graph Engine Fallback',
    isLive: isDbConfigured(),
  });
});

// GET /api/queries/stats — system stats
router.get('/stats', async (req, res, next) => {
  if (!isDbConfigured()) {
    return res.json(LocalGraphEngine.getStats());
  }

  const session = getSession();
  try {
    const result = await withRetry(() => session.run(QUERIES.getStats));
    if (result.records.length > 0) {
      const rec = result.records[0];
      const toNum = (val) => (typeof val?.toInt === 'function' ? val.toInt() : Number(val || 0));
      res.json({
        packageCount: toNum(rec.get('packageCount')),
        versionCount: toNum(rec.get('versionCount')),
        maintainerCount: toNum(rec.get('maintainerCount')),
        vulnCount: toNum(rec.get('vulnCount')),
        dependencyCount: toNum(rec.get('dependencyCount')),
      });
    } else {
      res.json(LocalGraphEngine.getStats());
    }
  } catch (err) {
    console.warn(`[Stats Query Fallback] ${err.message}`);
    res.json(LocalGraphEngine.getStats());
  } finally {
    if (session) await session.close();
  }
});

// GET /api/queries/shortest-path/:name — SQL-awkward shortest-path query
router.get('/shortest-path/:name', async (req, res, next) => {
  const { name } = req.params;

  if (!isDbConfigured()) {
    const paths = LocalGraphEngine.getShortestPathToVuln(name);
    return res.json(paths);
  }

  const session = getSession();
  try {
    const result = await withRetry(() =>
      session.run(QUERIES.shortestPathToVulnerability, { rootName: name })
    );

    const paths = result.records.map((r) => {
      const obj = r.toObject();
      return {
        path: obj.path || [name],
        cveId: obj.cveId,
        severity: obj.severity,
        description: obj.description,
        hops: typeof obj.hops?.toInt === 'function' ? obj.hops.toInt() : Number(obj.hops || 1),
      };
    });

    res.json(paths);
  } catch (err) {
    console.warn(`[ShortestPath Query Fallback for ${name}] ${err.message}`);
    res.json(LocalGraphEngine.getShortestPathToVuln(name));
  } finally {
    if (session) await session.close();
  }
});

// GET /api/queries/blast-radius — maintainer blast radius ranking
router.get('/blast-radius', async (req, res, next) => {
  if (!isDbConfigured()) {
    return res.json(LocalGraphEngine.getMaintainerBlastRadius());
  }

  const session = getSession();
  try {
    const result = await withRetry(() => session.run(QUERIES.maintainerBlastRadius));
    const rankings = result.records.map((r) => {
      const obj = r.toObject();
      const toNum = (val) => (typeof val?.toInt === 'function' ? val.toInt() : Number(val || 0));
      return {
        maintainer: obj.maintainer,
        email: obj.email,
        directPackages: toNum(obj.directPackages),
        packagesAffected: toNum(obj.packagesAffected),
        totalReach: toNum(obj.totalReach),
        packages: obj.packages || [],
      };
    });
    res.json(rankings);
  } catch (err) {
    console.warn(`[BlastRadius Query Fallback] ${err.message}`);
    res.json(LocalGraphEngine.getMaintainerBlastRadius());
  } finally {
    if (session) await session.close();
  }
});

// GET /api/queries/vulnerabilities — all CVEs with direct and downstream impact
router.get('/vulnerabilities', async (req, res, next) => {
  if (!isDbConfigured()) {
    return res.json(LocalGraphEngine.getAllVulnerabilities());
  }

  const session = getSession();
  try {
    const result = await withRetry(() => session.run(QUERIES.getAllVulnerabilities));
    const toNum = (val) => (typeof val?.toInt === 'function' ? val.toInt() : Number(val || 0));

    const vulns = result.records.map((r) => {
      const obj = r.toObject();
      return {
        cveId: obj.cveId,
        severity: obj.severity,
        description: obj.description,
        directlyAffectedPackages: obj.directlyAffectedPackages || [],
        directCount: toNum(obj.directCount),
        downstreamCount: toNum(obj.downstreamCount),
        totalBlastRadius: toNum(obj.totalBlastRadius),
      };
    });
    res.json(vulns);
  } catch (err) {
    console.warn(`[Vulnerabilities Query Fallback] ${err.message}`);
    res.json(LocalGraphEngine.getAllVulnerabilities());
  } finally {
    if (session) await session.close();
  }
});

// GET /api/queries/full-graph — entire graph overview dataset
router.get('/full-graph', async (req, res, next) => {
  const limit = parseInt(req.query.limit || '50', 10);
  const ecosystem = req.query.ecosystem;
  const data = LocalGraphEngine.getFullGraphOverview(limit, ecosystem);
  res.json(data);
});

// POST /api/queries/cypher — live openCypher query executor with timing
router.post('/cypher', async (req, res, next) => {
  const { query, params = {} } = req.body;
  if (!query || typeof query !== 'string') {
    return res.status(400).json({ error: 'Query string is required.' });
  }

  // Safety guardrail: reject destructive writes
  const upper = query.toUpperCase();
  if (upper.includes('CREATE') || upper.includes('DELETE') || upper.includes('DROP') || upper.includes('SET ')) {
    return res.status(403).json({ error: 'Read-only mode: Only MATCH / RETURN queries are permitted in the public console.' });
  }

  const startTime = performance.now();

  if (!isDbConfigured()) {
    const localResult = LocalGraphEngine.executeLocalCypher(query);
    const duration = Math.round(performance.now() - startTime);
    return res.json({
      query,
      executionTimeMs: Math.max(duration, 1),
      engine: 'Local Graph Engine (Fallback)',
      columns: localResult.columns || [],
      records: localResult.records || [],
      rowCount: localResult.records?.length || 0,
    });
  }

  const session = getSession();
  try {
    const result = await withRetry(() => session.run(query, params));
    const duration = Math.round(performance.now() - startTime);

    const columns = result.records.length > 0 ? result.records[0].keys : [];
    const records = result.records.map((r) => {
      const row = {};
      columns.forEach((col) => {
        const val = r.get(col);
        if (typeof val?.toInt === 'function') {
          row[col] = val.toInt();
        } else if (val && typeof val === 'object' && val.properties) {
          row[col] = val.properties;
        } else {
          row[col] = val;
        }
      });
      return row;
    });

    res.json({
      query,
      executionTimeMs: duration,
      engine: 'CognoDB (Bolt Protocol)',
      columns,
      records,
      rowCount: records.length,
    });
  } catch (err) {
    const duration = Math.round(performance.now() - startTime);
    res.status(400).json({
      error: err.message,
      executionTimeMs: duration,
      engine: 'CognoDB',
    });
  } finally {
    if (session) await session.close();
  }
});

// POST /api/queries/simulate-quarantine — blast radius cascading failure sandbox
router.post('/simulate-quarantine', async (req, res, next) => {
  const { targetType = 'package', targetName = '' } = req.body;
  if (!targetName) {
    return res.status(400).json({ error: 'targetName is required for simulation.' });
  }

  const result = LocalGraphEngine.simulateQuarantine(targetType, targetName);
  res.json(result);
});

// GET /api/queries/remediation/:name — automated vulnerability patch recommender
router.get('/remediation/:name', async (req, res, next) => {
  const { name } = req.params;
  const recommendations = LocalGraphEngine.getRemediationRecommendations(name);
  res.json(recommendations);
});

export default router;
