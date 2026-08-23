import { useState } from 'react';
import { Play, Code, Clock, Database, Download, CheckCircle2, AlertCircle } from 'lucide-react';
import { api } from '../api/client.js';

const PRESET_QUERIES = [
  {
    title: '1. Shortest Attack Paths to CVEs',
    cypher: `MATCH (p:Package {name: 'enterprise-api-gateway'})-[:DEPENDS_ON*1..5]->(dep:Package)-[:AFFECTED_BY]->(v:Vulnerability)
RETURN p.name AS Root, dep.name AS VulnerableDep, v.cveId AS CVE, v.severity AS Severity
LIMIT 10`,
  },
  {
    title: '2. Maintainer Blast Radius Ranking',
    cypher: `MATCH (m:Maintainer)-[:MAINTAINS]->(root:Package)
OPTIONAL MATCH (downstream:Package)-[:DEPENDS_ON*1..4]->(root)
RETURN m.name AS Maintainer, m.email AS Email, count(DISTINCT downstream) AS BlastRadius
ORDER BY BlastRadius DESC
LIMIT 7`,
  },
  {
    title: '3. Transitive Dependency Upstream Reach',
    cypher: `MATCH (caller:Package)-[:DEPENDS_ON*1..3]->(target:Package {name: 'encode-utils'})
RETURN caller.name AS DependentPackage, caller.ecosystem AS Ecosystem
LIMIT 15`,
  },
  {
    title: '4. CognoDB Entity Summary & Stats',
    cypher: `MATCH (p:Package), (v:Vulnerability), (m:Maintainer)
RETURN count(DISTINCT p) AS Packages, count(DISTINCT v) AS CVEs, count(DISTINCT m) AS Maintainers`,
  },
];

export default function CypherPlayground() {
  const [queryText, setQueryText] = useState(PRESET_QUERIES[0].cypher);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  async function handleExecute(queryToRun = queryText) {
    setLoading(true);
    setError(null);
    try {
      const res = await api.runCypherQuery(queryToRun);
      setResult(res);
    } catch (err) {
      setError(err.message || 'Cypher query execution failed.');
      setResult(null);
    } finally {
      setLoading(false);
    }
  }

  function handleSelectPreset(presetCypher) {
    setQueryText(presetCypher);
    handleExecute(presetCypher);
  }

  function handleExportJSON() {
    if (!result?.records) return;
    const jsonStr = JSON.stringify(result.records, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cypher-result-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Header */}
      <div style={{ borderBottom: '1px solid var(--color-primary)', paddingBottom: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <Code size={24} />
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '2rem', fontWeight: 600, color: 'var(--color-primary)' }}>
            openCypher Query Console
          </h1>
        </div>
        <p style={{ fontSize: '0.85rem', color: 'var(--color-on-surface-variant)' }}>
          Execute real-time declarative graph traversals against CognoDB over the Bolt protocol with timing diagnostics.
        </p>
      </div>

      {/* Preset Query Chips */}
      <div>
        <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--color-outline)', display: 'block', marginBottom: '0.5rem' }}>
          Pre-Loaded Traversal Templates:
        </span>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          {PRESET_QUERIES.map((q) => (
            <button
              key={q.title}
              type="button"
              className="ink-chip"
              onClick={() => handleSelectPreset(q.cypher)}
              style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem' }}
            >
              {q.title}
            </button>
          ))}
        </div>
      </div>

      {/* Query Editor Box */}
      <div className="ink-card" style={{ padding: '1rem', background: 'var(--color-surface-lowest)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
          <span style={{ fontSize: '0.7rem', fontFamily: 'var(--font-mono)', color: 'var(--color-outline)' }}>
            CYPHER EDITOR // READ-ONLY MODE
          </span>
          <button
            type="button"
            className="btn-ink btn-ink-primary"
            onClick={() => handleExecute()}
            disabled={loading}
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.4rem 1rem' }}
          >
            <Play size={15} />
            <span>{loading ? 'Executing...' : 'Run Query'}</span>
          </button>
        </div>

        <textarea
          value={queryText}
          onChange={(e) => setQueryText(e.target.value)}
          aria-label="Cypher query editor"
          rows={6}
          style={{
            width: '100%',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.9rem',
            background: 'var(--color-surface-container-low)',
            border: '1px solid var(--color-primary)',
            padding: '1rem',
            color: 'var(--color-primary)',
            outline: 'none',
            resize: 'vertical',
            lineHeight: 1.5,
          }}
          onKeyDown={(e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
              e.preventDefault();
              handleExecute();
            }
          }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem', fontSize: '0.7rem', color: 'var(--color-outline)' }}>
          <span>Press CTRL+ENTER to run</span>
          <span>Target: CognoDB Graph Cluster</span>
        </div>
      </div>

      {/* Execution Diagnostics Bar */}
      {result && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem',
            padding: '0.75rem 1.25rem',
            background: 'var(--color-surface-container)',
            border: '1px solid var(--color-primary)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', fontSize: '0.8rem', fontFamily: 'var(--font-mono)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--color-safe)' }}>
              <CheckCircle2 size={16} />
              <strong>{result.rowCount} record(s)</strong>
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Clock size={15} />
              <span>{result.executionTimeMs} ms</span>
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Database size={15} />
              <span>{result.engine}</span>
            </span>
          </div>

          <button
            type="button"
            className="btn-ink"
            onClick={handleExportJSON}
            style={{ fontSize: '0.7rem', padding: '0.25rem 0.6rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
          >
            <Download size={14} />
            <span>Export JSON</span>
          </button>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div
          style={{
            padding: '1rem 1.25rem',
            background: 'var(--color-error-bg)',
            border: '1px solid var(--color-error)',
            color: 'var(--color-error)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
          }}
        >
          <AlertCircle size={20} />
          <div>
            <strong>Query Error:</strong> {error}
          </div>
        </div>
      )}

      {/* Result Table */}
      {result && result.records && result.records.length > 0 && (
        <div className="ink-table-wrapper">
          <table className="ink-table">
            <thead>
              <tr>
                {result.columns.map((col) => (
                  <th key={col}>{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {result.records.map((row, rowIdx) => (
                <tr key={`row-${rowIdx + 1}`}>
                  {result.columns.map((col) => {
                    const val = row[col];
                    const displayVal = typeof val === 'object' ? JSON.stringify(val) : String(val ?? '');
                    return (
                      <td key={`${rowIdx}-${col}`} style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>
                        {displayVal}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
