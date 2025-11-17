import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { FlaskConical, Info, AlertCircle } from "lucide-react";
import { API_ENDPOINTS } from "@/lib/config";
import { apiFetch, ApiError } from "@/lib/api";

interface ChemicalInfoProps {
  cas: string;
}

interface ChemicalData {
  cas_number: string;
  chemical_name?: string;
  n_species?: number;
  n_trophic_level?: number;
  n_results?: number;
  [key: string]: any;
}

// Fonction pour normaliser un numéro CAS (enlever les espaces, normaliser les tirets)
const normalizeCas = (cas: string): string => {
  return cas.trim().replace(/\s+/g, '').replace(/[–—]/g, '-');
};

// Fonction pour comparer deux numéros CAS (insensible à la casse et aux espaces)
const compareCas = (cas1: string, cas2: string): boolean => {
  return normalizeCas(cas1).toLowerCase() === normalizeCas(cas2).toLowerCase();
};

export const ChemicalInfo = ({ cas }: ChemicalInfoProps) => {
  const normalizedCas = cas ? normalizeCas(cas) : '';
  // Get chemical name from CAS list
  const { data: casListData } = useQuery({
    queryKey: ["cas-list"],
    queryFn: async () => {
      const response = await apiFetch<{
        count: number;
        cas_numbers: string[];
        cas_with_names: Record<string, string> | Array<{ cas_number: string; chemical_name?: string }>;
      }>(API_ENDPOINTS.CAS_LIST);
      return response;
    },
    staleTime: 10 * 60 * 1000, // Cache for 10 minutes
  });

  // Find chemical info from the list
  // Backend returns cas_with_names as object {cas_number: chemical_name}
  let chemicalName: string | undefined;
  let casExists = false;
  
  if (casListData?.cas_with_names && normalizedCas) {
    if (Array.isArray(casListData.cas_with_names)) {
      // Legacy array format - utiliser compareCas pour la recherche
      const item = casListData.cas_with_names.find((item) => compareCas(item.cas_number, normalizedCas));
      chemicalName = item?.chemical_name;
      casExists = !!item;
      console.log(`[ChemicalInfo] Array format - CAS: ${normalizedCas}, Found: ${casExists}, Name: ${chemicalName}`);
    } else {
      // Object format {cas_number: chemical_name}
      // Chercher avec comparaison normalisée
      const casWithNamesObj = casListData.cas_with_names as Record<string, string>;
      const matchingKey = Object.keys(casWithNamesObj).find(key => compareCas(key, normalizedCas));
      casExists = !!matchingKey;
      chemicalName = matchingKey ? casWithNamesObj[matchingKey] : undefined;
      console.log(`[ChemicalInfo] Object format - CAS: ${normalizedCas}, Exists in object: ${casExists}, Name: ${chemicalName}`);
      if (!casExists) {
        console.log(`[ChemicalInfo] Total keys in cas_with_names:`, Object.keys(casWithNamesObj).length);
        console.log(`[ChemicalInfo] First 5 keys:`, Object.keys(casWithNamesObj).slice(0, 5));
        console.log(`[ChemicalInfo] Searching for normalized CAS: "${normalizedCas}"`);
      }
    }
  }
  
  // Fallback: check in cas_numbers list if not found in cas_with_names (avec comparaison normalisée)
  if (!casExists && casListData?.cas_numbers && normalizedCas) {
    const foundInCasNumbers = casListData.cas_numbers.some(casNum => compareCas(casNum, normalizedCas));
    console.log(`[ChemicalInfo] Checking fallback cas_numbers - Found: ${foundInCasNumbers}`);
    casExists = foundInCasNumbers;
  }
  
  console.log(`[ChemicalInfo] Final result - CAS: ${normalizedCas}, casExists: ${casExists}, chemicalName: ${chemicalName}`);

  // For now, we'll use the data from CAS list
  // In the future, we could add stats via /api/by_column if needed
  const data: ChemicalData | undefined = normalizedCas
    ? {
        cas_number: normalizedCas, // Utiliser le CAS normalisé
        chemical_name: chemicalName,
      }
    : undefined;

  const isLoading = !casListData;
  // Ne pas afficher d'erreur si le CAS n'est pas trouvé dans la liste locale
  // car la liste pourrait être incomplète ou le format pourrait différer
  // Laisser l'API backend valider l'existence réelle du CAS via les endpoints de graphiques
  // Si le CAS n'existe vraiment pas, les graphiques afficheront une erreur appropriée
  const error = undefined; // Ne jamais afficher d'erreur ici, laisser les autres composants gérer

  if (isLoading) {
    return (
      <Card className="shadow-card">
        <CardHeader>
          <Skeleton className="h-8 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    const errorMessage = error instanceof ApiError 
      ? error.message 
      : "Erreur lors du chargement des informations";
    const isNotFound = error instanceof ApiError && error.status === 404;
    
    return (
      <Card className="shadow-card border-destructive">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            <div>
              <p className="font-semibold">
                {isNotFound ? "Produit chimique non trouvé" : "Erreur"}
              </p>
              <p className="text-sm text-muted-foreground">{errorMessage}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FlaskConical className="h-5 w-5 text-primary" />
          Chemical Information
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground mb-1">CAS Number</p>
            <p className="font-mono font-semibold text-lg">{data?.cas_number}</p>
          </div>
          {data?.chemical_name && (
            <div>
              <p className="text-sm text-muted-foreground mb-1">Chemical Name</p>
              <p className="font-semibold">{data.chemical_name}</p>
            </div>
          )}
        </div>

        {data && (
          <div className="flex gap-3 pt-2">
            <Badge variant="secondary" className="text-base py-1 px-4">
              <Info className="h-4 w-4 mr-2" />
              CAS: {data.cas_number}
            </Badge>
            {data.chemical_name && (
              <Badge variant="outline" className="text-base py-1 px-4">
                {data.chemical_name}
              </Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
