import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart3 } from "lucide-react";
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
import { isSSDData, createSSDPlotFromData, type SSDData } from "@/lib/ssd-plot-utils";
import { isEC10eqData, createEC10eqPlotFromData, type EC10eqData } from "@/lib/ec10eq-plot-utils";
import { useSSDPlot, useEC10eqPlot, useMetadata } from "@/hooks/api-hooks";
import { MetadataResponse } from "@/lib/api-types";

interface PlotViewerProps {
  cas: string;
  type: "ssd" | "ec10eq";
}

export const PlotViewer = ({ cas, type }: PlotViewerProps) => {
  const plotRef = useRef<HTMLDivElement>(null);
  const { plotlyLoaded, Plotly } = usePlotly();
  const [darkMode, setDarkMode] = useState(isDarkMode());
  const resizeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const title = type === "ssd" 
    ? "Species Sensitivity Distribution (SSD)" 
    : "EC10 Equivalent";

  // Fetch plot data using centralized hooks
  const ssdQuery = useSSDPlot(cas, { enabled: type === "ssd" && !!cas });
  const ec10eqQuery = useEC10eqPlot(cas, { enabled: type === "ec10eq" && !!cas });
  
  const rawData = type === "ssd" ? ssdQuery.data : ec10eqQuery.data;
  const isLoading = type === "ssd" ? ssdQuery.isLoading : ec10eqQuery.isLoading;
  const error = type === "ssd" ? ssdQuery.error : ec10eqQuery.error;

  // Fetch metadata to get context information (summary and why) and HC20 definition
  const { data: metadata } = useMetadata();

  // Extract HC20 definition from metadata (for SSD plots)
  const hc20Definition = metadata?.HC20?.definition;

  // Extract context information (summary and why) based on plot type
  const contextInfo = type === "ssd" 
    ? metadata?.SSD
    : metadata?.EC10eq;

  // Check if we should display a message instead of the plot
  // This happens when SSD data has a message and no curve (single endpoint case)
  const shouldShowMessage = rawData && isSSDData(rawData) && rawData.message && !rawData.ssd_curve;

  // Convert JSON data to Plotly format if needed
  const data: PlotlyData | null = rawData && !shouldShowMessage
    ? isSSDData(rawData)
      ? createSSDPlotFromData(rawData, hc20Definition)
      : isEC10eqData(rawData)
      ? createEC10eqPlotFromData(rawData, 'trophic_group')
      : (rawData as PlotlyData)
    : null;

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

  // If we should show a message instead of the plot (single endpoint case)
  if (shouldShowMessage && rawData && isSSDData(rawData)) {
    const message = rawData.message || 'No SSD curve available';
    return (
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-accent" />
            {title}
          </CardTitle>
          {(contextInfo?.summary || contextInfo?.why) && (
            <div className="mt-3 space-y-1 text-sm text-muted-foreground break-words overflow-wrap-anywhere">
              {contextInfo.summary && (
                <div>{contextInfo.summary}</div>
              )}
              {contextInfo.why && (
                <div className="italic">{contextInfo.why}</div>
              )}
            </div>
          )}
        </CardHeader>
        <CardContent className="p-2 sm:p-4">
          <div className="flex items-center justify-center h-[80vh] min-h-[600px]">
            <p className="text-2xl md:text-3xl lg:text-4xl font-semibold text-center text-muted-foreground px-4">
              {message}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // If data is loaded but Plotly is not ready yet, display a skeleton
  if ((data && !plotlyLoaded) || isLoading || !data) {
    return (
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-accent" />
            {title}
          </CardTitle>
          {(contextInfo?.summary || contextInfo?.why) && (
            <div className="mt-3 space-y-1 text-sm text-muted-foreground break-words overflow-wrap-anywhere">
              {contextInfo.summary && (
                <div>{contextInfo.summary}</div>
              )}
              {contextInfo.why && (
                <div className="italic">{contextInfo.why}</div>
              )}
            </div>
          )}
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[80vh] min-h-[600px] w-full" />
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
        {(contextInfo?.summary || contextInfo?.why) && (
          <div className="mt-3 space-y-1 text-sm text-muted-foreground break-words overflow-wrap-anywhere">
            {contextInfo.summary && (
              <div>{contextInfo.summary}</div>
            )}
            {contextInfo.why && (
              <div className="italic">{contextInfo.why}</div>
            )}
          </div>
        )}
      </CardHeader>
      <CardContent className="p-2 sm:p-4">
        <div 
          ref={plotRef} 
          className="w-full h-[80vh] min-h-[600px]"
        />
      </CardContent>
    </Card>
  );
};
