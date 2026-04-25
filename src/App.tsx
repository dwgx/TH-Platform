import { Monitor, Moon, Sun } from 'lucide-react';
import { LobbyPage } from '@/pages/lobby';
import { useTheme, type Theme } from '@/lib/theme';

// Legacy type used by older shadcn-era components (rail.tsx, title-bar.tsx,
// room.tsx) which are no longer mounted. Kept exported so those files still
// type-check until they are deleted in a follow-up cleanup.
export type Page = 'lobby' | 'room' | 'channels' | 'friends' | 'settings';

export default function App() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  return (
    <div className="relative h-full w-full">
      <LobbyPage theme={resolvedTheme} />
      <ThemeFloatingToggle theme={theme} setTheme={setTheme} />
    </div>
  );
}

function ThemeFloatingToggle({
  theme,
  setTheme,
}: {
  theme: Theme;
  setTheme: (t: Theme) => void;
}) {
  const opts: { id: Theme; label: string; icon: typeof Sun }[] = [
    { id: 'light', label: 'Light', icon: Sun },
    { id: 'dark', label: 'Dark', icon: Moon },
    { id: 'system', label: 'System', icon: Monitor },
  ];
  return (
    <div
      style={{
        position: 'fixed',
        right: 16,
        bottom: 16,
        zIndex: 50,
        display: 'flex',
        gap: 4,
        padding: 4,
        borderRadius: 999,
        background: 'rgba(20, 22, 36, 0.78)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        boxShadow: '0 8px 24px rgba(0,0,0,0.35)',
      }}
    >
      {opts.map((o) => {
        const Icon = o.icon;
        const active = theme === o.id;
        return (
          <button
            key={o.id}
            onClick={() => setTheme(o.id)}
            title={o.label}
            aria-label={o.label}
            style={{
              width: 30,
              height: 30,
              display: 'grid',
              placeItems: 'center',
              borderRadius: 999,
              border: 'none',
              background: active ? '#7C5CFF' : 'transparent',
              color: active ? '#fff' : 'rgba(255,255,255,0.65)',
              cursor: 'pointer',
              transition: 'background 0.15s, color 0.15s',
            }}
          >
            <Icon className="h-3.5 w-3.5" />
          </button>
        );
      })}
    </div>
  );
}
