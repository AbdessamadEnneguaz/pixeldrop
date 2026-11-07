import { useState, useEffect, useCallback } from 'react';

export type ThemePreference = 'system' | 'dark' | 'light';
export type ActiveTheme = 'dark' | 'light';

const STORAGE_KEY = 'pixeldrop_theme_preference';

/**
 * System preference detection hook with persistent user override
 * 
 * - Detects OS setting via window.matchMedia('(prefers-color-scheme: dark)')
 * - Listens for dynamic OS theme changes in real time
 * - Respects and persistently saves user overrides in localStorage
 * - Seamlessly synchronizes documentElement classes (.dark) and style.colorScheme
 */
export function useSystemTheme() {
  // 1. Read persistent user override or fallback to 'system'
  const [themePreference, setThemePreferenceState] = useState<ThemePreference>(() => {
    if (typeof window === 'undefined') return 'system';
    try {
      const stored = localStorage.getItem(STORAGE_KEY) as ThemePreference | null;
      if (stored === 'dark' || stored === 'light' || stored === 'system') {
        return stored;
      }
    } catch {
      // Storage unavailable fallback
    }
    return 'dark';
  });

  // 2. Track OS system preference match
  const [systemIsDark, setSystemIsDark] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // 3. Active resolved theme ('dark' | 'light')
  const resolvedTheme: ActiveTheme =
    themePreference === 'system'
      ? systemIsDark
        ? 'dark'
        : 'light'
      : themePreference;

  const isDark = resolvedTheme === 'dark';

  // 4. Listen to OS system color-scheme changes dynamically
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setSystemIsDark(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setSystemIsDark(e.matches);
    };

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
    } else {
      // @ts-ignore legacy browser support
      mediaQuery.addListener(handleChange);
    }

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleChange);
      } else {
        // @ts-ignore legacy browser support
        mediaQuery.removeListener(handleChange);
      }
    };
  }, []);

  // 5. Synchronize <html> root class (.dark / .light) and colorScheme style
  useEffect(() => {
    if (typeof document === 'undefined') return;

    const root = document.documentElement;
    if (resolvedTheme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
      root.style.colorScheme = 'dark';
    } else {
      root.classList.remove('dark');
      root.classList.add('light');
      root.style.colorScheme = 'light';
    }
  }, [resolvedTheme]);

  // 6. Persistent setter for user preference
  const setThemePreference = useCallback((preference: ThemePreference) => {
    setThemePreferenceState(preference);
    try {
      if (preference === 'system') {
        localStorage.removeItem(STORAGE_KEY);
      } else {
        localStorage.setItem(STORAGE_KEY, preference);
      }
    } catch {
      // Ignore storage access error
    }
  }, []);

  // 7. Quick toggle between dark and light
  const toggleTheme = useCallback(() => {
    const nextTheme: ThemePreference = isDark ? 'light' : 'dark';
    setThemePreference(nextTheme);
  }, [isDark, setThemePreference]);

  return {
    themePreference,
    resolvedTheme,
    isDark,
    systemIsDark,
    setThemePreference,
    toggleTheme,
  };
}
