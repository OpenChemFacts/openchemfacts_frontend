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
 * Hook personnalisé pour charger et gérer la liste des CAS
 * Centralise la logique de chargement et de conversion des données
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

  // Convertir les données en format array pour faciliter l'utilisation
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
   * Trouve un CAS dans la liste par son numéro (normalisé)
   * @param cas - Le numéro CAS à rechercher
   * @returns L'item CAS trouvé ou undefined
   */
  const findCasItem = (cas: string): CasItem | undefined => {
    if (!cas || casList.length === 0) return undefined;
    const normalizedCas = normalizeCas(cas);
    return casList.find((item) => compareCas(item.cas_number, normalizedCas));
  };

  /**
   * Trouve le nom chimique associé à un CAS
   * @param cas - Le numéro CAS
   * @returns Le nom chimique ou undefined
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

