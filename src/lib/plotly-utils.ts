/**
 * Utilities for manipulating Plotly data
 * Shares numpy decoding and layout processing functions
 */

export interface PlotlyData {
  data: any[];
  layout: any;
  config?: any;
}

/**
 * Decodes numpy/base64 data into JavaScript arrays
 * @param data - The data to decode (can be numpy/base64 or already decoded)
 * @returns The decoded data as an array
 */
export const decodeNumpyData = (data: any): any[] => {
  if (!data || typeof data !== 'object') return data;
  
  // If it's an object with dtype and bdata, decode
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
 * Recursively processes all Plotly traces to decode numpy data
 * @param traces - The Plotly traces to process
 * @returns The traces with decoded data
 */
export const processPlotlyTraces = (traces: any[]): any[] => {
  if (!Array.isArray(traces)) return traces;
  
  return traces.map(trace => {
    const processedTrace = { ...trace };
    
    // Decode x and y if necessary
    if (trace.x) {
      processedTrace.x = decodeNumpyData(trace.x);
    }
    if (trace.y) {
      processedTrace.y = decodeNumpyData(trace.y);
    }
    // Decode z for 3D charts if necessary
    if (trace.z) {
      processedTrace.z = decodeNumpyData(trace.z);
    }
    // Decode other properties that might contain numpy data
    if (trace.customdata) {
      processedTrace.customdata = decodeNumpyData(trace.customdata);
    }
    if (trace.text) {
      // text can be an array, check if it contains numpy data
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
 * Options for creating an enhanced Plotly layout
 */
export interface EnhancedLayoutOptions {
  /** Chart type to adapt margins */
  type?: 'ssd' | 'ec10eq' | 'comparison';
  /** Original layout to enhance */
  originalLayout: any;
}

/**
 * Creates an enhanced Plotly layout while preserving all original properties
 * @param options - Options for creating the layout
 * @returns The enhanced layout
 */
export const createEnhancedLayout = (options: EnhancedLayoutOptions): any => {
  const { type = 'ssd', originalLayout } = options;
  
  // Base margins according to type
  const baseMargin = type === 'ec10eq'
    ? { l: 100, r: 150, t: 120, b: 200, pad: 15 }
    : type === 'comparison'
    ? { l: 60, r: 100, t: 120, b: 80, pad: 10 }
    : { l: 80, r: 120, t: 100, b: 120, pad: 10 };
  
  // Preserve all secondary axes (xaxis2, yaxis2, xaxis3, etc.)
  const secondaryAxes = Object.keys(originalLayout)
    .filter(key => /^(x|y)axis\d+$/.test(key))
    .reduce((acc, key) => {
      acc[key] = {
        ...originalLayout[key],
        automargin: originalLayout[key]?.automargin ?? true,
      };
      return acc;
    }, {} as any);
  
  // Build the enhanced layout
  const enhancedLayout = {
    // Preserve ALL elements from the original layout
    ...originalLayout,
    
    // Display improvements
    autosize: originalLayout.autosize ?? true,
    showlegend: originalLayout.showlegend !== false,
    
    // Remove fixed dimensions to allow automatic adaptation
    width: undefined,
    height: undefined,
    
    // Optimized margins
    margin: originalLayout.margin
      ? { ...baseMargin, ...originalLayout.margin }
      : baseMargin,
    
    // Font
    font: originalLayout.font
      ? { size: 12, ...originalLayout.font }
      : { size: 12 },
    
    // Main X axis
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
    
    // Main Y axis
    yaxis: originalLayout.yaxis
      ? {
          ...originalLayout.yaxis,
          automargin: originalLayout.yaxis.automargin ?? true,
        }
      : {
          automargin: true,
        },
    
    // Legend
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
 * Creates the default Plotly configuration
 * @param customConfig - Custom configuration to merge
 * @returns The Plotly configuration
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
 * Validates and filters Plotly traces to keep only those with valid data
 * @param traces - The traces to validate
 * @returns The valid traces
 */
export const validatePlotlyTraces = (traces: any[]): any[] => {
  return traces.filter(trace => {
    const hasX = trace.x !== undefined && trace.x !== null && Array.isArray(trace.x) && trace.x.length > 0;
    const hasY = trace.y !== undefined && trace.y !== null && Array.isArray(trace.y) && trace.y.length > 0;
    const hasZ = trace.z !== undefined && trace.z !== null && Array.isArray(trace.z) && trace.z.length > 0;
    const hasData = hasX || hasY || hasZ;
    
    if (!hasData) {
      console.warn('[plotly-utils] Trace without valid data:', {
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
 * Enhances traces for EC10eq (reduces point size, adds transparency)
 * @param traces - The traces to enhance
 * @returns The enhanced traces
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

