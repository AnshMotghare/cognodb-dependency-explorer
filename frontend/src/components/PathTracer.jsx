import { Link } from 'react-router-dom';
import { Package, AlertTriangle, Shield, ArrowRight } from 'lucide-react';
import SeverityBadge from './SeverityBadge.jsx';

export default function PathTracer({ pathItem, index }) {
  if (!pathItem) return null;

  const { path = [], cveId, severity, description, hops, vulnerablePackage, vulnerableVersion } = pathItem;

  return (
    <div
      className="ink-card"
      style={{
        padding: '1.25rem',
        marginBottom: '1rem',
        borderLeft: severity === 'CRITICAL' ? '3px solid var(--color-error)' : '3px solid var(--color-warning)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', borderBottom: '1px solid var(--color-outline-variant)', paddingBottom: '0.6rem', marginBottom: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontWeight: 700, fontFamily: 'var(--font-mono)', fontSize: '0.9rem', color: 'var(--color-primary)' }}>
            {cveId}
          </span>
          <SeverityBadge severity={severity} />
        </div>
        <span style={{ fontSize: '0.75rem', color: 'var(--color-outline)', fontFamily: 'var(--font-mono)' }}>
          {hops === 0 ? 'DIRECT EXPOSURE (0 HOPS)' : `${hops} HOP${hops > 1 ? 'S' : ''} TRAVERSAL DEPTH`}
        </span>
      </div>

      {description && (
        <p style={{ fontSize: '0.85rem', color: 'var(--color-on-surface-variant)', lineHeight: 1.5, marginBottom: '1rem' }}>
          {description}
        </p>
      )}

      {/* Visual Flow Path */}
      <div className="path-line-connector">
        {path.map((nodeName, idx) => {
          const isRoot = idx === 0;
          const isLast = idx === path.length - 1;

          return (
            <div key={nodeName} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Link
                to={`/package/${encodeURIComponent(nodeName)}`}
                className={`path-step-node ${isRoot ? 'root' : ''} ${isLast ? 'vuln' : ''}`}
                title={isRoot ? 'Root package' : isLast ? 'Vulnerable dependency' : 'Transitive dependency'}
              >
                {isRoot && <Package size={16} />}
                {isLast && !isRoot && <AlertTriangle size={16} />}
                <span>{nodeName}</span>
                {isLast && vulnerableVersion && (
                  <span style={{ color: 'var(--color-outline)', fontSize: '0.75rem' }}>@{vulnerableVersion}</span>
                )}
              </Link>

              {idx < path.length - 1 && (
                <ArrowRight size={16} className="path-arrow-symbol" />
              )}
            </div>
          );
        })}

        <ArrowRight size={16} className="path-arrow-symbol" />
        <div className="path-step-node vuln" style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Shield size={16} />
          <span>{cveId}</span>
        </div>
      </div>
    </div>
  );
}
