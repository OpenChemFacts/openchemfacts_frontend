/**
 * Configuration de l'API Scalingo
 * L'URL peut être définie via la variable d'environnement VITE_API_BASE_URL
 * ou utilise l'URL par défaut :
 * - Production/Preview : https://openchemfacts-api.osc-fr1.scalingo.io
 * - Développement local uniquement : http://localhost:8000 (nécessite VITE_API_BASE_URL)
 */
const isLocalhost = typeof window !== 'undefined' && 
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

export const API_BASE_URL = 
  import.meta.env.VITE_API_BASE_URL || 
  (isLocalhost 
    ? 'http://localhost:8000' 
    : 'https://openchemfacts-api.osc-fr1.scalingo.io');

export const API_ENDPOINTS = {
  ROOT: '/',
  HEALTH: '/health',
  SUMMARY: '/api/summary',
  BY_COLUMN: (column: string) => `/api/by_column?column=${encodeURIComponent(column)}`,
  CAS_LIST: '/api/cas/list',
  SSD_PLOT: (cas: string) => `/api/plot/ssd/${cas}`,
  EC10EQ_PLOT: (cas: string) => `/api/plot/ec10eq/${cas}`,
  SSD_COMPARISON: '/api/plot/ssd/comparison',
};

