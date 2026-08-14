import { apiFetch } from './api';

export interface PublicAppConfig {
  appName: string;
  appIconUrl: string;
  websiteUrl: string;
  supportEmail?: string;
  maintenanceMode: boolean;
}

const DEFAULT_CONFIG: PublicAppConfig = {
  appName: 'SourceLink.ai',
  appIconUrl: '/icon-192.png',
  websiteUrl: 'https://sourcelinkai.soulverseapps.com',
  maintenanceMode: false
};

const STORAGE_KEY = 'sourcelink_app_icon_url';

export function getCachedAppIconUrl(): string {
  try {
    return localStorage.getItem(STORAGE_KEY) || '/icon-192.png';
  } catch {
    return '/icon-192.png';
  }
}

export function setCachedAppIconUrl(url: string): void {
  try {
    localStorage.setItem(STORAGE_KEY, url);
  } catch {}
}

/**
 * Dynamically updates document.head favicons, apple-touch-icons, and meta tags
 */
export function applyAppIconToDOM(iconUrl: string): void {
  if (!iconUrl) return;
  setCachedAppIconUrl(iconUrl);

  // Update or create favicon link tags
  const selectors = [
    'link[rel="icon"]',
    'link[rel="shortcut icon"]',
    'link[rel="apple-touch-icon"]',
    'link[rel="apple-touch-icon-precomposed"]'
  ];

  let foundIcon = false;
  selectors.forEach(selector => {
    const links = document.querySelectorAll<HTMLLinkElement>(selector);
    links.forEach(link => {
      link.href = iconUrl;
      foundIcon = true;
    });
  });

  if (!foundIcon) {
    const link = document.createElement('link');
    link.rel = 'icon';
    link.type = 'image/png';
    link.href = iconUrl;
    document.head.appendChild(link);
  }

  // Dispatch custom window event so React state updates live
  window.dispatchEvent(new CustomEvent('app_icon_changed', { detail: { iconUrl } }));
}

/**
 * Fetch latest public app config from server and sync DOM icons
 */
export async function syncPublicAppConfig(): Promise<PublicAppConfig> {
  try {
    const res = await apiFetch('/api/public/config');
    if (res.ok) {
      const data: PublicAppConfig = await res.json();
      if (data.appIconUrl) {
        applyAppIconToDOM(data.appIconUrl);
      }
      return data;
    }
  } catch (err) {
    console.warn('[AppConfig] Failed to fetch public app config:', err);
  }
  return DEFAULT_CONFIG;
}
