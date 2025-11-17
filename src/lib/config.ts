/**
 * Configuration de l'API Scalingo
<<<<<<< HEAD
 * 
 * L'URL peut être définie via la variable d'environnement VITE_API_BASE_URL.
 * Si non définie, utilise l'URL par défaut selon l'environnement :
 * - Développement local (DEV=true) : http://localhost:8000
 * - Production : https://openchemfacts-api.osc-fr1.scalingo.io
 * 
 * Pour utiliser le backend Scalingo en développement, définir dans .env :
 * VITE_API_BASE_URL=https://openchemfacts-api.osc-fr1.scalingo.io
 * 
 * Pour utiliser le backend local, soit :
 * - Ne pas définir VITE_API_BASE_URL (utilisera localhost:8000 en dev)
 * - Ou définir VITE_API_BASE_URL=http://localhost:8000
 */
const getApiBaseUrl = (): string => {
  // Si VITE_API_BASE_URL est explicitement défini, l'utiliser
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }
  
  // Sinon, utiliser les valeurs par défaut selon l'environnement
  return import.meta.env.DEV 
=======
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
>>>>>>> 607ecb72e560764dabd9e783bf2e4940f5bd389a
    ? 'http://localhost:8000' 
    : 'https://openchemfacts-api.osc-fr1.scalingo.io';
};

export const API_BASE_URL = getApiBaseUrl();

// Log de débogage en développement
if (import.meta.env.DEV) {
  console.log(`[API Config] Base URL: ${API_BASE_URL}`);
  console.log(`[API Config] Environment: ${import.meta.env.MODE}`);
  console.log(`[API Config] VITE_API_BASE_URL: ${import.meta.env.VITE_API_BASE_URL || 'not set'}`);
}

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

