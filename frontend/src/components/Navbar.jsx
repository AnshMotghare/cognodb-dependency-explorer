import { useState, useEffect } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { Terminal, Search, Bug, Network, Shield, Code, Flame } from 'lucide-react';
import { api } from '../api/client.js';

export function Sidebar({ onOpenPalette }) {
  const [dbStatus, setDbStatus] = useState({ database: 'Checking...', isLive: false });

  useEffect(() => {
    api.getStatus()
      .then(setDbStatus)
      .catch(() => setDbStatus({ database: 'Disconnected', isLive: false }));
  }, []);

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
          <Terminal size={20} strokeWidth={2.2} />
          <span className="sidebar-title">SECURITY CONSOLE</span>
        </div>
        <span style={{ fontSize: '0.65rem', color: 'var(--color-outline)', textTransform: 'uppercase' }}>
          COGNDB // INTEL-LEDGER
        </span>
      </div>

      {/* Quick Search Button */}
      <button
        type="button"
        onClick={onOpenPalette}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.5rem 0.75rem',
          margin: '0.5rem 0 1rem 0',
          background: 'var(--color-surface-container)',
          border: '1px solid var(--color-primary)',
          color: 'var(--color-outline)',
          fontSize: '0.75rem',
          fontFamily: 'var(--font-mono)',
          cursor: 'pointer',
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <Search size={15} />
          <span>Quick Find...</span>
        </span>
        <span style={{ border: '1px solid var(--color-outline)', padding: '0.1rem 0.3rem', fontSize: '0.65rem' }}>
          CTRL+K
        </span>
      </button>

      <ul className="sidebar-menu">
        <li>
          <NavLink to="/" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} end>
            <Search size={18} />
            <span>Search Registry</span>
          </NavLink>
        </li>
        <li>
          <NavLink to="/vulnerabilities" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
            <Bug size={18} />
            <span>Vulnerabilities</span>
          </NavLink>
        </li>
        <li>
          <NavLink to="/graph" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
            <Network size={18} />
            <span>Topology Graph</span>
          </NavLink>
        </li>
        <li>
          <NavLink to="/sandbox" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
            <Flame size={18} />
            <span>Blast Sandbox</span>
          </NavLink>
        </li>
        <li>
          <NavLink to="/cypher" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
            <Code size={18} />
            <span>Cypher Console</span>
          </NavLink>
        </li>
      </ul>

      <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid var(--color-outline-variant)' }}>
        <div className="status-indicator" title={dbStatus.database}>
          <span className={`status-dot ${dbStatus.isLive ? '' : 'offline'}`}></span>
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {dbStatus.isLive ? 'CognoDB Online' : 'Graph Fallback'}
          </span>
        </div>
      </div>
    </aside>
  );
}

export function TopHeader({ onOpenPalette }) {
  return (
    <header className="top-header">
      <Link to="/" className="brand-title" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Shield size={24} strokeWidth={2.2} />
        <span>SecGraph Explorer</span>
      </Link>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <button
          type="button"
          onClick={onOpenPalette}
          className="btn-ink"
          style={{ fontSize: '0.7rem', padding: '0.3rem 0.6rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
        >
          <Search size={14} />
          <span>Find (CTRL+K)</span>
        </button>

        <nav className="header-links">
          <NavLink to="/" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} end>
            Search
          </NavLink>
          <NavLink to="/vulnerabilities" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            Vulnerabilities
          </NavLink>
          <NavLink to="/graph" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            Topology
          </NavLink>
          <NavLink to="/sandbox" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            Sandbox
          </NavLink>
          <NavLink to="/cypher" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            Cypher
          </NavLink>
        </nav>
      </div>
    </header>
  );
}

export function MobileBottomNav() {
  return (
    <nav className="mobile-bottom-bar">
      <NavLink to="/" className={({ isActive }) => `mobile-nav-link ${isActive ? 'active' : ''}`} end>
        <Search size={18} />
        <span>Search</span>
      </NavLink>
      <NavLink to="/vulnerabilities" className={({ isActive }) => `mobile-nav-link ${isActive ? 'active' : ''}`}>
        <Bug size={18} />
        <span>Vulns</span>
      </NavLink>
      <NavLink to="/graph" className={({ isActive }) => `mobile-nav-link ${isActive ? 'active' : ''}`}>
        <Network size={18} />
        <span>Graph</span>
      </NavLink>
      <NavLink to="/sandbox" className={({ isActive }) => `mobile-nav-link ${isActive ? 'active' : ''}`}>
        <Flame size={18} />
        <span>Sandbox</span>
      </NavLink>
      <NavLink to="/cypher" className={({ isActive }) => `mobile-nav-link ${isActive ? 'active' : ''}`}>
        <Code size={18} />
        <span>Cypher</span>
      </NavLink>
    </nav>
  );
}
