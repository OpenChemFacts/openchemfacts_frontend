/**
 * Configuration de l'API Scalingo
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

  // Cas particulier: en DEV mais pas sur localhost (ex: preview Lovable),
  // on utilise l'API Scalingo pour éviter les erreurs de connexion à localhost
  const isHostedDev = import.meta.env.DEV
    && typeof window !== 'undefined'
    && window.location.hostname !== 'localhost'
    && window.location.hostname !== '127.0.0.1';

  if (isHostedDev) {
    return 'https://openchemfacts-api.osc-fr1.scalingo.io';
  }

  // Sinon, utiliser les valeurs par défaut selon l'environnement
  return import.meta.env.DEV 
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
  /**
   * Endpoint pour la comparaison de plusieurs SSD (max 3 substances).
   * 
   * Note: Cet endpoint nécessite une liste de numéros CAS (maximum 3).
   * L'implémentation frontend n'est pas encore disponible.
   * 
   * Format attendu par le backend (fonction plot_ssd_comparison):
   * - Méthode: POST
   * - Body JSON: { "cas_list": ["123-45-6", "789-01-2", "345-67-8"] }
   * - Maximum 3 CAS numbers dans la liste
   * - Retourne: Plotly figure au format JSON (fig.to_dict())
   */
  SSD_COMPARISON: '/api/plot/ssd/comparison',
};

