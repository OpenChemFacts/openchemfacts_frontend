/**
 * Utilities for creating SSD (Species Sensitivity Distribution) plots from JSON data
 * Converts API JSON response to Plotly format
 */

import { PlotlyData } from "./plotly-utils";

/**
 * Interface for SSD data from the API
 */
export interface SSDData {
  cas_number: string;
  chemical_name: string;
  ssd_parameters: {
    mu_logEC10eq: number;
    sigma_logEC10eq: number;
    hc20_mgL: number;
  };
  summary: {
    n_species: number;
    n_ecotox_group: number;
  };
  species_data: Array<{
    species_name: string;
    ec10eq_mgL: number;
    trophic_group: string;
  }>;
  ssd_curve: {
    concentrations_mgL: number[];
    affected_species_percent: number[];
  } | null;
  message?: string;
}

/**
 * Check if data is SSD JSON format (not Plotly format)
 */
export function isSSDData(data: any): data is SSDData {
  return (
    data &&
    typeof data === 'object' &&
    'cas_number' in data &&
    'ssd_parameters' in data &&
    'species_data' in data &&
    'ssd_curve' in data &&
    !('data' in data && 'layout' in data) // Not Plotly format
  );
}

/**
 * Trophic group styles matching the backend implementation
 */
const TROPHIC_GROUP_STYLES: Record<string, { color: string; symbol: string }> = {
  algae: { color: '#2ca02c', symbol: 'circle' }, // Green
  crustaceans: { color: '#1f77b4', symbol: 'square' }, // Blue
  fish: { color: '#ff7f0e', symbol: 'triangle-up' }, // Orange
  plants: { color: '#9467bd', symbol: 'diamond' }, // Purple
  molluscs: { color: '#8c564b', symbol: 'diamond' }, // Brown
  insects: { color: '#e377c2', symbol: 'hash' }, // Pink
  amphibians: { color: '#7f7f7f', symbol: 'star' }, // Gray
  annelids: { color: '#bcbd22', symbol: 'hourglass' }, // Yellow-green
};

/**
 * Capitalize first letter of a string
 */
function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

/**
 * Convert SSD JSON data to Plotly format
 * Based on plot_ssd_curve.py implementation
 * @param ssdData - SSD data from the API
 * @param hc20Definition - Optional definition of HC20 from metadata (for tooltip)
 */
export function createSSDPlotFromData(ssdData: SSDData, hc20Definition?: string): PlotlyData {
  const { cas_number, chemical_name, ssd_parameters, summary, species_data, ssd_curve } = ssdData;
  const { hc20_mgL } = ssd_parameters;
  const { n_species, n_ecotox_group } = summary;

  const traces: any[] = [];

  // Add SSD curve if available
  if (ssd_curve && ssd_curve.concentrations_mgL && ssd_curve.affected_species_percent) {
    traces.push({
      x: ssd_curve.concentrations_mgL,
      y: ssd_curve.affected_species_percent,
      mode: 'lines',
      name: 'SSD Curve',
      type: 'scatter',
      line: {
        width: 4,
        color: 'black',
      },
      hovertemplate: 'Concentration: %{x:.2g} mg/L<br>% of species affected: %{y:.1f}%<extra></extra>',
    });
  }

  // Add species points grouped by trophic_group
  if (species_data && species_data.length > 0) {
    // Sort species data by EC10eq
    const sortedSpecies = [...species_data].sort((a, b) => a.ec10eq_mgL - b.ec10eq_mgL);
    const n_species_points = sortedSpecies.length;

    // Calculate y positions (percentile ranks)
    const y_positions = sortedSpecies.map((_, i) => ((i + 0.5) / n_species_points) * 100);

    // Group species by trophic_group
    const trophicGroups: Record<string, { x: number[]; y: number[]; names: string[] }> = {};
    
    sortedSpecies.forEach((item, i) => {
      const tg = item.trophic_group.toLowerCase();
      if (!trophicGroups[tg]) {
        trophicGroups[tg] = { x: [], y: [], names: [] };
      }
      trophicGroups[tg].x.push(item.ec10eq_mgL);
      trophicGroups[tg].y.push(y_positions[i]);
      trophicGroups[tg].names.push(item.species_name);
    });

    // Add a trace for each trophic group
    Object.entries(trophicGroups).forEach(([trophicGroup, data]) => {
      const style = TROPHIC_GROUP_STYLES[trophicGroup] || { color: '#d62728', symbol: 'circle' };
      
      traces.push({
        x: data.x,
        y: data.y,
        mode: 'markers',
        name: capitalize(trophicGroup),
        type: 'scatter',
        marker: {
          size: 10,
          color: style.color,
          symbol: style.symbol,
          line: {
            width: 1,
            color: 'black',
          },
        },
        text: data.names,
        hovertemplate: `<b>%{text}</b><br>Trophic group: ${trophicGroup}<br>EC10eq: %{x:.2g} mg/L<extra></extra>`,
      });
    });
  }

  // Calculate axis ranges
  let xMin = 1e-3;
  let xMax = 1e3;
  
  if (ssd_curve && ssd_curve.concentrations_mgL && ssd_curve.concentrations_mgL.length > 0) {
    xMin = Math.min(...ssd_curve.concentrations_mgL);
    xMax = Math.max(...ssd_curve.concentrations_mgL);
  } else if (species_data && species_data.length > 0) {
    const ec10Values = species_data.map(s => s.ec10eq_mgL);
    xMin = Math.min(...ec10Values);
    xMax = Math.max(...ec10Values);
  }

  // Ensure HC20 is in range
  const logMin = Math.log10(xMin) - 1.0;
  const logMax = Math.log10(xMax) + 1.0;
  const logHc20 = Math.log10(hc20_mgL);
  const finalLogMin = logHc20 < logMin ? logHc20 - 0.5 : logMin;
  const finalLogMax = logHc20 > logMax ? logHc20 + 0.5 : logMax;

  // Calculate HC20 annotation position
  const logMinPlot = finalLogMin;
  const logMaxPlot = finalLogMax;
  const logHc20Plot = logHc20;
  let fracX = (logHc20Plot - logMinPlot) / (logMaxPlot - logMinPlot);
  fracX = Math.max(0.05, Math.min(0.95, fracX));

  // Create title
  const title = ssd_curve
    ? `<b>Species Sensitivity Distribution (SSD) and HC20</b><br><b>Chemical:</b> ${chemical_name} / <b>CAS:</b> ${cas_number}<br><b>Details:</b> ${n_species} species / ${n_ecotox_group} trophic level(s)`
    : `<b>Species Sensitivity Distribution (SSD)</b><br><b>Chemical:</b> ${chemical_name} / <b>CAS:</b> ${cas_number}<br><b>Details:</b> ${n_species} species / ${n_ecotox_group} trophic level(s)<br><i>${ssdData.message || 'No SSD curve available'}</i>`;

  // Create layout
  const layout: any = {
    title: {
      text: title,
      x: 0.5,
      xanchor: 'center',
      font: { size: 14 },
    },
    xaxis: {
      title: 'Concentration (mg/L)',
      type: 'log',
      range: [finalLogMin, finalLogMax],
      showgrid: true,
    },
    yaxis: {
      title: 'Affected species (%)',
      range: [0, 100],
      ticksuffix: ' %',
      showgrid: true,
    },
    width: 1000,
    height: 600,
    template: 'plotly_white',
    hovermode: 'closest',
    legend: {
      title: 'Legend',
      orientation: 'v',
      yanchor: 'top',
      y: 0.98,
      xanchor: 'left',
      x: 0.02,
      bgcolor: 'rgba(255,255,255,0.8)',
      bordercolor: 'black',
      borderwidth: 1,
    },
    margin: { t: 120, b: 80, l: 80, r: 60 },
    shapes: [],
    annotations: [],
  };

  // Add HC20 lines and annotation if curve is available
  if (ssd_curve) {
    // Horizontal line at 20%
    layout.shapes.push({
      type: 'line',
      xref: 'paper',
      yref: 'y',
      x0: 0,
      x1: 1,
      y0: 20,
      y1: 20,
      line: {
        dash: 'dot',
        color: 'rgba(255,0,0,0.5)',
        width: 2,
      },
    });

    // Vertical line at HC20
    layout.shapes.push({
      type: 'line',
      xref: 'x',
      yref: 'paper',
      x0: hc20_mgL,
      x1: hc20_mgL,
      y0: 0,
      y1: 1,
      line: {
        dash: 'dot',
        color: 'rgba(255,0,0,0.5)',
        width: 2,
      },
    });

    // HC20 annotation
    // Format similar to Python's :.2g (general format with 2 significant digits)
    const formatHC20 = (value: number): string => {
      if (value === 0) return '0';
      const absValue = Math.abs(value);
      
      // For very small or very large numbers, use scientific notation
      if (absValue >= 1000 || (absValue < 0.01 && absValue > 0)) {
        return value.toExponential(2);
      }
      
      // For values between 0.01 and 1000, use fixed notation
      // Calculate number of decimal places needed for 2 significant digits
      const magnitude = Math.floor(Math.log10(absValue));
      const decimals = Math.max(0, 2 - magnitude - 1);
      let formatted = value.toFixed(decimals);
      
      // Remove trailing zeros
      formatted = formatted.replace(/\.?0+$/, '');
      
      return formatted;
    };

    // Build annotation text
    const annotationText = `<b>HC20 = ${formatHC20(hc20_mgL)} mg/L</b>`;

    // Create annotation with hovertext for definition
    const annotation: any = {
      x: fracX,
      y: 0.93,
      xref: 'paper',
      yref: 'paper',
      text: annotationText,
      showarrow: false,
      font: { color: 'red', size: 14 },
      bgcolor: 'rgba(255,255,255,0.8)',
      bordercolor: 'red',
      borderwidth: 1,
    };

    // Add hovertext with definition if available
    // Plotly will show this in the tooltip when hovering over the annotation
    if (hc20Definition) {
      annotation.hovertext = `<br>${hc20Definition}`;
      annotation.hoverlabel = {
        font: { color: 'black', size: 12 },
        namelength: -1,
      };
    }

    layout.annotations.push(annotation);
  }

  return {
    data: traces,
    layout,
    config: undefined,
  };
}

/**
 * Interface for comparison data from the API
 */
export interface ComparisonData {
  comparison: SSDData[];
}

/**
 * Check if data is comparison format
 */
export function isComparisonData(data: any): data is ComparisonData {
  return (
    data &&
    typeof data === 'object' &&
    'comparison' in data &&
    Array.isArray(data.comparison) &&
    data.comparison.length > 0 &&
    isSSDData(data.comparison[0])
  );
}

/**
 * Colors for comparison plots (one per substance)
 */
const COMPARISON_COLORS = [
  '#1f77b4', // Blue
  '#ff7f0e', // Orange
  '#2ca02c', // Green
  '#d62728', // Red
  '#9467bd', // Purple
];

/**
 * Convert comparison JSON data to Plotly format
 * Creates a plot with multiple SSD curves for comparison
 */
export function createComparisonPlotFromData(comparisonData: ComparisonData): PlotlyData {
  const { comparison } = comparisonData;
  const traces: any[] = [];

  // Create a trace for each substance's SSD curve
  comparison.forEach((ssdData, index) => {
    const { cas_number, chemical_name, ssd_curve } = ssdData;
    const color = COMPARISON_COLORS[index % COMPARISON_COLORS.length];
    const displayName = chemical_name || cas_number;

    if (ssd_curve && ssd_curve.concentrations_mgL && ssd_curve.affected_species_percent) {
      traces.push({
        x: ssd_curve.concentrations_mgL,
        y: ssd_curve.affected_species_percent,
        mode: 'lines',
        name: displayName,
        type: 'scatter',
        line: {
          width: 3,
          color: color,
        },
        hovertemplate: `<b>${displayName}</b><br>Concentration: %{x:.2g} mg/L<br>% of species affected: %{y:.1f}%<extra></extra>`,
      });
    }
  });

  // Calculate axis ranges from all curves
  let xMin = 1e-3;
  let xMax = 1e3;
  
  comparison.forEach((ssdData) => {
    if (ssdData.ssd_curve && ssdData.ssd_curve.concentrations_mgL && ssdData.ssd_curve.concentrations_mgL.length > 0) {
      const curveMin = Math.min(...ssdData.ssd_curve.concentrations_mgL);
      const curveMax = Math.max(...ssdData.ssd_curve.concentrations_mgL);
      xMin = Math.min(xMin, curveMin);
      xMax = Math.max(xMax, curveMax);
    }
  });

  // Ensure reasonable range
  const logMin = Math.log10(xMin) - 0.5;
  const logMax = Math.log10(xMax) + 0.5;

  // Create title
  const substanceNames = comparison
    .map(s => s.chemical_name || s.cas_number)
    .join(' vs ');
  const title = `<b>SSD Comparison</b><br>${substanceNames}`;

  // Create layout
  const layout: any = {
    title: {
      text: title,
      x: 0.5,
      xanchor: 'center',
      font: { size: 14 },
    },
    xaxis: {
      title: 'Concentration (mg/L)',
      type: 'log',
      range: [logMin, logMax],
      showgrid: true,
    },
    yaxis: {
      title: 'Affected species (%)',
      range: [0, 100],
      ticksuffix: ' %',
      showgrid: true,
    },
    width: 1000,
    height: 600,
    template: 'plotly_white',
    hovermode: 'closest',
    legend: {
      title: 'Substances',
      orientation: 'v',
      yanchor: 'top',
      y: 0.98,
      xanchor: 'left',
      x: 0.02,
      bgcolor: 'rgba(255,255,255,0.8)',
      bordercolor: 'black',
      borderwidth: 1,
    },
    margin: { t: 120, b: 80, l: 80, r: 60 },
  };

  return {
    data: traces,
    layout,
    config: undefined,
  };
}

