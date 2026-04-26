// Tiny hash router — no react-router-dom dep. Replace if app grows past
// ~10 routes; for now this beats useState-driven navigation by giving us
// shareable URLs + browser back/forward + DevSwitcher-as-shortcut.

import { useEffect, useState, useCallback } from 'react';
import type { GameId } from '@/lib/api/types';

export type Route =
  | { name: 'lobby'; gameId?: GameId }
  | { name: 'room'; id: number; state?: 'lobby' | 'post' }
  | { name: 'group'; handle: string }
  | { name: 'dm'; view?: 'friends' | 'dm'; peer?: string }
  | { name: 'profile'; handle?: string; popover?: boolean }
  | { name: 'settings'; section?: string };

const DEFAULT_ROUTE: Route = { name: 'lobby', gameId: 'th08' };

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
      return { name: 'dm', view, peer };
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
    case 'dm':
      return `#/dm/${route.view || 'friends'}${route.peer ? `/${route.peer}` : ''}`;
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
