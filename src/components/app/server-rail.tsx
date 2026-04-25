import { Compass, Plus, Settings as SettingsIcon, Users } from 'lucide-react';
import type { Page } from '@/types';
import { cn } from '@/lib/utils';

const games = [
  { id: 'TH06', label: 'TH06 — Embodiment of Scarlet Devil',     bg: 'from-rose-500 to-rose-700' },
  { id: 'TH07', label: 'TH07 — Perfect Cherry Blossom',          bg: 'from-emerald-500 to-emerald-700' },
  { id: 'TH08', label: 'TH08 — Imperishable Night',              bg: 'from-violet-500 to-violet-700', current: true },
  { id: 'TH09', label: 'TH09 — Phantasmagoria of Flower View',   bg: 'from-amber-500 to-amber-700' },
];

interface ServerRailProps {
  page: Page;
  onNavigate: (p: Page) => void;
}

export function ServerRail({ page, onNavigate }: ServerRailProps) {
  return (
    <aside className="flex w-[72px] flex-col items-center gap-2 bg-rail py-3 shrink-0">
      {/* Home / Friends */}
      <Tile
        active={page === 'friends'}
        onClick={() => onNavigate('friends')}
        title="Friends"
        kind="brand"
      >
        <Users className="h-5 w-5" />
      </Tile>
      <Divider />

      {/* Games */}
      {games.map((g) => (
        <Tile
          key={g.id}
          active={page === 'lobby' && g.current}
          unread={g.id === 'TH07'}
          title={g.label}
          onClick={() => onNavigate('lobby')}
        >
          <span
            className={cn(
              'h-full w-full rounded-[inherit] bg-gradient-to-br grid place-items-center text-white font-bold text-[12px] tracking-tight',
              g.bg,
            )}
          >
            {g.id.slice(2)}
          </span>
        </Tile>
      ))}

      {/* Add server */}
      <Tile add title="Add a game" onClick={() => undefined}>
        <Plus className="h-5 w-5" />
      </Tile>
      <Tile title="Discover" onClick={() => undefined}>
        <Compass className="h-5 w-5" />
      </Tile>

      <div className="flex-1" />

      {/* Settings */}
      <Tile
        active={page === 'settings'}
        onClick={() => onNavigate('settings')}
        title="Settings"
      >
        <SettingsIcon className="h-5 w-5" />
      </Tile>
    </aside>
  );
}

function Divider() {
  return <span className="my-1 h-px w-8 bg-floating/60" aria-hidden />;
}

interface TileProps {
  children: React.ReactNode;
  active?: boolean;
  unread?: boolean;
  add?: boolean;
  title: string;
  kind?: 'default' | 'brand';
  onClick?: () => void;
}

function Tile({
  children,
  active,
  unread,
  add,
  title,
  kind = 'default',
  onClick,
}: TileProps) {
  return (
    <div className="relative flex w-full items-center justify-center">
      {/* Active / unread indicator pill on far left */}
      <span
        className={cn(
          'absolute -left-0 w-[4px] rounded-r-full bg-header transition-all',
          active ? 'h-10' : unread ? 'h-2' : 'h-0',
        )}
      />
      <button
        onClick={onClick}
        title={title}
        aria-label={title}
        className={cn(
          'group relative h-12 w-12 grid place-items-center overflow-hidden transition-all duration-150',
          active
            ? 'rounded-2xl bg-brand text-brand-foreground'
            : kind === 'brand'
              ? 'rounded-3xl bg-floating text-brand hover:rounded-2xl hover:bg-brand hover:text-brand-foreground'
              : 'rounded-3xl bg-floating text-body hover:rounded-2xl hover:bg-brand hover:text-brand-foreground',
          add &&
            'rounded-3xl border-0 bg-floating text-success hover:rounded-2xl hover:bg-success hover:text-brand-foreground',
        )}
      >
        {children}
      </button>
    </div>
  );
}
