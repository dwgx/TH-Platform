import { Filter, ListOrdered, Plus, Sparkles } from 'lucide-react';
import { Navigator } from '@/components/app/navigator';
import { ServerCard } from '@/components/app/server-card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { rooms } from '@/data/mock';

export function LobbyPage() {
  return (
    <div className="flex flex-1 min-w-0">
      <Navigator />

      <ScrollArea className="flex-1 bg-background">
        <div className="flex flex-col gap-4 p-6">
          {/* Page header */}
          <header className="flex items-end justify-between gap-4">
            <div>
              <h1 className="text-[22px] font-bold tracking-tight">
                TH08 · Imperishable Night
              </h1>
              <p className="mt-1 text-[12.5px] text-muted-foreground">
                12 active rooms · 47 players online
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              <Button variant="secondary" size="sm">
                <ListOrdered />
                Sort: Ping
              </Button>
              <Button variant="secondary" size="icon-sm" aria-label="Filter">
                <Filter />
              </Button>
              <Button size="sm">
                <Plus />
                New room
              </Button>
            </div>
          </header>

          {/* Featured */}
          <section className="relative overflow-hidden rounded-xl border bg-card">
            <div className="absolute inset-0 bg-[linear-gradient(135deg,#1B1F30_0%,#1A1827_60%,#251D38_100%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_80%_at_85%_-20%,rgba(110,131,245,0.45),transparent_65%)]" />
            <div className="relative flex flex-col gap-2 p-6 max-w-[680px]">
              <div className="flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-[0.18em] text-primary">
                <Sparkles className="h-3 w-3" />
                Featured · Tonight
              </div>
              <h2 className="text-[19px] font-bold tracking-tight text-white">
                深夜大乱斗 — 永夜抄 · Lunatic 联机
              </h2>
              <p className="text-[13px] text-zinc-300">
                每周五 23:00 起，开放 6 桌。前 3 名通关进周榜。
              </p>
              <div className="mt-2 flex gap-2">
                <Button size="sm">Join the table</Button>
                <Button variant="ghost" size="sm" className="text-zinc-300 hover:bg-white/10 hover:text-white">
                  Details
                </Button>
              </div>
            </div>
          </section>

          {/* Card grid */}
          <div className="grid grid-cols-[repeat(auto-fill,minmax(290px,1fr))] gap-3.5">
            {rooms.map((r) => (
              <ServerCard key={r.id} room={r} />
            ))}
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
