import { Link } from 'react-router-dom';
import SeverityBadge from '../SeverityBadge.jsx';

export default function HomeTrendingVulns({ trendingVulns, visible }) {
  if (!visible || !trendingVulns || trendingVulns.length === 0) return null;

  return (
    <section style={{ marginBottom: '2.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '1rem', borderBottom: '1px solid var(--color-primary)', paddingBottom: '0.5rem' }}>
        <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.35rem', fontWeight: 600, color: 'var(--color-primary)' }}>
          Trending Vulnerable Packages
        </h3>
        <Link to="/vulnerabilities" className="btn-ink" style={{ fontSize: '0.7rem' }}>
          View All Advisories ➔
        </Link>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.25rem' }}>
        {trendingVulns.map((v) => (
          <article key={v.cveId} className="ink-card" style={{ display: 'flex', flexDirection: 'column' }}>
            <div className="corner-accent-tl"></div>
            <div className="corner-accent-tr"></div>
            <div className="corner-accent-bl"></div>
            <div className="corner-accent-br"></div>

            <div className="ink-card-header">
              <div>
                <h4 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.05rem', fontWeight: 700, color: 'var(--color-primary)' }}>
                  {v.cveId}
                </h4>
                <span style={{ fontSize: '0.7rem', color: 'var(--color-outline)' }}>
                  Affects: {v.affectedPackageCount || v.directlyAffectedPackages?.length || 1} package(s)
                </span>
              </div>
              <SeverityBadge severity={v.severity} />
            </div>

            <p style={{ fontSize: '0.85rem', color: 'var(--color-on-surface-variant)', lineHeight: 1.5, flex: 1, marginBottom: '1rem' }}>
              {v.description || 'Security advisory identified in dependency graph.'}
            </p>

            <div style={{ borderTop: '1px dashed var(--color-outline-variant)', paddingTop: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)' }}>
                <span style={{ color: 'var(--color-outline)' }}>Impact Reach: </span>
                <strong>{v.totalBlastRadius || ((v.directCount || 0) + (v.downstreamCount || 0))} downstream</strong>
              </div>
              <Link to="/vulnerabilities" className="btn-ink" style={{ fontSize: '0.65rem', padding: '0.25rem 0.5rem' }}>
                Trace Path ➔
              </Link>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
