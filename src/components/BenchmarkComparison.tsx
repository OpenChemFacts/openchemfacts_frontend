import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart3, Plus, X } from "lucide-react";
import { API_ENDPOINTS } from "@/lib/config";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";
import { useCasList } from "@/hooks/useCasList";
import { usePlotly } from "@/hooks/usePlotly";
import { normalizeCas, compareCas } from "@/lib/cas-utils";
import {
  type PlotlyData,
  processPlotlyTraces,
  createEnhancedLayout,
  createPlotlyConfig,
} from "@/lib/plotly-utils";
import { ErrorDisplay } from "@/components/ui/error-display";

export const BenchmarkComparison = () => {
  const [selectedCas, setSelectedCas] = useState<string[]>([]);
  const [searchTerms, setSearchTerms] = useState<string[]>(["", "", ""]);
  const [showSuggestions, setShowSuggestions] = useState<number | null>(null);
  const plotRef = useRef<HTMLDivElement>(null);

  // Utiliser les hooks partagés
  const { casList, getChemicalName } = useCasList();
  const { plotlyLoaded, Plotly } = usePlotly();

  // Fetch comparison plot when we have 2-3 substances selected
  const { data: plotData, isLoading, error } = useQuery({
    queryKey: ["ssd-comparison", selectedCas],
    queryFn: async () => {
      return apiFetch<PlotlyData>(API_ENDPOINTS.SSD_COMPARISON, {
        method: "POST",
        body: JSON.stringify({ cas_list: selectedCas }),
      });
    },
    enabled: selectedCas.length >= 2 && selectedCas.length <= 3,
  });

  // Render Plotly chart
  useEffect(() => {
    if (plotData && plotRef.current && plotlyLoaded && Plotly) {
      try {
        // Décoder les traces avant de les afficher
        const processedTraces = processPlotlyTraces(plotData.data || []);
        
        // Vérifier que les données Plotly sont valides
        if (processedTraces.length > 0 && plotData.layout) {
          // Nettoyer le graphique existant avant d'en créer un nouveau
          Plotly.purge(plotRef.current);

          // Créer le layout amélioré
          const enhancedLayout = createEnhancedLayout({
            type: 'comparison',
            originalLayout: plotData.layout,
          });

          // Créer la configuration
          const plotConfig = createPlotlyConfig(plotData.config);

          // Rendre le graphique
          Plotly.newPlot(plotRef.current, processedTraces, enhancedLayout, plotConfig);

          // Gérer le redimensionnement
          const resizeHandler = () => {
            if (plotRef.current && Plotly) {
              Plotly.Plots.resize(plotRef.current);
            }
          };
          window.addEventListener("resize", resizeHandler);
          
          return () => {
            window.removeEventListener("resize", resizeHandler);
            if (plotRef.current && Plotly) {
              Plotly.purge(plotRef.current);
            }
          };
        } else {
          console.error("[BenchmarkComparison] Invalid Plotly data structure:", plotData);
        }
      } catch (plotError) {
        console.error("[BenchmarkComparison] Error rendering Plotly chart:", plotError);
      }
    }
  }, [plotData, plotlyLoaded, Plotly]);

  const getFilteredSuggestions = (index: number) => {
    const term = searchTerms[index];
    if (!term) return [];
    
    const normalizedTerm = normalizeCas(term).toLowerCase();
    
    return casList
      .filter((item) => {
        const normalizedCas = normalizeCas(item.cas_number).toLowerCase();
        const normalizedName = item.chemical_name?.toLowerCase() || '';
        const matchesTerm = 
          normalizedCas.includes(normalizedTerm) ||
          normalizedName.includes(normalizedTerm);
        // Vérifier que le CAS n'est pas déjà sélectionné (avec normalisation)
        const notAlreadySelected = !selectedCas.some(selected => compareCas(selected, item.cas_number));
        return matchesTerm && notAlreadySelected;
      })
      .slice(0, 10);
  };

  const handleAddCas = (cas: string, name: string | undefined, index: number) => {
    if (selectedCas.length >= 3) {
      toast.error("Maximum 3 substances pour la comparaison");
      return;
    }
    setSelectedCas([...selectedCas, cas]);
    setSearchTerms((prev) => {
      const newTerms = [...prev];
      newTerms[index] = "";
      return newTerms;
    });
    setShowSuggestions(null);
  };

  const handleRemoveCas = (cas: string) => {
    setSelectedCas(selectedCas.filter((c) => c !== cas));
  };

  // Utiliser la fonction du hook pour obtenir le nom chimique
  const getChemicalNameForDisplay = (cas: string): string => {
    if (!cas) return '';
    const normalizedCas = normalizeCas(cas);
    const name = getChemicalName(normalizedCas);
    return name || normalizedCas;
  };

  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-accent" />
          Benchmark - Comparaison SSD
        </CardTitle>
        <CardDescription>
          Comparez les distributions de sensibilité des espèces (SSD) entre 2 ou 3 substances
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Selection des substances */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium">Sélectionnez 2-3 substances :</h3>
          
          {/* Selected substances */}
          {selectedCas.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {selectedCas.map((cas) => (
                <div
                  key={cas}
                  className="flex items-center gap-2 px-3 py-2 bg-primary/10 text-primary rounded-md text-sm"
                >
                  <span>{getChemicalNameForDisplay(cas)}</span>
                  <button
                    onClick={() => handleRemoveCas(cas)}
                    className="hover:bg-primary/20 rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Add substance inputs */}
          {selectedCas.length < 3 && (
            <div className="space-y-3">
              {[0, 1, 2].slice(0, 3 - selectedCas.length).map((index) => (
                <div key={index} className="relative">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={searchTerms[selectedCas.length + index]}
                      onChange={(e) => {
                        const newTerms = [...searchTerms];
                        newTerms[selectedCas.length + index] = e.target.value;
                        setSearchTerms(newTerms);
                        setShowSuggestions(selectedCas.length + index);
                      }}
                      onFocus={() => setShowSuggestions(selectedCas.length + index)}
                      placeholder="Rechercher par CAS ou nom..."
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    />
                    <Button variant="outline" size="icon" disabled>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Suggestions dropdown */}
                  {showSuggestions === selectedCas.length + index &&
                    searchTerms[selectedCas.length + index] && (
                      <Card className="absolute z-10 mt-1 w-full max-h-60 overflow-y-auto">
                        <CardContent className="p-2">
                          {getFilteredSuggestions(selectedCas.length + index).map((item) => (
                            <button
                              key={item.cas_number}
                              onClick={() =>
                                handleAddCas(
                                  item.cas_number,
                                  item.chemical_name,
                                  selectedCas.length + index
                                )
                              }
                              className="w-full text-left px-3 py-2 hover:bg-accent rounded-md transition-colors"
                            >
                              <div className="font-medium text-sm">{item.cas_number}</div>
                              {item.chemical_name && (
                                <div className="text-xs text-muted-foreground">
                                  {item.chemical_name}
                                </div>
                              )}
                            </button>
                          ))}
                          {getFilteredSuggestions(selectedCas.length + index).length === 0 && (
                            <div className="text-sm text-muted-foreground p-3">
                              Aucune substance trouvée
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Plot area */}
        {selectedCas.length < 2 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
            <BarChart3 className="h-12 w-12 mb-4 opacity-50" />
            <p>Sélectionnez au moins 2 substances pour voir la comparaison</p>
          </div>
        ) : isLoading || !plotlyLoaded ? (
          <Skeleton className="h-96 w-full" />
        ) : error ? (
          <ErrorDisplay error={error} />
        ) : (
          <div ref={plotRef} className="w-full min-h-[600px] lg:min-h-[700px]" />
        )}
      </CardContent>
    </Card>
  );
};
