import { ShieldCheck } from 'lucide-react';

export default function EmptyState({
  title = 'Status: Clear',
  message = 'No records found matching your query criteria in the registry.',
  actionLabel,
  onAction,
}) {
  return (
    <div className="ink-card" style={{ maxWidth: '640px', margin: '2rem auto', textAlign: 'center' }}>
      <div className="corner-accent-tl"></div>
      <div className="corner-accent-tr"></div>
      <div className="corner-accent-bl"></div>
      <div className="corner-accent-br"></div>

      <div style={{ width: '80px', height: '80px', margin: '0 auto 1.5rem auto', border: '1px solid var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-surface-container-low)', position: 'relative' }}>
        <ShieldCheck size={38} color="var(--color-primary)" />
      </div>

      <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.75rem', fontWeight: 600, color: 'var(--color-primary)', marginBottom: '0.5rem' }}>
        {title}
      </h2>

      <div style={{ width: '48px', height: '1px', background: 'var(--color-primary)', margin: '0 auto 1rem auto' }}></div>

      <p style={{ fontSize: '0.9rem', color: 'var(--color-on-surface-variant)', lineHeight: 1.6, marginBottom: '1.5rem' }}>
        {message}
      </p>

      {actionLabel && onAction && (
        <button type="button" className="btn-ink btn-ink-primary" onClick={onAction}>
          {actionLabel}
        </button>
      )}

      <div style={{ marginTop: '1.5rem', paddingTop: '0.75rem', borderTop: '1px solid var(--color-outline-variant)', fontSize: '0.7rem', color: 'var(--color-outline)', display: 'flex', justifyContent: 'space-between' }}>
        <span>LEDGER SYNC: CURRENT</span>
        <span>AUDIT STATUS: VERIFIED</span>
      </div>
    </div>
  );
}
