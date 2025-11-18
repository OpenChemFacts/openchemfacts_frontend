/**
 * Utilitaires pour la gestion des numéros CAS (Chemical Abstracts Service)
 */

/**
 * Normalise un numéro CAS en enlevant les espaces et en normalisant les tirets
 * @param cas - Le numéro CAS à normaliser
 * @returns Le numéro CAS normalisé
 */
export const normalizeCas = (cas: string): string => {
  return cas.trim().replace(/\s+/g, '').replace(/[–—]/g, '-');
};

/**
 * Compare deux numéros CAS de manière insensible à la casse et aux espaces
 * @param cas1 - Premier numéro CAS
 * @param cas2 - Deuxième numéro CAS
 * @returns true si les deux CAS sont identiques après normalisation
 */
export const compareCas = (cas1: string, cas2: string): boolean => {
  return normalizeCas(cas1).toLowerCase() === normalizeCas(cas2).toLowerCase();
};

