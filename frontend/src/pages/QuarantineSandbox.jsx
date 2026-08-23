import { useState, useEffect, useCallback } from 'react';
import { ShieldAlert, AlertOctagon, Flame, Zap, RefreshCw } from 'lucide-react';
import { api } from '../api/client.js';
import EcosystemBadge from '../components/EcosystemBadge.jsx';

const DEFAULT_TARGETS = [
  { type: 'package', name: 'encode-utils' },
  { type: 'package', name: 'jwt-authenticator' },
  { type: 'package', name: 'http-fetch-lite' },
  { type: 'maintainer', name: 'Alice Developer' },
  { type: 'maintainer', name: 'Dave Infra' },
];

export default function QuarantineSandbox() {
  const [targetType, setTargetType] = useState('package');
  const [targetName, setTargetName] = useState('encode-utils');
  const [simulation, setSimulation] = useState(null);
  const [loading, setLoading] = useState(false);

  const runSimulation = useCallback(async (type = targetType, name = targetName) => {
    setLoading(true);
    try {
      const res = await api.simulateQuarantine(type, name);
      setSimulation(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [targetType, targetName]);

  useEffect(() => {
    runSimulation('package', 'encode-utils');
  }, [runSimulation]);

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Header */}
      <div style={{ borderBottom: '1px solid var(--color-primary)', paddingBottom: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <ShieldAlert size={24} color="var(--color-error)" />
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '2rem', fontWeight: 600, color: 'var(--color-primary)' }}>
            Blast Radius Simulation Sandbox
          </h1>
        </div>
        <p style={{ fontSize: '0.85rem', color: 'var(--color-on-surface-variant)' }}>
          Simulate zero-day supply chain compromises or package quarantines to calculate cascading infrastructure disruptions in real-time.
        </p>
      </div>

      {/* Target Selection Bar */}
      <div className="ink-card" style={{ padding: '1.25rem', background: 'var(--color-surface-lowest)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', border: '1px solid var(--color-primary)' }}>
              <button
                type="button"
                className={`btn-ink ${targetType === 'package' ? 'btn-ink-primary' : ''}`}
                style={{ border: 'none', fontSize: '0.75rem', padding: '0.4rem 0.8rem' }}
                onClick={() => {
                  setTargetType('package');
                  setTargetName('encode-utils');
                }}
              >
                Package Strike
              </button>
              <button
                type="button"
                className={`btn-ink ${targetType === 'maintainer' ? 'btn-ink-primary' : ''}`}
                style={{ border: 'none', fontSize: '0.75rem', padding: '0.4rem 0.8rem' }}
                onClick={() => {
                  setTargetType('maintainer');
                  setTargetName('Alice Developer');
                }}
              >
                Maintainer Compromise
              </button>
            </div>

            <input
              type="text"
              value={targetName}
              onChange={(e) => setTargetName(e.target.value)}
              aria-label="Simulation target name"
              placeholder={targetType === 'package' ? 'Enter package name...' : 'Enter maintainer name...'}
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.85rem',
                padding: '0.4rem 0.8rem',
                border: '1px solid var(--color-primary)',
                background: 'transparent',
                outline: 'none',
                minWidth: '220px',
              }}
            />
          </div>

          <button
            type="button"
            className="btn-ink btn-ink-primary"
            onClick={() => runSimulation()}
            disabled={loading}
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', borderColor: 'var(--color-error)' }}
          >
            {loading ? <RefreshCw size={15} className="animate-spin" /> : <Flame size={16} />}
            <span>Simulate Disruption</span>
          </button>
        </div>

        {/* Quick presets */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1rem', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.7rem', color: 'var(--color-outline)', textTransform: 'uppercase' }}>
            Simulation Scenarios:
          </span>
          {DEFAULT_TARGETS.map((t) => (
            <button
              key={`${t.type}-${t.name}`}
              type="button"
              className="ink-chip"
              onClick={() => {
                setTargetType(t.type);
                setTargetName(t.name);
                runSimulation(t.type, t.name);
              }}
              style={{ fontSize: '0.7rem' }}
            >
              {t.type === 'package' ? '📦' : '👤'} {t.name}
            </button>
          ))}
        </div>
      </div>

      {/* Simulation Results Dashboard */}
      {simulation && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Key Metrics Grid */}
          <div className="ink-stats-grid">
            <div className="ink-stat-card" style={{ borderColor: 'var(--color-error)' }}>
              <span className="ink-stat-label">DISRUPTION SCORE</span>
              <span className="ink-stat-value" style={{ color: 'var(--color-error)' }}>
                {simulation.disruptionScore}%
              </span>
              <span className="ink-stat-helper">of indexed ecosystem impacted</span>
            </div>

            <div className="ink-stat-card">
              <span className="ink-stat-label">SEVERED SERVICES</span>
              <span className="ink-stat-value">
                {simulation.severedCount}
              </span>
              <span className="ink-stat-helper">downstream packages broken</span>
            </div>

            <div className="ink-stat-card">
              <span className="ink-stat-label">CASCADE DEPTH</span>
              <span className="ink-stat-value">
                {Math.max(...(simulation.severedPackages?.map((p) => p.depth) || [0]))} hops
              </span>
              <span className="ink-stat-helper">maximum propagation reach</span>
            </div>

            <div className="ink-stat-card">
              <span className="ink-stat-label">TARGET VECTOR</span>
              <span className="ink-stat-value" style={{ fontSize: '1.2rem', textTransform: 'capitalize' }}>
                {simulation.targetType}
              </span>
              <span className="ink-stat-helper">{simulation.targetName}</span>
            </div>
          </div>

          {/* Severed Packages List */}
          <div className="ink-card">
            <div className="ink-card-header">
              <h3 className="ink-card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <AlertOctagon size={18} color="var(--color-error)" />
                Cascading Downstream Casualties ({simulation.severedCount})
              </h3>
              <span style={{ fontSize: '0.7rem', color: 'var(--color-outline)' }}>
                UPSTREAM IMPACT TRACE
              </span>
            </div>

            <div className="ink-table-wrapper" style={{ border: 'none' }}>
              <table className="ink-table">
                <thead>
                  <tr>
                    <th>Casualty Package</th>
                    <th>Ecosystem</th>
                    <th>Impact Severity</th>
                    <th>Cascade Distance</th>
                    <th style={{ textAlign: 'right' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {simulation.severedPackages.map((p) => (
                    <tr key={p.name}>
                      <td>
                        <strong style={{ color: p.isRootQuarantined ? 'var(--color-error)' : 'var(--color-primary)' }}>
                          {p.name}
                        </strong>
                      </td>
                      <td>
                        <EcosystemBadge ecosystem={p.ecosystem} />
                      </td>
                      <td>
                        {p.isRootQuarantined ? (
                          <span className="severity-pill critical">● ZERO-DAY GROUND ZERO</span>
                        ) : p.depth === 1 ? (
                          <span className="severity-pill high">● DIRECT DEPENDENT (IMMEDIATE)</span>
                        ) : (
                          <span className="severity-pill medium">● TRANSITIVE CASCADE (INDIRECT)</span>
                        )}
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)' }}>
                        {p.isRootQuarantined ? 'Origin' : `${p.depth} hop${p.depth > 1 ? 's' : ''} away`}
                      </td>
                      <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
                        <span style={{ color: 'var(--color-error)', display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                          <Zap size={13} />
                          SEVERED
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
