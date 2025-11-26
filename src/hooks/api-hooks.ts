/**
 * Centralized API hooks for React Query
 * Provides reusable hooks for all API endpoints
 */

import { useQuery, UseQueryOptions } from "@tanstack/react-query";
import { API_ENDPOINTS } from "@/lib/config";
import { apiFetch, ApiError } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";
import {
  CasInfoResponse,
  MetadataResponse,
  SearchResponse,
  SummaryData,
  ByColumnData,
  CasListResponse,
  PlotDataResponse,
  ComparisonPlotResponse,
} from "@/lib/api-types";
import { normalizeCas } from "@/lib/cas-utils";

/**
 * Hook to fetch CAS information
 * @param cas - CAS number (will be normalized)
 * @param options - Additional React Query options
 */
export function useCasInfo(
  cas: string | undefined,
  options?: Omit<UseQueryOptions<CasInfoResponse, ApiError>, "queryKey" | "queryFn">
) {
  const normalizedCas = cas ? normalizeCas(cas) : undefined;

  return useQuery({
    queryKey: queryKeys.casInfo(normalizedCas || ""),
    queryFn: async () => {
      if (!normalizedCas) {
        throw new Error("CAS number is required");
      }
      const endpoint = API_ENDPOINTS.CAS_INFO(normalizedCas);
      if (import.meta.env.DEV) {
        console.log(`[useCasInfo] Fetching CAS info from: ${endpoint}`);
      }
      return apiFetch<CasInfoResponse>(endpoint);
    },
    enabled: !!normalizedCas && (options?.enabled !== false),
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    retry: false, // Don't retry on 404
    ...options,
  });
}

/**
 * Hook to fetch metadata
 * @param options - Additional React Query options
 */
export function useMetadata(
  options?: Omit<UseQueryOptions<MetadataResponse, ApiError>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: queryKeys.metadata(),
    queryFn: async () => {
      const endpoint = API_ENDPOINTS.METADATA;
      if (import.meta.env.DEV) {
        console.log(`[useMetadata] Fetching metadata from: ${endpoint}`);
      }
      return apiFetch<MetadataResponse>(endpoint);
    },
    staleTime: 30 * 60 * 1000, // Cache for 30 minutes (metadata rarely changes)
    retry: false,
    throwOnError: false, // Non-critical request
    ...options,
  });
}

/**
 * Hook to search substances
 * @param query - Search query string
 * @param limit - Maximum number of results (optional)
 * @param options - Additional React Query options
 */
export function useSearch(
  query: string | undefined,
  limit?: number,
  options?: Omit<UseQueryOptions<SearchResponse | null, ApiError>, "queryKey" | "queryFn">
) {
  const trimmedQuery = query?.trim();
  const enabled = !!trimmedQuery && trimmedQuery.length > 0 && (options?.enabled !== false);

  return useQuery({
    queryKey: queryKeys.search(trimmedQuery || ""),
    queryFn: async (): Promise<SearchResponse | null> => {
      if (!trimmedQuery) return null;
      const endpoint = API_ENDPOINTS.SEARCH(trimmedQuery, limit);
      if (import.meta.env.DEV) {
        console.log(`[useSearch] Searching with: ${endpoint}`);
      }
      return apiFetch<SearchResponse>(endpoint);
    },
    enabled,
    staleTime: 30 * 1000, // Cache for 30 seconds
    retry: false,
    ...options,
  });
}

/**
 * Hook to search substances with context (for benchmark comparison)
 * @param context - Context identifier (e.g., "benchmark-0")
 * @param query - Search query string
 * @param limit - Maximum number of results (optional)
 * @param options - Additional React Query options
 */
export function useSearchWithContext(
  context: string,
  query: string | undefined,
  limit?: number,
  options?: Omit<UseQueryOptions<SearchResponse | null, ApiError>, "queryKey" | "queryFn">
) {
  const trimmedQuery = query?.trim();
  const enabled = !!trimmedQuery && trimmedQuery.length > 0 && (options?.enabled !== false);

  return useQuery({
    queryKey: queryKeys.searchWithContext(context, trimmedQuery || ""),
    queryFn: async (): Promise<SearchResponse | null> => {
      if (!trimmedQuery) return null;
      const endpoint = API_ENDPOINTS.SEARCH(trimmedQuery, limit);
      if (import.meta.env.DEV) {
        console.log(`[useSearchWithContext] Searching with context ${context}: ${endpoint}`);
      }
      return apiFetch<SearchResponse>(endpoint);
    },
    enabled,
    staleTime: 30 * 1000, // Cache for 30 seconds
    retry: false,
    ...options,
  });
}

/**
 * Hook to fetch summary statistics
 * @param options - Additional React Query options
 */
export function useSummary(
  options?: Omit<UseQueryOptions<SummaryData, ApiError>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: queryKeys.summary(),
    queryFn: async () => {
      const endpoint = API_ENDPOINTS.SUMMARY;
      if (import.meta.env.DEV) {
        console.log(`[useSummary] Fetching summary from: ${endpoint}`);
      }
      return apiFetch<SummaryData>(endpoint);
    },
    ...options,
  });
}

/**
 * Hook to fetch unique values for a column
 * @param column - Column name
 * @param options - Additional React Query options
 */
export function useByColumn(
  column: string | undefined,
  options?: Omit<UseQueryOptions<ByColumnData, ApiError>, "queryKey" | "queryFn">
) {
  const enabled = !!column && (options?.enabled !== false);

  return useQuery({
    queryKey: queryKeys.byColumn(column || ""),
    queryFn: async () => {
      if (!column) {
        throw new Error("Column name is required");
      }
      const endpoint = API_ENDPOINTS.BY_COLUMN(column);
      if (import.meta.env.DEV) {
        console.log(`[useByColumn] Fetching column data from: ${endpoint}`);
      }
      return apiFetch<ByColumnData>(endpoint);
    },
    enabled,
    ...options,
  });
}

/**
 * Hook to fetch SSD plot data
 * @param cas - CAS number or identifier
 * @param options - Additional React Query options
 */
export function useSSDPlot(
  cas: string | undefined,
  options?: Omit<UseQueryOptions<PlotDataResponse, ApiError>, "queryKey" | "queryFn">
) {
  const normalizedCas = cas ? normalizeCas(cas) : undefined;
  const enabled = !!normalizedCas && (options?.enabled !== false);

  return useQuery({
    queryKey: queryKeys.ssdPlot(normalizedCas || ""),
    queryFn: async () => {
      if (!normalizedCas) {
        throw new Error("CAS number is required");
      }
      const endpoint = API_ENDPOINTS.SSD_PLOT(normalizedCas);
      if (import.meta.env.DEV) {
        console.log(`[useSSDPlot] Fetching SSD plot from: ${endpoint}`);
      }
      return apiFetch<PlotDataResponse>(endpoint);
    },
    enabled,
    ...options,
  });
}

/**
 * Hook to fetch EC10eq plot data
 * @param cas - CAS number or identifier
 * @param options - Additional React Query options
 */
export function useEC10eqPlot(
  cas: string | undefined,
  options?: Omit<UseQueryOptions<PlotDataResponse, ApiError>, "queryKey" | "queryFn">
) {
  const normalizedCas = cas ? normalizeCas(cas) : undefined;
  const enabled = !!normalizedCas && (options?.enabled !== false);

  return useQuery({
    queryKey: queryKeys.ec10eqPlot(normalizedCas || ""),
    queryFn: async () => {
      if (!normalizedCas) {
        throw new Error("CAS number is required");
      }
      const endpoint = API_ENDPOINTS.EC10EQ_PLOT(normalizedCas);
      if (import.meta.env.DEV) {
        console.log(`[useEC10eqPlot] Fetching EC10eq plot from: ${endpoint}`);
      }
      return apiFetch<PlotDataResponse>(endpoint);
    },
    enabled,
    ...options,
  });
}

/**
 * Hook to fetch SSD comparison plot data
 * @param casList - Array of CAS numbers (2-5 substances)
 * @param enabled - Whether the query should be enabled
 * @param options - Additional React Query options
 */
export function useSSDComparison(
  casList: string[] | undefined,
  enabled: boolean = false,
  options?: Omit<UseQueryOptions<ComparisonPlotResponse, ApiError>, "queryKey" | "queryFn">
) {
  const normalizedCasList = casList?.map(cas => normalizeCas(cas));
  const queryEnabled = enabled && 
                       !!normalizedCasList && 
                       normalizedCasList.length >= 2 && 
                       normalizedCasList.length <= 5 &&
                       (options?.enabled !== false);

  return useQuery({
    queryKey: queryKeys.ssdComparison(normalizedCasList || []),
    queryFn: async () => {
      if (!normalizedCasList || normalizedCasList.length < 2 || normalizedCasList.length > 5) {
        throw new Error("CAS list must contain 2-5 substances");
      }
      const endpoint = API_ENDPOINTS.SSD_COMPARISON;
      if (import.meta.env.DEV) {
        console.log(`[useSSDComparison] Fetching comparison plot from: ${endpoint}`);
        console.log(`[useSSDComparison] CAS list:`, normalizedCasList);
      }
      return apiFetch<ComparisonPlotResponse>(endpoint, {
        method: "POST",
        body: JSON.stringify({ cas_list: normalizedCasList }),
      });
    },
    enabled: queryEnabled,
    retry: false, // Don't retry on error to avoid spamming the API
    ...options,
  });
}

