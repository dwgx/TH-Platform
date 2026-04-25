import { useState } from 'react';
import { MessageCircle, MoreVertical, UserPlus, Users } from 'lucide-react';
import { friends } from '@/data/mock';
import type { Friend, FriendStatus } from '@/types';
import { cn } from '@/lib/utils';

const TABS = ['Online', 'All', 'Pending', 'Blocked', 'Add Friend'] as const;
type Tab = (typeof TABS)[number];

export function FriendsPage() {
  const [tab, setTab] = useState<Tab>('Online');

  return (
    <div className="flex flex-1 flex-col min-h-0">
      {/* Discord Friends header — distinctive: Users icon + Friends + tabs row */}
      <header className="flex h-12 items-center gap-4 border-b border-floating/40 bg-content px-4 shadow-sm shrink-0">
        <div className="flex items-center gap-2 text-header">
          <Users className="h-5 w-5 text-muted" />
          <span className="text-[15px] font-semibold">Friends</span>
        </div>
        <span className="h-5 w-px bg-floating/60" />
        <nav className="flex items-center gap-1.5">
          {TABS.map((t) => {
            const isAdd = t === 'Add Friend';
            return (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={cn(
                  'h-7 rounded px-2.5 text-[13.5px] font-medium transition-colors',
                  isAdd
                    ? tab === t
                      ? 'bg-success/20 text-success'
                      : 'bg-success/15 text-success hover:bg-success/20'
                    : tab === t
                      ? 'bg-active text-header'
                      : 'text-muted hover:bg-hover hover:text-header',
                )}
              >
                {t}
              </button>
            );
          })}
        </nav>
      </header>

      <div className="flex-1 overflow-y-auto px-8 py-5">
        {tab === 'Add Friend' ? <AddFriendPanel /> : <FriendsList tab={tab} />}
      </div>
    </div>
  );
}

function FriendsList({ tab }: { tab: Tab }) {
  const list = filterFriends(friends, tab);
  const counts: Record<string, number> = {
    Online: friends.filter((f) => f.status === 'online' || f.status === 'idle' || f.status === 'dnd').length,
    All: friends.length,
    Pending: 2,
    Blocked: 0,
  };

  return (
    <>
      <div className="mb-3 flex items-center justify-between">
        <input
          placeholder="Search"
          className="h-7 w-full max-w-md rounded bg-input px-3 text-[13.5px] text-body placeholder:text-muted outline-none"
        />
      </div>
      <div className="text-[12px] font-bold uppercase tracking-wider text-muted">
        {tab} — {counts[tab] ?? list.length}
      </div>

      {list.length === 0 ? (
        <div className="mt-12 flex flex-col items-center justify-center gap-3 text-muted">
          <Users className="h-16 w-16 opacity-30" />
          <p className="text-[14px]">No-one in this list yet.</p>
        </div>
      ) : (
        <ul className="mt-1 divide-y divide-floating/30">
          {list.map((f) => (
            <FriendRow key={f.id} friend={f} />
          ))}
        </ul>
      )}
    </>
  );
}

function FriendRow({ friend }: { friend: Friend }) {
  return (
    <li className="group flex items-center gap-3 rounded px-2 py-2.5 transition-colors hover:bg-hover">
      <span className="relative h-8 w-8 shrink-0">
        <span className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-violet-500 to-violet-700 text-[13px] font-bold text-white">
          {friend.name[0]}
        </span>
        <span
          className={cn(
            'absolute -right-0.5 -bottom-0.5 h-3 w-3 rounded-full ring-2 ring-content',
            friend.status === 'online' && 'bg-success',
            friend.status === 'idle' && 'bg-warning',
            friend.status === 'dnd' && 'bg-danger',
            friend.status === 'offline' && 'bg-muted',
          )}
        />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="text-[14.5px] font-semibold text-header">{friend.name}</span>
          <span className="font-mono text-[11.5px] text-muted">@{friend.handle}</span>
        </div>
        <div className="text-[12.5px] text-muted">
          {friend.activity ?? statusLabel(friend.status)}
        </div>
      </div>
      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100">
        <button
          aria-label="Message"
          className="grid h-9 w-9 place-items-center rounded-full bg-floating/40 text-muted transition-colors hover:bg-hover hover:text-header"
        >
          <MessageCircle className="h-4 w-4" />
        </button>
        <button
          aria-label="More"
          className="grid h-9 w-9 place-items-center rounded-full bg-floating/40 text-muted transition-colors hover:bg-hover hover:text-header"
        >
          <MoreVertical className="h-4 w-4" />
        </button>
      </div>
    </li>
  );
}

function AddFriendPanel() {
  return (
    <div>
      <h2 className="text-[16px] font-bold uppercase tracking-wider text-header">
        Add Friend
      </h2>
      <p className="mt-1 text-[13.5px] text-muted">
        You can add friends with their TH-Platform username + UID.
      </p>
      <div className="mt-4 flex h-12 items-center gap-2 rounded border border-floating/60 bg-input px-4 focus-within:border-brand">
        <UserPlus className="h-5 w-5 text-muted" />
        <input
          placeholder="username#0000"
          className="flex-1 bg-transparent text-[14px] outline-none placeholder:text-muted"
        />
        <button className="h-8 rounded bg-brand px-4 text-[13px] font-medium text-brand-foreground transition-colors hover:bg-brand-hover">
          Send Friend Request
        </button>
      </div>
    </div>
  );
}

function filterFriends(list: Friend[], tab: Tab): Friend[] {
  if (tab === 'Online') return list.filter((f) => f.status !== 'offline');
  if (tab === 'All') return list;
  return [];
}

function statusLabel(s: FriendStatus): string {
  return s === 'online' ? 'Online' : s === 'idle' ? 'Idle' : s === 'dnd' ? 'Do not disturb' : 'Offline';
}
