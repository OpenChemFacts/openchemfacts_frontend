import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart3, AlertCircle, Plus, X } from "lucide-react";
import { API_BASE_URL, API_ENDPOINTS } from "@/lib/config";
import { ApiError } from "@/lib/api";
import { toast } from "sonner";

interface CasItem {
  cas_number: string;
  chemical_name?: string;
}

interface PlotlyData {
  data: any[];
  layout: any;
  config?: any;
}

export const BenchmarkComparison = () => {
  const [selectedCas, setSelectedCas] = useState<string[]>([]);
  const [searchTerms, setSearchTerms] = useState<string[]>(["", "", ""]);
  const [showSuggestions, setShowSuggestions] = useState<number | null>(null);
  const plotRef = useRef<HTMLDivElement>(null);

  // Fetch CAS list for autocomplete
  const { data: casListResponse } = useQuery({
    queryKey: ["cas-list"],
    queryFn: async () => {
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.CAS_LIST}`);
      if (!response.ok) throw new Error("Failed to fetch CAS list");
      const data = await response.json();
      
      if (data?.cas_with_names) {
        if (Array.isArray(data.cas_with_names)) {
          return data.cas_with_names as CasItem[];
        } else {
          return Object.entries(data.cas_with_names as Record<string, string>).map(
            ([cas_number, chemical_name]) => ({ cas_number, chemical_name })
          );
        }
      }
      return [];
    },
  });

  const casList: CasItem[] = casListResponse || [];

  // Fetch comparison plot when we have 2-3 substances selected
  const { data: plotData, isLoading, error } = useQuery({
    queryKey: ["ssd-comparison", selectedCas],
    queryFn: async () => {
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.SSD_COMPARISON}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cas_list: selectedCas }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new ApiError(
          errorText || "Failed to fetch comparison plot",
          response.status,
          response.statusText
        );
      }

      return response.json() as Promise<PlotlyData>;
    },
    enabled: selectedCas.length >= 2 && selectedCas.length <= 3,
  });

  // Render Plotly chart
  useEffect(() => {
    if (plotData && plotRef.current && (window as any).Plotly) {
      try {
        const enhancedLayout = {
          ...plotData.layout,
          autosize: true,
          margin: { l: 80, r: 120, t: 100, b: 120, pad: 10 },
          font: { size: 12 },
        };

        (window as any).Plotly.newPlot(
          plotRef.current,
          plotData.data,
          enhancedLayout,
          {
            responsive: true,
            displayModeBar: true,
            displaylogo: false,
            modeBarButtonsToRemove: ["lasso2d", "select2d"],
            ...(plotData.config || {}),
          }
        );

        const resizeHandler = () => {
          if (plotRef.current && (window as any).Plotly) {
            (window as any).Plotly.Plots.resize(plotRef.current);
          }
        };
        window.addEventListener("resize", resizeHandler);
        return () => window.removeEventListener("resize", resizeHandler);
      } catch (plotError) {
        console.error("Error rendering Plotly chart:", plotError);
      }
    }
  }, [plotData]);

  // Load Plotly dynamically
  useEffect(() => {
    if (!(window as any).Plotly) {
      const script = document.createElement("script");
      script.src = "https://cdn.plot.ly/plotly-2.27.0.min.js";
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  const getFilteredSuggestions = (index: number) => {
    const term = searchTerms[index];
    if (!term) return [];
    
    return casList
      .filter((item) => {
        const matchesTerm = 
          item.cas_number.toLowerCase().includes(term.toLowerCase()) ||
          item.chemical_name?.toLowerCase().includes(term.toLowerCase());
        const notAlreadySelected = !selectedCas.includes(item.cas_number);
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

  const getChemicalName = (cas: string) => {
    const item = casList.find((item) => item.cas_number === cas);
    return item?.chemical_name || cas;
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
                  <span>{getChemicalName(cas)}</span>
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
        ) : isLoading ? (
          <Skeleton className="h-96 w-full" />
        ) : error ? (
          <div className="flex items-center gap-2 text-destructive p-4 border border-destructive rounded-md">
            <AlertCircle className="h-5 w-5" />
            <div>
              <p className="font-semibold">Erreur</p>
              <p className="text-sm">
                {error instanceof ApiError ? error.message : "Erreur lors du chargement"}
              </p>
            </div>
          </div>
        ) : (
          <div ref={plotRef} className="w-full h-[500px] md:h-[600px]" />
        )}
      </CardContent>
    </Card>
  );
};
