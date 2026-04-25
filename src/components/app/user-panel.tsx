import { Headphones, Mic, Settings as SettingsIcon } from 'lucide-react';
import { myDisplayName, myHandle, myUid } from '@/data/mock';

/**
 * Bottom of the sidebar. Discord pattern: avatar + display-name (with handle
 * tinybar) + 3 small icon buttons (mute / deafen / settings).
 */
export function UserPanel() {
  return (
    <footer className="flex h-13 items-center gap-2 bg-floating/40 px-2 py-1.5">
      <button className="flex flex-1 min-w-0 items-center gap-2 rounded-md px-1.5 py-1 transition-colors hover:bg-hover">
        <span className="relative h-8 w-8 shrink-0">
          <span className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-violet-500 to-violet-700 text-[13px] font-bold text-white">
            {myDisplayName[0]?.toUpperCase()}
          </span>
          <span className="absolute -right-0.5 -bottom-0.5 h-3 w-3 rounded-full bg-success ring-2 ring-floating/40" />
        </span>
        <div className="min-w-0 text-left">
          <div className="truncate text-[13px] font-semibold text-header leading-tight">
            {myDisplayName}
          </div>
          <div className="truncate font-mono text-[10.5px] text-muted leading-tight">
            #{myUid.slice(-4)} · @{myHandle}
          </div>
        </div>
      </button>
      <div className="flex items-center">
        <IconBtn label="Mute"><Mic className="h-4 w-4" /></IconBtn>
        <IconBtn label="Deafen"><Headphones className="h-4 w-4" /></IconBtn>
        <IconBtn label="Settings"><SettingsIcon className="h-4 w-4" /></IconBtn>
      </div>
    </footer>
  );
}

function IconBtn({
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
