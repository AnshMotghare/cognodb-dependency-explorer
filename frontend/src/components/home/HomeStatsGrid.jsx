import LoadingState from '../LoadingState.jsx';
import ErrorState from '../ErrorState.jsx';

export default function HomeStatsGrid({ loading, error, stats, onRetry }) {
  if (loading) {
    return <LoadingState type="stats" label="Aggregating CognoDB graph metrics..." />;
  }

  if (error) {
    return (
      <ErrorState
        title="Metrics Unavailable"
        message={error}
        onRetry={onRetry}
      />
    );
  }

  if (!stats) return null;

  return (
    <section className="ink-stats-grid">
      <div className="ink-stat-card">
        <div className="ink-stat-label">Total Packages</div>
        <div className="ink-stat-value">{stats.packageCount || 0}</div>
        <div className="ink-stat-sub">Across 3 registries</div>
      </div>
      <div className="ink-stat-card">
        <div className="ink-stat-label">Versions Indexed</div>
        <div className="ink-stat-value">{stats.versionCount || 0}</div>
        <div className="ink-stat-sub">SemVer revisions</div>
      </div>
      <div className="ink-stat-card">
        <div className="ink-stat-label">Dependency Edges</div>
        <div className="ink-stat-value">{stats.dependencyCount || 0}</div>
        <div className="ink-stat-sub">Connected graph links</div>
      </div>
      <div className="ink-stat-card">
        <div className="ink-stat-label">Known CVEs</div>
        <div className="ink-stat-value" style={{ color: 'var(--color-error)' }}>
          {stats.vulnCount || 0}
        </div>
        <div className="ink-stat-sub">Indexed security advisories</div>
      </div>
      <div className="ink-stat-card">
        <div className="ink-stat-label">Maintainers</div>
        <div className="ink-stat-value">{stats.maintainerCount || 0}</div>
        <div className="ink-stat-sub">Ecosystem contributors</div>
      </div>
    </section>
  );
}
