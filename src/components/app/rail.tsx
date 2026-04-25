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
      <aside className="flex w-[64px] flex-col items-center gap-1.5 border-r bg-sidebar/70 py-3 backdrop-blur-xl">
        <Tile
          glyph="TH"
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
        <Tile
          glyph={<Plus className="h-4 w-4" />}
          label="Add server"
          variant="add"
        />

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
  return (
    <div className="my-1 h-px w-7 bg-gradient-to-r from-transparent via-border to-transparent" />
  );
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
            'group relative grid h-11 w-11 place-items-center rounded font-mono text-[11px] font-bold uppercase tracking-wider transition-all duration-200',
            variant === 'brand' &&
              'bg-gradient-to-br from-plasma to-arc text-white ring-1 ring-plasma/30 shadow-[0_4px_16px_-4px_hsl(var(--plasma)/0.6)] hover:shadow-[0_4px_24px_-4px_hsl(var(--plasma)/0.85)]',
            variant === 'game' &&
              'bg-card-elev text-muted-foreground border border-border/50 hover:border-plasma/40 hover:text-foreground hover:bg-card',
            variant === 'add' &&
              'border border-dashed border-border bg-transparent text-muted-foreground hover:border-plasma hover:text-plasma hover:bg-plasma/5',
            variant === 'ghost' &&
              'bg-transparent text-muted-foreground hover:bg-card-elev hover:text-foreground',
            active && variant === 'ghost' && 'bg-card-elev text-foreground',
            current && 'border-plasma/50 text-foreground bg-card',
          )}
        >
          {current && (
            <span
              aria-hidden
              className="absolute -left-3 top-1/2 h-7 w-[3px] -translate-y-1/2 rounded-r-full bg-plasma shadow-[0_0_10px_hsl(var(--plasma)/0.85)]"
            />
          )}
          {glyph}
        </button>
      </TooltipTrigger>
      <TooltipContent side="right" className="font-mono text-[10.5px] uppercase tracking-wider">
        {label}
      </TooltipContent>
    </Tooltip>
  );
}
