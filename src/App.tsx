import { useState, useCallback, useEffect } from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';
import { Lobby } from '@/pages/lobby';
import { Room } from '@/pages/room';
import { Group } from '@/pages/group';
import { DM } from '@/pages/dm';
import { ProfileFull, ProfilePopover } from '@/pages/profile';
import { Settings } from '@/pages/settings';
import { ToastHost } from '@/components/design/ui';
import { useTheme, type Theme } from '@/lib/theme';
import { useRoute, type Route } from '@/router';

export type { Theme };

type ToastMsg = { id: number; tone?: string; title: string; body?: string };

export default function App() {
  const [route, navigate] = useRoute();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const t = resolvedTheme;
  const [toasts, setToasts] = useState<ToastMsg[]>([]);

  const showToast = useCallback((msg: { tone?: string; title: string; body?: string }) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, ...msg }]);
    setTimeout(() => setToasts((prev) => prev.filter((m) => m.id !== id)), 3200);
  }, []);
  const closeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((m) => m.id !== id));
  }, []);

  // ESC closes settings
  useEffect(() => {
    if (route.name !== 'settings') return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') navigate({ name: 'lobby' }); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [route.name, navigate]);

  return (
    <div className="relative h-full w-full">
      {route.name === 'lobby' && (
        <Lobby theme={t} gameId={route.gameId || 'th08'} onNavigate={navigate} onToast={showToast} />
      )}
      {route.name === 'room' && (
        <Room theme={t} state={route.state || 'lobby'} id={route.id} onNavigate={navigate} onToast={showToast} />
      )}
      {route.name === 'group' && (
        <Group theme={t} handle={route.handle} onNavigate={navigate} onToast={showToast} />
      )}
      {route.name === 'dm' && (
        <DM theme={t} view={route.view || 'friends'} peer={route.peer} onNavigate={navigate} onToast={showToast} />
      )}
      {route.name === 'profile' && !route.popover && (
        <ProfileFull theme={t} handle={route.handle} onNavigate={navigate} onToast={showToast} />
      )}
      {route.name === 'profile' && route.popover && (
        <div style={{ position: 'fixed', inset: 0, display: 'grid', placeItems: 'center', background: 'rgba(0,0,0,0.45)', zIndex: 50 }}
             onClick={() => navigate({ name: 'lobby' })}>
          <div onClick={(e) => e.stopPropagation()} className={`thp theme-${t}`}>
            <ProfilePopover onMessage={() => navigate({ name: 'dm', view: 'dm', peer: 'yuyuko' })} />
          </div>
        </div>
      )}
      {route.name === 'settings' && (
        <Settings
          theme={t}
          section={route.section || 'appear'}
          onClose={() => navigate({ name: 'lobby' })}
          onSetTheme={(th) => setTheme(th as Theme)}
          onToast={showToast}
        />
      )}

      <ToastHost toasts={toasts} onClose={closeToast} />

      <DevSwitcher route={route} onNavigate={navigate} theme={theme} setTheme={setTheme} />
    </div>
  );
}

const PAGES: { route: Route; label: string }[] = [
  { route: { name: 'lobby', gameId: 'th08' }, label: 'Lobby' },
  { route: { name: 'room', id: 4912, state: 'lobby' }, label: 'Room' },
  { route: { name: 'room', id: 4912, state: 'post' }, label: 'Room · POST' },
  { route: { name: 'group', handle: 'yegumi' }, label: 'Group' },
  { route: { name: 'dm', view: 'friends' }, label: 'Friends' },
  { route: { name: 'dm', view: 'dm', peer: 'sakuya' }, label: 'DM' },
  { route: { name: 'profile' }, label: 'Profile' },
  { route: { name: 'profile', popover: true }, label: 'Profile · Popover' },
  { route: { name: 'settings', section: 'appear' }, label: 'Settings' },
];

function isActive(route: Route, target: Route): boolean {
  if (route.name !== target.name) return false;
  if (route.name === 'room' && target.name === 'room') {
    return (route.state || 'lobby') === (target.state || 'lobby');
  }
  if (route.name === 'dm' && target.name === 'dm') {
    return (route.view || 'friends') === (target.view || 'friends');
  }
  if (route.name === 'profile' && target.name === 'profile') {
    return !!route.popover === !!target.popover;
  }
  return true;
}

function DevSwitcher({
  route,
  onNavigate,
  theme,
  setTheme,
}: {
  route: Route;
  onNavigate: (r: Route) => void;
  theme: Theme;
  setTheme: (t: Theme) => void;
}) {
  return (
    <div
      style={{
        position: 'fixed', right: 16, bottom: 16, zIndex: 999,
        display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8,
        fontFamily: "'Manrope', 'PingFang SC', 'Microsoft YaHei', system-ui, sans-serif",
      }}
    >
      <div
        style={{
          display: 'flex', gap: 4, padding: 4, borderRadius: 999,
          background: 'rgba(15, 16, 20, 0.92)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: '0 8px 20px rgba(0,0,0,0.30)',
          backdropFilter: 'blur(12px)',
        }}
      >
        {(['light', 'dark', 'system'] as Theme[]).map((m) => {
          const active = theme === m;
          const Icon = m === 'light' ? Sun : m === 'dark' ? Moon : Monitor;
          return (
            <button
              key={m}
              onClick={() => setTheme(m)}
              style={{
                width: 28, height: 28, display: 'grid', placeItems: 'center',
                borderRadius: 999, border: 'none',
                background: active ? '#C8CDD3' : 'transparent',
                color: active ? '#0A0B0D' : 'rgba(236,237,239,0.7)',
                cursor: 'pointer', lineHeight: 1,
              }}
              title={m}
            >
              <Icon size={14} strokeWidth={1.75} />
            </button>
          );
        })}
      </div>
      <div
        style={{
          display: 'flex', flexWrap: 'wrap', gap: 4, maxWidth: 360,
          justifyContent: 'flex-end', padding: 6, borderRadius: 12,
          background: 'rgba(15, 16, 20, 0.92)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: '0 8px 20px rgba(0,0,0,0.30)',
          backdropFilter: 'blur(12px)',
        }}
      >
        {PAGES.map((p) => {
          const active = isActive(route, p.route);
          return (
            <button
              key={p.label}
              onClick={() => onNavigate(p.route)}
              style={{
                height: 24, paddingInline: 9, borderRadius: 6,
                border: '1px solid',
                borderColor: active ? '#C8CDD3' : 'rgba(255,255,255,0.06)',
                background: active ? '#C8CDD3' : 'rgba(255,255,255,0.04)',
                color: active ? '#0A0B0D' : 'rgba(236,237,239,0.78)',
                fontSize: 11.5, fontFamily: "'Manrope', system-ui, sans-serif",
                fontWeight: 600, cursor: 'pointer',
              }}
            >
              {p.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
