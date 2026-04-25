import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RoomCover } from '@/components/app/room-cover';
import { cn, pingClass } from '@/lib/utils';
import type { Room } from '@/types';
import { Crown, Plus } from 'lucide-react';

interface ServerCardProps {
  room: Room;
  onJoin?: (id: string) => void;
}

export function ServerCard({ room, onJoin }: ServerCardProps) {
  const occupancyText =
    room.status === 'full'
      ? `${room.players.length} / ${room.capacity} · full`
      : room.status === 'idle'
        ? `${room.players.length} / ${room.capacity} · idle`
        : `${room.players.length} / ${room.capacity} · waiting`;

  const occupancyTone =
    room.status === 'full'
      ? 'bg-warning'
      : room.status === 'idle'
        ? 'bg-muted-foreground/40'
        : 'bg-success animate-pulse-soft';

  return (
    <article
      className={cn(
        'group flex flex-col overflow-hidden rounded-xl border bg-card text-card-foreground shadow-sm transition-all',
        'hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5',
      )}
    >
      {/* Cover image */}
      <RoomCover id={room.cover} className="h-24" />

      {/* Body */}
      <div className="flex flex-1 flex-col gap-2.5 p-3.5">
        {/* Title row */}
        <header className="flex items-start justify-between gap-2.5">
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-[14px] font-semibold tracking-tight">
              {room.name}
            </h3>
            <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">
              {room.game} ·{' '}
              <span className={pingClass(room.pingMs)}>{room.pingMs}ms</span> ·{' '}
              {room.region}
            </p>
          </div>
          <Badge
            variant={room.kind === 'official' ? 'default' : 'secondary'}
            className="shrink-0"
          >
            {room.kind}
          </Badge>
        </header>

        {/* Tags */}
        <div className="flex flex-wrap gap-1">
          {room.tags.map((t) => (
            <span
              key={t.label}
              className={cn(
                'rounded border bg-secondary px-1.5 py-px text-[10.5px] font-medium text-muted-foreground',
                t.tone === 'warning' &&
                  'border-warning/30 bg-warning/15 text-warning',
              )}
            >
              {t.label}
            </span>
          ))}
        </div>

        {/* Seats */}
        <div className="grid grid-cols-4 gap-1.5 border-t border-dashed pt-2.5">
          {Array.from({ length: room.capacity }).map((_, i) => {
            const player = room.players[i];
            if (!player) {
              return (
                <div
                  key={i}
                  className="grid h-11 place-items-center rounded-md border border-dashed bg-transparent text-muted-foreground/60 transition-colors hover:border-primary hover:text-primary"
                >
                  <Plus className="h-3.5 w-3.5" />
                </div>
              );
            }
            return (
              <div
                key={i}
                className={cn(
                  'relative grid h-11 place-items-center rounded-md bg-muted/40',
                  player.isHost && 'bg-primary/10 ring-1 ring-primary/25',
                )}
                title={player.name}
              >
                <Avatar
                  className={cn(
                    'h-7 w-7',
                    player.isHost && 'ring-2 ring-primary',
                  )}
                >
                  <AvatarFallback name={player.name} />
                </Avatar>
                {player.isHost && (
                  <span className="absolute -right-1 -top-1 grid h-4 w-4 place-items-center rounded-full border-2 border-card bg-amber-400 text-amber-950">
                    <Crown className="h-2.5 w-2.5" />
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <footer className="mt-auto flex items-center justify-between border-t pt-2.5">
          <div className="flex items-center gap-1.5 font-mono text-[11px] text-muted-foreground">
            <span className={cn('h-1.5 w-1.5 rounded-full', occupancyTone)} />
            {occupancyText}
          </div>
          {room.status === 'full' ? (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onJoin?.(room.id)}
            >
              Spectate
            </Button>
          ) : (
            <Button size="sm" onClick={() => onJoin?.(room.id)}>
              Join
            </Button>
          )}
        </footer>
      </div>
    </article>
  );
}
