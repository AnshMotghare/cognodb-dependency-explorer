// In-memory Graph Engine fallback when CognoDB connection is not configured or in offline test mode.
// Provides identical graph algorithm results (Shortest Path, Transitive Dependents, Maintainer Blast Radius).

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const packagesFilePath = path.join(__dirname, '../../seed/data/packages.json');

let cachedPackages = null;

function loadPackages() {
  if (!cachedPackages) {
    try {
      cachedPackages = JSON.parse(fs.readFileSync(packagesFilePath, 'utf-8'));
    } catch (err) {
      console.error('Failed to load packages.json:', err);
      cachedPackages = [];
    }
  }
  return cachedPackages;
}

export const LocalGraphEngine = {
  getAllPackages(search = '', ecosystem = '') {
    const pkgs = loadPackages();
    let results = pkgs.map((p) => {
      const versions = p.versions || [];
      const directDeps = new Set();
      const directVulns = [];

      versions.forEach((v) => {
        (v.dependsOn || []).forEach((d) => directDeps.add(d.split('@')[0]));
        (v.vulnerabilities || []).forEach((vu) => directVulns.push(vu));
      });

      return {
        name: p.name,
        ecosystem: p.ecosystem || 'npm',
        versionCount: versions.length,
        directDepCount: directDeps.size,
        directVulnCount: directVulns.length,
        severities: [...new Set(directVulns.map((v) => v.severity))],
        latestVersion: versions[versions.length - 1]?.version || '1.0.0',
        maintainers: [...new Set(versions.map((v) => v.maintainer).filter(Boolean))],
        licenses: [...new Set(versions.map((v) => v.license).filter(Boolean))],
      };
    });

    if (search) {
      const q = search.toLowerCase();
      results = results.filter((p) => p.name.toLowerCase().includes(q));
    }
    if (ecosystem) {
      results = results.filter((p) => p.ecosystem.toLowerCase() === ecosystem.toLowerCase());
    }

    return results;
  },

  getPackageByName(name) {
    const pkgs = loadPackages();
    const pkg = pkgs.find((p) => p.name === name);
    if (!pkg) return null;

    const formattedVersions = (pkg.versions || []).map((v) => {
      const maintainerEmail = v.maintainer || 'unknown@example.com';
      const maintainerName = maintainerEmail.split('@')[0].replace('.', ' ');

      const dependencies = (v.dependsOn || []).map((d) => {
        const [depName, depVer] = d.split('@');
        const targetPkg = pkgs.find((p) => p.name === depName);
        return {
          name: depName,
          versionRange: depVer || '*',
          ecosystem: targetPkg?.ecosystem || pkg.ecosystem || 'npm',
        };
      });

      return {
        version: v.version,
        releaseDate: v.releaseDate || '2024-01-01',
        maintainer: { name: maintainerName, email: maintainerEmail },
        license: { name: v.license || 'MIT', type: v.license || 'MIT' },
        dependencies,
        vulnerabilities: v.vulnerabilities || [],
      };
    });

    return {
      name: pkg.name,
      ecosystem: pkg.ecosystem || 'npm',
      versions: formattedVersions,
    };
  },

  getTransitiveDependents(name, maxHops = 4) {
    const pkgs = loadPackages();
    const upstreamMap = new Map(); // childName -> Set of parentNames

    pkgs.forEach((p) => {
      (p.versions || []).forEach((v) => {
        (v.dependsOn || []).forEach((dep) => {
          const depName = dep.split('@')[0];
          if (!upstreamMap.has(depName)) {
            upstreamMap.set(depName, new Set());
          }
          upstreamMap.get(depName).add(p.name);
        });
      });
    });

    // BFS upwards from `name`
    const visited = new Map(); // pkgName -> hops
    const queue = [{ name, hops: 0 }];

    while (queue.length > 0) {
      const { name: current, hops } = queue.shift();
      if (hops >= maxHops) continue;

      const upstreams = upstreamMap.get(current) || new Set();
      for (const parent of upstreams) {
        if (parent === name) continue;
        if (!visited.has(parent) || visited.get(parent) > hops + 1) {
          visited.set(parent, hops + 1);
          queue.push({ name: parent, hops: hops + 1 });
        }
      }
    }

    return Array.from(visited.entries()).map(([dependentName, hops]) => {
      const parentPkg = pkgs.find((p) => p.name === dependentName);
      return {
        name: dependentName,
        ecosystem: parentPkg?.ecosystem || 'npm',
        hops,
      };
    }).sort((a, b) => a.hops - b.hops || a.name.localeCompare(b.name));
  },

  getTransitiveDependencies(name, maxHops = 4) {
    const pkgs = loadPackages();
    const pkgMap = new Map(pkgs.map((p) => [p.name, p]));

    const visited = new Map(); // depName -> hops
    const queue = [{ name, hops: 0 }];

    while (queue.length > 0) {
      const { name: current, hops } = queue.shift();
      if (hops >= maxHops) continue;

      const pkg = pkgMap.get(current);
      if (!pkg) continue;

      (pkg.versions || []).forEach((v) => {
        (v.dependsOn || []).forEach((dep) => {
          const depName = dep.split('@')[0];
          if (depName === name) return;
          if (!visited.has(depName) || visited.get(depName) > hops + 1) {
            visited.set(depName, hops + 1);
            queue.push({ name: depName, hops: hops + 1 });
          }
        });
      });
    }

    return Array.from(visited.entries()).map(([depName, hops]) => {
      const depPkg = pkgMap.get(depName);
      return {
        name: depName,
        ecosystem: depPkg?.ecosystem || 'npm',
        hops,
      };
    }).sort((a, b) => a.hops - b.hops || a.name.localeCompare(b.name));
  },

  getShortestPathToVuln(rootName, maxHops = 6) {
    const pkgs = loadPackages();
    const pkgMap = new Map(pkgs.map((p) => [p.name, p]));
    const rootPkg = pkgMap.get(rootName);
    if (!rootPkg) return [];

    // Find all paths to packages that have vulnerabilities
    // BFS tracking full path of packages
    const results = [];
    const queue = [{ currentName: rootName, path: [rootName], hops: 0 }];
    const visited = new Set([rootName]);

    while (queue.length > 0) {
      const { currentName, path: currentPath, hops } = queue.shift();
      const currentPkg = pkgMap.get(currentName);
      if (!currentPkg) continue;

      // Check if currentPkg has any vulnerabilities
      (currentPkg.versions || []).forEach((v) => {
        (v.vulnerabilities || []).forEach((vuln) => {
          results.push({
            cveId: vuln.cveId,
            severity: vuln.severity,
            description: vuln.description,
            hops,
            vulnerablePackage: currentName,
            vulnerableVersion: v.version,
            path: [...currentPath],
          });
        });
      });

      if (hops >= maxHops) continue;

      // Expand downstream dependencies
      (currentPkg.versions || []).forEach((v) => {
        (v.dependsOn || []).forEach((dep) => {
          const depName = dep.split('@')[0];
          if (!visited.has(depName)) {
            visited.add(depName);
            queue.push({
              currentName: depName,
              path: [...currentPath, depName],
              hops: hops + 1,
            });
          }
        });
      });
    }

    // Sort by hops ascending, then severity
    const severityRank = { CRITICAL: 1, HIGH: 2, MEDIUM: 3, LOW: 4 };
    return results.sort((a, b) => {
      if (a.hops !== b.hops) return a.hops - b.hops;
      return (severityRank[a.severity] || 5) - (severityRank[b.severity] || 5);
    });
  },

  getMaintainerBlastRadius() {
    const pkgs = loadPackages();
    const maintainerDirectMap = new Map(); // email -> Set of pkgNames

    pkgs.forEach((p) => {
      (p.versions || []).forEach((v) => {
        if (v.maintainer) {
          if (!maintainerDirectMap.has(v.maintainer)) {
            maintainerDirectMap.set(v.maintainer, new Set());
          }
          maintainerDirectMap.get(v.maintainer).add(p.name);
        }
      });
    });

    const results = [];
    maintainerDirectMap.forEach((directPkgsSet, email) => {
      const directPkgs = Array.from(directPkgsSet);
      const allDownstream = new Set();

      directPkgs.forEach((pkgName) => {
        const dependents = LocalGraphEngine.getTransitiveDependents(pkgName, 4);
        dependents.forEach((d) => {
          if (!directPkgsSet.has(d.name)) {
            allDownstream.add(d.name);
          }
        });
      });

      const maintainerName = email.split('@')[0].replace('.', ' ');
      results.push({
        maintainer: maintainerName,
        email,
        directPackages: directPkgs.length,
        packagesAffected: allDownstream.size,
        totalReach: directPkgs.length + allDownstream.size,
        packages: directPkgs,
        downstreamPackagesList: Array.from(allDownstream),
      });
    });

    return results.sort((a, b) => b.packagesAffected - a.packagesAffected || b.directPackages - a.directPackages);
  },

  getAllVulnerabilities() {
    const pkgs = loadPackages();
    const vulnsMap = new Map();

    pkgs.forEach((p) => {
      (p.versions || []).forEach((v) => {
        (v.vulnerabilities || []).forEach((vu) => {
          if (!vulnsMap.has(vu.cveId)) {
            vulnsMap.set(vu.cveId, {
              cveId: vu.cveId,
              severity: vu.severity,
              description: vu.description,
              affectedPackages: new Set(),
              affectedVersions: [],
            });
          }
          const item = vulnsMap.get(vu.cveId);
          item.affectedPackages.add(p.name);
          item.affectedVersions.push({ package: p.name, version: v.version });
        });
      });
    });

    const results = [];
    vulnsMap.forEach((val) => {
      const directPkgs = Array.from(val.affectedPackages);
      const allDownstream = new Set();

      directPkgs.forEach((pkgName) => {
        const deps = LocalGraphEngine.getTransitiveDependents(pkgName, 4);
        deps.forEach((d) => allDownstream.add(d.name));
      });

      results.push({
        cveId: val.cveId,
        severity: val.severity,
        description: val.description,
        directlyAffectedPackages: directPkgs,
        directCount: directPkgs.length,
        downstreamCount: allDownstream.size,
        totalBlastRadius: directPkgs.length + allDownstream.size,
        affectedVersions: val.affectedVersions,
      });
    });

    const severityRank = { CRITICAL: 1, HIGH: 2, MEDIUM: 3, LOW: 4 };
    return results.sort((a, b) => {
      const diff = (severityRank[a.severity] || 5) - (severityRank[b.severity] || 5);
      if (diff !== 0) return diff;
      return b.totalBlastRadius - a.totalBlastRadius;
    });
  },

  getStats() {
    const pkgs = loadPackages();
    let versionCount = 0;
    let depCount = 0;
    const maintainers = new Set();
    const licenses = new Set();
    const vulns = new Set();
    let criticalVulns = 0;

    pkgs.forEach((p) => {
      (p.versions || []).forEach((v) => {
        versionCount++;
        if (v.maintainer) maintainers.add(v.maintainer);
        if (v.license) licenses.add(v.license);
        (v.dependsOn || []).forEach(() => depCount++);
        (v.vulnerabilities || []).forEach((vu) => {
          vulns.add(vu.cveId);
          if (vu.severity === 'CRITICAL') criticalVulns++;
        });
      });
    });

    return {
      packageCount: pkgs.length,
      versionCount,
      maintainerCount: maintainers.size,
      vulnCount: vulns.size,
      criticalVulnCount: criticalVulns,
      dependencyCount: depCount,
      licenseCount: licenses.size,
    };
  },

  getPackageGraphData(name) {
    const pkgs = loadPackages();
    const pkgMap = new Map(pkgs.map((p) => [p.name, p]));
    const root = pkgMap.get(name);
    if (!root) return { nodes: [], links: [] };

    const nodes = new Map();
    const links = [];

    // Helper to add node
    function addNode(id, label, type, extra = {}) {
      if (!nodes.has(id)) {
        nodes.set(id, { id, label, type, ...extra });
      }
    }

    // Root package node
    addNode(root.name, root.name, 'Package', { ecosystem: root.ecosystem, isRoot: true });

    (root.versions || []).forEach((v) => {
      const verId = `${root.name}@${v.version}`;
      addNode(verId, `v${v.version}`, 'Version', { version: v.version, releaseDate: v.releaseDate });
      links.push({ source: root.name, target: verId, label: 'HAS_VERSION' });

      if (v.maintainer) {
        addNode(v.maintainer, v.maintainer.split('@')[0], 'Maintainer', { email: v.maintainer });
        links.push({ source: verId, target: v.maintainer, label: 'MAINTAINED_BY' });
      }

      if (v.license) {
        addNode(`license-${v.license}`, v.license, 'License');
        links.push({ source: verId, target: `license-${v.license}`, label: 'LICENSED_UNDER' });
      }

      (v.vulnerabilities || []).forEach((vu) => {
        addNode(vu.cveId, vu.cveId, 'Vulnerability', { severity: vu.severity, description: vu.description });
        links.push({ source: verId, target: vu.cveId, label: 'AFFECTED_BY' });
      });

      (v.dependsOn || []).forEach((dep) => {
        const [depName, depVer] = dep.split('@');
        const depPkg = pkgMap.get(depName);
        addNode(depName, depName, 'Package', { ecosystem: depPkg?.ecosystem || 'npm' });
        links.push({ source: verId, target: depName, label: 'DEPENDS_ON', versionRange: depVer });

        // If dep has vulnerabilities, link them for 2-hop insight
        if (depPkg) {
          (depPkg.versions || []).forEach((dv) => {
            (dv.vulnerabilities || []).forEach((dvu) => {
              addNode(dvu.cveId, dvu.cveId, 'Vulnerability', { severity: dvu.severity, description: dvu.description });
              links.push({ source: depName, target: dvu.cveId, label: 'AFFECTED_BY' });
            });
          });
        }
      });
    });

    // Also include incoming 1-hop dependents
    const dependents = LocalGraphEngine.getTransitiveDependents(name, 1);
    dependents.slice(0, 8).forEach((dep) => {
      addNode(dep.name, dep.name, 'Package', { ecosystem: dep.ecosystem, isDependent: true });
      links.push({ source: dep.name, target: root.name, label: 'DEPENDS_ON' });
    });

    return {
      nodes: Array.from(nodes.values()),
      links,
    };
  },

  getFullGraphOverview(limit = 60, filterEcosystem = null) {
    const allPkgs = loadPackages();
    const pkgMap = new Map(allPkgs.map((p) => [p.name, p]));
    let pkgs = allPkgs;
    if (filterEcosystem) {
      pkgs = pkgs.filter((p) => p.ecosystem?.toLowerCase() === filterEcosystem.toLowerCase());
    }
    pkgs = pkgs.slice(0, limit);
    const nodes = new Map();
    const links = [];

    pkgs.forEach((p) => {
      nodes.set(p.name, { id: p.name, label: p.name, type: 'Package', ecosystem: p.ecosystem });
      (p.versions || []).forEach((v) => {
        (v.dependsOn || []).forEach((dep) => {
          const depName = dep.split('@')[0];
          const depPkg = pkgMap.get(depName);
          if (!filterEcosystem || depPkg?.ecosystem?.toLowerCase() === filterEcosystem.toLowerCase()) {
            if (!nodes.has(depName)) {
              nodes.set(depName, { id: depName, label: depName, type: 'Package', ecosystem: depPkg?.ecosystem });
            }
            links.push({ source: p.name, target: depName, label: 'DEPENDS_ON' });
          }
        });

        (v.vulnerabilities || []).forEach((vu) => {
          if (!nodes.has(vu.cveId)) {
            nodes.set(vu.cveId, { id: vu.cveId, label: vu.cveId, type: 'Vulnerability', severity: vu.severity });
          }
          links.push({ source: p.name, target: vu.cveId, label: 'AFFECTED_BY' });
        });
      });
    });

    return {
      nodes: Array.from(nodes.values()),
      links,
    };
  },

  simulateQuarantine(targetType, targetName) {
    const allPkgs = loadPackages();
    const pkgMap = new Map(allPkgs.map((p) => [p.name, p]));
    const target = targetName.trim().toLowerCase();

    let compromisedRoots = [];
    if (targetType === 'maintainer') {
      allPkgs.forEach((p) => {
        const hasMaintainer = (p.versions || []).some((v) =>
          v.maintainer?.toLowerCase().includes(target)
        );
        if (hasMaintainer) compromisedRoots.push(p.name);
      });
    } else {
      const match = allPkgs.find((p) => p.name.toLowerCase() === target);
      if (match) compromisedRoots.push(match.name);
    }

    if (compromisedRoots.length === 0) {
      return {
        targetType,
        targetName,
        compromisedRoots: [],
        severedPackages: [],
        disruptionScore: 0,
        message: `No active registry entities matched "${targetName}".`,
      };
    }

    // BFS upstream traversal across all reverse dependencies
    const upstreamAdjacency = new Map();
    allPkgs.forEach((p) => {
      (p.versions || []).forEach((v) => {
        (v.dependsOn || []).forEach((dep) => {
          const depName = dep.split('@')[0];
          if (!upstreamAdjacency.has(depName)) {
            upstreamAdjacency.set(depName, new Set());
          }
          upstreamAdjacency.get(depName).add(p.name);
        });
      });
    });

    const severedSet = new Set(compromisedRoots);
    const queue = compromisedRoots.map((name) => ({ name, depth: 0 }));
    const depthMap = new Map(compromisedRoots.map((name) => [name, 0]));

    while (queue.length > 0) {
      const { name, depth } = queue.shift();
      const callers = upstreamAdjacency.get(name) || new Set();

      for (const caller of callers) {
        if (!severedSet.has(caller)) {
          severedSet.add(caller);
          depthMap.set(caller, depth + 1);
          queue.push({ name: caller, depth: depth + 1 });
        }
      }
    }

    const severedPackages = Array.from(severedSet).map((name) => {
      const p = pkgMap.get(name);
      return {
        name,
        ecosystem: p?.ecosystem || 'npm',
        depth: depthMap.get(name) || 0,
        isRootQuarantined: compromisedRoots.includes(name),
        latestVersion: p?.versions?.[p?.versions.length - 1]?.version || '1.0.0',
      };
    });

    severedPackages.sort((a, b) => a.depth - b.depth || a.name.localeCompare(b.name));
    const maxPossible = Math.max(allPkgs.length, 1);
    const disruptionScore = Math.min(100, Math.round((severedPackages.length / maxPossible) * 100));

    return {
      targetType,
      targetName,
      compromisedRoots,
      severedCount: severedPackages.length,
      disruptionScore,
      severedPackages,
      timestamp: new Date().toISOString(),
    };
  },

  getRemediationRecommendations(packageName) {
    const shortestPaths = this.getShortestPathToVuln(packageName);
    const allPkgs = loadPackages();
    const pkgMap = new Map(allPkgs.map((p) => [p.name, p]));

    if (!shortestPaths || shortestPaths.length === 0) {
      return {
        packageName,
        isVulnerable: false,
        remediations: [],
        message: 'No vulnerable transitive paths detected. Package is clean.',
      };
    }

    const remediations = shortestPaths.map((sp) => {
      const pathNodes = sp.path || [];
      const vulnerableDep = pathNodes.length > 1 ? pathNodes[pathNodes.length - 1] : packageName;
      const intermediateHop = pathNodes.length > 2 ? pathNodes[1] : vulnerableDep;

      const vulnPkg = pkgMap.get(vulnerableDep);
      const intermediatePkg = pkgMap.get(intermediateHop);

      return {
        cveId: sp.cveId,
        severity: sp.severity,
        vulnerableDependency: vulnerableDep,
        intermediateDependency: intermediateHop,
        hopsAway: sp.hops || pathNodes.length - 1,
        path: pathNodes,
        recommendedAction: `Upgrade direct dependency "${intermediateHop}" or pin "${vulnerableDep}" to a patched version with resolved ${sp.cveId}.`,
        suggestedFix: {
          package: intermediateHop,
          currentVersion: intermediatePkg?.versions?.[0]?.version || '1.0.0',
          targetVersion: 'latest-secure (≥ 2.0.0)',
          breakingChangeRisk: sp.hops > 2 ? 'Low (Transitive isolation)' : 'Medium (Review API changes)',
        },
      };
    });

    return {
      packageName,
      isVulnerable: true,
      remediations,
    };
  },

  executeLocalCypher(query) {
    const q = query.trim().toUpperCase();
    const allPkgs = loadPackages();

    if (q.includes('COUNT') || q.includes('STATS')) {
      const stats = this.getStats();
      return {
        columns: ['packageCount', 'versionCount', 'maintainerCount', 'vulnCount', 'dependencyCount'],
        records: [stats],
      };
    }

    if (q.includes('MAINTAINER') || q.includes('BLAST')) {
      const rankings = this.getMaintainerBlastRadius();
      return {
        columns: ['maintainer', 'email', 'directPackages', 'packagesAffected', 'totalReach'],
        records: rankings.slice(0, 15),
      };
    }

    if (q.includes('VULNERABILITY') || q.includes('CVE')) {
      const vulns = this.getAllVulnerabilities();
      return {
        columns: ['cveId', 'severity', 'description', 'directCount', 'downstreamCount', 'totalBlastRadius'],
        records: vulns.slice(0, 15),
      };
    }

    // Default package list
    const pkgs = this.getAllPackages().slice(0, 15);
    return {
      columns: ['name', 'ecosystem', 'versionCount', 'directDepCount', 'directVulnCount', 'latestVersion'],
      records: pkgs,
    };
  },
};
