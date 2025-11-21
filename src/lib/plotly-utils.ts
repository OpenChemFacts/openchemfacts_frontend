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
 * Preserves backend optimizations while ensuring data is properly decoded
 * @param traces - The Plotly traces to process
 * @returns The traces with decoded data
 */
export const processPlotlyTraces = (traces: any[]): any[] => {
  if (!Array.isArray(traces)) return traces;
  
  return traces.map(trace => {
    // Preserve all trace properties from backend
    const processedTrace = { ...trace };
    
    // Decode numpy/base64 data if present (backend may have optimized this)
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
    
    // Ensure accessibility: add hoverinfo if not present
    if (!processedTrace.hoverinfo && processedTrace.type !== 'scattergl') {
      processedTrace.hoverinfo = 'x+y';
    }
    
    // Ensure line/marker visibility for better UX
    if (processedTrace.type === 'scatter' && !processedTrace.mode) {
      // If no mode specified, use 'lines+markers' for better visibility
      processedTrace.mode = 'lines+markers';
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
  /** Whether dark mode is active */
  isDarkMode?: boolean;
}

/**
 * Detects if dark mode is active
 * @returns true if dark mode is active
 */
export const isDarkMode = (): boolean => {
  if (typeof window === 'undefined') return false;
  return document.documentElement.classList.contains('dark') ||
         document.body.classList.contains('dark') ||
         window.matchMedia('(prefers-color-scheme: dark)').matches;
};

/**
 * Gets theme colors for Plotly based on dark/light mode
 * NOTE: Graphs always use light background for better readability
 * @param dark - Whether dark mode is active (used for font colors only)
 * @returns Theme colors object
 */
export const getPlotlyThemeColors = (dark: boolean) => {
  // Always use light background for graphs
  const lightBackground = 'hsl(0, 0%, 100%)';
  const lightGridColor = 'hsl(220, 13%, 91%)';
  
  if (dark) {
    return {
      paper_bgcolor: lightBackground,     // Always light background
      plot_bgcolor: lightBackground,      // Always light background
      font: { color: 'hsl(220, 15%, 20%)' }, // Dark text for contrast on light bg
      gridcolor: lightGridColor,           // Light grid
      linecolor: lightGridColor,           // Light lines
    };
  } else {
    return {
      paper_bgcolor: lightBackground,      // Light background
      plot_bgcolor: lightBackground,       // Light background
      font: { color: 'hsl(220, 15%, 20%)' }, // Dark text
      gridcolor: lightGridColor,           // Light grid
      linecolor: lightGridColor,           // Light lines
    };
  }
};

/**
 * Creates an enhanced Plotly layout while preserving all original properties
 * Respects backend optimizations and applies frontend UI improvements
 * @param options - Options for creating the layout
 * @returns The enhanced layout
 */
export const createEnhancedLayout = (options: EnhancedLayoutOptions): any => {
  const { type = 'ssd', originalLayout } = options;
  const dark = options.isDarkMode ?? isDarkMode();
  const themeColors = getPlotlyThemeColors(dark);
  
  // Base margins according to type - only used if backend doesn't provide margins
  // Backend may have optimized margins, so we respect them if present
  const defaultMargins = type === 'ec10eq'
    ? { l: 100, r: 180, t: 120, b: 200, pad: 15 }
    : type === 'comparison'
    ? { l: 60, r: 140, t: 120, b: 80, pad: 10 }
    : { l: 80, r: 160, t: 100, b: 120, pad: 10 };
  
  // Use backend margins if provided, otherwise use defaults
  // Merge to ensure minimum right margin for legend spacing
  const backendMargin = originalLayout.margin || {};
  const finalMargin = {
    ...defaultMargins,
    ...backendMargin,
    // Ensure minimum right margin to prevent legend overlap
    r: Math.max(backendMargin.r || defaultMargins.r, defaultMargins.r),
  };
  
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
  
  // Filter out invalid properties from legend BEFORE building the layout
  // This prevents invalid properties like 'xshift' from being propagated
  const validLegendProps = [
    'bgcolor', 'bordercolor', 'borderwidth', 'entrywidth', 'entrywidthmode',
    'font', 'groupclick', 'grouptitlefont', 'indentation', 'itemclick',
    'itemdoubleclick', 'itemsizing', 'itemwidth', 'maxheight', 'orientation',
    'title', 'tracegroupgap', 'traceorder', 'uirevision', 'valign',
    'visible', 'x', 'xanchor', 'xref', 'y', 'yanchor', 'yref'
  ];
  
  // Create a clean copy of originalLayout without invalid legend properties
  const cleanOriginalLayout = { ...originalLayout };
  if (cleanOriginalLayout.legend) {
    cleanOriginalLayout.legend = Object.keys(cleanOriginalLayout.legend)
      .filter(key => validLegendProps.includes(key))
      .reduce((acc, key) => {
        acc[key] = cleanOriginalLayout.legend[key];
        return acc;
      }, {} as any);
  }
  
  // Build the enhanced layout
  // Priority: Backend optimizations > Frontend UI improvements
  const enhancedLayout = {
    // Preserve ALL elements from the original layout (backend optimizations)
    // Use cleanOriginalLayout to avoid propagating invalid properties
    ...cleanOriginalLayout,
    
    // Theme colors - always use light background for readability
    // Override backend colors to ensure consistent UI
    paper_bgcolor: themeColors.paper_bgcolor,
    plot_bgcolor: themeColors.plot_bgcolor,
    
    // Display improvements - respect backend settings but ensure good defaults
    autosize: originalLayout.autosize !== false, // Default to true unless explicitly false
    showlegend: originalLayout.showlegend !== false,
    
    // Remove fixed dimensions to allow automatic adaptation and responsiveness
    width: undefined,
    height: undefined,
    
    // Use merged margins that respect backend optimizations
    margin: finalMargin,
    
    // Font - merge with theme font color while preserving backend font settings
    font: originalLayout.font
      ? { 
          ...originalLayout.font,
          size: originalLayout.font.size || 12, 
          color: themeColors.font.color, // Always use theme color for consistency
        }
      : { size: 12, color: themeColors.font.color },
    
    // Main X axis - preserve backend optimizations, apply UI improvements
    xaxis: originalLayout.xaxis
      ? {
          ...originalLayout.xaxis, // Preserve all backend settings
          // Ensure automargin for responsive behavior
          automargin: originalLayout.xaxis.automargin !== false,
          // Apply theme colors while preserving backend grid/line styles
          gridcolor: themeColors.gridcolor,
          linecolor: themeColors.linecolor,
          // Merge tickfont settings
          tickfont: {
            ...originalLayout.xaxis.tickfont,
            color: themeColors.font.color, // Always use theme color
            size: originalLayout.xaxis.tickfont?.size || 12,
          },
          // Type-specific enhancements
          ...(type === 'ec10eq'
            ? {
                tickangle: originalLayout.xaxis.tickangle ?? -45,
                tickfont: {
                  ...originalLayout.xaxis.tickfont,
                  size: originalLayout.xaxis.tickfont?.size ?? 10,
                  color: themeColors.font.color,
                },
                // Preserve backend category settings
                categoryorder: originalLayout.xaxis.categoryorder || 'category ascending',
                categoryarray: originalLayout.xaxis.categoryarray,
              }
            : {}),
        }
      : {
          automargin: true,
          gridcolor: themeColors.gridcolor,
          linecolor: themeColors.linecolor,
          tickfont: { color: themeColors.font.color, size: 12 },
          ...(type === 'ec10eq' ? { 
            tickangle: -45, 
            tickfont: { size: 10, color: themeColors.font.color } 
          } : {}),
        },
    
    // Main Y axis - preserve backend optimizations, apply UI improvements
    yaxis: originalLayout.yaxis
      ? {
          ...originalLayout.yaxis, // Preserve all backend settings
          automargin: originalLayout.yaxis.automargin !== false,
          gridcolor: themeColors.gridcolor,
          linecolor: themeColors.linecolor,
          tickfont: {
            ...originalLayout.yaxis.tickfont,
            color: themeColors.font.color, // Always use theme color
            size: originalLayout.yaxis.tickfont?.size || 12,
          },
        }
      : {
          automargin: true,
          gridcolor: themeColors.gridcolor,
          linecolor: themeColors.linecolor,
          tickfont: { color: themeColors.font.color, size: 12 },
        },
    
    // Legend - respect backend positioning but ensure no overlap with x-axis
    // Invalid properties have already been filtered in cleanOriginalLayout
    legend: cleanOriginalLayout.legend
      ? {
          // Use the already-filtered legend from cleanOriginalLayout
          ...cleanOriginalLayout.legend,
          orientation: cleanOriginalLayout.legend.orientation ?? 'v',
          // Use backend position if provided, otherwise use safe defaults
          // Ensure x position is far enough right to avoid x-axis labels
          x: cleanOriginalLayout.legend.x !== undefined 
            ? Math.max(cleanOriginalLayout.legend.x, type === 'comparison' ? 1.02 : 1.05)
            : (type === 'comparison' ? 1.05 : 1.08),
          y: cleanOriginalLayout.legend.y ?? (type === 'comparison' ? 0.98 : 1),
          xanchor: cleanOriginalLayout.legend.xanchor ?? 'left',
          yanchor: cleanOriginalLayout.legend.yanchor ?? 'top',
          visible: cleanOriginalLayout.legend.visible !== false,
          // Use transparent background for cleaner look
          bgcolor: cleanOriginalLayout.legend.bgcolor ?? 'rgba(0,0,0,0)',
          bordercolor: cleanOriginalLayout.legend.bordercolor ?? themeColors.linecolor,
          // Apply theme font color
          font: {
            ...cleanOriginalLayout.legend.font,
            color: themeColors.font.color,
            size: cleanOriginalLayout.legend.font?.size || 11,
          },
        }
      : {
          orientation: 'v',
          x: type === 'comparison' ? 1.05 : 1.08,
          y: type === 'comparison' ? 0.98 : 1,
          xanchor: 'left',
          yanchor: 'top',
          visible: true,
          bgcolor: 'rgba(0,0,0,0)',
          bordercolor: themeColors.linecolor,
          font: { size: 11, color: themeColors.font.color },
        },
    
    // Ajouter les axes secondaires
    ...secondaryAxes,
  };
  
  return enhancedLayout;
};

/**
 * Creates the default Plotly configuration with UI best practices
 * Respects backend config while applying frontend optimizations
 * @param customConfig - Custom configuration from backend to merge
 * @returns The Plotly configuration
 */
export const createPlotlyConfig = (customConfig?: any) => {
  return {
    // Preserve backend config first
    ...(customConfig || {}),
    // Override with our UI best practices
    responsive: true, // Responsive design - essential for mobile/tablet
    displayModeBar: true, // Show mode bar for user interaction (zoom, pan, etc.)
    displaylogo: false, // Remove Plotly logo for cleaner UI
    modeBarButtonsToRemove: ["lasso2d", "select2d"], // Remove tools that are less useful for scientific charts
  };
};

/**
 * Validates and filters Plotly traces to keep only those with valid data
 * Backend should send valid traces, but we validate for safety
 * @param traces - The traces to validate
 * @returns The valid traces
 */
export const validatePlotlyTraces = (traces: any[]): any[] => {
  if (!Array.isArray(traces) || traces.length === 0) {
    console.warn('[plotly-utils] No traces provided or empty array');
    return [];
  }
  
  const validTraces = traces.filter(trace => {
    // Check for valid data arrays
    const hasX = trace.x !== undefined && trace.x !== null && Array.isArray(trace.x) && trace.x.length > 0;
    const hasY = trace.y !== undefined && trace.y !== null && Array.isArray(trace.y) && trace.y.length > 0;
    const hasZ = trace.z !== undefined && trace.z !== null && Array.isArray(trace.z) && trace.z.length > 0;
    const hasData = hasX || hasY || hasZ;
    
    if (!hasData) {
      console.warn('[plotly-utils] Trace without valid data (filtered out):', {
        name: trace.name || 'unnamed',
        type: trace.type || 'unknown',
        hasX: !!hasX,
        hasY: !!hasY,
        hasZ: !!hasZ,
      });
    }
    return hasData;
  });
  
  if (validTraces.length === 0 && traces.length > 0) {
    console.error('[plotly-utils] All traces were invalid!');
  }
  
  return validTraces;
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

