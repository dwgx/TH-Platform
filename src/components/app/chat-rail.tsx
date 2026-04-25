import { useState } from 'react';
import { ChevronRight, Plus, Send, Smile, Share2 } from 'lucide-react';
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
      <aside className="flex w-[42px] flex-col items-center border-l bg-sidebar/60 py-2">
        <button
          onClick={onToggle}
          aria-label="Expand chat"
          className="grid h-8 w-8 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <ChevronRight className="h-3.5 w-3.5 rotate-180" />
        </button>
        <div className="mt-2 h-px w-6 bg-border" />
        <div className="mt-2 flex flex-col gap-1.5">
          <span className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground [writing-mode:vertical-rl]">
            chat
          </span>
        </div>
      </aside>
    );
  }

  return (
    <aside className="flex w-[320px] flex-col border-l bg-sidebar/60">
      <Tabs value={tab} onValueChange={setTab} className="flex-1 flex flex-col min-h-0">
        <div className="flex items-center justify-between border-b px-2 py-1.5">
          <TabsList className="bg-transparent p-0">
            <TabsTrigger value="lobby">Lobby</TabsTrigger>
            <TabsTrigger value="friends" className="gap-1.5">
              Friends
              <span className="grid h-4 min-w-4 place-items-center rounded-full bg-destructive px-1 text-[9.5px] font-bold text-destructive-foreground">
                2
              </span>
            </TabsTrigger>
            <TabsTrigger value="room">Room</TabsTrigger>
          </TabsList>
          <button
            onClick={onToggle}
            aria-label="Collapse chat"
            className="grid h-7 w-7 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="border-b bg-background/20 px-3.5 py-2">
          <div className="text-[12.5px] font-semibold">#lobby-th08</div>
          <div className="font-mono text-[10.5px] text-muted-foreground">
            47 online · type / for commands
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="flex flex-col gap-2.5 px-3 py-3">
            <div className="self-center rounded-full bg-muted px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              Today
            </div>

            {lobbyChat.map((m) => {
              if (m.system) {
                const room = rooms.find((r) => r.id === m.embedRoomId);
                return (
                  <div key={m.id} className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-1.5 px-1 text-[11px] text-muted-foreground">
                      <Share2 className="h-3 w-3" />
                      <span>
                        sakuya shared a room — #{m.embedRoomId}
                      </span>
                    </div>
                    {room && (
                      <RoomEmbed
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
                    'group -mx-2 flex gap-2.5 rounded-md px-2 py-0.5 transition-colors hover:bg-accent/40',
                    m.hasMention &&
                      'bg-primary/[0.06] border-l-2 border-l-primary pl-1.5',
                  )}
                >
                  <Avatar className="mt-0.5 h-7 w-7 shrink-0">
                    <AvatarFallback name={m.author ?? '?'} />
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline gap-2">
                      <span className="text-[12.5px] font-semibold text-foreground">
                        {m.author}
                      </span>
                      <span className="font-mono text-[10px] text-muted-foreground/70">
                        {m.time}
                      </span>
                    </div>
                    <div
                      className="break-words text-[12.5px] leading-snug text-muted-foreground"
                      dangerouslySetInnerHTML={{
                        __html: (m.text ?? '').replace(
                          /(@\w+)/g,
                          '<span class="rounded bg-primary/15 px-1 font-medium text-primary">$1</span>',
                        ),
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>

        <div className="border-t bg-background/20 p-2">
          <div className="flex items-center gap-1 rounded-lg border bg-background/60 px-2 py-1 transition-colors focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
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
            <Button size="icon-sm" aria-label="Send">
              <Send />
            </Button>
          </div>
          <div className="mt-1 px-1 text-[10.5px] text-muted-foreground/70">
            Text & emoji only · <kbd className="font-mono">/</kbd> commands ·{' '}
            <kbd className="font-mono">↵</kbd> send
          </div>
        </div>
      </Tabs>
    </aside>
  );
}

function RoomEmbed({ title, meta }: { title: string; meta: string }) {
  return (
    <div className="overflow-hidden rounded-lg border bg-card">
      <div className="relative h-7 bg-[linear-gradient(135deg,#1A1F38_0%,#2C2B5A_100%)]">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_60%_at_75%_25%,rgba(133,151,247,0.40),transparent_60%)]" />
      </div>
      <div className="space-y-1.5 p-2.5">
        <div className="text-[12.5px] font-semibold">{title}</div>
        <div className="font-mono text-[10.5px] text-muted-foreground">
          {meta}
        </div>
        <Button size="sm" className="mt-1 h-6 px-2.5 text-[11px]">
          Join
        </Button>
      </div>
    </div>
  );
}
