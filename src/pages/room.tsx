import { useState } from 'react';
import { ArrowLeft, Clipboard, Crown, Plus, Settings as SettingsIcon, Sparkles } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RoomCover } from '@/components/app/room-cover';
import { rooms } from '@/data/mock';
import { cn } from '@/lib/utils';
import type { Page } from '@/App';

interface RoomPageProps {
  onNavigate: (p: Page) => void;
}

export function RoomPage({ onNavigate }: RoomPageProps) {
  const room = rooms[0]; // demo: first room
  const [ready, setReady] = useState(false);

  return (
    <div className="flex flex-1 flex-col bg-background">
      {/* Top bar */}
      <header className="flex h-14 items-center gap-4 border-b bg-card/50 px-4">
        <Button variant="ghost" size="sm" onClick={() => onNavigate('lobby')}>
          <ArrowLeft />
          Back to lobby
        </Button>
        <div className="flex-1 text-center">
          <div className="flex items-center justify-center gap-2 text-[15px] font-semibold">
            {room.name}
          </div>
          <div className="mt-0.5 flex items-center justify-center gap-2 font-mono text-[10.5px] text-muted-foreground">
            <span>🏛️ {room.kind}</span>
            <span>·</span>
            <span>{room.game}</span>
            <span>·</span>
            <span>Host {room.players[0]?.name}</span>
            <span>·</span>
            <span className="text-success">{room.pingMs}ms</span>
            <span>·</span>
            <span>{room.players.length}/{room.capacity}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="default">Public</Badge>
          <Button variant="secondary" size="sm">
            <Clipboard />
            Copy invite
          </Button>
          <Button variant="ghost" size="icon-sm" aria-label="Room settings">
            <SettingsIcon />
          </Button>
        </div>
      </header>

      {/* Main */}
      <div className="grid flex-1 grid-cols-[1fr_360px] gap-4 overflow-hidden p-4">
        {/* Seats */}
        <ScrollArea>
          <section className="space-y-3">
            <h2 className="text-[12.5px] font-semibold uppercase tracking-wider text-muted-foreground">
              Seats
            </h2>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => {
                const player = room.players[i];
                if (!player) {
                  return (
                    <div
                      key={i}
                      className="flex h-44 flex-col items-center justify-center gap-2 rounded-xl border border-dashed bg-card/30 text-muted-foreground transition-colors hover:border-primary hover:bg-primary/5 hover:text-primary"
                    >
                      <Plus className="h-5 w-5" />
                      <span className="text-xs font-medium">Invite player</span>
                    </div>
                  );
                }
                return (
                  <article
                    key={i}
                    className={cn(
                      'flex h-44 flex-col items-center justify-center gap-2 overflow-hidden rounded-xl border bg-card p-4',
                      player.isHost && 'border-primary/40 ring-1 ring-primary/20',
                    )}
                  >
                    <div className="relative">
                      <Avatar className="h-14 w-14 ring-2 ring-background">
                        <AvatarFallback name={player.name} />
                      </Avatar>
                      {player.isHost && (
                        <span className="absolute -right-1 -top-1 grid h-5 w-5 place-items-center rounded-full border-2 border-card bg-amber-400 text-amber-950">
                          <Crown className="h-3 w-3" />
                        </span>
                      )}
                    </div>
                    <div className="text-center">
                      <div className="text-[13px] font-semibold">{player.name}</div>
                      <div className="font-mono text-[10.5px] text-muted-foreground">
                        @{player.name}
                      </div>
                    </div>
                    <Badge variant={i === 0 ? 'success' : 'secondary'}>
                      {i === 0 ? 'Ready' : 'Picking'}
                    </Badge>
                  </article>
                );
              })}
            </div>
            <h2 className="pt-4 text-[12.5px] font-semibold uppercase tracking-wider text-muted-foreground">
              Spectators · 0
            </h2>
            <div className="rounded-lg border border-dashed bg-card/30 px-4 py-6 text-center text-[12px] text-muted-foreground">
              No spectators yet
            </div>
          </section>
        </ScrollArea>

        {/* Parameters panel */}
        <aside className="overflow-hidden rounded-xl border bg-card">
          <RoomCover id={room.cover} className="h-20" />
          <div className="p-4">
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-4 bg-secondary">
                <TabsTrigger value="basic">Basic</TabsTrigger>
                <TabsTrigger value="advanced">Adv.</TabsTrigger>
                <TabsTrigger value="network">Net</TabsTrigger>
                <TabsTrigger value="anti-cheat">A/C</TabsTrigger>
              </TabsList>
              <TabsContent value="basic" className="space-y-3 pt-4">
                <Field label="Difficulty" value={room.difficulty} />
                <Field label="Mode" value={room.mode} />
                <Field label="Max lives" value="3" />
                <Field label="Max bombs" value="3" />
                <Field label="Random seed" value="0x4912AB" mono />
                <Field label="Game version" value="v1.00d" />
              </TabsContent>
              <TabsContent value="advanced" className="pt-4 text-[12px] text-muted-foreground">
                Advanced parameters appear here once host enables.
              </TabsContent>
              <TabsContent value="network" className="pt-4 text-[12px] text-muted-foreground">
                Direct UDP · NAT pierced · 24ms RTT.
              </TabsContent>
              <TabsContent value="anti-cheat" className="pt-4 text-[12px] text-muted-foreground">
                DLL signature: <span className="font-mono">aa18 5b2c …</span>
              </TabsContent>
            </Tabs>
          </div>
        </aside>
      </div>

      {/* Bottom bar */}
      <footer className="flex h-20 items-center justify-between gap-4 border-t bg-card/50 px-4">
        <div className="flex-1 text-[12px] text-muted-foreground">
          <span className="font-semibold text-foreground">marisa</span> joined ·
          a moment ago
        </div>
        <div className="flex items-center gap-3">
          {ready ? (
            <Button size="lg" onClick={() => setReady(false)}>
              <Sparkles />
              Start match
            </Button>
          ) : (
            <Button
              size="lg"
              variant="secondary"
              onClick={() => setReady(true)}
            >
              READY
            </Button>
          )}
        </div>
        <div className="flex flex-1 justify-end">
          <Button variant="ghost" size="sm">
            Leave room
          </Button>
        </div>
      </footer>
    </div>
  );
}

function Field({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center justify-between border-b py-1.5 last:border-b-0">
      <span className="text-[12px] text-muted-foreground">{label}</span>
      <span className={cn('text-[12px] font-medium', mono && 'font-mono')}>
        {value}
      </span>
    </div>
  );
}
