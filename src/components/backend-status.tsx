/**
 * Backend reachability, for pages that need to tell "there is nothing here"
 * apart from "I could not ask".
 *
 * Why this exists: `api/client.ts` resolves every collection route to `[]` on
 * failure and never throws, so a page that renders `items.map(...)` cannot
 * distinguish an empty list from a server that is down -- or, as it happens,
 * from a server the browser was never allowed to reach. Both used to render as
 * a silent empty column. This probes the same origin the client talks to and
 * reports it, so a list can say which of the two it is showing.
 *
 * The base URL is imported from `api/client.ts`, which owns the resolution of
 * `VITE_API_BASE_URL`. There is now exactly one place to change when the
 * default moves, and this component cannot drift from what the client dials.
 */

import * as React from 'react';
import { Lu } from '@/components/design/lucide';
import { API_BASE_URL } from '@/lib/api/client';

const PROBE_PATH = '/healthz';
const PROBE_INTERVAL_MS = 10000;

type Reachability = 'unknown' | 'up' | 'down';

/**
 * Returns the current reachability. Starts at 'unknown' and settles within one
 * probe; pages should treat 'unknown' as "not yet known", not as "empty".
 */
export function useBackendReachable(): Reachability {
  const [state, setState] = React.useState<Reachability>('unknown');

  React.useEffect(() => {
    let alive = true;
    const controller = new AbortController();

    const probe = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}${PROBE_PATH}`, {
          signal: controller.signal,
          cache: 'no-store',
        });
        if (alive) setState(res.ok ? 'up' : 'down');
      } catch {
        // A blocked or refused request is exactly the 'down' case: from inside
        // this window the backend is unreachable, whether or not it is running.
        if (alive) setState('down');
      }
    };

    void probe();
    const timer = setInterval(probe, PROBE_INTERVAL_MS);
    const onFocus = () => void probe();
    window.addEventListener('focus', onFocus);

    return () => {
      alive = false;
      controller.abort();
      clearInterval(timer);
      window.removeEventListener('focus', onFocus);
    };
  }, []);

  return state;
}

/**
 * A slim strip for the top of a page whose lists are showing their failure
 * state. Renders nothing while the backend answers, so it cannot become noise
 * on a healthy run.
 */
export function BackendBanner() {
  const reachable = useBackendReachable();
  if (reachable !== 'down') return null;
  return (
    <div
      role="status"
      style={{
        position: 'absolute', top: 0, left: 0, right: 0, zIndex: 20,
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        padding: '6px 14px',
        background: 'var(--bg-3)', borderBottom: '1px solid var(--status-warn)',
        color: 'var(--fg-1)', fontSize: 12,
      }}
    >
      <Lu name="wifi-off" size={13} color="var(--status-warn)" />
      <span className="cjk">连不上服务器 · 下面的列表可能是空的，也可能只是没读到</span>
    </div>
  );
}