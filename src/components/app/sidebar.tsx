import { ChevronDown, Hash, Plus, Search, Volume2 } from 'lucide-react';
import { Fragment, useMemo } from 'react';
import { channels } from '@/data/mock';
import { cn } from '@/lib/utils';
import { UserPanel } from '@/components/app/user-panel';
import type { Page } from '@/types';

interface SidebarProps {
  page: Page;
  onNavigate: (p: Page) => void;
  activeChannelId: string;
  onSelectChannel: (id: string) => void;
}

export function Sidebar({
  page,
  onNavigate,
  activeChannelId,
  onSelectChannel,
}: SidebarProps) {
  const grouped = useMemo(() => {
    const map = new Map<string, typeof channels>();
    for (const c of channels) {
      const arr = map.get(c.category) ?? [];
      arr.push(c);
      map.set(c.category, arr);
    }
    return Array.from(map.entries());
  }, []);

  if (page === 'friends') return <FriendsSidebar />;

  return (
    <aside className="flex w-[240px] flex-col bg-sidebar shrink-0">
      {/* Server header — Discord style: server name + chevron */}
      <header className="flex h-12 items-center justify-between border-b border-floating/40 px-4 shadow-sm">
        <div className="flex flex-col leading-tight">
          <span className="text-[15px] font-semibold text-header tracking-tight">
            TH08 · 永夜抄
          </span>
          <span className="text-[10.5px] text-muted">CN-East · 24ms</span>
        </div>
        <button className="grid h-6 w-6 place-items-center rounded text-muted transition-colors hover:bg-hover hover:text-header">
          <ChevronDown className="h-4 w-4" />
        </button>
      </header>

      {/* Search — Discord-style pill */}
      <div className="px-2.5 pt-2">
        <button className="flex h-7 w-full items-center gap-1.5 rounded bg-input px-2 text-left text-[12.5px] text-muted transition-colors hover:bg-hover">
          <Search className="h-3.5 w-3.5" />
          <span className="flex-1">Search</span>
          <span className="font-mono text-[10px] text-muted/70">⌘K</span>
        </button>
      </div>

      {/* Channel list */}
      <nav className="flex-1 overflow-y-auto py-2 pr-1">
        {grouped.map(([cat, items]) => (
          <Fragment key={cat}>
            <button className="group flex h-6 w-full items-center gap-1 px-2 text-muted hover:text-header">
              <ChevronDown className="h-3 w-3" />
              <span className="text-[10.5px] font-bold uppercase tracking-wider">
                {cat}
              </span>
              <span className="ml-auto opacity-0 group-hover:opacity-100">
                <Plus className="h-3.5 w-3.5" />
              </span>
            </button>
            <ul className="mb-2 space-y-px px-2">
              {items.map((c) => {
                const isActive =
                  c.id === activeChannelId &&
                  (page === 'channels' || (page === 'lobby' && c.id === 'lobby-th08'));
                return (
                  <li key={c.id}>
                    <button
                      onClick={() => {
                        onSelectChannel(c.id);
                        // lobby-th08 means stay on lobby page; others jump to channels
                        if (c.id === 'lobby-th08') onNavigate('lobby');
                        else onNavigate('channels');
                      }}
                      className={cn(
                        'group flex h-8 w-full items-center gap-1.5 rounded-md px-2 text-[14px] transition-colors',
                        isActive
                          ? 'bg-active text-header'
                          : c.unread
                            ? 'text-header hover:bg-hover'
                            : 'text-muted hover:bg-hover hover:text-body',
                      )}
                    >
                      <Hash className="h-[18px] w-[18px] shrink-0 opacity-60" />
                      <span className="flex-1 truncate text-left">{c.name}</span>
                      {c.unread ? (
                        <span className="grid h-4 min-w-4 place-items-center rounded-full bg-danger px-1 font-mono text-[10px] font-bold text-white">
                          {c.unread}
                        </span>
                      ) : null}
                      {c.mention ? (
                        <span className="h-2 w-2 rounded-full bg-danger" />
                      ) : null}
                    </button>
                  </li>
                );
              })}
            </ul>
          </Fragment>
        ))}

        {/* Voice section placeholder — disabled in v1 */}
        <div className="mt-2 px-2 opacity-40">
          <div className="flex h-6 items-center gap-1 text-muted">
            <ChevronDown className="h-3 w-3" />
            <span className="text-[10.5px] font-bold uppercase tracking-wider">
              VOICE — V2
            </span>
          </div>
          <div className="mt-1 flex h-8 items-center gap-1.5 rounded-md px-2 text-[14px] text-muted">
            <Volume2 className="h-[18px] w-[18px] opacity-50" />
            <span>语音 (Coming soon)</span>
          </div>
        </div>
      </nav>

      <UserPanel />
    </aside>
  );
}

/** Discord's Friends "Home" sidebar — different shape from server sidebar */
function FriendsSidebar() {
  const items = [
    { id: 'friends', label: 'Friends', icon: '👥' },
    { id: 'nitro', label: 'Nitro', icon: '🎁', disabled: true },
    { id: 'shop', label: 'Shop', icon: '🛒', disabled: true },
  ];
  const dms = [
    { id: 'youmu', name: '幽幽子', last: '我五分钟到', unread: 1 },
    { id: 'marisa', name: '魔理沙', last: '稳，先来一把', unread: 0 },
    { id: 'sakuya', name: '咲夜', last: '我开了一桌，进来吧', unread: 2 },
    { id: 'reimu', name: '灵梦', last: 'Score-attack 一会儿开桌', unread: 0 },
  ];

  return (
    <aside className="flex w-[240px] flex-col bg-sidebar shrink-0">
      <header className="flex h-12 items-center px-4 shadow-sm border-b border-floating/40">
        <div className="flex h-7 w-full items-center gap-1.5 rounded bg-input px-2 text-[12.5px] text-muted">
          <Search className="h-3.5 w-3.5" />
          <span>Find or start a conversation</span>
        </div>
      </header>

      <nav className="px-2 pt-2 space-y-px">
        {items.map((it) => (
          <button
            key={it.id}
            disabled={it.disabled}
            className={cn(
              'flex h-9 w-full items-center gap-2 rounded-md px-2 text-[14px] transition-colors',
              it.disabled
                ? 'cursor-not-allowed text-muted/50'
                : 'text-muted hover:bg-hover hover:text-header',
            )}
          >
            <span className="text-[16px]">{it.icon}</span>
            <span className="flex-1 text-left">{it.label}</span>
          </button>
        ))}
      </nav>

      <div className="mt-2 flex items-center justify-between px-3">
        <span className="text-[10.5px] font-bold uppercase tracking-wider text-muted">
          Direct Messages
        </span>
        <button className="text-muted hover:text-header">
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>

      <ul className="flex-1 overflow-y-auto px-2 pt-1 space-y-px">
        {dms.map((d) => (
          <li key={d.id}>
            <button className="group flex h-11 w-full items-center gap-2.5 rounded-md px-2 text-left transition-colors hover:bg-hover">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-gradient-to-br from-violet-400 to-violet-700 text-[12px] font-bold text-white">
                {d.name[0]}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-1">
                  <span className="truncate text-[14px] font-semibold text-header">
                    {d.name}
                  </span>
                </div>
                <div className="truncate text-[12px] text-muted">{d.last}</div>
              </div>
              {d.unread > 0 ? (
                <span className="grid h-4 min-w-4 place-items-center rounded-full bg-danger px-1 font-mono text-[10px] font-bold text-white">
                  {d.unread}
                </span>
              ) : null}
            </button>
          </li>
        ))}
      </ul>

      <UserPanel />
    </aside>
  );
}
