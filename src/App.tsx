import { useState } from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';
import { Lobby } from '@/pages/lobby';
import { Room } from '@/pages/room';
import { Group } from '@/pages/group';
import { DM } from '@/pages/dm';
import { ProfileFull, ProfilePopover } from '@/pages/profile';
import { Settings } from '@/pages/settings';
import { useTheme, type Theme } from '@/lib/theme';

type Page =
  | 'lobby'
  | 'room'
  | 'room-post'
  | 'group'
  | 'dm-friends'
  | 'dm-chat'
  | 'profile'
  | 'profile-popover'
  | 'settings';

export type { Theme };

export default function App() {
  const [page, setPage] = useState<Page>('lobby');
  const { theme, setTheme, resolvedTheme } = useTheme();
  const t = resolvedTheme;

  return (
    <div className="relative h-full w-full">
      {page === 'lobby' && <Lobby theme={t} />}
      {page === 'room' && <Room theme={t} state="lobby" />}
      {page === 'room-post' && <Room theme={t} state="post" />}
      {page === 'group' && <Group theme={t} />}
      {page === 'dm-friends' && <DM theme={t} view="friends" />}
      {page === 'dm-chat' && <DM theme={t} view="dm" />}
      {page === 'profile' && <ProfileFull theme={t} />}
      {page === 'profile-popover' && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            display: 'grid',
            placeItems: 'center',
            background: 'rgba(0,0,0,0.45)',
          }}
        >
          <ProfilePopover theme={t} />
        </div>
      )}
      {page === 'settings' && (
        <Settings theme={t} onClose={() => setPage('lobby')} />
      )}

      <DevSwitcher
        page={page}
        onPick={setPage}
        theme={theme}
        setTheme={setTheme}
      />
    </div>
  );
}

const PAGES: { id: Page; label: string }[] = [
  { id: 'lobby', label: 'Lobby' },
  { id: 'room', label: 'Room' },
  { id: 'room-post', label: 'Room · POST' },
  { id: 'group', label: 'Group' },
  { id: 'dm-friends', label: 'Friends' },
  { id: 'dm-chat', label: 'DM' },
  { id: 'profile', label: 'Profile' },
  { id: 'profile-popover', label: 'Profile · Popover' },
  { id: 'settings', label: 'Settings' },
];

function DevSwitcher({
  page,
  onPick,
  theme,
  setTheme,
}: {
  page: Page;
  onPick: (p: Page) => void;
  theme: Theme;
  setTheme: (t: Theme) => void;
}) {
  return (
    <div
      style={{
        position: 'fixed',
        right: 16,
        bottom: 16,
        zIndex: 999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        gap: 8,
        fontFamily:
          "'Manrope', 'PingFang SC', 'Microsoft YaHei', system-ui, sans-serif",
      }}
    >
      <div
        style={{
          display: 'flex',
          gap: 4,
          padding: 4,
          borderRadius: 999,
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
                width: 28,
                height: 28,
                display: 'grid',
                placeItems: 'center',
                borderRadius: 999,
                border: 'none',
                background: active ? '#C8CDD3' : 'transparent',
                color: active ? '#0A0B0D' : 'rgba(236,237,239,0.7)',
                cursor: 'pointer',
                lineHeight: 1,
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
          display: 'flex',
          flexWrap: 'wrap',
          gap: 4,
          maxWidth: 360,
          justifyContent: 'flex-end',
          padding: 6,
          borderRadius: 12,
          background: 'rgba(15, 16, 20, 0.92)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: '0 8px 20px rgba(0,0,0,0.30)',
          backdropFilter: 'blur(12px)',
        }}
      >
        {PAGES.map((p) => {
          const active = page === p.id;
          return (
            <button
              key={p.id}
              onClick={() => onPick(p.id)}
              style={{
                height: 24,
                paddingInline: 9,
                borderRadius: 6,
                border: '1px solid',
                borderColor: active ? '#C8CDD3' : 'rgba(255,255,255,0.06)',
                background: active ? '#C8CDD3' : 'rgba(255,255,255,0.04)',
                color: active ? '#0A0B0D' : 'rgba(236,237,239,0.78)',
                fontSize: 11.5,
                fontFamily: "'Manrope', system-ui, sans-serif",
                fontWeight: 600,
                cursor: 'pointer',
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
