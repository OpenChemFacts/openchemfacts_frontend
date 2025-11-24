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
 * OpenAPI specification: https://openchemfacts-api.osc-fr1.scalingo.io/openapi.json
 * 
 * Note: The base URL is https://api.openchemfacts.com/api, so endpoints
 * are relative paths that will be appended to the base URL.
 * 
 * All endpoints verified against OpenAPI specification (2024).
 * 
 * Available endpoints:
 * - /summary - Summary statistics
 * - /cas/list (or /list) - List of all CAS numbers
 * - /cas/{cas} - Detailed information for a specific CAS number
 * - /search?query={query}&limit={limit} - Search substances by CAS or name
 * - /by_column?column={column} - Get unique values for a specific column (used but not in OpenAPI)
 * - /plot/ssd/{identifier} - SSD plot for a CAS/identifier (uses Plotly.js)
 * - /plot/ec10eq/{identifier} - EC10 equivalent plot for a CAS/identifier (uses Plotly.js)
 * - /plot/ssd/comparison - Compare multiple SSDs (POST, uses Plotly.js)
 * - / - Root endpoint with API information
 * - /health - Health check endpoint
 */
export const API_ENDPOINTS = {
  /**
   * Root endpoint providing API information and available endpoints.
   * Returns API name, version, status, and list of endpoints.
   * Currently defined but not actively used in the frontend.
   */
  ROOT: '/',
  /**
   * Get summary statistics of the database.
   * Returns total number of chemicals, records, EF counts, etc.
   */
  SUMMARY: '/summary',
  /**
   * Get unique values for a specific column in the database.
   * Note: This endpoint is used by the frontend but may not be documented in OpenAPI.
   * @param column - Column name to query (e.g., 'species_common_name')
   */
  BY_COLUMN: (column: string) => `/by_column?column=${encodeURIComponent(column)}`,
  /**
   * Get list of all available CAS numbers.
   * Returns JSON array with cas_number, INCHIKEY, and name.
   * Note: API also provides /list endpoint, but frontend uses /cas/list.
   */
  CAS_LIST: '/cas/list',
  /**
   * Get detailed information for a specific CAS number.
   * Returns cas_number, name, INCHIKEY, classifications, and EffectFactor(s).
   * @param cas - CAS number (e.g., '50-00-0')
   */
  CAS_INFO: (cas: string) => `/cas/${cas}`,
  /**
   * Search endpoint with query and optional limit.
   * Supports exact CAS match, exact/partial name match (case-insensitive).
   * Used by SearchBar component for real-time search suggestions.
   * @param query - Search query string (CAS number or chemical name)
   * @param limit - Maximum number of results (default: 20, max: 100)
   */
  SEARCH: (query: string, limit?: number) => {
    const params = new URLSearchParams({ query });
    if (limit) params.append('limit', limit.toString());
    return `/search?${params.toString()}`;
  },
  /**
   * SSD plot endpoint for a CAS number or identifier.
   * Returns JSON data that is converted to Plotly format for visualization.
   * The frontend uses Plotly.js to render the graph.
   * @param identifier - CAS number or other identifier
   */
  SSD_PLOT: (identifier: string) => `/plot/ssd/${identifier}`,
  /**
   * EC10 equivalent plot endpoint for a CAS number or identifier.
   * Returns EC10eq data in JSON format (detailed or simple).
   * The frontend converts this data to Plotly format using Plotly.js for visualization.
   * @param identifier - CAS number or other identifier
   */
  EC10EQ_PLOT: (identifier: string) => `/plot/ec10eq/${identifier}`,
  /**
   * Endpoint for comparing multiple SSDs (2 to 5 substances).
   * 
   * Format expected by the backend:
   * - Method: POST
   * - JSON Body: { "cas_list": ["123-45-6", "789-01-2", "345-67-8"] }
   * - Between 2 and 5 CAS numbers in the list
   * - Returns: Plotly figure in JSON format (fig.to_dict())
   * 
   * The frontend uses Plotly.js to render the comparison graph.
   */
  SSD_COMPARISON: '/plot/ssd/comparison',
  /**
   * Health check endpoint to verify API and data availability.
   * Returns status, timestamp, data loading status, and version.
   * Currently not used in the frontend but available for monitoring.
   */
  HEALTH: '/health',
};

