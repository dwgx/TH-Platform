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

const tabs: { id: Page; label: string }[] = [
  { id: 'lobby', label: 'Lobby' },
  { id: 'room', label: 'Room' },
  { id: 'channels', label: 'Channels' },
  { id: 'friends', label: 'Friends' },
];

export function TitleBar({ page, onNavigate }: TitleBarProps) {
  return (
    <header className="titlebar-drag flex h-11 select-none items-center gap-5 border-b bg-sidebar px-3">
      {/* Brand */}
      <div className="titlebar-no-drag flex items-center gap-2.5">
        <BrandMark />
        <div className="flex items-baseline gap-2">
          <span className="text-[13px] font-semibold tracking-tight">
            TH-Platform
          </span>
          <span className="rounded border bg-muted/50 px-1.5 py-px font-mono text-[10px] text-muted-foreground">
            v0.1.0
          </span>
        </div>
      </div>

      {/* Top nav */}
      <nav className="titlebar-no-drag flex items-center gap-0.5">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => onNavigate(t.id)}
            className={cn(
              'rounded-md px-3 py-1 text-[12.5px] font-medium transition-colors',
              page === t.id
                ? 'bg-secondary text-foreground'
                : 'text-muted-foreground hover:bg-accent hover:text-foreground',
            )}
          >
            {t.label}
          </button>
        ))}
      </nav>

      {/* Right cluster */}
      <div className="titlebar-no-drag ml-auto flex items-center gap-1">
        <ThemeToggle />
        <Button variant="ghost" size="icon-sm" aria-label="Notifications">
          <Bell />
        </Button>

        <button className="titlebar-no-drag flex items-center gap-2 rounded-full border bg-muted/40 py-0.5 pl-0.5 pr-2.5 text-[12px] font-medium transition-colors hover:bg-muted">
          <Avatar className="h-5 w-5">
            <AvatarFallback name="dwgx" />
          </Avatar>
          <span>dwgx</span>
          <span className="h-1.5 w-1.5 rounded-full bg-success" />
          <ChevronDown className="-ml-0.5 h-3 w-3 text-muted-foreground" />
        </button>

        <div className="ml-1 flex items-center">
          <button
            className="grid h-7 w-8 place-items-center rounded text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            aria-label="Minimize"
          >
            <Minus className="h-3.5 w-3.5" />
          </button>
          <button
            className="grid h-7 w-8 place-items-center rounded text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            aria-label="Maximize"
          >
            <Square className="h-3 w-3" />
          </button>
          <button
            className="grid h-7 w-8 place-items-center rounded text-muted-foreground transition-colors hover:bg-destructive hover:text-destructive-foreground"
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
    <svg
      viewBox="0 0 32 32"
      className="h-[22px] w-[22px] shrink-0"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="brandGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#8597F7" />
          <stop offset="100%" stopColor="#4F62D6" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="9" fill="url(#brandGrad)" />
      <path
        d="M8 11 H24"
        stroke="white"
        strokeWidth="2.6"
        strokeLinecap="round"
        opacity="0.96"
      />
      <path
        d="M16 11 V23"
        stroke="white"
        strokeWidth="2.6"
        strokeLinecap="round"
        opacity="0.96"
      />
      <circle cx="22.5" cy="22" r="1.6" fill="white" opacity="0.9" />
    </svg>
  );
}
