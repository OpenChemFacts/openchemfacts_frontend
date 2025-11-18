/**
 * Utilities for managing CAS numbers (Chemical Abstracts Service)
 */

/**
 * Normalizes a CAS number by removing spaces and normalizing dashes
 * @param cas - The CAS number to normalize
 * @returns The normalized CAS number
 */
export const normalizeCas = (cas: string): string => {
  return cas.trim().replace(/\s+/g, '').replace(/[–—]/g, '-');
};

/**
 * Compares two CAS numbers in a case-insensitive and space-insensitive manner
 * @param cas1 - First CAS number
 * @param cas2 - Second CAS number
 * @returns true if both CAS numbers are identical after normalization
 */
export const compareCas = (cas1: string, cas2: string): boolean => {
  return normalizeCas(cas1).toLowerCase() === normalizeCas(cas2).toLowerCase();
};

