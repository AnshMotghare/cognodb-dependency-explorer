import { Search } from 'lucide-react';

const TRENDING_PACKAGES = [
  'enterprise-api-gateway',
  'http-fetch-lite',
  'fastapi-jwt-auth',
  'tokio-async-runtime',
  'encode-utils',
];

export default function HomeHero({ query, onQueryChange, searchInputRef }) {
  return (
    <section className="hero-box">
      <div className="hero-dossier-tag">
        <div className="hero-dossier-line"></div>
        <span>SECGRAPH // INTEL-QUERY // DOSSIER-0192</span>
        <div className="hero-dossier-line"></div>
      </div>

      <h1 className="hero-heading">Dependency Intelligence</h1>
      <p className="hero-lead">
        Query global registries for package vulnerabilities, deep multi-hop dependency graphs, and live blast radius analysis.
      </p>

      {/* Debounced Search Input */}
      <div className="search-form">
        <Search className="search-icon-pos" size={20} />
        <input
          ref={searchInputRef}
          type="text"
          className="search-input-field"
          placeholder="Search package name (e.g. enterprise-api-gateway, encode-utils)..."
          aria-label="Search package name by keyword"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          autoComplete="off"
          spellCheck="false"
        />
        <span className="search-shortcut-badge">CTRL+K</span>
      </div>

      {/* Trending Query Chips */}
      <div className="trending-chips">
        <span style={{ color: 'var(--color-on-surface-variant)', textTransform: 'uppercase', fontSize: '0.7rem' }}>
          Trending:
        </span>
        {TRENDING_PACKAGES.map((pkg) => (
          <button
            key={pkg}
            type="button"
            className="ink-chip"
            onClick={() => onQueryChange(pkg)}
          >
            {pkg}
          </button>
        ))}
      </div>
    </section>
  );
}
