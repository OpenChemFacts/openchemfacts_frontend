import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart3, AlertCircle } from "lucide-react";
import { API_ENDPOINTS } from "@/lib/config";
import { apiFetch, ApiError } from "@/lib/api";

interface PlotViewerProps {
  cas: string;
  type: "ssd" | "ec10eq";
}

interface PlotlyData {
  data: any[];
  layout: any;
  config?: any;
}

export const PlotViewer = ({ cas, type }: PlotViewerProps) => {
  const plotRef = useRef<HTMLDivElement>(null);
  const [plotlyLoaded, setPlotlyLoaded] = useState(false);

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
    if (data && plotRef.current && plotlyLoaded && (window as any).Plotly) {
      try {
        console.log('[PlotViewer] Plotly data received:', data);
        console.log('[PlotViewer] Number of traces:', data.data?.length);
        console.log('[PlotViewer] Traces details:', data.data?.map((trace: any) => ({
          name: trace.name,
          type: trace.type,
          mode: trace.mode,
          x_length: trace.x?.length || trace.x?.dtype,
          y_length: trace.y?.length || trace.y?.dtype,
        })));
        
        // Vérifier que les données Plotly sont valides
        if (data.data && data.layout) {
          // Nettoyer le graphique existant avant d'en créer un nouveau
          if (plotRef.current) {
            (window as any).Plotly.purge(plotRef.current);
          }

          // Préserver 100% des éléments du layout original
          // Fusionner intelligemment les améliorations sans écraser les éléments existants
          
          // D'abord, préserver tous les axes secondaires (xaxis2, yaxis2, xaxis3, etc.)
          // avec amélioration de automargin seulement si absent
          const secondaryAxes = Object.keys(data.layout)
            .filter(key => /^(x|y)axis\d+$/.test(key))
            .reduce((acc, key) => {
              acc[key] = {
                ...data.layout[key], // Préserver toutes les valeurs originales
                automargin: data.layout[key]?.automargin ?? true, // Ajouter automargin seulement si absent
              };
              return acc;
            }, {} as any);
          
          // Construire le layout amélioré en préservant TOUS les éléments originaux
          const enhancedLayout = {
            // D'abord, préserver TOUS les éléments du layout original
            ...data.layout,
            
            // Améliorations pour l'affichage (fusionnées avec les valeurs existantes)
            autosize: data.layout.autosize ?? true,
            showlegend: data.layout.showlegend !== false, // Préserver la valeur originale si définie
            
            // Marges : fusionner intelligemment (préserver les valeurs originales, ajouter des défauts si manquantes)
            margin: {
              l: 80,
              r: 120,
              t: 100,
              b: 120,
              pad: 10,
              ...data.layout.margin, // Les valeurs originales écrasent les défauts
            },
            
            // Font : fusionner avec la font existante
            font: {
              size: 12,
              ...data.layout.font, // Les valeurs originales écrasent les défauts
            },
            
            // Axe X principal : préserver toutes les propriétés et améliorer seulement automargin
            xaxis: {
              ...data.layout.xaxis, // D'abord préserver toutes les valeurs originales
              automargin: data.layout.xaxis?.automargin ?? true, // Ajouter automargin seulement si absent
            },
            
            // Axe Y principal : préserver toutes les propriétés et améliorer seulement automargin
            yaxis: {
              ...data.layout.yaxis, // D'abord préserver toutes les valeurs originales
              automargin: data.layout.yaxis?.automargin ?? true, // Ajouter automargin seulement si absent
            },
            
            // Ajouter les axes secondaires préservés
            ...secondaryAxes,
            
            // Légende : fusionner avec la configuration existante
            legend: data.layout.legend ? {
              ...data.layout.legend, // D'abord préserver toutes les valeurs originales
              // Ensuite, ajouter des valeurs par défaut seulement si elles n'existent pas
              orientation: data.layout.legend.orientation ?? 'v',
              x: data.layout.legend.x ?? 1.02,
              y: data.layout.legend.y ?? 1,
              xanchor: data.layout.legend.xanchor ?? 'left',
              yanchor: data.layout.legend.yanchor ?? 'top',
              visible: data.layout.legend.visible !== false,
              font: {
                size: 11, // Valeur par défaut
                ...data.layout.legend.font, // Les valeurs originales écrasent les défauts
              },
            } : {
              // Valeurs par défaut si aucune légende n'est définie
              orientation: 'v',
              x: 1.02,
              y: 1,
              xanchor: 'left',
              yanchor: 'top',
              visible: true,
              font: { size: 11 },
            },
          };

          // Préserver 100% des traces (data) sans modification
          // data.data contient toutes les traces (courbes, scatter, barres, etc.)
          const allTraces = Array.isArray(data.data) ? data.data : [];
          
          // Configuration : fusionner avec la config originale
          const plotConfig = {
            responsive: true,
            displayModeBar: true,
            displaylogo: false,
            modeBarButtonsToRemove: ["lasso2d", "select2d"],
            ...(data.config || {}), // Préserver toutes les options de config originales
          };

          console.log('[PlotViewer] Rendering plot with:', {
            tracesCount: allTraces.length,
            layoutKeys: Object.keys(enhancedLayout),
            hasAnnotations: !!enhancedLayout.annotations,
            hasShapes: !!enhancedLayout.shapes,
            hasImages: !!enhancedLayout.images,
            secondaryAxes: Object.keys(secondaryAxes),
          });

          (window as any).Plotly.newPlot(
            plotRef.current,
            allTraces, // Utiliser toutes les traces sans modification
            enhancedLayout,
            plotConfig
          );

          const resizeHandler = () => {
            if (plotRef.current && (window as any).Plotly) {
              (window as any).Plotly.Plots.resize(plotRef.current);
            }
          };
          window.addEventListener("resize", resizeHandler);
          return () => {
            window.removeEventListener("resize", resizeHandler);
            // Nettoyer le graphique lors du démontage
            if (plotRef.current && (window as any).Plotly) {
              (window as any).Plotly.purge(plotRef.current);
            }
          };
        } else {
          console.error("[PlotViewer] Invalid Plotly data structure:", data);
        }
      } catch (plotError) {
        console.error("[PlotViewer] Error rendering Plotly chart:", plotError);
      }
    }
  }, [data, plotlyLoaded]);

  // Load Plotly dynamically
  useEffect(() => {
    // Vérifier d'abord si Plotly est déjà disponible
    if ((window as any).Plotly) {
      setPlotlyLoaded(true);
      return;
    }

    // Vérifier si le script est déjà en cours de chargement ou déjà chargé
    const existingScript = document.querySelector('script[src="https://cdn.plot.ly/plotly-2.27.0.min.js"]') as HTMLScriptElement | null;
    if (existingScript) {
      // Si le script existe, vérifier s'il est déjà chargé
      if ((window as any).Plotly) {
        setPlotlyLoaded(true);
        return;
      }
      
      // Vérifier si le script est marqué comme chargé
      if (existingScript.getAttribute('data-loaded') === 'true') {
        // Le script est marqué comme chargé, vérifier Plotly
        if ((window as any).Plotly) {
          setPlotlyLoaded(true);
        } else {
          // Attendre un peu au cas où Plotly se charge juste après
          const checkInterval = setInterval(() => {
            if ((window as any).Plotly) {
              setPlotlyLoaded(true);
              clearInterval(checkInterval);
            }
          }, 50);
          
          // Arrêter après 2 secondes si Plotly ne se charge pas
          const timeoutId = setTimeout(() => {
            clearInterval(checkInterval);
          }, 2000);
          
          return () => {
            clearInterval(checkInterval);
            clearTimeout(timeoutId);
          };
        }
        return;
      }
      
      // Le script est en cours de chargement, attendre l'événement load
      const handleLoad = () => {
        existingScript.setAttribute('data-loaded', 'true');
        setPlotlyLoaded(true);
      };
      
      existingScript.addEventListener('load', handleLoad);
      return () => {
        existingScript.removeEventListener('load', handleLoad);
      };
    }

    // Créer et charger le script si aucun script n'existe
    const script = document.createElement("script");
    script.src = "https://cdn.plot.ly/plotly-2.27.0.min.js";
    script.async = true;
    script.onload = () => {
      script.setAttribute('data-loaded', 'true');
      setPlotlyLoaded(true);
    };
    script.onerror = () => {
      console.error("[PlotViewer] Failed to load Plotly script");
    };
    document.body.appendChild(script);

    return () => {
      // Nettoyer le graphique lors du démontage
      if (plotRef.current && (window as any).Plotly) {
        (window as any).Plotly.purge(plotRef.current);
      }
    };
  }, []);

  if (isLoading) {
    return (
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-96 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    const errorMessage = error instanceof ApiError 
      ? error.message 
      : "Erreur lors du chargement du graphique";
    const isNotFound = error instanceof ApiError && error.status === 404;
    
    return (
      <Card className="shadow-card border-destructive">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            <div>
              <p className="font-semibold">
                {isNotFound ? "Graphique non disponible" : "Erreur"}
              </p>
              <p className="text-sm text-muted-foreground">{errorMessage}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Si les données sont chargées mais Plotly n'est pas encore prêt, afficher un skeleton
  if (data && !plotlyLoaded) {
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
        <div ref={plotRef} className="w-full h-[500px] md:h-[600px]" />
      </CardContent>
    </Card>
  );
};
