import { friends } from '@/data/mock';
import type { Friend, FriendStatus } from '@/types';
import { cn } from '@/lib/utils';

const ROLES: { id: FriendStatus | 'host'; label: string }[] = [
  { id: 'host', label: 'HOST — 1' },
  { id: 'online', label: 'ONLINE' },
  { id: 'idle', label: 'IDLE' },
  { id: 'dnd', label: 'DO NOT DISTURB' },
  { id: 'offline', label: 'OFFLINE' },
];

export function MembersRail() {
  // Group friends by status
  const groups: Record<string, Friend[]> = {
    host: [friends[0]],
    online: friends.filter((f) => f.status === 'online' && f.id !== 'f1'),
    idle: friends.filter((f) => f.status === 'idle'),
    dnd: friends.filter((f) => f.status === 'dnd'),
    offline: friends.filter((f) => f.status === 'offline'),
  };

  return (
    <aside className="hidden w-[240px] flex-col bg-members shrink-0 lg:flex">
      <div className="flex-1 overflow-y-auto px-2 py-3">
        {ROLES.map((role) => {
          const list = groups[role.id] ?? [];
          if (list.length === 0) return null;
          return (
            <section key={role.id} className="mb-3">
              <h3 className="px-2 pb-1 text-[10.5px] font-bold uppercase tracking-wider text-muted">
                {role.label.includes('—') ? role.label : `${role.label} — ${list.length}`}
              </h3>
              <ul className="space-y-px">
                {list.map((f) => (
                  <li key={f.id}>
                    <MemberRow friend={f} highlight={role.id === 'host'} />
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>
    </aside>
  );
}

function MemberRow({ friend, highlight }: { friend: Friend; highlight?: boolean }) {
  const dimmed = friend.status === 'offline';
  return (
    <button
      className={cn(
        'group flex h-11 w-full items-center gap-2.5 rounded-md px-2 transition-colors hover:bg-hover',
        dimmed && 'opacity-40',
      )}
    >
      <span className="relative h-8 w-8 shrink-0">
        <span
          className={cn(
            'grid h-8 w-8 place-items-center rounded-full text-[13px] font-bold text-white',
            'bg-gradient-to-br',
            highlight ? 'from-amber-400 to-amber-600' : 'from-violet-500 to-violet-700',
          )}
        >
          {friend.name[0]}
        </span>
        <span
          className={cn(
            'absolute -right-0.5 -bottom-0.5 h-3 w-3 rounded-full ring-2 ring-members',
            friend.status === 'online' && 'bg-success',
            friend.status === 'idle' && 'bg-warning',
            friend.status === 'dnd' && 'bg-danger',
            friend.status === 'offline' && 'bg-muted',
          )}
        />
      </span>
      <div className="min-w-0 flex-1 text-left">
        <div className="flex items-center gap-1">
          <span className="truncate text-[14px] font-medium text-body">{friend.name}</span>
          {highlight ? (
            <span className="font-mono text-[10px] text-warning" title="Host">
              👑
            </span>
          ) : null}
        </div>
        {friend.activity ? (
          <div className="truncate text-[11.5px] text-muted">{friend.activity}</div>
        ) : null}
      </div>
    </button>
  );
}
