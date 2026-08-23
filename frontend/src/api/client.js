// Single place for every API call — components never call fetch() directly.
const BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

async function request(path, options = {}) {
  try {
    const res = await fetch(`${BASE_URL}${path}`, options);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error || `Request failed with status ${res.status}`);
    }
    return await res.json();
  } catch (err) {
    console.error(`[API Error] ${path}:`, err.message);
    throw err;
  }
}

export const api = {
  // Package queries
  getPackages: (params = {}) => {
    const query = new URLSearchParams();
    const searchTerm = params.search || params.query || '';
    if (searchTerm) query.set('search', searchTerm);
    if (params.ecosystem) query.set('ecosystem', params.ecosystem);
    if (params.vulnerableOnly) query.set('vulnerableOnly', 'true');
    const queryString = query.toString();
    return request(`/api/packages${queryString ? `?${queryString}` : ''}`);
  },
  getPackage: (name) => request(`/api/packages/${encodeURIComponent(name)}`),
  
  // Dependents (supports both alias names and hops param)
  getDependents: (name, hops = 4) => request(`/api/packages/${encodeURIComponent(name)}/dependents?hops=${hops}`),
  getPackageDependents: (name, hops = 4) => request(`/api/packages/${encodeURIComponent(name)}/dependents?hops=${hops}`),

  // Dependencies (supports both alias names)
  getDependencies: (name) => request(`/api/packages/${encodeURIComponent(name)}/dependencies`),
  getPackageDependencies: (name) => request(`/api/packages/${encodeURIComponent(name)}/dependencies`),

  // Package Subgraph
  getPackageGraph: (name) => request(`/api/packages/${encodeURIComponent(name)}/graph`),

  // Graph and vulnerability queries
  getShortestPathToVuln: (name) => request(`/api/queries/shortest-path/${encodeURIComponent(name)}`),
  getShortestPathToVulns: (name) => request(`/api/queries/shortest-path/${encodeURIComponent(name)}`),
  getBlastRadius: () => request('/api/queries/blast-radius'),
  getVulnerabilities: () => request('/api/queries/vulnerabilities'),
  getStats: () => request('/api/queries/stats'),
  getFullGraph: (param) => {
    if (typeof param === 'string' && param) {
      return request(`/api/queries/full-graph?ecosystem=${encodeURIComponent(param)}`);
    }
    const limit = typeof param === 'number' ? param : 50;
    return request(`/api/queries/full-graph?limit=${limit}`);
  },
  getStatus: () => request('/api/queries/status'),

  // Graph Intelligence & Cypher Sandbox Innovations
  runCypherQuery: (query, params = {}) =>
    request('/api/queries/cypher', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, params }),
    }),

  simulateQuarantine: (targetType, targetName) =>
    request('/api/queries/simulate-quarantine', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetType, targetName }),
    }),

  getRemediation: (name) => request(`/api/queries/remediation/${encodeURIComponent(name)}`),
};
