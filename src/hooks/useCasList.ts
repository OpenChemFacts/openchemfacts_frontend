import { useQuery } from "@tanstack/react-query";
import { API_ENDPOINTS } from "@/lib/config";
import { apiFetch, ApiError } from "@/lib/api";
import { compareCas, normalizeCas } from "@/lib/cas-utils";

export interface CasItem {
  cas_number: string;
  chemical_name?: string;
}

interface CasListResponse {
  count: number;
  cas_numbers: string[];
  cas_with_names: Record<string, string> | Array<{ cas_number: string; chemical_name?: string }>;
}

/**
 * Custom hook to load and manage the CAS list
 * Centralizes loading and data conversion logic
 */
export const useCasList = () => {
  const { data: casListResponse, error, isLoading } = useQuery({
    queryKey: ["cas-list"],
    queryFn: async () => {
      const response = await apiFetch<CasListResponse>(API_ENDPOINTS.CAS_LIST);
      return response;
    },
    staleTime: 10 * 60 * 1000, // Cache for 10 minutes
    retry: false,
  });

  // Convert data to array format for easier use
  const casList: CasItem[] = casListResponse?.cas_with_names
    ? Array.isArray(casListResponse.cas_with_names)
      ? casListResponse.cas_with_names.map((item: any) => ({
          cas_number: item.cas_number || item,
          chemical_name: item.chemical_name,
        }))
      : Object.entries(casListResponse.cas_with_names as Record<string, string>).map(
          ([cas_number, chemical_name]) => ({ cas_number, chemical_name })
        )
    : casListResponse?.cas_numbers
    ? casListResponse.cas_numbers.map((cas) => ({ cas_number: cas }))
    : [];

  /**
   * Finds a CAS in the list by its number (normalized)
   * @param cas - The CAS number to search for
   * @returns The found CAS item or undefined
   */
  const findCasItem = (cas: string): CasItem | undefined => {
    if (!cas || casList.length === 0) return undefined;
    const normalizedCas = normalizeCas(cas);
    return casList.find((item) => compareCas(item.cas_number, normalizedCas));
  };

  /**
   * Finds the chemical name associated with a CAS
   * @param cas - The CAS number
   * @returns The chemical name or undefined
   */
  const getChemicalName = (cas: string): string | undefined => {
    const item = findCasItem(cas);
    return item?.chemical_name;
  };

  return {
    casList,
    casListResponse,
    isLoading,
    error: error instanceof ApiError ? error : undefined,
    findCasItem,
    getChemicalName,
  };
};

