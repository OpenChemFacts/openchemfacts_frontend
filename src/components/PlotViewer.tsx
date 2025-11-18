import { useEffect, useRef } from "react";
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
} from "@/lib/plotly-utils";
import { ErrorDisplay } from "@/components/ui/error-display";

interface PlotViewerProps {
  cas: string;
  type: "ssd" | "ec10eq";
}

export const PlotViewer = ({ cas, type }: PlotViewerProps) => {
  const plotRef = useRef<HTMLDivElement>(null);
  const { plotlyLoaded, Plotly } = usePlotly();

  const endpoint = type === "ssd" 
    ? API_ENDPOINTS.SSD_PLOT(cas)
    : API_ENDPOINTS.EC10EQ_PLOT(cas);
  const title = type === "ssd" 
    ? "Species Sensitivity Distribution (SSD)" 
    : "EC10 Equivalent";

  const { data, isLoading, error } = useQuery({
    queryKey: ["plot", cas, type],
    queryFn: () => apiFetch<PlotlyData>(endpoint),
    enabled: !!cas,
  });

  // Render Plotly chart
  useEffect(() => {
    if (data && plotRef.current && plotlyLoaded && Plotly) {
      try {
        // Vérifier que les données Plotly sont valides
        if (data.data && data.layout) {
          // Nettoyer le graphique existant avant d'en créer un nouveau
          Plotly.purge(plotRef.current);

          // Décoder les traces
          let processedTraces = processPlotlyTraces(data.data || []);
          
          // Pour EC10eq, améliorer les traces pour éviter le chevauchement
          if (type === 'ec10eq') {
            processedTraces = enhanceEC10eqTraces(processedTraces);
          }
          
          // Valider les traces
          const validTraces = validatePlotlyTraces(processedTraces);
          const tracesToRender = validTraces.length > 0 ? validTraces : processedTraces;

          // Créer le layout amélioré
          const enhancedLayout = createEnhancedLayout({
            type,
            originalLayout: data.layout,
          });

          // Créer la configuration
          const plotConfig = createPlotlyConfig(data.config);

          // S'assurer que le conteneur est visible avant de rendre
          if (plotRef.current && plotRef.current.offsetWidth > 0 && plotRef.current.offsetHeight > 0) {
            Plotly.newPlot(plotRef.current, tracesToRender, enhancedLayout, plotConfig)
              .then(() => {
                // Forcer un redraw après un court délai
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
            // Attendre que le conteneur soit prêt
            const containerCheckInterval = setInterval(() => {
              if (plotRef.current && plotRef.current.offsetWidth > 0 && plotRef.current.offsetHeight > 0) {
                clearInterval(containerCheckInterval);
                Plotly.newPlot(plotRef.current, tracesToRender, enhancedLayout, plotConfig)
                  .catch((err: any) => {
                    console.error('[PlotViewer] Error during Plotly.newPlot:', err);
                  });
              }
            }, 100);
            
            // Arrêter après 5 secondes
            setTimeout(() => {
              clearInterval(containerCheckInterval);
            }, 5000);
          }

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
          console.error("[PlotViewer] Invalid Plotly data structure:", data);
        }
      } catch (plotError) {
        console.error("[PlotViewer] Error rendering Plotly chart:", plotError);
      }
    }
  }, [data, plotlyLoaded, Plotly, type]);

  if (error) {
    return (
      <ErrorDisplay 
        error={error} 
        title="Erreur lors du chargement du graphique"
      />
    );
  }

  // Si les données sont chargées mais Plotly n'est pas encore prêt, afficher un skeleton
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
          className={`w-full ${type === 'ec10eq' ? 'h-[600px] md:h-[700px]' : 'h-[500px] md:h-[600px]'}`}
        />
      </CardContent>
    </Card>
  );
};
