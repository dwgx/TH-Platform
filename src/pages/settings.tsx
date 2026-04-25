import { useState } from 'react';
import {
  Bell,
  Brush,
  HelpCircle,
  Keyboard,
  Languages,
  LogOut,
  Mic,
  Network,
  ShieldCheck,
  Sparkles,
  User,
  Wrench,
  X,
} from 'lucide-react';
import { useTheme, type Theme } from '@/lib/theme';
import { cn } from '@/lib/utils';

const groups = [
  {
    title: 'USER SETTINGS',
    items: [
      { id: 'account', label: 'My Account', icon: User },
      { id: 'profile', label: 'Profile', icon: Sparkles },
      { id: 'privacy', label: 'Privacy & Safety', icon: ShieldCheck },
    ],
  },
  {
    title: 'APP SETTINGS',
    items: [
      { id: 'appearance', label: 'Appearance', icon: Brush },
      { id: 'notifications', label: 'Notifications', icon: Bell },
      { id: 'voice', label: 'Voice & Video', icon: Mic },
      { id: 'keybinds', label: 'Keybinds', icon: Keyboard },
      { id: 'language', label: 'Language', icon: Languages },
    ],
  },
  {
    title: 'TH-PLATFORM',
    items: [
      { id: 'injector', label: 'Injector', icon: Wrench },
      { id: 'network', label: 'Network', icon: Network },
      { id: 'about', label: 'About', icon: HelpCircle },
    ],
  },
] as const;

type SectionId = (typeof groups)[number]['items'][number]['id'];

interface SettingsPageProps {
  onClose: () => void;
}

export function SettingsPage({ onClose }: SettingsPageProps) {
  const [section, setSection] = useState<SectionId>('appearance');

  return (
    <div className="flex h-full bg-content">
      {/* Left rail — Discord settings sidebar */}
      <aside className="flex w-[218px] flex-col bg-sidebar">
        <div className="flex-1 overflow-y-auto pl-5 pr-2 pt-14">
          {groups.map((g) => (
            <section key={g.title} className="mb-4">
              <h3 className="mb-1 px-2 text-[10.5px] font-bold uppercase tracking-wider text-muted">
                {g.title}
              </h3>
              <ul className="space-y-px">
                {g.items.map((it) => {
                  const Icon = it.icon;
                  const active = section === it.id;
                  return (
                    <li key={it.id}>
                      <button
                        onClick={() => setSection(it.id)}
                        className={cn(
                          'flex h-8 w-full items-center gap-2 rounded px-2 text-[14px] transition-colors',
                          active
                            ? 'bg-active text-header'
                            : 'text-muted hover:bg-hover hover:text-body',
                        )}
                      >
                        <Icon className="h-4 w-4" />
                        {it.label}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
          <hr className="my-2 border-floating/40" />
          <button className="flex h-8 w-full items-center gap-2 rounded px-2 text-[14px] text-muted transition-colors hover:bg-hover hover:text-danger">
            <LogOut className="h-4 w-4" />
            Log Out
          </button>
          <p className="mt-3 px-2 font-mono text-[10px] text-muted">
            Build alpha · 2026.04.26 · v0.4.0
          </p>
        </div>
      </aside>

      {/* Right content area */}
      <main className="relative flex-1 overflow-y-auto bg-content pt-14">
        <div className="mx-auto max-w-[740px] px-10 pb-20">
          {section === 'account' && <AccountSection />}
          {section === 'profile' && <ProfileSection />}
          {section === 'privacy' && <Placeholder title="Privacy & Safety" />}
          {section === 'appearance' && <AppearanceSection />}
          {section === 'notifications' && <Placeholder title="Notifications" />}
          {section === 'voice' && <Placeholder title="Voice & Video" note="Voice arrives in v2 — text-only for now." />}
          {section === 'keybinds' && <KeybindsSection />}
          {section === 'language' && <LanguageSection />}
          {section === 'injector' && <InjectorSection />}
          {section === 'network' && <Placeholder title="Network" />}
          {section === 'about' && <AboutSection />}
        </div>

        {/* Top-right ESC pill */}
        <button
          onClick={onClose}
          className="fixed right-12 top-12 flex flex-col items-center gap-1 text-muted transition-colors hover:text-header"
          aria-label="Close settings"
        >
          <span className="grid h-9 w-9 place-items-center rounded-full border-2 border-current">
            <X className="h-4 w-4" />
          </span>
          <span className="font-mono text-[11px] font-bold">ESC</span>
        </button>
      </main>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h1 className="mb-5 text-[20px] font-bold tracking-tight text-header">
      {children}
    </h1>
  );
}

function FieldGroup({
  title,
  hint,
  children,
}: {
  title?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-5">
      {title ? (
        <h3 className="mb-2 text-[12px] font-bold uppercase tracking-wider text-muted">
          {title}
        </h3>
      ) : null}
      <div className="rounded bg-floating/40 p-4">{children}</div>
      {hint ? <p className="mt-2 text-[12.5px] text-muted">{hint}</p> : null}
    </div>
  );
}

function Row({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-floating/30 py-3 last:border-b-0">
      <div>
        <div className="text-[14px] font-semibold text-header">{label}</div>
        {hint ? <div className="mt-0.5 text-[12.5px] text-muted">{hint}</div> : null}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

/* ------- Sections ------- */

function AccountSection() {
  return (
    <>
      <SectionTitle>My Account</SectionTitle>
      <FieldGroup>
        <Row label="Display name" hint="Shown to other players.">
          <Input value="dwgx" />
        </Row>
        <Row label="Handle" hint="Used in @mentions.">
          <Input value="dwgx" mono />
        </Row>
        <Row label="UID" hint="Permanent. Cannot be changed.">
          <Input value="100029481" mono readOnly />
        </Row>
        <Row label="Email" hint="Used for password resets.">
          <Input value="dwgx1337@outlook.com" />
        </Row>
      </FieldGroup>

      <h3 className="mb-2 text-[12px] font-bold uppercase tracking-wider text-muted">
        Password and Authentication
      </h3>
      <button className="h-8 rounded bg-brand px-3 text-[13px] font-medium text-brand-foreground transition-colors hover:bg-brand-hover">
        Change Password
      </button>
    </>
  );
}

function ProfileSection() {
  return (
    <>
      <SectionTitle>Profile</SectionTitle>
      <FieldGroup>
        <Row label="About me" hint="Anything you want others to know.">
          <Input value="" placeholder="Tell people about yourself…" />
        </Row>
        <Row label="Banner color" hint="Generated from UID by default.">
          <span className="h-7 w-12 rounded bg-gradient-to-br from-violet-500 to-violet-700" />
        </Row>
      </FieldGroup>
    </>
  );
}

function AppearanceSection() {
  const { theme, setTheme } = useTheme();
  const opts: { id: Theme; label: string }[] = [
    { id: 'light', label: 'Light' },
    { id: 'dark', label: 'Dark' },
    { id: 'system', label: 'Sync with computer' },
  ];
  return (
    <>
      <SectionTitle>Appearance</SectionTitle>
      <FieldGroup
        title="Theme"
        hint="Affects how TH-Platform looks across all pages."
      >
        <div className="grid grid-cols-3 gap-3">
          {opts.map((o) => (
            <button
              key={o.id}
              onClick={() => setTheme(o.id)}
              className={cn(
                'overflow-hidden rounded text-left transition-all',
                theme === o.id ? 'ring-2 ring-brand' : 'ring-1 ring-floating/40 hover:ring-brand/50',
              )}
            >
              <ThemePreview kind={o.id} />
              <div className="bg-floating/40 px-3 py-2 text-[13px] font-semibold text-header">
                {o.label}
              </div>
            </button>
          ))}
        </div>
      </FieldGroup>

      <FieldGroup title="Density">
        <Row label="Compact mode" hint="Reduces row height across chat and lists.">
          <Toggle />
        </Row>
        <Row label="Reduce motion" hint="Disables animations across the app.">
          <Toggle />
        </Row>
      </FieldGroup>
    </>
  );
}

function ThemePreview({ kind }: { kind: Theme }) {
  const isDark =
    kind === 'dark' ||
    (kind === 'system' &&
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches);
  const rail = isDark ? '#1E1F22' : '#DCDEE3';
  const sidebar = isDark ? '#2B2D31' : '#F2F3F5';
  const content = isDark ? '#313338' : '#FFFFFF';
  const dim = isDark ? '#404249' : '#D7D9DD';
  return (
    <div style={{ background: content, height: 88 }} className="flex">
      <div style={{ background: rail, width: 14 }}>
        <div className="m-1 h-2 w-2 rounded-full bg-brand" />
        <div style={{ background: dim }} className="m-1 h-2 w-2 rounded-full" />
        <div style={{ background: dim }} className="m-1 h-2 w-2 rounded-full" />
      </div>
      <div style={{ background: sidebar, width: 36 }} className="p-1 space-y-1">
        <div style={{ background: dim }} className="h-1.5 w-12 rounded" />
        <div style={{ background: dim }} className="h-1.5 w-9 rounded" />
        <div style={{ background: dim }} className="h-1.5 w-10 rounded" />
        <div className="h-1.5 w-12 rounded bg-brand/60" />
      </div>
      <div className="flex-1 p-2">
        <div style={{ background: dim }} className="h-2 w-3/4 rounded" />
        <div style={{ background: dim }} className="mt-1 h-1.5 w-1/2 rounded" />
        <div className="mt-3 grid grid-cols-2 gap-1">
          <div style={{ background: dim }} className="h-3 rounded" />
          <div style={{ background: dim }} className="h-3 rounded" />
        </div>
      </div>
    </div>
  );
}

function KeybindsSection() {
  const binds = [
    { action: 'Push to talk (V2)', combo: 'Right Ctrl' },
    { action: 'Toggle deafen', combo: 'Ctrl + Shift + D' },
    { action: 'Toggle mute (V2)', combo: 'Ctrl + Shift + M' },
    { action: 'Quick switch channel', combo: 'Ctrl + K' },
    { action: 'Open settings', combo: 'Ctrl + ,' },
  ];
  return (
    <>
      <SectionTitle>Keybinds</SectionTitle>
      <FieldGroup>
        {binds.map((b) => (
          <Row key={b.action} label={b.action}>
            <kbd className="rounded bg-floating/60 px-2 py-1 font-mono text-[11.5px] text-body">
              {b.combo}
            </kbd>
          </Row>
        ))}
      </FieldGroup>
    </>
  );
}

function LanguageSection() {
  const langs = [
    { id: 'zh-CN', label: '简体中文', sub: 'Default' },
    { id: 'zh-TW', label: '繁體中文', sub: 'Coming soon' },
    { id: 'ja',    label: '日本語',    sub: 'Coming soon' },
    { id: 'en',    label: 'English',  sub: 'Coming soon' },
  ];
  return (
    <>
      <SectionTitle>Language</SectionTitle>
      <FieldGroup>
        {langs.map((l) => (
          <Row key={l.id} label={l.label} hint={l.sub}>
            <input
              type="radio"
              name="lang"
              defaultChecked={l.id === 'zh-CN'}
              disabled={l.id !== 'zh-CN'}
              className="h-4 w-4 accent-brand"
            />
          </Row>
        ))}
      </FieldGroup>
    </>
  );
}

function InjectorSection() {
  return (
    <>
      <SectionTitle>Injector</SectionTitle>
      <FieldGroup hint="The DLL injects into your local TH08.exe to enable cross-platform multiplayer. No game files are modified on disk.">
        <Row label="TH08.exe path">
          <Input
            value="D:\\Steam\\steamapps\\common\\th08\\th08.exe"
            mono
            className="w-[320px]"
          />
        </Row>
        <Row label="DLL version">
          <span className="font-mono text-[12.5px] text-body">v0.0.1 (alpha)</span>
        </Row>
        <Row label="Last injection">
          <span className="font-mono text-[12px] text-muted">2026-04-25 21:14:33</span>
        </Row>
        <Row label="Status">
          <span className="flex items-center gap-1.5 font-mono text-[12.5px] text-success">
            <span className="h-1.5 w-1.5 rounded-full bg-success" />
            Detected
          </span>
        </Row>
      </FieldGroup>
      <button className="h-8 rounded bg-brand px-3 text-[13px] font-medium text-brand-foreground transition-colors hover:bg-brand-hover">
        Test injection
      </button>
    </>
  );
}

function AboutSection() {
  return (
    <>
      <SectionTitle>About</SectionTitle>
      <FieldGroup>
        <Row label="App version" hint="TH-Platform desktop client">
          <span className="font-mono text-[12.5px] text-body">v0.4.0 alpha</span>
        </Row>
        <Row label="DLL version">
          <span className="font-mono text-[12.5px] text-body">v0.0.1 alpha</span>
        </Row>
        <Row label="Repository">
          <a
            href="https://github.com/dwgx/TH-Platform"
            className="text-link hover:underline"
            target="_blank"
            rel="noreferrer"
          >
            github.com/dwgx/TH-Platform
          </a>
        </Row>
        <Row label="Built">
          <span className="font-mono text-[12.5px] text-muted">2026.04.26</span>
        </Row>
      </FieldGroup>
      <p className="text-[12.5px] text-muted">
        Third-party multiplayer / matchmaking platform for the Touhou Project
        shoot-em-up games. Not affiliated with ZUN / Team Shanghai Alice.
      </p>
    </>
  );
}

function Placeholder({ title, note }: { title: string; note?: string }) {
  return (
    <>
      <SectionTitle>{title}</SectionTitle>
      <div className="rounded border border-dashed border-floating/60 bg-floating/20 px-6 py-12 text-center text-[13.5px] text-muted">
        {note ?? 'Coming in a later iteration.'}
      </div>
    </>
  );
}

function Input({
  value,
  placeholder,
  mono,
  readOnly,
  className,
}: {
  value?: string;
  placeholder?: string;
  mono?: boolean;
  readOnly?: boolean;
  className?: string;
}) {
  return (
    <input
      defaultValue={value}
      placeholder={placeholder}
      readOnly={readOnly}
      className={cn(
        'h-8 rounded bg-input px-3 text-[13.5px] text-body outline-none',
        mono && 'font-mono text-[12.5px]',
        className ?? 'w-[260px]',
      )}
    />
  );
}

function Toggle() {
  const [on, setOn] = useState(false);
  return (
    <button
      onClick={() => setOn(!on)}
      className={cn(
        'relative h-6 w-10 rounded-full transition-colors',
        on ? 'bg-success' : 'bg-floating/60',
      )}
      role="switch"
      aria-checked={on}
    >
      <span
        className={cn(
          'absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform',
          on ? 'translate-x-4' : 'translate-x-0.5',
        )}
      />
    </button>
  );
}
