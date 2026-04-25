import { useState } from 'react';
import { ChevronRight, Plus, Send, Share2, Smile } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { lobbyChat, rooms } from '@/data/mock';
import { cn } from '@/lib/utils';

interface ChatRailProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function ChatRail({ collapsed, onToggle }: ChatRailProps) {
  const [tab, setTab] = useState('lobby');

  if (collapsed) {
    return (
      <aside className="flex w-[44px] flex-col items-center border-l bg-sidebar/60 py-3 backdrop-blur-xl">
        <button
          onClick={onToggle}
          aria-label="Expand chat"
          className="grid h-8 w-8 place-items-center rounded text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <ChevronRight className="h-3.5 w-3.5 rotate-180" />
        </button>
        <div className="my-2 h-px w-6 bg-border" />
        <span className="font-mono text-[9.5px] font-bold uppercase tracking-[0.22em] text-muted-foreground [writing-mode:vertical-rl]">
          chat
        </span>
      </aside>
    );
  }

  return (
    <aside className="relative flex w-[336px] flex-col border-l bg-sidebar/60 backdrop-blur-xl">
      <div className="pointer-events-none absolute inset-y-0 left-0 w-px bg-gradient-to-b from-transparent via-foreground/8 to-transparent" />

      <Tabs
        value={tab}
        onValueChange={setTab}
        className="flex flex-1 flex-col min-h-0"
      >
        <div className="flex items-center justify-between border-b px-2.5 py-2">
          <TabsList className="bg-transparent p-0 gap-0.5">
            <RailTab value="lobby">Lobby</RailTab>
            <RailTab value="friends" badge="2">
              Friends
            </RailTab>
            <RailTab value="room">Room</RailTab>
          </TabsList>
          <button
            onClick={onToggle}
            aria-label="Collapse chat"
            className="grid h-7 w-7 place-items-center rounded text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="border-b bg-background/30 px-3.5 py-2.5">
          <div className="flex items-center gap-1.5 font-display text-[12.5px] font-bold tracking-tight">
            <span className="font-mono text-muted-foreground">#</span>
            lobby-th08
          </div>
          <div className="mt-0.5 font-mono text-[9.5px] uppercase tracking-[0.18em] text-muted-foreground">
            47 ONLINE · TYPE / FOR COMMANDS
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="flex flex-col gap-3 px-3 py-3">
            <div className="self-center rounded-full border border-border bg-card-elev px-2.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-[0.22em] text-muted-foreground">
              Today
            </div>

            {lobbyChat.map((m) => {
              if (m.system) {
                const room = rooms.find((r) => r.id === m.embedRoomId);
                return (
                  <div key={m.id} className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-1.5 px-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                      <Share2 className="h-3 w-3" />
                      <span>sakuya shared #{m.embedRoomId}</span>
                    </div>
                    {room && (
                      <RoomEmbed
                        cover={room.cover}
                        title={room.name}
                        meta={`${room.game} · ${room.pingMs}ms · ${room.players.length}/${room.capacity}`}
                      />
                    )}
                  </div>
                );
              }
              return (
                <div
                  key={m.id}
                  className={cn(
                    'group -mx-2 flex gap-2.5 rounded px-2 py-1 transition-colors hover:bg-accent/30',
                    m.hasMention &&
                      'bg-plasma/[0.08] border-l-2 border-l-plasma pl-2',
                  )}
                >
                  <Avatar className="mt-0.5 h-7 w-7 shrink-0 ring-1 ring-border">
                    <AvatarFallback name={m.author ?? '?'} />
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline gap-2">
                      <span className="font-display text-[12.5px] font-bold text-foreground">
                        {m.author}
                      </span>
                      <span className="font-mono text-[9.5px] uppercase tracking-wider text-muted-foreground/70">
                        {m.time}
                      </span>
                    </div>
                    <div
                      className="break-words text-[12.5px] leading-snug text-muted-foreground"
                      dangerouslySetInnerHTML={{
                        __html: (m.text ?? '').replace(
                          /(@\w+)/g,
                          '<span class="rounded bg-plasma/15 px-1 font-medium text-plasma">$1</span>',
                        ),
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>

        <div className="border-t bg-background/30 p-2">
          <div className="flex items-center gap-1 rounded-md border border-border bg-background/50 px-2 py-1 transition-colors focus-within:border-plasma focus-within:ring-2 focus-within:ring-plasma/20">
            <input
              type="text"
              placeholder="Message #lobby-th08"
              className="flex-1 bg-transparent py-1 text-[12.5px] text-foreground placeholder:text-muted-foreground focus:outline-none"
            />
            <Button variant="ghost" size="icon-sm" aria-label="Emoji">
              <Smile />
            </Button>
            <Button variant="ghost" size="icon-sm" aria-label="Share room">
              <Plus />
            </Button>
            <button
              aria-label="Send"
              className="grid h-7 w-7 place-items-center rounded bg-plasma text-white shadow-[0_2px_8px_-2px_hsl(var(--plasma)/0.6)] transition-colors hover:bg-plasma/90 active:scale-95"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="mt-1.5 px-1 font-mono text-[9.5px] uppercase tracking-wider text-muted-foreground/70">
            TEXT & EMOJI · <kbd className="rounded border border-border bg-card px-1 font-mono">/</kbd> CMD ·{' '}
            <kbd className="rounded border border-border bg-card px-1 font-mono">↵</kbd> SEND
          </div>
        </div>
      </Tabs>
    </aside>
  );
}

function RailTab({
  value,
  children,
  badge,
}: {
  value: string;
  children: React.ReactNode;
  badge?: string;
}) {
  return (
    <TabsTrigger
      value={value}
      className={cn(
        'gap-1.5 px-3 py-1 font-display text-[11px] font-bold uppercase tracking-[0.14em]',
        'data-[state=active]:bg-card-elev data-[state=active]:text-foreground',
      )}
    >
      {children}
      {badge && (
        <span className="grid h-3.5 min-w-3.5 place-items-center rounded-full bg-rose px-1 font-mono text-[9px] font-bold text-white">
          {badge}
        </span>
      )}
    </TabsTrigger>
  );
}

function RoomEmbed({
  title,
  meta,
  cover,
}: {
  title: string;
  meta: string;
  cover: string;
}) {
  const meshClass: Record<string, string> = {
    aurora: 'bg-mesh-1',
    midnight: 'bg-mesh-2',
    twilight: 'bg-mesh-4',
    dawn: 'bg-mesh-3',
    glacier: 'bg-mesh-5',
    amber: 'bg-mesh-6',
  };
  return (
    <div className="overflow-hidden rounded-md border border-border bg-card bevel-edge">
      <div className={cn('relative h-12', meshClass[cover] ?? 'bg-mesh-1')}>
        <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_30%,rgba(0,0,0,0.6)_100%)]" />
        <div className="absolute bottom-1 left-2 font-mono text-[9px] uppercase tracking-[0.18em] text-white/85">
          ROOM SHARE
        </div>
      </div>
      <div className="space-y-1.5 p-2.5">
        <div className="font-display text-[12.5px] font-semibold leading-tight">
          {title}
        </div>
        <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          {meta}
        </div>
        <button className="mt-1 inline-flex h-6 items-center gap-1.5 rounded-sm bg-gradient-to-b from-plasma to-plasma/80 px-2.5 font-display text-[10px] font-bold uppercase tracking-[0.14em] text-white ring-1 ring-plasma/30 hover:from-plasma hover:to-plasma/95">
          Join
          <span className="font-mono">→</span>
        </button>
      </div>
    </div>
  );
}
