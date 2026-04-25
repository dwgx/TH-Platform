import { Bell, Hash, HelpCircle, Inbox, Pin, Plus, Search, Users } from 'lucide-react';
import { rooms, lobbyChat } from '@/data/mock';
import type { Room } from '@/types';
import { cn } from '@/lib/utils';

interface LobbyPageProps {
  onOpenRoom: () => void;
}

export function LobbyPage({ onOpenRoom }: LobbyPageProps) {
  return (
    <div className="flex flex-1 flex-col min-h-0">
      <ChannelHeader
        name="lobby-th08"
        topic="开桌、找队友、聊永夜抄。点击房间右侧 Join 直接进入。"
      />

      <div className="flex flex-1 min-h-0">
        {/* Main column = room list */}
        <section className="flex-1 overflow-y-auto px-4 py-4">
          {/* New room button row */}
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-[18px] font-bold text-header">永夜抄 · TH08 大厅</h2>
              <p className="text-[12.5px] text-muted">
                {rooms.length} 间在线 · {rooms.reduce((n, r) => n + r.players.length, 0)} 人正在玩
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button className="flex h-8 items-center gap-1.5 rounded bg-input px-3 text-[12.5px] text-body transition-colors hover:bg-hover">
                <Search className="h-3.5 w-3.5" />
                Search
              </button>
              <button className="flex h-8 items-center gap-1.5 rounded bg-brand px-3 text-[13px] font-medium text-brand-foreground transition-colors hover:bg-brand-hover">
                <Plus className="h-3.5 w-3.5" />
                New room
              </button>
            </div>
          </div>

          <ul className="space-y-1.5">
            {rooms.map((r) => (
              <RoomRow key={r.id} room={r} onJoin={onOpenRoom} />
            ))}
          </ul>
        </section>

        {/* Right-of-content lobby chat — Discord pattern: chat lives in the same channel */}
        <aside className="hidden w-[320px] flex-col border-l border-floating/40 bg-content xl:flex shrink-0">
          <header className="flex h-12 items-center gap-2 border-b border-floating/40 px-4 shadow-sm">
            <Hash className="h-4 w-4 text-muted" />
            <span className="text-[14px] font-semibold text-header">lobby-th08 chat</span>
          </header>
          <div className="flex-1 overflow-y-auto px-3 py-3">
            <ul className="space-y-3">
              {lobbyChat.map((m) => (
                <li key={m.id}>
                  {m.system ? (
                    <SystemLine roomId={m.embedRoomId} />
                  ) : (
                    <ChatLine
                      author={m.author!}
                      time={m.time}
                      text={m.text!}
                      mention={m.hasMention}
                    />
                  )}
                </li>
              ))}
            </ul>
          </div>
          <Composer />
        </aside>
      </div>
    </div>
  );
}

/** Discord channel header — # name + topic + right-side icon cluster */
export function ChannelHeader({
  name,
  topic,
}: {
  name: string;
  topic?: string;
}) {
  return (
    <header className="flex h-12 items-center gap-3 border-b border-floating/40 bg-content px-4 shadow-sm shrink-0">
      <Hash className="h-5 w-5 text-muted" />
      <span className="text-[15px] font-semibold text-header">{name}</span>
      {topic ? (
        <>
          <span className="h-5 w-px bg-floating/60" />
          <span className="truncate text-[13px] text-muted">{topic}</span>
        </>
      ) : null}
      <div className="ml-auto flex items-center gap-1.5">
        <HeaderIcon label="Threads"><Inbox className="h-[18px] w-[18px]" /></HeaderIcon>
        <HeaderIcon label="Notifications"><Bell className="h-[18px] w-[18px]" /></HeaderIcon>
        <HeaderIcon label="Pins"><Pin className="h-[18px] w-[18px]" /></HeaderIcon>
        <HeaderIcon label="Members"><Users className="h-[18px] w-[18px]" /></HeaderIcon>
        <div className="h-5 w-px bg-floating/60 mx-1" />
        <SearchPill />
        <HeaderIcon label="Help"><HelpCircle className="h-[18px] w-[18px]" /></HeaderIcon>
      </div>
    </header>
  );
}

function HeaderIcon({
  children,
  label,
}: {
  children: React.ReactNode;
  label: string;
}) {
  return (
    <button
      title={label}
      aria-label={label}
      className="grid h-8 w-8 place-items-center rounded text-muted transition-colors hover:bg-hover hover:text-header"
    >
      {children}
    </button>
  );
}

function SearchPill() {
  return (
    <div className="flex h-6 items-center gap-1 rounded bg-floating/60 px-1.5 text-[11.5px] text-muted">
      <Search className="h-3 w-3" />
      <input
        placeholder="Search"
        className="w-[120px] bg-transparent outline-none placeholder:text-muted"
      />
    </div>
  );
}

/** Flat Discord-style room row — NO gradient cover, just plain card. */
function RoomRow({ room, onJoin }: { room: Room; onJoin: () => void }) {
  const isFull = room.status === 'full';
  return (
    <li
      className={cn(
        'group flex items-center gap-3 rounded bg-floating/40 px-3 py-2.5 transition-colors',
        'hover:bg-hover',
      )}
    >
      {/* Game tag chip */}
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded bg-brand/20 text-[11px] font-mono font-bold text-brand">
        {room.game.slice(2)}
      </span>

      {/* Title + meta */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-[14px] font-semibold text-header">
            {room.name}
          </span>
          {room.kind === 'official' ? (
            <span className="rounded bg-brand/15 px-1.5 py-px text-[10px] font-bold uppercase tracking-wider text-brand">
              Official
            </span>
          ) : null}
          {isFull ? (
            <span className="rounded bg-warning/15 px-1.5 py-px text-[10px] font-bold uppercase tracking-wider text-warning">
              Full
            </span>
          ) : null}
        </div>
        <div className="mt-0.5 flex items-center gap-2 font-mono text-[11.5px] text-muted">
          <span className={cn(
            room.pingMs < 40 ? 'text-success' : room.pingMs < 80 ? 'text-warning' : 'text-danger',
          )}>{room.pingMs}ms</span>
          <span>·</span>
          <span>{room.region}</span>
          <span>·</span>
          <span>{room.difficulty}</span>
          <span>·</span>
          <span>{room.mode}</span>
        </div>
      </div>

      {/* Player chip stack */}
      <div className="flex items-center -space-x-1.5">
        {room.players.slice(0, 4).map((p) => (
          <span
            key={p.id}
            title={p.name + (p.isHost ? ' (host)' : '')}
            className={cn(
              'grid h-7 w-7 place-items-center rounded-full text-[11px] font-bold text-white ring-2 ring-content',
              'bg-gradient-to-br from-violet-500 to-violet-700',
              p.isHost && 'ring-warning',
            )}
          >
            {p.name[0]}
          </span>
        ))}
        {Array.from({ length: room.capacity - room.players.length }).map((_, i) => (
          <span
            key={`empty-${i}`}
            className="grid h-7 w-7 place-items-center rounded-full bg-input text-muted ring-2 ring-content text-[12px]"
          >
            +
          </span>
        ))}
      </div>

      <span className="font-mono text-[12px] text-muted tabular-nums">
        {room.players.length}/{room.capacity}
      </span>

      <button
        onClick={onJoin}
        disabled={isFull}
        className={cn(
          'h-8 rounded px-3.5 text-[13px] font-medium transition-colors',
          isFull
            ? 'bg-input text-muted cursor-not-allowed'
            : 'bg-success text-white hover:brightness-110',
        )}
      >
        {isFull ? 'Spectate' : 'Join'}
      </button>
    </li>
  );
}

function ChatLine({
  author,
  time,
  text,
  mention,
}: {
  author: string;
  time: string;
  text: string;
  mention?: boolean;
}) {
  return (
    <div className={cn('group -mx-1 rounded px-1 py-0.5 hover:bg-hover/60', mention && 'bg-brand/[0.08]')}>
      <div className="flex items-baseline gap-2">
        <span className="grid h-7 w-7 place-items-center rounded-full bg-gradient-to-br from-violet-500 to-violet-700 text-[11px] font-bold text-white">
          {author[0]}
        </span>
        <span className="text-[14px] font-semibold text-header">{author}</span>
        <span className="font-mono text-[10.5px] text-muted">{time}</span>
      </div>
      <div
        className="ml-9 -mt-0.5 text-[14px] text-body break-words leading-snug"
        dangerouslySetInnerHTML={{
          __html: text.replace(
            /(@\w+)/g,
            '<span class="rounded bg-brand/15 px-1 font-medium text-brand">$1</span>',
          ),
        }}
      />
    </div>
  );
}

function SystemLine({ roomId }: { roomId?: string }) {
  return (
    <div className="text-[12px] text-muted px-1">
      <span className="text-link">咲夜</span> shared a room — #{roomId}
    </div>
  );
}

function Composer() {
  return (
    <div className="border-t border-floating/40 px-4 py-3">
      <div className="flex h-10 items-center gap-2 rounded bg-input px-3 text-[14px] text-body">
        <Plus className="h-4 w-4 text-muted" />
        <input
          placeholder="Message #lobby-th08"
          className="flex-1 bg-transparent outline-none placeholder:text-muted"
        />
      </div>
    </div>
  );
}
