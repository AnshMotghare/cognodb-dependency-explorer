import { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { MousePointerClick, Network, GitFork, Search } from 'lucide-react';
import { api } from '../api/client.js';
import GraphVisualizer from '../components/GraphVisualizer.jsx';
import LoadingState from '../components/LoadingState.jsx';
import ErrorState from '../components/ErrorState.jsx';
import SeverityBadge from '../components/SeverityBadge.jsx';
import EcosystemBadge from '../components/EcosystemBadge.jsx';

export default function GraphExplorer() {
  const [ecosystem, setEcosystem] = useState('');
  const [graphData, setGraphData] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchFullGraph = useCallback(() => {
    setLoading(true);
    setError(null);
    setSelectedNode(null);

    api.getFullGraph(ecosystem || undefined)
      .then((data) => {
        setGraphData(data);
      })
      .catch((err) => {
        setError(err.message || 'Failed to fetch global ecosystem network graph from CognoDB.');
      })
      .finally(() => setLoading(false));
  }, [ecosystem]);

  useEffect(() => {
    fetchFullGraph();
  }, [fetchFullGraph]);

  // Find and deduplicate connected links for the selected node
  const uniqueConnectedLinks = useMemo(() => {
    if (!selectedNode || !graphData?.links) return [];

    const seen = new Set();
    const result = [];

    for (const l of graphData.links) {
      const s = typeof l.source === 'object' ? l.source.id : l.source;
      const t = typeof l.target === 'object' ? l.target.id : l.target;

      if (s === selectedNode.id || t === selectedNode.id) {
        const uniqueRelKey = `${s}-${l.label}-${t}`;
        if (!seen.has(uniqueRelKey)) {
          seen.add(uniqueRelKey);
          const targetName = s === selectedNode.id ? t : s;
          const direction = s === selectedNode.id ? '➔' : '⬅';
          result.push({
            key: uniqueRelKey,
            label: l.label,
            targetName,
            direction,
          });
        }
      }
    }

    return result;
  }, [selectedNode, graphData]);

  return (
    <div className="page-container">
      {/* Page Header */}
      <header
        style={{
          borderBottom: '1px solid var(--color-primary)',
          paddingBottom: '1.25rem',
          marginBottom: '2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
            <Network size={28} style={{ color: 'var(--color-primary)' }} />
            <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '2.5rem', fontWeight: 600, color: 'var(--color-primary)', letterSpacing: '-0.02em' }}>
              Global Topology Network
            </h1>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--color-on-surface-variant)' }}>
            MULTI-ECOSYSTEM COGNODB TOPOLOGY // REAL-TIME FORCE DIRECTED GRAPH
          </p>
        </div>

        {/* Ecosystem Filter Chips */}
        <div style={{ display: 'flex', border: '1px solid var(--color-primary)' }}>
          {[
            { label: 'ALL ECOSYSTEMS', value: '' },
            { label: 'NPM', value: 'npm' },
            { label: 'PYPI', value: 'pypi' },
            { label: 'CRATES', value: 'crates' },
          ].map((eco) => (
            <button
              key={eco.value}
              className={`btn-ink ${ecosystem === eco.value ? 'btn-ink-primary' : ''}`}
              style={{ border: 'none', padding: '0.4rem 0.75rem', fontSize: '0.7rem' }}
              onClick={() => setEcosystem(eco.value)}
            >
              {eco.label}
            </button>
          ))}
        </div>
      </header>

      {/* Network Container */}
      <section className="ink-card" style={{ padding: 0, marginBottom: '2rem' }}>
        <div className="ink-card-header" style={{ margin: 0, padding: '1rem 1.5rem', borderBottom: '1px solid var(--color-primary)' }}>
          <h3 className="ink-card-title">
            <GitFork size={18} />
            Ecosystem Topology Explorer
          </h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.75rem', color: 'var(--color-outline)' }}>
            <span>{graphData?.nodes?.length || 0} Nodes</span>
            <span>·</span>
            <span>{graphData?.links?.length || 0} Links</span>
          </div>
        </div>

        {loading ? (
          <div style={{ padding: '3rem' }}>
            <LoadingState type="detail" label="Simulating network graph physics from CognoDB..." />
          </div>
        ) : error ? (
          <div style={{ padding: '2rem' }}>
            <ErrorState
              title="Graph Topology Error"
              message={error}
              onRetry={fetchFullGraph}
            />
          </div>
        ) : graphData && graphData.nodes?.length > 0 ? (
          <GraphVisualizer
            graphData={graphData}
            height="580px"
            onNodeClick={(node) => setSelectedNode(node)}
          />
        ) : (
          <div style={{ padding: '3rem', textAlign: 'center' }}>
            <p style={{ color: 'var(--color-on-surface-variant)' }}>No graph data returned for selected filter.</p>
          </div>
        )}
      </section>

      {/* Interactive Node Inspector Dossier Card */}
      <section className="ink-card">
        <div className="corner-accent-tl"></div>
        <div className="corner-accent-tr"></div>
        <div className="corner-accent-bl"></div>
        <div className="corner-accent-br"></div>

        <div className="ink-card-header">
          <h3 className="ink-card-title">
            <Search size={18} />
            Node Inspector
          </h3>
          <span style={{ fontSize: '0.7rem', color: 'var(--color-outline)' }}>
            {selectedNode ? `SELECTED: ${selectedNode.type.toUpperCase()}` : 'SELECT A NODE TO INSPECT'}
          </span>
        </div>

        {selectedNode ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.4rem' }}>
                  {selectedNode.ecosystem && <EcosystemBadge ecosystem={selectedNode.ecosystem} />}
                  {selectedNode.severity && <SeverityBadge severity={selectedNode.severity} />}
                  <span style={{ fontSize: '0.7rem', border: '1px solid var(--color-outline)', padding: '0.15rem 0.4rem', textTransform: 'uppercase' }}>
                    {selectedNode.type}
                  </span>
                </div>
                <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.75rem', fontWeight: 700, color: 'var(--color-primary)' }}>
                  {selectedNode.label || selectedNode.id}
                </h2>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                {selectedNode.type === 'Package' && (
                  <Link
                    to={`/package/${encodeURIComponent(selectedNode.label || selectedNode.id)}`}
                    className="btn-ink btn-ink-primary"
                    style={{ fontSize: '0.75rem', padding: '0.4rem 0.85rem' }}
                  >
                    Open Package Dossier ➔
                  </Link>
                )}
                {selectedNode.type === 'Vulnerability' && (
                  <Link
                    to="/vulnerabilities"
                    className="btn-ink btn-ink-primary"
                    style={{ fontSize: '0.75rem', padding: '0.4rem 0.85rem' }}
                  >
                    View in Vulnerability Hub ➔
                  </Link>
                )}
              </div>
            </div>

            {/* Connected Relationships */}
            <div>
              <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-outline)', marginBottom: '0.5rem' }}>
                Connected Relationships ({uniqueConnectedLinks.length})
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {uniqueConnectedLinks.map((item) => (
                  <span
                    key={item.key}
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.75rem',
                      border: '1px solid var(--color-outline-variant)',
                      padding: '0.25rem 0.5rem',
                      background: 'var(--color-surface-container)',
                    }}
                  >
                    {item.direction} {item.label}: <strong>{item.targetName}</strong>
                  </span>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div style={{ padding: '1.5rem 0', textAlign: 'center', color: 'var(--color-on-surface-variant)', fontSize: '0.85rem' }}>
            <MousePointerClick size={32} style={{ color: 'var(--color-outline)', margin: '0 auto 0.5rem auto', display: 'block' }} />
            Click on any node in the topology above to view its relationships, security metadata, and direct dossier links.
          </div>
        )}
      </section>
    </div>
  );
}
