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
 * Structure attendue pour un effect factor
 * Chaque dictionnaire contient les valeurs EF pour différentes sources
 */
interface EffectFactor {
  [key: string]: any; // Dictionnaire avec les valeurs EF par source
}

/**
 * Structure de la réponse API /cas/{cas}
 * Peut contenir un champ effect_factors ou effectFactors
 */
interface CasInfoResponse {
  cas_number?: string;
  name?: string;
  effect_factors?: EffectFactor[];
  effectFactors?: EffectFactor[];
  [key: string]: any;
}

/**
 * Clés à exclure lors de l'extraction des sources (métadonnées, pas des sources)
 */
const EXCLUDED_KEYS = ['id', 'cas_number', 'name', 'description', 'type', 'unit'];

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

  // Extract effect factors from the response
  // Support both snake_case and camelCase
  const effectFactors: EffectFactor[] = casInfo?.effect_factors || casInfo?.effectFactors || [];

  // Extract sources and EF values from each effect factor
  // Each effect factor is a dictionary with source names as keys and EF values as values
  const sourcesData = effectFactors.map((factor, index) => {
    const sources: Array<{ source: string; ef: number | string | null }> = [];
    
    // Extract all keys that are not excluded (these are the sources)
    Object.keys(factor).forEach((key) => {
      if (!EXCLUDED_KEYS.includes(key.toLowerCase())) {
        const value = factor[key];
        // Include all sources, even if value is null/undefined (will show "not available")
        sources.push({
          source: key,
          ef: value !== null && value !== undefined ? value : null,
        });
      }
    });
    
    return {
      id: factor.id || index,
      sources: sources.slice(0, 3), // Maximum 3 sources per effect factor
    };
  });

  // Debug log in development
  if (import.meta.env.DEV && casInfo) {
    console.log(`[EffectFactors] Effect factors for CAS ${normalizedCas}:`, effectFactors);
    console.log(`[EffectFactors] Extracted sources data:`, sourcesData);
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
  if (effectFactors.length === 0 || sourcesData.length === 0) {
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

  // Display effect factors (maximum 3)
  const displayFactors = sourcesData.slice(0, 3);

  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary" />
          Effect Factors
          <Badge variant="secondary" className="ml-2">
            {displayFactors.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {displayFactors.map((factorData) => {
            // Display up to 3 sources from the factor
            const sources = factorData.sources.slice(0, 3);

            return (
              <div
                key={factorData.id}
                className="rounded-lg border bg-muted/50 p-4 hover:bg-muted/70 transition-colors"
              >
                <div className="space-y-3">
                  {sources.length > 0 ? (
                    sources.map((source, sourceIndex) => (
                      <div
                        key={sourceIndex}
                        className="flex items-center justify-between py-2 border-b last:border-b-0"
                      >
                        <span className="font-medium text-sm capitalize">
                          {source.source.replace(/_/g, ' ')}
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
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

