import { Plus, Smile } from 'lucide-react';
import { ChannelHeader } from '@/pages/lobby';
import { channels, lobbyChat } from '@/data/mock';
import { cn } from '@/lib/utils';

interface ChannelsPageProps {
  channelId: string;
}

export function ChannelsPage({ channelId }: ChannelsPageProps) {
  const channel = channels.find((c) => c.id === channelId) ?? channels[0];

  return (
    <div className="flex flex-1 flex-col min-h-0">
      <ChannelHeader
        name={channel.name}
        topic={
          channel.id === 'announcements'
            ? '官方公告与版本更新'
            : channel.id === 'rules'
              ? '社区准则、举报方式与封禁规则'
              : channel.id === 'general'
                ? '随便聊点东方相关的话题'
                : channel.id === 'spell-cards'
                  ? '聊符卡 / 同人 / Lunatic Spell 攻略'
                  : '联机房间公告 + 队友招募'
        }
      />

      <div className="flex flex-1 min-h-0 flex-col">
        <div className="flex-1 overflow-y-auto px-4 py-4">
          <ul className="space-y-3">
            {lobbyChat
              .filter((m) => !m.system)
              .map((m) => (
                <li key={m.id}>
                  <div className={cn(
                    'group -mx-2 rounded px-2 py-1 hover:bg-hover/60',
                    m.hasMention && 'bg-brand/[0.08] border-l-2 border-brand',
                  )}>
                    <div className="flex items-baseline gap-2">
                      <span className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-violet-500 to-violet-700 text-[14px] font-bold text-white">
                        {m.author![0]}
                      </span>
                      <span className="text-[15px] font-semibold text-header">{m.author}</span>
                      <span className="font-mono text-[11px] text-muted">{m.time}</span>
                    </div>
                    <div
                      className="ml-11 -mt-0.5 text-[14.5px] text-body break-words leading-relaxed"
                      dangerouslySetInnerHTML={{
                        __html: (m.text ?? '').replace(
                          /(@\w+)/g,
                          '<span class="rounded bg-brand/15 px-1 font-medium text-brand">$1</span>',
                        ),
                      }}
                    />
                  </div>
                </li>
              ))}
          </ul>
        </div>

        {/* Composer — Discord pattern: rounded-md, plus icon left, emoji right */}
        <div className="px-4 pb-5 pt-1">
          <div className="flex items-center gap-2 rounded bg-input px-3 py-2.5 text-[14.5px] text-body">
            <button className="text-muted hover:text-header">
              <Plus className="h-5 w-5" />
            </button>
            <input
              placeholder={`Message #${channel.name}`}
              className="flex-1 bg-transparent outline-none placeholder:text-muted"
            />
            <button className="text-muted hover:text-header">
              <Smile className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
