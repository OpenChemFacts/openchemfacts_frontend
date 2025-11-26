/**
 * Centralized query keys for React Query
 * Ensures consistent cache management and avoids key collisions
 */

export const queryKeys = {
  /**
   * Query key for CAS list
   */
  casList: () => ["cas-list"] as const,

  /**
   * Query key for CAS info
   * @param cas - CAS number (normalized)
   */
  casInfo: (cas: string) => ["cas-info", cas] as const,

  /**
   * Query key for metadata
   */
  metadata: () => ["metadata"] as const,

  /**
   * Query key for search
   * @param query - Search query string
   */
  search: (query: string) => ["search", query] as const,

  /**
   * Query key for search with context (e.g., benchmark comparison)
   * @param context - Context identifier (e.g., "benchmark-0")
   * @param query - Search query string
   */
  searchWithContext: (context: string, query: string) => ["search", context, query] as const,

  /**
   * Query key for summary statistics
   */
  summary: () => ["summary"] as const,

  /**
   * Query key for by_column endpoint
   * @param column - Column name
   */
  byColumn: (column: string) => ["by-column", column] as const,

  /**
   * Query key for SSD plot
   * @param cas - CAS number or identifier
   */
  ssdPlot: (cas: string) => ["plot", cas, "ssd"] as const,

  /**
   * Query key for EC10eq plot
   * @param cas - CAS number or identifier
   */
  ec10eqPlot: (cas: string) => ["plot", cas, "ec10eq"] as const,

  /**
   * Query key for SSD comparison plot
   * @param casList - Array of CAS numbers
   */
  ssdComparison: (casList: string[]) => ["ssd-comparison", casList] as const,
} as const;

