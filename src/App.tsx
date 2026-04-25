import { useState } from 'react';
import { TitleBar } from '@/components/app/title-bar';
import { Rail } from '@/components/app/rail';
import { ChatRail } from '@/components/app/chat-rail';
import { StatusBar } from '@/components/app/status-bar';
import { LobbyPage } from '@/pages/lobby';
import { RoomPage } from '@/pages/room';
import { SettingsPage } from '@/pages/settings';

export type Page = 'lobby' | 'room' | 'channels' | 'friends' | 'settings';

export default function App() {
  const [page, setPage] = useState<Page>('lobby');
  const [chatCollapsed, setChatCollapsed] = useState(false);

  return (
    <div className="flex h-full flex-col">
      <TitleBar page={page} onNavigate={setPage} />

      <div className="flex flex-1 min-h-0 overflow-hidden">
        <Rail page={page} onNavigate={setPage} />

        {/* Page slot */}
        {page === 'lobby' && <LobbyPage />}
        {page === 'room' && <RoomPage onNavigate={setPage} />}
        {page === 'settings' && <SettingsPage />}
        {page === 'channels' && (
          <PlaceholderPage
            title="Channels"
            sub="Friend circles + community groups land here in v0.2."
          />
        )}
        {page === 'friends' && (
          <PlaceholderPage
            title="Friends"
            sub="Direct messages and friend management land here in v0.2."
          />
        )}

        {page === 'lobby' && (
          <ChatRail
            collapsed={chatCollapsed}
            onToggle={() => setChatCollapsed((c) => !c)}
          />
        )}
      </div>

      <StatusBar />
    </div>
  );
}

function PlaceholderPage({ title, sub }: { title: string; sub: string }) {
  return (
    <div className="flex flex-1 items-center justify-center bg-background">
      <div className="text-center">
        <h1 className="text-[24px] font-bold tracking-tight">{title}</h1>
        <p className="mt-2 max-w-md text-[13px] text-muted-foreground">{sub}</p>
      </div>
    </div>
  );
}
