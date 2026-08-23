export default function GraphTooltip({ tooltip }) {
  if (!tooltip || !tooltip.node) return null;

  return (
    <div
      style={{
        position: 'absolute',
        left: tooltip.x,
        top: tooltip.y,
        background: 'var(--color-surface-lowest)',
        border: '1px solid var(--color-primary)',
        boxShadow: '2px 2px 0px var(--color-primary)',
        padding: '0.5rem 0.75rem',
        fontSize: '0.75rem',
        fontFamily: 'var(--font-mono)',
        pointerEvents: 'none',
        zIndex: 20,
        maxWidth: '220px',
      }}
    >
      <div style={{ fontWeight: 700, color: 'var(--color-primary)', marginBottom: '0.2rem' }}>
        {tooltip.node.label || tooltip.node.id}
      </div>
      <div style={{ color: 'var(--color-outline)', fontSize: '0.7rem' }}>
        TYPE: {tooltip.node.type}
      </div>
      {tooltip.node.severity && (
        <div style={{ color: 'var(--color-error)', fontWeight: 600, marginTop: '0.2rem' }}>
          SEVERITY: {tooltip.node.severity}
        </div>
      )}
      <div style={{ fontSize: '0.65rem', textDecoration: 'underline', marginTop: '0.3rem', color: 'var(--color-primary)' }}>
        Click to inspect ➔
      </div>
    </div>
  );
}
