// Tiny hash router — no react-router-dom dep. Replace if app grows past
// ~10 routes; for now this beats useState-driven navigation by giving us
// shareable URLs + browser back/forward + DevSwitcher-as-shortcut.

import { useEffect, useState, useCallback } from 'react';
import type { GameId } from '@/lib/api/types';

export type Route =
  | { name: 'lobby'; gameId?: GameId }
  | { name: 'room'; id: number; state?: 'lobby' | 'post' }
  | { name: 'group'; handle: string }
  | { name: 'dm'; view?: 'friends' | 'dm'; peer?: string; tab?: FriendsTabId }
  | { name: 'profile'; handle?: string; popover?: boolean }
  | { name: 'settings'; section?: string };

/** The four tabs on the friends page. One definition, imported by the page. */
export const FRIENDS_TABS = ['online', 'all', 'pending', 'blocked'] as const;
export type FriendsTabId = (typeof FRIENDS_TABS)[number];

const DEFAULT_ROUTE: Route = { name: 'lobby', gameId: 'th08' };

function isGameId(value: unknown): value is GameId {
  switch (value) {
    case 'th06':
    case 'th07':
    case 'th08':
    case 'th09':
      return true;
    default:
      return false;
  }
}

// What a page is allowed to ask for. Deliberately NOT `Route`: a page builds a
// target from whatever it has on hand (a seat id, a visibility string), and
// `toRoute` is what validates it into a real `Route`. `unknown` values, not
// `any`, so a page cannot smuggle an unchecked value through this boundary.
export type NavTarget = { name: string; [k: string]: unknown };

// Narrow here rather than casting the callback to any at the call site. An
// unrecognised target falls back to DEFAULT_ROUTE, which is also what
// parseHash does with an unknown hash.
export function toRoute(target: NavTarget): Route {
  const { id, handle } = target;
  switch (target.name) {
    case 'lobby':
      return { name: 'lobby', gameId: isGameId(target.gameId) ? target.gameId : 'th08' };
    case 'room':
      return {
        name: 'room',
        id: typeof id === 'number' && Number.isFinite(id) ? id : 1,
        state: target.state === 'post' ? 'post' : 'lobby',
      };
    case 'group':
      return { name: 'group', handle: typeof handle === 'string' ? handle : 'yegumi' };
    case 'dm':
      return {
        name: 'dm',
        view: target.view === 'dm' ? 'dm' : 'friends',
        peer: typeof target.peer === 'string' ? target.peer : undefined,
        tab: FRIENDS_TABS.includes(target.tab as FriendsTabId)
          ? (target.tab as FriendsTabId)
          : undefined,
      };
    case 'profile':
      return {
        name: 'profile',
        handle: typeof handle === 'string' ? handle : undefined,
        popover: target.popover === true ? true : undefined,
      };
    case 'settings':
      return { name: 'settings', section: typeof target.section === 'string' ? target.section : 'appear' };
    default:
      return DEFAULT_ROUTE;
  }
}

function parseHash(hash: string): Route {
  const raw = hash.replace(/^#\/?/, '');
  if (!raw) return DEFAULT_ROUTE;
  const [path, query = ''] = raw.split('?');
  const parts = path.split('/').filter(Boolean);
  const params = new URLSearchParams(query);

  const name = parts[0];
  switch (name) {
    case 'lobby': {
      const gameId = (parts[1] || 'th08') as GameId;
      return { name: 'lobby', gameId };
    }
    case 'room': {
      const id = Number(parts[1] || '1');
      const state = (params.get('state') || 'lobby') as 'lobby' | 'post';
      return { name: 'room', id: Number.isFinite(id) ? id : 1, state };
    }
    case 'group': {
      const handle = parts[1] || 'yegumi';
      return { name: 'group', handle };
    }
    case 'dm': {
      const view = (parts[1] || 'friends') as 'friends' | 'dm';
      const peer = parts[2];
      const tab = params.get('tab');
      return {
        name: 'dm',
        view,
        peer,
        tab: FRIENDS_TABS.includes(tab as FriendsTabId) ? (tab as FriendsTabId) : undefined,
      };
    }
    case 'profile': {
      const handle = parts[1];
      const popover = params.get('popover') === '1';
      return { name: 'profile', handle, popover };
    }
    case 'settings': {
      const section = parts[1] || 'appear';
      return { name: 'settings', section };
    }
    default:
      return DEFAULT_ROUTE;
  }
}

function buildHash(route: Route): string {
  switch (route.name) {
    case 'lobby':
      return `#/lobby/${route.gameId || 'th08'}`;
    case 'room': {
      const q = route.state && route.state !== 'lobby' ? `?state=${route.state}` : '';
      return `#/room/${route.id}${q}`;
    }
    case 'group':
      return `#/group/${route.handle}`;
    case 'dm': {
      const q = route.tab && route.view !== 'dm' ? `?tab=${route.tab}` : '';
      return `#/dm/${route.view || 'friends'}${route.peer ? `/${route.peer}` : ''}${q}`;
    }
    case 'profile': {
      const h = route.handle ? `/${route.handle}` : '';
      const q = route.popover ? '?popover=1' : '';
      return `#/profile${h}${q}`;
    }
    case 'settings':
      return `#/settings/${route.section || 'appear'}`;
  }
}

export function useRoute(): [Route, (next: Route) => void] {
  const [route, setRoute] = useState<Route>(() =>
    typeof window === 'undefined' ? DEFAULT_ROUTE : parseHash(window.location.hash),
  );

  useEffect(() => {
    const onHash = () => setRoute(parseHash(window.location.hash));
    window.addEventListener('hashchange', onHash);
    // ensure URL matches initial state
    if (!window.location.hash) {
      window.location.hash = buildHash(route);
    }
    return () => window.removeEventListener('hashchange', onHash);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const navigate = useCallback((next: Route) => {
    const newHash = buildHash(next);
    if (window.location.hash !== newHash) {
      window.location.hash = newHash;
    } else {
      setRoute(next);
    }
  }, []);

  return [route, navigate];
}

export { parseHash, buildHash, DEFAULT_ROUTE };
