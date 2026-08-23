import { Link } from 'react-router-dom';
import EmptyState from '../EmptyState.jsx';

export default function PackageDependenciesTab({ depList, directDepCount }) {
  if (directDepCount === 0) {
    return (
      <EmptyState
        title="Zero Dependencies"
        message="This is a foundational zero-dependency package."
      />
    );
  }

  return (
    <div className="ink-table-wrapper">
      <table className="ink-table">
        <thead>
          <tr>
            <th>Dependency Package</th>
            <th>Declared SemVer Constraint</th>
            <th>Latest Available</th>
            <th style={{ textAlign: 'right' }}>Action</th>
          </tr>
        </thead>
        <tbody>
          {depList.map((dep) => (
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
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', background: 'var(--color-surface-container)', padding: '0.2rem 0.5rem', border: '1px solid var(--color-outline-variant)' }}>
                  {dep.versionConstraint || dep.version || '*'}
                </span>
              </td>
              <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>
                {dep.latestVersion || '1.0.0'}
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
