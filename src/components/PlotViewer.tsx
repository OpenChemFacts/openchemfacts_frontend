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

// Fonction pour décoder les données numpy/base64 en tableaux JavaScript
const decodeNumpyData = (data: any): any[] => {
  if (!data || typeof data !== 'object') return data;
  
  // Si c'est un objet avec dtype et bdata, décoder
  if (data.dtype && data.bdata) {
    try {
      const binaryString = atob(data.bdata);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const float64Array = new Float64Array(bytes.buffer);
      return Array.from(float64Array);
    } catch (e) {
      console.error('[PlotViewer] Error decoding numpy data:', e);
      return [];
    }
  }
  
  return data;
};

// Fonction récursive pour traiter toutes les traces
const processPlotlyTraces = (traces: any[]): any[] => {
  if (!Array.isArray(traces)) return traces;
  
  return traces.map(trace => {
    const processedTrace = { ...trace };
    
    // Décoder x et y si nécessaire
    if (trace.x) {
      processedTrace.x = decodeNumpyData(trace.x);
    }
    if (trace.y) {
      processedTrace.y = decodeNumpyData(trace.y);
    }
    // Décoder z pour les graphiques 3D si nécessaire
    if (trace.z) {
      processedTrace.z = decodeNumpyData(trace.z);
    }
    // Décoder d'autres propriétés qui pourraient contenir des données numpy
    if (trace.customdata) {
      processedTrace.customdata = decodeNumpyData(trace.customdata);
    }
    if (trace.text) {
      // text peut être un tableau, vérifier s'il contient des données numpy
      if (Array.isArray(trace.text)) {
        processedTrace.text = trace.text.map((item: any) => decodeNumpyData(item));
      } else {
        processedTrace.text = decodeNumpyData(trace.text);
      }
    }
    
    return processedTrace;
  });
};

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
        console.log('[PlotViewer] Traces details (before decoding):', data.data?.map((trace: any) => ({
          name: trace.name,
          type: trace.type,
          mode: trace.mode,
          x_length: trace.x?.length || trace.x?.dtype,
          y_length: trace.y?.length || trace.y?.dtype,
          x_is_numpy: trace.x?.dtype && trace.x?.bdata ? true : false,
          y_is_numpy: trace.y?.dtype && trace.y?.bdata ? true : false,
        })));
        
        // Vérifier que les données Plotly sont valides
        if (data.data && data.layout) {
          // Nettoyer le graphique existant avant d'en créer un nouveau
          if (plotRef.current) {
            (window as any).Plotly.purge(plotRef.current);
          }
          
          // Décoder les données numpy/base64 avant de les utiliser
          const processedTraces = processPlotlyTraces(data.data || []);
          
          console.log('[PlotViewer] Traces details (after decoding):', processedTraces.map((trace: any) => ({
            name: trace.name,
            type: trace.type,
            mode: trace.mode,
            x_length: Array.isArray(trace.x) ? trace.x.length : 'not array',
            y_length: Array.isArray(trace.y) ? trace.y.length : 'not array',
          })));

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
          // IMPORTANT: Commencer par une copie profonde du layout original pour éviter d'écraser des propriétés
          // Pour EC10eq, augmenter les marges pour éviter le chevauchement des points
          const isEC10eq = type === 'ec10eq';
          const baseMargin = isEC10eq 
            ? { l: 100, r: 150, t: 120, b: 200, pad: 15 } // Marges plus grandes pour EC10eq
            : { l: 80, r: 120, t: 100, b: 120, pad: 10 }; // Marges normales pour SSD
          
          const enhancedLayout = {
            // D'abord, préserver TOUS les éléments du layout original
            ...data.layout,
            
            // Améliorations pour l'affichage (fusionnées avec les valeurs existantes)
            autosize: data.layout.autosize ?? true,
            showlegend: data.layout.showlegend !== false, // Préserver la valeur originale si définie
            
            // Marges : fusionner intelligemment (préserver les valeurs originales, ajouter des défauts si manquantes)
            margin: data.layout.margin ? {
              ...baseMargin,
              ...data.layout.margin, // Les valeurs originales écrasent les défauts
            } : baseMargin,
            
            // Font : fusionner avec la font existante
            font: data.layout.font ? {
              size: 12,
              ...data.layout.font, // Les valeurs originales écrasent les défauts
            } : {
              size: 12,
            },
            
            // Axe X principal : préserver toutes les propriétés et améliorer seulement automargin
            xaxis: data.layout.xaxis ? {
              ...data.layout.xaxis, // D'abord préserver toutes les valeurs originales
              automargin: data.layout.xaxis.automargin ?? true, // Ajouter automargin seulement si absent
              // Pour EC10eq, améliorer l'affichage des catégories
              ...(isEC10eq ? {
                tickangle: data.layout.xaxis.tickangle ?? -45, // Incliner les labels à -45° par défaut
                tickfont: {
                  size: data.layout.xaxis.tickfont?.size ?? 10,
                  ...data.layout.xaxis.tickfont,
                },
                // Augmenter l'espacement entre les catégories
                categoryorder: data.layout.xaxis.categoryorder || 'category ascending',
                categoryarray: data.layout.xaxis.categoryarray,
              } : {}),
            } : {
              automargin: true,
              ...(isEC10eq ? {
                tickangle: -45,
                tickfont: { size: 10 },
              } : {}),
            },
            
            // Axe Y principal : préserver toutes les propriétés et améliorer seulement automargin
            yaxis: data.layout.yaxis ? {
              ...data.layout.yaxis, // D'abord préserver toutes les valeurs originales
              automargin: data.layout.yaxis.automargin ?? true, // Ajouter automargin seulement si absent
            } : {
              automargin: true,
            },
            
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
              font: data.layout.legend.font ? {
                size: 11, // Valeur par défaut
                ...data.layout.legend.font, // Les valeurs originales écrasent les défauts
              } : {
                size: 11,
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
          
          // Ajouter les axes secondaires APRÈS avoir défini xaxis et yaxis pour éviter les conflits
          Object.assign(enhancedLayout, secondaryAxes);

          // Utiliser les traces décodées (déjà traitées par processPlotlyTraces)
          let allTraces = processedTraces;
          
          // Pour EC10eq, améliorer les traces pour éviter le chevauchement
          if (isEC10eq) {
            allTraces = allTraces.map((trace: any) => {
              // Si c'est un scatter plot, ajouter des propriétés pour améliorer la visibilité
              if (trace.type === 'scatter' || !trace.type) {
                return {
                  ...trace,
                  // Réduire légèrement la taille des points si beaucoup de données
                  marker: {
                    ...trace.marker,
                    size: trace.marker?.size ? Math.min(trace.marker.size, 8) : 6, // Limiter la taille max
                    opacity: trace.marker?.opacity ?? 0.7, // Légère transparence pour voir les chevauchements
                    line: trace.marker?.line || {
                      width: 0.5,
                      color: 'white',
                    },
                  },
                  // Ajouter un jitter si beaucoup de points se chevauchent
                  // (Plotly gère cela automatiquement avec le mode 'markers')
                  mode: trace.mode || 'markers',
                };
              }
              return trace;
            });
          }
          
          // Vérifier que les traces ont bien des données (après décodage)
          const validTraces = allTraces.filter(trace => {
            // Une trace est valide si elle a au moins x ou y défini et que ce sont des tableaux
            const hasX = trace.x !== undefined && trace.x !== null && Array.isArray(trace.x) && trace.x.length > 0;
            const hasY = trace.y !== undefined && trace.y !== null && Array.isArray(trace.y) && trace.y.length > 0;
            const hasZ = trace.z !== undefined && trace.z !== null && Array.isArray(trace.z) && trace.z.length > 0;
            const hasData = hasX || hasY || hasZ;
            
            if (!hasData) {
              console.warn('[PlotViewer] Trace sans données valides:', {
                name: trace.name,
                type: trace.type,
                x: trace.x,
                y: trace.y,
                z: trace.z,
              });
            }
            return hasData;
          });
          
          if (validTraces.length === 0 && allTraces.length > 0) {
            console.error('[PlotViewer] Aucune trace valide trouvée parmi', allTraces.length, 'traces après décodage');
            console.error('[PlotViewer] Détails des traces invalides:', allTraces.map((t: any) => ({
              name: t.name,
              type: t.type,
              x_type: typeof t.x,
              x_is_array: Array.isArray(t.x),
              y_type: typeof t.y,
              y_is_array: Array.isArray(t.y),
            })));
          }
          
          // Configuration : fusionner avec la config originale
          const plotConfig = {
            responsive: true,
            displayModeBar: true,
            displaylogo: false,
            modeBarButtonsToRemove: ["lasso2d", "select2d"],
            ...(data.config || {}), // Préserver toutes les options de config originales
          };

          console.log('[PlotViewer] Rendering plot with:', {
            totalTraces: allTraces.length,
            validTraces: validTraces.length,
            layoutKeys: Object.keys(enhancedLayout),
            hasAnnotations: !!enhancedLayout.annotations,
            hasShapes: !!enhancedLayout.shapes,
            hasImages: !!enhancedLayout.images,
            secondaryAxes: Object.keys(secondaryAxes),
            traceTypes: allTraces.map((t: any) => t.type || 'unknown'),
            traceModes: allTraces.map((t: any) => t.mode || 'none'),
          });
          
          // Utiliser les traces valides, ou toutes les traces si aucune n'est marquée invalide
          const tracesToRender = validTraces.length > 0 ? validTraces : allTraces;

          // S'assurer que le conteneur est visible avant de rendre
          let containerCheckInterval: ReturnType<typeof setInterval> | null = null;
          
          if (plotRef.current && plotRef.current.offsetWidth > 0 && plotRef.current.offsetHeight > 0) {
            (window as any).Plotly.newPlot(
              plotRef.current,
              tracesToRender, // Utiliser les traces valides
              enhancedLayout,
              plotConfig
            ).then(() => {
              console.log('[PlotViewer] Plot rendered successfully');
              // Forcer un redraw après un court délai pour s'assurer que tout est affiché
              setTimeout(() => {
                if (plotRef.current && (window as any).Plotly) {
                  (window as any).Plotly.Plots.resize(plotRef.current);
                }
              }, 100);
            }).catch((err: any) => {
              console.error('[PlotViewer] Error during Plotly.newPlot:', err);
            });
          } else {
            console.warn('[PlotViewer] Container not ready, waiting...');
            // Attendre que le conteneur soit prêt
            containerCheckInterval = setInterval(() => {
              if (plotRef.current && plotRef.current.offsetWidth > 0 && plotRef.current.offsetHeight > 0) {
                if (containerCheckInterval) {
                  clearInterval(containerCheckInterval);
                  containerCheckInterval = null;
                }
                (window as any).Plotly.newPlot(
                  plotRef.current,
                  tracesToRender,
                  enhancedLayout,
                  plotConfig
                ).then(() => {
                  console.log('[PlotViewer] Plot rendered successfully after wait');
                }).catch((err: any) => {
                  console.error('[PlotViewer] Error during Plotly.newPlot:', err);
                });
              }
            }, 100);
            
            // Arrêter après 5 secondes
            setTimeout(() => {
              if (containerCheckInterval) {
                clearInterval(containerCheckInterval);
                containerCheckInterval = null;
              }
            }, 5000);
          }

          const resizeHandler = () => {
            if (plotRef.current && (window as any).Plotly) {
              (window as any).Plotly.Plots.resize(plotRef.current);
            }
          };
          window.addEventListener("resize", resizeHandler);
          return () => {
            window.removeEventListener("resize", resizeHandler);
            // Nettoyer l'intervalle de vérification du conteneur
            if (containerCheckInterval) {
              clearInterval(containerCheckInterval);
            }
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
        <div 
          ref={plotRef} 
          className={`w-full ${type === 'ec10eq' ? 'h-[600px] md:h-[700px]' : 'h-[500px] md:h-[600px]'}`}
        />
      </CardContent>
    </Card>
  );
};
