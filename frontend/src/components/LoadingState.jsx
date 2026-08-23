import { Loader2 } from 'lucide-react';

export default function LoadingState({
  type = 'card', // 'card' | 'table' | 'stats' | 'detail' | 'graph'
  rows = 5,
  label = 'Querying CognoDB ledger...',
}) {
  return (
    <div style={{ width: '100%', padding: '1rem 0' }}>
      {/* Header bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Loader2 size={16} style={{ animation: 'spin 1.2s linear infinite', color: 'var(--color-primary)' }} />
          <span style={{ fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-primary)' }}>
            {label}
          </span>
        </div>
        <span style={{ fontSize: '0.7rem', color: 'var(--color-outline)', textTransform: 'uppercase' }}>
          TRAVERSING GRAPH
        </span>
      </div>

      {type === 'stats' && (
        <div className="ink-stats-grid">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="ink-stat-card">
              <div className="skeleton-box skeleton-text" style={{ width: '60%' }}></div>
              <div className="skeleton-box skeleton-title" style={{ height: '36px', width: '80%' }}></div>
              <div className="skeleton-box skeleton-text" style={{ width: '40%' }}></div>
            </div>
          ))}
        </div>
      )}

      {type === 'table' && (
        <div className="ink-table-wrapper">
          <div style={{ padding: '0.75rem 1rem', background: 'var(--color-surface-container)', borderBottom: '1px solid var(--color-primary)' }}>
            <div className="skeleton-box" style={{ height: '16px', width: '30%' }}></div>
          </div>
          {Array.from({ length: rows }).map((_, i) => (
            <div key={`row-${i + 1}`} style={{ padding: '1rem', borderBottom: '1px solid var(--color-outline-variant)', display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
              <div className="skeleton-box" style={{ height: '16px', width: '25%' }}></div>
              <div className="skeleton-box" style={{ height: '16px', width: '15%' }}></div>
              <div className="skeleton-box" style={{ height: '16px', width: '15%' }}></div>
              <div className="skeleton-box" style={{ height: '16px', width: '20%' }}></div>
              <div className="skeleton-box" style={{ height: '28px', width: '10%', marginLeft: 'auto' }}></div>
            </div>
          ))}
        </div>
      )}

      {type === 'detail' && (
        <div className="ink-card">
          <div className="corner-accent-tl"></div>
          <div className="corner-accent-tr"></div>
          <div className="corner-accent-bl"></div>
          <div className="corner-accent-br"></div>
          <div className="skeleton-box" style={{ height: '32px', width: '40%', marginBottom: '1rem' }}></div>
          <div className="skeleton-box" style={{ height: '16px', width: '70%', marginBottom: '1.5rem' }}></div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
            <div className="skeleton-box" style={{ height: '60px' }}></div>
            <div className="skeleton-box" style={{ height: '60px' }}></div>
            <div className="skeleton-box" style={{ height: '60px' }}></div>
          </div>
          <div className="skeleton-box" style={{ height: '240px' }}></div>
        </div>
      )}

      {type === 'card' && (
        <div className="ink-card">
          <div className="corner-accent-tl"></div>
          <div className="corner-accent-tr"></div>
          <div className="corner-accent-bl"></div>
          <div className="corner-accent-br"></div>
          <div className="skeleton-box skeleton-title"></div>
          <div className="skeleton-box skeleton-text" style={{ width: '90%' }}></div>
          <div className="skeleton-box skeleton-text" style={{ width: '75%' }}></div>
          <div className="skeleton-box skeleton-text" style={{ width: '85%' }}></div>
          <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem' }}>
            <div className="skeleton-box" style={{ height: '32px', width: '120px' }}></div>
            <div className="skeleton-box" style={{ height: '32px', width: '120px' }}></div>
          </div>
        </div>
      )}
    </div>
  );
}
