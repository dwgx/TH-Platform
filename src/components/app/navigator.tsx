import { useState } from 'react';
import { ChevronDown, MoreHorizontal, Search } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
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
    <aside className="relative flex w-[260px] flex-col border-r bg-sidebar/60 backdrop-blur-xl">
      {/* Top chrome edge */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-foreground/8 to-transparent" />

      {/* Header */}
      <div className="flex items-center justify-between px-4 pb-2.5 pt-3.5">
        <div>
          <div className="font-mono text-[9px] font-bold uppercase tracking-[0.22em] text-plasma">
            Region
          </div>
          <h2 className="font-display text-[16px] font-bold tracking-tight">
            CN-EAST
          </h2>
          <p className="mt-0.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            24ms · 47 online
          </p>
        </div>
        <button className="grid h-7 w-7 place-items-center rounded text-muted-foreground transition-colors hover:bg-accent hover:text-foreground">
          <ChevronDown className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Search */}
      <div className="relative mx-3 mb-2">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <input
          placeholder="Search rooms, hosts…"
          className="h-8 w-full rounded-md border border-border bg-background/40 pl-8 pr-3 font-mono text-[11.5px] placeholder:text-muted-foreground focus:border-plasma focus:outline-none focus:ring-2 focus:ring-plasma/25"
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
                      'rounded-sm border px-2.5 py-1 font-mono text-[10.5px] font-semibold uppercase tracking-wider transition-colors',
                      active
                        ? 'border-plasma/40 bg-plasma/15 text-plasma shadow-[0_0_0_1px_hsl(var(--plasma)/0.2)]'
                        : 'border-border bg-card/40 text-muted-foreground hover:bg-card hover:text-foreground',
                      disabled && 'cursor-not-allowed opacity-40',
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
                    'rounded-sm px-2 py-1 font-mono text-[11px] font-bold uppercase tracking-wider transition-colors',
                    game === g
                      ? 'bg-plasma/15 text-plasma ring-1 ring-plasma/30'
                      : 'text-muted-foreground hover:bg-card hover:text-foreground',
                  )}
                >
                  {g}
                </button>
              ))}
              <button className="rounded-sm px-2 py-1 font-mono text-[11px] font-medium uppercase tracking-wider text-muted-foreground/50 hover:text-muted-foreground">
                10–20
              </button>
            </div>
          </Section>

          <Section title="My rooms">
            <ul className="flex flex-col gap-px">
              {myRooms.map((r) => (
                <li
                  key={r.id}
                  className="group flex cursor-pointer items-center gap-2.5 rounded px-2 py-1.5 text-[12.5px] text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-arc shadow-[0_0_6px_hsl(var(--arc)/0.7)]" />
                  <span className="flex-1 truncate font-display">
                    {r.name}
                  </span>
                  <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground/70">
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
                  className="group flex cursor-pointer items-center gap-2.5 rounded px-2 py-1.5 text-[12.5px] text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                >
                  <Avatar className="h-6 w-6 ring-1 ring-border">
                    <AvatarFallback name={f.name} />
                  </Avatar>
                  <span className="flex-1 truncate">{f.name}</span>
                  <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground/70">
                    {f.status}
                  </span>
                </li>
              ))}
            </ul>
          </Section>
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="flex items-center gap-2.5 border-t bg-background/40 px-3 py-2.5">
        <div className="relative">
          <Avatar className="h-9 w-9 ring-1 ring-plasma/40">
            <AvatarFallback name="dwgx" />
          </Avatar>
          <span className="absolute -right-0.5 -bottom-0.5 h-2.5 w-2.5 rounded-full bg-success ring-2 ring-sidebar shadow-[0_0_6px_hsl(var(--success)/0.7)]" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-display text-[13px] font-semibold">dwgx</div>
          <div className="truncate font-mono text-[10.5px] uppercase tracking-wider text-muted-foreground">
            UID 100029481
          </div>
        </div>
        <button className="grid h-7 w-7 place-items-center rounded text-muted-foreground transition-colors hover:bg-accent hover:text-foreground">
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
    <section className="pt-3">
      <h3 className="px-1 pb-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground/80">
        {title}
      </h3>
      {children}
    </section>
  );
}
