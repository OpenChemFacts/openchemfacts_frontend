import { useState, useEffect, useRef, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart3, Plus, X, Play } from "lucide-react";
import { toast } from "sonner";
import { usePlotly } from "@/hooks/usePlotly";
import { normalizeCas, compareCas } from "@/lib/cas-utils";
import {
  type PlotlyData,
  processPlotlyTraces,
  validatePlotlyTraces,
  createEnhancedLayout,
  createPlotlyConfig,
  isDarkMode,
} from "@/lib/plotly-utils";
import { ErrorDisplay } from "@/components/ui/error-display";
import { isComparisonData, createComparisonPlotFromData, type ComparisonData } from "@/lib/ssd-plot-utils";
import { useSearchWithContext, useSSDComparison } from "@/hooks/api-hooks";

interface CasItem {
  cas_number: string;
  chemical_name?: string;
}

const DEBOUNCE_DELAY = 300;

const MAX_SUBSTANCES = 5;
const MIN_SUBSTANCES = 2;

export const BenchmarkComparison = () => {
  const [selectedCas, setSelectedCas] = useState<string[]>([]);
  const [selectedCasMetadata, setSelectedCasMetadata] = useState<Map<string, string>>(new Map());
  const [searchTerms, setSearchTerms] = useState<string[]>(["", "", "", "", ""]);
  const [debouncedSearchTerms, setDebouncedSearchTerms] = useState<string[]>(["", "", "", "", ""]);
  const [showSuggestions, setShowSuggestions] = useState<number | null>(null);
  const [shouldFetchPlot, setShouldFetchPlot] = useState(false);
  const plotRef = useRef<HTMLDivElement>(null);
  const [darkMode, setDarkMode] = useState(isDarkMode());
  const resizeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Use shared hooks
  const { plotlyLoaded, Plotly } = usePlotly();

  // Debounce search terms
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerms(searchTerms);
    }, DEBOUNCE_DELAY);
    return () => clearTimeout(timer);
  }, [searchTerms]);

  // Fetch search results for each search term using centralized hooks
  const debouncedTerm0 = debouncedSearchTerms[0]?.trim() || "";
  const debouncedTerm1 = debouncedSearchTerms[1]?.trim() || "";
  const debouncedTerm2 = debouncedSearchTerms[2]?.trim() || "";
  const debouncedTerm3 = debouncedSearchTerms[3]?.trim() || "";
  const debouncedTerm4 = debouncedSearchTerms[4]?.trim() || "";

  const searchQuery0 = useSearchWithContext("benchmark-0", debouncedTerm0, 10);
  const searchQuery1 = useSearchWithContext("benchmark-1", debouncedTerm1, 10);
  const searchQuery2 = useSearchWithContext("benchmark-2", debouncedTerm2, 10);
  const searchQuery3 = useSearchWithContext("benchmark-3", debouncedTerm3, 10);
  const searchQuery4 = useSearchWithContext("benchmark-4", debouncedTerm4, 10);

  // Convert search results to CasItem format
  const searchResults: CasItem[][] = useMemo(() => {
    const convertResults = (query: typeof searchQuery0): CasItem[] => {
      if (!query.data?.matches || !Array.isArray(query.data.matches)) {
        return [];
      }
      return query.data.matches.map((item) => ({
        cas_number: item.cas,
        chemical_name: item.name,
      }));
    };

    return [
      convertResults(searchQuery0),
      convertResults(searchQuery1),
      convertResults(searchQuery2),
      convertResults(searchQuery3),
      convertResults(searchQuery4),
    ];
  }, [searchQuery0.data, searchQuery1.data, searchQuery2.data, searchQuery3.data, searchQuery4.data]);

  // Monitor theme changes
  useEffect(() => {
    const observer = new MutationObserver(() => {
      const newDarkMode = isDarkMode();
      if (newDarkMode !== darkMode) {
        setDarkMode(newDarkMode);
      }
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['class'],
    });

    return () => observer.disconnect();
  }, [darkMode]);

  // Fetch comparison plot when user manually triggers it using centralized hook
  const { data: rawPlotData, isLoading, error, refetch } = useSSDComparison(
    selectedCas,
    shouldFetchPlot && selectedCas.length >= MIN_SUBSTANCES && selectedCas.length <= MAX_SUBSTANCES
  );

  // Transform the response to Plotly format if needed
  useEffect(() => {
    if (rawPlotData) {
      console.log("[BenchmarkComparison] API response received:", rawPlotData);
    }
  }, [rawPlotData]);

  // Convert raw data to Plotly format if needed
  const plotData: PlotlyData | null = useMemo(() => {
    if (!rawPlotData) return null;
    
    // Validate response structure
    if (!rawPlotData) {
      return null;
    }
    
    // Check if it's comparison format or Plotly format
    if (isComparisonData(rawPlotData)) {
      console.log("[BenchmarkComparison] Response is comparison format, converting to Plotly...");
      const plotlyData = createComparisonPlotFromData(rawPlotData);
      console.log("[BenchmarkComparison] Converted to Plotly format:", plotlyData);
      return plotlyData;
    } else if (rawPlotData && 'data' in rawPlotData && 'layout' in rawPlotData) {
      console.log("[BenchmarkComparison] Response is already Plotly format");
      return rawPlotData as PlotlyData;
    } else {
      console.warn("[BenchmarkComparison] Unknown response format:", rawPlotData);
      return null;
    }
  }, [rawPlotData]);

  // Handle errors
  useEffect(() => {
    if (error) {
      console.error("[BenchmarkComparison] API error details:", error);
      const errorMessage = error?.message || error?.toString() || "Unknown error";
      toast.error(`Failed to load comparison: ${errorMessage}`);
    }
  }, [error]);


  // Reset fetch flag when substances change
  useEffect(() => {
    setShouldFetchPlot(false);
  }, [selectedCas]);

  // Render Plotly chart
  useEffect(() => {
    if (plotData && plotRef.current && plotlyLoaded && Plotly) {
      console.log("[BenchmarkComparison] Starting plot rendering...");
      console.log("[BenchmarkComparison] plotData:", plotData);
      console.log("[BenchmarkComparison] plotRef.current:", plotRef.current);
      console.log("[BenchmarkComparison] plotlyLoaded:", plotlyLoaded);
      console.log("[BenchmarkComparison] Plotly:", Plotly);
      
      try {
        // Process traces: decode numpy data while preserving backend optimizations
        const processedTraces = processPlotlyTraces(plotData.data || []);
        console.log("[BenchmarkComparison] Processed traces:", processedTraces);
        
        // Validate traces - backend should send valid data, but we check for safety
        const validTraces = validatePlotlyTraces(processedTraces);
        console.log("[BenchmarkComparison] Valid traces:", validTraces);
        const tracesToRender = validTraces.length > 0 ? validTraces : processedTraces;
        console.log("[BenchmarkComparison] Traces to render:", tracesToRender);
        
        // Verify that Plotly data is valid
        if (tracesToRender.length > 0 && plotData.layout) {
          console.log("[BenchmarkComparison] Data is valid, proceeding with rendering");
          // Clean existing chart before creating a new one
          Plotly.purge(plotRef.current);

          // Create enhanced layout with theme support
          // This respects backend optimizations while applying frontend UI improvements
          const enhancedLayout = createEnhancedLayout({
            type: 'comparison',
            originalLayout: plotData.layout,
            isDarkMode: darkMode,
          });

          // Create configuration - respects backend config while ensuring UI best practices
          const plotConfig = createPlotlyConfig(plotData.config);

          // Ensure container is visible before rendering
          if (plotRef.current && plotRef.current.offsetWidth > 0 && plotRef.current.offsetHeight > 0) {
            console.log("[BenchmarkComparison] Container is ready, rendering plot...");
            console.log("[BenchmarkComparison] Container dimensions:", {
              width: plotRef.current.offsetWidth,
              height: plotRef.current.offsetHeight
            });
            
            Plotly.newPlot(plotRef.current, tracesToRender, enhancedLayout, plotConfig)
              .then(() => {
                console.log("[BenchmarkComparison] Plot rendered successfully");
                // Force a redraw after a short delay to ensure proper sizing
                setTimeout(() => {
                  if (plotRef.current && Plotly) {
                    Plotly.Plots.resize(plotRef.current);
                  }
                }, 100);
              })
              .catch((err: any) => {
                console.error('[BenchmarkComparison] Error during Plotly.newPlot:', err);
                toast.error(`Failed to render plot: ${err?.message || 'Unknown error'}`);
              });
          } else {
            console.log("[BenchmarkComparison] Container not ready, waiting...");
            console.log("[BenchmarkComparison] Container dimensions:", plotRef.current ? {
              width: plotRef.current.offsetWidth,
              height: plotRef.current.offsetHeight
            } : "plotRef.current is null");
            
            // Wait for container to be ready
            const containerCheckInterval = setInterval(() => {
              if (plotRef.current && plotRef.current.offsetWidth > 0 && plotRef.current.offsetHeight > 0) {
                console.log("[BenchmarkComparison] Container is now ready, rendering plot...");
                clearInterval(containerCheckInterval);
                Plotly.newPlot(plotRef.current, tracesToRender, enhancedLayout, plotConfig)
                  .then(() => {
                    console.log("[BenchmarkComparison] Plot rendered successfully (delayed)");
                  })
                  .catch((err: any) => {
                    console.error('[BenchmarkComparison] Error during Plotly.newPlot (delayed):', err);
                    toast.error(`Failed to render plot: ${err?.message || 'Unknown error'}`);
                  });
              }
            }, 100);
            
            // Stop after 5 seconds
            setTimeout(() => {
              clearInterval(containerCheckInterval);
              console.warn("[BenchmarkComparison] Container check timeout after 5 seconds");
            }, 5000);
          }

          // Handle resizing with debounce - both window and container resize
          const handleResize = () => {
            if (resizeTimeoutRef.current) {
              clearTimeout(resizeTimeoutRef.current);
            }
            resizeTimeoutRef.current = setTimeout(() => {
              if (plotRef.current && Plotly) {
                Plotly.Plots.resize(plotRef.current);
              }
            }, 150);
          };
          
          // Listen to window resize
          window.addEventListener("resize", handleResize);
          
          // Listen to container resize using ResizeObserver for better responsiveness
          let resizeObserver: ResizeObserver | null = null;
          if (plotRef.current && typeof ResizeObserver !== 'undefined') {
            resizeObserver = new ResizeObserver(() => {
              handleResize();
            });
            resizeObserver.observe(plotRef.current);
          }
          
          return () => {
            window.removeEventListener("resize", handleResize);
            if (resizeObserver && plotRef.current) {
              resizeObserver.unobserve(plotRef.current);
              resizeObserver.disconnect();
            }
            if (resizeTimeoutRef.current) {
              clearTimeout(resizeTimeoutRef.current);
            }
            if (plotRef.current && Plotly) {
              Plotly.purge(plotRef.current);
            }
          };
        } else {
          console.error("[BenchmarkComparison] Invalid Plotly data structure:", plotData);
          console.error("[BenchmarkComparison] tracesToRender.length:", tracesToRender.length);
          console.error("[BenchmarkComparison] plotData.layout:", plotData.layout);
          toast.error("Invalid plot data structure. Please check the console for details.");
        }
      } catch (plotError: any) {
        console.error("[BenchmarkComparison] Error rendering Plotly chart:", plotError);
        toast.error(`Error rendering plot: ${plotError?.message || 'Unknown error'}`);
      }
    } else {
      if (!plotData) {
        console.log("[BenchmarkComparison] No plotData available");
      }
      if (!plotRef.current) {
        console.log("[BenchmarkComparison] plotRef.current is null");
      }
      if (!plotlyLoaded) {
        console.log("[BenchmarkComparison] Plotly not loaded yet");
      }
      if (!Plotly) {
        console.log("[BenchmarkComparison] Plotly object not available");
      }
    }
  }, [plotData, plotlyLoaded, Plotly, darkMode]);

  // Redraw chart when theme changes
  useEffect(() => {
    if (plotData && plotRef.current && plotlyLoaded && Plotly) {
      try {
        if (plotData.data && plotData.layout) {
          const processedTraces = processPlotlyTraces(plotData.data || []);
          const validTraces = validatePlotlyTraces(processedTraces);
          const tracesToRender = validTraces.length > 0 ? validTraces : processedTraces;
          
          if (tracesToRender.length > 0) {
            const enhancedLayout = createEnhancedLayout({
              type: 'comparison',
              originalLayout: plotData.layout,
              isDarkMode: darkMode,
            });
            const plotConfig = createPlotlyConfig(plotData.config);
            
            Plotly.redraw(plotRef.current).catch(() => {
              // If redraw fails, do a full replot
              Plotly.newPlot(plotRef.current, tracesToRender, enhancedLayout, plotConfig);
            });
          }
        }
      } catch (error) {
        console.error("[BenchmarkComparison] Error redrawing chart on theme change:", error);
      }
    }
  }, [darkMode, plotData, plotlyLoaded, Plotly]);

  const getFilteredSuggestions = (searchTermIndex: number): CasItem[] => {
    // searchTermIndex corresponds to the index in searchTerms/debouncedSearchTerms (0-4)
    // searchResults is indexed the same way (0-4)
    const results = searchResults[searchTermIndex] || [];
    // Filter out already selected CAS numbers
    return results.filter((item) => {
      return !selectedCas.some((selected) => compareCas(selected, item.cas_number));
    });
  };

  const handleAddCas = (cas: string, name: string | undefined, index: number) => {
    if (selectedCas.length >= MAX_SUBSTANCES) {
      toast.error(`Maximum ${MAX_SUBSTANCES} substances for comparison`);
      return;
    }
    // Normalize CAS number before adding
    const normalizedCas = normalizeCas(cas);
    setSelectedCas([...selectedCas, normalizedCas]);
    // Store metadata (chemical name) for display
    if (name) {
      setSelectedCasMetadata((prev) => {
        const newMap = new Map(prev);
        newMap.set(normalizedCas, name);
        return newMap;
      });
    }
    setSearchTerms((prev) => {
      const newTerms = [...prev];
      newTerms[index] = "";
      return newTerms;
    });
    setShowSuggestions(null);
  };

  const handleRemoveCas = (cas: string) => {
    setSelectedCas(selectedCas.filter((c) => c !== cas));
    setSelectedCasMetadata((prev) => {
      const newMap = new Map(prev);
      newMap.delete(cas);
      return newMap;
    });
    setShouldFetchPlot(false);
  };

  const handleGenerateComparison = () => {
    if (selectedCas.length < MIN_SUBSTANCES) {
      toast.error(`Please select at least ${MIN_SUBSTANCES} substances`);
      return;
    }
    if (selectedCas.length > MAX_SUBSTANCES) {
      toast.error(`Please select at most ${MAX_SUBSTANCES} substances`);
      return;
    }
    setShouldFetchPlot(true);
    refetch();
  };

  // Get chemical name from stored metadata, search results, or return CAS
  const getChemicalNameForDisplay = (cas: string): string => {
    if (!cas) return '';
    const normalizedCas = normalizeCas(cas);
    
    // First, try to find in stored metadata (for selected substances)
    const storedName = selectedCasMetadata.get(normalizedCas);
    if (storedName) {
      return storedName;
    }
    
    // Then, try to find in current search results
    for (const results of searchResults) {
      const found = results.find((item) => compareCas(item.cas_number, normalizedCas));
      if (found?.chemical_name) {
        return found.chemical_name;
      }
    }
    
    // If not found, return normalized CAS
    return normalizedCas;
  };

  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-accent" />
          Benchmark - SSD Comparison
        </CardTitle>
        <CardDescription>
          Compare species sensitivity distributions (SSD) between {MIN_SUBSTANCES} and {MAX_SUBSTANCES} substances
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Substance selection */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium">Select {MIN_SUBSTANCES}-{MAX_SUBSTANCES} substances:</h3>
          
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
          {selectedCas.length < MAX_SUBSTANCES && (
            <div className="space-y-3">
              {Array.from({ length: MAX_SUBSTANCES }, (_, i) => i)
                .slice(0, MAX_SUBSTANCES - selectedCas.length)
                .map((index) => (
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
                      placeholder="Search by CAS or name..."
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
                              No substance found
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

        {/* Generate button */}
        {selectedCas.length >= MIN_SUBSTANCES && selectedCas.length <= MAX_SUBSTANCES && (
          <div className="flex justify-center">
            <Button
              onClick={handleGenerateComparison}
              disabled={isLoading || !plotlyLoaded}
              size="lg"
              className="gap-2"
            >
              <Play className="h-4 w-4" />
              {isLoading ? "Generating comparison..." : "Generate Comparison"}
            </Button>
          </div>
        )}

        {/* Plot area */}
        {selectedCas.length < MIN_SUBSTANCES ? (
          <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
            <BarChart3 className="h-12 w-12 mb-4 opacity-50" />
            <p>Select at least {MIN_SUBSTANCES} substances to see the comparison</p>
          </div>
        ) : !shouldFetchPlot ? (
          <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
            <BarChart3 className="h-12 w-12 mb-4 opacity-50" />
            <p>Click "Generate Comparison" to load the graph</p>
          </div>
        ) : isLoading || !plotlyLoaded ? (
          <Skeleton className="h-[80vh] min-h-[600px] w-full" />
        ) : error ? (
          <div className="space-y-4">
            <ErrorDisplay error={error} />
            <div className="flex justify-center">
              <Button onClick={handleGenerateComparison} variant="outline">
                Retry
              </Button>
            </div>
          </div>
        ) : plotData ? (
          <div ref={plotRef} className="w-full h-[80vh] min-h-[600px]" />
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
            <BarChart3 className="h-12 w-12 mb-4 opacity-50" />
            <p>No data available. Please try again.</p>
            <Button onClick={handleGenerateComparison} variant="outline" className="mt-4">
              Retry
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
