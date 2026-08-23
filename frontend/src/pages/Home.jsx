import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '../api/client.js';
import HomeHero from '../components/home/HomeHero.jsx';
import HomeStatsGrid from '../components/home/HomeStatsGrid.jsx';
import HomeTrendingVulns from '../components/home/HomeTrendingVulns.jsx';
import HomePackageTable from '../components/home/HomePackageTable.jsx';

export default function Home() {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [ecosystem, setEcosystem] = useState('');
  const [vulnerableOnly, setVulnerableOnly] = useState(false);

  const [sortField, setSortField] = useState('name');
  const [sortDir, setSortDir] = useState('asc');

  const [packages, setPackages] = useState([]);
  const [stats, setStats] = useState(null);
  const [trendingVulns, setTrendingVulns] = useState([]);

  const [loadingPackages, setLoadingPackages] = useState(true);
  const [loadingStats, setLoadingStats] = useState(true);
  const [error, setError] = useState(null);
  const [statsError, setStatsError] = useState(null);

  const searchInputRef = useRef(null);

  // Debounce search query by 300ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  // Fetch stats & trending vulnerabilities
  const fetchGlobalData = useCallback(() => {
    setLoadingStats(true);
    setStatsError(null);

    Promise.all([api.getStats(), api.getVulnerabilities()])
      .then(([statsData, vulnData]) => {
        setStats(statsData);
        setTrendingVulns((vulnData || []).slice(0, 3));
      })
      .catch((err) => {
        setStatsError(err.message || 'Failed to load graph metrics from CognoDB.');
      })
      .finally(() => setLoadingStats(false));
  }, []);

  useEffect(() => {
    fetchGlobalData();
  }, [fetchGlobalData]);

  // Fetch package list
  const fetchPackages = useCallback(() => {
    setLoadingPackages(true);
    setError(null);

    api.getPackages({
      search: debouncedQuery,
      ecosystem: ecosystem || undefined,
      vulnerableOnly,
    })
      .then((data) => {
        setPackages(data || []);
      })
      .catch((err) => {
        setError(err.message || 'Failed to retrieve package records.');
      })
      .finally(() => setLoadingPackages(false));
  }, [debouncedQuery, ecosystem, vulnerableOnly]);

  useEffect(() => {
    fetchPackages();
  }, [fetchPackages]);

  function handleSort(field) {
    if (sortField === field) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  }

  const sortedPackages = packages.toSorted((a, b) => {
    let valA = a[sortField];
    let valB = b[sortField];

    if (sortField === 'isVulnerable') {
      valA = a.isVulnerable ? 1 : 0;
      valB = b.isVulnerable ? 1 : 0;
    } else if (sortField === 'directDepCount') {
      valA = a.directDepCount !== undefined ? a.directDepCount : 0;
      valB = b.directDepCount !== undefined ? b.directDepCount : 0;
    }

    if (typeof valA === 'string') {
      return sortDir === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
    }
    return sortDir === 'asc' ? (valA || 0) - (valB || 0) : (valB || 0) - (valA || 0);
  });

  return (
    <div className="page-container">
      <HomeHero
        query={query}
        onQueryChange={setQuery}
        searchInputRef={searchInputRef}
      />

      <HomeStatsGrid
        loading={loadingStats}
        error={statsError}
        stats={stats}
        onRetry={fetchGlobalData}
      />

      <HomeTrendingVulns
        trendingVulns={trendingVulns}
        visible={!debouncedQuery}
      />

      <HomePackageTable
        key={`${debouncedQuery}-${ecosystem}-${vulnerableOnly}`}
        packages={sortedPackages}
        loading={loadingPackages}
        error={error}
        ecosystem={ecosystem}
        onEcosystemChange={setEcosystem}
        vulnerableOnly={vulnerableOnly}
        onVulnerableOnlyChange={setVulnerableOnly}
        sortField={sortField}
        sortDir={sortDir}
        onSort={handleSort}
        onResetFilters={() => {
          setQuery('');
          setEcosystem('');
          setVulnerableOnly(false);
        }}
        debouncedQuery={debouncedQuery}
        onRetry={fetchPackages}
      />
    </div>
  );
}
