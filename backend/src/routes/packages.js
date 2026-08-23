import { Router } from 'express';
import { getSession, withRetry, isDbConfigured } from '../config/db.js';
import { QUERIES } from '../services/cypherQueries.js';
import { LocalGraphEngine } from '../services/localGraphEngine.js';

const router = Router();

// GET /api/packages — list/search all packages
router.get('/', async (req, res, next) => {
  const { search, ecosystem, vulnerableOnly } = req.query;

  if (!isDbConfigured()) {
    let list = LocalGraphEngine.getAllPackages(search, ecosystem);
    if (vulnerableOnly === 'true') {
      list = list.filter((p) => p.directVulnCount > 0);
    }
    return res.json(list);
  }

  const session = getSession();
  try {
    const result = await withRetry(() => session.run(QUERIES.getAllPackages));
    let packages = result.records.map((r) => {
      const obj = r.toObject();
      return {
        name: obj.name,
        ecosystem: obj.ecosystem,
        versionCount: typeof obj.versionCount?.toInt === 'function' ? obj.versionCount.toInt() : Number(obj.versionCount || 0),
        directDepCount: typeof obj.directDepCount?.toInt === 'function' ? obj.directDepCount.toInt() : Number(obj.directDepCount || 0),
        directVulnCount: typeof obj.directVulnCount?.toInt === 'function' ? obj.directVulnCount.toInt() : Number(obj.directVulnCount || 0),
        severities: (obj.severities || []).filter(Boolean),
      };
    });

    if (search) {
      const q = search.toLowerCase();
      packages = packages.filter((p) => p.name.toLowerCase().includes(q));
    }
    if (ecosystem) {
      packages = packages.filter((p) => p.ecosystem?.toLowerCase() === ecosystem.toLowerCase());
    }
    if (vulnerableOnly === 'true') {
      packages = packages.filter((p) => p.directVulnCount > 0);
    }

    res.json(packages);
  } catch (err) {
    console.warn(`[Packages Query Fallback] ${err.message}`);
    let list = LocalGraphEngine.getAllPackages(search, ecosystem);
    if (vulnerableOnly === 'true') {
      list = list.filter((p) => p.directVulnCount > 0);
    }
    res.json(list);
  } finally {
    if (session) await session.close();
  }
});

// GET /api/packages/:name — package detail
router.get('/:name', async (req, res, next) => {
  const { name } = req.params;

  if (!isDbConfigured()) {
    const pkg = LocalGraphEngine.getPackageByName(name);
    if (!pkg) return res.status(404).json({ error: `Package '${name}' not found.` });
    return res.json(pkg);
  }

  const session = getSession();
  try {
    const result = await withRetry(() =>
      session.run(QUERIES.getPackageByName, { name })
    );

    if (result.records.length === 0) {
      const fallbackPkg = LocalGraphEngine.getPackageByName(name);
      if (fallbackPkg) return res.json(fallbackPkg);
      return res.status(404).json({ error: `Package '${name}' not found.` });
    }

    const record = result.records[0];
    const pkgData = {
      name: record.get('name'),
      ecosystem: record.get('ecosystem'),
      versions: record.get('versions') || [],
    };

    res.json(pkgData);
  } catch (err) {
    console.warn(`[Package Detail Fallback for ${name}] ${err.message}`);
    const pkg = LocalGraphEngine.getPackageByName(name);
    if (!pkg) return res.status(404).json({ error: `Package '${name}' not found.` });
    res.json(pkg);
  } finally {
    if (session) await session.close();
  }
});

// GET /api/packages/:name/dependents — multi-hop traversal (upstream packages)
router.get('/:name/dependents', async (req, res, next) => {
  const { name } = req.params;

  if (!isDbConfigured()) {
    const dependents = LocalGraphEngine.getTransitiveDependents(name, 4);
    return res.json(dependents);
  }

  const session = getSession();
  try {
    const result = await withRetry(() =>
      session.run(QUERIES.getTransitiveDependents, { name })
    );
    const dependents = result.records.map((r) => {
      const obj = r.toObject();
      return {
        name: obj.name,
        ecosystem: obj.ecosystem,
        hops: typeof obj.hops?.toInt === 'function' ? obj.hops.toInt() : Number(obj.hops || 1),
      };
    });
    res.json(dependents);
  } catch (err) {
    console.warn(`[Dependents Fallback for ${name}] ${err.message}`);
    res.json(LocalGraphEngine.getTransitiveDependents(name, 4));
  } finally {
    if (session) await session.close();
  }
});

// GET /api/packages/:name/dependencies — multi-hop traversal (downstream packages)
router.get('/:name/dependencies', async (req, res, next) => {
  const { name } = req.params;

  if (!isDbConfigured()) {
    const dependencies = LocalGraphEngine.getTransitiveDependencies(name, 4);
    return res.json(dependencies);
  }

  const session = getSession();
  try {
    const result = await withRetry(() =>
      session.run(QUERIES.getTransitiveDependencies, { name })
    );
    const dependencies = result.records.map((r) => {
      const obj = r.toObject();
      return {
        name: obj.name,
        ecosystem: obj.ecosystem,
        hops: typeof obj.hops?.toInt === 'function' ? obj.hops.toInt() : Number(obj.hops || 1),
      };
    });
    res.json(dependencies);
  } catch (err) {
    console.warn(`[Dependencies Fallback for ${name}] ${err.message}`);
    res.json(LocalGraphEngine.getTransitiveDependencies(name, 4));
  } finally {
    if (session) await session.close();
  }
});

// GET /api/packages/:name/graph — node-link graph centered on package
router.get('/:name/graph', async (req, res, next) => {
  const { name } = req.params;
  const graphData = LocalGraphEngine.getPackageGraphData(name);
  res.json(graphData);
});

export default router;
