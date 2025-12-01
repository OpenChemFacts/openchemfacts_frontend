/**
 * Centralized API response types
 * All types returned by the OpenChemFacts API endpoints
 */

import { PlotlyData } from "./plotly-utils";
import { SSDData, ComparisonData } from "./ssd-plot-utils";
import { EC10eqData } from "./ec10eq-plot-utils";

/**
 * Structure of an effect factor in the API response
 * Format: {"Source": "source_name", "EF": ef_value, "Version": version_value}
 */
export interface EffectFactorItem {
  Source: string;
  EF: number;
  Version?: string;
}

/**
 * Structure of the API response /cas/{cas}
 * The API uses 'name' for the chemical name, not 'chemical_name'
 * The EffectFactor(S) field can be a JSON string or an array
 */
export interface CasInfoResponse {
  cas_number?: string;
  name?: string; // The API uses 'name', not 'chemical_name'
  n_species?: number;
  n_trophic_level?: number;
  n_results?: number;
  INCHIKEY?: string;
  Kingdom?: string;
  Superclass?: string;
  Class?: string;
  "EffectFactor(S)"?: string | EffectFactorItem[];
  EffectFactor?: string | EffectFactorItem[];
  EffectFactors?: string | EffectFactorItem[];
  effect_factors?: EffectFactorItem[];
  effectFactors?: EffectFactorItem[];
  [key: string]: any;
}

/**
 * Structure of the API response /metadata
 * Contains metadata about fields and their units
 * Example response:
 * {
 *   "EF": {
 *     "unit": "PAF·m³/kg",
 *     "formula": "EF = O,2 / HC20",
 *     "summary": "...",
 *     "details": "..."
 *   },
 *   "HC20": { "unit": "mg/L", "definition": "...", ... },
 *   "EC10eq": { "unit": "mg/L", "definition": "...", ... },
 *   "SSD": { "definition": "...", "summary": "...", "why": "..." }
 * }
 */
export interface MetadataResponse {
  EF?: {
    unit?: string;
    formula?: string;
    summary?: string;
    details?: string;
  };
  HC20?: {
    unit?: string;
    definition?: string;
  };
  EC10eq?: {
    unit?: string;
    definition?: string;
    summary?: string;
    why?: string;
  };
  SSD?: {
    definition?: string;
    summary?: string;
    why?: string;
  };
  [key: string]: any;
}

/**
 * Structure of the API response /search
 */
export interface SearchResponse {
  query: string;
  count: number;
  matches: Array<{ cas: string; name?: string }>;
}

/**
 * Structure of the API response /summary
 */
export interface SummaryData {
  rows: number;
  columns: number;
  columns_names: string[];
}

/**
 * Structure of the API response /by_column?column={column}
 */
export interface ByColumnData {
  column: string;
  unique_values: any[];
  count: number;
}

/**
 * Structure of the API response /cas/list
 * The API returns directly an array of objects with cas_number and name
 */
export type CasListResponse = Array<{ cas_number: string; name?: string }>;

/**
 * Union type for plot data responses
 * Can be Plotly format, SSD format, or EC10eq format
 */
export type PlotDataResponse = PlotlyData | SSDData | EC10eqData;

/**
 * Union type for comparison plot responses
 * Can be ComparisonData or PlotlyData
 */
export type ComparisonPlotResponse = ComparisonData | PlotlyData;

