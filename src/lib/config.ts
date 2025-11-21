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

// Debug log in development
if (import.meta.env.DEV) {
  console.log(`[API Config] Base URL: ${API_BASE_URL}`);
  console.log(`[API Config] Environment: ${import.meta.env.MODE}`);
  console.log(`[API Config] VITE_API_BASE_URL: ${import.meta.env.VITE_API_BASE_URL || 'not set'}`);
}

export const API_ENDPOINTS = {
  ROOT: '/',
  HEALTH: '/health',
  SUMMARY: '/api/summary',
  BY_COLUMN: (column: string) => `/api/by_column?column=${encodeURIComponent(column)}`,
  CAS_LIST: '/api/cas/list',
  SSD_PLOT: (cas: string) => `/api/plot/ssd/${cas}`,
  EC10EQ_PLOT: (cas: string) => `/api/plot/ec10eq/${cas}`,
  /**
   * Endpoint for comparing multiple SSDs (max 3 substances).
   * 
   * Note: This endpoint requires a list of CAS numbers (maximum 3).
   * Frontend implementation is now available.
   * 
   * Format expected by the backend (plot_ssd_comparison function):
   * - Method: POST
   * - JSON Body: { "cas_list": ["123-45-6", "789-01-2", "345-67-8"] }
   * - Maximum 3 CAS numbers in the list
   * - Returns: Plotly figure in JSON format (fig.to_dict())
   */
  SSD_COMPARISON: '/api/plot/ssd/comparison',
};

