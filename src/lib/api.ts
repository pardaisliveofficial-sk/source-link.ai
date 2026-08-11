/**
 * Centralized API configuration and fetch wrapper for SourceLink.ai
 * Handles base URL configuration for Web and Capacitor Android environments seamlessly.
 */

// Production API origin for SourceLink.ai
export const PRODUCTION_API_URL = 'https://api.sourcelinkai.soulverseapps.com';

const isNativeApp = typeof window !== 'undefined' && (
  window.location?.origin?.includes('capacitor://') || 
  window.location?.origin?.includes('localhost') && !window.location.port
);

const envBaseUrl = (import.meta as unknown as { env?: Record<string, string> }).env?.VITE_API_BASE_URL;

// Determine active API Base URL
export const API_BASE_URL = (
  envBaseUrl || 
  (isNativeApp ? PRODUCTION_API_URL : (typeof window !== 'undefined' ? window.location?.origin : ''))
).replace(/\/$/, '');

/**
 * Returns full API URL given a relative path like '/api/auth/login'
 */
export function getApiUrl(path: string): string {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  if (!API_BASE_URL) {
    return cleanPath;
  }
  return `${API_BASE_URL}${cleanPath}`;
}

/**
 * Centralized fetch helper for API endpoints
 */
export async function apiFetch(path: string, options?: RequestInit): Promise<Response> {
  const url = getApiUrl(path);
  return fetch(url, options);
}
