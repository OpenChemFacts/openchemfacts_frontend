/**
 * API Configuration
 * 
 * This project uses a single API endpoint: https://api.openchemfacts.com/api
 * 
 * All API calls are made to this production endpoint.
 */
export const API_BASE_URL = 'https://api.openchemfacts.com/api';

// Debug log in development and production (to help troubleshoot API issues)
console.log(`[API Config] Base URL: ${API_BASE_URL}`);

/**
 * API Endpoints Configuration
 * 
 * Based on the official API documentation: https://api.openchemfacts.com/
 * 
 * Note: The base URL is https://api.openchemfacts.com/api, so endpoints
 * are relative paths that will be appended to the base URL.
 * 
 * Available endpoints:
 * - /summary - Summary statistics
 * - /cas/list - List of all CAS numbers
 * - /search?query={query}&limit={limit} - Search endpoint
 * - /plot/ssd/{identifier} - SSD plot for a CAS/identifier
 * - /plot/ec10eq/{identifier} - EC10 equivalent plot for a CAS/identifier
 * - /plot/ssd/comparison - Compare multiple SSDs (POST)
 */
export const API_ENDPOINTS = {
  ROOT: '/',
  SUMMARY: '/summary',
  BY_COLUMN: (column: string) => `/by_column?column=${encodeURIComponent(column)}`,
  CAS_LIST: '/cas/list',
  /**
   * Get detailed information for a specific CAS number.
   * Note: This endpoint may not be listed in the API root but is used by the frontend.
   * If it doesn't exist, consider using /search with the CAS as query.
   */
  CAS_INFO: (cas: string) => `/cas/${cas}`,
  /**
   * Search endpoint with query and optional limit
   * @param query - Search query string
   * @param limit - Maximum number of results (optional)
   */
  SEARCH: (query: string, limit?: number) => {
    const params = new URLSearchParams({ query });
    if (limit) params.append('limit', limit.toString());
    return `/search?${params.toString()}`;
  },
  /**
   * SSD plot endpoint for a CAS number or identifier
   * @param identifier - CAS number or other identifier
   */
  SSD_PLOT: (identifier: string) => `/plot/ssd/${identifier}`,
  /**
   * EC10 equivalent plot endpoint for a CAS number or identifier
   * @param identifier - CAS number or other identifier
   */
  EC10EQ_PLOT: (identifier: string) => `/plot/ec10eq/${identifier}`,
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
  SSD_COMPARISON: '/plot/ssd/comparison',
};

