// Loads backend/seed/data/*.json into CognoDB using parameterized Cypher.
// Run with: npm run seed (from backend/) or node seed/seed.js [--clean]

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getSession, closeDriver } from '../src/config/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const packagesFilePath = path.join(__dirname, 'data', 'packages.json');
const packages = JSON.parse(fs.readFileSync(packagesFilePath, 'utf-8'));

async function seed() {
  const shouldClean = process.argv.includes('--clean');
  const session = getSession();

  try {
    console.log(`========================================`);
    console.log(` CognoDB Seed Tool`);
    console.log(`========================================`);

    if (shouldClean) {
      console.log('Cleaning existing graph nodes and relationships...');
      await session.run(`MATCH (n) DETACH DELETE n`);
      console.log('Database cleared.');
    }

    console.log('Ensuring indexes & schema constraints...');
    try {
      await session.run(`CREATE CONSTRAINT package_name_unique IF NOT EXISTS FOR (p:Package) REQUIRE p.name IS UNIQUE`);
      await session.run(`CREATE CONSTRAINT vuln_cve_unique IF NOT EXISTS FOR (v:Vulnerability) REQUIRE v.cveId IS UNIQUE`);
    } catch (indexErr) {
      // Fallback for Neo4j / CognoDB editions that do not support constraint syntax or have slightly different index syntax
      console.log('Notice on constraints/indexes:', indexErr.message);
    }

    console.log(`Seeding ${packages.length} packages with versions, maintainers, licenses, and CVEs...`);
    let versionCount = 0;
    let depCount = 0;
    let vulnCount = 0;

    for (const pkg of packages) {
      await session.run(
        `MERGE (p:Package {name: $name})
         SET p.ecosystem = $ecosystem`,
        { name: pkg.name, ecosystem: pkg.ecosystem || 'npm' }
      );

      for (const v of pkg.versions || []) {
        versionCount++;
        const maintainerEmail = v.maintainer || 'unknown@domain.com';
        const maintainerName = maintainerEmail.split('@')[0].replace('.', ' ');

        await session.run(
          `
          MATCH (p:Package {name: $name})
          MERGE (ver:Version {version: $version, packageName: $name})
          SET ver.releaseDate = $releaseDate
          MERGE (p)-[:HAS_VERSION]->(ver)
          MERGE (m:Maintainer {email: $maintainerEmail})
          SET m.name = $maintainerName
          MERGE (ver)-[:MAINTAINED_BY]->(m)
          MERGE (l:License {name: $license})
          SET l.type = $license
          MERGE (ver)-[:LICENSED_UNDER]->(l)
          `,
          {
            name: pkg.name,
            version: v.version,
            releaseDate: v.releaseDate || '2024-01-01',
            maintainerEmail,
            maintainerName,
            license: v.license || 'MIT'
          }
        );

        for (const dep of v.dependsOn || []) {
          depCount++;
          const [depName, depVersion] = dep.includes('@') ? dep.split('@') : [dep, 'latest'];
          await session.run(
            `
            MATCH (p:Package {name: $name})-[:HAS_VERSION]->(ver:Version {version: $version})
            MERGE (depPkg:Package {name: $depName})
            ON CREATE SET depPkg.ecosystem = $ecosystem
            MERGE (ver)-[r:DEPENDS_ON]->(depPkg)
            SET r.versionRange = $depVersion
            `,
            {
              name: pkg.name,
              version: v.version,
              depName,
              depVersion: depVersion || '*',
              ecosystem: pkg.ecosystem || 'npm'
            }
          );
        }

        for (const vuln of v.vulnerabilities || []) {
          vulnCount++;
          await session.run(
            `
            MATCH (p:Package {name: $name})-[:HAS_VERSION]->(ver:Version {version: $version})
            MERGE (vu:Vulnerability {cveId: $cveId})
            SET vu.severity = $severity,
                vu.description = $description
            MERGE (ver)-[:AFFECTED_BY]->(vu)
            `,
            {
              name: pkg.name,
              version: v.version,
              cveId: vuln.cveId,
              severity: vuln.severity,
              description: vuln.description
            }
          );
        }
      }
    }

    console.log(`========================================`);
    console.log(`✓ Seed Complete!`);
    console.log(`- Packages: ${packages.length}`);
    console.log(`- Versions: ${versionCount}`);
    console.log(`- Dependency relationships: ${depCount}`);
    console.log(`- Vulnerabilities linked: ${vulnCount}`);
    console.log(`========================================`);
  } catch (err) {
    console.error('Seed execution error:', err);
    throw err;
  } finally {
    await session.close();
    await closeDriver();
  }
}

seed().catch((err) => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
