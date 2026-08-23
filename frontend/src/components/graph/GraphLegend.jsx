export default function GraphLegend() {
  return (
    <div
      style={{
        position: 'absolute',
        top: '1rem',
        left: '1rem',
        background: 'rgba(255, 255, 255, 0.95)',
        border: '1px solid var(--color-primary)',
        padding: '0.5rem 0.75rem',
        fontSize: '0.7rem',
        fontFamily: 'var(--font-mono)',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.25rem',
        zIndex: 10,
        pointerEvents: 'none',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
        <span style={{ width: '8px', height: '8px', border: '1px solid #000', background: '#edecfc', display: 'inline-block' }}></span>
        <span>Root Package</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
        <span style={{ width: '8px', height: '8px', border: '1px solid #000', background: '#ffffff', display: 'inline-block' }}></span>
        <span>Dependency</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
        <span style={{ width: '8px', height: '8px', border: '1px solid #ba1a1a', background: '#fff5f5', display: 'inline-block' }}></span>
        <span>Vulnerability</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
        <span style={{ width: '8px', height: '8px', border: '1px solid #137333', background: '#e6f4ea', display: 'inline-block' }}></span>
        <span>Maintainer</span>
      </div>
    </div>
  );
}
