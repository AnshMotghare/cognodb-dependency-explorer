// All Cypher queries live here, in one place, so it is easy to review,
// optimize, test, and defend query-by-query.
// Every query is strictly parameterized — never string-concatenated.

export const QUERIES = {
  // 1. Single package lookup with its versions, maintainers, licenses,
  // direct dependencies, and direct vulnerabilities
  getPackageByName: `
    MATCH (p:Package {name: $name})
    OPTIONAL MATCH (p)-[:HAS_VERSION]->(v:Version)
    OPTIONAL MATCH (v)-[:MAINTAINED_BY]->(m:Maintainer)
    OPTIONAL MATCH (v)-[:LICENSED_UNDER]->(l:License)
    OPTIONAL MATCH (v)-[depRel:DEPENDS_ON]->(dep:Package)
    OPTIONAL MATCH (v)-[:AFFECTED_BY]->(vuln:Vulnerability)
    WITH p, v, m, l,
         collect(DISTINCT { name: dep.name, ecosystem: dep.ecosystem, versionRange: depRel.versionRange }) AS rawDeps,
         collect(DISTINCT { cveId: vuln.cveId, severity: vuln.severity, description: vuln.description }) AS rawVulns
    WITH p, collect({
      version: v.version,
      releaseDate: v.releaseDate,
      maintainer: { name: m.name, email: m.email },
      license: { name: l.name, type: l.type },
      dependencies: [d IN rawDeps WHERE d.name IS NOT NULL],
      vulnerabilities: [vu IN rawVulns WHERE vu.cveId IS NOT NULL]
    }) AS rawVersions
    RETURN p.name AS name,
           p.ecosystem AS ecosystem,
           [ver IN rawVersions WHERE ver.version IS NOT NULL] AS versions
  `,

  // 2. MULTI-HOP TRAVERSAL (1..4 hops): Upstream packages that transitively
  // depend on the given package.
  getTransitiveDependents: `
    MATCH path = (dependent:Package)-[:HAS_VERSION]->(:Version)-[:DEPENDS_ON*1..4]->(p:Package {name: $name})
    WITH dependent, min(length(path)) AS hops
    RETURN DISTINCT dependent.name AS name, dependent.ecosystem AS ecosystem, hops
    ORDER BY hops ASC, dependent.name ASC
  `,

  // 3. MULTI-HOP TRAVERSAL (1..4 hops): Downstream packages that this
  // package transitively depends upon.
  getTransitiveDependencies: `
    MATCH path = (p:Package {name: $name})-[:HAS_VERSION]->(:Version)-[:DEPENDS_ON*1..4]->(dependency:Package)
    WITH dependency, min(length(path)) AS hops
    RETURN DISTINCT dependency.name AS name, dependency.ecosystem AS ecosystem, hops
    ORDER BY hops ASC, dependency.name ASC
  `,

  // 4. SQL-AWKWARD QUERY: Shortest path from any version of the root package
  // to reachable vulnerabilities across the dependency graph.
  shortestPathToVulnerability: `
    MATCH (root:Package {name: $rootName})
    MATCH (targetVer:Version)-[:AFFECTED_BY]->(vuln:Vulnerability)
    MATCH (targetPkg:Package)-[:HAS_VERSION]->(targetVer)
    MATCH path = shortestPath((root)-[:HAS_VERSION|DEPENDS_ON*0..12]->(targetPkg))
    WITH [n IN nodes(path) WHERE n:Package | n.name] AS pkgPath,
         vuln, targetPkg, targetVer, length(path) AS pathLen
    RETURN DISTINCT pkgPath AS path,
           vuln.cveId AS cveId,
           vuln.severity AS severity,
           vuln.description AS description,
           targetPkg.name AS vulnerablePackage,
           targetVer.version AS vulnerableVersion,
           toInteger(pathLen / 2) AS hops
    ORDER BY hops ASC,
      CASE vuln.severity
        WHEN 'CRITICAL' THEN 1
        WHEN 'HIGH' THEN 2
        WHEN 'MEDIUM' THEN 3
        ELSE 4
      END
    LIMIT 10
  `,

  // 5. BLAST-RADIUS QUERY: Which maintainers, if their credentials are compromised,
  // impact the highest number of downstream packages across the supply chain.
  maintainerBlastRadius: `
    MATCH (m:Maintainer)<-[:MAINTAINED_BY]-(:Version)<-[:HAS_VERSION]-(p:Package)
    WITH m, collect(DISTINCT p) AS directPkgs, collect(DISTINCT p.name) AS pkgNames
    OPTIONAL MATCH (downstream:Package)-[:HAS_VERSION]->(:Version)-[:DEPENDS_ON*1..4]->(target)
    WHERE target IN directPkgs AND downstream <> target
    RETURN m.name AS maintainer,
           m.email AS email,
           size(directPkgs) AS directPackages,
           count(DISTINCT downstream) AS packagesAffected,
           (size(directPkgs) + count(DISTINCT downstream)) AS totalReach,
           pkgNames AS packages
    ORDER BY packagesAffected DESC, directPackages DESC
    LIMIT 20
  `,

  // 6. All packages with aggregated counts for search and overview
  getAllPackages: `
    MATCH (p:Package)
    OPTIONAL MATCH (p)-[:HAS_VERSION]->(v:Version)
    OPTIONAL MATCH (v)-[:AFFECTED_BY]->(vuln:Vulnerability)
    OPTIONAL MATCH (v)-[:DEPENDS_ON]->(dep:Package)
    RETURN p.name AS name,
           p.ecosystem AS ecosystem,
           count(DISTINCT v) AS versionCount,
           count(DISTINCT dep) AS directDepCount,
           count(DISTINCT vuln) AS directVulnCount,
           collect(DISTINCT vuln.severity) AS severities
    ORDER BY p.name ASC
  `,

  // 7. All CVE Vulnerabilities with total blast radius (direct + downstream)
  getAllVulnerabilities: `
    MATCH (vuln:Vulnerability)
    OPTIONAL MATCH (ver:Version)-[:AFFECTED_BY]->(vuln)
    OPTIONAL MATCH (p:Package)-[:HAS_VERSION]->(ver)
    WITH vuln, collect(DISTINCT p) AS directPkgs, collect(DISTINCT p.name) AS directPkgNames
    OPTIONAL MATCH (upstream:Package)-[:HAS_VERSION]->(:Version)-[:DEPENDS_ON*1..4]->(target)
    WHERE target IN directPkgs AND upstream <> target
    RETURN vuln.cveId AS cveId,
           vuln.severity AS severity,
           vuln.description AS description,
           directPkgNames AS directlyAffectedPackages,
           size(directPkgs) AS directCount,
           count(DISTINCT upstream) AS downstreamCount,
           (size(directPkgs) + count(DISTINCT upstream)) AS totalBlastRadius
    ORDER BY
      CASE vuln.severity
        WHEN 'CRITICAL' THEN 1
        WHEN 'HIGH' THEN 2
        WHEN 'MEDIUM' THEN 3
        ELSE 4
      END,
      totalBlastRadius DESC
  `,

  // 8. Global Graph Database Statistics using efficient CALL subqueries
  getStats: `
    CALL { MATCH (p:Package) RETURN count(p) AS packageCount }
    CALL { MATCH (v:Version) RETURN count(v) AS versionCount }
    CALL { MATCH (m:Maintainer) RETURN count(m) AS maintainerCount }
    CALL { MATCH (vuln:Vulnerability) RETURN count(vuln) AS vulnCount }
    CALL { MATCH ()-[r:DEPENDS_ON]->() RETURN count(r) AS dependencyCount }
    RETURN packageCount, versionCount, maintainerCount, vulnCount, dependencyCount
  `,

  // 9. Subgraph centered around a package for graph visualization
  getPackageGraph: `
    MATCH (p:Package {name: $name})
    OPTIONAL MATCH path = (p)-[:HAS_VERSION|DEPENDS_ON|MAINTAINED_BY|LICENSED_UNDER|AFFECTED_BY*1..2]-(target)
    RETURN p, collect(path) AS paths
  `,
};
