import { Bell, ChevronDown, Minus, Square, X } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/app/theme-toggle';
import { cn } from '@/lib/utils';
import type { Page } from '@/App';

interface TitleBarProps {
  page: Page;
  onNavigate: (p: Page) => void;
}

const tabs: { id: Page; label: string; mono: string }[] = [
  { id: 'lobby', label: 'Lobby', mono: '01' },
  { id: 'room', label: 'Room', mono: '02' },
  { id: 'channels', label: 'Channels', mono: '03' },
  { id: 'friends', label: 'Friends', mono: '04' },
];

export function TitleBar({ page, onNavigate }: TitleBarProps) {
  return (
    <header
      className={cn(
        'titlebar-drag relative flex h-12 select-none items-center gap-5 border-b px-3',
        'bg-sidebar/95 backdrop-blur-xl',
      )}
    >
      {/* Top chrome highlight */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-foreground/10 to-transparent" />

      {/* Brand */}
      <div className="titlebar-no-drag flex items-center gap-2.5">
        <BrandMark />
        <div className="flex items-baseline gap-2">
          <span className="font-display text-[14px] font-bold tracking-[0.06em]">
            TH-PLATFORM
          </span>
          <span className="rounded-sm border border-border/70 bg-background/40 px-1.5 py-px font-mono text-[9.5px] font-medium uppercase tracking-wider text-muted-foreground">
            v0.1.0 alpha
          </span>
        </div>
      </div>

      {/* Top nav — pill cluster with mono numerals */}
      <nav className="titlebar-no-drag flex items-center gap-0.5 rounded-md border border-border/70 bg-background/30 p-0.5 shadow-[inset_0_1px_0_hsl(var(--foreground)/0.04)]">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => onNavigate(t.id)}
            className={cn(
              'group relative inline-flex items-center gap-1.5 rounded px-3 py-1 font-display text-[11.5px] font-semibold uppercase tracking-[0.14em] transition-colors',
              page === t.id
                ? 'text-foreground'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {page === t.id && (
              <span className="absolute inset-0 rounded bg-card-elev shadow-[inset_0_1px_0_hsl(var(--foreground)/0.06)]" />
            )}
            <span className="relative font-mono text-[9px] text-muted-foreground/70">
              {t.mono}
            </span>
            <span className="relative">{t.label}</span>
            {page === t.id && (
              <span className="relative -ml-0.5 h-1 w-1 rounded-full bg-plasma shadow-[0_0_6px_hsl(var(--plasma)/0.9)]" />
            )}
          </button>
        ))}
      </nav>

      {/* Right cluster */}
      <div className="titlebar-no-drag ml-auto flex items-center gap-1.5">
        <ThemeToggle />
        <Button variant="ghost" size="icon-sm" aria-label="Notifications">
          <Bell />
        </Button>

        <button
          className={cn(
            'flex items-center gap-2 rounded-full border border-border/70 bg-background/40 py-0.5 pl-0.5 pr-2.5',
            'font-mono text-[11.5px] font-medium uppercase tracking-wider text-foreground/85',
            'transition-colors hover:bg-card-elev',
            'shadow-[inset_0_1px_0_hsl(var(--foreground)/0.05)]',
          )}
        >
          <Avatar className="h-5 w-5 ring-1 ring-plasma/40">
            <AvatarFallback name="dwgx" />
          </Avatar>
          <span>dwgx</span>
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-pulse-soft rounded-full bg-success opacity-70" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-success" />
          </span>
          <ChevronDown className="-ml-0.5 h-3 w-3 text-muted-foreground" />
        </button>

        <div className="ml-1 flex items-center">
          <button
            className="grid h-7 w-9 place-items-center rounded text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            aria-label="Minimize"
          >
            <Minus className="h-3.5 w-3.5" />
          </button>
          <button
            className="grid h-7 w-9 place-items-center rounded text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            aria-label="Maximize"
          >
            <Square className="h-3 w-3" />
          </button>
          <button
            className="grid h-7 w-9 place-items-center rounded text-muted-foreground transition-colors hover:bg-destructive hover:text-destructive-foreground"
            aria-label="Close"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
}

function BrandMark() {
  return (
    <div className="relative h-7 w-7 shrink-0">
      <svg
        viewBox="0 0 32 32"
        className="absolute inset-0 h-full w-full"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="brandGradPrime" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="hsl(var(--plasma))" />
            <stop offset="100%" stopColor="hsl(var(--arc))" />
          </linearGradient>
          <linearGradient id="brandGradStroke" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(255,255,255,0.85)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0.55)" />
          </linearGradient>
        </defs>
        <rect
          width="32"
          height="32"
          rx="7"
          fill="url(#brandGradPrime)"
          className="drop-shadow-[0_2px_8px_hsl(var(--plasma)/0.6)]"
        />
        <rect
          x="0.5"
          y="0.5"
          width="31"
          height="31"
          rx="6.5"
          fill="none"
          stroke="rgba(255,255,255,0.18)"
        />
        <path
          d="M8 11 H24"
          stroke="url(#brandGradStroke)"
          strokeWidth="2.6"
          strokeLinecap="round"
        />
        <path
          d="M16 11 V23"
          stroke="url(#brandGradStroke)"
          strokeWidth="2.6"
          strokeLinecap="round"
        />
        <circle cx="22.5" cy="22" r="1.6" fill="white" />
      </svg>
      {/* Outer halo */}
      <div className="pointer-events-none absolute inset-0 rounded-md shadow-[0_0_20px_-4px_hsl(var(--plasma)/0.6)]" />
    </div>
  );
}
