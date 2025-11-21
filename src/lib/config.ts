/**
 * API Configuration
 * 
 * The URL can be set via the VITE_API_BASE_URL environment variable.
 * If not set, uses the default URL according to the environment:
 * - Local development (DEV=true): http://localhost:8000
 * - Production: https://api.openchemfacts.com
 * 
 * To use the production API in development, set in .env:
 * VITE_API_BASE_URL=https://api.openchemfacts.com
 * 
 * To use the local backend, either:
 * - Don't set VITE_API_BASE_URL (will use localhost:8000 in dev)
 * - Or set VITE_API_BASE_URL=http://localhost:8000
 */
const getApiBaseUrl = (): string => {
  // If VITE_API_BASE_URL is explicitly set, use it
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }

  // Special case: in DEV but not on localhost (e.g., Lovable preview),
  // use the production API to avoid connection errors to localhost
  const isHostedDev = import.meta.env.DEV
    && typeof window !== 'undefined'
    && window.location.hostname !== 'localhost'
    && window.location.hostname !== '127.0.0.1';

  if (isHostedDev) {
    return 'https://api.openchemfacts.com';
  }

  // Otherwise, use default values according to the environment
  return import.meta.env.DEV 
    ? 'http://localhost:8000' 
    : 'https://api.openchemfacts.com';
};

export const API_BASE_URL = getApiBaseUrl();

// Debug log in development and production (to help troubleshoot API issues)
console.log(`[API Config] Base URL: ${API_BASE_URL}`);
console.log(`[API Config] Environment: ${import.meta.env.MODE}`);
console.log(`[API Config] VITE_API_BASE_URL: ${import.meta.env.VITE_API_BASE_URL || 'not set'}`);

/**
 * API Endpoints Configuration
 * 
 * Based on the official API documentation: https://api.openchemfacts.com/
 * 
 * Available endpoints from the API root:
 * - /health - Health check
 * - /docs - API documentation (Swagger UI)
 * - /redoc - API documentation (ReDoc)
 * - /api/summary - Summary statistics
 * - /api/cas/list - List of all CAS numbers
 * - /api/search?query={query}&limit={limit} - Search endpoint
 * - /api/plot/ssd/{identifier} - SSD plot for a CAS/identifier
 * - /api/plot/ec10eq/{identifier} - EC10 equivalent plot for a CAS/identifier
 * - /api/plot/ssd/comparison - Compare multiple SSDs (POST)
 */
export const API_ENDPOINTS = {
  ROOT: '/',
  HEALTH: '/health',
  DOCS: '/docs',
  REDOC: '/redoc',
  SUMMARY: '/api/summary',
  BY_COLUMN: (column: string) => `/api/by_column?column=${encodeURIComponent(column)}`,
  CAS_LIST: '/api/cas/list',
  /**
   * Get detailed information for a specific CAS number.
   * Note: This endpoint may not be listed in the API root but is used by the frontend.
   * If it doesn't exist, consider using /api/search with the CAS as query.
   */
  CAS_INFO: (cas: string) => `/api/cas/${cas}`,
  /**
   * Search endpoint with query and optional limit
   * @param query - Search query string
   * @param limit - Maximum number of results (optional)
   */
  SEARCH: (query: string, limit?: number) => {
    const params = new URLSearchParams({ query });
    if (limit) params.append('limit', limit.toString());
    return `/api/search?${params.toString()}`;
  },
  /**
   * SSD plot endpoint for a CAS number or identifier
   * @param identifier - CAS number or other identifier
   */
  SSD_PLOT: (identifier: string) => `/api/plot/ssd/${identifier}`,
  /**
   * EC10 equivalent plot endpoint for a CAS number or identifier
   * @param identifier - CAS number or other identifier
   */
  EC10EQ_PLOT: (identifier: string) => `/api/plot/ec10eq/${identifier}`,
  /**
   * Endpoint for comparing multiple SSDs (max 3 substances).
   * 
   * Note: This endpoint requires a list of CAS numbers (maximum 3).
   * Frontend implementation is now available.
   * 
   * Format expected by the backend:
   * - Method: POST
   * - JSON Body: { "cas_list": ["123-45-6", "789-01-2", "345-67-8"] }
   * - Maximum 3 CAS numbers in the list
   * - Returns: Plotly figure in JSON format (fig.to_dict())
   */
  SSD_COMPARISON: '/api/plot/ssd/comparison',
};

