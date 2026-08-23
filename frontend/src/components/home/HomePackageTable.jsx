import { useState } from 'react';
import { Link } from 'react-router-dom';
import SeverityBadge from '../SeverityBadge.jsx';
import EcosystemBadge from '../EcosystemBadge.jsx';
import LoadingState from '../LoadingState.jsx';
import ErrorState from '../ErrorState.jsx';
import EmptyState from '../EmptyState.jsx';
import PackagePagination from './PackagePagination.jsx';

const ECOSYSTEM_FILTERS = [
  { label: 'ALL', value: '' },
  { label: 'NPM', value: 'npm' },
  { label: 'PYPI', value: 'pypi' },
  { label: 'CRATES', value: 'crates' },
];

export default function HomePackageTable({
  packages,
  loading,
  error,
  ecosystem,
  onEcosystemChange,
  vulnerableOnly,
  onVulnerableOnlyChange,
  sortField,
  sortDir,
  onSort,
  onResetFilters,
  debouncedQuery,
  onRetry,
}) {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const totalItems = packages.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  
  // Safe page clamping
  const activePage = Math.min(currentPage, totalPages);
  const startIndex = (activePage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);
  const visiblePackages = packages.slice(startIndex, endIndex);

  return (
    <section>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid var(--color-primary)', paddingBottom: '0.75rem', marginBottom: '1.25rem' }}>
        <div>
          <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.35rem', fontWeight: 600, color: 'var(--color-primary)' }}>
            Package Registry Ledger
          </h3>
          <span style={{ fontSize: '0.75rem', color: 'var(--color-on-surface-variant)' }}>
            {totalItems} package records matching filters
          </span>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', border: '1px solid var(--color-primary)' }}>
            {ECOSYSTEM_FILTERS.map((eco) => (
              <button
                key={eco.value}
                type="button"
                className={`btn-ink ${ecosystem === eco.value ? 'btn-ink-primary' : ''}`}
                style={{ border: 'none', padding: '0.35rem 0.65rem', fontSize: '0.7rem' }}
                onClick={() => onEcosystemChange(eco.value)}
              >
                {eco.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            className={`btn-ink ${vulnerableOnly ? 'btn-ink-primary' : ''}`}
            style={{ fontSize: '0.7rem', borderColor: vulnerableOnly ? 'var(--color-error)' : 'var(--color-primary)' }}
            onClick={() => onVulnerableOnlyChange(!vulnerableOnly)}
          >
            ⚠️ Vulnerable Only
          </button>
        </div>
      </div>

      {/* Content Table / Loading / Error */}
      {loading ? (
        <LoadingState type="table" rows={6} label="Traversing package ledger..." />
      ) : error ? (
        <ErrorState
          title="Registry Query Failed"
          message={error}
          onRetry={onRetry}
        />
      ) : totalItems === 0 ? (
        <EmptyState
          title="No Matching Packages"
          message={`No package records matched query "${debouncedQuery || ecosystem}". Try broadening your search or resetting filters.`}
          actionLabel="Reset Search Filters"
          onAction={onResetFilters}
        />
      ) : (
        <>
          <div className="ink-table-wrapper">
            <table className="ink-table">
              <thead>
                <tr>
                  <th>
                    <button
                      type="button"
                      onClick={() => onSort('name')}
                      style={{ background: 'none', border: 'none', font: 'inherit', color: 'inherit', cursor: 'pointer', padding: 0, display: 'inline-flex', alignItems: 'center', gap: '0.25rem', textTransform: 'inherit' }}
                    >
                      <span>Package Name</span>
                      <span>{sortField === 'name' ? (sortDir === 'asc' ? '▲' : '▼') : ''}</span>
                    </button>
                  </th>
                  <th>
                    <button
                      type="button"
                      onClick={() => onSort('ecosystem')}
                      style={{ background: 'none', border: 'none', font: 'inherit', color: 'inherit', cursor: 'pointer', padding: 0, display: 'inline-flex', alignItems: 'center', gap: '0.25rem', textTransform: 'inherit' }}
                    >
                      <span>Ecosystem</span>
                      <span>{sortField === 'ecosystem' ? (sortDir === 'asc' ? '▲' : '▼') : ''}</span>
                    </button>
                  </th>
                  <th>Latest Version</th>
                  <th>
                    <button
                      type="button"
                      onClick={() => onSort('directDepCount')}
                      style={{ background: 'none', border: 'none', font: 'inherit', color: 'inherit', cursor: 'pointer', padding: 0, display: 'inline-flex', alignItems: 'center', gap: '0.25rem', textTransform: 'inherit' }}
                    >
                      <span>Direct Dependencies</span>
                      <span>{sortField === 'directDepCount' ? (sortDir === 'asc' ? '▲' : '▼') : ''}</span>
                    </button>
                  </th>
                  <th>
                    <button
                      type="button"
                      onClick={() => onSort('isVulnerable')}
                      style={{ background: 'none', border: 'none', font: 'inherit', color: 'inherit', cursor: 'pointer', padding: 0, display: 'inline-flex', alignItems: 'center', gap: '0.25rem', textTransform: 'inherit' }}
                    >
                      <span>Security Status</span>
                      <span>{sortField === 'isVulnerable' ? (sortDir === 'asc' ? '▲' : '▼') : ''}</span>
                    </button>
                  </th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {visiblePackages.map((pkg) => (
                  <tr key={pkg.name}>
                    <td>
                      <Link
                        to={`/package/${encodeURIComponent(pkg.name)}`}
                        style={{ fontWeight: 700, color: 'var(--color-primary)', textDecoration: 'none' }}
                      >
                        {pkg.name}
                      </Link>
                    </td>
                    <td>
                      <EcosystemBadge ecosystem={pkg.ecosystem} />
                    </td>
                    <td>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', background: 'var(--color-surface-container)', padding: '0.15rem 0.4rem', border: '1px solid var(--color-outline-variant)' }}>
                        {pkg.latestVersion || '1.0.0'}
                      </span>
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>
                      {pkg.directDepCount !== undefined ? pkg.directDepCount : '-'} deps
                    </td>
                    <td>
                      {pkg.isVulnerable || pkg.directVulnCount > 0 ? (
                        <SeverityBadge severity={pkg.highestSeverity || (pkg.severities?.[0]) || 'CRITICAL'} />
                      ) : (
                        <span className="severity-pill safe">● VERIFIED CLEAN</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <Link
                        to={`/package/${encodeURIComponent(pkg.name)}`}
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

          <PackagePagination
            currentPage={activePage}
            totalPages={totalPages}
            pageSize={pageSize}
            totalItems={totalItems}
            startIndex={startIndex}
            endIndex={endIndex}
            onPageChange={setCurrentPage}
            onPageSizeChange={(newSize) => {
              setPageSize(newSize);
              setCurrentPage(1);
            }}
          />
        </>
      )}
    </section>
  );
}
