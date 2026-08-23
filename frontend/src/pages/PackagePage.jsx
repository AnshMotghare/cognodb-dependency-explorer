import { useState, useReducer, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Network, Route, GitFork, Boxes } from 'lucide-react';
import { api } from '../api/client.js';
import GraphVisualizer from '../components/GraphVisualizer.jsx';
import PathTracer from '../components/PathTracer.jsx';
import LoadingState from '../components/LoadingState.jsx';
import ErrorState from '../components/ErrorState.jsx';
import EmptyState from '../components/EmptyState.jsx';
import PackageHeader from '../components/package/PackageHeader.jsx';
import RemediationCard from '../components/package/RemediationCard.jsx';
import PackageDependentsTab from '../components/package/PackageDependentsTab.jsx';
import PackageDependenciesTab from '../components/package/PackageDependenciesTab.jsx';

const initialPackageState = {
  pkg: null,
  dependents: null,
  dependencies: null,
  shortestPaths: [],
  graphData: null,
  loading: true,
  error: null,
};

function packageReducer(state, action) {
  switch (action.type) {
    case 'FETCH_START':
      return {
        ...state,
        loading: true,
        error: null,
      };
    case 'FETCH_SUCCESS':
      return {
        ...state,
        loading: false,
        error: null,
        pkg: action.payload.pkg,
        dependents: action.payload.dependents,
        dependencies: action.payload.dependencies,
        shortestPaths: action.payload.shortestPaths,
        graphData: action.payload.graphData,
      };
    case 'FETCH_ERROR':
      return {
        ...state,
        loading: false,
        error: action.payload,
      };
    default:
      return state;
  }
}

export default function PackagePage() {
  const { name } = useParams();
  const packageName = decodeURIComponent(name || '');

  const [state, dispatch] = useReducer(packageReducer, initialPackageState);
  const [activeTab, setActiveTab] = useState('graph'); // 'graph' | 'vulns' | 'dependents' | 'dependencies'

  const { pkg, dependents, dependencies, shortestPaths, graphData, loading, error } = state;

  const fetchPackageData = useCallback(() => {
    if (!packageName) return;
    dispatch({ type: 'FETCH_START' });

    Promise.all([
      api.getPackage(packageName),
      api.getPackageDependents(packageName, 4).catch(() => ({ dependents: [], totalCount: 0 })),
      api.getPackageDependencies(packageName).catch(() => []),
      api.getShortestPathToVulns(packageName).catch(() => []),
      api.getPackageGraph(packageName).catch(() => ({ nodes: [], links: [] })),
    ])
      .then(([pkgData, depsData, directDepsData, pathsData, gData]) => {
        dispatch({
          type: 'FETCH_SUCCESS',
          payload: {
            pkg: pkgData,
            dependents: depsData,
            dependencies: directDepsData,
            shortestPaths: Array.isArray(pathsData) ? pathsData : (pathsData?.paths || []),
            graphData: gData,
          },
        });
      })
      .catch((err) => {
        dispatch({
          type: 'FETCH_ERROR',
          payload: err.message || `Failed to retrieve package dossier for "${packageName}".`,
        });
      });
  }, [packageName]);

  useEffect(() => {
    fetchPackageData();
  }, [fetchPackageData]);

  if (loading) {
    return (
      <div className="page-container">
        <LoadingState type="detail" label={`Compiling graph dossier for ${packageName}...`} />
      </div>
    );
  }

  if (error || !pkg) {
    return (
      <div className="page-container">
        <ErrorState
          title="Dossier Lookup Failed"
          message={error || `Package "${packageName}" was not found in the indexed CognoDB ledger.`}
          details={`Package ID: ${packageName} | Registry: Global`}
          onRetry={fetchPackageData}
        />
      </div>
    );
  }

  const isVulnerable = (pkg.vulnerabilities && pkg.vulnerabilities.length > 0) || shortestPaths.length > 0;
  const upstreamCount = dependents?.totalCount || (dependents?.dependents ? dependents.dependents.length : 0);
  const dependentsList = dependents?.dependents || (Array.isArray(dependents) ? dependents : []);
  const depList = Array.isArray(dependencies) ? dependencies : (dependencies?.dependencies || []);
  const directDepCount = depList.length;

  return (
    <div className="page-container">
      <PackageHeader
        pkg={pkg}
        isVulnerable={isVulnerable}
        shortestPathsCount={shortestPaths.length}
        upstreamCount={upstreamCount}
        directDepCount={directDepCount}
        onRescan={fetchPackageData}
      />

      <RemediationCard packageName={pkg.name} isVulnerable={isVulnerable} />

      {/* Tabs Navigation */}
      <nav className="ink-tabs-bar">
        <button
          type="button"
          className={`ink-tab-btn ${activeTab === 'graph' ? 'active' : ''}`}
          onClick={() => setActiveTab('graph')}
        >
          <Network size={16} />
          <span>Interactive Subgraph</span>
        </button>
        <button
          type="button"
          className={`ink-tab-btn ${activeTab === 'vulns' ? 'active' : ''}`}
          onClick={() => setActiveTab('vulns')}
        >
          <Route size={16} />
          <span>Attack Paths ({shortestPaths.length})</span>
        </button>
        <button
          type="button"
          className={`ink-tab-btn ${activeTab === 'dependents' ? 'active' : ''}`}
          onClick={() => setActiveTab('dependents')}
        >
          <GitFork size={16} />
          <span>Transitive Dependents ({upstreamCount})</span>
        </button>
        <button
          type="button"
          className={`ink-tab-btn ${activeTab === 'dependencies' ? 'active' : ''}`}
          onClick={() => setActiveTab('dependencies')}
        >
          <Boxes size={16} />
          <span>Dependencies ({directDepCount})</span>
        </button>
      </nav>

      {/* Tab Panels */}
      <section style={{ marginTop: '1.5rem' }}>
        {/* Tab 1: Interactive Subgraph */}
        {activeTab === 'graph' && (
          <div>
            <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--color-outline)' }}>
                FORCE-DIRECTED SUBGRAPH // 1-HOP RADIUS
              </span>
              <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--color-outline)' }}>
                {graphData?.nodes?.length || 0} nodes · {graphData?.links?.length || 0} edges
              </span>
            </div>
            {graphData && graphData.nodes?.length > 0 ? (
              <GraphVisualizer graphData={graphData} height="480px" />
            ) : (
              <EmptyState
                title="Subgraph Unavailable"
                message="No connected nodes found in the immediate neighborhood of this package."
              />
            )}
          </div>
        )}

        {/* Tab 2: Attack Paths */}
        {activeTab === 'vulns' && (
          <div>
            {shortestPaths.length === 0 ? (
              <EmptyState
                title="Status: Clear"
                message="No CVE vulnerabilities found in the dependency attack chains of this package."
              />
            ) : (
              <div>
                <div style={{ marginBottom: '1.25rem', fontSize: '0.85rem', color: 'var(--color-on-surface-variant)' }}>
                  Traced shortest paths from <strong>{pkg.name}</strong> to reachable CVE security advisories:
                </div>
                {shortestPaths.map((p) => (
                  <PathTracer key={`${p.cveId}-${p.path?.join('-')}`} pathItem={p} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Transitive Dependents (Upstream Blast Radius) */}
        {activeTab === 'dependents' && (
          <PackageDependentsTab
            dependentsList={dependentsList}
            upstreamCount={upstreamCount}
          />
        )}

        {/* Tab 4: Downstream Dependencies */}
        {activeTab === 'dependencies' && (
          <PackageDependenciesTab
            depList={depList}
            directDepCount={directDepCount}
          />
        )}
      </section>
    </div>
  );
}
