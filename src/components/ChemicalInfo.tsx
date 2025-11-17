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

export const ChemicalInfo = ({ cas }: ChemicalInfoProps) => {
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
  
  if (casListData?.cas_with_names) {
    if (Array.isArray(casListData.cas_with_names)) {
      // Legacy array format
      const item = casListData.cas_with_names.find((item) => item.cas_number === cas);
      chemicalName = item?.chemical_name;
      casExists = !!item;
    } else {
      // Object format {cas_number: chemical_name}
      casExists = cas in (casListData.cas_with_names as Record<string, string>);
      chemicalName = (casListData.cas_with_names as Record<string, string>)[cas];
    }
  }
  
  // Fallback: check in cas_numbers list if not found in cas_with_names
  if (!casExists && casListData?.cas_numbers) {
    casExists = casListData.cas_numbers.includes(cas);
  }

  // Check if CAS exists in the database (in cas_numbers list)
  // A CAS can exist without a chemical name, so we check cas_numbers first
  const casExists = casListData?.cas_numbers?.includes(cas) ?? false;

  // For now, we'll use the data from CAS list
  // In the future, we could add stats via /api/by_column if needed
  const data: ChemicalData | undefined = cas
    ? {
        cas_number: cas,
        chemical_name: chemicalName,
      }
    : undefined;

  const isLoading = !casListData;
<<<<<<< HEAD
  // Only show error if CAS doesn't exist in the database at all
  // If CAS exists but has no name, that's fine - just display the CAS number
=======
>>>>>>> e9962f857afc758d57b0dc26883affc573c024d6
  const error = !isLoading && !casExists && cas ? new ApiError("CAS number not found in database", 404, "Not Found") : undefined;

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
