import { useQuery } from "@tanstack/react-query";
import { API_ENDPOINTS } from "@/lib/config";
import { apiFetch, ApiError } from "@/lib/api";
import { compareCas, normalizeCas } from "@/lib/cas-utils";

export interface CasItem {
  cas_number: string;
  chemical_name?: string;
}

/**
 * Format réel retourné par l'API /cas/list
 * L'API retourne directement un tableau d'objets avec cas_number et name
 */
type CasListResponse = Array<{ cas_number: string; name?: string }>;

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

  // Convert API response (Array<{cas_number, name}>) to internal format (Array<{cas_number, chemical_name}>) 
  // L'API utilise 'name' mais le code interne utilise 'chemical_name' pour cohérence
  const casList: CasItem[] = casListResponse && Array.isArray(casListResponse)
    ? casListResponse.map((item) => ({
        cas_number: item.cas_number,
        chemical_name: item.name,
      }))
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

  // Calculate count from the list
  const count = casList.length;

  return {
    casList,
    casListResponse,
    count,
    isLoading,
    error: error instanceof ApiError ? error : undefined,
    findCasItem,
    getChemicalName,
  };
};

