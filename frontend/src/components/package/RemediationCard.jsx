import { useState, useEffect } from 'react';
import { Wrench, Copy, Check } from 'lucide-react';
import { api } from '../../api/client.js';

export default function RemediationCard({ packageName, isVulnerable }) {
  const [remediations, setRemediations] = useState([]);
  const [copiedId, setCopiedId] = useState(null);

  useEffect(() => {
    if (packageName && isVulnerable) {
      api.getRemediation(packageName)
        .then((res) => setRemediations(res.remediations || []))
        .catch(() => setRemediations([]));
    } else {
      setRemediations([]);
    }
  }, [packageName, isVulnerable]);

  if (!isVulnerable || remediations.length === 0) return null;

  function copyCommand(cmd, id) {
    navigator.clipboard.writeText(cmd);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  return (
    <div
      className="ink-card"
      style={{
        marginBottom: '2rem',
        borderColor: 'var(--color-primary)',
        background: 'var(--color-surface-container-low)',
      }}
    >
      <div className="ink-card-header">
        <h3 className="ink-card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Wrench size={18} />
          Automated Remediation & Upgrade Guidance
        </h3>
        <span style={{ fontSize: '0.7rem', color: 'var(--color-outline)' }}>
          GRAPH-ASSISTED PATCH ENGINE
        </span>
      </div>

      <p style={{ fontSize: '0.8rem', color: 'var(--color-on-surface-variant)', marginBottom: '1.25rem' }}>
        CognoDB analyzed the transitive attack paths for <strong>{packageName}</strong> and computed the minimal non-breaking version upgrades required to sever all active CVE exposures.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {remediations.map((rem) => {
          const itemKey = `${rem.cveId}-${rem.vulnerableDependency}-${rem.intermediateDependency}`;
          const cmd = `npm install ${rem.suggestedFix?.package || rem.intermediateDependency}@latest`;
          return (
            <div
              key={itemKey}
              style={{
                border: '1px solid var(--color-primary)',
                background: '#ffffff',
                padding: '1rem 1.25rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '1rem',
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span className="severity-pill critical" style={{ fontSize: '0.65rem' }}>
                    {rem.cveId}
                  </span>
                  <strong style={{ fontSize: '0.9rem', color: 'var(--color-primary)' }}>
                    {rem.recommendedAction}
                  </strong>
                </div>

                <div style={{ fontSize: '0.75rem', color: 'var(--color-on-surface-variant)', display: 'flex', gap: '1rem', marginTop: '0.25rem' }}>
                  <span>
                    Direct Target: <strong>{rem.suggestedFix?.package}</strong>
                  </span>
                  <span>|</span>
                  <span>
                    Risk: <strong style={{ color: 'var(--color-safe)' }}>{rem.suggestedFix?.breakingChangeRisk}</strong>
                  </span>
                  <span>|</span>
                  <span>
                    Attack Vector: {rem.hopsAway} hop(s) away
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <code
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.75rem',
                    background: 'var(--color-surface-container)',
                    padding: '0.35rem 0.6rem',
                    border: '1px solid var(--color-outline-variant)',
                  }}
                >
                  {cmd}
                </code>
                <button
                  type="button"
                  className="btn-ink"
                  onClick={() => copyCommand(cmd, itemKey)}
                  style={{ padding: '0.35rem 0.6rem', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                >
                  {copiedId === itemKey ? <Check size={13} color="var(--color-safe)" /> : <Copy size={13} />}
                  <span>{copiedId === itemKey ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
