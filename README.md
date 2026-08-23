# CognoDB — Dependency & Vulnerability Explorer

An advanced, production-grade graph database application built on **CognoDB** (Neo4j Bolt-compatible openCypher graph engine). It allows security engineers, enterprise architects, and developers to explore open-source software supply chain dependencies, trace multi-hop transitive CVE exposures, and calculate maintainer blast radius centrality in real-time.

---

## 🏆 Project Highlights & Engineering Standards

- **React Doctor Score**: **100 / 100 Great** (`✔ No issues found!` across all 38 frontend components).
- **Production Build**: Vite production compile in **< 3s with 0 errors**.
- **Real-World Graph Dataset**: 75 packages across npm, PyPI, and crates, 77 version nodes, 10 maintainers, 17 CVEs (6 Critical, 7 High, 4 Medium), and 153 directed dependency edges spanning up to 4 hops.
- **In-Browser openCypher IDE Console (`/cypher`)**: Interactive query runner with live millisecond telemetry over Bolt.
- **"What-If" Blast Radius Simulation Sandbox (`/sandbox`)**: Real-time zero-day compromise simulator.
- **Automated Remediation Engine**: Non-breaking SemVer upgrade recommender on package dossiers.
- **Multi-Format Dossier Exporter**: Export audit dossiers as **JSON Manifests (.json)**, **CSV Spreadsheets (.csv)**, or **Markdown Reports (.md)**.
- **Monotone Ink Design System**: Editorial typography, Lucide React vector icons, and multi-device responsive layout with mobile bottom app navigation dock.
- **Centered Ledger Pagination**: 10, 20, 50, 100 items-per-page controls.

---

## 1. Why a Graph Database?

Package dependency exposure is inherently a **connections** problem, not a **rows** problem:

1. **Recursive Transitive Reach**: A vulnerability in one foundational utility package doesn't just affect that package — it impacts every package that depends on it, directly or transitively, at any depth. Answering *"Which packages are exposed to `CVE-2025-10234`?"* means walking a chain that could be 1 hop or 6 hops deep without knowing the depth in advance.
2. **Variable-Length Traversal vs. SQL CTEs**: In a relational schema, variable-depth queries require complex recursive Common Table Expressions (CTEs) or application-side N+1 round-trips. In Cypher, it is expressed cleanly in a single pattern:
   ```cypher
   MATCH (root:Package {name: $rootName})-[:HAS_VERSION]->(v:Version)
   MATCH (vuln:Vulnerability)
   MATCH path = shortestPath(
     (v)-[:DEPENDS_ON*0..6]->(:Package)-[:HAS_VERSION]->(:Version)-[:AFFECTED_BY]->(vuln)
   )
   RETURN [n IN nodes(path) WHERE n:Package | n.name] AS path,
          vuln.cveId AS cveId, vuln.severity AS severity, length(path) AS hops
   ORDER BY hops ASC LIMIT 10;
   ```
3. **Index-Free Adjacency**: Relational joins take $O(\log N)$ index lookups per hop. CognoDB traverses physical memory pointers in $O(1)$ time, making graph traversals $O(V + E)$ regardless of total database size.
4. **Maintainer Centrality Blast Radius**: *"Which maintainer, if their credentials or account were compromised, would affect the most downstream packages across the supply chain?"* In a graph database, this is an efficient inbound dependency traversal. In a relational database, this requires recursive self-joins of unknown depth.

---

## 2. Graph Data Model

### Node Labels
| Label | Key Properties | Semantic Purpose |
|---|---|---|
| `:Package` | `name` (unique), `ecosystem` | A named library across npm, PyPI, or crates. |
| `:Version` | `version`, `releaseDate` | A specific published SemVer revision. |
| `:Maintainer` | `name`, `email` (unique) | Open-source developer or organization. |
| `:License` | `name`, `type` | Governing software license (MIT, Apache-2.0, etc.). |
| `:Vulnerability` | `cveId` (unique), `severity`, `description` | Known CVE security flaw advisory. |

### Relationships
| Relationship | Direction | Meaning |
|---|---|---|
| `(:Package)-[:HAS_VERSION]->(:Version)` | Package → Version | Published version release. |
| `(:Version)-[:DEPENDS_ON {versionRange}]->(:Package)` | Version → Package | Declared dependency (recursive multi-hop edge). |
| `(:Version)-[:MAINTAINED_BY]->(:Maintainer)` | Version → Maintainer | Author responsibility. |
| `(:Version)-[:LICENSED_UNDER]->(:License)` | Version → License | Software legal governance. |
| `(:Version)-[:AFFECTED_BY]->(:Vulnerability)` | Version → Vulnerability | Active CVE vulnerability mapping. |

---

## 3. Project Architecture

```text
cognodb-dependency-explorer/
├── backend/
│   ├── src/
│   │   ├── config/db.js               # Neo4j driver, keep-alive recycling, retry wrapper & pool
│   │   ├── routes/
│   │   │   ├── packages.js            # Package detail, search, multi-hop dependents
│   │   │   └── queries.js             # Cypher console, Sandbox, Remediation, stats, blast radius
│   │   ├── services/
│   │   │   ├── cypherQueries.js       # Parameterized openCypher queries
│   │   │   └── localGraphEngine.js    # In-memory graph engine fallback for zero-downtime
│   │   ├── middleware/errorHandler.js # Centralized JSON error responses
│   │   ├── app.js                     # Express app configuration
│   │   └── server.js                  # Server entry point (port 4000)
│   ├── seed/
│   │   ├── data/packages.json         # 75 realistic packages with multi-tier CVE chains
│   │   └── seed.js                    # Parameterized Cypher loader with indexes & constraints
│   ├── generate_pdf.js                # 19-page master PDF dossier generator
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx             # Top console header, sidebar, mobile bottom dock
│   │   │   ├── CommandPalette.jsx     # Native HTML5 dialog Ctrl+K quick switcher
│   │   │   ├── GraphVisualizer.jsx    # 60 FPS HTML5 Canvas force-directed graph
│   │   │   ├── PathTracer.jsx         # Step-by-step CVE attack chain visualizer
│   │   │   ├── SeverityBadge.jsx      # Severity pills (Critical, High, Medium, Safe)
│   │   │   ├── EcosystemBadge.jsx     # Ecosystem pills (npm, PyPI, crates)
│   │   │   ├── LoadingState.jsx       # Shimmer skeleton states
│   │   │   ├── EmptyState.jsx         # Empty query state
│   │   │   └── ErrorState.jsx         # Friendly error display with retry
│   │   ├── pages/
│   │   │   ├── Home.jsx               # Dashboard, search, filters & centered pagination
│   │   │   ├── PackagePage.jsx        # Package dossier, 4 tabs, remediation card & export
│   │   │   ├── VulnerabilityExplorer.jsx # Maintainer blast radius & CVE shortest path
│   │   │   ├── GraphExplorer.jsx      # Global interactive topology network
│   │   │   ├── CypherPlayground.jsx   # In-browser openCypher query console
│   │   │   └── QuarantineSandbox.jsx  # "What-If" blast radius compromise sandbox
│   │   ├── api/client.js              # Central API client
│   │   ├── index.css                  # Monotone Ink responsive design system
│   │   └── App.jsx                    # React Router configuration
│   ├── index.html                     # HTML5 shell with custom favicon.svg
│   ├── package.json
│   └── vite.config.js
└── docs/
    ├── CognoDB_Project_Comprehensive_Guide.pdf # 19-page master PDF blueprint
    └── COGNODB_PROJECT_MASTER_DOSSIER.md       # Markdown master dossier
```

---

## 4. Quick Start & Execution

### 4.1 Prerequisites
- Node.js 18+ (Tested on Node.js 20 & 22)
- CognoDB Cloud instance (or use built-in local graph engine fallback)

### 4.2 Setup Backend
```bash
cd backend
npm install

# (Optional) Add your CognoDB credentials in backend/.env:
# COGNODB_URI=bolt+s://db-6e111080.databases.cognodb.com
# COGNODB_USER=cognodb
# COGNODB_PASSWORD=your-password
# PORT=4000

npm run seed     # Seeds 75 packages, 77 versions, 17 CVEs, 153 edges into CognoDB
npm start        # Starts Express server on http://localhost:4000
```

### 4.3 Setup Frontend
```bash
cd ../frontend
npm install
npm run dev      # Launches Vite UI on http://localhost:5173
npm run build    # Compiles production bundle with 0 errors
```

---

## 5. Standout Graph Features

1. **In-Browser openCypher Console (`/cypher`)**:
   - Write and run arbitrary declarative graph queries.
   - Pre-loaded templates for attack paths, maintainer centrality, and KPIs.
   - Real-time execution timing in milliseconds (`12 ms`) over Bolt.
2. **"What-If" Blast Radius Simulation Sandbox (`/sandbox`)**:
   - Pick any package or maintainer to simulate zero-day supply chain compromise.
   - Live calculates the cascading disruption score and severed microservices.
3. **Automated Vulnerability Remediation Engine**:
   - Displays safe SemVer upgrade recommendations on package dossiers to sever CVE exposure.
4. **Multi-Format Dossier Exporter**:
   - Exports dossiers as **JSON Manifests (.json)**, **CSV Spreadsheets (.csv)**, or **Markdown Reports (.md)**.
5. **Centered Bottom Pagination**:
   - 10, 20, 50, or 100 packages per page with smart state reset.

---

## 6. Verification & Health

```text
React Doctor — cognodb-dependency-explorer-frontend
Score: 100 / 100 Great
✔ No issues found!
```

---

## 7. Submission Dossier & Documentation

- **19-Page Master PDF Guide**: [`docs/CognoDB_Project_Comprehensive_Guide.pdf`](docs/CognoDB_Project_Comprehensive_Guide.pdf)
- **Comprehensive Markdown Blueprint**: [`docs/COGNODB_PROJECT_MASTER_DOSSIER.md`](docs/COGNODB_PROJECT_MASTER_DOSSIER.md)
