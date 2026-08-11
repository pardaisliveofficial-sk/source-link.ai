import { Capacitor } from '@capacitor/core';

/**
 * Checks if running inside native Android/iOS Capacitor app
 */
export const isNativeApp = (): boolean => {
  return Capacitor.isNativePlatform();
};

/**
 * Get current platform
 */
export const getPlatform = (): string => {
  return Capacitor.getPlatform();
};

/**
 * Register Android hardware back-button listener
 */
export const setupAndroidBackButton = (onBack: () => void): (() => void) => {
  if (!isNativeApp()) return () => {};

  try {
    // Dynamic import to avoid web bundling errors if Capacitor plugin isn't linked
    import('@capacitor/app').then(({ App }) => {
      App.addListener('backButton', () => {
        onBack();
      });
    }).catch(() => {});
  } catch (err) {
    console.warn('Capacitor App listener setup warning:', err);
  }

  return () => {};
};
