import { AlertCircle, RefreshCw } from 'lucide-react';

export default function ErrorState({
  title = 'Connection Failure',
  message = 'We could not complete the graph query against the database.',
  details = '',
  onRetry,
}) {
  return (
    <div className="ink-card" style={{ maxWidth: '640px', margin: '2rem auto', textAlign: 'center', borderColor: 'var(--color-error)' }}>
      <div className="corner-accent-tl" style={{ borderColor: 'var(--color-error)' }}></div>
      <div className="corner-accent-tr" style={{ borderColor: 'var(--color-error)' }}></div>
      <div className="corner-accent-bl" style={{ borderColor: 'var(--color-error)' }}></div>
      <div className="corner-accent-br" style={{ borderColor: 'var(--color-error)' }}></div>

      <div style={{ width: '64px', height: '64px', margin: '0 auto 1.25rem auto', border: '1px solid var(--color-error)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-error-bg)' }}>
        <AlertCircle size={32} color="var(--color-error)" />
      </div>

      <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.75rem', fontWeight: 600, color: 'var(--color-error)', marginBottom: '0.75rem' }}>
        {title}
      </h2>

      <div style={{ width: '48px', height: '1px', background: 'var(--color-error)', margin: '0 auto 1rem auto' }}></div>

      <p style={{ fontSize: '0.9rem', color: 'var(--color-on-surface-variant)', lineHeight: 1.6, marginBottom: '1.25rem' }}>
        {message}
      </p>

      {details && (
        <div style={{ padding: '0.75rem', background: 'var(--color-surface-container)', border: '1px solid var(--color-outline-variant)', fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--color-primary)', textAlign: 'left', marginBottom: '1.5rem', wordBreak: 'break-word' }}>
          <strong>Diagnostic Trace:</strong> {details}
        </div>
      )}

      <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
        {onRetry && (
          <button type="button" className="btn-ink btn-ink-primary" onClick={onRetry} style={{ borderColor: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <RefreshCw size={15} />
            Retry Operation
          </button>
        )}
        <button
          type="button"
          className="btn-ink"
          onClick={() => window.location.reload()}
        >
          Reload Interface
        </button>
      </div>

      <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--color-outline-variant)', fontSize: '0.7rem', color: 'var(--color-outline)', display: 'flex', justifyContent: 'space-between' }}>
        <span>LEDGER STATE: ERROR</span>
        <span>CODE: DB_EXCEPTION</span>
      </div>
    </div>
  );
}
