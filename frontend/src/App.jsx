import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Sidebar, TopHeader, MobileBottomNav } from './components/Navbar.jsx';
import CommandPalette from './components/CommandPalette.jsx';
import ScrollToTop from './components/ScrollToTop.jsx';
import Home from './pages/Home.jsx';
import PackagePage from './pages/PackagePage.jsx';
import VulnerabilityExplorer from './pages/VulnerabilityExplorer.jsx';
import GraphExplorer from './pages/GraphExplorer.jsx';
import CypherPlayground from './pages/CypherPlayground.jsx';
import QuarantineSandbox from './pages/QuarantineSandbox.jsx';

export default function App() {
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);

  // Global CTRL+K / CMD+K trigger
  useEffect(() => {
    function handleKeyDown(e) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsPaletteOpen((prev) => !prev);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <BrowserRouter>
      <ScrollToTop />
      <div className="app-shell">
        <Sidebar onOpenPalette={() => setIsPaletteOpen(true)} />
        <div className="main-viewport">
          <TopHeader onOpenPalette={() => setIsPaletteOpen(true)} />
          <main className="content-area">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/package/:name" element={<PackagePage />} />
              <Route path="/vulnerabilities" element={<VulnerabilityExplorer />} />
              <Route path="/graph" element={<GraphExplorer />} />
              <Route path="/cypher" element={<CypherPlayground />} />
              <Route path="/sandbox" element={<QuarantineSandbox />} />
            </Routes>
          </main>
          <MobileBottomNav />
        </div>
      </div>
      <CommandPalette isOpen={isPaletteOpen} onClose={() => setIsPaletteOpen(false)} />
    </BrowserRouter>
  );
}
