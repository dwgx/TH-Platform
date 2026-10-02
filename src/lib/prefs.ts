// Appearance preferences the client can honour on its own.
//
// Settings > 外观 used to render four live-looking controls that changed
// nothing: three font swatches with no onClick, a font-size slider drawn as
// plain divs, and 紧凑模式 / 减少动效 switches that flipped a local boolean and
// were forgotten on reload. That is the "settings that display a value without
// applying it" case -- the control says the app is in a state it is not in.
//
// Every preference in here is applied to <html> as a class or a custom
// property, because every one of them is expressed in design.css as a token.
// None of them needs a server round trip, so none of them is allowed to
// pretend to need one; the settings that *do* need a route are the ones that
// are rendered honestly unavailable instead.
//
// Storage is a single JSON blob under one key. localStorage is not trusted
// input: a hand-edited or truncated value must not throw during render, so
// every field is validated on read and an unknown value falls back to the
// default rather than poisoning the class list.

import { useCallback, useEffect, useState } from 'react';

/** The interface font stack, as a choice the user actually picks. */
export type FontChoice = 'app' | 'source-han' | 'lxgw';

export interface Prefs {
  font: FontChoice;
  /** Interface type size, in percent. */
  scale: number;
  compact: boolean;
  reduceMotion: boolean;
}

export const SCALES = [90, 100, 110, 125] as const;

const STORAGE_KEY = 'th-platform-prefs';

const DEFAULTS: Prefs = {
  font: 'app',
  scale: 100,
  compact: false,
  reduceMotion: false,
};

/**
 * The font stacks Settings offers, and the <html> class each one installs.
 *
 * The two non-default stacks name fonts this machine may not have, and
 * clicking a swatch whose font is not installed looks like the click did
 * nothing -- the page falls back to the same glyphs. Settings asks the browser
 * (`isFontAvailable`) and renders the missing ones unavailable, so the control
 * never silently no-ops.
 */
export const FONTS: Record<FontChoice, {
  label: string;
  sample: string;
  family: string;
  className: string;
}> = {
  app: {
    label: 'Manrope + 苹方/雅黑',
    sample: '永夜抄 Lunatic',
    family: "'Manrope', 'PingFang SC', 'Microsoft YaHei', system-ui, sans-serif",
    className: 'thp-font-app',
  },
  'source-han': {
    label: '思源黑体',
    sample: '永夜抄 Lunatic',
    family: "'Source Han Sans SC', 'PingFang SC', 'Microsoft YaHei', sans-serif",
    className: 'thp-font-source-han',
  },
  lxgw: {
    label: '霞鹜文楷',
    sample: '永夜抄 Lunatic',
    family: "'LXGW WenKai', 'Kaiti SC', 'KaiTi', 'STKaiti', serif",
    className: 'thp-font-lxgw',
  },
};

/**
 * Whether the browser can actually render `family`. Settings uses it to keep a
 * swatch from looking selectable when the font is not installed — clicking one
 * would fall back to the same glyphs and appear to do nothing.
 */
export function isFontAvailable(family: string): boolean {
  if (typeof document === 'undefined' || !document.fonts) return false;
  try {
    // `check` answers for locally installed system fonts too, which is what
    // these three are: none of them is a webfont this project loads.
    return document.fonts.check(`16px ${family}`);
  } catch {
    return false;
  }
}

function isFontChoice(v: unknown): v is FontChoice {
  return v === 'app' || v === 'source-han' || v === 'lxgw';
}

function isScale(v: unknown): v is number {
  return typeof v === 'number' && (SCALES as readonly number[]).includes(v);
}

/** Drops any field that is not one of ours rather than throwing on it. */
function sanitize(raw: unknown): Prefs {
  if (typeof raw !== 'object' || raw === null) return { ...DEFAULTS };
  const r = raw as Record<string, unknown>;
  return {
    font: isFontChoice(r.font) ? r.font : DEFAULTS.font,
    scale: isScale(r.scale) ? r.scale : DEFAULTS.scale,
    compact: typeof r.compact === 'boolean' ? r.compact : DEFAULTS.compact,
    reduceMotion:
      typeof r.reduceMotion === 'boolean' ? r.reduceMotion : DEFAULTS.reduceMotion,
  };
}

function read(): Prefs {
  if (typeof window === 'undefined') return { ...DEFAULTS };
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored ? sanitize(JSON.parse(stored)) : { ...DEFAULTS };
  } catch {
    // Unreadable or corrupt storage is not the user's problem to solve; the
    // defaults are a correct, if forgetful, answer.
    return { ...DEFAULTS };
  }
}

function apply(p: Prefs): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  for (const choice of Object.keys(FONTS) as FontChoice[]) {
    root.classList.toggle(FONTS[choice].className, choice === p.font);
  }
  for (const s of SCALES) {
    root.classList.toggle(`thp-scale-${s}`, s === p.scale);
  }
  root.classList.toggle('thp-compact', p.compact);
  root.classList.toggle('thp-no-motion', p.reduceMotion);
  root.style.setProperty('--ui-scale', String(p.scale / 100));
}

let current: Prefs = read();
const listeners = new Set<() => void>();

// Applied at module load rather than from an effect, so the classes are on
// <html> before the first commit instead of one frame after it.
apply(current);

function commit(next: Prefs): void {
  current = next;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Private mode / quota. The preference still applies for this session.
  }
  apply(next);
  listeners.forEach((l) => l());
}

export function getPrefs(): Prefs {
  return current;
}

/** Patches one or more preferences. */
export function setPrefs(patch: Partial<Prefs>): void {
  commit(sanitize({ ...current, ...patch }));
}

/**
 * The live preferences plus a setter. Every mounted caller re-renders on change,
 * so two sections reading the same value cannot disagree.
 */
export function usePrefs(): [Prefs, (patch: Partial<Prefs>) => void] {
  const [prefs, setLocal] = useState<Prefs>(current);

  useEffect(() => {
    // Wrapped, because `setLocal` is a Dispatch that accepts an updater argument
    // and the listener set only ever calls it with none.
    const sync = () => setLocal(current);
    listeners.add(sync);
    // Another component may have written while this one was unmounted.
    sync();
    return () => {
      listeners.delete(sync);
    };
  }, []);

  const update = useCallback((patch: Partial<Prefs>) => setPrefs(patch), []);
  return [prefs, update];
}
