import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorDisplay } from "@/components/ui/error-display";
import { Activity } from "lucide-react";
import { API_ENDPOINTS } from "@/lib/config";
import { apiFetch, ApiError } from "@/lib/api";
import { normalizeCas } from "@/lib/cas-utils";

interface EffectFactorsProps {
  cas: string;
}

/**
 * Structure d'un effect factor dans la réponse API
 * Format: {"Source": "nom_source", "EF": valeur_ef}
 */
interface EffectFactorItem {
  Source: string;
  EF: number;
}

/**
 * Structure de la réponse API /cas/{cas}
 * Le champ EffectFactor(S) peut être une chaîne JSON ou un tableau
 */
interface CasInfoResponse {
  cas_number?: string;
  name?: string;
  "EffectFactor(S)"?: string | EffectFactorItem[];
  EffectFactor?: string | EffectFactorItem[];
  EffectFactors?: string | EffectFactorItem[];
  effect_factors?: EffectFactorItem[];
  effectFactors?: EffectFactorItem[];
  [key: string]: any;
}

// Note: EXCLUDED_KEYS is no longer needed as we parse the structured EffectFactor(S) data

export const EffectFactors = ({ cas }: EffectFactorsProps) => {
  const normalizedCas = cas ? normalizeCas(cas) : '';

  // Fetch CAS info to get effect factors
  const { data: casInfo, isLoading, error } = useQuery({
    queryKey: ["cas-info", normalizedCas],
    queryFn: async () => {
      const endpoint = API_ENDPOINTS.CAS_INFO(normalizedCas);
      if (import.meta.env.DEV) {
        console.log(`[EffectFactors] Fetching CAS info from: ${endpoint}`);
      }
      return apiFetch<CasInfoResponse>(endpoint);
    },
    enabled: !!normalizedCas,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    retry: false,
  });

  // Extract and parse effect factors from the response
  // The API may return EffectFactor(S) as a JSON string or as an array
  let parsedEffectFactors: EffectFactorItem[] = [];
  
  if (casInfo) {
    // Try different possible field names (case-insensitive search)
    const effectFactorField = Object.keys(casInfo).find(
      key => key.toLowerCase().includes('effectfactor')
    );
    
    if (effectFactorField) {
      const effectFactorValue = casInfo[effectFactorField];
      
      if (typeof effectFactorValue === 'string') {
        // Parse JSON string
        try {
          parsedEffectFactors = JSON.parse(effectFactorValue);
        } catch (e) {
          if (import.meta.env.DEV) {
            console.error(`[EffectFactors] Failed to parse EffectFactor(S) JSON string:`, e);
          }
        }
      } else if (Array.isArray(effectFactorValue)) {
        // Already an array
        parsedEffectFactors = effectFactorValue;
      }
    } else {
      // Fallback to standard field names
      const fallbackValue = casInfo.effect_factors || casInfo.effectFactors;
      if (Array.isArray(fallbackValue)) {
        parsedEffectFactors = fallbackValue;
      } else if (typeof fallbackValue === 'string') {
        try {
          parsedEffectFactors = JSON.parse(fallbackValue);
        } catch (e) {
          if (import.meta.env.DEV) {
            console.error(`[EffectFactors] Failed to parse effect_factors JSON string:`, e);
          }
        }
      }
    }
  }

  // Extract sources and EF values from parsed effect factors
  // Each effect factor item in the array has "Source" and "EF" keys
  // We extract all sources (up to 3) from the array
  const sources: Array<{ source: string; ef: number | string | null }> = [];
  
  parsedEffectFactors.slice(0, 3).forEach((factorItem) => {
    if (factorItem && typeof factorItem === 'object') {
      const source = factorItem.Source || factorItem.source || '';
      const ef = factorItem.EF !== undefined ? factorItem.EF : (factorItem.ef !== undefined ? factorItem.ef : null);
      
      if (source) {
        sources.push({
          source: source,
          ef: ef !== null && ef !== undefined ? ef : null,
        });
      }
    }
  });

  // Debug log in development
  if (import.meta.env.DEV && casInfo) {
    console.log(`[EffectFactors] CAS info for ${normalizedCas}:`, casInfo);
    console.log(`[EffectFactors] Parsed effect factors:`, parsedEffectFactors);
    console.log(`[EffectFactors] Extracted sources:`, sources);
  }

  // Don't render if no CAS number
  if (!normalizedCas) {
    return null;
  }

  // Loading state
  if (isLoading) {
    return (
      <Card className="shadow-card">
        <CardHeader>
          <Skeleton className="h-8 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Error state (but don't show error for 404, as endpoint may not exist for all CAS)
  const shouldShowError = error && !(error instanceof ApiError && error.status === 404);
  
  if (shouldShowError) {
    return (
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            Effect Factors
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ErrorDisplay 
            error={error} 
            title="Error loading effect factors"
          />
        </CardContent>
      </Card>
    );
  }

  // No effect factors available
  if (parsedEffectFactors.length === 0 || sources.length === 0) {
    return (
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            Effect Factors
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            No effect factors available for this substance.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Display effect factors (maximum 3 sources)
  const displaySources = sources.slice(0, 3);

  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary" />
          Effect Factors
          <Badge variant="secondary" className="ml-2">
            {displaySources.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border bg-muted/50 p-4 hover:bg-muted/70 transition-colors">
          <div className="space-y-3">
            {displaySources.length > 0 ? (
              displaySources.map((source, sourceIndex) => (
                <div
                  key={sourceIndex}
                  className="flex items-center justify-between py-2 border-b last:border-b-0"
                >
                  <span className="font-medium text-sm">
                    {source.source}
                  </span>
                  <div className="flex items-center gap-2">
                    {source.ef !== null && source.ef !== undefined ? (
                      <>
                        <span className="font-mono font-semibold text-primary text-base">
                          {typeof source.ef === 'number' 
                            ? source.ef.toLocaleString() 
                            : String(source.ef)}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          EF
                        </Badge>
                      </>
                    ) : (
                      <span className="text-sm text-muted-foreground italic">
                        not available
                      </span>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-sm text-muted-foreground text-center py-2">
                No sources available
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

