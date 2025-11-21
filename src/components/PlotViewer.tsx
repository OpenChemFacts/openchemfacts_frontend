import { useEffect, useRef, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart3 } from "lucide-react";
import { API_ENDPOINTS } from "@/lib/config";
import { apiFetch } from "@/lib/api";
import { usePlotly } from "@/hooks/usePlotly";
import {
  type PlotlyData,
  processPlotlyTraces,
  createEnhancedLayout,
  createPlotlyConfig,
  validatePlotlyTraces,
  enhanceEC10eqTraces,
  isDarkMode,
} from "@/lib/plotly-utils";
import { ErrorDisplay } from "@/components/ui/error-display";

interface PlotViewerProps {
  cas: string;
  type: "ssd" | "ec10eq";
}

export const PlotViewer = ({ cas, type }: PlotViewerProps) => {
  const plotRef = useRef<HTMLDivElement>(null);
  const { plotlyLoaded, Plotly } = usePlotly();
  const [darkMode, setDarkMode] = useState(isDarkMode());
  const resizeTimeoutRef = useRef<number | null>(null);

  const endpoint = type === "ssd" 
    ? API_ENDPOINTS.SSD_PLOT(cas)
    : API_ENDPOINTS.EC10EQ_PLOT(cas);
  const title = type === "ssd" 
    ? "Species Sensitivity Distribution (SSD)" 
    : "EC10 Equivalent";

  const { data, isLoading, error } = useQuery({
    queryKey: ["plot", cas, type],
    queryFn: () => apiFetch<PlotlyData>(endpoint),
    // NOTE: Temporarily disable EC10EQ endpoint
    enabled: !!cas && type !== "ec10eq",
  });

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

  // Render Plotly chart
  useEffect(() => {
    if (data && plotRef.current && plotlyLoaded && Plotly) {
      try {
        // Verify that Plotly data is valid
        if (data.data && data.layout) {
          // Clean existing chart before creating a new one
          Plotly.purge(plotRef.current);

          // Process traces: decode numpy data while preserving backend optimizations
          let processedTraces = processPlotlyTraces(data.data || []);
          
          // For EC10eq, enhance traces to avoid overlap (UI improvement)
          if (type === 'ec10eq') {
            processedTraces = enhanceEC10eqTraces(processedTraces);
          }
          
          // Validate traces - backend should send valid data, but we check for safety
          const validTraces = validatePlotlyTraces(processedTraces);
          // Use validated traces if available, otherwise fall back to processed traces
          // This ensures we always try to render something if backend data is valid
          const tracesToRender = validTraces.length > 0 ? validTraces : processedTraces;
          
          if (tracesToRender.length === 0) {
            console.error("[PlotViewer] No valid traces to render after processing");
            return;
          }

          // Create enhanced layout with theme support
          const enhancedLayout = createEnhancedLayout({
            type,
            originalLayout: data.layout,
            isDarkMode: darkMode,
          });

          // Create configuration
          const plotConfig = createPlotlyConfig(data.config);

          // Ensure container is visible before rendering
          if (plotRef.current && plotRef.current.offsetWidth > 0 && plotRef.current.offsetHeight > 0) {
            Plotly.newPlot(plotRef.current, tracesToRender, enhancedLayout, plotConfig)
              .then(() => {
                // Force a redraw after a short delay
                setTimeout(() => {
                  if (plotRef.current && Plotly) {
                    Plotly.Plots.resize(plotRef.current);
                  }
                }, 100);
              })
              .catch((err: any) => {
                console.error('[PlotViewer] Error during Plotly.newPlot:', err);
              });
          } else {
            // Wait for container to be ready
            const containerCheckInterval = setInterval(() => {
              if (plotRef.current && plotRef.current.offsetWidth > 0 && plotRef.current.offsetHeight > 0) {
                clearInterval(containerCheckInterval);
                Plotly.newPlot(plotRef.current, tracesToRender, enhancedLayout, plotConfig)
                  .catch((err: any) => {
                    console.error('[PlotViewer] Error during Plotly.newPlot:', err);
                  });
              }
            }, 100);
            
            // Stop after 5 seconds
            setTimeout(() => {
              clearInterval(containerCheckInterval);
            }, 5000);
          }

          // Handle resizing with debounce
          const resizeHandler = () => {
            if (resizeTimeoutRef.current) {
              clearTimeout(resizeTimeoutRef.current);
            }
            resizeTimeoutRef.current = setTimeout(() => {
              if (plotRef.current && Plotly) {
                Plotly.Plots.resize(plotRef.current);
              }
            }, 150);
          };
          window.addEventListener("resize", resizeHandler);
          
          return () => {
            window.removeEventListener("resize", resizeHandler);
            if (resizeTimeoutRef.current) {
              clearTimeout(resizeTimeoutRef.current);
            }
            if (plotRef.current && Plotly) {
              Plotly.purge(plotRef.current);
            }
          };
        } else {
          console.error("[PlotViewer] Invalid Plotly data structure:", data);
        }
      } catch (plotError) {
        console.error("[PlotViewer] Error rendering Plotly chart:", plotError);
      }
    }
  }, [data, plotlyLoaded, Plotly, type, darkMode]);

  // Redraw chart when theme changes
  useEffect(() => {
    if (data && plotRef.current && plotlyLoaded && Plotly) {
      try {
        if (data.data && data.layout) {
          let processedTraces = processPlotlyTraces(data.data || []);
          if (type === 'ec10eq') {
            processedTraces = enhanceEC10eqTraces(processedTraces);
          }
          const validTraces = validatePlotlyTraces(processedTraces);
          const tracesToRender = validTraces.length > 0 ? validTraces : processedTraces;
          const enhancedLayout = createEnhancedLayout({
            type,
            originalLayout: data.layout,
            isDarkMode: darkMode,
          });
          const plotConfig = createPlotlyConfig(data.config);
          
          Plotly.redraw(plotRef.current).catch(() => {
            // If redraw fails, do a full replot
            Plotly.newPlot(plotRef.current, tracesToRender, enhancedLayout, plotConfig);
          });
        }
      } catch (error) {
        console.error("[PlotViewer] Error redrawing chart on theme change:", error);
      }
    }
  }, [darkMode, data, plotlyLoaded, Plotly, type]);

  if (error) {
    return (
      <ErrorDisplay 
        error={error} 
        title="Error loading chart"
      />
    );
  }

  // If data is loaded but Plotly is not ready yet, display a skeleton
  if ((data && !plotlyLoaded) || isLoading) {
    return (
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-accent" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-96 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-accent" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div 
          ref={plotRef} 
          className={`w-full ${type === 'ec10eq' ? 'h-[500px] sm:h-[600px] md:h-[700px]' : 'h-[400px] sm:h-[500px] md:h-[600px]'}`}
        />
      </CardContent>
    </Card>
  );
};
