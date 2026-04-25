import { Filter, ListOrdered, Plus, Search } from 'lucide-react';
import { Navigator } from '@/components/app/navigator';
import { ServerCard } from '@/components/app/server-card';
import { FeaturedBanner } from '@/components/app/featured-banner';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { rooms } from '@/data/mock';

export function LobbyPage() {
  return (
    <div className="flex flex-1 min-w-0">
      <Navigator />

      <ScrollArea className="flex-1">
        <div className="flex flex-col gap-5 p-6">
          {/* Page header */}
          <header className="flex items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 font-mono text-[10.5px] font-medium uppercase tracking-[0.22em] text-plasma">
                <span className="block h-px w-4 bg-plasma" />
                Imperishable Night · TH08
              </div>
              <h1 className="mt-2 font-display text-[28px] font-bold leading-none tracking-tight">
                LOBBY <span className="text-muted-foreground">/ Beijing</span>
              </h1>
              <p className="mt-2 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                12 Active rooms · 47 Players online · 24ms RTT
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Find a room…"
                  className="h-8 w-[200px] rounded-md border border-border bg-card/40 pl-8 pr-3 font-mono text-[12px] placeholder:text-muted-foreground focus:border-plasma focus:outline-none focus:ring-2 focus:ring-plasma/25"
                />
              </div>
              <Button variant="secondary" size="sm" className="font-mono text-[11px] uppercase tracking-wider">
                <ListOrdered />
                Sort: Ping
              </Button>
              <Button
                variant="secondary"
                size="icon-sm"
                aria-label="Filter"
                className="border border-border"
              >
                <Filter />
              </Button>
              <button
                className="group/cta relative inline-flex h-8 items-center gap-1.5 overflow-hidden rounded-md bg-gradient-to-b from-plasma to-plasma/80 px-4 font-display text-[11px] font-bold uppercase tracking-[0.16em] text-white bevel-edge ring-1 ring-plasma/30 transition-all duration-150 hover:from-plasma hover:to-plasma/95 active:scale-[0.98]"
              >
                <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-700 group-hover/cta:translate-x-full" />
                <span className="relative flex items-center gap-1.5">
                  <Plus className="h-3.5 w-3.5" />
                  New room
                </span>
              </button>
            </div>
          </header>

          {/* Featured strip — asymmetric hero + telemetry */}
          <FeaturedBanner />

          {/* Section divider */}
          <div className="flex items-center gap-3 pt-2">
            <div className="font-mono text-[10.5px] font-bold uppercase tracking-[0.22em] text-muted-foreground">
              Active Rooms
            </div>
            <div className="h-px flex-1 bg-gradient-to-r from-border to-transparent" />
            <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              {rooms.length} live
            </div>
          </div>

          {/* Card grid */}
          <div className="grid grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-4">
            {rooms.map((r, i) => (
              <div
                key={r.id}
                className="animate-fade-in"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <ServerCard room={r} />
              </div>
            ))}
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
