import { Compass, Plus, Settings as SettingsIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { Page } from '@/App';

interface RailProps {
  page: Page;
  onNavigate: (p: Page) => void;
}

const games = [
  { id: 'TH06', label: 'TH06 EoSD' },
  { id: 'TH07', label: 'TH07 PCB' },
  { id: 'TH08', label: 'TH08 IN', current: true },
  { id: 'TH09', label: 'TH09 PoFV' },
];

export function Rail({ page, onNavigate }: RailProps) {
  return (
    <TooltipProvider delayDuration={300}>
      <aside className="flex w-[60px] flex-col items-center gap-1.5 border-r bg-sidebar py-2.5">
        <Tile
          glyph="H"
          label="Home"
          variant="brand"
          active={page === 'lobby'}
          onClick={() => onNavigate('lobby')}
        />
        <Divider />
        {games.map((g) => (
          <Tile
            key={g.id}
            glyph={g.id.slice(2)}
            label={g.label}
            variant="game"
            current={g.current}
          />
        ))}
        <Tile glyph={<Plus className="h-4 w-4" />} label="Add server" variant="add" />

        <div className="flex-1" />

        <Tile
          glyph={<Compass className="h-[18px] w-[18px]" />}
          label="Discover"
          variant="ghost"
        />
        <Tile
          glyph={<SettingsIcon className="h-[18px] w-[18px]" />}
          label="Settings"
          variant="ghost"
          onClick={() => onNavigate('settings')}
          active={page === 'settings'}
        />
      </aside>
    </TooltipProvider>
  );
}

function Divider() {
  return <div className="my-1 h-px w-6 rounded-full bg-border" />;
}

interface TileProps {
  glyph: React.ReactNode;
  label: string;
  variant?: 'brand' | 'game' | 'add' | 'ghost';
  current?: boolean;
  active?: boolean;
  onClick?: () => void;
}

function Tile({
  glyph,
  label,
  variant = 'game',
  current = false,
  active = false,
  onClick,
}: TileProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={onClick}
          aria-label={label}
          className={cn(
            'group relative grid h-10 w-10 place-items-center rounded-[11px] font-mono text-[11.5px] font-semibold transition-all',
            variant === 'brand' &&
              'bg-primary/15 text-primary ring-1 ring-primary/25 hover:rounded-[13px] hover:bg-primary/20',
            variant === 'game' &&
              'bg-secondary text-muted-foreground hover:rounded-[13px] hover:bg-muted hover:text-foreground',
            variant === 'add' &&
              'border border-dashed border-border bg-transparent text-muted-foreground hover:border-primary hover:text-primary',
            variant === 'ghost' &&
              'bg-transparent text-muted-foreground hover:rounded-[11px] hover:bg-muted hover:text-foreground',
            active && 'bg-secondary text-foreground',
          )}
        >
          {current && (
            <span
              aria-hidden
              className="absolute -left-2.5 top-1.5 h-7 w-[3px] rounded-r-full bg-primary shadow-[0_0_8px_rgba(110,131,245,0.6)]"
            />
          )}
          {glyph}
        </button>
      </TooltipTrigger>
      <TooltipContent side="right" className="text-[11px]">
        {label}
      </TooltipContent>
    </Tooltip>
  );
}
