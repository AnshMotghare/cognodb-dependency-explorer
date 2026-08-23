import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Package, Bug } from 'lucide-react';
import { api } from '../api/client.js';
import SeverityBadge from './SeverityBadge.jsx';
import EcosystemBadge from './EcosystemBadge.jsx';

export default function CommandPalette({ isOpen, onClose }) {
  const [query, setQuery] = useState('');
  const [packages, setPackages] = useState([]);
  const [vulns, setVulns] = useState([]);
  const inputRef = useRef(null);
  const dialogRef = useRef(null);
  const navigate = useNavigate();

  // Manage native dialog open/close lifecycle
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      setQuery('');
      if (!dialog.open) {
        dialog.showModal();
      }
      const timeoutId = setTimeout(() => inputRef.current?.focus(), 50);

      Promise.all([
        api.getPackages().catch(() => []),
        api.getVulnerabilities().catch(() => []),
      ]).then(([pkgData, vulnData]) => {
        setPackages(pkgData || []);
        setVulns(vulnData || []);
      });

      return () => clearTimeout(timeoutId);
    } else if (dialog.open) {
      dialog.close();
    }
  }, [isOpen]);

  const q = query.toLowerCase().trim();

  const filteredPackages = packages
    .filter((p) => !q || p.name.toLowerCase().includes(q) || p.ecosystem?.toLowerCase().includes(q))
    .slice(0, 5);

  const filteredVulns = vulns
    .filter((v) => !q || v.cveId?.toLowerCase().includes(q) || v.description?.toLowerCase().includes(q))
    .slice(0, 4);

  const allResults = [
    ...filteredPackages.map((p) => ({ type: 'package', data: p })),
    ...filteredVulns.map((v) => ({ type: 'vuln', data: v })),
  ];

  function handleSelect(item) {
    if (!item) return;
    onClose();
    if (item.type === 'package') {
      navigate(`/package/${encodeURIComponent(item.data.name)}`);
    } else {
      navigate('/vulnerabilities');
    }
  }

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      aria-label="Quick Command Palette"
      style={{
        margin: '10vh auto auto auto',
        padding: 0,
        width: '100%',
        maxWidth: '620px',
        background: '#ffffff',
        border: '2px solid var(--color-primary)',
        boxShadow: '6px 6px 0px var(--color-primary)',
        overflow: 'hidden',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {/* Header Search Input */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '1rem 1.25rem',
            borderBottom: '1px solid var(--color-primary)',
            background: 'var(--color-surface-lowest)',
          }}
        >
          <Search size={20} style={{ color: 'var(--color-primary)' }} />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search package name, ecosystem, or CVE ID..."
            aria-label="Search packages, ecosystems, and CVE vulnerabilities"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{
              flex: 1,
              border: 'none',
              outline: 'none',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.95rem',
              color: 'var(--color-primary)',
              background: 'transparent',
            }}
          />
          <button
            type="button"
            onClick={onClose}
            aria-label="Close command palette"
            style={{
              fontSize: '0.65rem',
              fontFamily: 'var(--font-mono)',
              border: '1px solid var(--color-outline)',
              background: 'transparent',
              padding: '0.15rem 0.35rem',
              color: 'var(--color-outline)',
              cursor: 'pointer',
            }}
          >
            ESC TO CLOSE
          </button>
        </div>

        {/* Results List */}
        <div style={{ maxHeight: '380px', overflowY: 'auto', padding: '0.5rem 0' }}>
          {allResults.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-outline)', fontSize: '0.85rem' }}>
              No matching packages or vulnerabilities found.
            </div>
          ) : (
            <div>
              {/* Packages Category */}
              {filteredPackages.length > 0 && (
                <div>
                  <div
                    style={{
                      padding: '0.4rem 1.25rem',
                      fontSize: '0.65rem',
                      fontFamily: 'var(--font-mono)',
                      textTransform: 'uppercase',
                      color: 'var(--color-outline)',
                      letterSpacing: '0.05em',
                    }}
                  >
                    Package Registry Dossiers
                  </div>
                  {filteredPackages.map((p) => (
                    <button
                      type="button"
                      key={p.name}
                      onClick={() => handleSelect({ type: 'package', data: p })}
                      style={{
                        width: '100%',
                        textAlign: 'left',
                        background: 'transparent',
                        padding: '0.65rem 1.25rem',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        cursor: 'pointer',
                        border: 'none',
                        borderBottom: '1px solid var(--color-outline-variant)',
                        transition: 'background 0.15s ease',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-surface-container)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <Package size={18} style={{ color: 'var(--color-outline)' }} />
                        <div>
                          <strong style={{ color: 'var(--color-primary)', fontSize: '0.85rem' }}>{p.name}</strong>
                          <div style={{ fontSize: '0.7rem', color: 'var(--color-outline)' }}>
                            {p.directDepCount || 0} direct dependencies
                          </div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <EcosystemBadge ecosystem={p.ecosystem} />
                        {p.isVulnerable && <SeverityBadge severity={p.highestSeverity || 'CRITICAL'} />}
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Vulnerabilities Category */}
              {filteredVulns.length > 0 && (
                <div style={{ marginTop: '0.5rem' }}>
                  <div
                    style={{
                      padding: '0.4rem 1.25rem',
                      fontSize: '0.65rem',
                      fontFamily: 'var(--font-mono)',
                      textTransform: 'uppercase',
                      color: 'var(--color-outline)',
                      letterSpacing: '0.05em',
                    }}
                  >
                    Security Advisories (CVEs)
                  </div>
                  {filteredVulns.map((v) => (
                    <button
                      type="button"
                      key={v.cveId}
                      onClick={() => handleSelect({ type: 'vuln', data: v })}
                      style={{
                        width: '100%',
                        textAlign: 'left',
                        background: 'transparent',
                        padding: '0.65rem 1.25rem',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        cursor: 'pointer',
                        border: 'none',
                        borderBottom: '1px solid var(--color-outline-variant)',
                        transition: 'background 0.15s ease',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-surface-container)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <Bug size={18} style={{ color: 'var(--color-error)' }} />
                        <div>
                          <strong style={{ color: 'var(--color-primary)', fontSize: '0.85rem' }}>{v.cveId}</strong>
                          <div style={{ fontSize: '0.7rem', color: 'var(--color-on-surface-variant)', maxWidth: '340px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {v.description}
                          </div>
                        </div>
                      </div>
                      <SeverityBadge severity={v.severity} />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer info */}
        <div
          style={{
            padding: '0.6rem 1.25rem',
            background: 'var(--color-surface-container)',
            borderTop: '1px solid var(--color-primary)',
            fontSize: '0.65rem',
            fontFamily: 'var(--font-mono)',
            color: 'var(--color-outline)',
            display: 'flex',
            justifyContent: 'space-between',
          }}
        >
          <span>TIP: Type any keyword to filter both packages and CVEs</span>
          <span>ENTER TO OPEN</span>
        </div>
      </div>
    </dialog>
  );
}
