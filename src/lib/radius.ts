import { useCallback, useEffect, useState } from 'react';

export type RadiusStyle = 'sharp' | 'standard' | 'soft';

const STORAGE_KEY = 'th-platform-radius';
const CLASS_PREFIX = 'radius-';

const CLASSES = {
  sharp: 'radius-sharp',
  standard: 'radius-standard',
  soft: 'radius-soft',
} as const;

function isRadiusStyle(value: unknown): value is RadiusStyle {
  return value === 'sharp' || value === 'standard' || value === 'soft';
}

/**
 * Corner-radius preference.
 *
 * This is the one appearance setting the client can honour on its own: the
 * whole scale is four CSS custom properties, so switching them restyles every
 * card and button immediately, with no server round trip and no reload. It
 * used to be three buttons that did nothing at all.
 *
 * The class is applied to `<html>` rather than to the app subtree so it is in
 * place on the very first paint after a reload instead of one frame late.
 */
export function useRadius(): [RadiusStyle, (next: RadiusStyle) => void] {
  const [style, setStyle] = useState<RadiusStyle>(() => {
    if (typeof window === 'undefined') return 'standard';
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return isRadiusStyle(stored) ? stored : 'standard';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    for (const cls of Object.values(CLASSES)) {
      if (cls === CLASS_PREFIX + style) continue;
      root.classList.remove(cls);
    }
    if (style !== 'standard') root.classList.add(CLASS_PREFIX + style);
  }, [style]);

  const setRadius = useCallback((next: RadiusStyle) => {
    window.localStorage.setItem(STORAGE_KEY, next);
    setStyle(next);
  }, []);

  return [style, setRadius];
}