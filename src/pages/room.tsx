import { ArrowLeft, Crown, Hash, Plus, Settings as SettingsIcon } from 'lucide-react';
import { rooms } from '@/data/mock';
import { cn } from '@/lib/utils';

interface RoomPageProps {
  onLeave: () => void;
}

export function RoomPage({ onLeave }: RoomPageProps) {
  const room = rooms[0];

  return (
    <div className="flex flex-1 flex-col min-h-0">
      <header className="flex h-12 items-center gap-3 border-b border-floating/40 bg-content px-4 shadow-sm shrink-0">
        <button
          onClick={onLeave}
          className="flex items-center gap-1.5 rounded px-2 py-1 text-[13px] text-muted transition-colors hover:bg-hover hover:text-header"
        >
          <ArrowLeft className="h-4 w-4" />
          Lobby
        </button>
        <span className="h-5 w-px bg-floating/60" />
        <Hash className="h-5 w-5 text-muted" />
        <span className="text-[15px] font-semibold text-header">{room.name}</span>
        <span className="rounded bg-brand/15 px-1.5 py-px text-[10px] font-bold uppercase tracking-wider text-brand">
          {room.kind}
        </span>
        <span className="font-mono text-[11.5px] text-muted">
          {room.game} · {room.region} · {room.pingMs}ms
        </span>
        <div className="ml-auto flex items-center gap-2">
          <button className="grid h-8 w-8 place-items-center rounded text-muted hover:bg-hover hover:text-header">
            <SettingsIcon className="h-4 w-4" />
          </button>
        </div>
      </header>

      <div className="flex flex-1 min-h-0">
        {/* Seats area */}
        <section className="flex-1 overflow-y-auto p-6">
          <h2 className="mb-3 text-[11px] font-bold uppercase tracking-wider text-muted">
            Seats — {room.players.length}/{room.capacity}
          </h2>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: room.capacity }).map((_, i) => {
              const p = room.players[i];
              if (!p) {
                return (
                  <button
                    key={i}
                    className="flex h-44 flex-col items-center justify-center gap-2 rounded border border-dashed border-floating/60 bg-floating/20 text-muted transition-colors hover:border-brand hover:text-brand"
                  >
                    <Plus className="h-5 w-5" />
                    <span className="text-[12.5px] font-medium">Invite player</span>
                  </button>
                );
              }
              return (
                <article
                  key={i}
                  className={cn(
                    'flex h-44 flex-col items-center justify-center gap-2 rounded bg-floating/40 p-4',
                    p.isHost && 'ring-1 ring-warning/40',
                  )}
                >
                  <div className="relative">
                    <span className="grid h-14 w-14 place-items-center rounded-full bg-gradient-to-br from-violet-500 to-violet-700 text-[18px] font-bold text-white">
                      {p.name[0]}
                    </span>
                    {p.isHost ? (
                      <span className="absolute -right-1 -top-1 grid h-5 w-5 place-items-center rounded-full border-2 border-content bg-warning text-content">
                        <Crown className="h-3 w-3" />
                      </span>
                    ) : null}
                  </div>
                  <div className="text-center">
                    <div className="text-[14px] font-semibold text-header">{p.name}</div>
                    <div className="font-mono text-[11px] text-muted">@{p.name}</div>
                  </div>
                  <span className={cn(
                    'rounded px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-wider',
                    i === 0 ? 'bg-success/15 text-success' : 'bg-input text-muted',
                  )}>
                    {i === 0 ? 'Ready' : 'Picking'}
                  </span>
                </article>
              );
            })}
          </div>

          <h2 className="mt-6 mb-3 text-[11px] font-bold uppercase tracking-wider text-muted">
            Spectators — 0
          </h2>
          <div className="rounded border border-dashed border-floating/60 bg-floating/20 px-4 py-6 text-center text-[12.5px] text-muted">
            No spectators yet
          </div>
        </section>

        {/* Parameters panel */}
        <aside className="hidden w-[320px] flex-col border-l border-floating/40 bg-sidebar shrink-0 lg:flex">
          <header className="flex h-12 items-center px-4 shadow-sm border-b border-floating/40">
            <span className="text-[14px] font-semibold text-header">Parameters</span>
          </header>
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            <Field label="Difficulty" value={room.difficulty} />
            <Field label="Mode" value={room.mode} />
            <Field label="Max lives" value="3" />
            <Field label="Max bombs" value="3" />
            <Field label="Random seed" value="0x4912AB" mono />
            <Field label="Game version" value="v1.00d" />
            <Field label="DLL" value="v0.0.1 alpha" mono />
            <Field label="RTT" value={`${room.pingMs}ms`} />
          </div>

          <footer className="border-t border-floating/40 p-3">
            <button className="h-10 w-full rounded bg-success text-[14px] font-bold text-white transition-colors hover:brightness-110">
              READY
            </button>
          </footer>
        </aside>
      </div>
    </div>
  );
}

function Field({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between border-b border-floating/40 py-1.5 last:border-b-0">
      <span className="text-[12px] text-muted">{label}</span>
      <span className={cn('text-[12.5px] font-medium text-body', mono && 'font-mono')}>
        {value}
      </span>
    </div>
  );
}
