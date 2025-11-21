import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { FlaskConical } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useCasList } from "@/hooks/useCasList";
import { normalizeCas, compareCas } from "@/lib/cas-utils";
import { API_ENDPOINTS } from "@/lib/config";
import { apiFetch } from "@/lib/api";
import { ErrorDisplay } from "@/components/ui/error-display";

interface ChemicalInfoProps {
  cas: string;
  chemical_name?: string;
}

interface CasInfoResponse {
  cas_number?: string;
  chemical_name?: string;
  n_species?: number;
  n_trophic_level?: number;
  n_results?: number;
  [key: string]: any;
}

export const ChemicalInfo = ({ cas, chemical_name: propChemicalName }: ChemicalInfoProps) => {
  const normalizedCas = cas ? normalizeCas(cas) : '';
  const [chemicalName, setChemicalName] = useState<string | undefined>(propChemicalName);
  
  // Debug log: component received props
  useEffect(() => {
    if (import.meta.env.DEV) {
      console.log(`[ChemicalInfo] Component received props:`, { cas, normalizedCas, propChemicalName });
    }
  }, [cas, normalizedCas, propChemicalName]);
  
  // Use the shared hook to get the CAS list
  const { isLoading: isCasListLoading, casList } = useCasList();
  
  // Fetch detailed CAS information from /api/cas/{cas} endpoint
  const { data: casInfo, isLoading: isCasInfoLoading, error: casInfoError } = useQuery({
    queryKey: ["cas-info", normalizedCas],
    queryFn: async () => {
      const endpoint = API_ENDPOINTS.CAS_INFO(normalizedCas);
      if (import.meta.env.DEV) {
        console.log(`[ChemicalInfo] Fetching CAS info from: ${endpoint}`);
      }
      return apiFetch<CasInfoResponse>(endpoint);
    },
    enabled: !!normalizedCas,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  // Debug: log API response in development
  useEffect(() => {
    if (import.meta.env.DEV && casInfo) {
      console.log(`[ChemicalInfo] API response for CAS ${normalizedCas}:`, casInfo);
    }
  }, [casInfo, normalizedCas]);
  
  // Systematically retrieve the chemical name if not already provided in props
  useEffect(() => {
    // Priority: casInfo > propChemicalName > casList
    if (casInfo?.chemical_name) {
      setChemicalName(casInfo.chemical_name);
    } else if (propChemicalName) {
      setChemicalName(propChemicalName);
    } else if (normalizedCas && casList.length > 0) {
      const item = casList.find((item) => compareCas(item.cas_number, normalizedCas));
      if (item?.chemical_name) {
        setChemicalName(item.chemical_name);
      }
    }
  }, [normalizedCas, propChemicalName, casList, casInfo]);

  const isLoading = isCasListLoading || isCasInfoLoading;

  if (isLoading && !casInfo) {
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

  if (casInfoError) {
    return (
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FlaskConical className="h-5 w-5 text-primary" />
            Chemical Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ErrorDisplay 
            error={casInfoError} 
            title="Error loading chemical information"
          />
        </CardContent>
      </Card>
    );
  }


  // Use data from casInfo endpoint if available, otherwise fallback to basic info
  const displayCasNumber = casInfo?.cas_number || normalizedCas;
  const displayChemicalName = casInfo?.chemical_name || chemicalName;

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
            <p className="font-mono font-semibold text-lg">{displayCasNumber}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">Name</p>
            {isLoading && !displayChemicalName ? (
              <Skeleton className="h-6 w-48" />
            ) : displayChemicalName ? (
              <p className="font-semibold text-lg">{displayChemicalName}</p>
            ) : (
              <p className="font-semibold text-muted-foreground italic">Name not available</p>
            )}
          </div>
        </div>

        {/* Display additional information from /api/cas/{cas} endpoint */}
        {casInfo && (() => {
          // Get all additional fields from the API response (excluding already displayed fields)
          const excludedFields = ['cas_number', 'chemical_name'];
          const additionalFields = Object.keys(casInfo).filter(
            key => !excludedFields.includes(key) && casInfo[key] !== undefined && casInfo[key] !== null
          );
          
          // Known fields to display with labels
          const knownFields: Record<string, string> = {
            n_species: 'Number of Species',
            n_trophic_level: 'Trophic Levels',
            n_results: 'Total Results',
          };

          // If there are additional fields to display
          if (additionalFields.length > 0) {
            return (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
                {additionalFields.map((field) => {
                  const label = knownFields[field] || field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                  const value = casInfo[field];
                  
                  return (
                    <div key={field}>
                      <p className="text-sm text-muted-foreground mb-1">{label}</p>
                      <p className="font-semibold text-lg">
                        <Badge variant="secondary" className="text-base px-3 py-1">
                          {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                        </Badge>
                      </p>
                    </div>
                  );
                })}
              </div>
            );
          }
          return null;
        })()}
      </CardContent>
    </Card>
  );
};
