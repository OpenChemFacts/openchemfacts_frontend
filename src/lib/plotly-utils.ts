/**
 * Utilitaires pour la manipulation des données Plotly
 * Mutualise les fonctions de décodage numpy et de traitement des layouts
 */

export interface PlotlyData {
  data: any[];
  layout: any;
  config?: any;
}

/**
 * Décode les données numpy/base64 en tableaux JavaScript
 * @param data - Les données à décoder (peuvent être numpy/base64 ou déjà décodées)
 * @returns Les données décodées sous forme de tableau
 */
export const decodeNumpyData = (data: any): any[] => {
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
      console.error('[plotly-utils] Error decoding numpy data:', e);
      return [];
    }
  }
  
  return data;
};

/**
 * Traite récursivement toutes les traces Plotly pour décoder les données numpy
 * @param traces - Les traces Plotly à traiter
 * @returns Les traces avec les données décodées
 */
export const processPlotlyTraces = (traces: any[]): any[] => {
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

/**
 * Options pour la création du layout Plotly amélioré
 */
export interface EnhancedLayoutOptions {
  /** Type de graphique pour adapter les marges */
  type?: 'ssd' | 'ec10eq' | 'comparison';
  /** Layout original à améliorer */
  originalLayout: any;
}

/**
 * Crée un layout Plotly amélioré en préservant toutes les propriétés originales
 * @param options - Options pour la création du layout
 * @returns Le layout amélioré
 */
export const createEnhancedLayout = (options: EnhancedLayoutOptions): any => {
  const { type = 'ssd', originalLayout } = options;
  
  // Marges de base selon le type
  const baseMargin = type === 'ec10eq'
    ? { l: 100, r: 150, t: 120, b: 200, pad: 15 }
    : type === 'comparison'
    ? { l: 60, r: 100, t: 120, b: 80, pad: 10 }
    : { l: 80, r: 120, t: 100, b: 120, pad: 10 };
  
  // Préserver tous les axes secondaires (xaxis2, yaxis2, xaxis3, etc.)
  const secondaryAxes = Object.keys(originalLayout)
    .filter(key => /^(x|y)axis\d+$/.test(key))
    .reduce((acc, key) => {
      acc[key] = {
        ...originalLayout[key],
        automargin: originalLayout[key]?.automargin ?? true,
      };
      return acc;
    }, {} as any);
  
  // Construire le layout amélioré
  const enhancedLayout = {
    // Préserver TOUS les éléments du layout original
    ...originalLayout,
    
    // Améliorations pour l'affichage
    autosize: originalLayout.autosize ?? true,
    showlegend: originalLayout.showlegend !== false,
    
    // Retirer les dimensions fixes pour permettre l'adaptation automatique
    width: undefined,
    height: undefined,
    
    // Marges optimisées
    margin: originalLayout.margin
      ? { ...baseMargin, ...originalLayout.margin }
      : baseMargin,
    
    // Font
    font: originalLayout.font
      ? { size: 12, ...originalLayout.font }
      : { size: 12 },
    
    // Axe X principal
    xaxis: originalLayout.xaxis
      ? {
          ...originalLayout.xaxis,
          automargin: originalLayout.xaxis.automargin ?? true,
          ...(type === 'ec10eq'
            ? {
                tickangle: originalLayout.xaxis.tickangle ?? -45,
                tickfont: {
                  size: originalLayout.xaxis.tickfont?.size ?? 10,
                  ...originalLayout.xaxis.tickfont,
                },
                categoryorder: originalLayout.xaxis.categoryorder || 'category ascending',
                categoryarray: originalLayout.xaxis.categoryarray,
              }
            : {}),
        }
      : {
          automargin: true,
          ...(type === 'ec10eq' ? { tickangle: -45, tickfont: { size: 10 } } : {}),
        },
    
    // Axe Y principal
    yaxis: originalLayout.yaxis
      ? {
          ...originalLayout.yaxis,
          automargin: originalLayout.yaxis.automargin ?? true,
        }
      : {
          automargin: true,
        },
    
    // Légende
    legend: originalLayout.legend
      ? {
          ...originalLayout.legend,
          orientation: originalLayout.legend.orientation ?? 'v',
          x: originalLayout.legend.x ?? 1.02,
          y: originalLayout.legend.y ?? 1,
          xanchor: originalLayout.legend.xanchor ?? 'left',
          yanchor: originalLayout.legend.yanchor ?? 'top',
          visible: originalLayout.legend.visible !== false,
          font: originalLayout.legend.font
            ? { size: 11, ...originalLayout.legend.font }
            : { size: 11 },
        }
      : {
          orientation: 'v',
          x: 1.02,
          y: 1,
          xanchor: 'left',
          yanchor: 'top',
          visible: true,
          font: { size: 11 },
        },
    
    // Ajouter les axes secondaires
    ...secondaryAxes,
  };
  
  return enhancedLayout;
};

/**
 * Crée la configuration Plotly par défaut
 * @param customConfig - Configuration personnalisée à fusionner
 * @returns La configuration Plotly
 */
export const createPlotlyConfig = (customConfig?: any) => {
  return {
    responsive: true,
    displayModeBar: true,
    displaylogo: false,
    modeBarButtonsToRemove: ["lasso2d", "select2d"],
    ...(customConfig || {}),
  };
};

/**
 * Valide et filtre les traces Plotly pour ne garder que celles avec des données valides
 * @param traces - Les traces à valider
 * @returns Les traces valides
 */
export const validatePlotlyTraces = (traces: any[]): any[] => {
  return traces.filter(trace => {
    const hasX = trace.x !== undefined && trace.x !== null && Array.isArray(trace.x) && trace.x.length > 0;
    const hasY = trace.y !== undefined && trace.y !== null && Array.isArray(trace.y) && trace.y.length > 0;
    const hasZ = trace.z !== undefined && trace.z !== null && Array.isArray(trace.z) && trace.z.length > 0;
    const hasData = hasX || hasY || hasZ;
    
    if (!hasData) {
      console.warn('[plotly-utils] Trace sans données valides:', {
        name: trace.name,
        type: trace.type,
        x: trace.x,
        y: trace.y,
        z: trace.z,
      });
    }
    return hasData;
  });
};

/**
 * Améliore les traces pour EC10eq (réduit la taille des points, ajoute de la transparence)
 * @param traces - Les traces à améliorer
 * @returns Les traces améliorées
 */
export const enhanceEC10eqTraces = (traces: any[]): any[] => {
  return traces.map((trace: any) => {
    if (trace.type === 'scatter' || !trace.type) {
      return {
        ...trace,
        marker: {
          ...trace.marker,
          size: trace.marker?.size ? Math.min(trace.marker.size, 8) : 6,
          opacity: trace.marker?.opacity ?? 0.7,
          line: trace.marker?.line || {
            width: 0.5,
            color: 'white',
          },
        },
        mode: trace.mode || 'markers',
      };
    }
    return trace;
  });
};

