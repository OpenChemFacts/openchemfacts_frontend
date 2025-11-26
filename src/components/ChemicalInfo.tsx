import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { FlaskConical } from "lucide-react";
import { useCasList } from "@/hooks/useCasList";
import { normalizeCas, compareCas } from "@/lib/cas-utils";
import { ApiError } from "@/lib/api";
import { ErrorDisplay } from "@/components/ui/error-display";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useCasInfo } from "@/hooks/api-hooks";
import { CasInfoResponse } from "@/lib/api-types";

interface ChemicalInfoProps {
  cas: string;
  chemical_name?: string;
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
  
  // Fetch detailed CAS information using centralized hook
  // Note: This endpoint may return 404 if not available, which is handled gracefully
  const { data: casInfo, isLoading: isCasInfoLoading, error: casInfoError } = useCasInfo(normalizedCas);

  // Debug: log API response in development
  useEffect(() => {
    if (import.meta.env.DEV && casInfo) {
      console.log(`[ChemicalInfo] API response for CAS ${normalizedCas}:`, casInfo);
    }
  }, [casInfo, normalizedCas]);
  
  // Systematically retrieve the chemical name if not already provided in props
  useEffect(() => {
    // Priority: casInfo.name (API format) > propChemicalName > casList
    // The API uses 'name' but we convert it to 'chemical_name' for internal consistency
    if (casInfo?.name) {
      setChemicalName(casInfo.name);
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

  // Don't display error if it's just a 404 (endpoint may not exist for all CAS)
  // Only show error for other types of failures
  const shouldShowError = casInfoError && !(casInfoError instanceof ApiError && casInfoError.status === 404);
  
  if (shouldShowError) {
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
  // The API uses 'name' but we convert it for display
  const displayCasNumber = casInfo?.cas_number || normalizedCas;
  const displayChemicalName = casInfo?.name || chemicalName;

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
          <div className="min-w-0">
            <p className="text-sm text-muted-foreground mb-1">Name</p>
            {isLoading && !displayChemicalName ? (
              <Skeleton className="h-6 w-48" />
            ) : displayChemicalName ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <p className="font-semibold text-lg truncate cursor-help" title={displayChemicalName}>
                    {displayChemicalName}
                  </p>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-md">{displayChemicalName}</p>
                </TooltipContent>
              </Tooltip>
            ) : (
              <p className="font-semibold text-muted-foreground italic">Name not available</p>
            )}
          </div>
        </div>

        {/* Display additional information from /api/cas/{cas} endpoint */}
        {casInfo && (() => {
          // Get all additional fields from the API response (excluding already displayed fields)
          // The API uses 'name' for the chemical name
          // Exclude EffectFactor(S) fields as they are handled by EffectFactors component
          const excludedFields = ['cas_number', 'name', 'EffectFactor(S)', 'EffectFactor', 'EffectFactors', 'effect_factors', 'effectFactors'];
          const additionalFields = Object.keys(casInfo).filter(
            key => !excludedFields.includes(key) && 
                   !key.toLowerCase().includes('effectfactor') &&
                   casInfo[key] !== undefined && 
                   casInfo[key] !== null
          );
          
          // Known fields to display with labels
          const knownFields: Record<string, string> = {
            n_species: 'Number of Species',
            n_trophic_level: 'Trophic Levels',
            n_results: 'Total Results',
            INCHIKEY: 'InChI Key',
            Kingdom: 'Kingdom',
            Superclass: 'Superclass',
            Class: 'Class',
          };

          // If there are additional fields to display
          if (additionalFields.length > 0) {
            return (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                {additionalFields.map((field) => {
                  const label = knownFields[field] || field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                  const value = casInfo[field];
                  
                  return (
                    <div key={field}>
                      <p className="text-sm text-muted-foreground mb-1">{label}</p>
                      <p className="font-semibold text-lg">
                        {typeof value === 'object' ? JSON.stringify(value) : String(value)}
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
