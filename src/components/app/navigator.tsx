import { useState } from 'react';
import { ChevronDown, MoreHorizontal, Search } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { friendsOnline, myRooms } from '@/data/mock';
import { cn } from '@/lib/utils';

const serverTypes = ['Official', 'Personal', 'Community'] as const;
const games = ['TH06', 'TH07', 'TH08', 'TH09'] as const;

export function Navigator() {
  const [serverType, setServerType] = useState<(typeof serverTypes)[number]>(
    'Official',
  );
  const [game, setGame] = useState<(typeof games)[number]>('TH08');

  return (
    <aside className="flex w-[248px] flex-col border-r bg-sidebar/60">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pb-2.5 pt-3">
        <div>
          <h2 className="text-[15px] font-semibold tracking-tight">Lobby</h2>
          <p className="mt-0.5 font-mono text-[10.5px] text-muted-foreground">
            CN-East · 24ms
          </p>
        </div>
        <button className="grid h-7 w-7 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground">
          <ChevronDown className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Search */}
      <div className="relative mx-3 mb-2">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search rooms, hosts, channels"
          className="h-8 pl-8 text-[12.5px]"
        />
      </div>

      <ScrollArea className="flex-1">
        <div className="flex flex-col gap-1 px-3 pb-3">
          <Section title="Server type">
            <div className="flex flex-wrap gap-1">
              {serverTypes.map((t) => {
                const disabled = t === 'Community';
                const active = serverType === t;
                return (
                  <button
                    key={t}
                    disabled={disabled}
                    onClick={() => !disabled && setServerType(t)}
                    className={cn(
                      'rounded-full border px-2.5 py-0.5 text-[11.5px] font-medium transition-colors',
                      active
                        ? 'border-primary/30 bg-primary/15 text-primary'
                        : 'border-border bg-secondary text-muted-foreground hover:bg-muted hover:text-foreground',
                      disabled && 'cursor-not-allowed opacity-40 hover:bg-secondary hover:text-muted-foreground',
                    )}
                  >
                    {t}
                  </button>
                );
              })}
            </div>
          </Section>

          <Section title="Game">
            <div className="flex flex-wrap gap-0.5">
              {games.map((g) => (
                <button
                  key={g}
                  onClick={() => setGame(g)}
                  className={cn(
                    'rounded-md px-2 py-1 font-mono text-[11.5px] font-medium transition-colors',
                    game === g
                      ? 'bg-primary/15 text-primary ring-1 ring-primary/25'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                  )}
                >
                  {g}
                </button>
              ))}
              <button className="rounded-md px-2 py-1 font-mono text-[11.5px] font-medium text-muted-foreground/60 hover:text-muted-foreground">
                TH10–20
              </button>
            </div>
          </Section>

          <Section title="My rooms">
            <ul className="flex flex-col gap-px">
              {myRooms.map((r) => (
                <li
                  key={r.id}
                  className="group flex cursor-pointer items-center gap-2 rounded-md px-2 py-1 text-[12.5px] text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-success" />
                  <span className="flex-1 truncate">{r.name}</span>
                  <span className="font-mono text-[10.5px] text-muted-foreground/70">
                    {r.pingMs}ms
                  </span>
                </li>
              ))}
            </ul>
          </Section>

          <Section title={`Friends · ${friendsOnline.length} online`}>
            <ul className="flex flex-col gap-px">
              {friendsOnline.map((f) => (
                <li
                  key={f.id}
                  className="group flex cursor-pointer items-center gap-2 rounded-md px-2 py-1 text-[12.5px] text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                >
                  <Avatar className="h-5 w-5">
                    <AvatarFallback name={f.name} />
                  </Avatar>
                  <span className="flex-1 truncate">{f.name}</span>
                  <span className="font-mono text-[10.5px] text-muted-foreground/70">
                    {f.status}
                  </span>
                </li>
              ))}
            </ul>
          </Section>
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="flex items-center gap-2.5 border-t bg-background/30 px-3 py-2">
        <Avatar className="h-8 w-8">
          <AvatarFallback name="dwgx" />
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="text-[12.5px] font-semibold">dwgx</div>
          <div className="truncate font-mono text-[10.5px] text-muted-foreground">
            @dwgx · 100029481
          </div>
        </div>
        <button className="grid h-7 w-7 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground">
          <MoreHorizontal className="h-3.5 w-3.5" />
        </button>
      </div>
    </aside>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="pt-2">
      <h3 className="px-1 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </h3>
      {children}
    </section>
  );
}
