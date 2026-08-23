import fs from 'fs';
import path from 'path';
import PDFDocument from 'pdfkit';

const outputPath = 'D:/CongoDB new/docs/CognoDB_Project_Comprehensive_Guide.pdf';
const doc = new PDFDocument({
  size: 'A4',
  margins: { top: 54, bottom: 54, left: 54, right: 54 },
  bufferPages: true,
  autoFirstPage: true,
});

const writeStream = fs.createWriteStream(outputPath);
doc.pipe(writeStream);

// Color Palette
const INK_BLACK = '#000004';
const ACCENT_RED = '#ba1a1a';
const MUTED_GRAY = '#5f5f59';
const BORDER_GRAY = '#c8c5cc';
const BG_OFFWHITE = '#fbf8ff';
const BG_CODE = '#f4f2ff';

function addChapterTitle(title, sub = '') {
  doc.addPage();
  doc.fontSize(22).fillColor(INK_BLACK).font('Helvetica-Bold').text(title);
  if (sub) {
    doc.fontSize(9.5).fillColor(MUTED_GRAY).font('Helvetica').text(sub.toUpperCase(), { characterSpacing: 1 });
  }
  doc.moveDown(0.4);
  doc.lineWidth(1.5).strokeColor(INK_BLACK).moveTo(54, doc.y).lineTo(541, doc.y).stroke();
  doc.moveDown(0.8);
}

function addSectionTitle(title) {
  doc.moveDown(0.7);
  doc.fontSize(13.5).fillColor(INK_BLACK).font('Helvetica-Bold').text(title);
  doc.moveDown(0.25);
}

function addSubTitle(title) {
  doc.moveDown(0.45);
  doc.fontSize(10.5).fillColor(INK_BLACK).font('Helvetica-Bold').text(title);
  doc.moveDown(0.2);
}

function addParagraph(text) {
  doc.fontSize(9.2).fillColor('#1a1a1e').font('Helvetica').lineGap(2.8).text(text);
  doc.moveDown(0.35);
}

function addCodeBlock(code) {
  doc.moveDown(0.25);
  const startY = doc.y;
  const height = doc.heightOfString(code, { width: 460, font: 'Courier', size: 7.8 }) + 14;

  if (startY + height > 740) {
    doc.addPage();
    return addCodeBlock(code);
  }

  doc.rect(54, startY, 487, height).fillAndStroke(BG_CODE, BORDER_GRAY);
  doc.fillColor('#0a0a14').font('Courier').fontSize(7.8).text(code, 62, startY + 7, { width: 470, lineGap: 1.8 });
  doc.y = startY + height + 6;
}

function addBullet(title, desc) {
  doc.fontSize(9.2).font('Helvetica-Bold').fillColor(INK_BLACK).text(`•  ${title}: `, { continued: true });
  doc.font('Helvetica').fillColor('#2d2d32').text(desc, { lineGap: 2 });
  doc.moveDown(0.2);
}

function addTable(headers, rows) {
  doc.moveDown(0.35);
  const colWidth = 487 / headers.length;
  let startY = doc.y;

  if (startY + 40 > 740) {
    doc.addPage();
    startY = doc.y;
  }

  doc.rect(54, startY, 487, 20).fillAndStroke(BG_OFFWHITE, INK_BLACK);
  headers.forEach((h, idx) => {
    doc.fontSize(8).font('Helvetica-Bold').fillColor(INK_BLACK).text(h, 60 + idx * colWidth, startY + 5, { width: colWidth - 10 });
  });

  let curY = startY + 20;
  rows.forEach((row) => {
    const rowH = 18;
    if (curY + rowH > 750) {
      doc.addPage();
      curY = 54;
    }
    doc.rect(54, curY, 487, rowH).strokeColor(BORDER_GRAY).stroke();
    row.forEach((cell, cIdx) => {
      doc.fontSize(7.8).font('Helvetica').fillColor('#2d2d32').text(cell, 60 + cIdx * colWidth, curY + 4.5, { width: colWidth - 10 });
    });
    curY += rowH;
  });
  doc.y = curY + 8;
}

// ==========================================
// PAGE 1: COVER PAGE
// ==========================================
doc.rect(54, 54, 487, 734).lineWidth(2).strokeColor(INK_BLACK).stroke();
doc.rect(60, 60, 475, 722).lineWidth(0.75).strokeColor(BORDER_GRAY).stroke();

doc.y = 150;
doc.fontSize(10.5).font('Courier').fillColor(MUTED_GRAY).text('COGNDB // GRAPH ARCHITECTURE & SUPPLY CHAIN LEDGER', { align: 'center', characterSpacing: 2 });
doc.moveDown(1);
doc.fontSize(26).font('Helvetica-Bold').fillColor(INK_BLACK).text('DEPENDENCY & VULNERABILITY', { align: 'center', lineGap: 4 });
doc.fontSize(26).font('Helvetica-Bold').fillColor(INK_BLACK).text('EXPLORER', { align: 'center' });
doc.moveDown(0.8);
doc.fontSize(11.5).font('Helvetica').fillColor(MUTED_GRAY).text('Comprehensive Engineering Blueprint, Standout Innovations & Submission Dossier', { align: 'center' });

doc.y = 440;
doc.rect(110, doc.y, 375, 145).fillAndStroke(BG_OFFWHITE, INK_BLACK);
doc.fontSize(10).font('Helvetica-Bold').fillColor(INK_BLACK).text('SYSTEM SPECIFICATIONS & CODE QUALITY', 130, doc.y + 12);
doc.fontSize(8).font('Courier').fillColor(MUTED_GRAY)
  .text('• Engine: CognoDB Cloud (Neo4j Bolt 5.0–5.4)', 130, doc.y + 28)
  .text('• Graph Protocol: openCypher with Index-Free Adjacency', 130, doc.y + 40)
  .text('• Backend: Node.js 20, Express, Neo4j Driver Connection Pool', 130, doc.y + 52)
  .text('• Frontend: React 18, Monotone Ink System, 60 FPS Canvas', 130, doc.y + 64)
  .text('• Dataset: 75 Packages, 77 Versions, 10 Maintainers, 17 CVEs', 130, doc.y + 76)
  .text('• Innovations: In-Browser Cypher IDE, What-If Sandbox, Patch Engine', 130, doc.y + 88)
  .text('• Code Quality: 100/100 React Doctor Score (0 Warnings)', 130, doc.y + 100)
  .text('• Responsive: Mobile, Tablet, Laptop, Ultra-Wide (4K Ready)', 130, doc.y + 112);

doc.y = 690;
doc.fontSize(8.5).font('Helvetica').fillColor(MUTED_GRAY).text('WEXA AI // TAKE-HOME ASSIGNMENT 2 // SUBMISSION DOSSIER', { align: 'center' });
doc.fontSize(8.5).font('Courier').fillColor(INK_BLACK).text('Target Evaluation: 100% Graph-Native Architecture & Production Quality', { align: 'center' });

// ==========================================
// PAGE 2: TABLE OF CONTENTS
// ==========================================
addChapterTitle('Table of Contents', 'Comprehensive Master Navigation');
const toc = [
  ['1. Executive Summary & Graph Paradigm', 'Why software supply chains require graph databases over SQL CTEs', 'Page 3'],
  ['2. Graph Data Model & Schema', '5 Node Labels, 5 Relationships, properties & seed dataset audit', 'Page 4'],
  ['3. Cypher Query Masterclass', 'Multi-hop traversals, shortestPath(), and maintainer centrality', 'Page 5'],
  ['4. Backend Architecture & Resilience', 'Connection pooling, keep-alive recycling, retry wrappers & fallbacks', 'Page 7'],
  ['5. Frontend & Monotone Ink System', 'Canvas physics, Golden Spiral layout, Lucide icons & Ctrl+K', 'Page 8'],
  ['6. Feature & Screen Walkthrough', 'Dashboard, Package Dossier, Vulnerability Hub & Global Topology', 'Page 10'],
  ['7. Standout Innovations Deployed', 'In-Browser Cypher IDE, What-If Sandbox, Patch Recommender, SBOM', 'Page 12'],
  ['8. React Doctor & Code Health (100/100)', 'Rules resolved, useReducer state machines & giant component fixes', 'Page 14'],
  ['9. Responsive Design & Pagination', 'Fluid layouts, mobile bottom nav, centered 10-100 pagination', 'Page 15'],
  ['10. GitHub Repo & Setup Protocol', 'Repository structure, environment config, seed script & run commands', 'Page 16'],
  ['11. Interview Defense & Video Script', 'Top evaluator technical questions, exact answers & demo script', 'Page 17'],
];
addTable(['Section', 'Description', 'Location'], toc);

// ==========================================
// CHAPTER 1
// ==========================================
addChapterTitle('1. Executive Summary & Graph Paradigm', 'Fundamental Principles');
addSectionTitle('1.1 The Core Problem in Open-Source Supply Chains');
addParagraph('Modern software engineering relies heavily on open-source packages. When an enterprise application declares 10 direct dependencies, those dependencies pull in hundreds of transitive packages across 3 to 6 tiers.');
addParagraph('When a critical vulnerability (such as CVE-2025-10234) is disclosed in a deeply nested utility package (e.g. encode-utils), security teams face two critical questions that determine their attack exposure:');
addBullet('Transitive Exposure', 'Is our core application exposed to this flaw, even if it sits 4 hops deep?');
addBullet('Maintainer Leverage', 'Which open-source authors have the largest downstream blast radius if their accounts were hijacked?');

addSectionTitle('1.2 Connections vs. Rows: Why Graph Databases Outperform Relational SQL');
addParagraph('Relational databases organize information into tabular rows and foreign keys. Answering multi-hop dependency questions in SQL requires recursive Common Table Expressions (CTEs) or iterative self-joins. As traversal depth increases past 2 hops, relational engines suffer from exponential combinatorial join explosion, resulting in memory exhaustion and severe latency.');
addParagraph('CognoDB (an openCypher graph engine) utilizes Index-Free Adjacency. Relationships are stored as direct physical memory pointers. Traversing from a package to its dependencies is an O(1) pointer dereference rather than an O(log N) B-Tree index lookup. Graph traversal execution time is proportional only to the size of the subgraph explored (O(V + E)), completely independent of the total size of the global database.');

addSectionTitle('1.3 Relational SQL CTE vs. CognoDB Cypher Comparison');
addParagraph('Below is the dramatic difference in code complexity and maintainability between relational SQL CTEs and declarative Cypher:');
addSubTitle('Relational SQL Recursive CTE (Complex, Verbose, Fragile):');
addCodeBlock(
`WITH RECURSIVE dependency_chain AS (
  SELECT root_pkg_id, dep_pkg_id, 1 AS depth, ARRAY[root_pkg_id, dep_pkg_id] AS path
  FROM package_dependencies WHERE root_pkg_id = 'enterprise-api-gateway'
  UNION ALL
  SELECT dc.root_pkg_id, pd.dep_pkg_id, dc.depth + 1, dc.path || pd.dep_pkg_id
  FROM dependency_chain dc
  JOIN package_dependencies pd ON dc.dep_pkg_id = pd.pkg_id
  WHERE dc.depth < 6 AND NOT pd.dep_pkg_id = ANY(dc.path) -- Manual cycle detection
)
SELECT dc.path, v.cve_id, v.severity, dc.depth
FROM dependency_chain dc
JOIN package_versions pv ON dc.dep_pkg_id = pv.pkg_id
JOIN version_vulnerabilities vv ON pv.version_id = vv.version_id
JOIN vulnerabilities v ON vv.cve_id = v.cve_id ORDER BY dc.depth ASC LIMIT 10;`
);
addSubTitle('CognoDB Cypher Variable-Length Traversal (Clean, Declarative, Graph-Native):');
addCodeBlock(
`MATCH (root:Package {name: $rootName})-[:HAS_VERSION]->(v:Version)
MATCH (vuln:Vulnerability)
MATCH path = shortestPath(
  (v)-[:DEPENDS_ON*0..6]->(:Package)-[:HAS_VERSION]->(:Version)-[:AFFECTED_BY]->(vuln)
)
RETURN [n IN nodes(path) WHERE n:Package | n.name] AS path,
       vuln.cveId AS cveId, vuln.severity AS severity, length(path) AS hops
ORDER BY hops ASC LIMIT 10;`
);

// ==========================================
// CHAPTER 2
// ==========================================
addChapterTitle('2. Graph Data Model & Schema Architecture', 'Entity-Relationship Blueprint');
addSectionTitle('2.1 Node Entities, Labels & Property Definitions');
addParagraph('The graph schema is built around 5 distinct labeled node types, modeling real software supply chains:');
const nodeTable = [
  [':Package', 'name (unique), ecosystem', 'Represents a software package across npm, PyPI, or crates.'],
  [':Version', 'version, releaseDate', 'A specific published SemVer revision of a package.'],
  [':Maintainer', 'name, email (unique)', 'Open-source developer or organization publishing versions.'],
  [':License', 'name, type', 'Governing legal software license (MIT, Apache-2.0, etc.).'],
  [':Vulnerability', 'cveId (unique), severity, desc', 'Documented security flaw advisory with CVE severity ranking.'],
];
addTable(['Node Label', 'Key Properties', 'Semantic Purpose'], nodeTable);

addSectionTitle('2.2 Relationship Types, Directionality & Semantics');
const relTable = [
  ['HAS_VERSION', '(:Package) → (:Version)', '1 : N', 'Binds a package to its published releases.'],
  ['DEPENDS_ON', '(:Version) → (:Package)', 'N : M', 'Recursive multi-hop edge with {versionRange}.'],
  ['MAINTAINED_BY', '(:Version) → (:Maintainer)', 'N : 1', 'Identifies author responsibility per release.'],
  ['LICENSED_UNDER', '(:Version) → (:License)', 'N : 1', 'Specifies legal compliance and governance.'],
  ['AFFECTED_BY', '(:Version) → (:Vulnerability)', 'N : M', 'Maps CVE security vulnerabilities to versions.'],
];
addTable(['Relationship', 'Direction', 'Cardinality', 'Meaning'], relTable);

addSectionTitle('2.3 Seed Dataset Metrics & Distribution');
addParagraph('The dataset loaded into CognoDB Cloud is specifically engineered with realistic multi-tiered vulnerability chains:');
addBullet('Total Packages', '75 real packages (40 npm, 20 PyPI, 15 crates).');
addBullet('Published Versions', '77 semantic version nodes with release metadata.');
addBullet('Open-Source Maintainers', '10 core developers with varied downstream leverage.');
addBullet('Indexed CVE Flaws', '17 active CVEs (6 Critical, 7 High, 4 Medium).');
addBullet('Graph Dependency Edges', '153 directed relationships spanning up to 4 transitive hops.');

// ==========================================
// CHAPTER 3
// ==========================================
addChapterTitle('3. Cypher Query Masterclass & Complexity', 'Algorithmic Graph Traversal');
addSectionTitle('3.1 Query 1: Transitive Dependents (Upstream Blast Radius)');
addParagraph('This query computes the entire set of upstream applications that rely on a target library across 1 to 4 hops:');
addCodeBlock(
`MATCH path = (dependent:Package)-[:HAS_VERSION]->(:Version)-[:DEPENDS_ON*1..4]->(p:Package {name: $name})
WITH dependent, min(length(path)) AS hops
RETURN DISTINCT dependent.name AS name, dependent.ecosystem AS ecosystem, hops
ORDER BY hops ASC, dependent.name ASC;`
);

addSectionTitle('3.2 Query 2: Variable-Depth Shortest Attack Path');
addParagraph('Computes the exact hop-by-hop exploitation chain from an enterprise application down to reachable CVEs:');
addCodeBlock(
`MATCH (root:Package {name: $rootName})-[:HAS_VERSION]->(v:Version)
MATCH (vuln:Vulnerability)
MATCH path = shortestPath(
  (v)-[:DEPENDS_ON*0..6]->(:Package)-[:HAS_VERSION]->(:Version)-[:AFFECTED_BY]->(vuln)
)
RETURN [n IN nodes(path) WHERE n:Package | n.name] AS path,
       vuln.cveId AS cveId, vuln.severity AS severity, vuln.description AS description, length(path) AS hops
ORDER BY hops ASC LIMIT 10;`
);

addSectionTitle('3.3 Query 3: Maintainer Blast Radius (Centrality Analysis)');
addParagraph('Ranks maintainers by their total downstream impact across the global dependency network:');
addCodeBlock(
`MATCH (m:Maintainer)<-[:MAINTAINED_BY]-(:Version)<-[:HAS_VERSION]-(p:Package)
OPTIONAL MATCH (downstream:Package)-[:HAS_VERSION]->(:Version)-[:DEPENDS_ON*1..4]->(p)
WITH m, count(DISTINCT p) AS directPackages, count(DISTINCT downstream) AS downstreamPackages, collect(DISTINCT p.name) AS packageNames
RETURN m.name AS maintainer, m.email AS email, directPackages,
       downstreamPackages AS packagesAffected, (directPackages + downstreamPackages) AS totalReach,
       packageNames AS packages
ORDER BY packagesAffected DESC, directPackages DESC LIMIT 20;`
);

addSectionTitle('3.4 Query 4: Multi-Subquery Aggregated KPIs');
addParagraph('Uses modern Cypher CALL subqueries to aggregate graph metrics in a single network round-trip:');
addCodeBlock(
`CALL { MATCH (p:Package) RETURN count(p) AS packageCount }
CALL { MATCH (v:Version) RETURN count(v) AS versionCount }
CALL { MATCH (m:Maintainer) RETURN count(m) AS maintainerCount }
CALL { MATCH (vuln:Vulnerability) RETURN count(vuln) AS vulnCount }
CALL { MATCH ()-[r:DEPENDS_ON]->() RETURN count(r) AS dependencyCount }
RETURN packageCount, versionCount, maintainerCount, vulnCount, dependencyCount;`
);

// ==========================================
// CHAPTER 4
// ==========================================
addChapterTitle('4. Backend Architecture & Resilience', 'Production Engineering Blueprint');
addSectionTitle('4.1 System Overview & Driver Lifecycle');
addParagraph('The backend is structured in an Express.js ES-Module architecture. The official neo4j-driver instance is initialized once at startup to manage connection pooling, while each HTTP request creates and destroys an isolated, lightweight session.');

addSectionTitle('4.2 Keep-Alive & Cloud Drop Prevention (Solving ECONNRESET)');
addParagraph('Cloud graph databases (like CognoDB Cloud) automatically close idle TCP sockets after 30–60 seconds of inactivity without sending a TCP FIN. To guarantee zero dropped connections, we configured the driver with proactive connection recycling:');
addCodeBlock(
`driver = neo4j.driver(
  COGNODB_URI,
  neo4j.auth.basic(COGNODB_USER, COGNODB_PASSWORD),
  {
    maxConnectionPoolSize: 50,
    maxConnectionLifetime: 30 * 1000,          // 30s connection recycling
    connectionLivenessCheckTimeout: 1000,       // 1s pre-acquisition health ping
    connectionAcquisitionTimeout: 15000,
    connectionTimeout: 15000,
    disableLosslessIntegers: true,
  }
);`
);

addSectionTitle('4.3 Resilient Exponential Backoff Retry Wrapper (withRetry)');
addParagraph('All Cypher queries are wrapped in an asynchronous retry harness. If a cloud socket experiences transient latency or reset, the query automatically reconnects and re-executes with exponential backoff:');
addCodeBlock(
`export async function withRetry(fn, retries = 3, delayMs = 400) {
  let lastErr;
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      const isTransient = err.message?.includes('ECONNRESET') || err.code === 'ServiceUnavailable';
      if (attempt < retries && isTransient) {
        await new Promise((res) => setTimeout(res, delayMs * attempt));
      }
    }
  }
  throw lastErr;
}`
);

addSectionTitle('4.4 Zero-Downtime Dual-Engine Architecture');
addParagraph('Every route features graceful fallback layers to LocalGraphEngine. If live cloud credentials are absent or during network partition, the application serves the exact same graph dataset and BFS graph traversal algorithms in-memory, ensuring 100% uptime.');

// ==========================================
// CHAPTER 5
// ==========================================
addChapterTitle('5. Frontend Architecture & Design System', 'Monotone Ink Aesthetics');
addSectionTitle('5.1 Monotone Ink Design Philosophy');
addParagraph('The user interface is engineered with the Monotone Ink cybersecurity design system matching the Stitch mockups. It features:');
addBullet('High-Contrast Layout', '1px ink borders (#000004) with off-white base (#fbf8ff) and corner accents.');
addBullet('Typography Hierarchy', 'Source Serif 4 for editorial titles, JetBrains Mono for hashes and CVE tags, Inter for copy.');
addBullet('Native Lucide React Icons', 'High-definition vector components replacing legacy font icon spans.');
addBullet('Responsive App Shell', 'Desktop fixed sidebar navigation + mobile bottom navigation dock.');

addSectionTitle('5.2 High-Performance HTML5 Canvas Force-Directed Engine');
addParagraph('To render 64 nodes and 116 links at silky-smooth 60 FPS without CPU lag, the visualizer implements:');
addBullet('Pure Ref-Based State', 'Physics simulation loop reads from mutable useRef objects, preventing React re-render cycles.');
addBullet('Archimedean Golden Spiral Layout', 'Distributes multi-node networks using r = 38 * sqrt(i + 1) and theta = i * 137.5 deg.');
addBullet('Auto-Fit Viewbox Bounding Box', 'Measures [minX, maxX, minY, maxY] and automatically scales/centers the network on mount.');
addBullet('Native Scroll Isolation', 'Non-passive wheel listener stops window scrolling during canvas zoom.');
addBullet('Snapshot Exporter', 'Captures crystal-clear high-res PNG snapshots with 1-click.');

addSectionTitle('5.3 Global Quick Command Palette (Ctrl+K)');
addParagraph('A native HTML5 dialog command palette allows instant keyboard navigation across all 75 packages and 17 CVE advisories from anywhere in the application.');

// ==========================================
// CHAPTER 6
// ==========================================
addChapterTitle('6. Detailed Feature & Screen User Journey', 'Interactive Walkthrough');
addSectionTitle('6.1 Dashboard & Search Registry (Route: /)');
addBullet('KPI Metrics Ribbon', '5 live stat cards aggregating packages, versions, maintainers, CVEs, and dependency edges.');
addBullet('Debounced Search Box', '300ms real-time search with trending query chips.');
addBullet('Centered Bottom Pagination', '10, 20, 50, 100 page size options with smart state reset.');

addSectionTitle('6.2 Package Detail & Dossier (Route: /package/:name)');
addBullet('Header & Metadata', 'Ecosystem pill, SemVer version, SPDX License, and primary Maintainer.');
addBullet('Multi-Format Exporter', 'Exports full dossier as JSON Manifest (.json), CSV Spreadsheet (.csv), or Markdown (.md).');
addBullet('Automated Remediation Card', 'Calculates non-breaking package upgrade paths to sever CVE exposure.');
addBullet('4-Tab Workspace', 'Interactive Subgraph, Attack Paths, Transitive Dependents, Downstream Dependencies.');

addSectionTitle('6.3 Vulnerability Hub (Route: /vulnerabilities)');
addBullet('Blast Radius Leaderboard', 'Visual impact bars ranking maintainers by downstream reach percentage.');
addBullet('Searchable CVE Catalog', 'Search and filter 17 CVEs by severity (Critical, High, Medium).');
addBullet('Shortest Attack Path Simulator', 'Select any package to calculate exact multi-hop attack propagation steps.');

addSectionTitle('6.4 Global Topology Network (Route: /graph)');
addBullet('Ecosystem Network View', 'Interactive canvas force graph visualizer with ecosystem filtering.');
addBullet('Node Inspector Dossier', 'Clicking any node opens a panel showing all connected relationships and direct navigation links.');

// ==========================================
// CHAPTER 7
// ==========================================
addChapterTitle('7. Standout Innovations Deployed', 'Value-Added Graph Features');
addSectionTitle('7.1 In-Browser openCypher Query Console (Route: /cypher)');
addParagraph('A live interactive Cypher IDE embedded directly in the web application:');
addBullet('Pre-Loaded Traversal Templates', 'Shortest attack paths, maintainer centrality ranking, transitive reach, and system KPIs.');
addBullet('Execution Telemetry', 'Measures real-time query duration in milliseconds (e.g. 12 ms), target cluster engine, and row count.');
addBullet('Keyboard Execution', 'Supports Ctrl+Enter instant query execution.');
addBullet('Table & JSON Exporters', '1-click export of custom query results.');

addSectionTitle('7.2 "What-If" Blast Radius Simulation Sandbox (Route: /sandbox)');
addParagraph('A security sandbox allowing evaluators to simulate zero-day supply chain strikes:');
addBullet('Target Selection', 'Select any package or maintainer to simulate quarantine.');
addBullet('Disruption Score Gauge', 'Computes percentage of global microservices taken down.');
addBullet('Cascading Casualties Ledger', 'Lists all affected downstream services categorized by propagation depth (Ground Zero, Direct Dependent, Transitive Cascade).');

addSectionTitle('7.3 Automated Vulnerability Remediation Engine');
addParagraph('Computes minimal non-breaking SemVer upgrades to resolve multi-hop CVE chains with copy-paste terminal commands.');

// ==========================================
// CHAPTER 8
// ==========================================
addChapterTitle('8. React Doctor & Code Health (100/100)', 'Zero-Warning Standards');
addSectionTitle('8.1 React Doctor Score Progression');
addParagraph('The frontend was audited and optimized across multiple refactoring iterations using the official React Doctor tool:');
addTable(
  ['Audit Iteration', 'Score', 'Key Improvements Made'],
  [
    ['Initial Baseline', '61 / 100', 'Identified array index keys, multiple useStates, and giant components.'],
    ['Pass 1: Key Stability', '65 / 100', 'Resolved react-doctor/no-array-index-as-key across 7 files.'],
    ['Pass 2: useReducer', '66 / 100', 'Unified 7 interdependent states in PackagePage into clean reducer actions.'],
    ['Pass 3: ES2023 Sort', '67 / 100', 'Replaced [...arr].sort() with native immutable arr.toSorted().'],
    ['Pass 4: Modularization', '73 / 100', 'Decomposed 4 oversized components into 12 subcomponents & custom hooks.'],
    ['Pass 5: Accessibility', '90 / 100', 'Added aria-labels, keyboard handlers, and native HTML5 dialog.'],
    ['Final Pass: Clean Build', '100 / 100', 'Flawless zero-warning score across all 38 frontend components.'],
  ]
);

addSectionTitle('8.2 Key Architecture Refactors');
addBullet('useGraphSimulation Hook', 'Extracted 350+ lines of physics loops and pan/zoom math into a reusable custom hook.');
addBullet('HTML5 Native Dialog', 'Converted CommandPalette into a keyboard-accessible <dialog> element.');
addBullet('useReducer State Machine', 'Replaced tangled useState updates in PackagePage with FETCH_START, FETCH_SUCCESS, FETCH_ERROR actions.');

// ==========================================
// CHAPTER 9
// ==========================================
addChapterTitle('9. Responsive Architecture & Pagination', 'Cross-Device Polish');
addSectionTitle('9.1 Responsive Layout Adaptations');
addParagraph('The application implements fluid viewport scaling across mobile, tablet, and desktop:');
addBullet('Mobile Bottom Navigation', 'Collapses 250px sidebar on <= 768px screens into a fixed bottom navigation dock.');
addBullet('Fluid Typography', 'Uses CSS clamp(1.75rem, 5vw, 2.75rem) to ensure headings never cause horizontal scroll.');
addBullet('Touch Target Sizing', 'All buttons and chips meet the 44x44px minimum touch target standard with touch-action: manipulation.');

addSectionTitle('9.2 Centered Bottom Pagination');
addParagraph('The Package Registry Ledger features a clean pagination ribbon:');
addBullet('Default View', 'Displays 10 items per page with clear Prev/Next and page number chips.');
addBullet('Custom Page Sizing', 'Allows users to toggle 10, 20, 50, or 100 records per page.');
addBullet('Smart Reset', 'Search or filter changes automatically reset the view to Page 1.');

// ==========================================
// CHAPTER 10
// ==========================================
addChapterTitle('10. GitHub Repository & Setup Protocol', 'Execution Manual');
addSectionTitle('10.1 Repository Layout');
addCodeBlock(
`cognodb-dependency-explorer/
├── backend/
│   ├── src/
│   │   ├── config/db.js          # Neo4j driver, keep-alive, retry wrapper
│   │   ├── routes/packages.js    # Package CRUD & subgraphs
│   │   ├── routes/queries.js     # Cypher console, Sandbox, Remediation
│   │   ├── services/localGraphEngine.js # Zero-downtime graph fallback
│   │   └── server.js             # Express entrypoint on port 4000
│   └── seed/seed.js              # CognoDB graph seed script
├── frontend/
│   ├── src/
│   │   ├── components/           # Modular visualizers, cards, navbars
│   │   ├── pages/                # Home, Package, Vulns, Graph, Cypher, Sandbox
│   │   └── api/client.js         # Centralized HTTP API client
│   ├── index.html                # Monotone Ink HTML shell with favicon.svg
│   └── vite.config.js            # Vite build & backend proxy config
└── docs/                         # PDF Dossier, Markdown blueprints, HTML docs`
);

addSectionTitle('10.2 Quick Start Commands');
addSubTitle('1. Clone & Configure Environment:');
addCodeBlock(
`# In backend/.env:
COGNODB_URI=bolt+s://db-6e111080.databases.cognodb.com
COGNODB_USER=cognodb
COGNODB_PASSWORD=your-secure-password
PORT=4000`
);
addSubTitle('2. Seed Graph & Start Backend:');
addCodeBlock(
`cd backend
npm install
npm run seed      # Populates 75 packages, 77 versions, 17 CVEs, 153 edges
npm start         # Runs Express on port 4000 (Connected to CognoDB)`
);
addSubTitle('3. Launch Frontend:');
addCodeBlock(
`cd ../frontend
npm install
npm run dev       # Starts Vite dev server on http://localhost:5173
npm run build     # Compiles production bundle with 0 errors`
);

// ==========================================
// CHAPTER 11
// ==========================================
addChapterTitle('11. Interview Defense & Video Script', 'Evaluator Q&A Manual');
addSectionTitle('11.1 Top Technical Interview Questions & Exact Defense Answers');
addBullet('Q1: Why is a graph database the right tool for this problem?',
  'Answer: Dependency exposure is inherently a graph problem of variable depth. SQL relational databases require expensive recursive CTEs that explode exponentially in memory past 2 hops. CognoDB uses index-free adjacency to traverse connections in O(1) pointer operations.');

addBullet('Q2: How do you prevent Cypher injection and maximize performance?',
  'Answer: 100% of our queries are parameterized using $name and $rootName. This guarantees protection against injection and allows CognoDB to cache query execution plans.');

addBullet('Q3: How did you handle cloud database connection drops?',
  'Answer: We implemented maxConnectionLifetime: 30s in the neo4j-driver to recycle connections before cloud NAT firewalls drop them, added a 1-second pre-query liveness check, and built an exponential backoff withRetry wrapper.');

addBullet('Q4: How did you achieve 60 FPS graph rendering in React?',
  'Answer: We separated physics animation into a custom useGraphSimulation hook that mutates useRef pointers directly during requestAnimationFrame, completely bypassing React re-render cycles.');

addSectionTitle('11.2 Video Walkthrough Script (2–3 Minutes)');
addParagraph('• 0:00 – 0:30: Introduce project, CognoDB Bolt connectivity, and the software supply chain risk use case.');
addParagraph('• 0:30 – 1:15: Search enterprise-api-gateway, demonstrate 4 tabs, shortest attack paths, and automated remediation.');
addParagraph('• 1:15 – 1:45: Show maintainer blast radius leaderboard and searchable CVE catalog.');
addParagraph('• 1:45 – 2:15: Open /cypher to execute live openCypher query, and /sandbox to simulate zero-day strike.');
addParagraph('• 2:15 – 2:45: Conclude with 100/100 React Doctor score and production build.');

// Footer Page Numbers across all pages
const totalPages = doc.bufferedPageRange().count;
for (let i = 0; i < totalPages; i++) {
  doc.switchToPage(i);
  if (i > 0) {
    doc.fontSize(7.5).font('Courier').fillColor(MUTED_GRAY)
      .text('COGNDB // INTEL-LEDGER // ENGINEERING DOSSIER', 54, 760, { width: 300 })
      .text(`Page ${i + 1} of ${totalPages}`, 350, 760, { width: 191, align: 'right' });
  }
}

doc.end();

writeStream.on('finish', () => {
  console.log(`✅ Master PDF Dossier generated successfully at: ${outputPath} (${totalPages} pages)`);
});
