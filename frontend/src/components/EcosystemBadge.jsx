export default function EcosystemBadge({ ecosystem }) {
  const eco = (ecosystem || 'npm').toLowerCase();

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '0.15rem 0.45rem',
        border: '1px solid var(--color-primary)',
        background: 'var(--color-surface-lowest)',
        fontSize: '0.7rem',
        fontFamily: 'var(--font-mono)',
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        color: 'var(--color-primary)',
      }}
    >
      {eco}
    </span>
  );
}
