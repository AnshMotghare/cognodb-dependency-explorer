import { Link } from 'react-router-dom';
import EcosystemBadge from '../EcosystemBadge.jsx';
import EmptyState from '../EmptyState.jsx';

export default function PackageDependentsTab({ dependentsList, upstreamCount }) {
  if (upstreamCount === 0 || dependentsList.length === 0) {
    return (
      <EmptyState
        title="No Upstream Dependents"
        message="No other packages in the indexed registry currently declare a dependency on this package."
      />
    );
  }

  return (
    <div className="ink-table-wrapper">
      <table className="ink-table">
        <thead>
          <tr>
            <th>Dependent Package</th>
            <th>Ecosystem</th>
            <th>Shortest Hop Distance</th>
            <th style={{ textAlign: 'right' }}>Action</th>
          </tr>
        </thead>
        <tbody>
          {dependentsList.map((dep) => (
            <tr key={dep.name}>
              <td>
                <Link
                  to={`/package/${encodeURIComponent(dep.name)}`}
                  style={{ fontWeight: 700, color: 'var(--color-primary)', textDecoration: 'none' }}
                >
                  {dep.name}
                </Link>
              </td>
              <td>
                <EcosystemBadge ecosystem={dep.ecosystem} />
              </td>
              <td>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', background: 'var(--color-surface-container)', padding: '0.2rem 0.5rem', border: '1px solid var(--color-outline-variant)' }}>
                  {dep.distance || dep.hops || 1} HOP{dep.distance > 1 || dep.hops > 1 ? 'S' : ''} UPSTREAM
                </span>
              </td>
              <td style={{ textAlign: 'right' }}>
                <Link
                  to={`/package/${encodeURIComponent(dep.name)}`}
                  className="btn-ink"
                  style={{ fontSize: '0.7rem', padding: '0.25rem 0.6rem' }}
                >
                  Inspect ➔
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
