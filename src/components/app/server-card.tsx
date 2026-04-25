import { Crown, Plus, Signal } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { RoomCover } from '@/components/app/room-cover';
import { cn, pingClass } from '@/lib/utils';
import type { Room } from '@/types';

interface ServerCardProps {
  room: Room;
  onJoin?: (id: string) => void;
}

/**
 * "Cabinet plate" card — feels like a piece of equipment, not soft UI.
 *  - Cinematic 56% cover with key-art mesh + grid overlay
 *  - LED status strip at the bottom of the cover
 *  - Plate body with bevelled top, brass accents
 *  - 4 LED-strip player seats (square dark slots, host has crown + arc glow)
 *  - Chunky JOIN button with bevel
 */
export function ServerCard({ room, onJoin }: ServerCardProps) {
  const isOfficial = room.kind === 'official';

  return (
    <article
      className={cn(
        'group relative flex flex-col overflow-hidden rounded-md',
        'bg-plate bevel-edge transition-all duration-300 ease-out',
        'border border-border',
        'hover:-translate-y-1 hover:border-plasma/60',
        'hover:shadow-[0_22px_50px_-15px_rgba(124,92,255,0.4),0_0_0_1px_rgba(124,92,255,0.25)]',
      )}
    >
      {/* ── Cover plate ── */}
      <div className="relative">
        <RoomCover
          id={room.cover}
          className="aspect-[16/9] transition-transform duration-700 ease-out group-hover:scale-[1.05]"
        />

        {/* Top-left HUD: serial + game */}
        <div className="absolute inset-x-3 top-3 flex items-start justify-between">
          <div className="flex items-center gap-2 rounded-sm bg-black/55 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-white/80 backdrop-blur-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-arc shadow-[0_0_6px_rgba(61,223,255,0.8)]" />
            #{room.id}
          </div>
          {isOfficial ? (
            <div className="flex items-center gap-1.5 rounded-sm bg-ember/95 px-2 py-1 font-display text-[10px] font-bold uppercase tracking-[0.16em] text-amber-950 shadow-[0_4px_12px_-2px_rgba(255,180,84,0.55)]">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-950" />
              Official
            </div>
          ) : (
            <div className="rounded-sm border border-white/15 bg-black/55 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.16em] text-white/70 backdrop-blur-sm">
              Personal
            </div>
          )}
        </div>

        {/* Bottom-overlay title — sits over cover for cinematic legibility */}
        <div className="absolute inset-x-0 bottom-0 z-10 px-4 pb-3.5">
          <h3
            className={cn(
              'font-display text-[17px] font-bold leading-tight tracking-tight text-white',
              'drop-shadow-[0_2px_8px_rgba(0,0,0,0.85)]',
            )}
          >
            {room.name}
          </h3>
          <div className="mt-1 flex items-center gap-2 font-mono text-[10.5px] uppercase tracking-wider text-white/70">
            <span>{room.game}</span>
            <span className="h-px w-3 bg-white/40" />
            <Signal className="h-3 w-3" />
            <span className={cn(pingClass(room.pingMs), 'text-white/95')}>
              {room.pingMs}ms
            </span>
            <span className="h-px w-3 bg-white/40" />
            <span>{room.region}</span>
          </div>
        </div>

        {/* Status LED strip */}
        <StatusStrip room={room} />
      </div>

      {/* ── Plate body ── */}
      <div className="flex flex-1 flex-col gap-3 p-4">
        {/* Tags row */}
        <div className="flex flex-wrap gap-1">
          {room.tags.map((t) => (
            <span
              key={t.label}
              className={cn(
                'rounded border px-1.5 py-0.5 font-mono text-[10px] font-medium uppercase tracking-wider',
                t.tone === 'warning'
                  ? 'border-warning/40 bg-warning/10 text-warning'
                  : 'border-border bg-muted/40 text-muted-foreground',
              )}
            >
              {t.label}
            </span>
          ))}
        </div>

        {/* Seat strip — the LED row */}
        <SeatStrip room={room} />

        {/* Footer: occupancy + JOIN */}
        <footer className="mt-auto flex items-center justify-between border-t border-border/70 pt-3">
          <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-wider">
            <span
              className={cn(
                'h-1.5 w-1.5 rounded-full',
                room.status === 'full'
                  ? 'bg-warning'
                  : room.status === 'idle'
                    ? 'bg-muted-foreground/40'
                    : 'bg-arc shadow-[0_0_6px_hsl(var(--arc)/0.8)] animate-led-flicker',
              )}
            />
            <span className="text-foreground">
              {room.players.length}
              <span className="text-muted-foreground">/{room.capacity}</span>
            </span>
            <span className="text-muted-foreground">·</span>
            <span className="text-muted-foreground">{room.status}</span>
          </div>
          {room.status === 'full' ? (
            <Button
              variant="secondary"
              size="sm"
              className="h-7 px-3 font-display text-[11px] font-semibold uppercase tracking-wider"
              onClick={() => onJoin?.(room.id)}
            >
              Spectate
            </Button>
          ) : (
            <button
              onClick={() => onJoin?.(room.id)}
              className={cn(
                'group/btn relative inline-flex h-8 items-center gap-1.5 overflow-hidden rounded-md px-4',
                'font-display text-[11.5px] font-bold uppercase tracking-[0.16em] text-white',
                'bg-gradient-to-b from-plasma/95 to-plasma/70',
                'bevel-edge ring-1 ring-plasma/30',
                'transition-all duration-150 hover:from-plasma hover:to-plasma/85',
                'active:scale-[0.97] active:from-plasma/85',
              )}
            >
              <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-700 group-hover/btn:translate-x-full" />
              <span className="relative">Join</span>
              <span className="relative font-mono text-white/70">→</span>
            </button>
          )}
        </footer>
      </div>
    </article>
  );
}

/** LED strip showing room health on the cover-plate seam. */
function StatusStrip({ room }: { room: Room }) {
  const segments = room.capacity;
  const lit = room.players.length;
  return (
    <div className="absolute inset-x-0 bottom-0 z-20 flex h-[3px]">
      {Array.from({ length: segments }).map((_, i) => {
        const on = i < lit;
        return (
          <div
            key={i}
            className={cn(
              'flex-1 transition-colors',
              on
                ? room.status === 'full'
                  ? 'bg-warning shadow-[0_0_8px_hsl(var(--warning)/0.7)]'
                  : 'bg-arc shadow-[0_0_8px_hsl(var(--arc)/0.7)]'
                : 'bg-white/10',
              i > 0 && 'border-l border-black/40',
            )}
          />
        );
      })}
    </div>
  );
}

/** 4 LED-style seat slots — host has crown + plasma glow, occupied are soft, empty are dark with diagonal stripes. */
function SeatStrip({ room }: { room: Room }) {
  return (
    <div className="grid grid-cols-4 gap-1.5">
      {Array.from({ length: room.capacity }).map((_, i) => {
        const player = room.players[i];
        if (!player) {
          return (
            <div
              key={i}
              className={cn(
                'group/seat relative grid h-12 place-items-center rounded',
                'bg-stripe-empty bg-[length:8px_8px]',
                'border border-dashed border-border/70',
                'text-muted-foreground/50 transition-all',
                'hover:border-plasma hover:text-plasma',
              )}
            >
              <Plus className="h-3.5 w-3.5" />
            </div>
          );
        }
        return (
          <div
            key={i}
            className={cn(
              'relative grid h-12 place-items-center rounded',
              'bg-card-elev/70 border border-border/50',
              'transition-all',
              player.isHost && 'border-plasma/40 bg-plasma/10',
            )}
            title={player.name}
          >
            <Avatar
              className={cn(
                'h-7 w-7 ring-1 ring-border',
                player.isHost && 'ring-2 ring-plasma',
              )}
            >
              <AvatarFallback name={player.name} />
            </Avatar>
            {player.isHost && (
              <span className="absolute -right-1 -top-1 grid h-4 w-4 place-items-center rounded-full border-[1.5px] border-card bg-ember text-amber-950">
                <Crown className="h-2.5 w-2.5" />
              </span>
            )}
            {/* Tiny LED indicator */}
            <span
              className={cn(
                'absolute bottom-1 left-1 h-1 w-1 rounded-full',
                player.isHost
                  ? 'bg-plasma shadow-[0_0_4px_hsl(var(--plasma)/0.7)]'
                  : 'bg-success shadow-[0_0_4px_hsl(var(--success)/0.7)]',
              )}
            />
          </div>
        );
      })}
    </div>
  );
}
