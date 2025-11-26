import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
 * Structure of an effect factor in the API response
 * Format: {"Source": "source_name", "EF": ef_value}
 */
interface EffectFactorItem {
  Source: string;
  EF: number;
}

/**
 * Structure of the API response /cas/{cas}
 * The EffectFactor(S) field can be a JSON string or an array
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

/**
 * Structure of the API response /metadata
 * Contains metadata about fields and their units
 * Example response:
 * {
 *   "EF": {
 *     "unit": "PAF·m³/kg",
 *     "formula": "EF = O,2 / HC20",
 *     "summary": "...",
 *     "details": "..."
 *   },
 *   "HC20": { "unit": "mg/L", ... },
 *   "EC10eq": { "unit": "mg/L", ... },
 *   "SSD": { "definition": "...", ... }
 * }
 */
interface MetadataResponse {
  EF?: {
    unit?: string;
    formula?: string;
    summary?: string;
    details?: string;
  };
  HC20?: {
    unit?: string;
    definition?: string;
  };
  EC10eq?: {
    unit?: string;
    definition?: string;
  };
  SSD?: {
    definition?: string;
    summary?: string;
  };
  [key: string]: any;
}

export const EffectFactors = ({ cas }: EffectFactorsProps) => {
  const normalizedCas = cas ? normalizeCas(cas) : '';

  // Fetch metadata to get EF unit (non-blocking, with fallback)
  // This query is non-critical - if it fails, we use "EF" as fallback
  const { data: metadata, error: metadataError } = useQuery({
    queryKey: ["metadata"],
    queryFn: async () => {
      const endpoint = API_ENDPOINTS.METADATA;
      if (import.meta.env.DEV) {
        console.log(`[EffectFactors] Fetching metadata from: ${endpoint}`);
      }
      return apiFetch<MetadataResponse>(endpoint);
    },
    staleTime: 30 * 60 * 1000, // Cache for 30 minutes (metadata rarely changes)
    retry: false,
    // Don't throw errors - this is a non-critical request
    throwOnError: false,
  });

  // Log metadata errors in dev mode (non-critical)
  if (import.meta.env.DEV && metadataError) {
    console.warn(`[EffectFactors] Failed to fetch metadata (non-critical, using fallback):`, metadataError);
  }

  // Extract EF unit from metadata with fallback to "EF"
  // Structure: metadata.EF.unit (e.g., "PAF·m³/kg")
  let efUnit = "EF";
  if (metadata && typeof metadata === 'object' && metadata.EF && typeof metadata.EF === 'object') {
    const efData = metadata.EF as { unit?: string };
    if (efData.unit && typeof efData.unit === 'string') {
      efUnit = efData.unit;
    }
  }

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
      const source = factorItem.Source || '';
      const ef = factorItem.EF !== undefined ? factorItem.EF : null;
      
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
          <CardDescription className="text-sm mt-2">
            Large variations (×2 to ×100) in aquatic ecotoxicity effect factors are common and reflect natural biological and methodological variability.
          </CardDescription>
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
          <CardDescription className="text-sm mt-2">
            Large variations (×2 to ×100) in aquatic ecotoxicity effect factors are common and reflect natural biological and methodological variability.
          </CardDescription>
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
        <CardDescription className="text-sm mt-2">
          Large variations (×2 to ×100) in aquatic ecotoxicity effect factors are common and reflect natural biological and methodological variability.
        </CardDescription>
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
                          {efUnit}
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

