import { useState } from 'react';
import { ServerRail } from '@/components/app/server-rail';
import { Sidebar } from '@/components/app/sidebar';
import { MembersRail } from '@/components/app/members-rail';
import { LobbyPage } from '@/pages/lobby';
import { RoomPage } from '@/pages/room';
import { ChannelsPage } from '@/pages/channels';
import { FriendsPage } from '@/pages/friends';
import { SettingsPage } from '@/pages/settings';
import type { Page } from '@/types';

export type { Page } from '@/types';

export default function App() {
  const [page, setPage] = useState<Page>('lobby');
  const [activeChannelId, setActiveChannelId] = useState('lobby-th08');

  // Settings is a full-screen takeover — no rail/sidebar
  if (page === 'settings') {
    return <SettingsPage onClose={() => setPage('lobby')} />;
  }

  const showMembers = page === 'lobby' || page === 'channels';

  return (
    <div className="flex h-full bg-content text-body">
      <ServerRail page={page} onNavigate={setPage} />
      <Sidebar
        page={page}
        onNavigate={setPage}
        activeChannelId={activeChannelId}
        onSelectChannel={setActiveChannelId}
      />
      <main className="flex flex-1 flex-col min-w-0 bg-content">
        {page === 'lobby' && <LobbyPage onOpenRoom={() => setPage('room')} />}
        {page === 'room' && <RoomPage onLeave={() => setPage('lobby')} />}
        {page === 'channels' && <ChannelsPage channelId={activeChannelId} />}
        {page === 'friends' && <FriendsPage />}
      </main>
      {showMembers && <MembersRail />}
    </div>
  );
}
