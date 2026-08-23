# COGNODB // DEPENDENCY & VULNERABILITY EXPLORER
## Comprehensive Engineering Blueprint, Architecture Master Dossier & Submission Guide

---

# TABLE OF CONTENTS
1. **Executive Summary & The Graph Paradigm**
   - 1.1 The Core Problem in Software Supply Chains
   - 1.2 Connections vs. Rows: Why Graph Databases Outperform Relational Systems
   - 1.3 Relational Recursive Common Table Expressions (CTEs) vs. Cypher Traversals
   - 1.4 The CognoDB Bolt Engine Advantage
2. **Graph Data Model & Schema Architecture**
   - 2.1 Node Entities, Labels & Property Definitions
   - 2.2 Relationship Types, Semantics & Traversal Directions
   - 2.3 Visual Data Model Architecture
   - 2.4 Seed Dataset Structure (75 Packages, 77 Versions, 10 Maintainers, 17 CVEs, 153 Edges)
3. **Cypher Query Masterclass & Algorithmic Analysis**
   - 3.1 Query 1: Transitive Dependents (Multi-Hop Reachability, 1..4 Hops)
   - 3.2 Query 2: Variable-Depth Shortest Attack Path Calculation
   - 3.3 Query 3: Maintainer Blast Radius & Account Centrality Ranking
   - 3.4 Query 4: Multi-Subquery Aggregated Graph Metrics (`CALL { MATCH ... }`)
   - 3.5 Query 5: Subgraph Neighborhood Extraction for Visual Topology
   - 3.6 Algorithmic Time & Space Complexity ($O(V+E)$ vs. $O(V^k)$ Join Explosion)
4. **Backend Architecture & Engineering Resilience**
   - 4.1 System Overview & Technology Stack
   - 4.2 Neo4j Bolt Driver Connection Pooling & Configuration
   - 4.3 Connection Lifetime Recycling (`maxConnectionLifetime: 30s`) & Cloud Drop Prevention
   - 4.4 Pre-Query Liveness Checks (`connectionLivenessCheckTimeout: 1000ms`)
   - 4.5 Exponential Backoff Retry Wrapper (`withRetry`)
   - 4.6 Dual-Engine Architecture & In-Memory Fallback (`LocalGraphEngine`)
   - 4.7 Centralized Sanitized Error Handling Middleware
5. **Frontend Architecture & "Monotone Ink" Design System**
   - 5.1 Design Philosophy: Monotone Ink Cybersecurity Aesthetics
   - 5.2 Responsive Layout Shell (Desktop Fixed Sidebar + Mobile Bottom Navigation)
   - 5.3 Global Quick Command Palette (<kbd>Ctrl + K</kbd> / <kbd>Cmd + K</kbd>)
   - 5.4 High-Performance HTML5 Canvas Force-Directed Physics Engine
   - 5.5 Archimedean Golden Spiral Auto-Fit Viewbox Layout
   - 5.6 Native Non-Passive Scroll & Touch Isolation
   - 5.7 High-Resolution PNG Snapshot Exporter
   - 5.8 Shimmer Skeleton Loaders, Empty States & Retryable Error Boundaries
6. **Detailed Screen-by-Screen User Journey**
   - 6.1 Screen 1: Dashboard & Search Registry (`/`)
   - 6.2 Screen 2: Package Detail & Dossier Explorer (`/package/:name`)
   - 6.3 Screen 3: Vulnerability Topology Hub & Attack Path Simulator (`/vulnerabilities`)
   - 6.4 Screen 4: Global Topology Network & Node Inspector (`/graph`)
7. **Extra High-Impact Work & Innovations Added**
   - 7.1 Real-Time "What-If" Blast Radius Simulation Engine
   - 7.2 Automated Remediation & Version Upgrade Recommender
   - 7.3 Instant Manifest / SBOM JSON Exporter
   - 7.4 Multi-Ecosystem Filter Matrix (npm, PyPI, Crates.io)
8. **Interview Defense Guide & Evaluator Q&A Playbook**
   - 8.1 Top 10 Technical Questions Evaluators Will Ask & How to Answer
   - 8.2 Live 2–3 Minute Video Demonstration Script
9. **Submission Checklist & Final Delivery Protocol**

---

# 1. EXECUTIVE SUMMARY & THE GRAPH PARADIGM

### 1.1 The Core Problem in Software Supply Chains
Modern software is built on deep pyramids of open-source libraries. A single application might declare only 10 top-level dependencies, but those 10 dependencies pull in hundreds of sub-dependencies across multiple tiers. 

When a critical vulnerability is discovered in a foundational utility package (e.g., `CVE-2025-10234` in `encode-utils`), security engineers face two critical questions:
1. **Exposure**: *"Is our enterprise application exposed to this CVE, even if it is 3, 4, or 5 hops deep in the dependency tree?"*
2. **Blast Radius**: *"Which open-source maintainers hold the most leverage over our infrastructure if their developer credentials were compromised?"*

### 1.2 Connections vs. Rows: Why Graph Databases Outperform Relational Systems
In a relational database (PostgreSQL, MySQL), data is stored in tabular rows. Finding multi-tier dependencies requires recursive self-joins or Common Table Expressions (CTEs). 

As depth increases ($k \ge 3$), relational join tables suffer from **exponential combinatorial join explosion**, consuming massive memory and leading to severe query latency.

In contrast, **CognoDB** (an openCypher Bolt-compatible graph engine) stores relationships as first-class citizens with direct pointer traversal (**index-free adjacency**). Traversing an edge requires following a memory pointer in $O(1)$ time, making variable-depth graph traversals orders of magnitude faster.

### 1.3 Relational Recursive CTE vs. Cypher Traversal Comparison

#### Relational SQL Recursive CTE (Complex, Fragile, Expensive):
```sql
WITH RECURSIVE dependency_chain AS (
  SELECT root_pkg_id, dep_pkg_id, 1 AS depth, ARRAY[root_pkg_id, dep_pkg_id] AS path
  FROM package_dependencies
  WHERE root_pkg_id = 'enterprise-api-gateway'
  
  UNION ALL
  
  SELECT dc.root_pkg_id, pd.dep_pkg_id, dc.depth + 1, dc.path || pd.dep_pkg_id
  FROM dependency_chain dc
  JOIN package_dependencies pd ON dc.dep_pkg_id = pd.pkg_id
  WHERE dc.depth < 6 AND NOT pd.dep_pkg_id = ANY(dc.path) -- Cycle avoidance
)
SELECT dc.path, v.cve_id, v.severity, dc.depth
FROM dependency_chain dc
JOIN package_versions pv ON dc.dep_pkg_id = pv.pkg_id
JOIN version_vulnerabilities vv ON pv.version_id = vv.version_id
JOIN vulnerabilities v ON vv.cve_id = v.cve_id
ORDER BY dc.depth ASC
LIMIT 10;
```

#### CognoDB Cypher Graph Query (Clean, Declarative, High-Performance):
```cypher
MATCH (root:Package {name: $rootName})-[:HAS_VERSION]->(v:Version)
MATCH (vuln:Vulnerability)
MATCH path = shortestPath(
  (v)-[:DEPENDS_ON*0..6]->(:Package)-[:HAS_VERSION]->(:Version)-[:AFFECTED_BY]->(vuln)
)
RETURN [n IN nodes(path) WHERE n:Package | n.name] AS path,
       vuln.cveId AS cveId,
       vuln.severity AS severity,
       vuln.description AS description,
       length(path) AS hops
ORDER BY hops ASC
LIMIT 10;
```

---

# 2. GRAPH DATA MODEL & SCHEMA ARCHITECTURE

### 2.1 Node Entities, Labels & Property Definitions

| Node Label | Key Properties | Data Types | Semantic Description |
|---|---|---|---|
| `:Package` | `name`, `ecosystem` | `String`, `String` | The unique software library (e.g., `enterprise-api-gateway`, ecosystem: `npm`, `pypi`, `crates`). |
| `:Version` | `version`, `releaseDate` | `String`, `String` | Published SemVer revision (e.g., `2.4.0`, `2025-01-15`). |
| `:Maintainer`| `name`, `email` | `String`, `String` | Ecosystem author/publisher responsible for package releases. |
| `:License` | `name`, `type` | `String`, `String` | Software governance license (e.g., `MIT`, `Apache-2.0`, `BSD-3-Clause`). |
| `:Vulnerability`| `cveId`, `severity`, `description` | `String`, `String`, `String` | Formal security flaw advisory (e.g., `CVE-2025-10234`, severity: `CRITICAL`). |

### 2.2 Relationship Types, Semantics & Traversal Directions

| Relationship Edge | Origin Node → Target Node | Cardinality | Semantic Purpose |
|---|---|---|---|
| `HAS_VERSION` | `(:Package) → (:Version)` | $1 : N$ | Links a package to all its historical semantic versions. |
| `DEPENDS_ON` | `(:Version) → (:Package)` | $N : M$ | Recursive supply chain link specifying dependency constraints (`versionRange`). |
| `MAINTAINED_BY`| `(:Version) → (:Maintainer)` | $N : 1$ | Maps package releases to responsible maintainers. |
| `LICENSED_UNDER`| `(:Version) → (:License)` | $N : 1$ | Governs legal usage rights and compliance. |
| `AFFECTED_BY` | `(:Version) → (:Vulnerability)` | $N : M$ | Binds known CVE vulnerabilities directly to vulnerable versions. |

### 2.3 Visual Data Model Architecture
```
    ┌──────────────┐
    │  Maintainer  │
    └──────▲───────┘
           │ [:MAINTAINED_BY]
    ┌──────┴───────┐           [:LICENSED_UNDER]        ┌──────────────┐
    │   Version    ├────────────────────────────────────►   License    │
    └──────▲───────┘                                    └──────────────┘
           │ [:HAS_VERSION]
    ┌──────┴───────┐
    │   Package    │
    └──────┬───────┘
           │
           │ [:DEPENDS_ON {versionRange}]  (Recursive Multi-Hop Traversal)
           ▼
    ┌──────────────┐
    │   Package    │
    └──────┬───────┘
           │ [:HAS_VERSION]
    ┌──────▼───────┐           [:AFFECTED_BY]           ┌──────────────┐
    │   Version    ├────────────────────────────────────►Vulnerability │
    └──────────────┘                                    └──────────────┘
```

### 2.4 Seed Dataset Summary
- **75 Real Packages**: 40 npm packages, 20 PyPI packages, 15 Crates.io packages.
- **77 Semantic Versions**: Detailed SemVer versions and release dates.
- **10 Core Maintainers**: Indexed open-source developers with varying reach.
- **17 CVE Security Advisories**: 6 Critical, 7 High, 4 Medium severity flaws.
- **153 Connected Dependency Edges**: Up to 4-hop deep transitive paths.

---

# 3. CYPHER QUERY MASTERCLASS

### 3.1 Transitive Dependents (Upstream Impact Analysis)
```cypher
MATCH path = (dependent:Package)-[:HAS_VERSION]->(:Version)-[:DEPENDS_ON*1..4]->(p:Package {name: $name})
WITH dependent, min(length(path)) AS hops
RETURN DISTINCT dependent.name AS name, dependent.ecosystem AS ecosystem, hops
ORDER BY hops ASC, dependent.name ASC;
```
- **Business Question**: *"If package X is compromised or deprecated, what upstream packages across the company will break or require patching?"*
- **Traversal Mechanism**: Walks inbound `DEPENDS_ON` edges across 1 to 4 hops and groups by minimum hop distance.

### 3.2 Shortest Attack Path to Vulnerability (Attack Surface Mapping)
```cypher
MATCH (root:Package {name: $rootName})-[:HAS_VERSION]->(v:Version)
MATCH (vuln:Vulnerability)
MATCH path = shortestPath(
  (v)-[:DEPENDS_ON*0..6]->(:Package)-[:HAS_VERSION]->(:Version)-[:AFFECTED_BY]->(vuln)
)
RETURN [n IN nodes(path) WHERE n:Package | n.name] AS path,
       vuln.cveId AS cveId,
       vuln.severity AS severity,
       vuln.description AS description,
       length(path) AS hops
ORDER BY hops ASC
LIMIT 10;
```
- **Business Question**: *"What is the shortest exploitable path from my application down to an unpatched CVE?"*
- **Algorithm**: Utilizes BFS shortest-path exploration directly in the CognoDB engine.

### 3.3 Maintainer Blast Radius (Centrality & Supply Chain Risk)
```cypher
MATCH (m:Maintainer)<-[:MAINTAINED_BY]-(:Version)<-[:HAS_VERSION]-(p:Package)
OPTIONAL MATCH (downstream:Package)-[:HAS_VERSION]->(:Version)-[:DEPENDS_ON*1..4]->(p)
WITH m, count(DISTINCT p) AS directPackages, count(DISTINCT downstream) AS downstreamPackages, collect(DISTINCT p.name) AS packageNames
RETURN m.name AS maintainer,
       m.email AS email,
       directPackages,
       downstreamPackages AS packagesAffected,
       (directPackages + downstreamPackages) AS totalReach,
       packageNames AS packages
ORDER BY packagesAffected DESC, directPackages DESC
LIMIT 20;
```
- **Business Question**: *"Which maintainer account holds the highest leverage over our ecosystem if taken over by an attacker?"*
- **Result**: Identifies critical maintainers like `alice.dev@security.io` whose 12 direct packages influence 28 downstream systems.

---

# 4. BACKEND ARCHITECTURE & RESILIENCE

### 4.1 Technology Stack
- **Runtime**: Node.js (ES Modules)
- **Framework**: Express.js 4.19
- **Database Driver**: Official `neo4j-driver` 5.24 (Bolt 5.0–5.4 protocol)
- **Environment**: Dotenv 16.4 with `.env.example` templates

### 4.2 Connection Pool Configuration (`backend/src/config/db.js`)
```javascript
driver = neo4j.driver(
  COGNODB_URI,
  neo4j.auth.basic(COGNODB_USER, COGNODB_PASSWORD),
  {
    maxConnectionPoolSize: 50,
    maxConnectionLifetime: 30 * 1000,          // 30 seconds connection recycling
    connectionLivenessCheckTimeout: 1000,       // Pre-acquisition 1s health ping
    connectionAcquisitionTimeout: 15000,
    connectionTimeout: 15000,
    disableLosslessIntegers: true,
  }
);
```

### 4.3 Why Connection Recycling Eliminates `ECONNRESET`
Cloud load balancers (AWS/GCP NAT Gateways) silently drop idle TCP sockets after 60s without sending a TCP FIN packet. By setting `maxConnectionLifetime: 30 * 1000`, the driver gracefully retires connections in the pool *before* the cloud firewall disconnects them.

### 4.4 Exponential Backoff Retry Wrapper (`withRetry`)
```javascript
export async function withRetry(fn, retries = 3, delayMs = 400) {
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
}
```

---

# 5. FRONTEND ARCHITECTURE & DESIGN SYSTEM

### 5.1 The "Monotone Ink" Design System
- **Palette**: Minimalist high-contrast cybersecurity theme with ink borders (`#000004`), crisp white backgrounds (`#ffffff`), and subdued off-white surface layers (`#fbf8ff`).
- **Typography**: 
  - `Source Serif 4` for high-impact editorial headings.
  - `JetBrains Mono` for cryptographic hashes, CVE IDs, SemVer constraints, and status tags.
  - `Inter` for crisp, legible interface copy.
- **Corner Accents**: Geometric crosshair accents (`.corner-accent-tl`, `.corner-accent-br`) giving an intelligence terminal look.

### 5.2 High-Performance HTML5 Canvas Force-Directed Engine
- **Decoupled Physics Loop**: Uses pure mutable JavaScript references (`useRef`) to avoid triggering React component re-render loops during 60 FPS animation.
- **Archimedean Golden Spiral Auto-Fit**: Disperses 64 nodes without overlap using:
  $$\text{radius} = 38 \cdot \sqrt{\text{index} + 1}, \quad \text{angle} = \text{index} \cdot 2.399963 \text{ rad}$$
- **Auto-Fit Viewport**: Automatically computes bounding box `[minX, maxX, minY, maxY]` and fits the graph within the canvas dimensions.
- **Scroll Isolation**: Non-passive native event listener with `{ passive: false }` stops window scrolling during mouse-wheel canvas zoom.
- **Snapshot Export**: Captures the canvas to high-res PNG with the click of a button.

---

# 6. FEATURE WALKTHROUGH

### 6.1 Dashboard & Search Registry (`/`)
- **Real-Time KPIs**: Total packages (75), versions (77), maintainers (10), known CVEs (17), dependency edges (153).
- **Debounced Search**: 300ms query filter with trending search chips (`enterprise-api-gateway`, `encode-utils`).
- **Sortable Package Ledger**: Interactive table columns for sorting by Package Name, Ecosystem, Dependency Count, or Vulnerability Status.

### 6.2 Package Detail Dossier (`/package/:name`)
- **Header & Governance**: Ecosystem badge, SemVer version, SPDX License, primary Maintainer.
- **Health Banner**: Real-time vulnerability risk status and upstream blast radius summary.
- **Interactive 4-Tab Layout**:
  1. *Interactive Topology Subgraph*: Force-directed subgraph centered around the package.
  2. *Attack Paths*: Step-by-step multi-hop attack chain visualization.
  3. *Transitive Dependents*: Full list of upstream packages affected by this package.
  4. *Downstream Dependencies*: Declared SemVer dependencies with latest available versions.
- **Manifest Exporter**: One-click JSON download of the complete package audit dossier.

### 6.3 Vulnerability Topology Hub (`/vulnerabilities`)
- **Maintainer Blast Radius Centrality**: Interactive visual meters ranking maintainers by supply chain leverage.
- **Searchable CVE Catalog**: Filter all 17 CVEs by severity (*Critical*, *High*, *Medium*) and target packages.
- **Shortest Attack Path Simulator**: Select any application package to trace recursive attack paths.

### 6.4 Global Topology Network (`/graph`)
- **Multi-Ecosystem Graph View**: Visualizes 64 nodes and 116 relationships simultaneously.
- **Interactive Node Inspector**: Clicking any node opens a live dossier with incoming/outgoing relationships and quick-action navigation buttons.
- **Camera Snapshot**: Instant PNG export of the topology.

---

# 7. INTERVIEW & EVALUATION DEFENSE PLAYBOOK

### Question 1: Why did you choose Software Supply Chain Dependency Analysis?
**Answer**: "Because dependency exposure is inherently a graph problem, not a tabular relational problem. Answering 'Which downstream systems are vulnerable to a 4-hop deep CVE?' requires variable-length path traversal that causes exponential join explosions in SQL CTEs, but executes in linear time in a graph database."

### Question 2: How does your Cypher query handle variable-depth paths?
**Answer**: "We utilize `shortestPath((v)-[:DEPENDS_ON*0..6]->...->(vuln))` and parameterized multi-hop traversals like `[:DEPENDS_ON*1..4]`. By parameterizing with `$rootName`, the query execution plan is cached in CognoDB and executes with index-free adjacency."

### Question 3: How did you ensure backend reliability against cloud connection drops?
**Answer**: "We configured `neo4j-driver` with `maxConnectionLifetime: 30s` to refresh pooled TCP sockets before cloud NAT firewalls drop them, added a 1-second pre-query liveness check, implemented an exponential backoff `withRetry` wrapper, and built a seamless in-memory fallback engine."

---

# 8. SUBMISSION & DEPLOYMENT CHECKLIST

- [x] Full source code committed with clear folder structure (`backend/`, `frontend/`, `docs/`, `seed/`).
- [x] Environment secrets isolated in `.env` and `.env.example` provided.
- [x] Connected to live CognoDB Cloud (`bolt+s://db-6e111080.databases.cognodb.com`).
- [x] 5 Node Labels, 5 Relationship Types, 75 Packages, 17 CVEs seeded.
- [x] Variable-depth shortest-path and multi-hop Cypher queries implemented.
- [x] Monotone Ink design system with skeleton loaders, empty states, and error handling.
- [x] HTML5 Canvas force-directed graph with Golden Spiral layout and PNG snapshot exporter.
- [x] Global <kbd>Ctrl + K</kbd> command palette.
- [ ] Push repository to GitHub.
- [ ] Deploy backend to Render/Railway and frontend to Vercel/Netlify.
- [ ] Record 2-3 minute video walkthrough and submit to `hr@wexa.ai`.
